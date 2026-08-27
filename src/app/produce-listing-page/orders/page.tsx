'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import dynamic from 'next/dynamic';

const OrdersContent = dynamic(() => import('./OrdersContent'), { ssr: false });

export default function ProduceOrdersPage() {
  return (
    <AppLayout>
      <OrdersContent />
    </AppLayout>
  );
}
