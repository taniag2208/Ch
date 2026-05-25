'use client';

interface ProgressBarProps {
  percentage: number;
  height?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

function barColor(pct: number) {
  if (pct === 100) return 'bg-emerald-500';
  if (pct >= 60)   return 'bg-tita-500';
  if (pct >= 20)   return 'bg-amber-400';
  return 'bg-rose-400';
}

const H = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5' };

export function ProgressBar({ percentage, height = 'sm', showLabel = false, className = '' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, percentage));
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-slate-100 rounded-full overflow-hidden ${H[height]}`}>
        <div
          className={`${H[height]} rounded-full transition-all duration-500 ${barColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-9 text-right text-xs font-bold text-slate-500">{pct}%</span>
      )}
    </div>
  );
}
