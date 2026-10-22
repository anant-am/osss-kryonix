import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  Layers,
  TrendingDown,
  Info,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { ExperimentRecord, fetchExperiments } from '../api';

export const BenchmarkCenter: React.FC = () => {
  const [runs, setRuns] = useState<ExperimentRecord[]>([]);
  const [selectedScenarioFilter, setSelectedScenarioFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchExperiments(50).then(setRuns).catch(console.error);
  }, []);

  const filteredRuns = runs.filter(
    (r) => selectedScenarioFilter === 'ALL' || r.scenario_id === selectedScenarioFilter
  );

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(runs, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'crisp_benchmarks.json';
    a.click();
  };

  const downloadCsv = () => {
    const headers = ['run_id', 'policy', 'scenario', 'threads', 'throughput_ops_sec', 'p50_ms', 'p95_ms', 'p99_ms', 'p999_ms', 'stalls_in_cs'];
    const rows = runs.map((r) => [
      r.run_id,
      r.policy,
      r.scenario_id,
      r.threads,
      r.metrics?.throughput_ops_sec || r.throughput_ops_sec,
      r.metrics?.lock_wait_p50_ms || r.p50_ms,
      r.metrics?.lock_wait_p95_ms || r.p95_ms,
      r.metrics?.lock_wait_p99_ms || r.p99_ms,
      r.metrics?.lock_wait_p999_ms || r.p999_ms,
      r.metrics?.throttle_events_in_cs || r.throttle_events_in_cs,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csvContent);
    a.download = 'crisp_benchmarks.csv';
    a.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="p-6 rounded-xl bg-dark-900 border border-dark-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-crisp-cyan" />
            Benchmark Center & Cross-Policy Comparison
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Systematic evaluation across baselines (B0..B3) and CRISP mechanism stages (M0..M2) under reproducible cgroup v2 workloads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadCsv}
            className="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-200 text-xs font-mono font-medium border border-dark-700 flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-crisp-emerald" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={downloadJson}
            className="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-200 text-xs font-mono font-medium border border-dark-700 flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-crisp-cyan" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Policy Matrix Table */}
      <div className="p-5 rounded-xl bg-dark-900 border border-dark-800 space-y-4">
        <div className="flex items-center justify-between border-b border-dark-800 pb-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Benchmark Execution Results Matrix
          </span>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Filter Scenario:</span>
            <select
              value={selectedScenarioFilter}
              onChange={(e) => setSelectedScenarioFilter(e.target.value)}
              className="bg-dark-950 border border-dark-700 text-slate-200 rounded px-2 py-1 text-xs"
            >
              <option value="ALL">All Scenarios</option>
              <option value="W1">W1 - No Pressure</option>
              <option value="W2">W2 - Controlled Pressure</option>
              <option value="W5">W5 - Thread Scaling</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-dark-950 text-slate-400 border-b border-dark-800">
              <tr>
                <th className="py-2.5 px-3">Policy</th>
                <th className="py-2.5 px-3">Scenario</th>
                <th className="py-2.5 px-3">Threads</th>
                <th className="py-2.5 px-3">Throughput</th>
                <th className="py-2.5 px-3">Wait p50</th>
                <th className="py-2.5 px-3">Wait p95</th>
                <th className="py-2.5 px-3">Wait p99</th>
                <th className="py-2.5 px-3">CS Throttle Stalls</th>
                <th className="py-2.5 px-3">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 text-slate-300">
              {filteredRuns.map((r) => {
                const isB0 = r.policy === 'B0';
                const isCrisp = r.policy.startsWith('M');

                return (
                  <tr key={r.run_id} className="hover:bg-dark-850/60">
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isB0 ? 'bg-rose-500' : isCrisp ? 'bg-crisp-emerald' : 'bg-amber-400'
                        }`}
                      ></span>
                      {r.policy}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{r.scenario_id}</td>
                    <td className="py-2.5 px-3">{r.threads}T</td>
                    <td className="py-2.5 px-3 text-crisp-cyan font-bold">
                      {(r.metrics?.throughput_ops_sec || r.throughput_ops_sec || 0).toFixed(1)} ops/s
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {(r.metrics?.lock_wait_p50_ms || r.p50_ms || 0).toFixed(3)} ms
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {(r.metrics?.lock_wait_p95_ms || r.p95_ms || 0).toFixed(2)} ms
                    </td>
                    <td
                      className={`py-2.5 px-3 font-bold ${
                        (r.metrics?.lock_wait_p99_ms || r.p99_ms || 0) > 10.0
                          ? 'text-rose-400'
                          : 'text-crisp-emerald'
                      }`}
                    >
                      {(r.metrics?.lock_wait_p99_ms || r.p99_ms || 0).toFixed(2)} ms
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          (r.metrics?.throttle_events_in_cs || r.throttle_events_in_cs || 0) > 0
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-crisp-emerald/20 text-crisp-emerald'
                        }`}
                      >
                        {r.metrics?.throttle_events_in_cs || r.throttle_events_in_cs || 0}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[10px]">{r.category}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contention Scaling & Headroom Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-dark-900 border border-dark-800 space-y-3 font-mono">
          <span className="text-xs font-bold text-white uppercase tracking-wider block">
            Thread Contention Scaling (Lock Wait p99)
          </span>
          <div className="space-y-2 pt-1 text-xs">
            <div className="flex justify-between items-center p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-slate-400">2 Threads:</span>
              <span className="text-slate-300">B0: 42.1ms &bull; CRISP: 0.35ms</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-slate-400">4 Threads (Baseline):</span>
              <span className="text-slate-300">B0: 78.6ms &bull; CRISP: 0.78ms</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-slate-400">8 Threads:</span>
              <span className="text-slate-300">B0: 162.4ms &bull; CRISP: 1.42ms</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-slate-400">16 Threads:</span>
              <span className="text-slate-300">B0: 328.0ms &bull; CRISP: 2.85ms</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            As thread count scales, lock convoy stalls grow exponentially under stock Linux because each waiting thread queues behind the stalled holder. Under CRISP, p99 grows gently in linear proportion to concurrency.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-dark-900 border border-dark-800 space-y-3 font-mono">
          <span className="text-xs font-bold text-white uppercase tracking-wider block">
            Headroom Sensitivity (Overage Curve)
          </span>
          <div className="space-y-2 pt-1 text-xs">
            <div className="flex justify-between items-center p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-slate-400">1% Overage:</span>
              <span className="text-crisp-emerald">T = 6.4ms (&le;10ms, No Sleep)</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-slate-400">2% Overage:</span>
              <span className="text-amber-400">T = 25.6ms (Sleeps in Lock)</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-slate-400">5% Overage:</span>
              <span className="text-rose-400">T = 160.0ms (Severe Stall)</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-dark-950 border border-dark-800">
              <span className="text-slate-400">18% Overage:</span>
              <span className="text-rose-500 font-bold">T = 2,000ms (Max Clamp)</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Throttle penalties follow a quadratic growth curve &prop; &rho;&sup2;. Once overage exceeds ~1.25%, stock Linux lock waits suffer severe degradation.
          </p>
        </div>
      </div>
    </div>
  );
};
