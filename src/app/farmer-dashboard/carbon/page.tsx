'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import dynamic from 'next/dynamic';

const CarbonContent = dynamic(() => import('./CarbonContent'), { ssr: false });

export default function FarmerCarbonPage() {
  return (
    <AppLayout>
      <CarbonContent />
    </AppLayout>
  );
}
