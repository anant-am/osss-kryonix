import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartContainer, DataProvenance } from './ChartContainer';
import { formatDurationMs } from '../../utils/formatters';

export interface LatencyComparisonDataPoint {
  percentile: string;
  stockB0: number;
  workaroundB2?: number;
  crispM0: number;
}

interface LatencyComparisonChartProps {
  data: LatencyComparisonDataPoint[];
  provenance?: DataProvenance;
  title?: string;
  subtitle?: string;
  loading?: boolean;
}

export const LatencyComparisonChart: React.FC<LatencyComparisonChartProps> = ({
  data,
  provenance = 'measured_qemu',
  title = 'Lock-Wait Latency by Percentile (p50 → p99.9)',
  subtitle = 'Evaluating lock-contention wait latency across percentiles under memory.high pressure',
  loading = false,
}) => {
  const isEmpty = !data || data.length === 0;

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      unit="Milliseconds (ms, log scale)"
      provenance={provenance}
      loading={loading}
      empty={isEmpty}
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="percentile"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              tickFormatter={(val) => `${val}ms`}
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
              formatter={(value: any) => [`${formatDurationMs(Number(value))}`, '']}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }}
            />
            <Bar
              dataKey="stockB0"
              name="Stock Linux (B0)"
              fill="#FF647C"
              radius={[4, 4, 0, 0]}
            />
            {data[0]?.workaroundB2 !== undefined && (
              <Bar
                dataKey="workaroundB2"
                name="Pre-Lock Reclaim (B2)"
                fill="#F6BD60"
                radius={[4, 4, 0, 0]}
              />
            )}
            <Bar
              dataKey="crispM0"
              name="CRISP-L (M0)"
              fill="#4AD6A7"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};
