"""
CRISP Formal Invariant Checker
Evaluates conservation, bounded overshoot, and safety properties across M0, M1, and M2.
"""

from typing import Dict, Any, List
from model.accounting.credit_ledger import CrispCreditLedger, MechanismStage


def evaluate_all_invariants(ledger: CrispCreditLedger, expected_threads: int) -> Dict[str, Any]:
    """
    Run formal invariant suite on an active ledger instance.
    """
    results: List[Dict[str, Any]] = []

    # Invariant 1: Total Credit Conservation
    sum_credits = (
        ledger.available_credits
        + ledger.active_obligations
        + ledger.settling_obligations
        + ledger.quarantined_obligations
    )
    inv1_pass = (sum_credits == ledger.pool_capacity)
    results.append({
        "id": "INV_CONSERVATION",
        "name": "Total Credit Conservation Invariant",
        "description": "Available + Active + Settling + Quarantined must strictly equal Pool Capacity.",
        "passed": inv1_pass,
        "observed": sum_credits,
        "expected": ledger.pool_capacity,
        "delta": sum_credits - ledger.pool_capacity,
    })

    # Invariant 2: Per-Thread Cap Boundedness
    inv2_pass = True
    violating_threads = []
    for tid, rec in ledger.threads.items():
        if rec.active_pages > ledger.per_thread_cap:
            inv2_pass = False
            violating_threads.append({"thread_id": tid, "active": rec.active_pages, "cap": ledger.per_thread_cap})

    results.append({
        "id": "INV_THREAD_CAP",
        "name": "Per-Thread Obligation Bound (d_max)",
        "description": "No single thread may exceed the per-thread deferral cap d_max while in critical section.",
        "passed": inv2_pass,
        "violations": violating_threads,
    })

    # Invariant 3: Maximum Memory Overshoot Upper Bound
    # For M0: Upper bound = N * d_max pages
    # For M1/M2: Upper bound = min(N * d_max, pool_capacity)
    if ledger.stage == MechanismStage.M0_PER_THREAD_CAP:
        theoretical_bound_pages = expected_threads * ledger.per_thread_cap
    else:
        theoretical_bound_pages = min(expected_threads * ledger.per_thread_cap, ledger.pool_capacity)

    actual_deferred_pages = ledger.active_obligations + ledger.settling_obligations
    inv3_pass = (actual_deferred_pages <= theoretical_bound_pages)

    results.append({
        "id": "INV_OVERSHOOT_BOUND",
        "name": "Provable Maximum Overshoot Bound",
        "description": "Total deferred obligations must not exceed theoretical upper bound (N * d_max or Pool Size).",
        "passed": inv3_pass,
        "actual_pages": actual_deferred_pages,
        "bound_pages": theoretical_bound_pages,
        "bound_bytes_4k": theoretical_bound_pages * 4096,
    })

    # Invariant 4: Non-Negative Ledger Balances
    inv4_pass = (
        ledger.available_credits >= 0
        and ledger.active_obligations >= 0
        and ledger.settling_obligations >= 0
        and ledger.quarantined_obligations >= 0
    )
    results.append({
        "id": "INV_NON_NEGATIVE",
        "name": "Non-Negative Account Balances",
        "description": "No ledger balance may ever drop below zero (underflow protection).",
        "passed": inv4_pass,
        "balances": {
            "available": ledger.available_credits,
            "active": ledger.active_obligations,
            "settling": ledger.settling_obligations,
            "quarantined": ledger.quarantined_obligations,
        },
    })

    all_passed = all(r["passed"] for r in results)
    return {
        "all_passed": all_passed,
        "total_checks": len(results),
        "passed_checks": sum(1 for r in results if r["passed"]),
        "invariants": results,
    }
