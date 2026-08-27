import React from 'react';

type StatusType = 'active' | 'pending' | 'danger' | 'info' | 'muted' | 'success';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  dot?: boolean;
}

export default function StatusBadge({ status, label, dot = true }: StatusBadgeProps) {
  const classMap: Record<string, string> = {
    active: 'status-active',
    success: 'status-active',
    pending: 'status-pending',
    danger: 'status-danger',
    info: 'status-info',
    muted: 'status-muted',
  };

  const dotColorMap: Record<string, string> = {
    active: 'bg-green-600',
    success: 'bg-green-600',
    pending: 'bg-amber-600',
    danger: 'bg-red-600',
    info: 'bg-blue-600',
    muted: 'bg-stone-400',
  };

  const safeClass = classMap[status] || classMap['active'];
  const safeDotColor = dotColorMap[status] || dotColorMap['active'];

  return (
    <span className={`status-badge ${safeClass}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${safeDotColor}`} />}
      {label}
    </span>
  );
}