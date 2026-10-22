# CRISP: System Architecture & Subsystem Interactions

## 1. Architectural Philosophy

CRISP separates **low-level kernel mechanics**, **portable formal models**, **benchmark orchestration**, and **presentation/visualization** into clean, modular layers. 

```
+-----------------------------------------------------------------------------------+
|                           CRISP Web Dashboard & UI                                |
|  - 12 Research Pages: Overview, Lab, Comparison, Mechanisms, Timeline, OS Lab     |
|  - React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide                     |
+-----------------------------------------------------------------------------------+
                                        | (REST JSON APIs)
+-----------------------------------------------------------------------------------+
|                            CRISP Backend Service                                  |
|  - FastAPI (Python 3.11+), SQLite Persistence (experiments.db)                    |
|  - Allowlisted Experiment Runner & Preflight Diagnostic Health Engine             |
+-----------------------------------------------------------------------------------+
             |                                              |
             v                                              v
+-----------------------------+               +-------------------------------------+
|      Portable Model         |               |       Linux Execution Engine        |
|  - 4-State Credit Ledger    |               |  - WSL2 / QEMU / Native Linux       |
|  - Invariant Verification   |               |  - C11 POSIX pthread benchmark      |
|  - 100k-step Adversarial    |               |  - cgroup v2 controller interface   |
|  - M/G/1 Pollaczek-Khinchine|               |  - Linux 6.6 mm/memcontrol.c Patch  |
+-----------------------------+               +-------------------------------------+
```

---

## 2. Core Subsystems

### 2.1 The Portable Model (`model/`)
Designed to run deterministically on Windows, macOS, and Linux without any OS-specific dependencies.
- `model/accounting/credit_ledger.py`:
  - Implements the 4 credit states:
    - **Available:** Unallocated deferral budget.
    - **Active Obligations:** Credits held by threads currently inside marked critical sections.
    - **Settling Obligations:** Debt currently undergoing direct reclaim and sleep after lock release.
    - **Quarantined Obligations:** Unsettled debt from saturation or uncharge failures.
- `model/accounting/invariants.py`:
  - Formal check that $\text{Available} + \text{Active} + \text{Settling} + \text{Quarantined} == \text{Total Capacity}$.
  - Strict enforcement of per-thread cap $d_{\max}$.
- `model/queueing/pollaczek_khinchine.py`:
  - Calculates predicted mean lock-wait latency using the M/G/1 delay model.
  - Implements the Linux v6.6 penalty formula $T = \min(2000, 64 \cdot \rho^2 \cdot \frac{n}{B})$.

### 2.2 The Linux Workload & Kernel Harness (`linux/`)
- `linux/workload/mutex_alloc_workload.c`:
  - Multi-threaded C11 / POSIX benchmark.
  - High-precision `clock_gettime(CLOCK_MONOTONIC_RAW)` recording lock-wait durations, hold times, and allocation latencies.
  - Generates JSON summary artifacts with p50, p95, p99, p99.9 percentiles and throttle event counters.
- `linux/cgroup/cgroup_manager.py`:
  - Manages cgroup v2 subtree controller at `/sys/fs/cgroup`.
  - Configures `memory.high`, `memory.max`, and monitors `memory.events` (`high`, `max`, `oom`, `oom_kill`).
- `linux/kernel-patch/crisp-m0-m2.patch`:
  - Patch for Linux kernel v6.6 (`mm/memcontrol.c`, `include/linux/memcontrol.h`, `include/linux/sched.h`).
  - Implements user-space flag inspection and lazy settlement.

### 2.3 The Benchmark Runner & Analysis (`benchmarks/`)
- `benchmarks/scenarios/definitions.py`: Standardized scenarios W1 through W12.
- `benchmarks/runner/experiment_runner.py`: Executes real compiled C binary when Linux cgroup v2 is present; falls back to high-fidelity portable model with explicit provenance tagging.
- `benchmarks/analysis/stats.py`: Robust statistics, confidence intervals, and comparison radar generation.

### 2.4 The Backend API (`backend/`)
- `backend/persistence/db.py`: SQLite immutable storage for all experiment runs, metadata, and Gate statuses.
- `backend/services/experiment_service.py`: Orchestrates preflight, benchmark execution, and comparisons.
- `backend/api/routes.py`: REST API endpoints for all frontend features.

### 2.5 The Frontend UI (`frontend/`)
- 12 comprehensive dark-first engineering pages.
- Real-time preflight diagnostic display.
- Side-by-side Before/After evaluation with confidence intervals.
- Integrated System Evaluation tour modal.
