import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Activity,
  ArrowRight,
  TrendingUp,
  Shield,
  Layers,
} from 'lucide-react';
import {
  WorkloadScenario,
  ExperimentRecord,
  fetchScenarios,
  runExperimentApi,
  fetchExperiments,
} from '../api';

interface LiveExperimentLabProps {
  onNavigateToComparison: (baselineId: string, crispId: string) => void;
}

export const LiveExperimentLab: React.FC<LiveExperimentLabProps> = ({ onNavigateToComparison }) => {
  const [scenarios, setScenarios] = useState<WorkloadScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('W2');
  const [selectedPolicy, setSelectedPolicy] = useState<string>('B0');
  const [threads, setThreads] = useState<number>(4);
  const [durationSec, setDurationSec] = useState<number>(3);
  const [customName, setCustomName] = useState<string>('');

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<ExperimentRecord | null>(null);
  const [recentRuns, setRecentRuns] = useState<ExperimentRecord[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    fetchScenarios().then(setScenarios).catch(console.error);
    fetchExperiments(10).then(setRecentRuns).catch(console.error);
  }, []);

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const handleRun = async () => {
    setIsRunning(true);
    setErrorMsg('');
    try {
      const res = await runExperimentApi({
        scenario_id: selectedScenarioId,
        policy: selectedPolicy,
        threads: threads,
        duration_sec: durationSec,
        name: customName || undefined,
      });
      setCurrentResult(res);
      // Refresh recent runs
      const updated = await fetchExperiments(10);
      setRecentRuns(updated);
    } catch (e: any) {
      setErrorMsg(e.message || 'Experiment execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const policies = [
    { id: 'B0', name: 'B0 — Stock Linux (memory.high)', desc: 'Standard unmodified kernel behavior with synchronous inline reclaim & throttle sleep.' },
    { id: 'B1', name: 'B1 — memory.max Only', desc: 'Control run with no memory.high throttling (risks hard OOM kill).' },
    { id: 'B2', name: 'B2 — Pre-Lock Reclaim', desc: 'Workaround writing to memory.reclaim outside the mutex before locking.' },
    { id: 'B3', name: 'B3 — Proactive Reclaim Daemon', desc: 'Background daemon polling and reclaiming to stay under threshold.' },
    { id: 'M0', name: 'M0 — CRISP Per-Thread Cap', desc: 'Proposed user flag deferral with per-thread cap d_max = 32 pages.' },
    { id: 'M1', name: 'M1 — Shared Credit Pool', desc: 'Per-cgroup atomic credit pool bounding aggregate concurrent deferral.' },
    { id: 'M2', name: 'M2 — Quarantine Accounting', desc: 'Quarantine accounting for un-reclaimable debt under severe saturation.' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Configuration Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-dark-900 border border-dark-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-crisp-cyan" />
            Live Experiment Execution Lab
          </h2>
          <p className="text-xs text-slate-400">
            Configure workload parameters, select baseline or CRISP mechanism, and launch live execution in WSL2 Linux.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-1 rounded bg-dark-800 text-slate-400 border border-dark-700">
            Environment: <strong className="text-crisp-cyan">WSL2 Linux 6.18</strong>
          </span>
          <span className="px-2 py-1 rounded bg-crisp-emerald/10 text-crisp-emerald border border-crisp-emerald/30">
            Real C Binary Ready
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-2 space-y-5">
          {/* Scenario Selection */}
          <div className="p-5 rounded-xl bg-dark-900 border border-dark-800 space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              1. Workload Scenario (W1 to W12)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {scenarios.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => {
                    setSelectedScenarioId(sc.id);
                    setThreads(sc.threads);
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    selectedScenarioId === sc.id
                      ? 'bg-crisp-cyan/10 border-crisp-cyan text-white shadow-sm'
                      : 'bg-dark-950/60 border-dark-800 text-slate-400 hover:border-dark-700'
                  }`}
                >
                  <div className="text-xs font-bold font-mono text-crisp-cyan">{sc.id}</div>
                  <div className="text-[11px] font-medium truncate mt-0.5">{sc.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">{sc.threads}T &bull; {sc.alloc_pages}p</div>
                </button>
              ))}
            </div>

            {selectedScenario && (
              <div className="p-3 rounded-lg bg-dark-950 border border-dark-800/80 text-xs text-slate-300">
                <span className="font-semibold text-white">{selectedScenario.name}: </span>
                <span className="text-slate-400">{selectedScenario.description}</span>
                <div className="flex gap-4 mt-2 font-mono text-[11px] text-slate-400">
                  <span>CS Duration: <strong className="text-white">{selectedScenario.cs_duration_us} &mu;s</strong></span>
                  <span>Alloc Pages: <strong className="text-white">{selectedScenario.alloc_pages} (64 KB)</strong></span>
                  <span>Alloc Prob: <strong className="text-white">{selectedScenario.alloc_prob_pct}%</strong></span>
                  <span>Limit: <strong className="text-white">{selectedScenario.memory_high_mb} MB</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Policy Selection */}
          <div className="p-5 rounded-xl bg-dark-900 border border-dark-800 space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              2. Enforcement Policy
            </label>
            <div className="space-y-2">
              {policies.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPolicy(p.id)}
                  className={`w-full p-3 rounded-lg border text-left flex items-start justify-between transition-all ${
                    selectedPolicy === p.id
                      ? 'bg-crisp-cyan/10 border-crisp-cyan text-white'
                      : 'bg-dark-950/50 border-dark-800 text-slate-400 hover:border-dark-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span className="font-mono text-crisp-cyan font-bold">{p.id}</span>
                      <span>{p.name.split(' — ')[1]}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{p.desc}</p>
                  </div>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      selectedPolicy === p.id
                        ? 'border-crisp-cyan bg-crisp-cyan'
                        : 'border-dark-600'
                    }`}
                  >
                    {selectedPolicy === p.id && <div className="w-1.5 h-1.5 rounded-full bg-dark-950"></div>}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Workload Parameters */}
          <div className="p-5 rounded-xl bg-dark-900 border border-dark-800 space-y-4">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              3. Execution Parameters
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Concurrent Threads</span>
                  <span className="font-mono text-crisp-cyan font-bold">{threads} Threads</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  value={threads}
                  onChange={(e) => setThreads(parseInt(e.target.value))}
                  className="w-full accent-crisp-cyan bg-dark-800 h-1.5 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Benchmark Duration</span>
                  <span className="font-mono text-crisp-cyan font-bold">{durationSec} Seconds</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={durationSec}
                  onChange={(e) => setDurationSec(parseInt(e.target.value))}
                  className="w-full accent-crisp-cyan bg-dark-800 h-1.5 rounded cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Optional Run Label</label>
              <input
                type="text"
                placeholder="e.g. Benchmark Run #1"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-dark-800 text-xs text-white focus:outline-none focus:border-crisp-cyan font-mono"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-crisp-cyan to-crisp-blue hover:brightness-110 text-dark-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-crisp-cyan/20 transition active:scale-98 disabled:opacity-50"
            >
              <Play className={`w-4 h-4 fill-dark-950 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running Real C Benchmark in WSL...' : `Execute ${selectedPolicy} Benchmark`}</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Right Column: Active Result & Recent Runs */}
        <div className="space-y-5">
          {/* Latest Execution Card */}
          <div className="p-5 rounded-xl bg-dark-900 border border-dark-800 space-y-4">
            <div className="flex items-center justify-between border-b border-dark-800 pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Latest Run Telemetry</span>
              {currentResult && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-crisp-emerald/10 text-crisp-emerald border border-crisp-emerald/30">
                  {currentResult.category}
                </span>
              )}
            </div>

            {currentResult ? (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 font-medium">Policy:</span>
                  <span className="text-sm font-bold text-white font-mono">{currentResult.policy}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 font-medium">Throughput:</span>
                  <span className="text-sm font-bold text-crisp-cyan font-mono">
                    {currentResult.metrics?.throughput_ops_sec?.toFixed(1)} ops/sec
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 font-medium">Lock Wait p99:</span>
                  <span
                    className={`text-base font-bold font-mono ${
                      currentResult.metrics?.lock_wait_p99_ms > 10.0 ? 'text-rose-400' : 'text-crisp-emerald'
                    }`}
                  >
                    {currentResult.metrics?.lock_wait_p99_ms?.toFixed(3)} ms
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 font-medium">CS Throttle Events:</span>
                  <span
                    className={`text-xs font-bold font-mono ${
                      currentResult.metrics?.throttle_events_in_cs > 0 ? 'text-rose-400' : 'text-crisp-emerald'
                    }`}
                  >
                    {currentResult.metrics?.throttle_events_in_cs} stalls
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 font-medium">Extra Memory Overshoot:</span>
                  <span className="text-xs font-mono text-slate-300">
                    &le; {currentResult.overshoot_bound?.max_extra_kb || 512} KB
                  </span>
                </div>

                <div className="pt-3 border-t border-dark-800">
                  <button
                    onClick={() => onNavigateToComparison('latest_b0', currentResult.run_id)}
                    className="w-full py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-crisp-cyan text-xs font-semibold flex items-center justify-center gap-1.5 border border-dark-700 transition"
                  >
                    <span>Inspect Before vs After</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                <Activity className="w-8 h-8 text-dark-700 mx-auto mb-2" />
                Select a policy and click "Execute Benchmark" to view real-time latency and cgroup telemetry.
              </div>
            )}
          </div>

          {/* Recent Experiments History */}
          <div className="p-5 rounded-xl bg-dark-900 border border-dark-800 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Recent Experiment History
            </span>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {recentRuns.map((r) => (
                <div
                  key={r.run_id}
                  onClick={() => setCurrentResult(r)}
                  className="p-2.5 rounded-lg bg-dark-950/70 border border-dark-800 hover:border-dark-700 cursor-pointer text-xs transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white">{r.policy}</span>
                    <span className="text-[10px] font-mono text-slate-500">{r.run_id}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{r.threads}T &bull; {r.scenario_id}</span>
                    <span className="font-mono text-crisp-cyan">{r.p99_ms?.toFixed(2)} ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
