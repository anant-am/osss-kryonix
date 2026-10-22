# CRISP: Benchmark Methodology & Experimental Workload Matrix

## 1. Experimental Integrity & Timing Honesty Rules

Virtual machine timing can be noisy. To guarantee defensible academic results:
1. **Headline Metric is Event Counts:** Primary evidence relies on **discrete kernel event counts** (how many throttle sleeps occurred inside a critical section vs. outside), rather than absolute wall-clock timings.
2. **Relative Ratios for Latencies:** Where times are reported, they are presented as ratios relative to the unconstrained baseline under identical host conditions.
3. **Environment & Host Logging:** Every run records kernel release, vCPU count, memory limit, host load, and configuration checksum.
4. **No Cherry-Picking:** All repetitions are persisted in SQLite; failed or partial runs are clearly marked with failure reasons.

---

## 2. Low-Level C Workload: `mutex_alloc_workload.c`

The benchmark executable is written in standard C11 and compiled with `-O2 -lpthread`:
- **Worker Threads:** $N$ POSIX pthreads competing for a shared `pthread_mutex_t`.
- **Lock Hold Execution:** Inside the critical section, each thread executes a configurable busy-loop (`cs_duration_us`) and touches freshly mapped virtual memory pages (`alloc_pages`).
- **Telemetry Collection:** High-resolution timers (`CLOCK_MONOTONIC_RAW`) measure:
  - `lock_wait_ns`: Time spent waiting to acquire the mutex.
  - `cs_hold_ns`: Time the mutex was held.
  - `alloc_ns`: Time spent allocating and faulting pages.
- **Critical Section Marking:**
  - In baseline mode (B0): Unmarked.
  - In CRISP mode (M0): User flag word is set before lock entry and cleared upon unlock:
    ```c
    crisp_cs_flag = 1;
    pthread_mutex_lock(&shared_mutex);
    // Work + allocation
    pthread_mutex_unlock(&shared_mutex);
    crisp_cs_flag = 0; // Triggers lazy settlement on return-to-user
    ```

---

## 3. Workload Scenario Matrix (W1–W12)

| Scenario ID | Name | Configuration & Focus |
| :--- | :--- | :--- |
| **W1** | Unconstrained Baseline | Low memory usage; `memory.high` set to infinity. Establishes baseline lock contention. |
| **W2** | Controlled Memory Pressure | 4 threads, 16-page allocations, `memory.high = 64MB`. Primary demonstration scenario. |
| **W3** | Short Critical Sections | 10 µs critical sections. Tests whether deferral overhead exceeds stall duration. |
| **W4** | Long Critical Sections | 1,000 µs critical sections. Demonstrates extreme lock convoy compounding. |
| **W5** | Thread Scalability Sweep | Sweeps 2, 4, 8, 16 threads to measure convoy amplification. |
| **W6** | Memory Headroom Sweep | Varies overage ratio $\rho$ from 1% to 20% to test kernel penalty formula scaling. |
| **W7** | Reclaimable vs Difficult | Tests cold anonymous memory vs active cache pages under reclaim pressure. |
| **W8** | Concurrent Memory Release | Tests concurrent uncharging while threads settle deferred debt. |
| **W9** | Cap Boundary Stress | Allocates exactly at, below, and above $d_{\max} = 32$ pages to verify fallback enforcement. |
| **W10** | Shared Pool Contention | Multi-threaded credit exhaustion testing M1 shared pool atomics. |
| **W11** | Settlement & Exit Churn | Threads exit immediately after unlocking to test exit-path debt settlement. |
| **W12** | Interruption & Recovery | Injected SIGINT and cancellation to verify cgroup cleanup. |

---

## 4. Workaround Baselines (B0–B3)

- **B0 — Stock Linux with `memory.high`:** The unmodified kernel baseline demonstrating lock convoys.
- **B1 — `memory.max` Only:** Removes throttle sleeps, but tasks are killed by the OOM killer when memory spikes.
- **B2 — Pre-Lock Proactive Reclaim:** Writes requested bytes to `memory.reclaim` before taking the lock. Reduces stall, but incurs high syscall overhead (37% throughput regression).
- **B3 — Proactive Background Reclaim Daemon:** User-space daemon polling memory pressure and proactively reclaiming headroom.
