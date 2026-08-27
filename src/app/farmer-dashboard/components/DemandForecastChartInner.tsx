'use client';

import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { Sparkles } from 'lucide-react';

const demandData = [
  { crop: 'Tomato', week1: 88, week2: 92, week3: 76, week4: 64, trend: 'down' },
  { crop: 'Onion', week1: 72, week2: 84, week3: 91, week4: 89, trend: 'up' },
  { crop: 'Spinach', week1: 95, week2: 88, week3: 82, week4: 70, trend: 'down' },
  { crop: 'Capsicum', week1: 58, week2: 71, week3: 83, week4: 90, trend: 'up' },
  { crop: 'Carrot', week1: 67, week2: 69, week3: 72, week4: 68, trend: 'stable' },
  { crop: 'Potato', week1: 80, week2: 75, week3: 70, week4: 65, trend: 'down' },
];

type WeekKey = 'week1' | 'week2' | 'week3' | 'week4';
const weekLabels: Record<WeekKey, string> = {
  week1: 'Wk 1 (May 7)',
  week2: 'Wk 2 (May 14)',
  week3: 'Wk 3 (May 21)',
  week4: 'Wk 4 (May 28)',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const score = payload[0].value;
  return (
    <div className="card p-3 text-sm" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      <p className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>{label}</p>
      <p className="tabular-nums" style={{ color: score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--accent)' : 'var(--danger)' }}>
        Demand Score: <span className="font-bold">{score}/100</span>
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
        {score >= 80 ? '🔥 High demand — list now' : score >= 60 ? '📈 Moderate demand' : '⚠️ Low demand — consider delay'}
      </p>
    </div>
  );
}

export default function DemandForecastChartInner() {
  const [selectedWeek, setSelectedWeek] = useState<WeekKey>('week1');

  return (
    <div className="card p-5 h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-display font-semibold text-base" style={{ color: 'var(--foreground)' }}>
            Demand Forecast
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            AI-predicted demand · Nashik region
          </p>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
          style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}
        >
          <Sparkles className="w-3 h-3" />
          AI Oracle
        </div>
      </div>

      {/* Week selector */}
      <div
        className="flex rounded-lg p-0.5 mb-4"
        style={{ backgroundColor: 'var(--muted)' }}
      >
        {(Object.keys(weekLabels) as WeekKey[]).map((week) => (
          <button
            key={`week-btn-${week}`}
            onClick={() => setSelectedWeek(week)}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
              selectedWeek === week ? 'shadow-card' : ''
            }`}
            style={{
              backgroundColor: selectedWeek === week ? 'var(--card)' : 'transparent',
              color: selectedWeek === week ? 'var(--primary)' : 'var(--muted-foreground)',
            }}
          >
            {week.replace('week', 'W')}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={demandData}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
          barCategoryGap="30%"
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-dm-sans)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}`}
          />
          <YAxis
            type="category"
            dataKey="crop"
            tick={{ fontSize: 11, fill: 'var(--foreground)', fontFamily: 'var(--font-dm-sans)', fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} />
          <ReferenceLine x={70} stroke="var(--chart-2)" strokeDasharray="3 3" strokeWidth={1.5} />
          <Bar dataKey={selectedWeek} radius={[0, 4, 4, 0]} maxBarSize={18}>
            {demandData.map((entry) => {
              const val = entry[selectedWeek];
              const color = val >= 80 ? 'var(--chart-1)' : val >= 60 ? 'var(--chart-2)' : 'var(--chart-5)';
              return <Cell key={`demand-cell-${entry.crop}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        {[
          { color: 'var(--chart-1)', label: 'High (80+)' },
          { color: 'var(--chart-2)', label: 'Medium (60–79)' },
          { color: 'var(--chart-5)', label: 'Low (<60)' },
        ].map((l) => (
          <div key={`legend-${l.label}`} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: l.color }} />
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Insight */}
      <div
        className="mt-3 p-3 rounded-xl text-xs"
        style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}
      >
        <span className="font-semibold">💡 AI Insight:</span> Onion demand peaks Week 3 (91/100). Consider listing 2,000+ kg before May 20.
      </div>
    </div>
  );
}