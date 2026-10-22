# CRISP: Known Limitations, Risks & Unresolved Questions

## 1. Scope of Impact

1. **Collateral Damage is Intra-Cgroup:**
   - A user-space lock held by a throttled thread primarily delays other threads belonging to the same application or cgroup.
   - It rarely affects unrelated neighboring containers on the host (unless they share IPC or database locks).
   - The primary beneficiaries are multithreaded server applications (e.g., MySQL, Redis, custom worker pools) hosted inside memory-constrained containers.

---

## 2. Kernel & Architecture Limitations

1. **Unannotated Inlined Locks:**
   - CRISP requires the critical section to be marked via the shared memory flag word (`crisp_cs_flag`).
   - Inlined atomics, compiler-generated spinloops, and internal glibc allocator locks that lack annotation cannot benefit from deferral unless explicitly instrumented or intercepted.
2. **Accounting Cap vs. Physical Memory Overshoot:**
   - The per-thread cap $d_{\max}$ bounds the *accounting counter* of deferred pages.
   - It does not strictly guarantee that physical page reclaim by the background flusher (`kswapd`) matches the debt rate, although physical overshoot is bounded by $\min(N \times d_{\max}, \text{Pool Size})$.
3. **No Settlement Time Bound under Thread Stagnation:**
   - Under M0, if a thread clears its flag upon unlocking but never returns to user mode via a syscall again, its pending debt remains recorded until task termination.
   - M1 and M3 address this via pool reconciliation and lease timers.
4. **Kernel Audit Scope:**
   - Formal audit is pinned to Linux v6.6 LTS. Newer kernels (Linux 6.12+) incorporate dying-task exemptions and BPF struct_ops that require continuous re-basing.

---

## 3. Methodological & Measurement Constraints

1. **Virtual Machine Jitter:**
   - Measurements performed in virtualized environments (such as WSL2 or QEMU without hardware KVM) exhibit timing jitter.
   - For this reason, headline conclusions rely on **event counts** (throttle sleeps occurring inside critical sections) and relative comparison ratios rather than absolute wall-clock microseconds.
2. **Workload Generality:**
   - While the synthetic C pthread benchmark covers parameterized allocation rates, hold times, and thread contention, real-world database engines (e.g. RocksDB, Postgres) introduce additional I/O and page-cache interactions that warrant further long-term study.
