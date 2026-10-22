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
  Cell,
} from 'recharts';
import { ChartContainer, DataProvenance } from './ChartContainer';
import { formatThroughput } from '../../utils/formatters';

export interface ThroughputDataPoint {
  policy: string;
  policyName: string;
  throughput: number;
  color: string;
  speedup: string;
}

interface ThroughputChartProps {
  data: ThroughputDataPoint[];
  provenance?: DataProvenance;
  title?: string;
  subtitle?: string;
  loading?: boolean;
}

export const ThroughputChart: React.FC<ThroughputChartProps> = ({
  data,
  provenance = 'measured_qemu',
  title = 'Workload Throughput Comparison',
  subtitle = 'Measured operations per second completed under cgroup memory pressure',
  loading = false,
}) => {
  const isEmpty = !data || data.length === 0;

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      unit="Operations / Sec"
      provenance={provenance}
      loading={loading}
      empty={isEmpty}
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              type="number"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              tickFormatter={(val) => `${val}`}
            />
            <YAxis
              type="category"
              dataKey="policy"
              stroke="#64748b"
              tick={{ fill: '#f1f5f9', fontSize: 11, fontFamily: 'monospace' }}
              width={60}
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
              formatter={(value: any, name: any, item: any) => [
                `${formatThroughput(Number(value))} (${item.payload.speedup})`,
                item.payload.policyName,
              ]}
            />
            <Bar dataKey="throughput" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};
