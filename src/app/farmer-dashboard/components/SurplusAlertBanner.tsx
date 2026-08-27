'use client';

import React, { useState } from 'react';
import { Zap, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SurplusAlertBanner() {
  const [visible, setVisible] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  if (!visible) return null;

  const handleApprove = async () => {
    setApproving(true);
    setApproving(false);
    setVisible(false);
    toast?.success('Flash sale activated — Tomato (2,800 kg) now live at 35% discount');
  };

  const handleReject = async () => {
    setRejecting(true);
    setRejecting(false);
    setVisible(false);
    toast?.info('Flash sale declined — listing remains active at original price');
  };

  return (
    <div
      className="flex items-start gap-4 p-4 rounded-2xl mb-5 border-2"
      style={{
        backgroundColor: 'var(--warning-bg)',
        borderColor: '#F59E0B',
      }}
      role="alert"
      aria-live="polite"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: '#F59E0B' }}
      >
        <Zap className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-display font-semibold text-sm" style={{ color: 'var(--warning)' }}>
            Surplus Alert — Flash Sale Recommended
          </p>
          <span
            className="text-2xs px-2 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: '#F59E0B', color: '#fff' }}
          >
            AI Triggered
          </span>
        </div>
        <p className="text-sm mt-0.5" style={{ color: 'var(--warning)' }}>
          <span className="font-semibold">Tomato — Hybrid F1 (2,800 kg)</span> has been unsold for 38 hours.
          Spoilage window: <span className="font-semibold">10 hours remaining</span>.
          AI recommends a <span className="font-semibold">35% flash discount (₹18/kg)</span> — first offered to 3 registered NGOs.
        </p>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <button
            onClick={handleApprove}
            disabled={approving || rejecting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all btn-press disabled:opacity-60"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            {approving ? 'Activating...' : 'Approve Flash Sale'}
          </button>
          <button
            onClick={handleReject}
            disabled={approving || rejecting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-all btn-press disabled:opacity-60"
            style={{ borderColor: 'var(--warning)', color: 'var(--warning)', backgroundColor: 'transparent' }}
          >
            {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            {rejecting ? 'Declining...' : 'Decline'}
          </button>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            You can also reply YES/NO on WhatsApp
          </span>
        </div>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="p-1.5 rounded-lg hover:bg-black/10 transition-colors flex-shrink-0"
        aria-label="Dismiss surplus alert"
      >
        <X className="w-4 h-4" style={{ color: 'var(--warning)' }} />
      </button>
    </div>
  );
}