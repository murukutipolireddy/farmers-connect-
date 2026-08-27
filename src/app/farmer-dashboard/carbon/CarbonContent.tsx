'use client';

import React, { useState } from 'react';
import {
  Leaf, ShieldCheck, Sparkles, TrendingUp, RefreshCw,
  Globe, Info, DollarSign, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface VerificationLog {
  id: string;
  practice: string;
  field: string;
  status: 'verified' | 'pending' | 'failed';
  creditsEarned: number;
  date: string;
}

const initialLogs: VerificationLog[] = [
  { id: 'log-101', practice: 'No-Till Sowing (Wheat)', field: 'North Field 4A', status: 'verified', creditsEarned: 18.5, date: '12 Apr 2026' },
  { id: 'log-102', practice: 'Organic Biomass Mulching', field: 'South Orchard 2', status: 'verified', creditsEarned: 12.2, date: '28 Mar 2026' },
  { id: 'log-103', practice: 'Cover Cropping (Legumes)', field: 'West Field 1B', status: 'pending', creditsEarned: 14.0, date: '04 May 2026' },
];

const tradingOffers = [
  { company: 'Tata Power Eco', quantity: 30, pricePerCredit: 1250, totalVal: 37500 },
  { company: 'Reliance NetZero', quantity: 25, pricePerCredit: 1280, totalVal: 32000 },
  { company: 'Infosys GreenTrust', quantity: 15, pricePerCredit: 1300, totalVal: 19500 },
];

export default function CarbonContent() {
  const [logs, setLogs] = useState<VerificationLog[]>(initialLogs);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    setIsSyncing(false);
    toast.success('Soil satellite data refreshed');
  };

  const handleSell = (offer: typeof tradingOffers[0]) => {
    toast.success(`Sold ${offer.quantity} carbon credits to ${offer.company} for ₹${offer.totalVal.toLocaleString('en-IN')}!`);
    toast.info('Settlement under verification. Funds will be deposited in UPI account in 24 hours.');
  };

  return (
    <div className="px-4 xl:px-8 2xl:px-12 py-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Kisan Carbon Credit Exchange
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Earn additional revenue from eco-friendly regenerative farming. Audited via satellite soil metrics.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="p-2.5 rounded-xl border transition-colors hover:bg-muted disabled:opacity-50 flex items-center gap-2 text-sm font-semibold"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} style={{ color: 'var(--muted-foreground)' }} />
          Sync Satellite Audit
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'CO2 Sequestered', value: '44.7 Tons', sub: 'Calculated this season', icon: Leaf, bg: 'var(--success-bg)', color: 'var(--success)' },
          { label: 'Verified Credits', value: '30.7 Credits', sub: '1 credit = 1 Ton CO2 offset', icon: ShieldCheck, bg: 'var(--primary-bg)', color: 'var(--primary)' },
          { label: 'Cumulative Revenue', value: '₹38,375', sub: 'Direct bank settlement', icon: DollarSign, bg: 'var(--info-bg)', color: 'var(--info)' },
        ].map((kpi, idx) => (
          <div key={`kpi-${idx}`} className="card p-5 flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: kpi.bg }}
            >
              <kpi.icon className="w-6 h-6" style={{ color: kpi.color }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                {kpi.label}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>
                {kpi.value}
              </p>
              <p className="text-2xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {kpi.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 mt-5">
        {/* Verification logs (3/5 width) */}
        <div className="xl:col-span-3">
          <div className="card p-5 h-full flex flex-col justify-between">
            <div>
              <h2 className="font-display font-semibold text-base mb-4" style={{ color: 'var(--foreground)' }}>
                Regenerative Verification Logs
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                      {['Practice', 'Field Log', 'Credits', 'Status', 'Date'].map((h) => (
                        <th key={h} className="text-left pb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 font-semibold text-foreground">{log.practice}</td>
                        <td className="py-3" style={{ color: 'var(--muted-foreground)' }}>{log.field}</td>
                        <td className="py-3 font-bold text-foreground tabular-nums">+{log.creditsEarned}</td>
                        <td className="py-3">
                          <span
                            className="text-2xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: log.status === 'verified' ? 'var(--success-bg)' : log.status === 'pending' ? 'var(--warning-bg)' : 'var(--danger-bg)',
                              color: log.status === 'verified' ? 'var(--success)' : log.status === 'pending' ? 'var(--warning)' : 'var(--danger)',
                            }}
                          >
                            {log.status === 'verified' ? 'Verified' : log.status === 'pending' ? 'Pending' : 'Failed'}
                          </span>
                        </td>
                        <td className="py-3 text-2xs" style={{ color: 'var(--muted-foreground)' }}>{log.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Sell Credits Portal (2/5 width) */}
        <div className="xl:col-span-2">
          <div className="card p-5 h-full flex flex-col">
            <h2 className="font-display font-semibold text-base mb-1" style={{ color: 'var(--foreground)' }}>
              Sell Active Carbon Credits
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Trade your verified credits with certified corporate carbon-offset buyers.
            </p>

            <div className="mt-5 space-y-3.5 flex-1">
              {tradingOffers.map((offer, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--secondary)' }}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{offer.company}</p>
                    <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                      Wants {offer.quantity} credits @ ₹{offer.pricePerCredit}/cr
                    </p>
                  </div>
                  <button
                    onClick={() => handleSell(offer)}
                    className="px-3.5 py-1.5 rounded-lg text-2xs font-bold text-white transition-all bg-primary hover:opacity-90 flex items-center gap-1"
                  >
                    Sell for ₹{(offer.totalVal / 1000).toFixed(1)}k <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg mt-4" style={{ backgroundColor: 'var(--info-bg)' }}>
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--info)' }} />
              <p className="text-2xs" style={{ color: 'var(--info)' }}>
                Carbon trading requires active satellite authorization link. Satellite verification scans every Tuesday.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
