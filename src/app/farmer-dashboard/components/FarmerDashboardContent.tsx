'use client';

import React, { useState } from 'react';
import { RefreshCw, Calendar, ChevronDown, Bell } from 'lucide-react';
import { toast } from 'sonner';
import SurplusAlertBanner from './SurplusAlertBanner';
import KPIBentoGrid from './KPIBentoGrid';
import EarningsChart from './EarningsChart';
import DemandForecastChart from './DemandForecastChart';
import ActiveListingsTable from './ActiveListingsTable';
import HarvestCalendar from './HarvestCalendar';
import PaymentActivityFeed from './PaymentActivityFeed';
import CreditScoreWidget from './CreditScoreWidget';

const dateRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 3 months' },
  { value: 'season', label: 'This season' },
];

export default function FarmerDashboardContent() {
  const [dateRange, setDateRange] = useState('30d');
  const [dateDropOpen, setDateDropOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setIsRefreshing(false);
    toast?.success('Dashboard refreshed');
  };

  return (
    <div className="px-4 xl:px-8 2xl:px-12 py-6 max-w-screen-2xl mx-auto">
      {/* Surplus alert */}
      <SurplusAlertBanner />
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Kisan Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Nashik, Maharashtra · Last updated: 07 May 2026, 11:31 AM
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Date range */}
          <div className="relative">
            <button
              onClick={() => setDateDropOpen((v) => !v)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-colors hover:bg-muted"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--card)' }}
            >
              <Calendar className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              {dateRanges?.find((d) => d?.value === dateRange)?.label}
              <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
            </button>
            {dateDropOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-30 rounded-xl border overflow-hidden animate-scale-in"
                style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: '160px' }}
              >
                {dateRanges?.map((dr) => (
                  <button
                    key={`dr-${dr?.value}`}
                    onClick={() => { setDateRange(dr?.value); setDateDropOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted ${dateRange === dr?.value ? 'font-semibold' : ''}`}
                    style={{ color: dateRange === dr?.value ? 'var(--primary)' : 'var(--foreground)' }}
                  >
                    {dr?.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <button
            className="relative p-2.5 rounded-xl border transition-colors hover:bg-muted"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
            title="View notifications"
          >
            <Bell className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--danger)' }}
            />
          </button>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border transition-colors hover:bg-muted disabled:opacity-50"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
            title="Refresh dashboard data"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              style={{ color: 'var(--muted-foreground)' }}
            />
          </button>
        </div>
      </div>
      {/* KPI Bento Grid */}
      <KPIBentoGrid />
      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 mt-5">
        {/* Earnings chart — 3/5 width */}
        <div className="xl:col-span-3">
          <EarningsChart />
        </div>
        {/* Demand forecast — 2/5 width */}
        <div className="xl:col-span-2">
          <DemandForecastChart />
        </div>
      </div>
      {/* Active listings table */}
      <div className="mt-5">
        <ActiveListingsTable />
      </div>
      {/* Bottom row: harvest calendar + activity feed + credit score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <HarvestCalendar />
        <PaymentActivityFeed />
        <CreditScoreWidget />
      </div>
    </div>
  );
}