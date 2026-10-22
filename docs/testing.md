# CRISP-L: Verification, Testing Strategy, and Model Checking

## 1. Multi-Tier Verification Strategy

CRISP-L employs a defense-in-depth testing architecture spanning formal invariants, property-based model checking, backend unit testing, and C multi-threaded concurrency stress testing.

```
+-----------------------------------------------------------------------------------+
| Tier 4: C Concurrency Stress Suite (POSIX Multi-Threaded In-Kernel Reclaim)      |
+-----------------------------------------------------------------------------------+
| Tier 3: Statistical Confidence & Percentile Estimators (bootstrap_ci_95)        |
+-----------------------------------------------------------------------------------+
| Tier 2: 100,000-Step Adversarial Bounded Model Checker (pytest tests/model/)      |
+-----------------------------------------------------------------------------------+
| Tier 1: Core Formal Invariant Checker (Invariant P1 - P6 Verification)           |
+-----------------------------------------------------------------------------------+
```

---

## 2. The 6 Core Safety Invariants

| ID | Formal Invariant Name | Mathematical Definition | Verification Target |
| :--- | :--- | :--- | :--- |
| **P1** | **Bounded Deferral Cap** | $\forall t \in \text{Threads}, \text{debt}(t) \le d_{\max}$ | Prevents runaway memory allocation inside critical sections. |
| **P2** | **Credit Conservation** | $\text{Avail} + \text{Active} + \text{Settling} + \text{Quar} \equiv C_{\text{total}}$ | Prevents credit leakage or unbounded debt inflation. |
| **P3** | **Zero In-CS Throttling** | $\text{in\_cs}(t) \land \text{debt}(t) < d_{\max} \implies \text{stall}(t) = 0$ | Guarantees elimination of lock convoys while within bounds. |
| **P4** | **Debt Settle Finality** | $\text{exit\_cs}(t) \implies \lim_{\Delta t \to \infty} \text{debt}(t) = 0$ | Ensures all deferred stalls are paid before user code resumes. |
| **P5** | **Lease Expiration Safety** | $t_{\text{now}} > t_0 + \tau \implies \text{revoke\_lease}(t)$ | Prevents deadlocked threads from shielding allocations. |
| **P6** | **Zero OOM Escalation** | $U_{\text{cgroup}} < \text{memory.max}$ | Proves deferred allocations do not induce hard OOM kill. |

---

## 3. Running Test Suites

### 3.1 Backend & Model Checker Test Execution
```bash
# Run full model checking and accounting test suite
pytest tests/ -v

# Run 100,000-step randomized state space exploration
pytest tests/model/test_credit_ledger_adversarial.py -v

# Run backend API contract tests
pytest tests/backend/ -v
```

### 3.2 Linux C Workload Verification (WSL2 / Linux host)
```bash
# Compile multi-threaded C test binary
cd linux/workload
gcc -O2 -pthread -std=c11 mutex_alloc_workload.c -o mutex_alloc_workload

# Execute 4-thread fast-mutex benchmark under cgroup pressure
./mutex_alloc_workload --threads 4 --duration 3 --scenario W2 --policy M0
```

### 3.3 Frontend Type Check and Production Bundle Verification
```bash
# Run TypeScript compilation check & Vite production build
cd frontend
npm run build
```

---

## 4. Mutation Testing & Refutation Suites

To guarantee that test suites are sensitive to critical bugs, mutant models with intentionally broken invariants are executed during model checking:

1. **Mutant 1: Infinite Cap ($d_{\max} = \infty$)**:
   - Refutation test: `test_mutant_infinite_cap_violates_p1()` detects unbounded debt buildup.
2. **Mutant 2: Leak on Thread Exit**:
   - Refutation test: `test_mutant_unaccounted_death_violates_p2()` verifies that thread terminations properly return credits to `Available`.
3. **Mutant 3: Ignored Lease Deadline**:
   - Refutation test: `test_mutant_stale_lease_violates_p5()` checks that prolonged lock holds trigger immediate revoking and quarantine.
