"""
Tests for CRISP Bounded Model Checker and Safety Contract
"""

import unittest
from model.verification.bounded_checker import CrispSafetyChecker


class TestSafetyContractChecker(unittest.TestCase):

    def test_safety_contract_summary(self):
        summary = CrispSafetyChecker.get_safety_contract_summary()
        self.assertIn("properties", summary)
        self.assertEqual(len(summary["properties"]), 6)
        self.assertIn("mutation_counterexamples", summary)
        self.assertGreaterEqual(len(summary["mutation_counterexamples"]), 6)

    def test_live_bounded_checker_2_threads(self):
        res = CrispSafetyChecker.run_live_bounded_check(threads=2, max_depth=10)
        self.assertEqual(res["status"], "PASSED")
        self.assertEqual(res["violations_found"], 0)
        self.assertGreater(res["states_explored"], 10)


if __name__ == "__main__":
    unittest.main()
