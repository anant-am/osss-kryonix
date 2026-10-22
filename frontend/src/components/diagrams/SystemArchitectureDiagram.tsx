import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  FileCode,
  ExternalLink,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface DiagramNode {
  id: string;
  title: string;
  type: 'user' | 'kernel' | 'crisp' | 'hardware';
  sourceFile: string;
  description: string;
  baselineBehavior: string;
  crispBehavior: string;
}

export const SystemArchitectureDiagram: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'boundary' | 'decision' | 'lifecycle'>('boundary');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('crisp_deferral_hook');

  const nodes: Record<string, DiagramNode> = {
    user_app: {
      id: 'user_app',
      title: 'User Application Thread',
      type: 'user',
      sourceFile: 'linux/workload/mutex_alloc_workload.c',
      description: 'Multi-threaded POSIX pthread worker contending for shared memory structures.',
      baselineBehavior: 'Allocates memory while holding locks; completely unaware of kernel throttle state.',
      crispBehavior: 'Sets CRISP_FLAG_IN_CS in task struct before acquiring mutex; clears flag on unlock.',
    },
    prctl_signal: {
      id: 'prctl_signal',
      title: 'User/Kernel CS Signal',
      type: 'user',
      sourceFile: 'include/uapi/linux/prctl.h',
      description: 'Zero-overhead shared memory flag word or prctl(PR_SET_CRISP_CS, 1).',
      baselineBehavior: 'Does not exist in vanilla Linux.',
      crispBehavior: 'Exposes atomic bit in user-mapped page read by kernel during allocation.',
    },
    kernel_alloc: {
      id: 'kernel_alloc',
      title: 'Kernel Page Allocator',
      type: 'kernel',
      sourceFile: 'mm/page_alloc.c',
      description: 'Kernel buddy allocator serving GFP_KERNEL page requests.',
      baselineBehavior: 'Charges pages to current cgroup; triggers mem_cgroup_handle_over_high().',
      crispBehavior: 'Passes allocation charge through cgroup memory controller without modification.',
    },
    cgroup_controller: {
      id: 'cgroup_controller',
      title: 'cgroup v2 Memory Controller',
      type: 'kernel',
      sourceFile: 'mm/memcontrol.c',
      description: 'Enforces memory.high and memory.max hierarchical boundaries.',
      baselineBehavior: 'Computes overage penalty: 10ms * (usage - high) / high; invokes schedule_timeout_killable().',
      crispBehavior: 'Intercepts throttle sleep call if thread holds active critical-section lease.',
    },
    crisp_deferral_hook: {
      id: 'crisp_deferral_hook',
      title: 'CRISP-L Deferral Gate',
      type: 'crisp',
      sourceFile: 'linux/kernel-patch/crisp-m0-m2.patch',
      description: 'Core decision logic in mem_cgroup_handle_over_high() checking eligibility.',
      baselineBehavior: 'Unconditionally forces synchronous sleep up to 2,000 ms inside critical section.',
      crispBehavior: 'Defers throttle penalty to return-to-userland exit path; records per-thread and pool debt.',
    },
    credit_ledger: {
      id: 'credit_ledger',
      title: '4-State Credit Ledger',
      type: 'crisp',
      sourceFile: 'model/accounting/credit_ledger.py',
      description: 'Mathematical invariant enforcer: Available + Active + Settling + Quarantined = Pool.',
      baselineBehavior: 'No credit tracking.',
      crispBehavior: 'Strict atomic reservation; bounds max concurrent deferrals across container.',
    },
    return_settle: {
      id: 'return_settle',
      title: 'Return-to-Userland Settle',
      type: 'crisp',
      sourceFile: 'arch/x86/entry/common.c',
      description: 'Executes deferred reclaim sleep after lock is safely released outside mutex.',
      baselineBehavior: 'Thread is already delayed inside lock.',
      crispBehavior: 'Pays accumulated penalty during exit_to_user_mode_loop() without stalling peers.',
    },
  };

  const selectedNode = nodes[selectedNodeId] || nodes.crisp_deferral_hook;

  return (
    <div className="p-6 rounded-2xl bg-[#080A0F] border border-slate-800 shadow-2xl space-y-6">
      {/* Header and Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Interactive CRISP-L Architecture &amp; Boundary Explorer
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Click any component node to inspect source files, kernel hook points, and baseline vs. CRISP differences.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab('boundary')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'boundary' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            System Boundary
          </button>
          <button
            onClick={() => setActiveTab('decision')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'decision' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Decision Tree
          </button>
          <button
            onClick={() => setActiveTab('lifecycle')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'lifecycle' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Debt Lifecycle
          </button>
        </div>
      </div>

      {/* Main Diagram Area & Detail Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Node Graph (Left 8 Cols) */}
        <div className="lg:col-span-8 p-6 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between space-y-6">
          {activeTab === 'boundary' && (
            <div className="space-y-6">
              {/* Layer 1: User Space */}
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                  User Space (Ring 3)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedNodeId('user_app')}
                    className={`p-3 rounded-lg border text-left transition ${
                      selectedNodeId === 'user_app'
                        ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">User Application Thread</div>
                    <div className="text-[11px] text-slate-400 mt-1">POSIX pthread with mutex locks</div>
                  </button>
                  <button
                    onClick={() => setSelectedNodeId('prctl_signal')}
                    className={`p-3 rounded-lg border text-left transition ${
                      selectedNodeId === 'prctl_signal'
                        ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">CS Signal Word / prctl()</div>
                    <div className="text-[11px] text-slate-400 mt-1">Zero-syscall userspace flag</div>
                  </button>
                </div>
              </div>

              {/* Boundary Transition */}
              <div className="flex items-center justify-center text-[10px] font-mono text-slate-500 gap-2">
                <span>&darr; System Call / Memory Allocation Boundary &darr;</span>
              </div>

              {/* Layer 2: Linux Kernel Core */}
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                  Linux Kernel Space (Ring 0)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedNodeId('kernel_alloc')}
                    className={`p-3 rounded-lg border text-left transition ${
                      selectedNodeId === 'kernel_alloc'
                        ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">Buddy Page Allocator</div>
                    <div className="text-[11px] text-slate-400 mt-1">mm/page_alloc.c</div>
                  </button>
                  <button
                    onClick={() => setSelectedNodeId('cgroup_controller')}
                    className={`p-3 rounded-lg border text-left transition ${
                      selectedNodeId === 'cgroup_controller'
                        ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">cgroup v2 memcontrol</div>
                    <div className="text-[11px] text-slate-400 mt-1">memory.high limit enforcement</div>
                  </button>
                </div>
              </div>

              {/* Layer 3: CRISP-L Extension Modules */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
                    CRISP-L Kernel Extensions
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    Linux 6.6 Patch
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedNodeId('crisp_deferral_hook')}
                    className={`p-3 rounded-lg border text-left transition ${
                      selectedNodeId === 'crisp_deferral_hook'
                        ? 'bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-emerald-300">Deferral Gate</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Cap &amp; lease check</div>
                  </button>
                  <button
                    onClick={() => setSelectedNodeId('credit_ledger')}
                    className={`p-3 rounded-lg border text-left transition ${
                      selectedNodeId === 'credit_ledger'
                        ? 'bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-emerald-300">4-State Ledger</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Invariant P2 keeper</div>
                  </button>
                  <button
                    onClick={() => setSelectedNodeId('return_settle')}
                    className={`p-3 rounded-lg border text-left transition ${
                      selectedNodeId === 'return_settle'
                        ? 'bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-emerald-300">Return Settle</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Deferred sleep pay</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'decision' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span>1. Memory Allocation in cgroup v2</span>
                <span className="text-cyan-400">usage &gt; memory.high?</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span>2. mem_cgroup_handle_over_high() triggered</span>
                <span className="text-amber-400">Penalty: min(2000ms, 10ms * overage)</span>
              </div>
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/40 space-y-2">
                <div className="font-bold text-blue-300">3. CRISP-L Hook Branch Evaluation:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/40 text-rose-300">
                    <strong>Branch A: No Deferral</strong>
                    <div className="text-[11px] text-slate-400 mt-1">If not in CS, debt &ge; d_max, or lease expired: enforce instant sleep (Stock Linux behavior).</div>
                  </div>
                  <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
                    <strong>Branch B: Deferral Granted</strong>
                    <div className="text-[11px] text-slate-400 mt-1">If IN_CS==1 and headroom available: record debt, skip sleep, arm 30µs lease, continue.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lifecycle' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-emerald-400 font-bold">STATE 1: AVAILABLE</span>
                <span className="text-slate-400">Default credit pool capacity (e.g. 256 pages)</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-amber-400 font-bold">STATE 2: ACTIVE</span>
                <span className="text-slate-400">Claimed by thread inside critical section; lease active</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-cyan-400 font-bold">STATE 3: SETTLING</span>
                <span className="text-slate-400">Lock released; thread paying reclaim penalty in return loop</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-purple-400 font-bold">STATE 4: QUARANTINED</span>
                <span className="text-slate-400">Zero-progress allocations isolated under extreme pressure</span>
              </div>
            </div>
          )}
        </div>

        {/* Node Inspector Panel (Right 4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 font-mono text-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400 uppercase font-bold text-[10px]">Component Inspector</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {selectedNode.type.toUpperCase()}
              </span>
            </div>

            <h4 className="text-base font-bold text-white mt-3">{selectedNode.title}</h4>
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-1">
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate">{selectedNode.sourceFile}</span>
            </div>

            <p className="text-slate-300 font-sans text-xs leading-relaxed mt-3 pt-3 border-t border-slate-800/80">
              {selectedNode.description}
            </p>

            <div className="mt-4 space-y-3">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-rose-400 uppercase block mb-1">
                  Vanilla Linux 6.6:
                </span>
                <p className="text-[11px] text-slate-300 font-sans">{selectedNode.baselineBehavior}</p>
              </div>

              <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/30">
                <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">
                  CRISP-L Mechanism:
                </span>
                <p className="text-[11px] text-slate-300 font-sans">{selectedNode.crispBehavior}</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500">
            Click any node on the left to inspect architectural properties.
          </div>
        </div>
      </div>
    </div>
  );
};
