import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartContainer, DataProvenance } from './ChartContainer';

export interface DebtStepDataPoint {
  step: number;
  available: number;
  active: number;
  settling: number;
  quarantined: number;
}

interface DebtAccountingChartProps {
  data: DebtStepDataPoint[];
  provenance?: DataProvenance;
  title?: string;
  subtitle?: string;
  loading?: boolean;
}

export const DebtAccountingChart: React.FC<DebtAccountingChartProps> = ({
  data,
  provenance = 'analytical',
  title = 'Credit Ledger 4-State Conservation (Invariant P2)',
  subtitle = 'Conservation of aggregate cgroup credits: Available + Active + Settling + Quarantined = Pool Capacity',
  loading = false,
}) => {
  const isEmpty = !data || data.length === 0;

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      unit="Pages (4KB each)"
      provenance={provenance}
      loading={loading}
      empty={isEmpty}
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="step"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              tickFormatter={(val) => `Step ${val}`}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              tickFormatter={(val) => `${val}p`}
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
              labelFormatter={(val) => `Lifecycle Transition Step ${val}`}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }}
            />
            <Area
              type="monotone"
              dataKey="active"
              name="Active Lock Debt"
              stackId="1"
              stroke="#F6BD60"
              fill="#F6BD60"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="settling"
              name="Settling (Return-to-Userland)"
              stackId="1"
              stroke="#59B8FF"
              fill="#59B8FF"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="quarantined"
              name="Quarantined"
              stackId="1"
              stroke="#A855F7"
              fill="#A855F7"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="available"
              name="Available Headroom"
              stackId="1"
              stroke="#4AD6A7"
              fill="#4AD6A7"
              fillOpacity={0.4}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
};
