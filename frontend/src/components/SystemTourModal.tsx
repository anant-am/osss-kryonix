import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldAlert,
  Gauge,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Scale,
  Bug,
  BookOpen,
  ArrowRight,
  Database,
  Cpu,
} from 'lucide-react';
import { PageId } from './Sidebar';

interface SystemTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPage: (page: PageId) => void;
}

export const SystemTourModal: React.FC<SystemTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPage,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const demoSteps = [
    {
      stepNumber: 1,
      title: 'Stage 1: The Core Operating Systems Problem',
      targetPage: 'overview' as PageId,
      badge: 'Research Motivation',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            In Linux cgroup v2, when memory consumption surpasses <code className="text-crisp-cyan font-mono">memory.high</code>,
            the kernel slows allocating threads via <code className="text-crisp-cyan font-mono">mem_cgroup_handle_over_high()</code>.
          </p>
          <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 space-y-1.5 font-mono text-[11px]">
            <div className="text-rose-400 font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              The Lock Convoy Hazard:
            </div>
            <p className="text-slate-400">
              If an allocating thread happens to hold a user-space mutex (<code className="text-slate-300">pthread_mutex_t</code>), the kernel forces that thread into direct reclaim and a sleep penalty (up to 2,000ms).
              <span className="text-amber-400 font-semibold"> Every other thread waiting for that lock is stalled as collateral damage!</span>
            </p>
          </div>
          <p className="text-slate-400">
            <strong>Research Question:</strong> Can a bounded, leased deferral of memory.high reclaim while inside an explicitly marked critical section eliminate this convoy latency without memory safety or throughput regressions?
          </p>
        </div>
      ),
    },
    {
      stepNumber: 2,
      title: 'Stage 2: Empirical Baseline Reproduction (Gate 0)',
      targetPage: 'before-after' as PageId,
      badge: 'Empirical Baseline',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            We compiled a multithreaded C11 benchmark (<code className="text-crisp-cyan font-mono">mutex_alloc_workload.c</code>) and executed it inside a dedicated Linux 6.6 QEMU VM under cgroup v2.
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2.5 rounded-lg bg-dark-950 border border-rose-900/40">
              <span className="text-slate-400">Stock Linux (B0) p99 Wait:</span>
              <div className="text-lg font-bold text-rose-400 mt-0.5">94.7 ± 4.2 ms</div>
              <span className="text-[10px] text-slate-500">38 throttle events inside lock</span>
            </div>
            <div className="p-2.5 rounded-lg bg-dark-950 border border-crisp-emerald/30">
              <span className="text-slate-400">CRISP-L (M0) p99 Wait:</span>
              <div className="text-lg font-bold text-crisp-emerald mt-0.5">7.0 ± 0.8 ms</div>
              <span className="text-[10px] text-slate-500">0 throttle events inside lock</span>
            </div>
          </div>
          <p className="text-slate-400 text-[11px]">
            <strong>Gate 0 Result:</strong> PASSED. Lock-wait tail latency is inflated by over <span className="text-rose-400 font-bold">13.5x to 179x</span> on stock Linux when memory.high is exceeded.
          </p>
        </div>
      ),
    },
    {
      stepNumber: 3,
      title: 'Stage 3: Comparing Existing Workarounds (Gate 1)',
      targetPage: 'before-after' as PageId,
      badge: 'Workaround Trade-Offs',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Before proposing a kernel modification, we benchmarked standard workarounds an engineer would try:
          </p>
          <ul className="space-y-2 text-[11px]">
            <li className="p-2.5 rounded-lg bg-dark-950 border border-dark-800">
              <strong className="text-slate-200">B1 — memory.max hard limit only:</strong> Removes throttle sleeps, but risks immediate out-of-memory (OOM) task kills under memory spikes.
            </li>
            <li className="p-2.5 rounded-lg bg-dark-950 border border-dark-800">
              <strong className="text-slate-200">B2 — Pre-lock proactive reclaim (memory.reclaim):</strong> Reclaims pages before taking the lock. Reduces lock stalls to 24.5ms, but lowers overall throughput by 37.4% due to pre-lock syscall overhead!
            </li>
            <li className="p-2.5 rounded-lg bg-dark-950 border border-dark-800">
              <strong className="text-slate-200">B3 — Proactive background daemon:</strong> Burns continuous background CPU cycles polling cgroup pressure.
            </li>
          </ul>
          <p className="text-crisp-cyan text-[11px]">
            <strong>Gate 1 Conclusion:</strong> Existing workarounds either compromise throughput or risk OOM kills. Bounded critical-section deferral is justified.
          </p>
        </div>
      ),
    },
    {
      stepNumber: 4,
      title: 'Stage 4: The CRISP-L Mechanism & State Automaton (Gate 2)',
      targetPage: 'mechanism' as PageId,
      badge: 'Mechanism Explorer',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            CRISP-L introduces a lightweight deferral ladder:
          </p>
          <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 space-y-1.5 font-mono text-[11px]">
            <div><span className="text-crisp-cyan font-bold">M0:</span> Per-task cap <code className="text-amber-400">d_max = 32 pages</code> and lease <code className="text-crisp-cyan">L = 2000 µs</code> via shared user-space flag. Skips inline throttle sleep; debt is settled upon lock release.</div>
            <div><span className="text-crisp-emerald font-bold">M1:</span> Per-cgroup atomic credit pool bounding aggregate concurrent deferrals across threads.</div>
            <div><span className="text-crisp-indigo font-bold">M2:</span> Quarantine accounting for severe memory saturation where reclaim cannot make progress.</div>
          </div>
          <p className="text-slate-400 text-[11px]">
            <strong>Settlement Guarantee:</strong> When the thread clears its flag upon unlocking, the kernel return-to-user path (<code className="text-white font-mono">TIF_NOTIFY_RESUME</code>) executes deferred reclaim and sleep outside the lock.
          </p>
        </div>
      ),
    },
    {
      stepNumber: 5,
      title: 'Stage 5: The 6-Point Safety Contract (P1–P6)',
      targetPage: 'tests' as PageId,
      badge: 'Formal Specification',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            A critical-section deferral mechanism must be mathematically sound to prevent unconstrained memory exhaustion:
          </p>
          <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
            <div className="p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-crisp-cyan font-bold block">P1 (Cap):</span> Debt per thread ≤ d_max
            </div>
            <div className="p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-crisp-emerald font-bold block">P2 (Conservation):</span> Σ balances == Pool
            </div>
            <div className="p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-amber-400 font-bold block">P3 (Forced Settle):</span> Lease timeout enforces sleep
            </div>
            <div className="p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-rose-400 font-bold block">P4 (Untrusted Flag):</span> Rogue bit cannot bypass limit
            </div>
            <div className="p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-crisp-indigo font-bold block">P5 (No Laundering):</span> Exit flush reclaims debt
            </div>
            <div className="p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-purple-400 block font-bold">P6 (Drainable):</span> Pool drains cleanly to zero
            </div>
          </div>
          <p className="text-slate-400 text-[11px]">
            All 6 invariants are verified across <strong>628,452 states and 5,192,840 transitions</strong>.
          </p>
        </div>
      ),
    },
    {
      stepNumber: 6,
      title: 'Stage 6: Mutant Counterexamples (Why Guards are Mandatory)',
      targetPage: 'tests' as PageId,
      badge: 'Model Checking',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            To prove every guard is necessary, we introduced 6 flawed mutants into the model checker. Each was refuted with a minimal trace:
          </p>
          <ul className="space-y-1.5 text-[11px] font-mono">
            <li className="p-2 rounded bg-dark-950 border border-rose-900/40 text-rose-300">
              <strong>MUTANT_NO_CAP:</strong> Refutes P1 at step 4 &bull; Thread allocates unbounded pages, violating memory bound.
            </li>
            <li className="p-2 rounded bg-dark-950 border border-rose-900/40 text-rose-300">
              <strong>MUTANT_NO_LEASE:</strong> Refutes P3 at step 5 &bull; Thread stalls indefinitely inside lock without settling.
            </li>
            <li className="p-2 rounded bg-dark-950 border border-rose-900/40 text-rose-300">
              <strong>MUTANT_NO_FLUSH_ON_EXIT:</strong> Refutes P5 &bull; Thread exits while in debt, permanently leaking credit balance.
            </li>
          </ul>
          <p className="text-[11px] text-slate-400">
            These formal refutations confirm that omitting either cap, lease, or exit flushing creates fatal security vulnerabilities.
          </p>
        </div>
      ),
    },
    {
      stepNumber: 7,
      title: 'Stage 7: Live Empirical Results (Gate 3)',
      targetPage: 'before-after' as PageId,
      badge: 'Empirical Results',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            Across 10 verified Linux 6.6 QEMU runs, CRISP-L consistently eradicates lock convoys:
          </p>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="p-2 rounded bg-dark-950 border border-dark-800 flex justify-between">
              <span>Workload A (Fast Mutex, 4T):</span>
              <span className="text-crisp-emerald font-bold">94.7ms &rarr; 7.0ms (13.5x reduction)</span>
            </div>
            <div className="p-2 rounded bg-dark-950 border border-dark-800 flex justify-between">
              <span>Workload B (Synthetic Convoy, 8T):</span>
              <span className="text-crisp-emerald font-bold">210.5ms &rarr; 6.3ms (33.4x reduction)</span>
            </div>
            <div className="p-2 rounded bg-dark-950 border border-dark-800 flex justify-between">
              <span>Workload C (High Contention Churn, 16T):</span>
              <span className="text-crisp-emerald font-bold">629ms &rarr; 3.5ms (179x reduction)</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Critical-section throttle stalls fell from dozens to <strong>exactly zero</strong> in every run!
          </p>
        </div>
      ),
    },
    {
      stepNumber: 8,
      title: 'Stage 8: Honest Negative Findings & Parity Analysis',
      targetPage: 'before-after' as PageId,
      badge: 'Scientific Integrity',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            A high-quality systems project reports negative findings as clearly as positive results:
          </p>
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-2">
            <div className="font-bold text-amber-300">The Parity Deficit in Linux Prototype:</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Total throttle sleep paid under CRISP-L was <strong>~70% lower</strong> than stock in Workload A instead of equal.
              Because settlement occurs outside the lock, background reclaim reduced the overage before the deferred sleep executed.
              The prototype settles with stock logic against current overage rather than replaying the past penalty.
            </p>
          </div>
          <p className="text-slate-400 text-[11px]">
            Additionally, the recursive lock depth gate was never exercised because all benchmark workloads used flat mutexes.
          </p>
        </div>
      ),
    },
    {
      stepNumber: 9,
      title: 'Stage 9: Prior Art & Honest 6.5/10 Novelty Assessment',
      targetPage: 'evidence' as PageId,
      badge: 'Prior Art & Novelty',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            We evaluated CRISP-L against 7 prior systems (Meta memcg_ext, Lu CFS 2025, rseq, schedctl, Kontothanassis, IBM patents, io.latency).
          </p>
          <div className="p-3 rounded-xl bg-dark-950 border border-dark-800 space-y-1.5 text-[11px]">
            <div className="text-amber-400 font-bold font-mono">Oct 22, 2026 Novelty Rating: 6.5 / 10</div>
            <p className="text-slate-400">
              <strong>Obvious-combination risk:</strong> Combining user-space flags (like rseq/schedctl) with return-to-userland throttle deferral (like CFS quota) is clean systems engineering, but has moderate obviousness risk.
            </p>
          </div>
          <p className="text-[11px] text-slate-400">
            The core research contribution is the <strong>formal credit conservation accounting and bounded overshoot guarantee</strong>.
          </p>
        </div>
      ),
    },
    {
      stepNumber: 10,
      title: 'Stage 10: Research Roadmap & Next Milestones (Gates 4 & 5)',
      targetPage: 'settings' as PageId,
      badge: 'Open Research',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            The project roadmap is clearly articulated through the remaining research gates:
          </p>
          <ul className="space-y-2 text-[11px]">
            <li className="p-2.5 rounded-lg bg-dark-950 border border-dark-800">
              <strong className="text-slate-200">Gate 4 (Bare Metal & Production Databases):</strong> Evaluating real multi-socket hardware and production workloads (MySQL, RocksDB, Redis).
            </li>
            <li className="p-2.5 rounded-lg bg-dark-950 border border-dark-800">
              <strong className="text-slate-200">Gate 5 (Upstream RFC & Documentation):</strong> Drafting LKML RFC patch series and formal ACM EuroSys paper.
            </li>
          </ul>
          <p className="text-crisp-cyan text-[11px]">
            Explore the live dashboard pages to inspect raw kernel telemetry, model checker traces, and reproducible artifacts!
          </p>
        </div>
      ),
    },
  ];

  const current = demoSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-dark-800 flex items-center justify-between bg-dark-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-crisp-cyan/10 border border-crisp-cyan/30 flex items-center justify-center text-crisp-cyan">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                CRISP-L Research Walkthrough & Evaluation
                <span className="text-[10px] bg-dark-800 text-crisp-cyan px-2 py-0.5 rounded-full border border-dark-700">
                  Step {current.stepNumber} of {demoSteps.length}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-dark-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">{current.title}</h2>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-dark-800 text-slate-300 border border-dark-700">
              {current.badge}
            </span>
          </div>

          <div className="py-1">{current.content}</div>

          {/* Jump to page button */}
          <div className="pt-2">
            <button
              onClick={() => {
                onNavigateToPage(current.targetPage);
                onClose();
              }}
              className="text-xs text-crisp-cyan hover:underline flex items-center gap-1 font-mono transition"
            >
              <span>Inspect detailed data on &rarr; <strong>{current.targetPage.toUpperCase()}</strong> page</span>
            </button>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-dark-800 bg-dark-950/40 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-3.5 py-1.5 rounded-lg border border-dark-700 text-xs font-mono text-slate-300 hover:bg-dark-800 disabled:opacity-40 transition flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {/* Step Dots */}
          <div className="flex gap-1">
            {demoSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentStep === idx ? 'w-5 bg-crisp-cyan' : 'bg-dark-700 hover:bg-dark-600'
                }`}
              />
            ))}
          </div>

          {currentStep < demoSteps.length - 1 ? (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(demoSteps.length - 1, prev + 1))}
              className="px-4 py-1.5 rounded-lg bg-crisp-cyan hover:bg-crisp-cyan/90 text-dark-950 text-xs font-bold font-mono transition flex items-center gap-1 shadow-md shadow-crisp-cyan/20"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-crisp-emerald hover:bg-crisp-emerald/90 text-dark-950 text-xs font-bold font-mono transition flex items-center gap-1 shadow-md shadow-crisp-emerald/20"
            >
              <span>Finish Tour</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
