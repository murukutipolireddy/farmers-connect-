'use client';

import React, { useState } from 'react';
import {
  CreditCard, ShieldCheck, HelpCircle, Info, Sparkles,
  ArrowRight, Download, Calculator, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import CreditScoreWidget from '../components/CreditScoreWidget';

export default function FinanceContent() {
  const [loanAmount, setLoanAmount] = useState(50000);
  const [months, setMonths] = useState(6);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState('seeds');

  // Calculations
  const interestRate = 0.085; // 8.5% interest rate p.a.
  const interestAmount = Math.round((loanAmount * interestRate * months) / 12);
  const totalRepay = loanAmount + interestAmount;
  const emi = Math.round(totalRepay / months);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsApplying(true);
    setIsApplying(false);
    toast.success(`Loan application for ₹${loanAmount.toLocaleString('en-IN')} submitted successfully!`);
    toast.info('Verification in progress. Disbursement via UPI in 4 hours.');
  };

  return (
    <div className="px-4 xl:px-8 2xl:px-12 py-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          Kisan Micro-Finance Hub
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Collateral-free instant credit for smallholder farmers backed by blockchain transaction history.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left Widget column */}
        <div className="xl:col-span-1">
          <CreditScoreWidget />
        </div>

        {/* Right side: Calculator & Application Form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Loan Calculator */}
          <div className="card p-5">
            <h2 className="font-display font-semibold text-base mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Calculator className="w-5 h-5 text-primary" />
              Subsidized Interest Repayment Calculator
            </h2>

            <div className="space-y-4">
              {/* Range amount */}
              <div>
                <div className="flex justify-between items-center mb-1 text-sm font-medium">
                  <span style={{ color: 'var(--muted-foreground)' }}>Loan Amount</span>
                  <span className="font-bold text-primary" style={{ color: 'var(--primary)' }}>
                    ₹{loanAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={250000}
                  step={5000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                  <span>₹10k</span>
                  <span>₹2.5L Max (Excellent Credit Limit)</span>
                </div>
              </div>

              {/* Range tenure */}
              <div>
                <div className="flex justify-between items-center mb-1 text-sm font-medium">
                  <span style={{ color: 'var(--muted-foreground)' }}>Repayment Period</span>
                  <span className="font-bold text-primary" style={{ color: 'var(--primary)' }}>
                    {months} Months
                  </span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={12}
                  step={1}
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                  <span>3 months</span>
                  <span>12 months (Post-harvest harvest cycle)</span>
                </div>
              </div>

              {/* Calculator Output Grid */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl border text-center mt-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--secondary)' }}>
                <div>
                  <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Interest (8.5% p.a.)</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--foreground)' }}>₹{interestAmount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Total Repayment</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--foreground)' }}>₹{totalRepay.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-2xs" style={{ color: 'var(--primary)' }}>Monthly EMI</p>
                  <p className="text-base font-extrabold mt-0.5" style={{ color: 'var(--primary)' }}>₹{emi.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Apply Form */}
          <div className="card p-5">
            <h2 className="font-display font-semibold text-base mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              Fast Track Loan Application
            </h2>

            <form onSubmit={handleApply} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Purpose of Loan</label>
                  <select
                    className="form-input text-sm"
                    value={selectedPurpose}
                    onChange={(e) => setSelectedPurpose(e.target.value)}
                  >
                    <option value="seeds">Seeds & Fertilizers (Rabi Crop)</option>
                    <option value="irrigation">Drip Irrigation Equipment</option>
                    <option value="solar">Solar Water Pump</option>
                    <option value="storage">Cold Storage Rental Booking</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Disbursement UPI ID</label>
                  <input
                    type="text"
                    required
                    placeholder="rameshkumar@sbi"
                    className="form-input text-sm"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg" style={{ backgroundColor: 'var(--info-bg)' }}>
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--info)' }} />
                <p className="text-2xs" style={{ color: 'var(--info)' }}>
                  By applying, you agree to auto-deduct loan payments directly from subsequent buyers payments on the AgriMart platform. This secures subsidized interest rates.
                </p>
              </div>

              <button
                type="submit"
                disabled={isApplying}
                className="btn-primary w-full py-3"
              >
                {isApplying ? 'Submitting Application...' : `Submit Application for ₹${loanAmount.toLocaleString('en-IN')}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
