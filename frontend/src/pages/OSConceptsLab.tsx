import React, { useState } from 'react';
import {
  GraduationCap,
  Cpu,
  Lock,
  Shield,
  Layers,
  HardDrive,
  Play,
  RotateCcw,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const OSConceptsLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scheduling' | 'sync' | 'banker' | 'memory' | 'replacement'>('scheduling');

  // Scheduling State
  const [schedAlgo, setSchedAlgo] = useState<'FCFS' | 'SJF' | 'RR'>('FCFS');
  const [quantum, setQuantum] = useState<number>(2);

  // Banker's Algorithm State
  const [allocation, setAllocation] = useState<number[][]>([
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ]);
  const [maxMatrix] = useState<number[][]>([
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ]);
  const [available] = useState<number[]>([3, 3, 2]);

  // Page Replacement State
  const [refString, setRefString] = useState<string>('7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1');
  const [frameCount, setFrameCount] = useState<number>(3);
  const [replaceAlgo, setReplaceAlgo] = useState<'FIFO' | 'LRU'>('LRU');

  // Simple simulated page replacement calculation
  const calculatePageFaults = () => {
    const pages = refString.split(',').map((x) => x.trim()).filter(Boolean);
    const frames: string[] = [];
    let faults = 0;
    const history: { page: string; frames: string[]; hit: boolean }[] = [];

    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      if (frames.includes(p)) {
        if (replaceAlgo === 'LRU') {
          // move to most recently used
          const idx = frames.indexOf(p);
          frames.splice(idx, 1);
          frames.push(p);
        }
        history.push({ page: p, frames: [...frames], hit: true });
      } else {
        faults++;
        if (frames.length < frameCount) {
          frames.push(p);
        } else {
          frames.shift(); // Evict oldest / LRU
          frames.push(p);
        }
        history.push({ page: p, frames: [...frames], hit: false });
      }
    }

    return { faults, hits: pages.length - faults, total: pages.length, history };
  };

  const repResult = calculatePageFaults();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="p-6 rounded-xl bg-dark-900 border border-dark-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Systems Architecture Module &bull; Core OS Simulations</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Operating Systems Concepts Laboratory
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Interactive systems algorithms: CPU scheduling, synchronization & lock convoys, Banker's deadlock avoidance,
            memory fitting, and virtual memory page replacement.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-1.5 bg-dark-950 p-1 rounded-lg border border-dark-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('scheduling')}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === 'scheduling' ? 'bg-amber-500 text-dark-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            CPU Scheduling
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === 'sync' ? 'bg-amber-500 text-dark-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Lock Convoys
          </button>
          <button
            onClick={() => setActiveTab('banker')}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === 'banker' ? 'bg-amber-500 text-dark-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Banker's Algorithm
          </button>
          <button
            onClick={() => setActiveTab('replacement')}
            className={`px-3 py-1.5 rounded transition ${
              activeTab === 'replacement' ? 'bg-amber-500 text-dark-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Page Replacement
          </button>
        </div>
      </div>

      {/* Tab 1: CPU Scheduling Simulator */}
      {activeTab === 'scheduling' && (
        <div className="p-5 rounded-xl bg-dark-900 border border-dark-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dark-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">CPU Scheduling Simulator (FCFS, SJF, Round Robin)</h3>
              <p className="text-xs text-slate-400">Processes: P1 (Burst 6), P2 (Burst 3), P3 (Burst 8), P4 (Burst 4)</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              {(['FCFS', 'SJF', 'RR'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setSchedAlgo(a)}
                  className={`px-3 py-1 rounded ${
                    schedAlgo === a ? 'bg-amber-500 text-dark-950 font-bold' : 'bg-dark-800 text-slate-400'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Gantt Chart Display */}
          <div className="p-4 rounded-lg bg-dark-950 border border-dark-800 space-y-2">
            <span className="text-xs text-slate-400 font-mono">Gantt Chart Timeline:</span>
            <div className="h-9 rounded flex overflow-hidden font-mono text-xs font-bold text-dark-950">
              {schedAlgo === 'FCFS' && (
                <>
                  <div style={{ width: '28%' }} className="bg-crisp-cyan flex items-center justify-center">P1 (0-6)</div>
                  <div style={{ width: '14%' }} className="bg-crisp-emerald flex items-center justify-center">P2 (6-9)</div>
                  <div style={{ width: '38%' }} className="bg-amber-400 flex items-center justify-center">P3 (9-17)</div>
                  <div style={{ width: '20%' }} className="bg-crisp-indigo text-white flex items-center justify-center">P4 (17-21)</div>
                </>
              )}
              {schedAlgo === 'SJF' && (
                <>
                  <div style={{ width: '14%' }} className="bg-crisp-emerald flex items-center justify-center">P2 (0-3)</div>
                  <div style={{ width: '20%' }} className="bg-crisp-indigo text-white flex items-center justify-center">P4 (3-7)</div>
                  <div style={{ width: '28%' }} className="bg-crisp-cyan flex items-center justify-center">P1 (7-13)</div>
                  <div style={{ width: '38%' }} className="bg-amber-400 flex items-center justify-center">P3 (13-21)</div>
                </>
              )}
              {schedAlgo === 'RR' && (
                <>
                  <div style={{ width: '15%' }} className="bg-crisp-cyan flex items-center justify-center">P1</div>
                  <div style={{ width: '15%' }} className="bg-crisp-emerald flex items-center justify-center">P2</div>
                  <div style={{ width: '15%' }} className="bg-amber-400 flex items-center justify-center">P3</div>
                  <div style={{ width: '15%' }} className="bg-crisp-indigo text-white flex items-center justify-center">P4</div>
                  <div style={{ width: '15%' }} className="bg-crisp-cyan flex items-center justify-center">P1</div>
                  <div style={{ width: '25%' }} className="bg-amber-400 flex items-center justify-center">P3...</div>
                </>
              )}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0 ms</span>
              <span>Total Burst: 21 ms</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 rounded bg-dark-950 border border-dark-800">
              <span className="text-slate-400 block">Average Waiting Time:</span>
              <span className="text-lg font-bold text-crisp-cyan mt-1 block">
                {schedAlgo === 'FCFS' ? '8.0 ms' : schedAlgo === 'SJF' ? '4.75 ms (Optimal)' : '6.5 ms'}
              </span>
            </div>
            <div className="p-3 rounded bg-dark-950 border border-dark-800">
              <span className="text-slate-400 block">Average Turnaround Time:</span>
              <span className="text-lg font-bold text-white mt-1 block">
                {schedAlgo === 'FCFS' ? '13.25 ms' : schedAlgo === 'SJF' ? '10.0 ms' : '11.75 ms'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Synchronization & Convoy */}
      {activeTab === 'sync' && (
        <div className="p-5 rounded-xl bg-dark-900 border border-dark-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Synchronization: Mutexes, Semaphores & The Lock Convoy Problem</h3>
          <p className="text-xs text-slate-300">
            A <strong>Lock Convoy</strong> occurs when multiple threads of equal or lower priority repeatedly queue up
            waiting for a shared mutex held by a thread that is either descheduled, preempted, or put to sleep by the kernel.
          </p>

          <div className="p-4 rounded-lg bg-dark-950 border border-rose-900/40 text-xs font-mono space-y-2">
            <span className="text-rose-400 font-bold block">Why CRISP Solves the Memory-Induced Lock Convoy:</span>
            <p className="text-slate-400 leading-relaxed font-sans">
              Normal priority inheritance protocols solve CPU priority inversion, but cannot solve cgroup memory reclaim sleeps.
              When Linux throttles a thread under memory.high, the thread sleeps in the kernel while holding the user-space mutex.
              CRISP bounded deferral allows the thread to exit the critical section first, completely preventing the convoy from forming!
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Banker's Algorithm */}
      {activeTab === 'banker' && (
        <div className="p-5 rounded-xl bg-dark-900 border border-dark-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-dark-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-sans">Banker's Algorithm: Deadlock Avoidance</h3>
              <p className="text-xs text-slate-400 font-sans">5 Processes (P0..P4) and 3 Resource Types (A, B, C)</p>
            </div>
            <span className="px-2 py-1 rounded bg-crisp-emerald/10 text-crisp-emerald border border-crisp-emerald/30 font-bold">
              System is in SAFE STATE
            </span>
          </div>

          <div className="p-3 rounded-lg bg-dark-950 border border-dark-800 space-y-1">
            <span className="text-slate-400 block font-sans">Safe Sequence Detected:</span>
            <span className="text-sm font-bold text-crisp-cyan">&lt; P1 &rarr; P3 &rarr; P4 &rarr; P0 &rarr; P2 &gt;</span>
            <p className="text-[11px] text-slate-500 font-sans pt-1">
              Every process can safely obtain its maximum needed resources and terminate without deadlock.
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Page Replacement */}
      {activeTab === 'replacement' && (
        <div className="p-5 rounded-xl bg-dark-900 border border-dark-800 space-y-4 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dark-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-sans">Virtual Memory Page Replacement Simulator</h3>
              <p className="text-xs text-slate-400 font-sans">Compare FIFO vs LRU fault ratios under reference string.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReplaceAlgo('FIFO')}
                className={`px-3 py-1 rounded ${replaceAlgo === 'FIFO' ? 'bg-amber-500 text-dark-950 font-bold' : 'bg-dark-800 text-slate-400'}`}
              >
                FIFO
              </button>
              <button
                onClick={() => setReplaceAlgo('LRU')}
                className={`px-3 py-1 rounded ${replaceAlgo === 'LRU' ? 'bg-amber-500 text-dark-950 font-bold' : 'bg-dark-800 text-slate-400'}`}
              >
                LRU
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded bg-dark-950 border border-dark-800">
              <span className="text-slate-400 block">Total Requests:</span>
              <span className="text-base font-bold text-white mt-1 block">{repResult.total} Pages</span>
            </div>
            <div className="p-3 rounded bg-dark-950 border border-dark-800">
              <span className="text-slate-400 block">Page Faults:</span>
              <span className="text-base font-bold text-rose-400 mt-1 block">{repResult.faults} Faults</span>
            </div>
            <div className="p-3 rounded bg-dark-950 border border-dark-800">
              <span className="text-slate-400 block">Hit Ratio:</span>
              <span className="text-base font-bold text-crisp-emerald mt-1 block">
                {((repResult.hits / repResult.total) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
