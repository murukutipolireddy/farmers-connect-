'use client';

import React, { useState } from 'react';
import {
  TrendingUp, Sparkles, ShieldCheck, Calendar, ArrowRight,
  RefreshCw, Info, ShoppingBag, HelpCircle, MapPin
} from 'lucide-react';
import { toast } from 'sonner';

interface DemandGap {
  crop: string;
  region: string;
  shortageSeverity: 'Critical Shortage' | 'Moderate Shortage' | 'Stable';
  estimatedDeficitKg: number;
  projectedRate: number;
  matchingBuyersCount: number;
}

const activeGaps: DemandGap[] = [
  { crop: 'Tomato', region: 'Mumbai Metro', shortageSeverity: 'Critical Shortage', estimatedDeficitKg: 45000, projectedRate: 45, matchingBuyersCount: 14 },
  { crop: 'Potato', region: 'Pune & PCMC', shortageSeverity: 'Moderate Shortage', estimatedDeficitKg: 28000, projectedRate: 22, matchingBuyersCount: 8 },
  { crop: 'Onion', region: 'Vashi Wholesale Hub', shortageSeverity: 'Stable', estimatedDeficitKg: 12000, projectedRate: 24, matchingBuyersCount: 19 },
];

export default function DemandContent() {
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [harvestDate, setHarvestDate] = useState('2026-06-15');
  const [qty, setQty] = useState(2000);
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  const handleRunMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMatching(true);
    setIsMatching(false);

    // Calculate a simulated matching buyer
    const rate = selectedCrop === 'Tomato' ? 42 : selectedCrop === 'Potato' ? 20 : 25;
    setMatchResult({
      buyer: 'Priya Merchants',
      buyerRating: 4.9,
      contractRate: rate,
      totalVal: qty * rate,
      advancePayout: Math.round((qty * rate) * 0.15), // 15% advance payout
    });
    toast.success('AI Sourcing match found!');
  };

  const handleSignContract = () => {
    toast.success('Forward contract signed successfully on blockchain ledger!');
    toast.info(`Advance deposit of ₹${matchResult.advancePayout.toLocaleString('en-IN')} is being transferred via UPI.`);
    setMatchResult(null);
  };

  return (
    <div className="px-4 xl:px-8 2xl:px-12 py-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          AI Demand Futures Matchmaker
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Identify upcoming crop deficits in urban markets and pre-sell harvests to verified buyers via forward contracts.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-stretch">
        {/* Left: Live Gaps List (3/5 width) */}
        <div className="xl:col-span-3 card p-5 flex flex-col justify-between">
          <div>
            <h2 className="font-display font-semibold text-base mb-4 flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
              <TrendingUp className="w-5 h-5 text-primary" /> Projected Market Deficits (Next 4–8 Weeks)
            </h2>

            <div className="space-y-4">
              {activeGaps.map((gap, idx) => (
                <div key={idx} className="p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--secondary)' }}>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-foreground">{gap.crop}</span>
                      <span
                        className="text-2xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: gap.shortageSeverity === 'Critical Shortage' ? 'var(--danger-bg)' : gap.shortageSeverity === 'Moderate Shortage' ? 'var(--warning-bg)' : 'var(--success-bg)',
                          color: gap.shortageSeverity === 'Critical Shortage' ? 'var(--danger)' : gap.shortageSeverity === 'Moderate Shortage' ? 'var(--warning)' : 'var(--success)',
                        }}
                      >
                        {gap.shortageSeverity}
                      </span>
                    </div>
                    <p className="text-2xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      Region: {gap.region} · Estimated deficit: <strong style={{ color: 'var(--foreground)' }}>{gap.estimatedDeficitKg.toLocaleString()} Kg</strong>
                    </p>
                  </div>

                  <div className="flex items-baseline md:flex-col text-right justify-between border-t md:border-t-0 pt-2 md:pt-0">
                    <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Projected Rate</span>
                    <span className="text-base font-bold text-primary" style={{ color: 'var(--primary)' }}>₹{gap.projectedRate}/Kg</span>
                  </div>

                  <button
                    onClick={() => { setSelectedCrop(gap.crop); toast.info(`Selected ${gap.crop} for matching calculation`); }}
                    className="px-3 py-1.5 rounded-lg text-2xs font-semibold border transition-colors hover:bg-muted ml-auto md:ml-0 text-foreground"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
                  >
                    Load in Calculator
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg text-2xs mt-4 flex items-start gap-2" style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}>
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>Deficit data is compiled by analyzing grocery demand trends, restaurant inventories, and local weather indicators.</span>
          </div>
        </div>

        {/* Right: Contract Calculator (2/5 width) */}
        <div className="xl:col-span-2">
          <div className="card p-5 h-full flex flex-col justify-between">
            <div>
              <h2 className="font-display font-semibold text-base mb-4 flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                <Sparkles className="w-4 h-4 text-amber-500" /> Sourcing Matchmaker Calculator
              </h2>

              <form onSubmit={handleRunMatch} className="space-y-4">
                <div>
                  <label className="form-label">Crop Sown</label>
                  <select
                    className="form-input text-sm"
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                  >
                    <option value="Tomato">Tomato (Tomato F1 Hybrid)</option>
                    <option value="Potato">Potato (Jyoti Variety)</option>
                    <option value="Onion">Onion (Nasik Red)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Estimated Harvest Date</label>
                    <input
                      type="date"
                      value={harvestDate}
                      onChange={(e) => setHarvestDate(e.target.value)}
                      className="form-input text-sm"
                    />
                  </div>
                  <div>
                    <label className="form-label">Estimated Yield (Kg)</label>
                    <input
                      type="number"
                      value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                      className="form-input text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isMatching}
                  className="btn-primary w-full py-2.5 text-sm"
                >
                  {isMatching ? 'Running AI Sourcing Match...' : 'Search Matching Buyers'}
                </button>
              </form>

              {/* Match Result Display */}
              {matchResult && (
                <div className="mt-5 p-4 rounded-xl border space-y-3.5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--success-bg)' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-2xs font-bold text-green-700">Best Match Found</p>
                      <h3 className="text-sm font-bold text-foreground mt-0.5">{matchResult.buyer}</h3>
                    </div>
                    <span className="text-2xs font-semibold text-green-700 bg-white/60 px-2 py-0.5 rounded-full">
                      ★ {matchResult.buyerRating} Trust Rating
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <p style={{ color: 'var(--muted-foreground)' }}>Locked Contract Rate</p>
                      <p className="font-bold text-foreground mt-0.5">₹{matchResult.contractRate}/Kg</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--muted-foreground)' }}>Total Contract Val</p>
                      <p className="font-bold text-foreground mt-0.5">₹{matchResult.totalVal.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg text-2xs" style={{ backgroundColor: 'white', border: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--muted-foreground)' }}>Instant 15% Advance Payout Deposit</p>
                    <p className="font-extrabold text-foreground mt-0.5" style={{ color: 'var(--primary)' }}>
                      ₹{matchResult.advancePayout.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <button
                    onClick={handleSignContract}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:opacity-95 transition-opacity"
                  >
                    Sign Forward Contract
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
