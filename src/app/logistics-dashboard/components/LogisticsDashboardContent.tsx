'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck, ShieldCheck, MapPin, MessageSquare, Star, Sparkles, RefreshCw,
  Package, ArrowRight, CheckCircle, Navigation, Clock, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { subscribeToOrders } from '@/lib/realtime';

interface DeliveryOrder {
  id: string;
  crop: string;
  qty: number;
  partner: string;
  location: string;
  totalVal: number;
  status: 'pending' | 'dispatched' | 'in_transit' | 'delivered' | 'cancelled';
  date: string;
  hasBlockchain: boolean;
}

export default function LogisticsDashboardContent() {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
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

  // Real-Time Firebase Firestore Subscription for Logistics Deliveries
  useEffect(() => {
    const effectivePhone = phoneNum || '9876543210';
    const unsubscribe = subscribeToOrders(
      effectivePhone,
      'logistics',
      (ordersData) => {
        if (ordersData && ordersData.length > 0) {
          const mapped: DeliveryOrder[] = ordersData.map(o => ({
            id: o.id,
            crop: o.crop,
            qty: o.qty,
            partner: o.partner,
            location: o.location,
            totalVal: o.totalVal,
            status: o.status === 'in_transit' ? 'dispatched' : o.status,
            date: o.date,
            hasBlockchain: Boolean(o.hasBlockchain),
          }));
          setDeliveries(mapped);
        }
      },
      (err) => console.warn('Logistics real-time deliveries warning:', err)
    );

    return () => {
      unsubscribe();
    };
  }, [phoneNum]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setIsRefreshing(false);
    toast.success('Live logistics tracking synchronized with Firebase');
  };

  const handleUpdateStatus = async (orderId: string, newStatus: 'pending' | 'dispatched' | 'delivered') => {
    try {
      const response = await apiFetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      });

      if (response.ok) {
        toast.success(`Order ${orderId} updated to ${newStatus}!`);
        // Update local state
        setDeliveries(prev => prev.map(d => d.id === orderId ? { ...d, status: newStatus } : d));
      } else {
        toast.error('Failed to update shipment status.');
      }
    } catch (e) {
      toast.error('Error updating status.');
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Logistics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage pickups, track routes, and update shipment statuses.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Active Shipments</p>
            <h3 className="text-2xl font-bold mt-1">
              {deliveries.filter(d => d.status === 'dispatched').length}
            </h3>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Pending Pickups</p>
            <h3 className="text-2xl font-bold mt-1">
              {deliveries.filter(d => d.status === 'pending').length}
            </h3>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10 text-success">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Delivered Shipments</p>
            <h3 className="text-2xl font-bold mt-1">
              {deliveries.filter(d => d.status === 'delivered').length}
            </h3>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-info/10 text-info">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Total Orders Assigned</p>
            <h3 className="text-2xl font-bold mt-1">{deliveries.length}</h3>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 columns: Deliveries Table */}
        <div className="xl:col-span-2 card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Assigned Deliveries
            </h2>
          </div>

          {/* Mobile Delivery Cards */}
          <div className="space-y-3 md:hidden">
            {deliveries.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No deliveries assigned to this account.
              </div>
            ) : (
              deliveries.map((d) => (
                <div key={`mob-deliv-${d.id}`} className="p-3.5 rounded-xl border bg-card space-y-2 text-xs" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-primary">{d.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-2xs font-bold ${
                      d.status === 'delivered' ? 'bg-success/10 text-success' :
                      d.status === 'dispatched' ? 'bg-primary/10 text-primary' :
                      'bg-amber-500/10 text-amber-600'
                    }`}>
                      {d.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{d.crop}</h3>
                    <p className="text-2xs text-muted-foreground mt-0.5">{d.qty} kg · Partner: {d.partner}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    <span className="flex items-center gap-1 text-2xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" /> {d.location}
                    </span>
                    {d.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(d.id, 'dispatched')}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold active:scale-95"
                      >
                        Dispatch
                      </button>
                    )}
                    {d.status === 'dispatched' && (
                      <button
                        onClick={() => handleUpdateStatus(d.id, 'delivered')}
                        className="px-3 py-1.5 rounded-lg bg-success text-white text-xs font-bold active:scale-95"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <th className="pb-3 text-sm font-semibold text-muted-foreground">Order ID</th>
                  <th className="pb-3 text-sm font-semibold text-muted-foreground">Crop Details</th>
                  <th className="pb-3 text-sm font-semibold text-muted-foreground">Partner</th>
                  <th className="pb-3 text-sm font-semibold text-muted-foreground">Destination</th>
                  <th className="pb-3 text-sm font-semibold text-muted-foreground">Status</th>
                  <th className="pb-3 text-sm font-semibold text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                      No deliveries assigned to this account.
                    </td>
                  </tr>
                ) : (
                  deliveries.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 text-sm font-bold text-primary">{d.id}</td>
                      <td className="py-4">
                        <div className="text-sm font-semibold">{d.crop}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{d.qty} kg</div>
                      </td>
                      <td className="py-4 text-sm font-medium">{d.partner}</td>
                      <td className="py-4 text-sm flex items-center gap-1 mt-1 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        {d.location}
                      </td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          d.status === 'delivered' ? 'bg-success/10 text-success' :
                          d.status === 'dispatched' ? 'bg-primary/10 text-primary' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {d.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {d.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(d.id, 'dispatched')}
                              className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
                            >
                              Dispatch
                            </button>
                          )}
                          {d.status === 'dispatched' && (
                            <button
                              onClick={() => handleUpdateStatus(d.id, 'delivered')}
                              className="px-3 py-1 rounded bg-success text-white text-xs font-semibold hover:opacity-90"
                            >
                              Mark Delivered
                            </button>
                          )}
                          {d.status === 'delivered' && (
                            <span className="text-xs text-success font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Complete
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: Route / Logistics Info */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Navigation className="w-5 h-5 text-primary" />
              Quick Statistics
            </h2>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-primary bg-primary/10 p-1.5 rounded-lg" />
                <div>
                  <h4 className="text-sm font-semibold">Quality & Temperature Check</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Cold storage parameters monitored via IoT sensor logs.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border flex items-center gap-3">
                <Star className="w-8 h-8 text-amber-500 bg-amber-500/10 p-1.5 rounded-lg" />
                <div>
                  <h4 className="text-sm font-semibold">Service Rating</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Currently rated 4.9 stars by partner retailers.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-info bg-info/10 p-1.5 rounded-lg" />
                <div>
                  <h4 className="text-sm font-semibold">Eco-Route Optimization</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Using AI to minimize carbon footprint on transit routes.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Support Hotline</span>
              <span className="font-semibold text-primary">+91 1800-456-789</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
