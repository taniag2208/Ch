'use client';

import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { getStatusColor, getStatusLabel } from '@/lib/portal-utils';
import type { ItemStatus } from '@/types/portal';

interface StatusBadgeProps {
  status: ItemStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors = getStatusColor(status);
  const label = getStatusLabel(status);

  const Icon =
    status === 'approved'
      ? CheckCircle2
      : status === 'in_review'
      ? Clock
      : AlertCircle;

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${sizeClass} ${colors.bg} ${colors.text} ${colors.border}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {label}
    </span>
  );
}
