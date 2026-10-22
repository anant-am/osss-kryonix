# CRISP-L: Experimental Reproducibility Guide

## 1. Experimental Environment Specifications

All empirical results reported in the CRISP-L evaluation were gathered using a reproducible virtualized and bare-metal environment under the following standardized baseline parameters:

| Component | Specification |
| :--- | :--- |
| **Operating System** | Ubuntu 22.04 LTS (Jammy Jellyfish) / Debian 12 |
| **Linux Kernel** | Linux 6.6.15 LTS x86_64 (Vanilla + CRISP-L Patch) |
| **Hypervisor / QEMU** | QEMU emulator version 8.2.2 with KVM acceleration |
| **CPU Emulation** | `-cpu host,smp=8,cores=8,threads=1` |
| **Memory Allocation** | 4096 MB RAM (`-m 4G`) |
| **cgroup Subsystem** | Unified cgroups v2 mounted at `/sys/fs/cgroup` |
| **C Compiler** | GCC 12.3.0 (`-O2 -pthread -std=c11 -Wall`) |
| **Python Runtime** | Python 3.11.8 with `uvicorn`, `fastapi`, `pytest` |

---

## 2. cgroup v2 Configuration Script

To configure the memory boundary hierarchy and reproduce the exact throttle threshold conditions:

```bash
#!/usr/bin/env bash
set -euo pipefail

# 1. Enable memory controller in root cgroup
echo "+memory" | sudo tee /sys/fs/cgroup/cgroup.subtree_control

# 2. Create CRISP benchmark cgroup
sudo mkdir -p /sys/fs/cgroup/crisp_bench
cd /sys/fs/cgroup/crisp_bench

# 3. Configure memory limits (Memory pressure boundary)
# Set high threshold to 64MB and hard max to 128MB
echo "67108864" | sudo tee memory.high      # 64 MB
echo "134217728" | sudo tee memory.max     # 128 MB

# 4. Attach current shell to cgroup
echo $$ | sudo tee cgroup.procs
```

---

## 3. Standardized Workload Scenarios

The evaluation leverages three standardized stress scenarios:

- **Workload A (Fast Mutex / Low Critical Hold)**:
  - Threads: 4
  - Lock duration: $15\ \mu\text{s}$ per iteration
  - Critical allocations: 64 KB per acquisition
  - External allocations: 512 KB outside critical section
- **Workload B (Synthetic Lock Convoy / Medium Contention)**:
  - Threads: 8
  - Lock duration: $120\ \mu\text{s}$ per iteration
  - Critical allocations: 256 KB per acquisition
  - Demonstrates typical database or server engine buffer-pool lock churn.
- **Workload C (High Contention Churn / Severe Pressure)**:
  - Threads: 16
  - Lock duration: $450\ \mu\text{s}$ per iteration
  - Critical allocations: 1 MB per acquisition
  - Induces deep lock convoys with $p99$ tail latency up to $629\ \text{ms}$ on stock Linux.

---

## 4. Step-by-Step Reproduction Procedure

### Step 1: Clone and Build Workload
```bash
git clone https://github.com/anant-am/osss-kryonix.git
cd osss-kryonix/linux/workload
gcc -O2 -pthread -std=c11 mutex_alloc_workload.c -o mutex_alloc_workload
```

### Step 2: Execute Stock Baseline (B0)
```bash
./mutex_alloc_workload \
  --scenario W2 \
  --policy B0 \
  --threads 8 \
  --duration 5 \
  --output ../../results/qemu_b0_wb.json
```

### Step 3: Execute CRISP-L Deferral (M0)
```bash
./mutex_alloc_workload \
  --scenario W2 \
  --policy M0 \
  --threads 8 \
  --duration 5 \
  --output ../../results/qemu_crisp_wb.json
```

### Step 4: Compare Latency Distributions
```bash
python3 ../../benchmarks/analysis/stats.py \
  --baseline ../../results/qemu_b0_wb.json \
  --target ../../results/qemu_crisp_wb.json
```

---

## 5. Documented Scientific Caveats

When reproducing these experiments, note the 8 documented scientific findings:
1. **QEMU Emulation Jitter**: Software clock virtualization in QEMU introduces $\pm 4\%$ variance on absolute timing compared to bare-metal silicon.
2. **Throttle Payment Parity Anomaly**: In specific fast-exit loops, memory pressure naturally relaxed before return-to-userland settlement began, resulting in lower total sleep time than stock Linux.
3. **No-Cap Overshoot**: Ablation without cap ($d_{\max} = \infty$) triggers transient cgroup memory overshoots up to 42 MB, demonstrating why $d_{\max}$ is strictly necessary.
