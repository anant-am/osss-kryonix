# CRISP: Linux Kernel Compatibility & Source Audit

## 1. Reference Kernel & Source Audit

CRISP targets the Linux kernel memory controller subsystem in `mm/memcontrol.c`. The formal code audit was performed against **Linux v6.6 LTS**.

### 1.1 Key Kernel Symbols & Call Paths

```
Allocating Task Context:
  handle_mm_fault()
    -> __handle_mm_fault()
      -> try_charge()
        -> mem_cgroup_charge()
          -> if (cgroup_over_high(memcg)) {
               task->over_high_counter += batch;
               set_notify_resume(task);
               if (counter > batch) mem_cgroup_handle_over_high();
             }

Return-to-User Mode Callback:
  arch_exit_to_user_mode_prepare()
    -> resume_user_mode_work()
      -> mem_cgroup_handle_over_high()
           1. Direct memory reclaim
           2. Calculate penalty T = min(2000, 64 * rho^2 * n / B)
           3. If (T > 10ms) schedule_timeout_killable(T);
```

---

## 2. Kernel Version Differences

| Kernel Version | Throttling Mechanics | CRISP Compatibility | Notes |
| :--- | :--- | :--- | :--- |
| **Linux v6.6 LTS (Target)** | Synchronous inline call on overcharge + return-to-user callback | **Full Support** | Base commit for `crisp-m0-m2.patch`. Verified penalty formula and shifts. |
| **Linux v6.1 - v6.5** | Earlier iteration of over-high charge batching | Compatible | Same core symbols; minor batch size differences. |
| **Linux v6.8 - v6.12** | Dying task throttle exemption patch (Jan 2024) | Compatible | Requires minor offset adjustments in `mm/memcontrol.c`. |
| **Linux 6.18+ (Current)** | CFS return-to-user quota deferral patch series | Compatible | CRISP flag can align with scheduler return-to-user hooks. |

---

## 3. Patch Architecture: `crisp-m0-m2.patch`

The patch introduces minimal, highly targeted changes:

1. **`include/linux/sched.h`**:
   - Adds `unsigned long *crisp_cs_flag;` to `struct task_struct`.
   - Adds `unsigned int crisp_deferred_pages;` to `struct task_struct`.
2. **`include/linux/memcontrol.h`**:
   - Adds `atomic_t crisp_deferred_pool;` to `struct mem_cgroup` for M1 rung.
3. **`mm/memcontrol.c`**:
   - In `mem_cgroup_handle_over_high()`:
     ```c
     /* CRISP M0: Check user-space critical section flag */
     if (current->crisp_cs_flag && *current->crisp_cs_flag != 0) {
         if (current->crisp_deferred_pages < CRISP_PER_TASK_CAP) {
             /* Defer penalty: keep debt, skip reclaim & sleep */
             current->crisp_deferred_pages += nr_pages;
             return;
         }
     }
     ```
   - In settlement path (`resume_user_mode_work` when flag is 0):
     - Executes deferred reclaim and sleeps outside the lock.

---

## 4. Isolation & Micro-VM Execution via virtme-ng

To prevent modification of the developer's daily workstation:
- The patched kernel is compiled and booted in an isolated QEMU micro-VM using `virtme-ng`.
- Configuration script provided at `linux/vm/virtme_ng_config.sh`.
- Kconfig chunk enables `CONFIG_MEMCG=y`, `CONFIG_MEMCG_SWAP=y`, `CONFIG_CGROUP_V2=y`, `CONFIG_PREEMPT=y`.
