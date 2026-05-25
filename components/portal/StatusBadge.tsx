'use client';

import { CheckCircle2, Clock, CircleDot } from 'lucide-react';
import { STATUS_STYLES } from '@/lib/portal-utils';
import type { ItemStatus } from '@/types/portal';

interface StatusBadgeProps {
  status: ItemStatus;
  size?: 'xs' | 'sm';
}

const ICONS = {
  approved:  CheckCircle2,
  in_review: Clock,
  pending:   CircleDot,
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const s    = STATUS_STYLES[status];
  const Icon = ICONS[status];
  const cls  = size === 'xs'
    ? 'text-[10px] px-1.5 py-0.5 gap-1'
    : 'text-xs px-2 py-0.5 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border
        ${cls} ${s.bg} ${s.text} ${s.border}`}
    >
      <Icon style={{ width: size === 'xs' ? 10 : 12, height: size === 'xs' ? 10 : 12 }} />
      {s.label}
    </span>
  );
}
