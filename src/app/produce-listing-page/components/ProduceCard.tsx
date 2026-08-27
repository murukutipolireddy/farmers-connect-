'use client';

import React, { memo } from 'react';
import {
  MapPin, Calendar, Droplets, Star, Users, QrCode,
  Zap, ShoppingCart, Eye, Clock,
} from 'lucide-react';
import GradeBadge from '@/components/ui/GradeBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import AppImage from '@/components/ui/AppImage';
import type { ProduceListing } from './produceData';

interface ProduceCardProps {
  listing: ProduceListing;
  onOrder: () => void;
  onDetails?: () => void;
}

const ProduceCard = memo(function ProduceCard({ listing, onOrder, onDetails }: ProduceCardProps) {
  const statusMap: Record<string, { status: 'active' | 'pending' | 'muted' | 'danger' | 'info'; label: string }> = {
    active: { status: 'active', label: 'Available' },
    reserved: { status: 'pending', label: 'Reserved' },
    sold: { status: 'muted', label: 'Sold Out' },
    flash: { status: 'danger', label: 'Flash Sale' },
  };

  const statusInfo = statusMap[listing.status] ?? { status: 'muted', label: listing.status };

  const freshnessColor =
    listing.freshnessScore >= 90
      ? 'var(--success)'
      : listing.freshnessScore >= 70
      ? 'var(--accent)'
      : 'var(--danger)';

  return (
    <div className="card overflow-hidden card-hover flex flex-col group">
      {/* Image area */}
      <div className="relative overflow-hidden cursor-pointer" style={{ height: '160px' }} onClick={onDetails}>
        <AppImage
          src={listing.imageUrl}
          alt={listing.imageAlt || listing.cropType}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <GradeBadge grade={listing.grade} size="sm" />
          {listing.isFlashSale && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold surplus-pulse"
              style={{ backgroundColor: 'var(--danger)', color: '#fff' }}
            >
              <Zap className="w-2.5 h-2.5" />
              {listing.flashDiscount || 25}% OFF
            </span>
          )}
        </div>

        {/* Top right badges */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
          {listing.hasBlockchain && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold"
              style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: 'var(--primary)' }}
            >
              <QrCode className="w-2.5 h-2.5" />
              Verified
            </span>
          )}
          {listing.isCooperative && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold"
              style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: 'var(--accent)' }}
            >
              <Users className="w-2.5 h-2.5" />
              Coop ×{listing.cooperativeSize || 4}
            </span>
          )}
        </div>

        {/* Bottom price */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
          <div>
            {listing.originalPricePerKg && (
              <span className="text-xs line-through mr-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                ₹{listing.originalPricePerKg}
              </span>
            )}
            <span className="text-xl font-bold tabular-nums text-white">
              ₹{listing.pricePerKg}
            </span>
            <span className="text-xs text-white/80">/kg</span>
          </div>
          <StatusBadge status={statusInfo.status} label={statusInfo.label} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Crop name */}
        <div className="cursor-pointer" onClick={onDetails}>
          <h3 className="font-display font-semibold text-base leading-tight hover:text-primary transition-colors" style={{ color: 'var(--foreground)' }}>
            {listing.cropType}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{listing.variety}</p>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
            <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
              {listing.region}, {listing.state}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
            <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
              {listing.harvestDate}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3 flex-shrink-0" style={{ color: freshnessColor }} />
            <span className="text-xs font-medium tabular-nums" style={{ color: freshnessColor }}>
              {listing.freshnessScore}% fresh
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--foreground)' }}>
              {(listing.quantityKg || 0).toLocaleString('en-IN')} kg
            </span>
          </div>
        </div>

        {/* Farmer info */}
        <div
          className="flex items-center gap-2 p-2 rounded-lg"
          style={{ backgroundColor: 'var(--secondary)' }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold flex-shrink-0"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {(listing.farmerName || 'Kisan').charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>
              {listing.farmName || listing.farmerName}
            </p>
            <div className="flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              <span className="text-2xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                {listing.farmerRating || 4.8} · {listing.farmerOrders || 12} orders
              </span>
            </div>
          </div>
        </div>

        {/* Certifications */}
        {Array.isArray(listing.certifications) && listing.certifications.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.certifications.slice(0, 2).map((cert) => (
              <span
                key={`cert-${listing.id}-${cert}`}
                className="text-2xs px-1.5 py-0.5 rounded font-medium"
                style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
              >
                {cert}
              </span>
            ))}
            {listing.certifications.length > 2 && (
              <span className="text-2xs px-1.5 py-0.5 rounded" style={{ color: 'var(--muted-foreground)' }}>
                +{listing.certifications.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Flash countdown */}
        {listing.isFlashSale && listing.flashEndsAt && (
          <div
            className="flex items-center gap-2 p-2 rounded-lg"
            style={{ backgroundColor: 'var(--danger-bg)' }}
          >
            <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--danger)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--danger)' }}>
              Flash ends: {new Date(listing.flashEndsAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Min order */}
        <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
          Min. order: {listing.minOrderKg || 50} kg
        </p>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <button
            type="button"
            className="btn-secondary flex-1 text-xs py-2"
            onClick={onDetails}
          >
            <Eye className="w-3.5 h-3.5" />
            Details
          </button>
          <button
            type="button"
            disabled={listing.status === 'sold' || listing.status === 'reserved'}
            onClick={onOrder}
            className="btn-primary flex-1 text-xs py-2 flex items-center justify-center gap-1"
            style={{
              opacity: listing.status === 'sold' || listing.status === 'reserved' ? 0.5 : 1,
              cursor: listing.status === 'sold' || listing.status === 'reserved' ? 'not-allowed' : 'pointer',
            }}
          >
            {!listing.isBuyRequest && <ShoppingCart className="w-3.5 h-3.5" />}
            {listing.status === 'reserved' ? 'Reserved' : listing.status === 'sold' ? 'Sold Out' : listing.isBuyRequest ? 'Sell / Fulfill' : 'Order Now'}
          </button>
        </div>
      </div>
    </div>
  );
});

ProduceCard.displayName = 'ProduceCard';
export default ProduceCard;