'use client';

import React from 'react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis,
} from 'recharts';
import { CreditCard, TrendingUp, CheckCircle } from 'lucide-react';

const creditScore = 742;
const maxScore = 900;
const scorePercent = Math.round((creditScore / maxScore) * 100);

const radialData = [{ name: 'Score', value: scorePercent, fill: 'var(--chart-1)' }];

interface LoanRecord {
  id: string;
  amount: number;
  purpose: string;
  status: 'active' | 'repaid' | 'pending';
  dueDate: string;
  nbfc: string;
}

const loanHistory: LoanRecord[] = [
  { id: 'loan-001', amount: 45000, purpose: 'Seed purchase — Rabi season', status: 'repaid', dueDate: '15 Mar 26', nbfc: 'Aroha Finance' },
  { id: 'loan-002', amount: 28000, purpose: 'Irrigation equipment', status: 'active', dueDate: '20 Jun 26', nbfc: 'Samunnati' },
  { id: 'loan-003', amount: 18500, purpose: 'Cold storage booking', status: 'pending', dueDate: '01 Jun 26', nbfc: 'Aroha Finance' },
];

const statusConf = {
  active: { label: 'Active', color: 'var(--info)', bg: 'var(--info-bg)' },
  repaid: { label: 'Repaid', color: 'var(--success)', bg: 'var(--success-bg)' },
  pending: { label: 'Pending', color: 'var(--warning)', bg: 'var(--warning-bg)' },
};

const scoreLabel =
  creditScore >= 750 ? 'Excellent' : creditScore >= 650 ? 'Good' : creditScore >= 550 ? 'Fair' : 'Poor';

const scoreColor =
  creditScore >= 750 ? 'var(--success)' : creditScore >= 650 ? 'var(--chart-1)' : creditScore >= 550 ? 'var(--accent)' : 'var(--danger)';

export default function CreditScoreWidgetInner() {
  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-semibold text-base" style={{ color: 'var(--foreground)' }}>
            Micro-Credit Score
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            AgriMart Kisan Credit Index
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--success-bg)' }}
        >
          <CreditCard className="w-4 h-4" style={{ color: 'var(--primary)' }} />
        </div>
      </div>

      {/* Radial score */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-shrink-0" style={{ width: 100, height: 100 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="90%"
              barSize={10}
              data={radialData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background={{ fill: 'var(--muted)' }}
                dataKey="value"
                angleAxisId={0}
                cornerRadius={5}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-bold tabular-nums text-lg leading-none" style={{ color: scoreColor }}>
              {creditScore}
            </span>
            <span className="text-2xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>/{maxScore}</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display text-lg font-bold" style={{ color: scoreColor }}>
              {scoreLabel}
            </span>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--success)' }} />
          </div>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Top 15% of AgriMart farmers. Eligible for up to ₹2,50,000 instant credit.
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>
              4-hour disbursement via UPI
            </span>
          </div>
        </div>
      </div>

      {/* Score factors */}
      <div className="space-y-2 mb-4">
        {[
          { label: 'Order Fulfillment', score: 96, weight: 'High' },
          { label: 'Repayment History', score: 100, weight: 'High' },
          { label: 'Yield Consistency', score: 78, weight: 'Medium' },
          { label: 'Platform Activity', score: 82, weight: 'Low' },
        ].map((factor) => (
          <div key={`factor-${factor.label}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{factor.label}</span>
              <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>
                {factor.score}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${factor.score}%`,
                  backgroundColor: factor.score >= 90 ? 'var(--chart-1)' : factor.score >= 75 ? 'var(--chart-2)' : 'var(--chart-5)',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Recent loans */}
      <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-semibold mb-2.5 uppercase tracking-wide" style={{ color: 'var(--muted-foreground)', letterSpacing: '0.07em' }}>
          Recent Loans
        </p>
        <div className="space-y-2">
          {loanHistory.map((loan) => {
            const conf = statusConf[loan.status];
            return (
              <div
                key={loan.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl"
                style={{ backgroundColor: 'var(--secondary)' }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>
                    {loan.purpose}
                  </p>
                  <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                    {loan.nbfc} · Due {loan.dueDate}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
                    ₹{loan.amount.toLocaleString('en-IN')}
                  </p>
                  <span
                    className="text-2xs font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: conf.bg, color: conf.color }}
                  >
                    {conf.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="mt-3 w-full py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-muted"
          style={{ border: '1.5px solid var(--primary)', color: 'var(--primary)' }}
        >
          Apply for Micro-Credit Loan
        </button>
      </div>
    </div>
  );
}