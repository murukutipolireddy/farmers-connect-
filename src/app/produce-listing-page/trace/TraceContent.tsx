'use client';

import React, { useState } from 'react';
import {
  QrCode, ShieldCheck, Cpu, Search, MapPin,
  Calendar, CheckCircle, Info, Sparkles, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface AuditStep {
  title: string;
  desc: string;
  actor: string;
  time: string;
  status: 'done' | 'pending';
  txHash?: string;
}

const defaultAuditSteps: AuditStep[] = [
  { title: 'Harvest Recorded', desc: 'Crop harvested and logged on Polygon ledger.', actor: 'Ramesh Kumar (Farmer)', time: '05 May 2026, 06:15 AM', status: 'done', txHash: '0x3bf92a...e29f' },
  { title: 'Quality Grading Audited', desc: 'AI scanner graded harvest: Grade A, 89% Freshness.', actor: 'AgriMart AI Node', time: '05 May 2026, 08:30 AM', status: 'done', txHash: '0x81c72f...99d1' },
  { title: 'Cold-Chain Shipping Loading', desc: 'Cold transport truck dispatched. Temperature logged at 4°C.', actor: 'Nashik Coop Logistics', time: '06 May 2026, 10:15 AM', status: 'done', txHash: '0x44ddb8...312e' },
  { title: 'Smart Contract Settlement', desc: 'Retailer payment cleared. 100% funds disbursed via UPI.', actor: 'AgriMart Ledger Router', time: '07 May 2026, 11:30 AM', status: 'done', txHash: '0x992b8d...fa78' },
];

export default function TraceContent() {
  const [batchId, setBatchId] = useState('BATCH-2026-NASHIK');
  const [searchQuery, setSearchQuery] = useState('');
  const [steps, setSteps] = useState<AuditStep[]>(defaultAuditSteps);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) {
      toast.error('Please enter a Batch or Order ID');
      return;
    }
    setIsVerifying(true);
    setIsVerifying(false);
    setBatchId(searchQuery.toUpperCase());
    toast.success(`Blockchain audit trail loaded for ${searchQuery.toUpperCase()}!`);
  };

  const handleScanSimulation = () => {
    setIsVerifying(true);
    setIsVerifying(false);
    setBatchId('BATCH-4028-GUNTUR');
    setSteps([
      { title: 'Harvest Recorded', desc: 'Crop harvested (Guntur Chilli).', actor: 'Anita Reddy (Farmer)', time: '02 May 2026, 07:00 AM', status: 'done', txHash: '0x12a9ef...77c2' },
      { title: 'Quality Grading Audited', desc: 'AI scanner graded harvest: Grade A, 94% Freshness.', actor: 'AgriMart AI Node', time: '02 May 2026, 09:15 AM', status: 'done', txHash: '0x77bc88...12d4' },
      { title: 'Transport Loading', desc: 'Logistics pickup dispatched.', actor: 'Guntur Logistics Co-op', time: '03 May 2026, 02:40 PM', status: 'done', txHash: '0x88bbcc...33ff' },
      { title: 'Smart Contract Settlement', desc: 'Verification complete. Payment cleared.', actor: 'AgriMart Ledger Router', time: '04 May 2026, 05:00 PM', status: 'done', txHash: '0x99ff22...bbaa' }
    ]);
    toast.success('QR Code scanned successfully! Sourcing audit loaded.');
  };

  return (
    <div className="px-4 xl:px-8 2xl:px-12 py-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <ShieldCheck className="w-6 h-6 text-green-600" /> Blockchain Sourcing Traceability
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Verify direct farm-to-shelf provenance logs recorded on decentralized ledger networks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        {/* Verification controller (2/5 width) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Search ID Form */}
          <div className="card p-5">
            <h2 className="font-display font-semibold text-base mb-3" style={{ color: 'var(--foreground)' }}>
              Verify Sourcing Batch
            </h2>
            <form onSubmit={handleVerify} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. BATCH-2026-NASHIK"
                className="form-input text-sm flex-1"
                required
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary hover:opacity-90 flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" /> Verify
              </button>
            </form>
          </div>

          {/* QR scanner visualizer */}
          <div className="card p-5 text-center flex flex-col items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-semibold text-base mb-1" style={{ color: 'var(--foreground)' }}>
                Simulate QR Scanner
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Print batch stickers and scan bags on packaging arrival.
              </p>
            </div>

            {/* QR Mock graphic */}
            <div className="w-36 h-36 border-2 border-dashed rounded-2xl flex items-center justify-center p-3 transition-colors hover:border-primary" style={{ borderColor: 'var(--border)' }}>
              <QrCode className="w-full h-full text-foreground opacity-85 animate-pulse" />
            </div>

            <button
              onClick={handleScanSimulation}
              disabled={isVerifying}
              className="w-full py-2.5 rounded-xl border text-xs font-semibold hover:bg-muted transition-colors text-foreground"
              style={{ borderColor: 'var(--border)' }}
            >
              Scan Mock Batch Code
            </button>
          </div>
        </div>

        {/* Audit Timeline logs (3/5 width) */}
        <div className="lg:col-span-3">
          <div className="card p-5 h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-3 border-b mb-6" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <p className="text-2xs font-semibold text-primary">Active Sourcing Audit</p>
                  <h3 className="font-display font-bold text-sm text-foreground mt-0.5">{batchId}</h3>
                </div>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-success-bg text-success flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Direct Audit Verified
                </span>
              </div>

              {/* Timeline Steps */}
              <div className="relative border-l-2 ml-3.5 pl-6 space-y-6" style={{ borderColor: 'var(--border)' }}>
                {steps.map((step, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle node indicator */}
                    <span className="absolute -left-10 top-0.5 w-6 h-6 rounded-full bg-success-bg border border-success flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-success fill-current" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground">{step.title}</h4>
                        <span className="text-2xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{step.time}</span>
                      </div>
                      <p className="text-xs mt-0.5 text-muted-foreground" style={{ color: 'var(--muted-foreground)' }}>{step.desc}</p>
                      <div className="flex justify-between items-center mt-2 text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                        <span>Actor: <strong>{step.actor}</strong></span>
                        {step.txHash && <span className="font-mono bg-secondary px-2 py-0.5 rounded border text-foreground" style={{ borderColor: 'var(--border)' }}>Tx: {step.txHash}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
