'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const CreditScoreWidgetInner = dynamic(() => import('./CreditScoreWidgetInner'), { ssr: false });

export default function CreditScoreWidget() {
  return <CreditScoreWidgetInner />;
}