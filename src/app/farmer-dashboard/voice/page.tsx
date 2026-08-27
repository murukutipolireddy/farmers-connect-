'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import dynamic from 'next/dynamic';

const VoiceContent = dynamic(() => import('./VoiceContent'), { ssr: false });

export default function FarmerVoicePage() {
  return (
    <AppLayout>
      <VoiceContent />
    </AppLayout>
  );
}
