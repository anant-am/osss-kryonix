import React, { useState } from 'react';
import {
  Clock,
  Layers,
  ShieldAlert,
  Sparkles,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const SchedulerTimeline: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'B0' | 'M0'>('B0');

  // Timeline events definition for B0 (Stock Linux Stall Convoy)
  const b0Timeline = [
    {
      thread: 'Thread 0 (Holder & Allocator)',
      blocks: [
        { type: 'user', start: 0, width: 10, label: 'User Code' },
        { type: 'lock', start: 10, width: 5, label: 'Lock Acquire' },
        { type: 'cs', start: 15, width: 15, label: 'In Lock (Alloc)' },
        { type: 'throttle', start: 30, width: 45, label: 'THROTTLE SLEEP (Stall in Lock)' },
        { type: 'cs', start: 75, width: 5, label: 'Unlock' },
        { type: 'user', start: 80, width: 20, label: 'Resume User' },
      ],
    },
    {
      thread: 'Thread 1 (Waiter)',
      blocks: [
        { type: 'user', start: 0, width: 18, label: 'User Code' },
        { type: 'wait', start: 18, width: 62, label: 'BLOCKED WAITING ON MUTEX (Convoy Stall)' },
        { type: 'cs', start: 80, width: 10, label: 'In Critical Section' },
        { type: 'user', start: 90, width: 10, label: 'User Code' },
      ],
    },
    {
      thread: 'Thread 2 (Waiter)',
      blocks: [
        { type: 'user', start: 0, width: 25, label: 'User Code' },
        { type: 'wait', start: 25, width: 65, label: 'BLOCKED WAITING ON MUTEX' },
        { type: 'cs', start: 90, width: 8, label: 'In CS' },
        { type: 'user', start: 98, width: 2, label: '' },
      ],
    },
    {
      thread: 'Thread 3 (Waiter)',
      blocks: [
        { type: 'user', start: 0, width: 32, label: 'User Code' },
        { type: 'wait', start: 32, width: 68, label: 'BLOCKED WAITING ON MUTEX' },
      ],
    },
  ];

  // Timeline events definition for M0 (CRISP Deferral)
  const m0Timeline = [
    {
      thread: 'Thread 0 (Holder & Allocator)',
      blocks: [
        { type: 'user', start: 0, width: 10, label: 'User Code' },
        { type: 'lock', start: 10, width: 5, label: 'Lock Acquire' },
        { type: 'cs', start: 15, width: 15, label: 'In Lock (flag=1, Defer)' },
        { type: 'cs', start: 30, width: 5, label: 'Unlock (flag=0)' },
        { type: 'settle', start: 35, width: 45, label: 'ASYNC SETTLEMENT (Outside Lock)' },
        { type: 'user', start: 80, width: 20, label: 'Resume User' },
      ],
    },
    {
      thread: 'Thread 1 (Waiter)',
      blocks: [
        { type: 'user', start: 0, width: 18, label: 'User Code' },
        { type: 'wait', start: 18, width: 17, label: 'Wait (Brief)' },
        { type: 'cs', start: 35, width: 15, label: 'Acquired Lock Immediately!' },
        { type: 'user', start: 50, width: 50, label: 'Normal Execution & Progress' },
      ],
    },
    {
      thread: 'Thread 2 (Waiter)',
      blocks: [
        { type: 'user', start: 0, width: 25, label: 'User Code' },
        { type: 'wait', start: 25, width: 25, label: 'Wait' },
        { type: 'cs', start: 50, width: 15, label: 'Acquired Lock' },
        { type: 'user', start: 65, width: 35, label: 'Normal User Work' },
      ],
    },
    {
      thread: 'Thread 3 (Waiter)',
      blocks: [
        { type: 'user', start: 0, width: 32, label: 'User Code' },
        { type: 'wait', start: 32, width: 33, label: 'Wait' },
        { type: 'cs', start: 65, width: 15, label: 'Acquired Lock' },
        { type: 'user', start: 80, width: 20, label: 'Normal Work' },
      ],
    },
  ];

  const currentTimeline = activeMode === 'B0' ? b0Timeline : m0Timeline;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="p-6 rounded-xl bg-dark-900 border border-dark-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-crisp-cyan" />
            Scheduler & Thread Timeline (Gantt Swimlane)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Visualizing thread progression, lock acquisition, throttle sleep stalls, and asynchronous settlement.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2 bg-dark-950 p-1.5 rounded-lg border border-dark-800">
          <button
            onClick={() => setActiveMode('B0')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
              activeMode === 'B0'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            B0: Stock Linux Stall
          </button>
          <button
            onClick={() => setActiveMode('M0')}
            className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all ${
              activeMode === 'M0'
                ? 'bg-crisp-emerald/20 text-crisp-emerald border border-crisp-emerald/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            M0: CRISP Deferral
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono p-3 rounded-xl bg-dark-900 border border-dark-800">
        <span className="text-slate-500 uppercase text-[10px] font-bold">Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-dark-700"></div>
          <span className="text-slate-300">User Mode Execution</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-crisp-cyan"></div>
          <span className="text-slate-300">In Critical Section (Lock Held)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-amber-500/80"></div>
          <span className="text-slate-300">Blocked on Mutex (Wait)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-rose-500 animate-pulse"></div>
          <span className="text-slate-300">Memcg Throttle Stall (Sleep)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded bg-crisp-indigo"></div>
          <span className="text-slate-300">Async Settlement (Outside Lock)</span>
        </div>
      </div>

      {/* Swimlane Diagram */}
      <div className="p-6 rounded-xl bg-dark-900 border border-dark-800 space-y-6">
        <div className="flex justify-between text-xs text-slate-500 font-mono border-b border-dark-800 pb-2">
          <span>T = 0 ms</span>
          <span>T = 25 ms</span>
          <span>T = 50 ms</span>
          <span>T = 75 ms</span>
          <span>T = 100 ms</span>
        </div>

        <div className="space-y-5">
          {currentTimeline.map((lane, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="text-xs font-semibold font-mono text-slate-300 flex items-center justify-between">
                <span>{lane.thread}</span>
                <span className="text-[10px] text-slate-500 font-normal">vCPU Core {idx}</span>
              </div>
              <div className="h-8 rounded-lg bg-dark-950 p-1 flex items-center border border-dark-800/80 relative overflow-hidden">
                {lane.blocks.map((b, bIdx) => {
                  let bgClass = 'bg-dark-700 text-slate-300';
                  if (b.type === 'cs') bgClass = 'bg-crisp-cyan text-dark-950 font-bold';
                  if (b.type === 'wait') bgClass = 'bg-amber-500/80 text-dark-950 font-bold';
                  if (b.type === 'throttle') bgClass = 'bg-rose-500 text-white font-bold animate-pulse shadow-md shadow-rose-500/30';
                  if (b.type === 'settle') bgClass = 'bg-crisp-indigo text-white font-bold';

                  return (
                    <div
                      key={bIdx}
                      style={{ width: `${b.width}%` }}
                      className={`h-full rounded flex items-center justify-center text-[10px] font-mono truncate px-1 transition-all ${bgClass}`}
                      title={`${lane.thread}: ${b.label}`}
                    >
                      {b.label}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Architectural Context */}
      <div className="p-5 rounded-xl bg-dark-900 border border-dark-800 space-y-2">
        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-crisp-cyan" />
          Timeline Analysis: Why the Convoy Vanishes under CRISP
        </span>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          Under stock Linux (B0), Thread 0 encounters memory pressure while holding the mutex. The kernel blocks Thread 0 inside{' '}
          <code className="text-crisp-cyan font-mono">mem_cgroup_handle_over_high()</code> for 45ms. Threads 1, 2, and 3 are completely healthy,
          yet remain stalled in user-space waiting for the mutex release.
        </p>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          Under CRISP (M0), Thread 0 detects <code className="text-crisp-cyan font-mono">crisp_user_flag == 1</code>, records its 16-page debt,
          and skips the inline throttle sleep. It unlocks the mutex at T=30ms, allowing Thread 1, 2, and 3 to acquire the mutex immediately.
          Thread 0 then settles its 45ms sleep outside the critical section, preserving total throttle work without inflicting collateral damage.
        </p>
      </div>
    </div>
  );
};
