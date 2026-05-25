import type {
  PortalItemWithFiles,
  PortalBlockWithItems,
  BlockProgress,
  PortalProgress,
  ItemStatus,
} from '@/types/portal';

export function calcBlockProgress(
  blockId: string,
  items: PortalItemWithFiles[],
): BlockProgress {
  const total     = items.length;
  const approved  = items.filter((i) => i.status === 'approved').length;
  const in_review = items.filter((i) => i.status === 'in_review').length;
  const pending   = items.filter((i) => i.status === 'pending').length;
  const percentage = total === 0 ? 0 : Math.round((approved / total) * 100);
  return { block_id: blockId, total, approved, in_review, pending, percentage };
}

export function calcOverallProgress(blocks: PortalBlockWithItems[]): PortalProgress {
  const all             = blocks.flatMap((b) => b.items);
  const total_items     = all.length;
  const approved_items  = all.filter((i) => i.status === 'approved').length;
  const in_review_items = all.filter((i) => i.status === 'in_review').length;
  const pending_items   = all.filter((i) => i.status === 'pending').length;
  const overall_percentage =
    total_items === 0 ? 0 : Math.round((approved_items / total_items) * 100);

  return {
    total_items,
    approved_items,
    in_review_items,
    pending_items,
    overall_percentage,
    by_block: blocks.map((b) => b.progress),
  };
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1_024)           return `${bytes} B`;
  if (bytes < 1_024 ** 2)      return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${(bytes / 1_024 ** 2).toFixed(1)} MB`;
}

export interface StatusStyle {
  bg:     string;
  text:   string;
  border: string;
  dot:    string;
  bar:    string;
  label:  string;
}

export const STATUS_STYLES: Record<ItemStatus, StatusStyle> = {
  approved: {
    bg:     'bg-emerald-50',
    text:   'text-emerald-700',
    border: 'border-emerald-200',
    dot:    'bg-emerald-500',
    bar:    'bg-emerald-500',
    label:  'Aprobado',
  },
  in_review: {
    bg:     'bg-amber-50',
    text:   'text-amber-700',
    border: 'border-amber-200',
    dot:    'bg-amber-400',
    bar:    'bg-amber-400',
    label:  'En revisión',
  },
  pending: {
    bg:     'bg-rose-50',
    text:   'text-rose-600',
    border: 'border-rose-200',
    dot:    'bg-rose-400',
    bar:    'bg-rose-400',
    label:  'Pendiente',
  },
};

export function weekLabel(start: number | null, end: number | null): string {
  if (!start) return '';
  if (!end || start === end) return `Semana ${start}`;
  return `Semanas ${start}–${end}`;
}

export function isImage(ct: string | null): boolean {
  return !!ct?.startsWith('image/');
}
