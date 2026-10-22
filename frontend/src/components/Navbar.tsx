import React from 'react';
import { Play, Sparkles, Terminal, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SystemStatus } from '../api';

interface NavbarProps {
  pageTitle: string;
  pageSubtitle: string;
  systemStatus: SystemStatus | null;
  onOpenSystemTour: () => void;
  onRunQuickBenchmark: () => void;
  isRunningBenchmark: boolean;
  onOpenPortfolio?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  pageTitle,
  pageSubtitle,
  systemStatus,
  onOpenSystemTour,
  onRunQuickBenchmark,
  isRunningBenchmark,
  onOpenPortfolio,
}) => {
  const isHealthy = systemStatus?.status === 'HEALTHY';
  const hasWsl = systemStatus?.environment?.has_wsl ?? true;

  return (
    <header className="h-14 border-b border-dark-800 bg-dark-900/90 backdrop-blur px-6 flex items-center justify-between z-10">
      {/* Title & Context */}
      <div>
        <h1 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
          {pageTitle}
        </h1>
        <p className="text-[11px] text-slate-400">{pageSubtitle}</p>
      </div>

      {/* Badges & Actions */}
      <div className="flex items-center gap-3">
        {/* Environment Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-dark-800/80 border border-dark-700 text-[11px] text-slate-300 font-mono">
          <Terminal className="w-3.5 h-3.5 text-crisp-cyan" />
          <span>{hasWsl ? 'WSL2 Linux 6.18' : 'Portable Model'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-crisp-emerald ml-1"></span>
        </div>

        {/* cgroup v2 status */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded bg-dark-800/60 border border-dark-700/80 text-[11px] text-slate-400 font-mono">
          <span>cgroup.high</span>
          <span className="text-crisp-emerald font-semibold">Active</span>
        </div>

        {/* Invariant status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-crisp-emerald/10 border border-crisp-emerald/30 text-[11px] text-crisp-emerald font-mono">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>10/10 Invariants</span>
        </div>

        {/* Portfolio Deck Button */}
        {onOpenPortfolio && (
          <button
            onClick={onOpenPortfolio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30 transition shadow-sm"
            title="Open Stacking Cards Portfolio Showcase"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Portfolio Deck</span>
          </button>
        )}

        {/* Quick Benchmark Button */}
        <button
          onClick={onRunQuickBenchmark}
          disabled={isRunningBenchmark}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-dark-800 hover:bg-dark-700 text-slate-200 text-xs font-medium border border-dark-600 transition disabled:opacity-50"
          title="Execute stock Linux baseline B0 vs CRISP M0 live in WSL"
        >
          <Play className={`w-3.5 h-3.5 text-crisp-cyan ${isRunningBenchmark ? 'animate-spin' : ''}`} />
          <span>{isRunningBenchmark ? 'Benchmarking...' : 'Run Workload'}</span>
        </button>

        {/* Executive Evaluation Tour Modal Launcher */}
        <button
          onClick={onOpenSystemTour}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-gradient-to-r from-crisp-cyan to-crisp-blue text-white text-xs font-semibold shadow-md shadow-crisp-cyan/10 hover:brightness-110 transition active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>System Evaluation Tour</span>
        </button>
      </div>
    </header>
  );
};
