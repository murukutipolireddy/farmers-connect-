'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import dynamic from 'next/dynamic';

const FlashContent = dynamic(() => import('./FlashContent'), { ssr: false });

export default function ProduceFlashPage() {
  return (
    <AppLayout>
      <FlashContent />
    </AppLayout>
  );
}
