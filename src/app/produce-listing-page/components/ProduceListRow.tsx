'use client';

import React, { memo } from 'react';
import { ShoppingCart, Eye, QrCode, Users, Zap, Star } from 'lucide-react';
import GradeBadge from '@/components/ui/GradeBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import type { ProduceListing } from './produceData';

interface ProduceListRowProps {
  listing: ProduceListing;
  onOrder: () => void;
  onDetails?: () => void;
}

const ProduceListRow = memo(function ProduceListRow({ listing, onOrder, onDetails }: ProduceListRowProps) {
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
    <tr
      className="border-b transition-colors group hover:bg-secondary/60"
      style={{ borderColor: 'var(--border)' }}
    >
      <td className="px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
              {listing.cropType}
            </span>
            {listing.isFlashSale && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-2xs font-bold"
                style={{ backgroundColor: 'var(--danger)', color: '#fff' }}
              >
                <Zap className="w-2.5 h-2.5" />
                {listing.flashDiscount}%
              </span>
            )}
            {listing.isCooperative && (
              <span title={`Cooperative pool of ${listing.cooperativeSize} farmers`}>
                <Users className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              </span>
            )}
            {listing.hasBlockchain && (
              <span title="Blockchain verified">
                <QrCode className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
              </span>
            )}
          </div>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{listing.variety}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium truncate max-w-[140px]" style={{ color: 'var(--foreground)' }}>
            {listing.farmName}
          </p>
          <div className="flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
              {listing.farmerRating}
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <GradeBadge grade={listing.grade} size="sm" />
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium tabular-nums" style={{ color: 'var(--foreground)' }}>
          {listing.quantityKg.toLocaleString('en-IN')}
        </span>
      </td>
      <td className="px-4 py-3">
        <div>
          <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
            ₹{listing.pricePerKg}
          </span>
          {listing.originalPricePerKg && (
            <span className="text-xs line-through ml-1 tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
              ₹{listing.originalPricePerKg}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
          {listing.harvestDate}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div
            className="w-16 h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--muted)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${listing.freshnessScore}%`,
                backgroundColor: freshnessColor,
              }}
            />
          </div>
          <span className="text-xs tabular-nums font-medium" style={{ color: freshnessColor }}>
            {listing.freshnessScore}%
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {listing.region}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={statusInfo.status} label={statusInfo.label} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onDetails}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title={listing.isBuyRequest ? "View procurement details" : "View listing details"}
          >
            <Eye className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          </button>
          <button
            type="button"
            disabled={listing.status === 'sold' || listing.status === 'reserved'}
            onClick={onOrder}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={listing.isBuyRequest ? "Fulfill request / Sell crops" : "Add to order cart"}
          >
            <ShoppingCart className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          </button>
        </div>
      </td>
    </tr>
  );
});

ProduceListRow.displayName = 'ProduceListRow';
export default ProduceListRow;