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

export interface HistogramBin {
  binRange: string;
  stockCount: number;
  crispCount: number;
}

interface WaitTimeHistogramProps {
  data: HistogramBin[];
  provenance?: DataProvenance;
  title?: string;
  subtitle?: string;
  loading?: boolean;
}

export const WaitTimeHistogram: React.FC<WaitTimeHistogramProps> = ({
  data,
  provenance = 'measured_qemu',
  title = 'Mutex Wait Time Distribution Histogram',
  subtitle = 'Frequency of thread lock-wait times binned into duration brackets',
  loading = false,
}) => {
  const isEmpty = !data || data.length === 0;

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      unit="Frequency / Thread Count"
      provenance={provenance}
      loading={loading}
      empty={isEmpty}
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="binRange"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
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
              labelFormatter={(label) => `Latency Range: ${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }}
            />
            <Bar
              dataKey="stockCount"
              name="Stock Linux (B0)"
              fill="#FF647C"
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="crispCount"
              name="CRISP-L (M0)"
              fill="#4AD6A7"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};
