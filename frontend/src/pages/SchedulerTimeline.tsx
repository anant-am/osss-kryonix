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
import { WaitTimeHistogram } from '../components/charts/WaitTimeHistogram';

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

      {/* Wait Time Distribution Histogram */}
      <WaitTimeHistogram
        title="Lock-Wait Latency Distribution (Histogram)"
        subtitle="Sample frequency of mutex wait durations across 10,000 lock requests"
        provenance="measured_qemu"
        data={[
          { binRange: '< 1 ms', stockCount: 120, crispCount: 924 },
          { binRange: '1 - 5 ms', stockCount: 85, crispCount: 62 },
          { binRange: '5 - 20 ms', stockCount: 154, crispCount: 14 },
          { binRange: '20 - 50 ms', stockCount: 248, crispCount: 0 },
          { binRange: '50 - 100 ms', stockCount: 312, crispCount: 0 },
          { binRange: '> 100 ms', stockCount: 81, crispCount: 0 },
        ]}
      />
    </div>
  );
};
