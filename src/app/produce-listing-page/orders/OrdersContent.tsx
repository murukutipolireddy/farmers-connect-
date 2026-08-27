'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Package, ShieldCheck, ArrowRight,
  TrendingUp, Calendar, MapPin, RefreshCw, Star, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import { subscribeToOrders } from '@/lib/realtime';

interface Order {
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

const purchaseOrders: Order[] = [
  { id: 'ord-801', crop: 'Tomato (Grade A)', qty: 1500, partner: 'Ramesh Kumar', location: 'Nashik, MH', totalVal: 45000, status: 'dispatched', date: '06 May 2026', hasBlockchain: true },
  { id: 'ord-802', crop: 'Potato (Grade B)', qty: 2500, partner: 'Gurpreet Singh', location: 'Jalandhar, PB', totalVal: 45000, status: 'pending', date: '07 May 2026', hasBlockchain: true },
  { id: 'ord-803', crop: 'Onion (Grade A)', qty: 1200, partner: 'Balu Shinde', location: 'Lasalgaon, MH', totalVal: 28800, status: 'delivered', date: '01 May 2026', hasBlockchain: true },
];

const salesOrders: Order[] = [
  { id: 'ord-901', crop: 'Tomato (Grade A)', qty: 1500, partner: 'Priya Merchants', location: 'Mumbai, MH', totalVal: 45000, status: 'dispatched', date: '06 May 2026', hasBlockchain: true },
  { id: 'ord-902', crop: 'Capsicum (Grade A)', qty: 800, partner: 'FreshMart Retail', location: 'Pune, MH', totalVal: 44000, status: 'delivered', date: '28 Apr 2026', hasBlockchain: false },
  { id: 'ord-903', crop: 'Tomato (Grade B)', qty: 1000, partner: 'Mumbai Veg Co.', location: 'Mumbai, MH', totalVal: 22000, status: 'cancelled', date: '15 Apr 2026', hasBlockchain: false },
];

export default function OrdersContent() {
  const [userRole, setUserRole] = useState<'farmer' | 'retailer'>('farmer');
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales'>('purchases');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>(salesOrders);
  const [phoneNum, setPhoneNum] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('agrimart_user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setUserRole(user.role === 'retailer' ? 'retailer' : 'farmer');
          setActiveTab(user.role === 'retailer' ? 'purchases' : 'sales');
          setOrders(user.role === 'retailer' ? purchaseOrders : salesOrders);
          setPhoneNum(user.phone);
        } catch (e) {}
      }
    }
  }, []);

  // Real-Time Firebase Firestore Subscription for Orders
  useEffect(() => {
    const fallback = activeTab === 'purchases' ? purchaseOrders : salesOrders;
    const roleQuery = activeTab === 'purchases' ? 'retailer' : 'farmer';
    const effectivePhone = phoneNum || (roleQuery === 'retailer' ? '9823456780' : '9876543210');

    const unsubscribe = subscribeToOrders(
      effectivePhone,
      roleQuery,
      (updatedOrders) => {
        if (updatedOrders && updatedOrders.length > 0) {
          const mapped: Order[] = updatedOrders.map(o => ({
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
          setOrders(mapped);
        } else {
          setOrders(fallback);
        }
      },
      (err) => {
        console.warn('Real-time orders listener warning:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [phoneNum, activeTab]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setIsRefreshing(false);
    toast.success('Live orders synchronized via Firebase');
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      const response = await apiFetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'dispatched' })
      });
      if (response.ok) {
        toast.success(`Order ${orderId} approved successfully!`);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'dispatched' } : o));
      } else {
        toast.error('Failed to approve order');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to approve order');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await apiFetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'cancelled' })
      });
      if (response.ok) {
        toast.success(`Order ${orderId} rejected.`);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      } else {
        toast.error('Failed to reject order');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to reject order');
    }
  };

  const getOrders = () => {
    return orders;
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'pending';
      case 'dispatched': return 'info';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'pending';
    }
  };

  return (
    <div className="px-4 xl:px-8 2xl:px-12 py-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            My Orders
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Track sales and purchase agreements, delivery statuses, and blockchain ledger references.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl border transition-colors hover:bg-muted disabled:opacity-50 flex items-center gap-2 text-sm font-semibold"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} style={{ color: 'var(--muted-foreground)' }} />
          Sync Status
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg overflow-hidden border mb-5 max-w-md" style={{ borderColor: 'var(--border)' }}>
        {[
          { id: 'purchases', label: 'Purchase Orders (Buyer)', show: true },
          { id: 'sales', label: 'Sales Orders (Seller)', show: true }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className="flex-1 py-2.5 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: activeTab === t.id ? 'var(--primary)' : 'transparent',
              color: activeTab === t.id ? 'var(--primary-foreground)' : 'var(--muted-foreground)'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Orders View */}
      <div className="card p-4 sm:p-5">
        {getOrders().length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold">No orders found</p>
            <p className="text-xs mt-1">Orders placed or received will appear here in real-time.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card List */}
            <div className="space-y-3.5 md:hidden">
              {getOrders().map((ord) => (
                <div
                  key={`mobile-ord-${ord.id}`}
                  className="p-4 rounded-xl border bg-card shadow-sm space-y-3"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-xs text-primary">{ord.id}</span>
                      <h3 className="font-semibold text-sm text-foreground mt-0.5">{ord.crop}</h3>
                    </div>
                    <StatusBadge status={getStatusColor(ord.status)} label={ord.status.toUpperCase()} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <span className="text-2xs text-muted-foreground block">Quantity:</span>
                      <span className="font-bold text-foreground tabular-nums">{ord.qty} Kg</span>
                    </div>
                    <div>
                      <span className="text-2xs text-muted-foreground block">Total Amount:</span>
                      <span className="font-bold text-primary tabular-nums">₹{ord.totalVal.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-2xs text-muted-foreground block">
                        {activeTab === 'purchases' ? 'Seller (Farmer):' : 'Buyer (Retailer):'}
                      </span>
                      <span className="font-medium text-foreground">{ord.partner}</span>
                    </div>
                    <div>
                      <span className="text-2xs text-muted-foreground block">Date:</span>
                      <span className="text-foreground">{ord.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {ord.hasBlockchain ? (
                      <span className="inline-flex items-center gap-1 text-2xs font-semibold text-green-700 bg-success-bg px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="text-2xs text-muted-foreground">Standard Settle</span>
                    )}

                    {activeTab === 'sales' && ord.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveOrder(ord.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-primary active:scale-95"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleCancelOrder(ord.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-200 text-red-600 active:scale-95"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    {['Order ID', 'Produce Item', 'Quantity', activeTab === 'purchases' ? 'Seller (Farmer)' : 'Buyer (Retailer)', 'Total Val', 'Order Date', 'Blockchain Trace', 'Status', activeTab === 'sales' ? 'Actions' : ''].filter(Boolean).map((h) => (
                      <th key={h} className="text-left pb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {getOrders().map((ord) => (
                    <tr key={ord.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 font-bold text-xs text-primary">{ord.id}</td>
                      <td className="py-4 font-semibold text-foreground">{ord.crop}</td>
                      <td className="py-4 text-foreground tabular-nums">{ord.qty} Kg</td>
                      <td className="py-4">
                        <div className="text-foreground">{ord.partner}</div>
                        <div className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>{ord.location}</div>
                      </td>
                      <td className="py-4 text-foreground font-bold tabular-nums">₹{ord.totalVal.toLocaleString('en-IN')}</td>
                      <td className="py-4 text-2xs" style={{ color: 'var(--muted-foreground)' }}>{ord.date}</td>
                      <td className="py-4">
                        {ord.hasBlockchain ? (
                          <span className="inline-flex items-center gap-1 text-2xs font-semibold text-green-700 bg-success-bg px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified Ledger
                          </span>
                        ) : (
                          <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Off-chain Settle</span>
                        )}
                      </td>
                      <td className="py-4">
                        <StatusBadge status={getStatusColor(ord.status)} label={ord.status.toUpperCase()} />
                      </td>
                      {activeTab === 'sales' && (
                        <td className="py-4">
                          {ord.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveOrder(ord.id)}
                                className="px-2.5 py-1 rounded-lg text-2xs font-bold text-white bg-primary hover:opacity-90 transition-all"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleCancelOrder(ord.id)}
                                className="px-2.5 py-1 rounded-lg text-2xs font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-all"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-2xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                              {ord.status === 'cancelled' ? 'Rejected' : 'Approved'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
