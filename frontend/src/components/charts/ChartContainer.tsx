import React from 'react';
import { Info, AlertCircle, Database, RefreshCw } from 'lucide-react';

export type DataProvenance = 'measured_qemu' | 'measured_wsl' | 'model_queueing' | 'simulation' | 'analytical';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  unit?: string;
  provenance?: DataProvenance;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  onRefresh?: () => void;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  unit,
  provenance = 'measured_qemu',
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'No experimental observation points recorded for this parameter set.',
  onRefresh,
  children,
  action,
  className = '',
}) => {
  const provenanceBadges: Record<DataProvenance, { label: string; color: string }> = {
    measured_qemu: {
      label: 'Measured (Linux 6.6 QEMU)',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    measured_wsl: {
      label: 'Measured (WSL2 Host)',
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    model_queueing: {
      label: 'Analytical M/G/1 Queueing',
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    simulation: {
      label: 'Simulation Model (Portable)',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    analytical: {
      label: 'State Space Analytical',
      color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },
  };

  const badge = provenanceBadges[provenance];

  return (
    <div className={`p-5 rounded-2xl bg-[#0b0f17] border border-slate-800/80 shadow-xl flex flex-col relative overflow-hidden transition-all duration-200 ${className}`}>
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100 tracking-tight">{title}</h3>
            {badge && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badge.color}`}>
                {badge.label}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {unit && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              Unit: {unit}
            </span>
          )}
          {action}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Chart Canvas Area */}
      <div className="flex-1 min-h-[220px] flex flex-col justify-center relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-7 h-7 rounded-full border-2 border-crisp-cyan/20 border-t-crisp-cyan animate-spin" />
            <span className="text-xs font-mono text-slate-400">Streaming and aggregating telemetry...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 rounded-xl bg-rose-950/20 border border-rose-900/40">
            <AlertCircle className="w-6 h-6 text-rose-400" />
            <span className="text-xs font-mono text-rose-300 font-semibold">{error}</span>
            <span className="text-[11px] text-slate-500">Check kernel runner logs or re-trigger benchmark run.</span>
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 rounded-xl bg-slate-900/40 border border-slate-800/40">
            <Database className="w-6 h-6 text-slate-600" />
            <span className="text-xs font-medium text-slate-300">{emptyMessage}</span>
            <span className="text-[11px] text-slate-500">Run an experiment in the Lab to record live kernel data.</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};
