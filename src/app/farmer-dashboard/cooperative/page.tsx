'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import dynamic from 'next/dynamic';

const CooperativeContent = dynamic(() => import('./CooperativeContent'), { ssr: false });

export default function FarmerCooperativePage() {
  return (
    <AppLayout>
      <CooperativeContent />
    </AppLayout>
  );
}
