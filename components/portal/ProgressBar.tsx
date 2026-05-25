'use client';

interface ProgressBarProps {
  percentage: number;
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  color?: string;
  className?: string;
}

const colorMap: Record<number, string> = {};

function getBarColor(pct: number) {
  if (pct === 100) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-indigo-500';
  if (pct > 0) return 'bg-amber-500';
  return 'bg-slate-200';
}

const heightMap = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

export function ProgressBar({
  percentage,
  height = 'md',
  showLabel = false,
  color,
  className = '',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, percentage));
  const barColor = color ?? getBarColor(pct);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-slate-100 rounded-full overflow-hidden ${heightMap[height]}`}>
        <div
          className={`${heightMap[height]} rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-500 w-9 text-right">{pct}%</span>
      )}
    </div>
  );
}
