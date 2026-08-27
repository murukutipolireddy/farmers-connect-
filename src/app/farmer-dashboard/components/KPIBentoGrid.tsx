'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Sprout, ShoppingCart,
  BarChart3, CheckCircle, AlertTriangle, Leaf,
  IndianRupee,
} from 'lucide-react';

// Bento grid plan: 8 cards
// grid-cols-4 across all breakpoints from lg+
// Row 1: Hero (Earnings MTD, spans 2 cols) + Active Listings + Pending Orders
// Row 2: Demand Score + Fulfillment Rate + Surplus Risk (alert) + Carbon Credits

interface KPICard {
  id: string;
  label: string;
  value: string;
  subValue?: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  cardBg?: string;
  cardBorder?: string;
  isAlert?: boolean;
  isHero?: boolean;
  colSpan?: number;
}

const kpiCards: KPICard[] = [
  {
    id: 'kpi-earnings',
    label: 'Earnings This Month',
    value: '₹1,84,320',
    subValue: 'Settled via UPI',
    change: 18.4,
    changeLabel: 'vs last month',
    icon: IndianRupee,
    iconBg: 'var(--primary)',
    iconColor: '#fff',
    isHero: true,
    colSpan: 2,
  },
  {
    id: 'kpi-listings',
    label: 'Active Listings',
    value: '7',
    subValue: '3 with pending bids',
    change: 2,
    changeLabel: 'new this week',
    icon: Sprout,
    iconBg: 'var(--success-bg)',
    iconColor: 'var(--success)',
  },
  {
    id: 'kpi-orders',
    label: 'Pending Orders',
    value: '4',
    subValue: '2 need packing today',
    change: -1,
    changeLabel: 'vs yesterday',
    icon: ShoppingCart,
    iconBg: 'var(--info-bg)',
    iconColor: 'var(--info)',
  },
  {
    id: 'kpi-demand',
    label: 'Demand Score',
    value: '82/100',
    subValue: 'Tomato, Onion surging',
    change: 6,
    changeLabel: 'pts this week',
    icon: BarChart3,
    iconBg: 'var(--success-bg)',
    iconColor: 'var(--success)',
  },
  {
    id: 'kpi-fulfillment',
    label: 'Fulfillment Rate',
    value: '96.2%',
    subValue: 'Last 90 days',
    change: 1.3,
    changeLabel: 'vs last quarter',
    icon: CheckCircle,
    iconBg: 'var(--success-bg)',
    iconColor: 'var(--success)',
  },
  {
    id: 'kpi-surplus',
    label: 'Surplus Risk',
    value: '2 listings',
    subValue: 'Spoilage in < 12 hrs',
    icon: AlertTriangle,
    iconBg: 'var(--danger)',
    iconColor: '#fff',
    isAlert: true,
    cardBg: 'var(--danger-bg)',
    cardBorder: '#FCA5A5',
  },
  {
    id: 'kpi-carbon',
    label: 'Carbon Credits',
    value: '34 tCO₂',
    subValue: '₹8,500 est. value',
    change: 4,
    changeLabel: 'credits this month',
    icon: Leaf,
    iconBg: 'var(--success-bg)',
    iconColor: 'var(--success)',
  },
];

import { subscribeToListings, subscribeToOrders, ListingItem, OrderItem } from '@/lib/realtime';

