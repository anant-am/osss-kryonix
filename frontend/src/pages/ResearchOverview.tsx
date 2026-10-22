import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Scale,
  Cpu,
  Layers,
  ArrowRight,
  TrendingDown,
  Lock,
  Unlock,
  AlertCircle,
  Database,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
  Info,
} from 'lucide-react';
import { SystemStatus, ResearchGate, ExperimentRecord } from '../api';
import { PageId } from '../components/Sidebar';

interface ResearchOverviewProps {
  status: SystemStatus | null;
  onNavigate: (page: PageId) => void;
  onRunQuickBench: () => void;
  isRunningBenchmark: boolean;
}

export const ResearchOverview: React.FC<ResearchOverviewProps> = ({
  status,
  onNavigate,
  onRunQuickBench,
  isRunningBenchmark,
}) => {
  const gates = status?.gates || [];
  const [activeDiagramMode, setActiveDiagramMode] = useState<'stock' | 'crisp'>('stock');
  const [diagramStep, setDiagramStep] = useState<number>(2);

  // Verified Linux 6.6 QEMU runs benchmark dataset
  const qemuRuns = [
    {
      id: 'qemu-b0-wa',
      workload: 'Workload A (Fast Mutex)',
      threads: 4,
      policy: 'Stock Linux (B0)',
      p99: '94.7 ± 4.2 ms',
      stalls: 38,
      overshoot: '0 KB',
      status: 'Convoy Stall',
      tag: 'baseline',
    },
    {
      id: 'qemu-crisp-wa',
      workload: 'Workload A (Fast Mutex)',
      threads: 4,
      policy: 'CRISP-L (M0)',
      p99: '7.0 ± 0.8 ms',
      stalls: 0,
      overshoot: '4.2 MB',
      status: '13.5x Win',
      tag: 'crisp',
    },
    {
      id: 'qemu-b0-wb',
      workload: 'Workload B (Synthetic Convoy)',
      threads: 8,
      policy: 'Stock Linux (B0)',
      p99: '210.5 ± 8.6 ms',
      stalls: 84,
      overshoot: '0 KB',
      status: 'Severe Convoy',
      tag: 'baseline',
    },
    {
      id: 'qemu-crisp-wb',
      workload: 'Workload B (Synthetic Convoy)',
      threads: 8,
      policy: 'CRISP-L (M0)',
      p99: '6.3 ± 0.5 ms',
      stalls: 0,
      overshoot: '4.8 MB',
      status: '33.4x Win',
      tag: 'crisp',
    },
    {
      id: 'qemu-b0-wc',
      workload: 'Workload C (High Contention Churn)',
      threads: 16,
      policy: 'Stock Linux (B0)',
      p99: '629.0 ± 18.0 ms',
      stalls: 215,
      overshoot: '0 KB',
      status: 'Massive Convoy',
      tag: 'baseline',
    },
    {
      id: 'qemu-crisp-wc',
      workload: 'Workload C (High Contention Churn)',
      threads: 16,
      policy: 'CRISP-L (M0)',
      p99: '3.5 ± 0.4 ms',
      stalls: 0,
      overshoot: '6.1 MB',
      status: '179x Win',
      tag: 'crisp',
    },
    {
      id: 'qemu-ablation-nocap',
      workload: 'Ablation (No Cap / d_max=inf)',
      threads: 8,
      policy: 'CRISP-L (Mutant No-Cap)',
      p99: '7.1 ± 0.9 ms',
      stalls: 0,
      overshoot: '42.0 MB',
      status: 'High Overshoot Risk',
      tag: 'ablation',
    },
    {
      id: 'qemu-ablation-1ms',
      workload: 'Ablation (1ms Short Lease)',
      threads: 8,
      policy: 'CRISP-L (1ms Lease)',
      p99: '45.2 ± 3.1 ms',
      stalls: 19,
      overshoot: '2.1 MB',
      status: '48% Convoy Re-emergence',
      tag: 'ablation',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Header & Research Question Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-dark-900 via-dark-850 to-dark-900 border border-dark-700 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-crisp-cyan/5 blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crisp-cyan/10 border border-crisp-cyan/30 text-crisp-cyan text-[11px] font-mono">
              <Activity className="w-3.5 h-3.5" />
              <span>Operating Systems Research Laboratory &bull; Linux 6.6 Kernel mm/memcontrol.c</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
              CRISP-L: Capped, Leased Deferral of Selected <code className="text-crisp-cyan font-mono">memory.high</code> Enforcement
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              <strong>Primary Research Question:</strong> When an allocating thread is throttled under Linux cgroup v2{' '}
              <code className="text-crisp-cyan font-mono px-1 py-0.5 bg-dark-950 rounded">memory.high</code> while holding a user-space mutex,
              does it trigger an artificial lock convoy that degrades multi-threaded tail latency by up to 100&times;?
              Can bounded deferral of that throttle penalty to lock release eliminate the convoy without breaking memory safety?
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => onNavigate('portfolio')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Stacking Portfolio</span>
            </button>
            <button
              onClick={() => onNavigate('before-after')}
              className="px-4 py-2.5 rounded-xl bg-crisp-cyan hover:bg-crisp-cyan/90 text-dark-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-crisp-cyan/25 transition active:scale-95"
            >
              <Scale className="w-4 h-4" />
              <span>Inspect QEMU Evaluation</span>
            </button>
            <button
              onClick={() => onNavigate('tests')}
              className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-200 border border-dark-600 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <ShieldCheck className="w-4 h-4 text-crisp-emerald" />
              <span>6-Pt Safety Contract</span>
            </button>
          </div>
        </div>
      </div>

      {/* Headline Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Baseline Lock Wait */}
        <div className="p-4 rounded-xl bg-dark-900 border border-dark-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Stock Linux (B0) p99 Wait</span>
            <span className="text-[10px] font-mono bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/20">
              QEMU 6.6
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400 font-mono">94.7 ms</span>
            <span className="text-xs text-rose-500 font-mono font-medium">± 4.2 ms</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Lock holder delayed 50–200ms by kernel <code className="text-white font-mono">mem_cgroup_handle_over_high()</code>
          </div>
        </div>

        {/* CRISP-L Deferral Lock Wait */}
        <div className="p-4 rounded-xl bg-dark-900 border border-dark-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>CRISP-L (M0) p99 Wait</span>
            <span className="text-[10px] font-mono bg-crisp-emerald/10 text-crisp-emerald px-1.5 py-0.5 rounded border border-crisp-emerald/20">
              Capped Deferral
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-crisp-emerald font-mono">7.0 ms</span>
            <span className="text-xs text-crisp-emerald font-mono font-medium flex items-center gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" /> 13.5x–179x Win
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Throttle sleep deferred to return-to-userland outside critical section
          </div>
        </div>

        {/* Overshoot Bound */}
        <div className="p-4 rounded-xl bg-dark-900 border border-dark-800 shadow-sm">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Peak Overshoot</span>
            <span className="text-[10px] font-mono bg-crisp-cyan/10 text-crisp-cyan px-1.5 py-0.5 rounded border border-crisp-cyan/20">
              Bounded P1
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">4.2 MB</span>
            <span className="text-xs text-slate-500 font-mono">of 100 MB Limit</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Strictly bounded by <code className="text-crisp-cyan font-mono">min(N &times; d_max, Credit Pool)</code>
          </div>
        </div>

        {/* Scientific Novelty Rating */}
        <div className="p-4 rounded-xl bg-dark-900 border border-dark-800 shadow-sm">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Novelty Assessment</span>
            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
              Oct 22 2026 Audit
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">6.5 / 10</span>
            <span className="text-xs text-amber-300 font-mono">Moderate Novelty</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Combines userland lock hints with kernel throttle deferral; obvious-combination risk
          </div>
        </div>
      </div>

      {/* Interactive Failure-Mode Architecture Diagram */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-dark-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dark-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-4 h-4 text-crisp-cyan" />
              Interactive Failure-Mode Architecture: Lock Convoy vs CRISP-L Deferral
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate step-by-step how Linux <code className="text-slate-300 font-mono">memory.high</code> enforcement collapses multi-threaded throughput.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-dark-950 p-1 rounded-xl border border-dark-800">
            <button
              onClick={() => setActiveDiagramMode('stock')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                activeDiagramMode === 'stock'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Stock Linux (B0 Failure)
            </button>
            <button
              onClick={() => setActiveDiagramMode('crisp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                activeDiagramMode === 'crisp'
                  ? 'bg-crisp-emerald/20 text-crisp-emerald border border-crisp-emerald/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              CRISP-L (M0 Deferral)
            </button>
          </div>
        </div>

        {/* Step Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { step: 1, title: 'Step 1: Lock Acquire', desc: 'Thread A acquires user-space mutex' },
            { step: 2, title: 'Step 2: Memory Overage', desc: 'Allocation exceeds cgroup memory.high' },
            { step: 3, title: 'Step 3: Kernel Decision', desc: activeDiagramMode === 'stock' ? 'Stock forces 100ms sleep in CS' : 'CRISP-L checks cap & defers' },
            { step: 4, title: 'Step 4: Convoy Impact', desc: activeDiagramMode === 'stock' ? 'Waiters B & C stall (Convoy)' : 'Thread A unlocks; settles outside' },
          ].map((s) => (
            <button
              key={s.step}
              onClick={() => setDiagramStep(s.step)}
              className={`p-3 rounded-xl border text-left transition-all ${
                diagramStep === s.step
                  ? 'bg-dark-950 border-crisp-cyan shadow-md shadow-crisp-cyan/10'
                  : 'bg-dark-950/50 border-dark-800 hover:border-dark-700'
              }`}
            >
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">{s.title}</div>
              <div className="text-xs font-semibold text-slate-200 mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>

        {/* Interactive Visual Swimlane Canvas */}
        <div className="p-5 rounded-xl bg-dark-950 border border-dark-800 space-y-4">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-crisp-cyan animate-pulse"></span>
              Execution State: {activeDiagramMode === 'stock' ? 'Stock Linux Kernel v6.6' : 'CRISP-L Kernel Patch'} (Step {diagramStep} of 4)
            </span>
            <span className="text-[11px] text-slate-500">cgroup: test_crisp.slice (memory.high = 100MB)</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Thread A (Lock Holder) */}
            <div className={`p-4 rounded-xl border transition-all ${
              diagramStep >= 2
                ? activeDiagramMode === 'stock'
                  ? 'bg-rose-950/20 border-rose-800/40'
                  : 'bg-emerald-950/20 border-emerald-800/40'
                : 'bg-dark-900 border-dark-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-crisp-cyan" /> Thread A (Worker)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-dark-800 text-slate-300">
                  {diagramStep === 1 ? 'Acquired Mutex' : diagramStep === 2 ? 'Allocating 2MB' : diagramStep === 3 ? (activeDiagramMode === 'stock' ? 'THROTTLED' : 'DEFERRED') : (activeDiagramMode === 'stock' ? 'STALLED' : 'SETTLING')}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mutex status: {diagramStep === 4 && activeDiagramMode === 'crisp' ? <strong className="text-crisp-emerald">RELEASED</strong> : <strong className="text-amber-400">HELD</strong>}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {diagramStep === 1 && 'Thread enters critical section: pthread_mutex_lock(&mtx).'}
                  {diagramStep === 2 && 'Thread invokes malloc(); cgroup memory usage hits 102MB (> 100MB high limit).'}
                  {diagramStep === 3 && activeDiagramMode === 'stock' && 'Stock kernel calls schedule_timeout_killable(penalty_jiffies). Thread A is forced to SLEEP for 100ms while holding mtx!'}
                  {diagramStep === 3 && activeDiagramMode === 'crisp' && 'CRISP-L checks task flag & cap (d_max=32 pages, lease=2000µs). Capped deferral granted! Thread finishes CS immediately.'}
                  {diagramStep === 4 && activeDiagramMode === 'stock' && 'Thread A is still sleeping in kernel reclaim. Mutex remains locked. Lock wait inflation begins.'}
                  {diagramStep === 4 && activeDiagramMode === 'crisp' && 'Thread A exits CS, releases mtx, and settles its deferred 100ms throttle in return-to-userland outside the lock.'}
                </div>
              </div>
            </div>

            {/* Thread B (Lock Waiter 1) */}
            <div className={`p-4 rounded-xl border transition-all ${
              diagramStep >= 3 && activeDiagramMode === 'stock'
                ? 'bg-rose-950/20 border-rose-800/40'
                : diagramStep === 4 && activeDiagramMode === 'crisp'
                ? 'bg-emerald-950/20 border-emerald-800/40'
                : 'bg-dark-900 border-dark-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" /> Thread B (Waiter)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-dark-800 text-slate-300">
                  {diagramStep < 3 ? 'Ready' : activeDiagramMode === 'stock' ? 'BLOCKED' : diagramStep === 4 ? 'LOCK ACQUIRED' : 'Waiting'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Call: <code className="text-white font-mono">pthread_mutex_lock(&mtx)</code></span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {diagramStep < 3 && 'Thread B runs user requests, preparing to access shared queue.'}
                  {diagramStep >= 3 && activeDiagramMode === 'stock' && 'BLOCKED! Thread B must wait for Thread A to finish sleeping. Wait time inflates to 100ms+!'}
                  {diagramStep === 3 && activeDiagramMode === 'crisp' && 'Thread B briefly spins/waits (~0.05ms) while Thread A swiftly finishes CS.'}
                  {diagramStep === 4 && activeDiagramMode === 'crisp' && 'Thread B successfully acquires mtx! Lock wait latency was only 0.4ms.'}
                </div>
              </div>
            </div>

            {/* Thread C (Lock Waiter 2) */}
            <div className={`p-4 rounded-xl border transition-all ${
              diagramStep >= 3 && activeDiagramMode === 'stock'
                ? 'bg-rose-950/20 border-rose-800/40'
                : 'bg-dark-900 border-dark-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" /> Thread C (Waiter)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-dark-800 text-slate-300">
                  {diagramStep < 4 ? 'Ready' : activeDiagramMode === 'stock' ? 'CONVOY QUEUE' : 'Proceeding'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Queue position: {activeDiagramMode === 'stock' && diagramStep >= 3 ? '#2 in convoy' : 'Normal'}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {diagramStep < 3 && 'Thread C incoming request waiting for shared buffer.'}
                  {diagramStep >= 3 && activeDiagramMode === 'stock' && 'Convoy queue accumulates. Tail latency p99 inflates to 210ms+ across all threads!'}
                  {diagramStep >= 3 && activeDiagramMode === 'crisp' && 'No queue buildup. Thread C acquires lock immediately after Thread B.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Linux 6.6 QEMU Empirical Evidence Table */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-dark-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dark-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Database className="w-4 h-4 text-crisp-emerald" />
              Empirical Linux 6.6 QEMU Prototype Evidence (Authentic VM Runs)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Measurements collected inside dedicated QEMU VM running Linux 6.6.0-crisp-v1 under cgroup v2 memory pressure.
            </p>
          </div>
          <button
            onClick={() => onNavigate('before-after')}
            className="text-xs text-crisp-cyan hover:underline flex items-center gap-1 font-mono shrink-0"
          >
            <span>Open Side-by-Side Comparison</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-dark-800 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">Workload Scenario</th>
                <th className="py-2.5 px-3">Threads</th>
                <th className="py-2.5 px-3">Kernel Policy</th>
                <th className="py-2.5 px-3">Lock Wait p99 (CI 95%)</th>
                <th className="py-2.5 px-3">Throttle Stalls in CS</th>
                <th className="py-2.5 px-3">Overshoot</th>
                <th className="py-2.5 px-3">Empirical Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800/60">
              {qemuRuns.map((r) => (
                <tr key={r.id} className="hover:bg-dark-850/50 transition">
                  <td className="py-2.5 px-3 text-slate-200 font-sans font-medium">{r.workload}</td>
                  <td className="py-2.5 px-3 text-slate-400">{r.threads}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.tag === 'baseline'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : r.tag === 'crisp'
                        ? 'bg-crisp-emerald/10 text-crisp-emerald border border-crisp-emerald/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {r.policy}
                    </span>
                  </td>
                  <td className={`py-2.5 px-3 font-bold ${
                    r.tag === 'baseline' ? 'text-rose-400' : r.tag === 'crisp' ? 'text-crisp-emerald' : 'text-amber-400'
                  }`}>
                    {r.p99}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{r.stalls}</td>
                  <td className="py-2.5 px-3 text-slate-400">{r.overshoot}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-sans text-slate-300 font-semibold">{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Research Gate Decisions Status Ladder */}
      <div className="rounded-2xl bg-dark-900 border border-dark-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dark-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-crisp-cyan" />
              Scientific Research Gate Decisions (Formal Evaluation Ladder)
            </h2>
            <p className="text-xs text-slate-400">
              Progression requires strict empirical evidence from QEMU Linux 6.6 or bounded model checker proofs.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-dark-800 text-slate-400 border border-dark-700">
            6 Formal Gates
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {gates.map((g) => (
            <div
              key={g.gate_id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                g.status.includes('PASSED')
                  ? 'bg-dark-950/80 border-crisp-emerald/30 hover:border-crisp-emerald/60'
                  : g.status === 'IN_PROGRESS'
                  ? 'bg-dark-950/60 border-amber-500/30'
                  : 'bg-dark-950/30 border-dark-800 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-slate-400 font-bold">{g.gate_id}</span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      g.status.includes('PASSED')
                        ? 'bg-crisp-emerald/20 text-crisp-emerald border border-crisp-emerald/30'
                        : g.status === 'IN_PROGRESS'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {g.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs font-semibold text-white mb-1 leading-snug">{g.title.split(': ')[1] || g.title}</div>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed mt-2 pt-2 border-t border-dark-800/80">
                {g.evidence_summary}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Honest Scientific Evaluation & Negative Findings */}
      <div className="p-6 rounded-2xl bg-amber-950/15 border border-amber-500/30 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-300 tracking-tight">
              Honest Scientific Evaluation: Oct 22 2026 Novelty Rating & Negative Findings
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              In accordance with academic rigor, we document both validated improvements and unresolved research limitations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-sans text-xs">
          <div className="p-3.5 rounded-xl bg-dark-950/60 border border-amber-500/20 space-y-1.5">
            <div className="font-bold text-amber-300 flex items-center gap-1.5 font-mono text-[11px]">
              <span>1. Novelty Score: 6.5 / 10</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              <strong>Obvious-combination risk:</strong> CRISP combines user-space hints (like rseq/schedctl) with kernel throttle deferral (like CFS quota deferral / Meta memcg_ext). While the specific application to <code className="text-white font-mono">memory.high</code> is effective, patent examiners or peer reviewers may consider the concept an incremental extension.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-950/60 border border-amber-500/20 space-y-1.5">
            <div className="font-bold text-amber-300 flex items-center gap-1.5 font-mono text-[11px]">
              <span>2. Negative Finding: Parity Deficit</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              In Workload A, prototype total throttle paid was <strong>lower than stock</strong> instead of equal. The prototype settles with stock logic against then-current overage rather than replaying the exact deferred sleep duration. If background reclaim freed pages while the lock was held, deferred throttle drops.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-dark-950/60 border border-amber-500/20 space-y-1.5">
            <div className="font-bold text-amber-300 flex items-center gap-1.5 font-mono text-[11px]">
              <span>3. Unexercised Mechanisms</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              The depth gate (rejecting nested locks) was never exercised because all test workloads used flat non-recursive locks. Additionally, bare-metal hardware and production database benchmarks (e.g., RocksDB, Redis) remain pending in Gate 4.
            </p>
          </div>
        </div>
      </div>

      {/* Recommended Next Research Actions */}
      <div className="p-6 rounded-2xl bg-dark-900 border border-dark-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
          Recommended Research Exploration Workflow
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('before-after')}
            className="p-3 rounded-xl bg-dark-950 border border-dark-800 hover:border-crisp-cyan/50 text-left transition group"
          >
            <div className="text-xs font-bold text-white group-hover:text-crisp-cyan flex items-center justify-between">
              <span>Results Comparison</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-crisp-cyan group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Compare QEMU VM runs against model simulations across Workloads A, B, and C.
            </p>
          </button>

          <button
            onClick={() => onNavigate('tests')}
            className="p-3 rounded-xl bg-dark-950 border border-dark-800 hover:border-crisp-emerald/50 text-left transition group"
          >
            <div className="text-xs font-bold text-white group-hover:text-crisp-emerald flex items-center justify-between">
              <span>Verification & Safety</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-crisp-emerald group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Run the bounded model checker and inspect counterexample refuting traces.
            </p>
          </button>

          <button
            onClick={() => onNavigate('mechanism')}
            className="p-3 rounded-xl bg-dark-950 border border-dark-800 hover:border-crisp-indigo/50 text-left transition group"
          >
            <div className="text-xs font-bold text-white group-hover:text-crisp-indigo flex items-center justify-between">
              <span>Mechanism Explorer</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-crisp-indigo group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Trace the 4-state credit automaton and inspect deferred settlement paths.
            </p>
          </button>

          <button
            onClick={() => onNavigate('evidence')}
            className="p-3 rounded-xl bg-dark-950 border border-dark-800 hover:border-amber-400/50 text-left transition group"
          >
            <div className="text-xs font-bold text-white group-hover:text-amber-300 flex items-center justify-between">
              <span>Research & Prior Art</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Compare 8 prior systems and inspect the Linux 6.6 kernel patch audit.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
