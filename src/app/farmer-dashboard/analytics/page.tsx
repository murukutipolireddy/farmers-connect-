'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import dynamic from 'next/dynamic';

const AnalyticsContent = dynamic(() => import('./AnalyticsContent'), { ssr: false });

export default function FarmerAnalyticsPage() {
  return (
    <AppLayout>
      <AnalyticsContent />
    </AppLayout>
  );
}
