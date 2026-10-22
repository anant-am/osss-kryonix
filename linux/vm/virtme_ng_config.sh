#!/usr/bin/env bash
# CRISP Virtme-ng & QEMU Kernel Boot Environment Config
# Boot a minimal test kernel with CONFIG_MEMCG and CRISP patch applied

set -euo pipefail

KERNEL_VERSION="6.6.21"
KERNEL_DIR="linux-6.6"

echo "=== CRISP Kernel Verification with virtme-ng ==="

# Check for virtme-ng
if ! command -v vng &> /dev/null; then
    echo "[!] virtme-ng (vng) is not installed. Install via: pip install virtme-ng"
    echo "    Continuing with QEMU instructions..."
fi

# Kernel Configuration Fragment required for cgroup v2 & memcg
cat << 'EOF' > crisp_kconfig_fragment.config
CONFIG_CGROUPS=y
CONFIG_CGROUP_FREEZER=y
CONFIG_CGROUP_PIDS=y
CONFIG_CGROUP_DEVICE=y
CONFIG_CPUSETS=y
CONFIG_PROC_PID_CPUSET=y
CONFIG_MEMCG=y
CONFIG_MEMCG_SWAP=y
CONFIG_MEMCG_KMEM=y
CONFIG_PAGE_COUNTER=y
CONFIG_POSIX_MQUEUE=y
CONFIG_PREEMPT=y
CONFIG_MEMCG_CRISP=y
EOF

echo "[*] Saved Kconfig fragment to crisp_kconfig_fragment.config"
echo "[*] To build and boot under virtme-ng (isolated micro-VM):"
echo "    vng --build --kconfig crisp_kconfig_fragment.config"
echo "    vng --run --cpus 4 --memory 2G"
