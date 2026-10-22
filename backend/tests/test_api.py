"""
CRISP Backend API Test Suite
"""

import unittest
from fastapi.testclient import TestClient
from backend.main import app
from backend.persistence.db import init_db


class TestCrispAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    def test_root_and_status(self):
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["project"], "CRISP")

        stat_resp = self.client.get("/api/status")
        self.assertEqual(stat_resp.status_code, 200)
        stat_data = stat_resp.json()
        self.assertIn("environment", stat_data)
        self.assertIn("gates", stat_data)

    def test_preflight(self):
        resp = self.client.get("/api/preflight")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("checks", data)
        self.assertTrue(len(data["checks"]) >= 5)

    def test_scenarios(self):
        resp = self.client.get("/api/scenarios")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data), 12)
        scenario_ids = [s["id"] for s in data]
        self.assertIn("W1", scenario_ids)
        self.assertIn("W2", scenario_ids)
        self.assertIn("W12", scenario_ids)

    def test_model_simulate(self):
        resp = self.client.get("/api/model/simulate?stage=M0&cap=32&pages=16")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["stage"], "M0")
        self.assertGreater(data["total_steps"], 3)
        self.assertEqual(data["outcome"], "GRANTED")

    def test_queueing_calculation(self):
        payload = {
            "arrival_rate_lambda": 150.0,
            "critical_section_mean_ms": 0.05,
            "critical_section_cv": 1.0,
            "throttle_prob_p": 0.05,
            "throttle_delay_mean_ms": 40.0,
            "throttle_delay_cv": 0.5,
        }
        resp = self.client.post("/api/model/queueing", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["crisp_stable"])
        self.assertGreater(data["wait_reduction_ratio"], 1.0)

    def test_run_experiment_and_compare(self):
        # Run B0
        req_b0 = {"scenario_id": "W2", "policy": "B0", "threads": 4, "duration_sec": 1, "name": "Test B0"}
        resp_b0 = self.client.post("/api/experiments/run", json=req_b0)
        self.assertEqual(resp_b0.status_code, 200)
        run_b0 = resp_b0.json()

        # Run M0
        req_m0 = {"scenario_id": "W2", "policy": "M0", "threads": 4, "duration_sec": 1, "name": "Test M0"}
        resp_m0 = self.client.post("/api/experiments/run", json=req_m0)
        self.assertEqual(resp_m0.status_code, 200)
        run_m0 = resp_m0.json()

        # Compare
        comp_resp = self.client.get(f"/api/experiments/compare/{run_b0['run_id']}/{run_m0['run_id']}")
        self.assertEqual(comp_resp.status_code, 200)
        comp_data = comp_resp.json()
        self.assertIn("comparison", comp_data)
        self.assertIn("tradeoff_summary", comp_data)

    def test_run_tests_live(self):
        resp = self.client.post("/api/tests/run")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["all_passed"])
        self.assertGreaterEqual(data["passed"], 10)

    def test_safety_contract_and_checker(self):
        contract_resp = self.client.get("/api/safety-contract")
        self.assertEqual(contract_resp.status_code, 200)
        cdata = contract_resp.json()
        self.assertIn("properties", cdata)
        self.assertEqual(len(cdata["properties"]), 6)

        check_resp = self.client.post("/api/checker/run", json={"threads": 2, "max_depth": 10})
        self.assertEqual(check_resp.status_code, 200)
        chk_data = check_resp.json()
        self.assertEqual(chk_data["status"], "PASSED")
        self.assertEqual(chk_data["violations_found"], 0)


if __name__ == "__main__":
    unittest.main()
