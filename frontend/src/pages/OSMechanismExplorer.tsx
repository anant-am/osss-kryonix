import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldAlert,
  Database,
  ArrowRight,
} from 'lucide-react';
import { simulateModel, AutomatonSimulation, AutomatonStep } from '../api';
import { SystemArchitectureDiagram } from '../components/diagrams/SystemArchitectureDiagram';

export const OSMechanismExplorer: React.FC = () => {
  const [stage, setStage] = useState<string>('M0');
  const [cap, setCap] = useState<number>(32);
  const [pool, setPool] = useState<number>(256);
  const [pages, setPages] = useState<number>(16);
  const [overage, setOverage] = useState<number>(0.05);

  const [simulation, setSimulation] = useState<AutomatonSimulation | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const loadSimulation = async () => {
    try {
      const res = await simulateModel({ stage, cap, pool, pages, overage });
      setSimulation(res);
      setCurrentStepIdx(0);
      setIsPlaying(false);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSimulation();
  }, [stage, cap, pool, pages, overage]);

  useEffect(() => {
    let timer: any;
    if (isPlaying && simulation && currentStepIdx < simulation.trace.length - 1) {
      timer = setTimeout(() => {
        setCurrentStepIdx((idx) => idx + 1);
      }, 1400);
    } else if (isPlaying && simulation && currentStepIdx >= simulation.trace.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIdx, simulation]);

  const step: AutomatonStep | undefined = simulation?.trace[currentStepIdx];
  const ledger = step?.ledger_state || {
    available: pool,
    active: 0,
    settling: 0,
    quarantined: 0,
    invariant_valid: true,
  };

  const states = [
    { id: 'IDLE', label: 'Idle / Work' },
    { id: 'WAITING_FOR_LOCK', label: 'Lock Contention' },
    { id: 'IN_CRITICAL_SECTION', label: 'In Lock (flag=1)' },
    { id: 'MEMORY_PRESSURE_DETECTED', label: 'Over-High Charge' },
    { id: 'EVALUATING_DEFERRAL', label: 'Kernel Check' },
    { id: 'DEFERRAL_GRANTED', label: 'Deferral Granted' },
    { id: 'FALLBACK_INLINE_THROTTLE', label: 'Fallback Throttle' },
    { id: 'UNLOCKING', label: 'Unlock (flag=0)' },
    { id: 'SETTLEMENT_PENDING', label: 'Return-to-User' },
    { id: 'SETTLING_RECLAIM', label: 'Async Settlement' },
    { id: 'COMPLETED', label: 'Finished' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="p-6 rounded-xl bg-dark-900 border border-dark-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-crisp-cyan" />
            Interactive OS Mechanism & State Machine Explorer
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Step-by-step trace of thread state transitions: user flag marking, memory.high overage evaluation,
            deferral granting, unlock callback, and delayed settlement.
          </p>
        </div>

        {/* Mechanism Stage Selector */}
        <div className="flex items-center gap-2">
          {(['M0', 'M1', 'M2'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStage(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                stage === st
                  ? 'bg-crisp-cyan text-dark-950 shadow-md shadow-crisp-cyan/20'
                  : 'bg-dark-800 text-slate-400 hover:text-white border border-dark-700'
              }`}
            >
              {st} {st === 'M0' ? '(Cap)' : st === 'M1' ? '(Pool)' : '(Quarantine)'}
            </button>
          ))}
        </div>
      </div>

      {/* Stepper Controls Bar */}
      <div className="p-4 rounded-xl bg-dark-900 border border-dark-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentStepIdx((i) => Math.max(0, i - 1))}
            disabled={currentStepIdx === 0}
            className="p-2 rounded bg-dark-800 hover:bg-dark-700 text-slate-300 disabled:opacity-30 border border-dark-700 transition"
            title="Step Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-1.5 rounded bg-crisp-cyan text-dark-950 font-bold text-xs flex items-center gap-1.5 hover:brightness-110 shadow-sm"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-dark-950" /> : <Play className="w-3.5 h-3.5 fill-dark-950" />}
            <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
          </button>

          <button
            onClick={() => setCurrentStepIdx((i) => (simulation ? Math.min(simulation.trace.length - 1, i + 1) : i))}
            disabled={!simulation || currentStepIdx >= simulation.trace.length - 1}
            className="p-2 rounded bg-dark-800 hover:bg-dark-700 text-slate-300 disabled:opacity-30 border border-dark-700 transition"
            title="Step Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setCurrentStepIdx(0);
              setIsPlaying(false);
            }}
            className="p-2 rounded bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white border border-dark-700 transition ml-2"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <span>Virtual Clock: <strong className="text-white">{step?.virtual_time_us || 0} &mu;s</strong></span>
          <span>&bull;</span>
          <span>Step <strong className="text-crisp-cyan">{currentStepIdx + 1}</strong> of {simulation?.trace.length || 0}</span>
        </div>
      </div>

      {/* Visual State Nodes Diagram */}
      <div className="p-5 rounded-xl bg-dark-900 border border-dark-800 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[750px] gap-2 py-3">
          {states.map((st, idx) => {
            const isActive = step?.to_state === st.id;
            const isPast = (simulation?.trace.findIndex((t) => t.to_state === st.id) ?? -1) <= currentStepIdx;

            return (
              <React.Fragment key={st.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-crisp-cyan text-dark-950 ring-4 ring-crisp-cyan/20 scale-110 shadow-lg shadow-crisp-cyan/30'
                        : isPast
                        ? 'bg-dark-800 text-slate-300 border border-dark-700'
                        : 'bg-dark-950 text-slate-600 border border-dark-800'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`text-[10px] text-center mt-2 font-medium max-w-[70px] truncate ${
                      isActive ? 'text-crisp-cyan font-bold' : 'text-slate-400'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
                {idx < states.length - 1 && (
                  <div className={`flex-1 h-0.5 transition-colors ${isPast ? 'bg-crisp-cyan/60' : 'bg-dark-800'}`}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Event Action Details & 4-State Credit Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step Event Card */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-dark-900 border border-dark-800 space-y-3">
          <div className="flex items-center justify-between border-b border-dark-800 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Action: <code className="text-crisp-cyan font-mono text-sm">{step?.action || 'INITIALIZING'}</code>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-slate-400 border border-dark-700">
              State: {step?.to_state || 'IDLE'}
            </span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed font-sans">{step?.detail || 'Awaiting transition...'}</p>

          <div className="p-3 rounded-lg bg-dark-950 border border-dark-800 text-xs font-mono text-slate-400 space-y-1">
            <div className="text-slate-500 uppercase text-[10px] font-bold">Kernel Context:</div>
            <div>&bull; Calling Thread: <span className="text-slate-200">worker_thread_0</span></div>
            <div>&bull; User Flag: <span className={step?.to_state === 'IN_CRITICAL_SECTION' || step?.to_state === 'DEFERRAL_GRANTED' ? 'text-crisp-emerald font-bold' : 'text-slate-500'}>crisp_user_flag = {step?.to_state === 'IN_CRITICAL_SECTION' || step?.to_state === 'DEFERRAL_GRANTED' ? '1 (IN CS)' : '0 (CLEAR)'}</span></div>
            <div>&bull; Outcome: <span className="text-crisp-cyan font-bold">{simulation?.outcome}</span></div>
          </div>
        </div>

        {/* 4-State Credit Ledger */}
        <div className="p-5 rounded-xl bg-dark-900 border border-dark-800 space-y-4">
          <div className="flex items-center justify-between border-b border-dark-800 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-4 h-4 text-crisp-cyan" />
              4-State Credit Ledger
            </span>
            <span className="text-[10px] font-mono bg-dark-800 text-slate-400 px-1.5 py-0.5 rounded">
              Total: {pool}
            </span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-slate-400">Available Credits:</span>
              <span className="text-sm font-bold text-crisp-cyan">{ledger.available}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-slate-400">Active Obligations:</span>
              <span className="text-sm font-bold text-amber-400">{ledger.active}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-slate-400">Settling Obligations:</span>
              <span className="text-sm font-bold text-crisp-indigo">{ledger.settling}</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-slate-400">Quarantined (M2):</span>
              <span className="text-sm font-bold text-rose-400">{ledger.quarantined}</span>
            </div>
          </div>

          {/* Conservation Invariant Monitor */}
          <div className="pt-2 border-t border-dark-800">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-crisp-emerald" />
                Conservation:
              </span>
              <span className="text-crisp-emerald font-bold">
                {ledger.available + ledger.active + ledger.settling + ledger.quarantined} == {pool} (0 disc)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive System Boundary & Architecture Explorer */}
      <div className="pt-4">
        <SystemArchitectureDiagram />
      </div>
    </div>
  );
};
