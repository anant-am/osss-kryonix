import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { ChartContainer, DataProvenance } from './ChartContainer';
import { formatBytes } from '../../utils/formatters';

export interface MemoryDataPoint {
  timeSec: number;
  memoryUsageMb: number;
  memoryHighLimitMb: number;
  deferredDebtPages?: number;
  reclaimEvents?: number;
}

interface MemoryUsageChartProps {
  data: MemoryDataPoint[];
  provenance?: DataProvenance;
  title?: string;
  subtitle?: string;
  loading?: boolean;
}

export const MemoryUsageChart: React.FC<MemoryUsageChartProps> = ({
  data,
  provenance = 'measured_qemu',
  title = 'cgroup v2 Memory Usage & Deferred Debt Over Time',
  subtitle = 'Tracking physical container memory against memory.high boundary with deferred page debt',
  loading = false,
}) => {
  const isEmpty = !data || data.length === 0;

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      unit="Megabytes (MB)"
      provenance={provenance}
      loading={loading}
      empty={isEmpty}
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="timeSec"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              tickFormatter={(val) => `${val}s`}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              domain={[0, 'dataMax + 10']}
              tickFormatter={(val) => `${val} MB`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#090d16',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '11px',
                fontFamily: 'monospace',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              }}
              labelFormatter={(label) => `Timestamp: ${label}s`}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }}
            />
            {data[0]?.memoryHighLimitMb && (
              <ReferenceLine
                y={data[0].memoryHighLimitMb}
                stroke="#ff4500"
                strokeDasharray="4 4"
                label={{
                  value: `memory.high (${data[0].memoryHighLimitMb} MB)`,
                  fill: '#ff6b4a',
                  fontSize: 10,
                  position: 'top',
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="memoryUsageMb"
              name="Memory Usage (MB)"
              stroke="#59B8FF"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: '#59B8FF' }}
            />
            <Line
              type="monotone"
              dataKey="deferredDebtPages"
              name="Deferred Debt (Pages)"
              stroke="#F6BD60"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              activeDot={{ r: 4, fill: '#F6BD60' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};