export default function KPIBentoGrid() {
  const [demoMode, setDemoMode] = useState(true);
  const [liveListingsCount, setLiveListingsCount] = useState<number>(7);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(4);
  const [liveEarnings, setLiveEarnings] = useState<number>(184320);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDemoMode(localStorage.getItem('agrimart_demo_mode') !== 'false');
      const handleDemoToggle = () => {
        setDemoMode(localStorage.getItem('agrimart_demo_mode') !== 'false');
      };
      window.addEventListener('agrimart_demo_mode_change', handleDemoToggle);

      // Subscribe to real-time listings
      const unsubListings = subscribeToListings(
        { isBuyRequest: false },
        (listings) => {
          if (listings) {
            setLiveListingsCount(listings.filter((l) => l.status !== 'sold').length);
          }
        }
      );

      // Subscribe to real-time orders
      const unsubOrders = subscribeToOrders(
        '9876543210',
        'farmer',
        (orders) => {
          if (orders && orders.length > 0) {
            const pending = orders.filter((o) => o.status === 'pending').length;
            setPendingOrdersCount(pending);
            const total = orders
              .filter((o) => o.status !== 'cancelled')
              .reduce((sum, o) => sum + (o.totalVal || 0), 0);
            if (total > 0) {
              setLiveEarnings(total);
            }
          }
        }
      );

      return () => {
        window.removeEventListener('agrimart_demo_mode_change', handleDemoToggle);
        unsubListings();
        unsubOrders();
      };
    }
  }, []);

  const dynamicKPIs = kpiCards.map((card) => {
    if (card.id === 'kpi-listings') {
      return { ...card, value: String(liveListingsCount), subValue: `${liveListingsCount} live on market` };
    }
    if (card.id === 'kpi-orders') {
      return { ...card, value: String(pendingOrdersCount), subValue: `${pendingOrdersCount} awaiting dispatch` };
    }
    if (card.id === 'kpi-earnings') {
      return { ...card, value: `₹${liveEarnings.toLocaleString('en-IN')}`, subValue: 'Real-time UPI volume' };
    }
    if (!demoMode) {
      if (card.id === 'kpi-demand') return { ...card, value: '--/100', subValue: 'Awaiting market data', change: 0 };
      if (card.id === 'kpi-fulfillment') return { ...card, value: '100%', subValue: 'Awaiting first order', change: 0 };
      if (card.id === 'kpi-surplus') return { ...card, value: '0 listings', subValue: 'No spoilage risk', isAlert: false, cardBg: 'var(--card)', cardBorder: 'var(--border)' };
      if (card.id === 'kpi-carbon') return { ...card, value: '0 tCO₂', subValue: '₹0 est. value', change: 0 };
    }
    return card;
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {dynamicKPIs.map((card) => (
        <div
          key={card.id}
          className={`card p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-card-hover
            ${card.colSpan === 2 ? 'col-span-2' : 'col-span-1'}
            ${card.isAlert ? 'surplus-pulse' : ''}
          `}
          style={{
            backgroundColor: card.cardBg ?? 'var(--card)',
            borderColor: card.cardBorder ?? 'var(--border)',
            borderWidth: card.isAlert ? '2px' : '1px',
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: card.isAlert ? 'var(--danger)' : 'var(--muted-foreground)', letterSpacing: '0.07em' }}
              >
                {card.label}
              </p>
            </div>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: card.iconBg }}
            >
              <card.icon className="w-4 h-4" style={{ color: card.iconColor }} />
            </div>
          </div>

          <div>
            <p
              className={`font-display font-bold tabular-nums ${card.isHero ? 'text-3xl' : 'text-2xl'}`}
              style={{ color: card.isAlert ? 'var(--danger)' : 'var(--foreground)' }}
            >
              {card.value}
            </p>
            {card.subValue && (
              <p className="text-xs mt-0.5" style={{ color: card.isAlert ? 'var(--danger)' : 'var(--muted-foreground)' }}>
                {card.subValue}
              </p>
            )}
          </div>

          {card.change !== undefined && (
            <div className="flex items-center gap-1.5">
              {card.change >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
              )}
              <span
                className="text-xs font-semibold tabular-nums"
                style={{ color: card.change >= 0 ? 'var(--success)' : 'var(--danger)' }}
              >
                {card.change >= 0 ? '+' : ''}{card.change}
                {typeof card.change === 'number' && (card.id === 'kpi-earnings' || card.id === 'kpi-fulfillment') ? '%' : ''}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {card.changeLabel}
              </span>
            </div>
          )}

          {card.isAlert && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
                Approve flash sale to recover value
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}