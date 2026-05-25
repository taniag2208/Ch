import type {
  PortalItemWithFiles,
  PortalBlockWithItems,
  BlockProgress,
  PortalProgress,
} from '@/types/portal';

export function calcBlockProgress(items: PortalItemWithFiles[]): BlockProgress {
  const total = items.length;
  const approved = items.filter((i) => i.status === 'approved').length;
  const in_review = items.filter((i) => i.status === 'in_review').length;
  const pending = items.filter((i) => i.status === 'pending').length;
  const percentage = total === 0 ? 0 : Math.round((approved / total) * 100);
  return {
    block_id: items[0]?.block_id ?? '',
    total,
    approved,
    in_review,
    pending,
    percentage,
  };
}

export function calcOverallProgress(blocks: PortalBlockWithItems[]): PortalProgress {
  const allItems = blocks.flatMap((b) => b.items);
  const total_items = allItems.length;
  const approved_items = allItems.filter((i) => i.status === 'approved').length;
  const in_review_items = allItems.filter((i) => i.status === 'in_review').length;
  const pending_items = allItems.filter((i) => i.status === 'pending').length;
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

export function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'approved':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        ring: 'ring-emerald-100',
        bar: 'bg-emerald-500',
      };
    case 'in_review':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        ring: 'ring-amber-100',
        bar: 'bg-amber-500',
      };
    default:
      return {
        bg: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-200',
        dot: 'bg-red-400',
        ring: 'ring-red-100',
        bar: 'bg-red-400',
      };
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case 'approved':  return 'Aprobado';
    case 'in_review': return 'En revisión';
    default:          return 'Pendiente';
  }
}

export function weekLabel(start: number | null, end: number | null): string {
  if (!start && !end) return '';
  if (start === end || !end) return `Semana ${start}`;
  return `Semanas ${start}–${end}`;
}

export function isImageType(contentType: string | null): boolean {
  return !!contentType?.startsWith('image/');
}

export function isPdfType(contentType: string | null): boolean {
  return contentType === 'application/pdf';
}
