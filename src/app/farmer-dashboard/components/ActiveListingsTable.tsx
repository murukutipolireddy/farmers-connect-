'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, ChevronUp, ChevronDown, Zap,  } from 'lucide-react';
import { toast } from 'sonner';
import GradeBadge from '@/components/ui/GradeBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import Link from 'next/link';

interface Listing {
  id: string;
  crop: string;
  variety: string;
  grade: 'A' | 'B' | 'C' | 'D';
  qtyKg: number;
  pricePerKg: number;
  harvestDate: string;
  availableUntil: string;
  freshnessScore: number;
  status: 'active' | 'reserved' | 'sold' | 'flash';
  buyerName?: string;
  views: number;
  bids: number;
}

const mockListings: Listing[] = [
  { id: 'fl-001', crop: 'Tomato', variety: 'Hybrid F1 — Naveen', grade: 'A', qtyKg: 2800, pricePerKg: 28, harvestDate: '03/05/26', availableUntil: '12/05/26', freshnessScore: 96, status: 'flash', views: 142, bids: 7 },
  { id: 'fl-002', crop: 'Onion', variety: 'Nasik Red', grade: 'A', qtyKg: 1200, pricePerKg: 22, harvestDate: '28/04/26', availableUntil: '18/05/26', freshnessScore: 88, status: 'active', views: 89, bids: 3 },
  { id: 'fl-003', crop: 'Capsicum', variety: 'California Wonder', grade: 'A', qtyKg: 440, pricePerKg: 68, harvestDate: '05/05/26', availableUntil: '11/05/26', freshnessScore: 98, status: 'reserved', buyerName: 'Metro Cash & Carry', views: 67, bids: 1 },
  { id: 'fl-004', crop: 'Spinach', variety: 'Palak All Season', grade: 'A', qtyKg: 380, pricePerKg: 45, harvestDate: '05/05/26', availableUntil: '08/05/26', freshnessScore: 99, status: 'active', views: 211, bids: 12 },
  { id: 'fl-005', crop: 'Brinjal', variety: 'Arka Shirish', grade: 'B', qtyKg: 680, pricePerKg: 30, harvestDate: '02/05/26', availableUntil: '09/05/26', freshnessScore: 74, status: 'active', views: 34, bids: 0 },
  { id: 'fl-006', crop: 'Okra', variety: 'Arka Anamika', grade: 'A', qtyKg: 320, pricePerKg: 52, harvestDate: '06/05/26', availableUntil: '09/05/26', freshnessScore: 97, status: 'active', views: 98, bids: 5 },
  { id: 'fl-007', crop: 'Green Chilli', variety: 'Byadgi Long', grade: 'A', qtyKg: 750, pricePerKg: 58, harvestDate: '04/05/26', availableUntil: '12/05/26', freshnessScore: 94, status: 'active', views: 156, bids: 8 },
  { id: 'fl-008', crop: 'Cauliflower', variety: 'Snowball XL', grade: 'B', qtyKg: 560, pricePerKg: 32, harvestDate: '01/05/26', availableUntil: '10/05/26', freshnessScore: 81, status: 'sold', buyerName: 'Reliance Fresh', views: 203, bids: 0 },
];

type SortField = 'crop' | 'grade' | 'qtyKg' | 'pricePerKg' | 'freshnessScore' | 'views';

import { subscribeToListings, deleteListingRealtime, ListingItem } from '@/lib/realtime';

