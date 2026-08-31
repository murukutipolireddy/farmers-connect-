'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store, Truck, ShieldCheck, ArrowUpRight, Calendar, MapPin,
  MessageSquare, Star, Sparkles, RefreshCw, BarChart2,
  TrendingUp, CheckCircle, Package, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import RetailerSpendChart from './RetailerSpendChart';
import StatusBadge from '@/components/ui/StatusBadge';
import { apiFetch } from '@/lib/api';
import { subscribeToOrders, subscribeToListings } from '@/lib/realtime';

interface Shipment {
  id: string;
  crop: string;
  qty: number;
  farmer: string;
  location: string;
  status: 'ordered' | 'dispatched' | 'coldStorage' | 'delivered';
  estDelivery: string;
  price: number;
}

const initialShipments: Shipment[] = [
  { id: 'ship-301', crop: 'Tomato', qty: 1500, farmer: 'Ramesh Kumar', location: 'Nashik, MH', status: 'dispatched', estDelivery: '18 May', price: 30 },
  { id: 'ship-302', crop: 'Potato', qty: 2500, farmer: 'Gurpreet Singh', location: 'Jalandhar, PB', status: 'coldStorage', estDelivery: '20 May', price: 18 },
  { id: 'ship-303', crop: 'Onion', qty: 1200, farmer: 'Balu Shinde', location: 'Lasalgaon, MH', status: 'delivered', estDelivery: '15 May', price: 24 },
  { id: 'ship-304', crop: 'Green Chilli', qty: 600, farmer: 'Anita Reddy', location: 'Guntur, AP', status: 'ordered', estDelivery: '22 May', price: 45 },
];

const partnerFarmers = [
  { name: 'Ramesh Kumar', region: 'Nashik, MH', crop: 'Tomatoes & Capsicum', rating: 4.8, status: 'Verified', deliveries: 14 },
  { name: 'Anita Reddy', region: 'Guntur, AP', crop: 'Chilli & Turmeric', rating: 4.9, status: 'Verified', deliveries: 8 },
  { name: 'Gurpreet Singh', region: 'Jalandhar, PB', crop: 'Potatoes & Wheat', rating: 4.7, status: 'Verified', deliveries: 19 },
];

