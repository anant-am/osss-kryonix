# CRISP: Threat, Safety, and Abuse Model

## 1. Safety Principles & System Boundaries

Operating system resource deferrals inherently risk abuse if applications can avoid paying resource penalties or starve the system of memory. CRISP is engineered around five strict safety bounds:

---

## 2. Threat Analysis & Abuse Vectors

### Threat T1: The Malicious / Broken Application Never Clears the Flag
* **Attack Scenario:** A thread enters a critical section, sets its user-space flag word, but never clears the flag (e.g. Due to bug, infinite loop, or malicious intent to avoid throttling).
* **CRISP Defense:** 
  1. The thread can defer at most $d_{\max}$ pages (e.g. 32 pages / 128 KiB).
  2. Once the thread's accumulated debt counter reaches $d_{\max}$, **inline synchronous enforcement is restored immediately**.
  3. Every subsequent allocation beyond $d_{\max}$ runs `mem_cgroup_handle_over_high()` synchronously, paying the normal reclaim and sleep penalty regardless of the flag.
  4. The unbounded avoidance attack is completely neutralized.

---

### Threat T2: Thread Churn Attack (Allocate, Defer, and Exit)
* **Attack Scenario:** A process spawns thousands of short-lived threads. Each thread enters a critical section, allocates up to $d_{\max}$ pages, defers the penalty, and immediately exits before returning to user mode.
* **CRISP Defense:**
  - **Under M0:** Any unpaid debt remaining upon thread termination is settled during task exit work (`do_exit()` / `exit_mm()`) where memory uncharging triggers settlement or uncharges the pages.
  - **Under M1:** The per-cgroup shared credit pool charges the thread upon deferral. If the thread terminates, its credit is either settled or returned to the pool during mm cleanup. Total system overshoot is physically capped by the cgroup pool size (e.g. 256 pages).

---

### Threat T3: Sleep Clamping Advantage
* **Attack Scenario:** Because the kernel clamps total sleep per call to 2,000 ms, deferring multiple smaller charges into one large settled batch could yield a shorter aggregate sleep time than multiple individual sleeps ($T_{\text{clamped}}(\sum n) < \sum T(n)$).
* **CRISP Defense:**
  - In practice, individual throttle penalties below 10 ms are skipped by the kernel anyway. For large overages, settlement charges are computed on accumulated pages.
  - In M1 and M2, settlement iterates direct reclaim until progress halts or the debt is satisfied, preventing bypass of actual reclaim work.

---

### Threat T4: System-Wide Memory Exhaustion & OOM Starvation
* **Attack Scenario:** Does deferring memory throttling risk triggering out-of-memory (OOM) conditions for the system or neighboring cgroups?
* **CRISP Defense:**
  - **`memory.max` is 100% UNTOUCHED:** CRISP modifies only the soft `memory.high` path. The hard `memory.max` boundary and the kernel OOM killer remain identical to stock Linux.
  - If cgroup usage hits `memory.max`, the thread is halted or killed by the OOM killer instantly, with zero deferral permitted.
  - **Provable Overshoot Upper Bound:** Extra cgroup usage above `memory.high` is strictly bounded by:
    $$\Delta \text{Memory}_{\max} \le \min(N_{\text{active threads}} \times d_{\max}, \text{Pool Size})$$
    For 4 threads with $d_{\max} = 32$ pages (4 KiB/page), maximum overshoot is **512 KiB**. This is negligible compared to standard container memory limits (hundreds of megabytes).

---

## 3. Host Safety & Execution Sandboxing

1. **No Automatic Host Modification:** CRISP never modifies the host kernel or replaces daily operating systems.
2. **Subtree Isolation:** In Linux/WSL2, all benchmarks run in a dedicated, disposable child cgroup (e.g. `/sys/fs/cgroup/crisp_test_...`) with automatic cleanup.
3. **Restricted Backend Execution:** The backend API accepts only allowlisted scenario parameters and executes pre-compiled benchmark binaries; arbitrary shell commands from the browser are rejected.
