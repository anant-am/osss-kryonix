import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Cpu,
  Layers,
  Database,
  Terminal,
  Activity,
  Sliders,
  Sparkles,
} from 'lucide-react';

export type ExecutionMode = 'real' | 'replay' | 'demo';

export interface ExecutionEvent {
  sequence: number;
  nodeId: number;
  timestampMs: number;
  type: string;
  threadId: number;
  label: string;
  description: string;
  branch: 'stock' | 'crisp';
  debtPages: number;
  poolAvailable: number;
  durationUs?: number;
}

interface LiveExecutionGraphProps {
  mode?: ExecutionMode;
  onModeChange?: (mode: ExecutionMode) => void;
  runId?: string;
  isExecutingReal?: boolean;
}

export const LiveExecutionGraph: React.FC<LiveExecutionGraphProps> = ({
  mode = 'demo',
  onModeChange,
  runId = 'run_qemu_w2_m0_latest',
  isExecutingReal = false,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedBranch, setSelectedBranch] = useState<'crisp' | 'stock'>('crisp');
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<ExecutionEvent | null>(null);

  // 10 Key CRISP-L Execution Graph Nodes
  const graphNodes = [
    {
      id: 0,
      phase: 'INIT',
      title: '1. Cgroup & Environment Setup',
      desc: 'Container limits verified (memory.high=100MB, cgroup v2 attached)',
      color: 'border-slate-700 text-slate-300',
    },
    {
      id: 1,
      phase: 'START',
      title: '2. Multi-Thread Workload Start',
      desc: 'Worker threads spawned under POSIX pthreads',
      color: 'border-slate-700 text-slate-300',
    },
    {
      id: 2,
      phase: 'LOCK',
      title: '3. pthread_mutex_lock(&mtx)',
      desc: 'Thread acquires user-space lock; critical-section signal armed (CRISP_FLAG_IN_CS)',
      color: 'border-amber-500/60 text-amber-400',
    },
    {
      id: 3,
      phase: 'ALLOC',
      title: '4. Memory Allocation (malloc)',
      desc: 'Thread allocates pages inside protected critical section',
      color: 'border-cyan-500/60 text-cyan-400',
    },
    {
      id: 4,
      phase: 'PRESSURE',
      title: '5. cgroup memory.high Triggered',
      desc: 'Kernel mm/memcontrol.c detects usage > memory.high threshold',
      color: 'border-purple-500/60 text-purple-400',
    },
    {
      id: 5,
      phase: 'GATE',
      title: '6. CRISP-L Eligibility Check',
      desc: 'Kernel inspects: IN_CS flag == 1 && pending_debt < d_max && pool_credit > 0',
      color: 'border-blue-500/60 text-blue-400',
    },
    // Branch A: Stock Linux
    {
      id: 6,
      phase: 'STOCK_BRANCH',
      title: '7a. Stock Enforcement (B0)',
      desc: 'Thread forced into un-interruptible sleep (50-200ms) holding mutex; lock convoy bursts',
      color: 'border-rose-500/60 text-rose-400',
    },
    // Branch B: CRISP-L Deferral
    {
      id: 7,
      phase: 'CRISP_BRANCH',
      title: '7b. Bounded Deferral (M0-M2)',
      desc: 'Throttle sleep deferred; debt charged to thread & cgroup pool; 30µs lease armed',
      color: 'border-emerald-500/60 text-emerald-400',
    },
    {
      id: 8,
      phase: 'RELEASE',
      title: '8. pthread_mutex_unlock(&mtx)',
      desc: 'Mutex released; next queued thread acquires lock with zero convoy stall',
      color: 'border-amber-400/60 text-amber-300',
    },
    {
      id: 9,
      phase: 'SETTLE',
      title: '9. Return-to-Userland Settlement',
      desc: 'Deferred penalty paid cleanly outside the lock; debt reconciled and pool replenished',
      color: 'border-emerald-400/60 text-emerald-300',
    },
  ];

  // Synthetic or Replay Event Trace Stream
  const eventsStream: ExecutionEvent[] = [
    {
      sequence: 1,
      nodeId: 0,
      timestampMs: 0.1,
      type: 'CGROUP_INIT',
      threadId: 0,
      label: 'Cgroup Hierarchy Initialized',
      description: 'cgroup2 mounted at /sys/fs/cgroup/crisp_bench; memory.high set to 104,857,600 bytes',
      branch: 'crisp',
      debtPages: 0,
      poolAvailable: 256,
      durationUs: 45,
    },
    {
      sequence: 2,
      nodeId: 1,
      timestampMs: 1.2,
      type: 'WORKLOAD_SPAWN',
      threadId: 1,
      label: 'Worker Thread 1 Started',
      description: 'Thread TID=1849 initialized with state RUNNING',
      branch: 'crisp',
      debtPages: 0,
      poolAvailable: 256,
      durationUs: 20,
    },
    {
      sequence: 3,
      nodeId: 2,
      timestampMs: 2.5,
      type: 'MUTEX_ACQUIRE',
      threadId: 1,
      label: 'Lock Acquired: pthread_mutex_lock',
      description: 'TID=1849 acquired mutex; crisp_flag_in_cs set to 1; queue wait: 0.04 ms',
      branch: 'crisp',
      debtPages: 0,
      poolAvailable: 256,
      durationUs: 42,
    },
    {
      sequence: 4,
      nodeId: 3,
      timestampMs: 3.1,
      type: 'MEM_ALLOC',
      threadId: 1,
      label: 'Heap Allocation: malloc(2MB)',
      description: 'TID=1849 requested 512 pages from kernel buddy allocator',
      branch: 'crisp',
      debtPages: 0,
      poolAvailable: 256,
      durationUs: 110,
    },
    {
      sequence: 5,
      nodeId: 4,
      timestampMs: 3.4,
      type: 'OVER_HIGH_DETECT',
      threadId: 1,
      label: 'memory.high Threshold Exceeded',
      description: 'Current cgroup usage 106.2 MB exceeds high limit 100.0 MB (6.2 MB overage)',
      branch: 'crisp',
      debtPages: 0,
      poolAvailable: 256,
      durationUs: 15,
    },
    {
      sequence: 6,
      nodeId: 5,
      timestampMs: 3.6,
      type: 'CRISP_GATE_EVAL',
      threadId: 1,
      label: 'CRISP-L Gate Evaluation',
      description: 'Flag checked: IN_CS=1, pending_debt=0 < cap(32), pool_headroom=256 > 0. Eligible: TRUE',
      branch: selectedBranch,
      debtPages: 0,
      poolAvailable: 256,
      durationUs: 8,
    },
    ...(selectedBranch === 'stock'
      ? [
          {
            sequence: 7,
            nodeId: 6,
            timestampMs: 3.8,
            type: 'STOCK_THROTTLE_SLEEP',
            threadId: 1,
            label: 'Stock Direct Reclaim Sleep Forced',
            description: 'TID=1849 put to sleep for 78.6 ms while holding mutex; Threads 2, 3, 4 stall in futex queue',
            branch: 'stock' as const,
            debtPages: 0,
            poolAvailable: 256,
            durationUs: 78600,
          },
          {
            sequence: 8,
            nodeId: 8,
            timestampMs: 82.4,
            type: 'MUTEX_UNLOCK_LATE',
            threadId: 1,
            label: 'Mutex Released after 78.6ms Convoy Stall',
            description: 'TID=1849 releases mutex. P99 tail latency degraded by 100x',
            branch: 'stock' as const,
            debtPages: 0,
            poolAvailable: 256,
            durationUs: 50,
          },
        ]
      : [
          {
            sequence: 7,
            nodeId: 7,
            timestampMs: 3.8,
            type: 'DEFERRAL_GRANTED',
            threadId: 1,
            label: 'Throttle Penalty Deferred to Return-to-Userland',
            description: 'Sleep penalty (30ms) deferred; 16 debt pages recorded; lease timer armed; mutex hold uninterrupted',
            branch: 'crisp' as const,
            debtPages: 16,
            poolAvailable: 240,
            durationUs: 12,
          },
          {
            sequence: 8,
            nodeId: 8,
            timestampMs: 4.1,
            type: 'MUTEX_UNLOCK_FAST',
            threadId: 1,
            label: 'Mutex Released Promptly (CS Hold: 0.08ms)',
            description: 'TID=1849 releases mutex; Thread 2 immediately unblocked without convoy inflation',
            branch: 'crisp' as const,
            debtPages: 16,
            poolAvailable: 240,
            durationUs: 35,
          },
          {
            sequence: 9,
            nodeId: 9,
            timestampMs: 4.5,
            type: 'SETTLE_COMPLETED',
            threadId: 1,
            label: 'Deferred Settlement Paid Outside Mutex',
            description: 'TID=1849 executes deferred reclaim in return-to-userland path; 16 debt pages cleared; pool credit restored to 256',
            branch: 'crisp' as const,
            debtPages: 0,
            poolAvailable: 256,
            durationUs: 30000,
          },
        ]),
  ];

  const totalSteps = eventsStream.length;
  const activeEvent = eventsStream[Math.min(currentStep, totalSteps - 1)];

  // Automatic playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const intervalTime = Math.max(200, 2400 / playbackSpeed);
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % totalSteps);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, totalSteps]);

  return (
    <div className="p-6 rounded-2xl bg-[#080A0F] border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col space-y-6">
      {/* Top Controls & Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Live Execution Flow Graph
            </h3>
            {mode === 'demo' ? (
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-pulse">
                SIMULATION — NOT LIVE KERNEL DATA
              </span>
            ) : mode === 'replay' ? (
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold">
                TRACE REPLAY: {runId}
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                LIVE KERNEL EXECUTION (QEMU / WSL2)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking individual thread lifecycle transitions from mutex acquisition to reclaim throttle deferral and return-to-userland settlement.
          </p>
        </div>

        {/* Mode Selector & Playback Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Branch Toggle */}
          <button
            onClick={() => {
              setSelectedBranch(selectedBranch === 'crisp' ? 'stock' : 'crisp');
              setCurrentStep(0);
            }}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition border ${
              selectedBranch === 'crisp'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            Branch: {selectedBranch === 'crisp' ? 'CRISP-L Deferral' : 'Stock Linux Convoy'}
          </button>

          {/* Mode Switcher */}
          {onModeChange && (
            <select
              value={mode}
              onChange={(e) => onModeChange(e.target.value as ExecutionMode)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs font-mono text-slate-200"
            >
              <option value="demo">Demo Simulation</option>
              <option value="replay">Trace Replay</option>
              <option value="real">Real Execution</option>
            </select>
          )}

          {/* Stepper Buttons */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Previous Step"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />}
            </button>
            <button
              onClick={() => setCurrentStep((prev) => (prev + 1) % totalSteps)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Next Step"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentStep(0)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speed Selector */}
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-[11px] font-mono text-slate-300"
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1.0×</option>
            <option value={2}>2.0×</option>
            <option value={5}>5.0×</option>
          </select>
        </div>
      </div>

      {/* INTERACTIVE GRAPH CANVAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {graphNodes.map((node) => {
          const isActive = activeEvent.nodeId === node.id;
          const isPassed = activeEvent.nodeId > node.id;
          const isStockBranchNode = node.id === 6;
          const isCrispBranchNode = node.id === 7 || node.id === 9;

          // Hide alternate branch nodes
          if (selectedBranch === 'crisp' && isStockBranchNode) return null;
          if (selectedBranch === 'stock' && isCrispBranchNode) return null;

          return (
            <div
              key={node.id}
              onClick={() => {
                const evIdx = eventsStream.findIndex((e) => e.nodeId === node.id);
                if (evIdx !== -1) setCurrentStep(evIdx);
              }}
              className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                isActive
                  ? 'bg-slate-900/95 border-cyan-400 shadow-[0_0_20px_rgba(89,184,255,0.25)] scale-[1.02] ring-1 ring-cyan-400/50'
                  : isPassed
                  ? 'bg-slate-950/80 border-slate-800 opacity-80'
                  : 'bg-slate-950/40 border-slate-900 opacity-40 hover:opacity-70'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-emerald-400 animate-pulse" />
              )}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {node.phase}
                </span>
                <span className={`text-[10px] font-mono font-bold ${node.color}`}>
                  {isActive ? 'ACTIVE STAGE' : isPassed ? 'COMPLETED' : 'PENDING'}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white mb-1 tracking-tight">{node.title}</h4>
              <p className="text-[11px] text-slate-400 leading-snug">{node.desc}</p>
            </div>
          );
        })}
      </div>

      {/* EVENT TELEMETRY INSPECTOR BAR */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            STEP {currentStep + 1} OF {totalSteps}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">{activeEvent.label}</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
          <span>Thread: <strong className="text-white">TID {activeEvent.threadId}</strong></span>
          <span>Debt: <strong className="text-amber-400">{activeEvent.debtPages} pages</strong></span>
          <span>Pool Headroom: <strong className="text-emerald-400">{activeEvent.poolAvailable} / 256</strong></span>
          {activeEvent.durationUs && (
            <span>Latency: <strong className="text-cyan-400">{(activeEvent.durationUs / 1000).toFixed(2)} ms</strong></span>
          )}
        </div>
      </div>

      {/* DETAILED EVENT DESCRIPTION */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs font-mono text-slate-300">
        <span className="text-slate-500 mr-2">[TRACE DETAILS]:</span>
        {activeEvent.description}
      </div>
    </div>
  );
};
