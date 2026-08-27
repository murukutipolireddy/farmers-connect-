'use client';

import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const earningsData = [
  { month: 'Jun', earnings: 42800, orders: 8, avgGrade: 'B' },
  { month: 'Jul', earnings: 38200, orders: 6, avgGrade: 'B' },
  { month: 'Aug', earnings: 31500, orders: 5, avgGrade: 'C' },
  { month: 'Sep', earnings: 54600, orders: 9, avgGrade: 'A' },
  { month: 'Oct', earnings: 72400, orders: 14, avgGrade: 'A' },
  { month: 'Nov', earnings: 68900, orders: 12, avgGrade: 'A' },
  { month: 'Dec', earnings: 55200, orders: 10, avgGrade: 'B' },
  { month: 'Jan', earnings: 29800, orders: 5, avgGrade: 'B' },
  { month: 'Feb', earnings: 44100, orders: 8, avgGrade: 'B' },
  { month: 'Mar', earnings: 88600, orders: 18, avgGrade: 'A' },
  { month: 'Apr', earnings: 156400, orders: 26, avgGrade: 'A' },
  { month: 'May', earnings: 184320, orders: 31, avgGrade: 'A' },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: typeof earningsData[0] }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="card p-3 text-sm"
      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: '160px' }}
    >
      <p className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{label} 2025–26</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span style={{ color: 'var(--muted-foreground)' }}>Earnings</span>
          <span className="font-bold tabular-nums" style={{ color: 'var(--primary)' }}>
            ₹{d.earnings.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span style={{ color: 'var(--muted-foreground)' }}>Orders</span>
          <span className="font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>{d.orders}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span style={{ color: 'var(--muted-foreground)' }}>Avg Grade</span>
          <span className="font-semibold" style={{ color: d.avgGrade === 'A' ? 'var(--success)' : d.avgGrade === 'B' ? 'var(--info)' : 'var(--warning)' }}>
            {d.avgGrade}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function EarningsChartInner() {
  const [highlightMonth, setHighlightMonth] = useState<string | null>(null);
  const total = earningsData.reduce((s, d) => s + d.earnings, 0);
  const avg = Math.round(total / earningsData.length);

  return (
    <div className="card p-5 h-full">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-display font-semibold text-base" style={{ color: 'var(--foreground)' }}>
            Monthly Earnings
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Jun 2025 – May 2026 · Settled payments only
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            +18.4% MoM
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart
          data={earningsData}
          margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
          onMouseMove={(e) => {
            if (e.activeLabel) setHighlightMonth(e.activeLabel);
          }}
          onMouseLeave={() => setHighlightMonth(null)}
        >
          <defs>
            <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-dm-sans)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-dm-sans)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
          <ReferenceLine
            y={avg}
            stroke="var(--chart-2)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: 'Avg', position: 'right', fontSize: 10, fill: 'var(--chart-2)' }}
          />
          <Area
            type="monotone"
            dataKey="earnings"
            stroke="var(--chart-1)"
            strokeWidth={2.5}
            fill="url(#earningsGradient)"
            dot={false}
            activeDot={{ r: 5, fill: 'var(--chart-1)', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Summary row */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Season Total</p>
          <p className="text-base font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
            ₹{total.toLocaleString('en-IN')}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Monthly Avg</p>
          <p className="text-base font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
            ₹{avg.toLocaleString('en-IN')}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Best Month</p>
          <p className="text-base font-bold" style={{ color: 'var(--primary)' }}>May — ₹1.84L</p>
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Total Orders</p>
          <p className="text-base font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
            {earningsData.reduce((s, d) => s + d.orders, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}