'use client';

import { ProgressBar } from './ProgressBar';
import type { PortalBlockWithItems } from '@/types/portal';

interface WeeklyTimelineProps {
  blocks: PortalBlockWithItems[];
}

const WEEK_LABELS = ['Sem. 1', 'Sem. 2', 'Sem. 3', 'Sem. 4'];

export function WeeklyTimeline({ blocks }: WeeklyTimelineProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-5">
      <h3 className="text-sm font-bold text-slate-700 mb-4">
        Timeline del proyecto
      </h3>

      {/* Week columns header */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {WEEK_LABELS.map((w) => (
          <div key={w} className="text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{w}</span>
          </div>
        ))}
      </div>

      {/* Block rows */}
      <div className="space-y-2">
        {blocks.map((block) => {
          const start  = block.week_start ?? 1;
          const end    = block.week_end   ?? start;
          const span   = end - start + 1;
          const offset = start - 1;

          return (
            <div key={block.id} className="grid grid-cols-4 gap-2 items-center">
              {/* Empty leading columns */}
              {Array.from({ length: offset }).map((_, i) => <div key={i} />)}

              {/* Block bar */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ gridColumn: `${start} / span ${span}` }}
              >
                <div className="bg-slate-800 rounded-xl px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-white truncate">
                      {block.icon} {block.title}
                    </span>
                    <span className="text-xs font-black text-tita-300 flex-shrink-0 ml-2">
                      {block.progress.percentage}%
                    </span>
                  </div>
                  <ProgressBar percentage={block.progress.percentage} height="xs" />
                </div>
              </div>

              {/* Empty trailing columns */}
              {Array.from({ length: 4 - offset - span }).map((_, i) => <div key={i} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
