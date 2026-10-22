"""
CRISP Portable Credit Ledger Accounting System
Supports M0 (Per-thread cap), M1 (Per-cgroup atomic pool), and M2 (Quarantine accounting).
Strictly portable: works on Windows, macOS, and Linux with zero OS-specific dependencies.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Optional, Tuple


class MechanismStage(str, Enum):
    M0_PER_THREAD_CAP = "M0"
    M1_SHARED_POOL = "M1"
    M2_QUARANTINE = "M2"


class DeferralOutcome(str, Enum):
    GRANTED = "GRANTED"
    FALLBACK_NOT_IN_CS = "FALLBACK_NOT_IN_CS"
    FALLBACK_CAP_EXCEEDED = "FALLBACK_CAP_EXCEEDED"
    FALLBACK_POOL_EXHAUSTED = "FALLBACK_POOL_EXHAUSTED"


@dataclass
class ThreadDebtRecord:
    thread_id: str
    active_pages: int = 0
    settling_pages: int = 0
    quarantined_pages: int = 0
    total_deferred_lifetime: int = 0
    total_settled_lifetime: int = 0
    flag_in_critical_section: bool = False


@dataclass
class LedgerSnapshot:
    stage: MechanismStage
    pool_capacity: int
    available_credits: int
    active_obligations: int
    settling_obligations: int
    quarantined_obligations: int
    active_threads: int
    per_thread_cap: int
    invariant_valid: bool
    discrepancy: int = 0


class CrispCreditLedger:
    """
    Core Credit Ledger tracking deferred page reclaim obligations under memory.high.
    Guarantees strict credit conservation:
      pool_capacity == available + active + settling + quarantined
    """

    def __init__(
        self,
        stage: MechanismStage = MechanismStage.M0_PER_THREAD_CAP,
        per_thread_cap: int = 32,
        pool_capacity: int = 256,
    ):
        self.stage = stage
        self.per_thread_cap = per_thread_cap  # d_max
        self.pool_capacity = pool_capacity if stage != MechanismStage.M0_PER_THREAD_CAP else (per_thread_cap * 1024)

        # 4-State Credit Pool
        self.available_credits = self.pool_capacity
        self.active_obligations = 0
        self.settling_obligations = 0
        self.quarantined_obligations = 0

        # Thread states
        self.threads: Dict[str, ThreadDebtRecord] = {}

    def get_or_create_thread(self, thread_id: str) -> ThreadDebtRecord:
        if thread_id not in self.threads:
            self.threads[thread_id] = ThreadDebtRecord(thread_id=thread_id)
        return self.threads[thread_id]

    def set_critical_section_flag(self, thread_id: str, in_cs: bool) -> None:
        rec = self.get_or_create_thread(thread_id)
        rec.flag_in_critical_section = in_cs

    def request_deferral(
        self, thread_id: str, requested_pages: int
    ) -> Tuple[DeferralOutcome, int]:
        """
        Attempt to defer reclaim under memory.high.
        Returns (Outcome, pages_deferred).
        """
        if requested_pages <= 0:
            return DeferralOutcome.GRANTED, 0

        rec = self.get_or_create_thread(thread_id)

        # Rule 1: Must have flag set (be in critical section)
        if not rec.flag_in_critical_section:
            return DeferralOutcome.FALLBACK_NOT_IN_CS, 0

        # Rule 2: Per-thread cap check (M0/M1/M2)
        if rec.active_pages + requested_pages > self.per_thread_cap:
            return DeferralOutcome.FALLBACK_CAP_EXCEEDED, 0

        # Rule 3: Shared pool check (M1/M2)
        if self.stage in (MechanismStage.M1_SHARED_POOL, MechanismStage.M2_QUARANTINE):
            if self.available_credits < requested_pages:
                return DeferralOutcome.FALLBACK_POOL_EXHAUSTED, 0

        # Grant deferral: transfer from Available to Active
        pages = requested_pages
        self.available_credits -= pages
        self.active_obligations += pages

        rec.active_pages += pages
        rec.total_deferred_lifetime += pages

        return DeferralOutcome.GRANTED, pages

    def begin_settlement(self, thread_id: str, pages_to_settle: Optional[int] = None) -> int:
        """
        Transition active obligations to settling state upon lock release.
        """
        rec = self.get_or_create_thread(thread_id)
        amount = rec.active_pages if pages_to_settle is None else min(pages_to_settle, rec.active_pages)
        if amount <= 0:
            return 0

        rec.active_pages -= amount
        rec.settling_pages += amount

        self.active_obligations -= amount
        self.settling_obligations += amount
        return amount

    def complete_settlement(
        self, thread_id: str, pages_settled: int, reclaim_successful: bool = True
    ) -> Tuple[int, int]:
        """
        Complete settlement after reclaim attempts.
        If reclaim_successful: return credits to Available.
        If not successful and M2 active: move to Quarantined.
        Returns (pages_returned_to_available, pages_quarantined).
        """
        rec = self.get_or_create_thread(thread_id)
        actual = min(pages_settled, rec.settling_pages)
        if actual <= 0:
            return 0, 0

        rec.settling_pages -= actual
        self.settling_obligations -= actual

        if reclaim_successful:
            self.available_credits += actual
            rec.total_settled_lifetime += actual
            return actual, 0
        else:
            if self.stage == MechanismStage.M2_QUARANTINE:
                # Quarantined state prevents immediate credit recycling
                rec.quarantined_pages += actual
                self.quarantined_obligations += actual
                return 0, actual
            else:
                # Without quarantine, credit returns to available (M0/M1 behavior)
                self.available_credits += actual
                rec.total_settled_lifetime += actual
                return actual, 0

    def release_quarantine(self, thread_id: str, pages_to_release: Optional[int] = None) -> int:
        """
        Release quarantined credits once asynchronous or subsequent reclaim succeeds.
        """
        rec = self.get_or_create_thread(thread_id)
        actual = rec.quarantined_pages if pages_to_release is None else min(pages_to_release, rec.quarantined_pages)
        if actual <= 0:
            return 0

        rec.quarantined_pages -= actual
        self.quarantined_obligations -= actual
        self.available_credits += actual
        return actual

    def thread_exit(self, thread_id: str) -> Dict[str, int]:
        """
        Handle thread termination. Prevents credit leakage under thread churn (H5).
        Under M1/M2, active & settling credits are reconciled back to the pool.
        """
        if thread_id not in self.threads:
            return {"active_reconciled": 0, "settling_reconciled": 0, "quarantined_kept": 0}

        rec = self.threads[thread_id]
        active = rec.active_pages
        settling = rec.settling_pages
        quarantined = rec.quarantined_pages

        # Reconcile back to Available
        self.active_obligations -= active
        self.settling_obligations -= settling
        self.available_credits += (active + settling)

        rec.active_pages = 0
        rec.settling_pages = 0

        del self.threads[thread_id]

        return {
            "active_reconciled": active,
            "settling_reconciled": settling,
            "quarantined_kept": quarantined,
        }

    def verify_conservation_invariant(self) -> Tuple[bool, int]:
        """
        Invariant: available + active + settling + quarantined == pool_capacity
        Returns (is_valid, discrepancy)
        """
        current_sum = (
            self.available_credits
            + self.active_obligations
            + self.settling_obligations
            + self.quarantined_obligations
        )
        discrepancy = current_sum - self.pool_capacity
        return (discrepancy == 0, discrepancy)

    def snapshot(self) -> LedgerSnapshot:
        valid, disc = self.verify_conservation_invariant()
        return LedgerSnapshot(
            stage=self.stage,
            pool_capacity=self.pool_capacity,
            available_credits=self.available_credits,
            active_obligations=self.active_obligations,
            settling_obligations=self.settling_obligations,
            quarantined_obligations=self.quarantined_obligations,
            active_threads=len(self.threads),
            per_thread_cap=self.per_thread_cap,
            invariant_valid=valid,
            discrepancy=disc,
        )
