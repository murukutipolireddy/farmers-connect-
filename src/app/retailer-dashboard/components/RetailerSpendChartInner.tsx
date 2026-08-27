'use client';

import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const spendData = [
  { month: 'Jun', spend: 28000, orders: 4 },
  { month: 'Jul', spend: 35000, orders: 5 },
  { month: 'Aug', spend: 42000, orders: 6 },
  { month: 'Sep', spend: 31000, orders: 4 },
  { month: 'Oct', spend: 48000, orders: 7 },
  { month: 'Nov', spend: 56000, orders: 9 },
  { month: 'Dec', spend: 64000, orders: 10 },
  { month: 'Jan', spend: 51000, orders: 8 },
  { month: 'Feb', spend: 49000, orders: 7 },
  { month: 'Mar', spend: 72000, orders: 12 },
  { month: 'Apr', spend: 98000, orders: 15 },
  { month: 'May', spend: 110000, orders: 18 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: typeof spendData[0] }>;
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
          <span style={{ color: 'var(--muted-foreground)' }}>Sourcing Spend</span>
          <span className="font-bold tabular-nums" style={{ color: 'var(--primary)' }}>
            ₹{d.spend.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span style={{ color: 'var(--muted-foreground)' }}>Orders Placed</span>
          <span className="font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>{d.orders}</span>
        </div>
      </div>
    </div>
  );
}

export default function RetailerSpendChartInner() {
  const [highlightMonth, setHighlightMonth] = useState<string | null>(null);
  const total = spendData.reduce((s, d) => s + d.spend, 0);
  const avg = Math.round(total / spendData.length);

  return (
    <div className="card p-5 h-full">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-display font-semibold text-base" style={{ color: 'var(--foreground)' }}>
            Sourcing Spend Analysis
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Monthly purchasing volume & total procurement costs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            +12.2% Direct Sourcing Growth
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart
          data={spendData}
          margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
          onMouseMove={(e) => {
            if (e.activeLabel) setHighlightMonth(e.activeLabel);
          }}
          onMouseLeave={() => setHighlightMonth(null)}
        >
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.02} />
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
            stroke="var(--chart-1)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{ value: 'Avg Spend', position: 'right', fontSize: 10, fill: 'var(--chart-1)' }}
          />
          <Area
            type="monotone"
            dataKey="spend"
            stroke="var(--chart-2)"
            strokeWidth={2.5}
            fill="url(#spendGradient)"
            dot={false}
            activeDot={{ r: 5, fill: 'var(--chart-2)', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Summary row */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Total Sourced</p>
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
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Total Orders</p>
          <p className="text-base font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
            {spendData.reduce((s, d) => s + d.orders, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
