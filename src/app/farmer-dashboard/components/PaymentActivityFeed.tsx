'use client';

import React, { useState, useEffect } from 'react';
import { IndianRupee, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { subscribeToOrders, OrderItem } from '@/lib/realtime';

interface PaymentEvent {
  id: string;
  type: 'received' | 'pending' | 'escrow';
  amount: number;
  buyer: string;
  crop: string;
  date: string;
  time: string;
  method: string;
}

const paymentEvents: PaymentEvent[] = [
  { id: 'pay-001', type: 'received', amount: 56000, buyer: 'Metro Cash & Carry', crop: 'Capsicum', date: 'Today', time: '09:14 AM', method: 'UPI' },
  { id: 'pay-002', type: 'escrow', amount: 33600, buyer: 'Reliance Fresh', crop: 'Tomato', date: 'Today', time: '08:02 AM', method: 'Escrow' },
  { id: 'pay-003', type: 'received', amount: 17100, buyer: 'FreshKart', crop: 'Spinach', date: 'Yesterday', time: '04:45 PM', method: 'UPI' },
  { id: 'pay-004', type: 'pending', amount: 24200, buyer: 'BigBasket', crop: 'Onion', date: 'Yesterday', time: '11:30 AM', method: 'NEFT' },
  { id: 'pay-005', type: 'received', amount: 43500, buyer: 'Natures Basket', crop: 'Green Chilli', date: '05 May', time: '02:18 PM', method: 'UPI' },
  { id: 'pay-006', type: 'received', amount: 9880, buyer: 'Local Retailer Co-op', crop: 'Okra', date: '04 May', time: '10:55 AM', method: 'UPI' },
];

const typeConfig = {
  received: { icon: ArrowDownLeft, color: 'var(--success)', bg: 'var(--success-bg)', label: 'Received' },
  pending: { icon: Clock, color: 'var(--warning)', bg: 'var(--warning-bg)', label: 'Pending' },
  escrow: { icon: ArrowUpRight, color: 'var(--info)', bg: 'var(--info-bg)', label: 'In Escrow' },
};

export default function PaymentActivityFeed() {
  const [demoMode, setDemoMode] = useState(true);
  const [realOrders, setRealOrders] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDemoMode(localStorage.getItem('agrimart_demo_mode') !== 'false');
      const handleDemoToggle = () => {
        setDemoMode(localStorage.getItem('agrimart_demo_mode') !== 'false');
      };
      window.addEventListener('agrimart_demo_mode_change', handleDemoToggle);

      const stored = localStorage.getItem('agrimart_user');
      let phone = '9876543210';
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.phone) phone = parsed.phone;
        } catch (e) {}
      }

      const unsubOrders = subscribeToOrders(
        phone,
        'farmer',
        (orders: OrderItem[]) => {
          setRealOrders(orders || []);
        },
        () => {}
      );

      return () => {
        window.removeEventListener('agrimart_demo_mode_change', handleDemoToggle);
        unsubOrders();
      };
    }
  }, []);

  const convertedRealEvents: PaymentEvent[] = realOrders.map((o) => ({
    id: o.id,
    type: o.status === 'delivered' ? 'received' : o.status === 'in_transit' ? 'escrow' : 'pending',
    amount: o.totalVal || 15000,
    buyer: o.partner || 'Verified Retailer',
    crop: o.crop || 'Produce',
    date: o.date || 'Today',
    time: 'Recent',
    method: 'Escrow'
  }));

  const eventsToUse = convertedRealEvents.length > 0 
    ? [...convertedRealEvents, ...(demoMode ? paymentEvents : [])].slice(0, 8)
    : (demoMode ? paymentEvents : []);

  const totalPending = eventsToUse
    .filter((e) => e.type === 'pending' || e.type === 'escrow')
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-semibold text-base" style={{ color: 'var(--foreground)' }}>
            Payment Activity
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Recent transactions · ₹{totalPending.toLocaleString('en-IN')} pending release
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--success-bg)' }}
        >
          <IndianRupee className="w-4 h-4" style={{ color: 'var(--primary)' }} />
        </div>
      </div>

      <div className="space-y-2 flex-1">
        {eventsToUse.map((event) => {
          const config = typeConfig[event.type];
          const Icon = config.icon;
          return (
            <div
              key={event.id}
              className="flex items-center gap-3 p-2.5 rounded-xl transition-colors hover:bg-muted cursor-pointer"
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: config.bg }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                    {event.buyer}
                  </span>
                  <span
                    className={`text-sm font-bold tabular-nums flex-shrink-0`}
                    style={{ color: event.type === 'received' ? 'var(--success)' : 'var(--muted-foreground)' }}
                  >
                    {event.type === 'received' ? '+' : ''}₹{event.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                    {event.crop} · {event.method}
                  </span>
                  <span className="text-xs flex-shrink-0 tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                    {event.date}, {event.time}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div
        className="mt-4 pt-3 border-t grid grid-cols-2 gap-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--success-bg)' }}>
          <p className="text-xs" style={{ color: 'var(--success)' }}>Settled Today</p>
          <p className="text-base font-bold tabular-nums mt-0.5" style={{ color: 'var(--success)' }}>
            ₹{eventsToUse
              .filter((e) => e.type === 'received' && e.date === 'Today')
              .reduce((s, e) => s + e.amount, 0)
              .toLocaleString('en-IN')}
          </p>
        </div>
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'var(--info-bg)' }}>
          <p className="text-xs" style={{ color: 'var(--info)' }}>In Escrow</p>
          <p className="text-base font-bold tabular-nums mt-0.5" style={{ color: 'var(--info)' }}>
            ₹{eventsToUse
              .filter((e) => e.type === 'escrow')
              .reduce((s, e) => s + e.amount, 0)
              .toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
}