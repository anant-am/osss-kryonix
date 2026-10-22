# CRISP: Novelty Analysis & Prior-Art Differentiation

## 1. Precise Novelty Claim

> **A bounded, user-signalled deferral of cgroup v2 `memory.high` reclaim and throttling for threads executing inside user-space critical sections, with a provable upper bound on extra memory usage ($\min(N \times d_{\max}, \text{Pool Size})$), evaluated against stock-kernel workarounds and an M/G/1 queueing delay model.**

CRISP does not claim to invent cgroup throttling, priority inheritance, or user-space critical section marking. Its core contribution is identifying and quantifying the collateral damage of `memory.high` on user-space locks and providing a mathematically bounded deferral mechanism.

---

## 2. Prior-Art Comparison Matrix

| System / Proposal | What It Covers | What It Leaves Open (CRISP Gap) |
| :--- | :--- | :--- |
| **CFS Return-to-User Quota Deferral (Linux 6.18)** | Moves CPU quota throttling to task work on return to user mode to prevent deadlocking *kernel* locks. | Has zero awareness of *user-space* locks (`pthread_mutex_t`). Deals with CPU time slices, not memory pressure. |
| **Meta `memcg_ext` (LSF/MM/BPF 2026)** | Lock-aware throttling for kernel threads stuck in memcg reclaim; BPF struct_ops hooks for cgroup delays. | Focused on kernel-level locks and cluster-level BPF policies. Does not provide user-space lock marking or credit conservation. |
| **Restartable Sequences (`rseq`)** | User-space critical section registration allowing the kernel to extend CPU preemption slices or abort on migration. | CPU execution slice only. Completely unrelated to memory throttling or cgroup reclaim penalties. |
| **Weiner's Synchronous `memory.high` Principle** | Architectural rule that `memory.high` must be enforced synchronously to keep containers strictly contained. | Weiner's objection was that lazy enforcement allows unbounded memory overshoot. **CRISP answers this objection directly** with a provable cap ($d_{\max}$). |
| **Priority-Inheritance Mutexes (futex PI)** | Elevates CPU scheduling priority of lock holders when higher-priority threads block. | Priority inheritance addresses CPU scheduling, not memory reclaim sleeps. A high-priority lock holder still stalls in memory throttling. |

---

## 3. Verified Sources vs. Unverified Leads

- **Verified Source:** Linux v6.6 `mm/memcontrol.c` and `include/linux/resume_user_mode.h`.
- **Verified Source:** Linux 2022 commit synchronously enforcing `memory.high` on large overcharges.
- **Verified Source:** Linux `memory.reclaim` proactive cgroup v2 interface (Johannes Weiner).
- **Unverified Lead:** Meta's internal memcg lock-aware prototypes (discussed in conference proposals, but no public user-space API exists).
- **Status:** Evaluated as an academic course project. Patentability is not pursued due to public discussions in LKML and prior-art exposure.
