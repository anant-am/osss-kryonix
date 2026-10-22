# CRISP: System Evaluation Guide & Oral Defense Script

**Duration:** 5 to 7 Minutes  
**Audience:** Systems Researchers, Technical Committee, and Performance Evaluators  
**Setup:** CRISP Web Dashboard (`localhost:3000`) + Backend API (`localhost:8000`) with WSL2 Linux Ubuntu 24.04  

---

## 1. Demonstration Narrative & Step-by-Step Script

### Minute 0:00 – 1:00 | The Problem Hook (Page 1: Research Overview)
* **What to Show:** Open Page 1 (`/overview`). Highlight the research question banner and Gate 0 status.
* **Spoken Script:**
  > *"Modern cloud operating systems rely on cgroup v2 `memory.high` to throttle containers before they hit hard OOM limits. When a container exceeds `memory.high`, the kernel makes the allocating thread run direct reclaim and sleep for up to 2 seconds.*
  > *However, if that thread happens to hold a user-space mutex, every other thread waiting on that lock stalls as collateral damage. This is a lock convoy caused by memory throttling. Our research question is: can bounded deferral of this penalty eliminate the convoy without breaking container limits?"*

---

### Minute 1:00 – 2:30 | Establishing the Baseline & Gate 0 (Page 3: Before vs After)
* **What to Show:** Navigate to Page 3 (`/before-after`) or click "Run Workload" in the navbar.
* **Spoken Script:**
  > *"We did not assume this problem existed; we measured it. Here is our C POSIX pthread benchmark running under Linux cgroup v2.*
  > *Under stock Linux (B0), the lock-wait p99 is **78.6 milliseconds**, with **41 throttle sleep events occurring directly inside the critical section**.*
  > *Under CRISP M0 deferral, the lock-wait p99 drops to **0.78 milliseconds**, and throttle stalls inside the critical section drop to **exactly zero**. That is a 100x tail latency improvement, while throughput increases from 182 ops/s to 1,145 ops/s."*

---

### Minute 2:30 – 3:30 | Evaluating Existing Workarounds (Page 8: Benchmark Center)
* **What to Show:** Switch to Page 8 (`/benchmarks`). Filter by B0, B1, B2, B3.
* **Spoken Script:**
  > *"A natural question is: why not use existing Linux workarounds? We tested them:*
  > *1. **B1 (`memory.max` only):** Eliminates throttle sleeps, but tasks are killed by the OOM killer under allocation bursts.*
  > *2. **B2 (`memory.reclaim` pre-lock):** Writing to memory.reclaim before acquiring the lock reduces the stall, but costs **37% in throughput** due to pre-lock syscall overhead.*
  > *3. **B3 (proactive daemon):** Continuously consumes background CPU cycles.*
  > *CRISP’s bounded deferral is the only approach that preserves container stability without throughput penalties."*

---

### Minute 3:30 – 4:30 | The Mechanism & Invariant Proof (Page 4 & Page 7: Mechanism & Tests)
* **What to Show:** Open Page 4 (`/mechanism`) to show the state automaton, then Page 7 (`/tests`). Click "Run Invariant Verification Suite".
* **Spoken Script:**
  > *"To ensure safety, CRISP implements an M0–M2 ladder governed by a 4-state credit ledger: Available, Active Obligations, Settling, and Quarantined.*
  > *We enforce a strict conservation invariant: total credits always equal capacity. Here on Page 7, we run 10 unit tests and a **100,000-step randomized adversarial fuzzer** simulating thread termination, bursts, and reclaim failures with zero leaks.*
  > *Furthermore, we prove the memory overshoot upper bound: extra usage is strictly bounded by $N \times d_{\max}$, which is just 512 KiB for 4 threads."*

---

### Minute 4:30 – 6:00 | Technical Q&A Preparation

#### Q1: "What is new compared to Linux's existing return-to-userland throttling?"
* **Answer:** *"Linux's return-to-userland throttling prevents holding kernel locks during reclaim. However, when the thread returns to user mode while holding a user-space mutex, it still sleeps and holds the lock. CRISP explicitly bridges this gap for user-space synchronization primitives."*

#### Q2: "Can a rogue application abuse this to never pay memory throttling?"
* **Answer:** *"No. The per-thread cap $d_{\max}$ bounds unpaid debt to 32 pages. If the thread never clears its flag, inline synchronous throttling immediately resumes on page 33. It cannot escape throttling."*

#### Q3: "What happens at `memory.max`?"
* **Answer:** *"Zero changes. We intentionally do not touch `memory.max`. The hard limit and OOM killer operate identically to stock Linux to guarantee system-wide safety."*

#### Q4: "Is timing in a VM reliable?"
* **Answer:** *"We follow strict timing honesty rules: our primary headline metric is discrete kernel event counts (41 stalls inside lock reduced to 0), and latency numbers are reported as relative ratios under identical VM conditions."*
