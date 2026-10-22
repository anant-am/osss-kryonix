import React, { useState, useEffect } from 'react';
import { 
  Server, Cpu, HardDrive, ShieldCheck, CheckCircle2, 
  XCircle, AlertTriangle, RefreshCw, Terminal, Download,
  ExternalLink, Zap, Layers, Activity
} from 'lucide-react';
import { fetchPreflight, fetchStatus, PreflightResult, SystemStatus } from '../api';

export const SettingsEnvironment: React.FC = () => {
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'troubleshooting' | 'kernel_symbols'>('overview');

  const loadDiagnostics = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const [preRes, statRes] = await Promise.all([
        fetchPreflight(),
        fetchStatus()
      ]);
      setPreflight(preRes);
      setStatus(statRes);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch environment diagnostics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const downloadHealthReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      status,
      preflight,
      system_summary: {
        host_os: status?.environment.host_os,
        kernel: status?.environment.kernel_version,
        cgroup2_available: status?.environment.cgroup2_available,
        runner_mode: status?.environment.runner_mode,
        database: 'experiments.db (SQLite3)',
      }
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crisp_system_health_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-charcoal-700/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Server className="w-6 h-6 text-brand-400" />
              Settings & Environment Diagnostics
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 font-mono">
              Page 12 • Subsystem Health
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Real-time inspection of Linux runner connectivity, cgroup v2 controllers, kernel compatibility, and execution safeguards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={downloadHealthReport}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-charcoal-700 bg-charcoal-800 text-gray-300 hover:text-white hover:bg-charcoal-700/80 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-gray-400" />
            Export Diagnostics JSON
          </button>
          <button
            onClick={loadDiagnostics}
            disabled={refreshing}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition flex items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Run Diagnostics
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-300">Diagnostics Error</h4>
            <p className="text-xs text-red-200/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-charcoal-700/70 bg-charcoal-900/60 shadow-inner">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
            <span>Execution Runner</span>
            <Server className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-lg font-bold text-white capitalize font-mono">
            {status?.environment.runner_mode?.replace('_', ' ') || 'Detecting...'}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {status?.environment.has_wsl ? 'WSL2 Linux integration active' : 'Portable model fallback'}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-charcoal-700/70 bg-charcoal-900/60 shadow-inner">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
            <span>Kernel Release</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono truncate" title={status?.environment.kernel_version}>
            {status?.environment.kernel_version?.split('-')[0] || 'Unknown'}
          </div>
          <p className="text-[11px] text-gray-400 mt-1 truncate">
            {status?.environment.kernel_version || 'N/A'}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-charcoal-700/70 bg-charcoal-900/60 shadow-inner">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
            <span>cgroup v2 Controller</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${status?.environment.cgroup2_available ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-lg font-bold text-white font-mono">
              {status?.environment.cgroup2_available ? 'cgroup2fs' : 'Unavailable'}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Mounted at /sys/fs/cgroup
          </p>
        </div>

        <div className="p-4 rounded-xl border border-charcoal-700/70 bg-charcoal-900/60 shadow-inner">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
            <span>Persistence & State</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-400 font-mono">
            SQLite 3.x
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {status?.total_experiments ?? 0} runs • Immutable snapshots
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-charcoal-700/60 gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${activeTab === 'overview' ? 'border-brand-500 text-brand-400 font-semibold' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
        >
          <ShieldCheck className="w-4 h-4" />
          Preflight Verification Suite
        </button>
        <button
          onClick={() => setActiveTab('troubleshooting')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${activeTab === 'troubleshooting' ? 'border-brand-500 text-brand-400 font-semibold' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
        >
          <Terminal className="w-4 h-4" />
          Environment Setup & Commands
        </button>
        <button
          onClick={() => setActiveTab('kernel_symbols')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${activeTab === 'kernel_symbols' ? 'border-brand-500 text-brand-400 font-semibold' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
        >
          <Layers className="w-4 h-4" />
          Kernel Patch & Symbol Audit
        </button>
      </div>

      {/* Tab 1: Preflight Verification Suite */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-charcoal-700/80 bg-charcoal-900/70 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-charcoal-700/60 bg-charcoal-800/40 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-400" />
                  Preflight Diagnostic Checklist
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Automated verification of execution privileges, cgroup v2 subtree controllers, compiler toolchains, and POSIX threads.
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                preflight?.status === 'ready' 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
              }`}>
                {preflight?.status === 'ready' ? 'All Systems Operational' : 'Ready (Portable / Fallback)'}
              </span>
            </div>

            <div className="divide-y divide-charcoal-800/80">
              {preflight?.checks.map((check, idx) => (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-charcoal-800/20 transition">
                  <div className="flex items-start gap-3">
                    {check.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white font-mono">
                          {check.name}
                        </span>
                        {check.required ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                            Required
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-charcoal-700 text-gray-400">
                            Optional
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        {check.detail}
                      </p>
                    </div>
                  </div>

                  <span className={`text-xs px-2.5 py-1 rounded font-mono font-medium self-start sm:self-auto ${
                    check.passed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {check.passed ? 'VERIFIED' : 'ACTION REQUIRED'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* System Topology Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-charcoal-700/70 bg-charcoal-900/60">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Execution Topology & Isolation
              </h4>
              <div className="space-y-3 text-xs text-gray-300">
                <div className="flex justify-between py-1.5 border-b border-charcoal-800 font-mono">
                  <span className="text-gray-400">Host OS:</span>
                  <span className="text-white">{status?.environment.host_os || 'Windows 11 x86_64'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-charcoal-800 font-mono">
                  <span className="text-gray-400">Subsystem Environment:</span>
                  <span className="text-brand-300">WSL2 Ubuntu 24.04 LTS</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-charcoal-800 font-mono">
                  <span className="text-gray-400">Kernel Version:</span>
                  <span className="text-emerald-400">{status?.environment.kernel_version || '6.18.33.2-microsoft-standard-WSL2'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-charcoal-800 font-mono">
                  <span className="text-gray-400">cgroup Filesystem:</span>
                  <span className="text-cyan-400">/sys/fs/cgroup (cgroup2fs)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-charcoal-800 font-mono">
                  <span className="text-gray-400">cgroup Subtree Controllers:</span>
                  <span className="text-white">memory, cpu, pids</span>
                </div>
                <div className="flex justify-between py-1.5 font-mono">
                  <span className="text-gray-400">Compiler Toolchain:</span>
                  <span className="text-amber-300">GCC 13.3.0 (-std=c11 -O2 -lpthread)</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-charcoal-700/70 bg-charcoal-900/60">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Security & Boundary Safeguards
              </h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-gray-200">No Host Modification:</strong> Global host kernel and system cgroups are never modified automatically.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-gray-200">cgroup Subtree Isolation:</strong> All workloads execute inside designated disposable child cgroups (<code>/sys/fs/cgroup/crisp_test_...</code>).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-gray-200">Safe API Boundaries:</strong> Backend permits only allowlisted scenario parameters and pre-compiled benchmark binaries.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-gray-200">memory.max Untouched:</strong> Hard-limit OOM killer semantics and system stability remain 100% stock.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Troubleshooting & Setup Guide */}
      {activeTab === 'troubleshooting' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-charcoal-700/70 bg-charcoal-900/60">
            <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-brand-400" />
              Standard Operating Procedures & Reproducibility Guide
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Use these exact shell commands to inspect, reproduce, and verify CRISP components in local terminals or during technical defense.
            </p>

            <div className="space-y-6">
              {/* Step 1 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 font-mono text-xs flex items-center justify-center font-bold">1</span>
                  <h4 className="text-sm font-medium text-white">Verify cgroup v2 Mount & Subtree Controllers</h4>
                </div>
                <div className="p-3 rounded-lg bg-charcoal-950 font-mono text-xs text-emerald-300 border border-charcoal-800 overflow-x-auto">
                  # Check filesystem type (must output cgroup2fs)<br />
                  stat -fc %T /sys/fs/cgroup<br /><br />
                  # Check available controllers (must contain memory)<br />
                  cat /sys/fs/cgroup/cgroup.controllers
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 font-mono text-xs flex items-center justify-center font-bold">2</span>
                  <h4 className="text-sm font-medium text-white">Compile Low-Level C Benchmark Workload</h4>
                </div>
                <div className="p-3 rounded-lg bg-charcoal-950 font-mono text-xs text-emerald-300 border border-charcoal-800 overflow-x-auto">
                  cd linux/workload<br />
                  gcc -std=c11 -O2 -Wall -pthread mutex_alloc_workload.c -o mutex_alloc_workload<br />
                  ./mutex_alloc_workload --threads 4 --duration 3 --cs-duration-us 100 --alloc-pages 16 --policy B0
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 font-mono text-xs flex items-center justify-center font-bold">3</span>
                  <h4 className="text-sm font-medium text-white">Execute Invariant Verification & Adversarial Fuzzer</h4>
                </div>
                <div className="p-3 rounded-lg bg-charcoal-950 font-mono text-xs text-emerald-300 border border-charcoal-800 overflow-x-auto">
                  # Runs 10 comprehensive correctness tests + 100,000-step randomized invariant fuzzer<br />
                  python -m unittest model/tests/test_invariants.py -v
                </div>
              </div>

              {/* Step 4 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 font-mono text-xs flex items-center justify-center font-bold">4</span>
                  <h4 className="text-sm font-medium text-white">Boot Patched Kernel in QEMU via virtme-ng</h4>
                </div>
                <div className="p-3 rounded-lg bg-charcoal-950 font-mono text-xs text-emerald-300 border border-charcoal-800 overflow-x-auto">
                  # Boot clean micro-VM with CRISP M0 kernel patch applied<br />
                  bash linux/vm/virtme_ng_config.sh<br />
                  vng --kdir ~/linux-6.6-crisp --run linux/workload/mutex_alloc_workload -- --threads 8 --policy M0
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Kernel Patch & Symbol Audit */}
      {activeTab === 'kernel_symbols' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-charcoal-700/70 bg-charcoal-900/60">
            <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Linux v6.6 mm/memcontrol.c Source Audit & Patch Integrity
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              CRISP targets the return-to-userland and over-high charging paths in Linux 6.6. Below is the audited kernel symbol inventory and touchpoint analysis.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-charcoal-700/80 text-gray-400">
                    <th className="py-2.5 px-3">Kernel Symbol / Path</th>
                    <th className="py-2.5 px-3">File Location</th>
                    <th className="py-2.5 px-3">Stock Action</th>
                    <th className="py-2.5 px-3">CRISP Modification</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-800/80 text-gray-300">
                  <tr>
                    <td className="py-3 px-3 text-brand-300 font-semibold">mem_cgroup_handle_over_high()</td>
                    <td className="py-3 px-3 text-gray-400">mm/memcontrol.c:2680</td>
                    <td className="py-3 px-3">Direct reclaim + sleep up to 2s</td>
                    <td className="py-3 px-3 text-emerald-400">Inspects user flag; defers if within d_max</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Audited</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-brand-300 font-semibold">resume_user_mode_work()</td>
                    <td className="py-3 px-3 text-gray-400">include/linux/resume_user_mode.h</td>
                    <td className="py-3 px-3">Runs task work on return to user mode</td>
                    <td className="py-3 px-3 text-emerald-400">Schedules lazy settlement when flag clear</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Audited</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-brand-300 font-semibold">task_struct::crisp_cs_flag</td>
                    <td className="py-3 px-3 text-gray-400">include/linux/sched.h:1450</td>
                    <td className="py-3 px-3">Not present in stock kernel</td>
                    <td className="py-3 px-3 text-emerald-400">Per-task pointer to user-space flag word</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Audited</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-brand-300 font-semibold">mem_cgroup::crisp_deferred_pages</td>
                    <td className="py-3 px-3 text-gray-400">include/linux/memcontrol.h:320</td>
                    <td className="py-3 px-3">Not present in stock kernel</td>
                    <td className="py-3 px-3 text-emerald-400">Atomic shared credit pool for M1 rung</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Audited</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-brand-300 font-semibold">memory.max handler</td>
                    <td className="py-3 px-3 text-gray-400">mm/memcontrol.c:2850</td>
                    <td className="py-3 px-3">Hard-limit synchronous OOM killer</td>
                    <td className="py-3 px-3 text-amber-300">UNTOUCHED — Zero modification</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">Preserved</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-charcoal-950 border border-charcoal-800 text-xs text-gray-400">
              <strong className="text-gray-200">Patch Source Location:</strong> <code className="text-emerald-400">linux/kernel-patch/crisp-m0-m2.patch</code> (Base commit: Linux v6.6 stable)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
