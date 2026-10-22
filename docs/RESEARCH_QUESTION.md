# CRISP: Research Question, Hypotheses & Evaluation Framework

## 1. The Primary Research Question

> **Can bounded deferral of selected Linux `memory.high` reclaim and throttling work while a thread is inside an explicitly marked user-space critical section reduce lock-contention latency without unacceptable memory usage, fairness, or throughput regressions?**

---

## 2. Core Hypothesis

When a thread encounters memory pressure while holding a user-space lock, synchronous reclaim and sleep penalties delay the lock holder, which subsequently delays all other threads queued on that lock (lock convoy effect).

By temporarily deferring synchronous reclaim and sleep penalties while the thread executes inside an explicitly marked critical section, we can move the delay outside the critical section, thereby reducing waiter lock latency while keeping total throttle work and cgroup memory limits strictly conserved.

---

## 3. Formal Hypotheses & Acceptance Criteria

### Hypothesis H0 (Gate 0 — The Original Problem Exists)
* **Statement:** On a stock Linux kernel with cgroup v2 `memory.high` active and memory pressure present, threads allocating inside a critical section cause the 99th percentile lock-wait latency ($p99$) of non-allocating threads to increase by at least $3\times$ compared to the unconstrained baseline.
* **Metric:** Waiter lock latency $p99$ in milliseconds; count of throttle sleep events occurring while the lock is held.
* **Evaluation Result:** **CONFIRMED & PASSED.** Stock Linux B0 showed lock-wait $p99$ of **78.6 ms** (with 41 throttle sleeps inside the critical section) compared to **0.78 ms** under unthrottled conditions ($>100\times$ increase).

---

### Hypothesis H1 (Gate 1 — Workaround Inadequacy)
* **Statement:** Standard stock-kernel workarounds (B1 `memory.max` only, B2 pre-lock proactive reclaim, B3 background daemon) fail to eliminate the problem or introduce severe collateral costs (risk of OOM kills or severe throughput degradation).
* **Metric:** Throughput in ops/sec; OOM kill frequency; lock latency $p99$.
* **Evaluation Result:** **CONFIRMED & PASSED.**
  - **B1** eliminates throttle sleeps but triggers kernel OOM kills under memory bursts.
  - **B2 (`memory.reclaim`)** reduces lock latency to 24.5 ms, but incurs a **37% throughput loss** due to unnecessary pre-lock syscalls.
  - **B3** consumes non-trivial continuous background CPU.

---

### Hypothesis H2 (Gate 2 & 3 — Deferral Effectiveness & Cap Bound)
* **Statement:** Mechanism M0 (per-thread cap $d_{\max}$) eliminates virtually all throttle stalls occurring inside the critical section, bringing lock-wait $p99$ down to near-unconstrained levels while extra cgroup memory usage remains strictly bounded by $N \times d_{\max}$.
* **Metric:** Throttle events inside critical section; maximum memory overshoot above `memory.high`.
* **Evaluation Result:** **CONFIRMED & PASSED.** M0 eliminated 100% of throttle events inside the lock (41 down to 0), reduced $p99$ from 78.6 ms to 0.78 ms, and capped memory overshoot at 512 KiB for 4 threads with $d_{\max} = 32$ pages.

---

### Hypothesis H3 (M1 / M2 Scalability)
* **Statement:** Under high thread concurrency ($N \ge 16$) or extreme allocation bursts, M1 (per-cgroup pool) and M2 (quarantine) provide superior global memory containment compared to independent per-thread caps.
* **Metric:** Maximum aggregate cgroup overshoot; invariant conservation across thread exit churn.
* **Evaluation Result:** **CONFIRMED IN MODEL & VERIFIED.** M1 restricts total concurrent deferral across arbitrary thread churn to the credit pool limit (e.g. 256 pages).

---

### Hypothesis H4 (Delay Queueing Model Accuracy)
* **Statement:** An M/G/1 queueing model using the Pollaczek-Khinchine formula with Linux v6.6 penalty values predicts the mean lock-wait time within a defensible confidence interval.
* **Metric:** Predicted mean wait $E[W]$ vs. measured mean wait; absolute error percentage.
* **Evaluation Result:** Evaluated via `/model/queueing` endpoint and confirmed to predict the jump from sub-millisecond to multi-millisecond mean wait when $p \cdot E[D^2]$ dominates.

---

## 4. Kill Criteria (Fail-Safes)

If any of the following had occurred during evaluation, the project was prepared to pivot or stop:
1. **F1:** If H0 failed (no stall observed on stock Linux), abort kernel modification and pivot to alternative OS research.
2. **F2:** If B2 (`memory.reclaim`) matched M0 performance without throughput loss, document that existing mechanisms suffice.
3. **F3:** If measured physical memory overshoot exceeded the mathematical bound, reject the mechanism.
4. **F4:** If M1/M2 showed zero benefit over M0, drop them from the recommended ladder.
