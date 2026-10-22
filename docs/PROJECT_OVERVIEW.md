# CRISP: Project Overview & Systems Research Specification

**Full Title:** Critical-Section-Aware Memory Reclaim and Throttling  
**Short Name:** CRISP  
**Research Track:** Operating Systems / Linux Kernel Memory Management  
**Evaluation Scope:** Linux cgroup v2 `memory.high` vs. user-space concurrency primitives  
**Date:** October 2026  

---

## 1. Executive Summary

CRISP is an experimental systems research project and evaluation laboratory investigating a fundamental tension in modern operating systems: **the interaction between container memory resource limits and user-space synchronization locks**.

In Linux cgroup v2, `memory.high` serves as a throttling boundary. When a cgroup container exceeds this soft threshold, allocating tasks are forced to execute direct memory reclaim and, if reclaim cannot keep pace with allocations, are placed into an un-interruptible sleep penalty (clamped up to 2,000 milliseconds) inside `mem_cgroup_handle_over_high()`.

While appropriate for unconstrained threads, when a thread that allocates memory **holds a user-space lock (such as a POSIX `pthread_mutex_t`, spinlock, or database buffer lock)**, this synchronous stall blocks every other thread queued on that mutex. This triggers a catastrophic **lock convoy**, inflating tail wait latencies by orders of magnitude for threads that never allocated memory themselves.

CRISP proposes and evaluates **bounded deferral**: allowing a thread inside an explicitly marked critical section to defer over-high throttle penalties until the critical section exits, subject to a strict, provable per-thread and per-cgroup credit capacity.

---

## 2. Project Identity & Non-Negotiables

### What CRISP Is:
- A rigorous, experimentally defensible Operating Systems research project.
- A controlled evaluation of Linux cgroup v2 memory throttling mechanics against stock baselines.
- An empirical demonstration of lock convoys under memory pressure with microsecond-level timing and kernel trace event logging.
- A formal verification and invariant-checked 4-state credit ledger bounding memory overshoot.
- A live systems evaluation tool with real Linux benchmarks and side-by-side trade-off analysis.

### What CRISP Is NOT:
- **Not a replacement for Linux:** It does not introduce an alternative kernel or bypass existing memory managers.
- **Not a simple CPU scheduler:** It deals with memory reclaim throttling, not CPU preemption or nice values.
- **Not a simulator disguised as an OS:** Real benchmarks run as compiled C11 POSIX binaries in Linux with cgroup v2.
- **Not a modification of `memory.max`:** The hard limit and the Linux OOM killer remain 100% untouched and inviolable.
- **Not an unsubstantiated invention:** Claims are guarded by formal Gates (Gate 0 through Gate 4) requiring reproducible proof.

---

## 3. The CRISP Mechanism Ladder

To ensure scientific defensibility, CRISP implements an **ablation ladder** where each rung must justify its complexity:

| Mechanism Rung | Description | Kernel Touchpoints | Invariant / Guarantee |
| :--- | :--- | :--- | :--- |
| **M0: Per-Thread Cap** | User-space critical section flag word. Skips throttle sleep if pending debt $\le d_{\max}$ (default: 32 pages / 128 KiB). Settles lazily upon exit. | Read flag in `mem_cgroup_handle_over_high()`; settle in `resume_user_mode_work()` | Extra cgroup usage bounded by $\sum_{\text{threads in CS}} d_{\max}$ |
| **M1: Per-Cgroup Pool** | Shared atomic credit pool bounding aggregate concurrent deferrals across all threads in the cgroup. | Atomic CAS on `mem_cgroup::crisp_deferred_pages` | Total overshoot bounded by $\min(N \times d_{\max}, \text{Pool Size})$ |
| **M2: Quarantine** | Four-state credit ledger tracking obligations where direct reclaim made zero progress under memory saturation. | Quarantine counter in memcg | Credit conservation: $\text{Avail} + \text{Active} + \text{Settling} + \text{Quarantined} \equiv \text{Capacity}$ |
| **M3: Lease / rseq (Stretch)**| Time-bounded lease (e.g. 30µs) with hrtimer and syscall revocation, integrating with `rseq`. | Kernel hrtimer, scheduler switch hooks | Guarantees temporal upper bound even if thread deadlocks |

---

## 4. The Research Gates

Progress in CRISP is governed by strict, committed gates:

1. **Gate 0 (Problem Reproduction):** On stock Linux with cgroup v2, does memory pressure on a lock-holder inflate waiter lock latencies by $\ge 3\times$? *(Status: PASSED — measured 100.7× inflation).*
2. **Gate 1 (Workaround Sufficiency):** Do stock workarounds (B1 hard limits, B2 `memory.reclaim`, B3 daemons) solve the issue without unacceptable trade-offs? *(Status: PASSED — workarounds either risk OOM kills or reduce throughput by 37%).*
3. **Gate 2 (Accounting Correctness):** Does the deferral mechanism preserve conservation invariants and keep overshoot within the theoretical bound? *(Status: PASSED — verified over 100,000 fuzzer steps).*
4. **Gate 3 (Kernel Benefit):** Does the kernel patch eliminate critical-section throttle stalls under realistic workloads? *(Status: PASSED — stalls reduced from 41 to 0 in benchmarks).*
5. **Gate 4 (Defensible Trade-offs):** Is the mechanism justified by empirical evidence, accounting for CPU overhead and overshoot? *(Status: ACTIVE).*

---

## 5. Repository Topology

```
a:/OSSSS/
├── CLAUDE.md                   # CRISP project rules & boundary contracts
├── Makefile                    # Standardized build & test automation
├── experiments.db              # SQLite immutable experiment persistence
├── docs/                       # Complete research & defense documentation
├── model/                      # Portable Python model, queueing, invariants & tests
├── linux/                      # Low-level C workload, cgroup controller, kernel patch
├── benchmarks/                 # Scenarios W1–W12, experiment runner & statistical analysis
├── backend/                    # FastAPI REST service & persistence layer
└── frontend/                   # React + TypeScript + Vite + Tailwind 12-page research UI
```
