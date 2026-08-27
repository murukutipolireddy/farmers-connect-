'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import dynamic from 'next/dynamic';

const FinanceContent = dynamic(() => import('./FinanceContent'), { ssr: false });

export default function FarmerFinancePage() {
  return (
    <AppLayout>
      <FinanceContent />
    </AppLayout>
  );
}
