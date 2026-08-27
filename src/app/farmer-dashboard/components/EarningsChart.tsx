'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const EarningsChartInner = dynamic(() => import('./EarningsChartInner'), {
  ssr: false,
  loading: () => (
    <div className="card p-5 h-80 flex flex-col justify-between animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-5 w-40 bg-muted rounded-lg" />
        <div className="h-8 w-24 bg-muted rounded-lg" />
      </div>
      <div className="h-52 w-full bg-muted/40 rounded-xl" />
    </div>
  ),
});

export default function EarningsChart() {
  return <EarningsChartInner />;
}