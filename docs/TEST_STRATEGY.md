# CRISP: Test Strategy & Verification Methodology

## 1. Multi-Tier Verification Philosophy

CRISP ensures zero regressions and verified formal correctness through a 3-tier testing strategy:
1. **Tier 1: Formal Invariant & Adversarial Fuzzing Suite (Model Layer)**
2. **Tier 2: Backend API & Service Integration Tests**
3. **Tier 3: Low-Level Linux C Benchmark Workload & cgroup v2 Tests**

---

## 2. Invariant & Model Tests (`model/tests/test_invariants.py`)

All 10 tests execute deterministically on any OS (Windows, macOS, Linux):

| Test ID | Test Name | Invariant Checked | Verification Condition |
| :--- | :--- | :--- | :--- |
| **INV-01** | `test_zero_allocation` | No debt without charge | Zero pages requested results in zero credit deduction. |
| **INV-02** | `test_allocation_below_and_at_cap` | Per-thread cap $d_{\max}$ | Thread can defer up to 32 pages; request for 33rd page triggers inline enforcement fallback. |
| **INV-03** | `test_missing_critical_section_flag` | Unmarked lock bypass | Allocation with flag cleared immediately runs inline enforcement without deferral. |
| **INV-04** | `test_settlement_lifecycle` | Settlement conservation | Clearing flag and settling reconciles all debt back to Available credits. |
| **INV-05** | `test_m2_quarantine_on_reclaim_failure` | M2 Quarantine safety | Debt where reclaim made 0 progress moves to Quarantined; total capacity remains conserved. |
| **INV-06** | `test_thread_exit_churn_reconciliation` | Exit churn protection | Sudden thread exits return credits or uncharge debt without leaking pool capacity. |
| **INV-07** | `test_randomized_adversarial_fuzzing` | Conservation under chaos | **100,000 random actions** across multiple concurrent threads with random churn, allocations, and failures. **0 invariant violations.** |
| **INV-08** | `test_kernel_penalty_formula_agreement`| Linux v6.6 source parity | Mathematical model matches Linux 6.6 `mm/memcontrol.c` table within rounding tolerance. |
| **INV-09** | `test_mg1_queueing_prediction` | Queueing model math | Pollaczek-Khinchine formula calculates mean wait and stability condition. |
| **INV-10** | `test_automaton_simulation_run` | State machine trace | End-to-end trace from IDLE $\to$ LOCK $\to$ CS $\to$ PRESSURE $\to$ DEFER $\to$ UNLOCK $\to$ SETTLE. |

---

## 3. Backend API Integration Tests (`backend/tests/test_api.py`)

7 automated integration tests verifying the REST endpoints:
- `test_root_and_status`: Validates `/status` and database metadata.
- `test_preflight`: Checks preflight diagnostics and cgroup detection.
- `test_scenarios`: Verifies W1–W12 workload scenario definitions.
- `test_run_experiment_and_compare`: Executes live B0 vs M0 benchmark and checks comparison deltas.
- `test_model_simulate`: Verifies state machine trace generator.
- `test_queueing_calculation`: Validates M/G/1 calculator endpoint.
- `test_run_tests_live`: Runs the model test suite through the API and checks test reports.

---

## 4. Test Automation Targets (`Makefile`)

```bash
# Run model invariant suite & 100k fuzzer
make model-test

# Run full backend and model test suites
make test

# Run Linux cgroup baseline (B0)
make linux-baseline

# Run Linux workaround ablation (B1, B2, B3)
make linux-workarounds

# Run CRISP M0 deferral benchmark
make linux-crisp
```
