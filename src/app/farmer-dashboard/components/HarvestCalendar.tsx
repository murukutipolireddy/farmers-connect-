'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Leaf } from 'lucide-react';

interface HarvestEvent {
  id: string;
  crop: string;
  variety: string;
  date: string;
  qtyKg: number;
  status: 'upcoming' | 'ready' | 'overdue';
}

const harvestEvents: HarvestEvent[] = [
  { id: 'hc-001', crop: 'Tomato', variety: 'Hybrid F1', date: '08 May', qtyKg: 1200, status: 'ready' },
  { id: 'hc-002', crop: 'Capsicum', variety: 'California Wonder', date: '11 May', qtyKg: 440, status: 'upcoming' },
  { id: 'hc-003', crop: 'Spinach', variety: 'Palak All Season', date: '12 May', qtyKg: 300, status: 'upcoming' },
  { id: 'hc-004', crop: 'Onion', variety: 'Nasik Red', date: '14 May', qtyKg: 2800, status: 'upcoming' },
  { id: 'hc-005', crop: 'Okra', variety: 'Arka Anamika', date: '18 May', qtyKg: 480, status: 'upcoming' },
  { id: 'hc-006', crop: 'Green Chilli', variety: 'Byadgi Long', date: '22 May', qtyKg: 600, status: 'upcoming' },
  { id: 'hc-007', crop: 'Brinjal', variety: 'Arka Shirish', date: '04 May', qtyKg: 320, status: 'overdue' },
];

const statusConfig = {
  ready: { label: 'Ready to harvest', color: 'var(--success)', bg: 'var(--success-bg)' },
  upcoming: { label: 'Upcoming', color: 'var(--info)', bg: 'var(--info-bg)' },
  overdue: { label: 'Overdue', color: 'var(--danger)', bg: 'var(--danger-bg)' },
};

export default function HarvestCalendar() {
  const [demoMode, setDemoMode] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDemoMode(localStorage.getItem('agrimart_demo_mode') !== 'false');
      const handleDemoToggle = () => {
        setDemoMode(localStorage.getItem('agrimart_demo_mode') !== 'false');
      };
      window.addEventListener('agrimart_demo_mode_change', handleDemoToggle);
      return () => window.removeEventListener('agrimart_demo_mode_change', handleDemoToggle);
    }
  }, []);

  const eventsToUse = demoMode ? harvestEvents : [];

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-semibold text-base" style={{ color: 'var(--foreground)' }}>
            Harvest Calendar
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            May 2026 · {eventsToUse.length} crops scheduled
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--success-bg)' }}
        >
          <Calendar className="w-4 h-4" style={{ color: 'var(--primary)' }} />
        </div>
      </div>

      <div className="space-y-2.5 flex-1">
        {eventsToUse.map((event) => {
          const config = statusConfig[event.status];
          return (
            <div
              key={event.id}
              className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-muted"
              style={{ cursor: 'pointer' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-center"
                style={{ backgroundColor: config.bg }}
              >
                <span className="text-xs font-bold tabular-nums leading-none" style={{ color: config.color }}>
                  {event.date.split(' ')[0]}
                </span>
                <span className="text-2xs leading-none mt-0.5" style={{ color: config.color }}>
                  {event.date.split(' ')[1]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>
                    {event.crop}
                  </span>
                  <span
                    className="text-2xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{ backgroundColor: config.bg, color: config.color }}
                  >
                    {config.label}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Leaf className="w-2.5 h-2.5" style={{ color: 'var(--muted-foreground)' }} />
                  <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                    {event.variety} · {event.qtyKg.toLocaleString('en-IN')} kg est.
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-4 pt-3 border-t text-xs"
        style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
      >
        Total estimated yield this month:{' '}
        <span className="font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>
          {eventsToUse.reduce((s, e) => s + e.qtyKg, 0).toLocaleString('en-IN')} kg
        </span>
      </div>
    </div>
  );
}