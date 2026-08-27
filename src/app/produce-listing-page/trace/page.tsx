'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import dynamic from 'next/dynamic';

const TraceContent = dynamic(() => import('./TraceContent'), { ssr: false });

export default function ProduceTracePage() {
  return (
    <AppLayout>
      <TraceContent />
    </AppLayout>
  );
}
