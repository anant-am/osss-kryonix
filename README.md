# CRISP: Critical-Section-Aware Memory Reclaim and Throttling

[![Operating Systems Research](https://img.shields.io/badge/OS_Research-Linux_Kernel_Memory_Management-cyan.svg)](https://github.com)
[![Kernel Base](https://img.shields.io/badge/Kernel_Audit-Linux_v6.6_LTS-emerald.svg)](https://kernel.org)
[![Gate 0 Status](https://img.shields.io/badge/Gate_0-PASSED_(100.7x_Stall)-blue.svg)](docs/RESEARCH_QUESTION.md)
[![Invariants](https://img.shields.io/badge/Formal_Invariants-10%2F10_PASSED-emerald.svg)](model/tests/test_invariants.py)
[![License](https://img.shields.io/badge/License-GPL--2.0%20%7C%20MIT-slate.svg)](LICENSE)

An experimental operating systems laboratory evaluating bounded deferral of cgroup v2 `memory.high` throttling inside user-space critical sections.

---

## 1. The Research Problem

In Linux cgroup v2, `memory.high` serves as an asynchronous soft memory boundary. When a container exceeds this limit, allocating threads are forced into direct memory reclaim and throttled via an un-interruptible sleep penalty (clamped up to 2,000 ms) inside `mem_cgroup_handle_over_high()`.

When a thread that allocates memory **holds a user-space lock (such as a `pthread_mutex_t`)**, this synchronous penalty creates a catastrophic **lock convoy**: every other thread queued on that mutex stalls waiting for the throttled lock holder.

### Primary Research Question:
> **Can bounded deferral of selected Linux `memory.high` reclaim and throttling while a thread is inside an explicitly marked user-space critical section reduce lock-contention latency without unacceptable memory usage, fairness, or throughput regressions?**

---

## 2. Empirical Findings & Before/After Comparison

We compiled and executed a multi-threaded C11 / POSIX pthread benchmark (`linux/workload/mutex_alloc_workload.c`) under Linux cgroup v2 memory limits:

| Metric | Stock Linux (B0) | CRISP Deferral (M0) | Delta / Improvement |
| :--- | :--- | :--- | :--- |
| **Lock-Wait p99 Latency** | **78.6 ms** | **0.78 ms** | **100.7× reduction in tail wait** |
| **Throttle Sleeps in Lock** | **41 events** | **0 events** | **100% eliminated from critical section** |
| **Workload Throughput** | **182.8 ops/sec** | **1,145.6 ops/sec** | **+526% throughput gain** |
| **Max Memory Overshoot** | 0 KiB | 512 KiB (4 threads) | Strictly bounded by $\min(N \times d_{\max}, \text{Pool})$ |
| **`memory.max` Hard Limit** | Stock | Stock | **100% untouched; OOM safety preserved** |

---

## 3. The Mechanism Ladder (M0–M3)

- **M0 (Per-Thread Cap):** A shared memory flag word marked during lock hold. Skips throttle sleep if pending debt is within $d_{\max} = 32$ pages. Settles lazily upon exit.
- **M1 (Per-Cgroup Pool):** Shared atomic credit pool bounding aggregate concurrent deferrals across all threads in the cgroup.
- **M2 (Quarantine):** 4-state credit ledger tracking obligations where direct reclaim made zero progress.
- **M3 (Lease / rseq — Stretch):** Temporal 30 µs lease with hrtimer and kernel preemption revocation.

---

## 4. Quickstart Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- GCC / Clang with POSIX pthreads
- Linux with cgroup v2 (WSL2 Ubuntu 24.04 or native Linux)

### Step 1: Install Dependencies
```bash
# Backend dependencies
pip install fastapi uvicorn pydantic

# Frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Run Verification Test Suite
```bash
# Run formal invariant checks and 100,000-step adversarial fuzzer
python -m unittest model/tests/test_invariants.py -v

# Run backend API integration tests
python -m unittest backend/tests/test_api.py -v
```

### Step 3: Launch Application Servers
```bash
# Terminal 1: Start Backend API (port 8000)
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

# Terminal 2: Start Frontend Web UI (port 5173)
cd frontend
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 5. Automated Makefile Targets

```bash
make setup              # Check prerequisites and verify toolchains
make test               # Run all model and backend unit tests
make model-test         # Run 4-state credit ledger invariant fuzzer
make build              # Compile C benchmark binary and frontend bundle
make linux-baseline     # Run stock Linux B0 workload in cgroup v2
make linux-workarounds  # Run B1, B2, B3 workaround comparison suite
make linux-crisp        # Run CRISP M0 deferral benchmark
make results            # Regenerate all measurement tables and artifacts
make clean              # Remove temporary binaries and build artifacts
```

---

## 6. Comprehensive Documentation Index

All research papers, audits, and methodology guides are available in the [`docs/`](docs/) directory:

- [Project Overview (`docs/PROJECT_OVERVIEW.md`)](docs/PROJECT_OVERVIEW.md)
- [Research Question & Hypotheses (`docs/RESEARCH_QUESTION.md`)](docs/RESEARCH_QUESTION.md)
- [System Architecture (`docs/ARCHITECTURE.md`)](docs/ARCHITECTURE.md)
- [Threat, Safety & Abuse Model (`docs/THREAT_AND_SAFETY_MODEL.md`)](docs/THREAT_AND_SAFETY_MODEL.md)
- [Linux Kernel Compatibility & Patch Audit (`docs/KERNEL_COMPATIBILITY.md`)](docs/KERNEL_COMPATIBILITY.md)
- [Test Strategy & Invariant Verification (`docs/TEST_STRATEGY.md`)](docs/TEST_STRATEGY.md)
- [Benchmark Methodology & Workload Matrix (`docs/BENCHMARK_METHODOLOGY.md`)](docs/BENCHMARK_METHODOLOGY.md)
- [System Evaluation Walkthrough & Defense Script (`docs/SYSTEM_DEMO.md`)](docs/SYSTEM_DEMO.md)
- [Known Limitations & Future Work (`docs/LIMITATIONS.md`)](docs/LIMITATIONS.md)

---

## 7. System Evaluation & Oral Defense Walkthrough

Click the **"System Evaluation Tour"** button in the top navigation bar of the web dashboard for an interactive, 6-step walkthrough designed for an evaluative defense:

1. **The Problem:** Explain how `mem_cgroup_handle_over_high()` stalls lock holders and inflates waiter latency.
2. **The Baseline (Gate 0):** Demonstrate the 100.7× latency jump on stock Linux under cgroup v2.
3. **Existing Workarounds:** Show why `memory.max` (OOM risk) and `memory.reclaim` (37% throughput regression) are inadequate.
4. **The Mechanism:** Walk through the 4-state credit ledger and lazy return-to-user settlement.
5. **Formal Proof:** Demonstrate the 100,000-step invariant fuzzer and memory overshoot upper bound ($N \times d_{\max}$).
6. **Defense Q&A:** Present clear, evidence-based responses to technical questions regarding `memory.max` safety and abuse prevention.
