'use client';

import { ProgressBar } from './ProgressBar';
import type { PortalBlockWithItems } from '@/types/portal';

interface WeeklyTimelineProps {
  blocks: PortalBlockWithItems[];
}

const WEEKS = [1, 2, 3, 4];

export function WeeklyTimeline({ blocks }: WeeklyTimelineProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Timeline por semanas</h3>
      <div className="space-y-1">
        {/* Week headers */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {WEEKS.map((w) => (
            <div key={w} className="text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Sem. {w}
              </span>
            </div>
          ))}
        </div>

        {/* Gantt-style blocks */}
        {blocks.map((block) => {
          const start = block.week_start ?? 1;
          const end = block.week_end ?? start;
          const colStart = start;
          const colSpan = end - start + 1;

          return (
            <div key={block.id} className="grid grid-cols-4 gap-2 items-center">
              {/* Empty cells before */}
              {Array.from({ length: colStart - 1 }).map((_, i) => (
                <div key={i} />
              ))}

              {/* Block bar */}
              <div
                className="rounded-lg overflow-hidden"
                style={{ gridColumn: `${colStart} / span ${colSpan}` }}
              >
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-medium text-indigo-700 truncate">
                      {block.icon} {block.title}
                    </span>
                    <span className="text-[11px] font-bold text-indigo-500 flex-shrink-0">
                      {block.progress.percentage}%
                    </span>
                  </div>
                  <ProgressBar percentage={block.progress.percentage} height="sm" />
                </div>
              </div>

              {/* Empty cells after */}
              {Array.from({ length: 4 - (colStart - 1) - colSpan }).map((_, i) => (
                <div key={i} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
