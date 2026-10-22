"""
CRISP Thread State Machine Automaton
Simulates and traces thread lifecycle transitions during lock acquisition,
memory over-high charge, deferral evaluation, unlock, and settlement.
Used by the frontend OS Mechanism Explorer.
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from model.accounting.credit_ledger import CrispCreditLedger, MechanismStage, DeferralOutcome


class ThreadState(str, Enum):
    IDLE = "IDLE"
    WAITING_FOR_LOCK = "WAITING_FOR_LOCK"
    IN_CRITICAL_SECTION = "IN_CRITICAL_SECTION"
    MEMORY_PRESSURE_DETECTED = "MEMORY_PRESSURE_DETECTED"
    EVALUATING_DEFERRAL = "EVALUATING_DEFERRAL"
    DEFERRAL_GRANTED = "DEFERRAL_GRANTED"
    FALLBACK_INLINE_THROTTLE = "FALLBACK_INLINE_THROTTLE"
    UNLOCKING = "UNLOCKING"
    SETTLEMENT_PENDING = "SETTLEMENT_PENDING"
    SETTLING_RECLAIM = "SETTLING_RECLAIM"
    QUARANTINED = "QUARANTINED"
    COMPLETED = "COMPLETED"


@dataclass
class TransitionEvent:
    step: int
    thread_id: str
    from_state: ThreadState
    to_state: ThreadState
    action: str
    ledger_state: Dict[str, Any]
    detail: str
    timestamp_virtual_us: int


class CrispThreadAutomaton:
    """
    Automaton simulating a single thread interacting with the CRISP deferral mechanism.
    """

    def __init__(
        self,
        thread_id: str,
        ledger: CrispCreditLedger,
        start_virtual_us: int = 0,
    ):
        self.thread_id = thread_id
        self.ledger = ledger
        self.state = ThreadState.IDLE
        self.history: List[TransitionEvent] = []
        self.virtual_clock_us = start_virtual_us
        self.step_counter = 0

    def _record_transition(
        self, to_state: ThreadState, action: str, detail: str, duration_us: int = 10
    ) -> None:
        from_st = self.state
        self.state = to_state
        self.virtual_clock_us += duration_us
        self.step_counter += 1

        snap = self.ledger.snapshot()
        self.history.append(
            TransitionEvent(
                step=self.step_counter,
                thread_id=self.thread_id,
                from_state=from_st,
                to_state=to_state,
                action=action,
                ledger_state={
                    "available": snap.available_credits,
                    "active": snap.active_obligations,
                    "settling": snap.settling_obligations,
                    "quarantined": snap.quarantined_obligations,
                    "invariant_valid": snap.invariant_valid,
                },
                detail=detail,
                timestamp_virtual_us=self.virtual_clock_us,
            )
        )

    def acquire_lock(self, wait_duration_us: int = 50) -> None:
        self._record_transition(
            ThreadState.WAITING_FOR_LOCK,
            action="pthread_mutex_lock",
            detail="Thread queued on shared mutex.",
            duration_us=wait_duration_us,
        )
        self.ledger.set_critical_section_flag(self.thread_id, in_cs=True)
        self._record_transition(
            ThreadState.IN_CRITICAL_SECTION,
            action="LOCK_ACQUIRED",
            detail="Lock acquired. User-space flag set: crisp_flag = 1.",
            duration_us=10,
        )

    def allocate_memory_under_pressure(
        self, pages_allocated: int = 16, overage_ratio: float = 0.05
    ) -> DeferralOutcome:
        self._record_transition(
            ThreadState.MEMORY_PRESSURE_DETECTED,
            action="PAGE_FAULT_CHARGE",
            detail=f"Allocated {pages_allocated} pages. Cgroup usage exceeds memory.high (overage: {round(overage_ratio*100, 1)}%).",
            duration_us=20,
        )

        self._record_transition(
            ThreadState.EVALUATING_DEFERRAL,
            action="mem_cgroup_handle_over_high",
            detail=f"Kernel checks crisp_flag and per-thread cap d_max ({self.ledger.per_thread_cap} pages).",
            duration_us=5,
        )

        outcome, granted_pages = self.ledger.request_deferral(self.thread_id, pages_allocated)

        if outcome == DeferralOutcome.GRANTED:
            self._record_transition(
                ThreadState.DEFERRAL_GRANTED,
                action="DEFER_RECLAIM",
                detail=f"Deferral granted! {granted_pages} pages added to thread debt. Skipping inline throttle sleep. Critical section continues without stall.",
                duration_us=15,
            )
        else:
            self._record_transition(
                ThreadState.FALLBACK_INLINE_THROTTLE,
                action="INLINE_FALLBACK",
                detail=f"Deferral denied ({outcome.value}). Falling back to synchronous direct reclaim and throttle sleep inside critical section!",
                duration_us=150000,  # 150ms stall inside lock!
            )

        return outcome

    def release_lock(self) -> None:
        self._record_transition(
            ThreadState.UNLOCKING,
            action="pthread_mutex_unlock",
            detail="Lock released! Other waiting threads may immediately acquire mutex. Clearing flag: crisp_flag = 0.",
            duration_us=10,
        )
        self.ledger.set_critical_section_flag(self.thread_id, in_cs=False)

        # Transition active debt to settling
        settling_amount = self.ledger.begin_settlement(self.thread_id)
        if settling_amount > 0:
            self._record_transition(
                ThreadState.SETTLEMENT_PENDING,
                action="RETURN_TO_USER_CHECK",
                detail=f"Kernel return-to-user mode callback detects {settling_amount} pages of deferred debt.",
                duration_us=5,
            )
        else:
            self._record_transition(
                ThreadState.COMPLETED,
                action="EXIT_NO_DEBT",
                detail="No deferred debt. Thread continues normal execution.",
                duration_us=5,
            )

    def execute_settlement(self, reclaim_successful: bool = True, penalty_ms: int = 50) -> None:
        rec = self.ledger.get_or_create_thread(self.thread_id)
        if rec.settling_pages <= 0:
            return

        pages_to_settle = rec.settling_pages
        self._record_transition(
            ThreadState.SETTLING_RECLAIM,
            action="ASYNC_SETTLEMENT",
            detail=f"Paying deferred debt outside critical section: executing {pages_to_settle} pages reclaim + {penalty_ms}ms throttle sleep.",
            duration_us=penalty_ms * 1000,
        )

        returned, quarantined = self.ledger.complete_settlement(
            self.thread_id, pages_to_settle, reclaim_successful=reclaim_successful
        )

        if quarantined > 0:
            self._record_transition(
                ThreadState.QUARANTINED,
                action="M2_QUARANTINE_ISOLATE",
                detail=f"Reclaim could not keep up. {quarantined} pages moved to quarantine pool to prevent credit reuse.",
                duration_us=20,
            )
        else:
            self._record_transition(
                ThreadState.COMPLETED,
                action="SETTLEMENT_COMPLETE",
                detail=f"Settlement complete! {returned} credits returned to available pool. Invariant strictly preserved.",
                duration_us=10,
            )