export default function RetailerDashboardContent() {
  const [shipments, setShipments] = useState<Shipment[]>(initialShipments);
  const [listings, setListings] = useState<any[]>([]);
  const [phoneNum, setPhoneNum] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [demoMode, setDemoMode] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('agrimart_user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setPhoneNum(user.phone);
        } catch (e) {}
      }
      setDemoMode(localStorage.getItem('agrimart_demo_mode') !== 'false');
      const handleDemoToggle = () => {
        setDemoMode(localStorage.getItem('agrimart_demo_mode') !== 'false');
      };
      window.addEventListener('agrimart_demo_mode_change', handleDemoToggle);
      return () => window.removeEventListener('agrimart_demo_mode_change', handleDemoToggle);
    }
  }, []);

  // Real-Time Firebase Firestore Subscriptions
  useEffect(() => {
    const effectivePhone = phoneNum || '9823456780';

    // 1. Real-time orders/shipments
    const unsubOrders = subscribeToOrders(
      effectivePhone,
      'retailer',
      (ordersData) => {
        if (ordersData && ordersData.length > 0) {
          const mapped = ordersData.map((o: any) => ({
            id: o.id,
            crop: o.crop,
            qty: o.qty,
            farmer: o.partner,
            location: o.location,
            status: o.status,
            estDelivery: o.date,
            price: Math.round(o.totalVal / (o.qty || 1)),
          }));
          setShipments(mapped);
        }
      },
      (err) => console.warn('Retailer orders listener warning:', err)
    );

    // 2. Real-time market listings
    const unsubListings = subscribeToListings(
      { isBuyRequest: false },
      (listingsData) => {
        if (listingsData && listingsData.length > 0) {
          setListings(listingsData.slice(0, 4));
        }
      },
      (err) => console.warn('Retailer listings listener warning:', err)
    );

    return () => {
      unsubOrders();
      unsubListings();
    };
  }, [phoneNum]);

  const router = useRouter();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setIsRefreshing(false);
    toast.success('Live shipments and listings synced with Firebase');
  };

  const getStatusColor = (status: Shipment['status']): 'active' | 'pending' | 'danger' | 'info' | 'muted' | 'success' => {
    switch (status) {
      case 'ordered': return 'pending';
      case 'dispatched': return 'info';
      case 'coldStorage': return 'pending';
      case 'delivered': return 'success';
      default: return 'pending';
    }
  };

  const getStatusLabel = (status: Shipment['status']) => {
    switch (status) {
      case 'ordered': return 'Ordered';
      case 'dispatched': return 'Dispatched';
      case 'coldStorage': return 'Cold Storage';
      case 'delivered': return 'Delivered';
      default: return 'Unknown';
    }
  };

  return (
    <div className="px-4 xl:px-8 2xl:px-12 py-6 max-w-screen-2xl mx-auto">
      {/* Header section */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Retailer Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Priya Merchants · Sourcing Hub · Last updated: 07 May 2026, 11:32 AM
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border transition-colors hover:bg-muted disabled:opacity-50 flex items-center gap-2 text-sm font-semibold"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} style={{ color: 'var(--muted-foreground)' }} />
            Sync Sourcing
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { label: 'Total Sourced Val', value: '₹3,84,200', change: '+14.6% MoM', trend: 'up', icon: Store, bg: 'var(--primary-bg)', color: 'var(--primary)' },
          { label: 'In-Transit Weight', value: '4,600 Kg', change: '4 active shipments', trend: 'neutral', icon: Truck, bg: 'var(--info-bg)', color: 'var(--info)' },
          { label: 'Middlemen Savings', value: '₹46,000', change: 'Avg 12% saved direct', trend: 'up', icon: Sparkles, bg: 'var(--success-bg)', color: 'var(--success)' },
          { label: 'Sourcing Trust Index', value: '98.5%', change: '100% blockchain trace', trend: 'up', icon: ShieldCheck, bg: 'var(--warning-bg)', color: 'var(--warning)' },
        ].map((kpi, idx) => (
          <div key={`kpi-${idx}`} className="card p-5 flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: kpi.bg }}
            >
              <kpi.icon className="w-6 h-6" style={{ color: kpi.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                {kpi.label}
              </p>
              <p className="text-2xl font-bold mt-1 tabular-nums" style={{ color: 'var(--foreground)' }}>
                {kpi.value}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="text-2xs font-semibold"
                  style={{ color: kpi.trend === 'up' ? 'var(--success)' : 'var(--muted-foreground)' }}
                >
                  {kpi.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Spend chart & active orders */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 mt-5">
        <div className="xl:col-span-3">
          <RetailerSpendChart />
        </div>
        
        {/* Quick Sourcing Match */}
        <div className="xl:col-span-2">
          <div className="card p-5 h-full flex flex-col justify-between">
            <div>
              <h2 className="font-display font-semibold text-base" style={{ color: 'var(--foreground)' }}>
                AI Sourcing Engine
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Matching demand predictions with surplus harvests
              </p>
              
              <div className="mt-5 space-y-3.5">
                {[
                  { crop: 'Tomatoes', status: 'High Nashik supply coming', action: 'Book futures at ₹24/kg' },
                  { crop: 'Potatoes', status: 'Demand rising in 3 weeks', action: 'Lock samunnati pool deal' },
                  { crop: 'Onions', status: 'Price spike predicted', action: 'Pre-buy Lasalgaon harvest' },
                ].map((s, i) => (
                  <div key={i} className="p-3.5 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--secondary)' }}>
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{s.crop}</p>
                      <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{s.status}</p>
                    </div>
                    <button
                      onClick={() => toast.success(`Initiated matching for ${s.crop}`)}
                      className="px-3 py-1.5 rounded-lg text-2xs font-bold text-white transition-all bg-primary hover:opacity-90 flex items-center gap-1"
                    >
                      Match <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <Link
              href="/produce-listing-page"
              prefetch={true}
              className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:opacity-95 transition-opacity text-center block"
            >
              Browse Live Marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* Shipment In-Transit Row */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <div className="card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold text-base" style={{ color: 'var(--foreground)' }}>
                  Active Procurement Shipments
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  Traceable transit list with cold chain statuses
                </p>
              </div>
            </div>
            {/* Mobile Shipment Cards */}
            <div className="space-y-3 md:hidden">
              {shipments.map((s) => (
                <div key={`mob-ship-${s.id}`} className="p-3.5 rounded-xl border bg-card space-y-2 text-xs" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-primary">{s.id}</span>
                    <StatusBadge status={getStatusColor(s.status)} label={getStatusLabel(s.status)} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-foreground">{s.crop}</span>
                    <span className="font-bold tabular-nums text-foreground">{s.qty} kg · ₹{s.price}/kg</span>
                  </div>
                  <div className="flex justify-between text-2xs text-muted-foreground pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
                    <span>{s.farmer} ({s.location})</span>
                    <span className="font-medium text-foreground">Delivery: {s.estDelivery}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    {['ID', 'Produce', 'Weight', 'Farmer', 'Rate', 'Delivery', 'Status'].map((h) => (
                      <th key={h} className="text-left pb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {shipments.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-semibold text-xs text-primary">{s.id}</td>
                      <td className="py-3 font-medium text-foreground">{s.crop}</td>
                      <td className="py-3 text-foreground tabular-nums">{s.qty} kg</td>
                      <td className="py-3">
                        <div className="text-foreground">{s.farmer}</div>
                        <div className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{s.location}</div>
                      </td>
                      <td className="py-3 text-foreground tabular-nums">₹{s.price}/kg</td>
                      <td className="py-3 text-foreground font-medium">{s.estDelivery}</td>
                      <td className="py-3">
                        <StatusBadge status={getStatusColor(s.status)} label={getStatusLabel(s.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Partner Farmers Contacts */}
        <div className="lg:col-span-1">
          <div className="card p-5 flex flex-col">
            <h2 className="font-display font-semibold text-base" style={{ color: 'var(--foreground)' }}>
              Direct Farmer Relationships
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Contracts signed directly with verified local growers
            </p>
            
            <div className="mt-5 space-y-4 flex-1">
              {partnerFarmers.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: 'var(--primary)' }}>
                    {f.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{f.name}</p>
                    <p className="text-2xs truncate" style={{ color: 'var(--muted-foreground)' }}>{f.region} · {f.crop}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xs font-semibold text-green-600 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-current" /> {f.rating}
                      </span>
                      <span className="text-2xs font-medium" style={{ color: 'var(--muted-foreground)' }}>{f.deliveries} deliveries</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.success(`Connecting chat with ${f.name}...`)}
                    className="p-2 rounded-xl border hover:bg-muted transition-colors flex-shrink-0"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <MessageSquare className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                  </button>
                </div>
              ))}
            </div>

            <Link
              href="/produce-listing-page/trace"
              prefetch={true}
              className="mt-4 w-full py-2 border border-dashed rounded-xl text-xs font-semibold transition-colors hover:bg-muted text-center block"
              style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
            >
              Verify Blockchain Sourcing Audits
            </Link>
          </div>
        </div>
      </div>

      {/* New Harvest Listings */}
      <div className="card p-5 mt-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-semibold text-base" style={{ color: 'var(--foreground)' }}>
              New Live Crop Listings
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Latest surplus and fresh harvests published by local Kisans
            </p>
          </div>
          <Link 
            href="/produce-listing-page"
            prefetch={true}
            className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
          >
            View All Marketplace <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        
        {listings.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No active crop listings found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {listings.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border flex flex-col justify-between" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--secondary)' }}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{item.cropType}</span>
                    <span className="text-2xs font-medium text-foreground" style={{ color: 'var(--muted-foreground)' }}>Grade {item.grade}</span>
                  </div>
                  <h3 className="font-bold text-sm mt-2 text-foreground">{item.variety}</h3>
                  <p className="text-2xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    Farm: {item.farmName} ({item.region})
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-2 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Rate</p>
                    <p className="text-sm font-bold text-foreground">₹{item.pricePerKg}/kg</p>
                  </div>
                  <div>
                    <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Qty Available</p>
                    <p className="text-sm font-semibold text-foreground">{item.quantityKg} kg</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
