'use client';

import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, ArrowUpRight, BarChart2,
  Calendar, MapPin, Sparkles, RefreshCw, ShoppingCart
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { toast } from 'sonner';

const priceTrendData = [
  { week: 'Wk 1', nashikPrice: 22, mumbaiPrice: 28, forecastPrice: 24 },
  { week: 'Wk 2', nashikPrice: 24, mumbaiPrice: 29, forecastPrice: 26 },
  { week: 'Wk 3', nashikPrice: 21, mumbaiPrice: 32, forecastPrice: 23 },
  { week: 'Wk 4', nashikPrice: 28, mumbaiPrice: 34, forecastPrice: 29 },
  { week: 'Wk 5', nashikPrice: 32, mumbaiPrice: 38, forecastPrice: 33 },
  { week: 'Wk 6', nashikPrice: 30, mumbaiPrice: 42, forecastPrice: 32 },
  { week: 'Wk 7', nashikPrice: 36, mumbaiPrice: 45, forecastPrice: 38 },
  { week: 'Wk 8', nashikPrice: 40, mumbaiPrice: 48, forecastPrice: 42 },
];

const cropIndexes = [
  { crop: 'Tomato', apmcRate: '₹38/Kg', predictedRate: '₹42–₹45/Kg', direction: 'up', confidence: '94%', recommendation: 'Hold harvest for 5 days for best prices' },
  { crop: 'Onion', apmcRate: '₹24/Kg', predictedRate: '₹22–₹23/Kg', direction: 'down', confidence: '88%', recommendation: 'Liquidate current stock now before supply surge' },
  { crop: 'Capsicum', apmcRate: '₹55/Kg', predictedRate: '₹62–₹65/Kg', direction: 'up', confidence: '91%', recommendation: 'Pre-sell futures on marketplace' },
];

export default function AnalyticsContent() {
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    setIsSyncing(false);
    toast.success('Live market prices synced');
  };

  return (
    <div className="px-4 xl:px-8 2xl:px-12 py-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Market Price Analytics
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Nashik vs Vashi (Mumbai) APMC Prices · AI forecasting index
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="p-2.5 rounded-xl border transition-colors hover:bg-muted disabled:opacity-50 flex items-center gap-2 text-sm font-semibold"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} style={{ color: 'var(--muted-foreground)' }} />
          Sync APMC Rates
        </button>
      </div>

      {/* Grid of crop recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cropIndexes.map((item, idx) => (
          <div key={`crop-${idx}`} className="card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-display font-bold text-lg" style={{ color: 'var(--foreground)' }}>
                  {item.crop}
                </span>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{
                    backgroundColor: item.direction === 'up' ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: item.direction === 'up' ? 'var(--success)' : 'var(--danger)'
                  }}
                >
                  {item.direction === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {item.direction === 'up' ? 'Rising' : 'Falling'}
                </span>
              </div>
              <div className="flex items-baseline gap-4 my-2">
                <div>
                  <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>APMC Today</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{item.apmcRate}</p>
                </div>
                <div>
                  <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>AI 14-Day Forecast</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{item.predictedRate}</p>
                </div>
              </div>
              <p className="text-xs mt-3 p-3 rounded-lg leading-relaxed" style={{ backgroundColor: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                <strong>Recommendation:</strong> {item.recommendation}
              </p>
            </div>
            <div className="border-t mt-4 pt-3 flex items-center justify-between text-2xs" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
              <span>AI Accuracy Index: {item.confidence}</span>
              <button
                onClick={() => toast.success(`Applied filters for ${item.crop}`)}
                className="font-semibold"
                style={{ color: 'var(--primary)' }}
              >
                View Sourcing Deals
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="card p-5 mt-5">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div>
            <h2 className="font-display font-semibold text-base" style={{ color: 'var(--foreground)' }}>
              8-Week Price Trend: {selectedCrop}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Comparison of Nashik APMC local mandis vs Mumbai Vashi market
            </p>
          </div>
          <div className="flex gap-2">
            {['Tomato', 'Onion', 'Capsicum'].map((crop) => (
              <button
                key={crop}
                onClick={() => setSelectedCrop(crop)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={{
                  backgroundColor: selectedCrop === crop ? 'var(--primary)' : 'var(--card)',
                  color: selectedCrop === crop ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  borderColor: selectedCrop === crop ? 'var(--primary)' : 'var(--border)'
                }}
              >
                {crop}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <LineChart
              data={priceTrendData}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                labelStyle={{ fontWeight: 'bold', color: 'var(--foreground)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line name="Nashik Mandi" type="monotone" dataKey="nashikPrice" stroke="var(--chart-1)" strokeWidth={2.5} activeDot={{ r: 6 }} />
              <Line name="Mumbai Vashi APMC" type="monotone" dataKey="mumbaiPrice" stroke="var(--chart-2)" strokeWidth={2.5} />
              <Line name="AI Predicted Trend" type="monotone" dataKey="forecastPrice" stroke="var(--chart-5)" strokeDasharray="5 5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
