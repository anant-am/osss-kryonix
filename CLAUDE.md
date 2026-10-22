# CRISP Project Rules

- **Linux-only code lives in `linux/`**: Everything else (`model/`, `benchmarks/analysis/`, `backend/`, `frontend/`) must run on macOS and Windows with no Linux APIs.
- **Host Safety**: Never run cgroup, kernel, or tracing commands on the Windows/macOS host. Run them in the Linux VM / WSL2 through `make linux-<target>` or the automated WSL runner.
- **Testing Integrity**: Every change needs a test or a measurement script. Keep `make test` green on both OSes.
- **Reproducibility**: Do not claim a result without a script that regenerates it (`make results`).
- **Measurement Provenance**: Record kernel version, VM settings, host load, and execution category (`simulated`, `stock_linux_measured`, `patched_kernel_measured`, `recorded_demonstration_artifact`) with every measurement.
- **Kernel Patch Isolation**: Keep the kernel patch (`linux/kernel-patch/`) strictly documented and isolated with a verified base commit (Linux v6.6).
- **Scientific Honesty**: Never invent measured latency improvements or hide failed gates. If Gate 0 or Gate 1 fails or shows trade-offs (e.g. increased memory usage or throughput regression), report them transparently.
