import React from 'react';
import { ChartContainer, DataProvenance } from './ChartContainer';
import { formatDurationMs } from '../../utils/formatters';

export interface TimelineSpan {
  id: string;
  threadId: number;
  label: string;
  type: 'RUNNING' | 'CRITICAL_SECTION' | 'MUTEX_WAIT' | 'THROTTLE_SLEEP' | 'DEFERRED_SETTLE';
  startMs: number;
  durationMs: number;
}

interface ExecutionTimelineProps {
  spans: TimelineSpan[];
  provenance?: DataProvenance;
  title?: string;
  subtitle?: string;
  totalDurationMs?: number;
  loading?: boolean;
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({
  spans,
  provenance = 'measured_qemu',
  title = 'Thread Execution & Lock Contention Timeline',
  subtitle = 'Gantt-style swimlane comparison of critical section duration, mutex waits, and reclaim throttle sleeps',
  totalDurationMs = 120,
  loading = false,
}) => {
  const isEmpty = !spans || spans.length === 0;

  // Group spans by threadId
  const threadMap: Record<number, TimelineSpan[]> = {};
  spans.forEach((span) => {
    if (!threadMap[span.threadId]) {
      threadMap[span.threadId] = [];
    }
    threadMap[span.threadId].push(span);
  });

  const threads = Object.keys(threadMap).map(Number).sort((a, b) => a - b);

  const typeConfig: Record<string, { label: string; color: string; border: string }> = {
    RUNNING: { label: 'Normal User Execution', color: 'bg-slate-700', border: 'border-slate-600' },
    CRITICAL_SECTION: { label: 'Critical Section (Mutex Held)', color: 'bg-amber-500', border: 'border-amber-400' },
    MUTEX_WAIT: { label: 'Blocked in pthread_mutex_lock()', color: 'bg-rose-500/80', border: 'border-rose-400' },
    THROTTLE_SLEEP: { label: 'Kernel mem_cgroup Throttle Sleep', color: 'bg-purple-600', border: 'border-purple-400' },
    DEFERRED_SETTLE: { label: 'CRISP-L Return-to-Userland Settle', color: 'bg-emerald-500', border: 'border-emerald-400' },
  };

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      unit="Time (Milliseconds)"
      provenance={provenance}
      loading={loading}
      empty={isEmpty}
    >
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono pb-2 border-b border-slate-800">
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-sm ${cfg.color}`} />
              <span className="text-slate-400">{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* Swimlanes Container */}
        <div className="space-y-2.5 py-1">
          {threads.map((tId) => (
            <div key={tId} className="flex items-center gap-3 font-mono text-xs">
              <div className="w-20 shrink-0 text-slate-400 font-bold flex items-center justify-between">
                <span>Thread {tId}</span>
              </div>

              {/* Lane Bar Container */}
              <div className="flex-1 h-7 bg-slate-900/80 rounded-lg border border-slate-800/80 relative overflow-hidden">
                {threadMap[tId].map((span) => {
                  const leftPct = Math.min(100, Math.max(0, (span.startMs / totalDurationMs) * 100));
                  const widthPct = Math.min(100 - leftPct, Math.max(1, (span.durationMs / totalDurationMs) * 100));
                  const cfg = typeConfig[span.type] || typeConfig.RUNNING;

                  return (
                    <div
                      key={span.id}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      className={`absolute top-1 bottom-1 rounded-sm ${cfg.color} border ${cfg.border} flex items-center justify-center text-[10px] text-white font-mono truncate px-1 transition-all group cursor-pointer hover:brightness-125`}
                      title={`${span.label}: ${formatDurationMs(span.durationMs)} (from ${span.startMs.toFixed(2)}ms to ${(span.startMs + span.durationMs).toFixed(2)}ms)`}
                    >
                      <span className="truncate opacity-90 group-hover:opacity-100">{span.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Time Axis Ruler */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800">
          <span>0.0 ms</span>
          <span>{(totalDurationMs * 0.25).toFixed(1)} ms</span>
          <span>{(totalDurationMs * 0.5).toFixed(1)} ms</span>
          <span>{(totalDurationMs * 0.75).toFixed(1)} ms</span>
          <span>{totalDurationMs.toFixed(1)} ms (Duration)</span>
        </div>
      </div>
    </ChartContainer>
  );
};
