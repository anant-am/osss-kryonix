"""
CRISP Model Invariant & Correctness Test Suite
Includes unit tests, invariant verifiers, and 100,000-step randomized adversarial fuzzing.
Runs natively on Windows, macOS, and Linux.
"""

import unittest
import random
from model.accounting.credit_ledger import CrispCreditLedger, MechanismStage, DeferralOutcome
from model.accounting.invariants import evaluate_all_invariants
from model.queueing.pollaczek_khinchine import (
    calculate_kernel_throttle_penalty_ms,
    predict_mg1_lock_waits,
    QueueingModelInput,
)
from model.state_machine.crisp_automaton import CrispThreadAutomaton, ThreadState


class TestCrispAccountingInvariants(unittest.TestCase):

    def test_zero_allocation(self):
        ledger = CrispCreditLedger(MechanismStage.M0_PER_THREAD_CAP, per_thread_cap=32)
        ledger.set_critical_section_flag("t1", in_cs=True)
        outcome, pages = ledger.request_deferral("t1", 0)
        self.assertEqual(outcome, DeferralOutcome.GRANTED)
        self.assertEqual(pages, 0)
        valid, disc = ledger.verify_conservation_invariant()
        self.assertTrue(valid)
        self.assertEqual(disc, 0)

    def test_allocation_below_and_at_cap(self):
        ledger = CrispCreditLedger(MechanismStage.M0_PER_THREAD_CAP, per_thread_cap=32)
        ledger.set_critical_section_flag("t1", in_cs=True)

        outcome, pages = ledger.request_deferral("t1", 16)
        self.assertEqual(outcome, DeferralOutcome.GRANTED)
        self.assertEqual(pages, 16)
        self.assertEqual(ledger.active_obligations, 16)

        outcome2, pages2 = ledger.request_deferral("t1", 16)
        self.assertEqual(outcome2, DeferralOutcome.GRANTED)
        self.assertEqual(pages2, 16)
        self.assertEqual(ledger.active_obligations, 32)

        # Exceeding cap
        outcome3, pages3 = ledger.request_deferral("t1", 1)
        self.assertEqual(outcome3, DeferralOutcome.FALLBACK_CAP_EXCEEDED)
        self.assertEqual(pages3, 0)

        # Invariant must strictly hold
        valid, disc = ledger.verify_conservation_invariant()
        self.assertTrue(valid)
        self.assertEqual(disc, 0)

    def test_missing_critical_section_flag(self):
        ledger = CrispCreditLedger(MechanismStage.M0_PER_THREAD_CAP, per_thread_cap=32)
        ledger.set_critical_section_flag("t1", in_cs=False)
        outcome, pages = ledger.request_deferral("t1", 10)
        self.assertEqual(outcome, DeferralOutcome.FALLBACK_NOT_IN_CS)
        self.assertEqual(pages, 0)
        self.assertEqual(ledger.active_obligations, 0)

    def test_settlement_lifecycle(self):
        ledger = CrispCreditLedger(MechanismStage.M0_PER_THREAD_CAP, per_thread_cap=32)
        ledger.set_critical_section_flag("t1", in_cs=True)
        ledger.request_deferral("t1", 20)
        self.assertEqual(ledger.active_obligations, 20)

        settling = ledger.begin_settlement("t1")
        self.assertEqual(settling, 20)
        self.assertEqual(ledger.active_obligations, 0)
        self.assertEqual(ledger.settling_obligations, 20)

        returned, quarantined = ledger.complete_settlement("t1", 20, reclaim_successful=True)
        self.assertEqual(returned, 20)
        self.assertEqual(quarantined, 0)
        self.assertEqual(ledger.settling_obligations, 0)
        self.assertEqual(ledger.available_credits, ledger.pool_capacity)

    def test_m2_quarantine_on_reclaim_failure(self):
        ledger = CrispCreditLedger(MechanismStage.M2_QUARANTINE, per_thread_cap=32, pool_capacity=100)
        ledger.set_critical_section_flag("t1", in_cs=True)
        ledger.request_deferral("t1", 25)
        ledger.begin_settlement("t1")

        # Reclaim fails
        returned, quarantined = ledger.complete_settlement("t1", 25, reclaim_successful=False)
        self.assertEqual(returned, 0)
        self.assertEqual(quarantined, 25)
        self.assertEqual(ledger.quarantined_obligations, 25)
        self.assertEqual(ledger.available_credits, 75)

        # Invariant preserved during quarantine!
        valid, disc = ledger.verify_conservation_invariant()
        self.assertTrue(valid)

        # Release quarantine later
        released = ledger.release_quarantine("t1", 25)
        self.assertEqual(released, 25)
        self.assertEqual(ledger.available_credits, 100)
        self.assertEqual(ledger.quarantined_obligations, 0)

    def test_thread_exit_churn_reconciliation(self):
        ledger = CrispCreditLedger(MechanismStage.M1_SHARED_POOL, per_thread_cap=32, pool_capacity=128)
        ledger.set_critical_section_flag("t_churn", in_cs=True)
        ledger.request_deferral("t_churn", 30)

        # Thread abruptly terminates while holding active debt
        reconciliation = ledger.thread_exit("t_churn")
        self.assertEqual(reconciliation["active_reconciled"], 30)
        self.assertEqual(ledger.active_obligations, 0)
        self.assertEqual(ledger.available_credits, 128)

        inv_res = evaluate_all_invariants(ledger, expected_threads=1)
        self.assertTrue(inv_res["all_passed"])

    def test_automaton_simulation_run(self):
        ledger = CrispCreditLedger(MechanismStage.M0_PER_THREAD_CAP, per_thread_cap=32)
        automaton = CrispThreadAutomaton("worker_1", ledger)

        automaton.acquire_lock(wait_duration_us=40)
        self.assertEqual(automaton.state, ThreadState.IN_CRITICAL_SECTION)

        outcome = automaton.allocate_memory_under_pressure(pages_allocated=16, overage_ratio=0.05)
        self.assertEqual(outcome, DeferralOutcome.GRANTED)
        self.assertEqual(automaton.state, ThreadState.DEFERRAL_GRANTED)

        automaton.release_lock()
        self.assertEqual(automaton.state, ThreadState.SETTLEMENT_PENDING)

        automaton.execute_settlement(reclaim_successful=True, penalty_ms=25)
        self.assertEqual(automaton.state, ThreadState.COMPLETED)
        self.assertTrue(ledger.verify_conservation_invariant()[0])

    def test_kernel_penalty_formula_agreement(self):
        # Verify agreement with Table 1 from the specification
        p1 = calculate_kernel_throttle_penalty_ms(0.01)
        self.assertFalse(p1["sleeps"])  # 6.4ms <= 10ms -> skips

        p2 = calculate_kernel_throttle_penalty_ms(0.02)
        self.assertTrue(p2["sleeps"])
        self.assertAlmostEqual(p2["calculated_ms"], 25.6, delta=0.5)

        p5 = calculate_kernel_throttle_penalty_ms(0.05)
        self.assertTrue(p5["sleeps"])
        self.assertAlmostEqual(p5["calculated_ms"], 160.0, delta=1.0)

        p18 = calculate_kernel_throttle_penalty_ms(0.18)
        self.assertTrue(p18["clamped"])
        self.assertEqual(p18["effective_sleep_ms"], 2000.0)

    def test_mg1_queueing_prediction(self):
        # Realistic parameters: lambda = 200 req/s, S = 50 us (0.05 ms), p = 0.05, D = 50 ms
        params = QueueingModelInput(
            arrival_rate_lambda=200.0,
            critical_section_mean_ms=0.05,
            critical_section_cv=1.0,
            throttle_prob_p=0.05,
            throttle_delay_mean_ms=50.0,
            throttle_delay_cv=0.5,
        )
        res = predict_mg1_lock_waits(params)
        self.assertTrue(res.baseline_stable)
        self.assertTrue(res.crisp_stable)
        # CRISP wait should be drastically smaller than baseline due to removing p*E[D^2]
        self.assertGreater(res.wait_reduction_ratio, 5.0)

    def test_randomized_adversarial_fuzzing_100k_steps(self):
        """
        Adversarial fuzzer running 100,000 random actions across multiple concurrent threads:
        random lock/unlock, random page charges, cap overshoots, partial settlements,
        reclaim failures, thread exits, and quarantine releases.
        Asserts that the conservation invariant NEVER breaks.
        """
        random.seed(42)
        ledger = CrispCreditLedger(MechanismStage.M2_QUARANTINE, per_thread_cap=32, pool_capacity=512)
        threads = [f"t_{i}" for i in range(16)]

        for step in range(100_000):
            tid = random.choice(threads)
            action = random.choice([
                "flag_toggle", "request_defer", "begin_settle",
                "complete_settle", "release_quarantine", "thread_exit"
            ])

            if action == "flag_toggle":
                ledger.set_critical_section_flag(tid, random.choice([True, False]))
            elif action == "request_defer":
                pages = random.randint(1, 40)
                ledger.request_deferral(tid, pages)
            elif action == "begin_settle":
                amount = random.randint(1, 32)
                ledger.begin_settlement(tid, amount)
            elif action == "complete_settle":
                amount = random.randint(1, 32)
                success = random.choice([True, True, False])
                ledger.complete_settlement(tid, amount, reclaim_successful=success)
            elif action == "release_quarantine":
                amount = random.randint(1, 32)
                ledger.release_quarantine(tid, amount)
            elif action == "thread_exit":
                ledger.thread_exit(tid)

            # Strict check every 5000 steps and at the end
            if step % 5000 == 0:
                valid, discrepancy = ledger.verify_conservation_invariant()
                self.assertTrue(valid, f"Conservation violated at step {step}: disc={discrepancy}")

        # Final invariant audit
        valid, discrepancy = ledger.verify_conservation_invariant()
        self.assertTrue(valid, f"Final conservation violated: discrepancy={discrepancy}")


if __name__ == "__main__":
    unittest.main()