export default function ActiveListingsTable() {
  const [liveListings, setLiveListings] = useState<any[]>(mockListings);
  const [isLoading, setIsLoading] = useState(false);
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

  // Real-Time Firebase Firestore Subscription
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToListings(
      { isBuyRequest: false },
      (updated) => {
        if (updated && updated.length > 0) {
          const mapped = updated.map((l: any) => ({
            id: l.id,
            crop: l.cropType,
            variety: l.variety,
            grade: (l.grade as 'A' | 'B' | 'C' | 'D') || 'A',
            qtyKg: Number(l.quantityKg) || 0,
            pricePerKg: Number(l.pricePerKg) || 0,
            harvestDate: l.harvestDate || 'Today',
            availableUntil: l.availableUntil || 'In 7 days',
            freshnessScore: Number(l.freshnessScore) || 95,
            status: (l.status === 'flash' ? 'flash' : l.status === 'sold' ? 'sold' : l.status === 'reserved' ? 'reserved' : 'active') as any,
            buyerName: l.buyerName,
            views: l.views || Math.floor(Math.random() * 50) + 10,
            bids: l.bids || 0,
          }));
          setLiveListings(mapped);
        } else {
          setLiveListings(mockListings);
        }
        setIsLoading(false);
      },
      (err) => {
        console.warn('Real-time ActiveListingsTable warning:', err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const listingsToUse = liveListings;

  const [sortField, setSortField] = useState<SortField>('freshnessScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = React.useMemo(() => {
    return [...listingsToUse].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [listingsToUse, sortField, sortDir]);

  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedRows((prev) =>
      prev.length === listingsToUse.length ? [] : listingsToUse.map((l) => l.id)
    );
  };

  const handleDeleteListing = async (listingId: string, crop: string) => {
    try {
      await deleteListingRealtime(listingId);
      toast.success(`${crop} listing deleted in real-time from Firebase`);
    } catch (e: any) {
      toast.error('Failed to delete listing');
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedRows) {
        await deleteListingRealtime(id);
      }
      toast.success(`${selectedRows.length} listing${selectedRows.length > 1 ? 's' : ''} removed in real-time`);
      setSelectedRows([]);
    } catch (e) {
      toast.error('Bulk deletion failed');
    }
  };

  const statusMap: Record<string, { status: 'active' | 'pending' | 'muted' | 'danger' | 'info'; label: string }> = {
    active: { status: 'active', label: 'Active' },
    reserved: { status: 'pending', label: 'Reserved' },
    sold: { status: 'muted', label: 'Sold' },
    flash: { status: 'danger', label: 'Flash Sale' },
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3" style={{ color: 'var(--primary)' }} />
      : <ChevronDown className="w-3 h-3" style={{ color: 'var(--primary)' }} />;
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div>
          <h2 className="font-display font-semibold text-base" style={{ color: 'var(--foreground)' }}>
            My Active Listings
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {listingsToUse.filter((l) => l.status !== 'sold').length} live · {listingsToUse.filter((l) => l.status === 'sold').length} sold
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg animate-slide-up"
              style={{ backgroundColor: 'var(--danger-bg)' }}
            >
              <span className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
                {selectedRows.length} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="text-xs font-semibold flex items-center gap-1"
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          )}
          <Link href="/produce-listing-page" className="btn-primary text-sm py-2">
            <Plus className="w-4 h-4" />
            New Listing
          </Link>
        </div>
      </div>

      {/* Mobile Card List View (< md) */}
      <div className="md:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
        {sorted.map((listing) => {
          const statusInfo = statusMap[listing.status] ?? { status: 'muted' as const, label: listing.status };
          const freshnessColor =
            listing.freshnessScore >= 90
              ? 'var(--success)'
              : listing.freshnessScore >= 70
              ? 'var(--accent)'
              : 'var(--danger)';

          return (
            <div
              key={`m-${listing.id}`}
              className="p-4 flex flex-col gap-2.5 transition-colors"
              style={{
                backgroundColor: selectedRows.includes(listing.id) ? 'var(--success-bg)' : 'transparent',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(listing.id)}
                    onChange={() => toggleRow(listing.id)}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                        {listing.crop}
                      </span>
                      {listing.status === 'flash' && (
                        <Zap className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
                      )}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {listing.variety}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <GradeBadge grade={listing.grade} size="sm" />
                  <StatusBadge status={statusInfo.status} label={statusInfo.label} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2.5 rounded-xl text-xs">
                <div>
                  <span className="text-muted-foreground block">Available Qty</span>
                  <span className="font-bold text-foreground">{listing.qtyKg.toLocaleString('en-IN')} kg</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Price / kg</span>
                  <span className="font-bold text-foreground">₹{listing.pricePerKg}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Freshness:</span>
                  <span className="font-bold" style={{ color: freshnessColor }}>
                    {listing.freshnessScore}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toast.info(`Viewing ${listing.crop} listing`)}
                    className="p-1.5 rounded-lg border bg-card hover:bg-muted"
                    style={{ borderColor: 'var(--border)' }}
                    title="View"
                  >
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => toast.info(`Editing ${listing.crop} listing`)}
                    className="p-1.5 rounded-lg border bg-card hover:bg-muted"
                    style={{ borderColor: 'var(--border)' }}
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => toast.error(`${listing.crop} listing removed`)}
                    className="p-1.5 rounded-lg border bg-card hover:bg-danger/10"
                    style={{ borderColor: 'var(--border)' }}
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-danger" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--secondary)' }}>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={listingsToUse.length > 0 && selectedRows.length === listingsToUse.length}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 rounded accent-primary"
                />
              </th>
              {([
                { label: 'Crop / Variety', field: 'crop' as SortField },
                { label: 'Grade', field: 'grade' as SortField },
                { label: 'Qty (kg)', field: 'qtyKg' as SortField },
                { label: 'Price/kg', field: 'pricePerKg' as SortField },
                { label: 'Harvest', field: null },
                { label: 'Freshness', field: 'freshnessScore' as SortField },
                { label: 'Views', field: 'views' as SortField },
                { label: 'Buyer', field: null },
                { label: 'Status', field: null },
                { label: '', field: null },
              ] as { label: string; field: SortField | null }[]).map((col) => (
                <th
                  key={`th-${col.label || 'actions'}`}
                  className="px-4 py-3 text-left"
                  onClick={() => col.field && handleSort(col.field)}
                  style={{ cursor: col.field ? 'pointer' : 'default' }}
                >
                  <div className="flex items-center gap-1">
                    <span
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--muted-foreground)', letterSpacing: '0.06em' }}
                    >
                      {col.label}
                    </span>
                    {col.field && <SortIcon field={col.field} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((listing) => {
              const statusInfo = statusMap[listing.status] ?? { status: 'muted' as const, label: listing.status };
              const freshnessColor =
                listing.freshnessScore >= 90
                  ? 'var(--success)'
                  : listing.freshnessScore >= 70
                  ? 'var(--accent)'
                  : 'var(--danger)';

              return (
                <tr
                  key={listing.id}
                  className="border-b transition-colors group hover:bg-secondary/60"
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: selectedRows.includes(listing.id)
                      ? 'var(--success-bg)'
                      : undefined,
                  }}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(listing.id)}
                      onChange={() => toggleRow(listing.id)}
                      className="w-3.5 h-3.5 rounded accent-primary"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                            {listing.crop}
                          </span>
                          {listing.status === 'flash' && (
                            <Zap className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
                          )}
                        </div>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {listing.variety}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <GradeBadge grade={listing.grade} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium tabular-nums" style={{ color: 'var(--foreground)' }}>
                      {listing.qtyKg.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
                      ₹{listing.pricePerKg}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                      {listing.harvestDate}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-14 h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--muted)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${listing.freshnessScore}%`, backgroundColor: freshnessColor }}
                        />
                      </div>
                      <span
                        className="text-xs font-semibold tabular-nums"
                        style={{ color: freshnessColor }}
                      >
                        {listing.freshnessScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                        {listing.views}
                      </span>
                      {listing.bids > 0 && (
                        <span
                          className="text-2xs font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                          style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}
                        >
                          {listing.bids} bids
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {listing.buyerName ? (
                      <span className="text-sm font-medium truncate max-w-[120px] block" style={{ color: 'var(--foreground)' }}>
                        {listing.buyerName}
                      </span>
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={statusInfo.status} label={statusInfo.label} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        title="View listing"
                        onClick={() => toast.info(`Viewing ${listing.crop} listing`)}
                      >
                        <Eye className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        title="Edit listing"
                        onClick={() => toast.info(`Editing ${listing.crop} listing`)}
                      >
                        <Edit2 className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                      </button>
                      <button
                        className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors"
                        title="Remove listing — this cannot be undone"
                        onClick={() => handleDeleteListing(listing.id, listing.crop)}
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table footer */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ backgroundColor: 'var(--secondary)' }}
      >
        <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
          {listingsToUse.length} listings total · {listingsToUse.filter((l) => l.status === 'active' || l.status === 'flash').length} active
        </span>
        <Link
          href="/produce-listing-page"
          className="text-xs font-semibold flex items-center gap-1"
          style={{ color: 'var(--primary)' }}
        >
          View all listings →
        </Link>
      </div>
    </div>
  );
}