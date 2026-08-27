'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import dynamic from 'next/dynamic';

const DemandContent = dynamic(() => import('./DemandContent'), { ssr: false });

export default function ProduceDemandPage() {
  return (
    <AppLayout>
      <DemandContent />
    </AppLayout>
  );
}
