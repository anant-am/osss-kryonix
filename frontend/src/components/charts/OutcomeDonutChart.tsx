import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartContainer, DataProvenance } from './ChartContainer';

export interface CategoryDataPoint {
  name: string;
  value: number;
  color: string;
}

interface OutcomeDonutChartProps {
  data: CategoryDataPoint[];
  provenance?: DataProvenance;
  title?: string;
  subtitle?: string;
  centerLabel?: string;
  loading?: boolean;
}

export const OutcomeDonutChart: React.FC<OutcomeDonutChartProps> = ({
  data,
  provenance = 'measured_qemu',
  title = 'Experiment Outcome & Debt Disposition',
  subtitle = 'Categorical distribution of execution completions, stalls, and debt lifecycle states',
  centerLabel = 'TOTAL',
  loading = false,
}) => {
  const isEmpty = !data || data.length === 0 || data.every((d) => d.value === 0);
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      unit="Events / Runs"
      provenance={provenance}
      loading={loading}
      empty={isEmpty}
      emptyMessage="No categorical run outcomes available yet. Run an experiment or invariant test suite."
    >
      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                backgroundColor: '#090d16',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '11px',
                fontFamily: 'monospace',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              }}
              formatter={(value: any, name: any) => [
                `${value} (${total > 0 ? ((Number(value) / total) * 100).toFixed(1) : 0}%)`,
                name,
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }}
              formatter={(value) => <span className="text-slate-300 font-mono text-xs">{value}</span>}
            />
            <Pie
              data={data}
              cx="50%"
              cy="48%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#0b0f17" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Stats Overlay */}
        {!isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">
              {centerLabel}
            </span>
            <span className="text-xl font-bold font-mono text-white tracking-tight">
              {total.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </ChartContainer>
  );
};
