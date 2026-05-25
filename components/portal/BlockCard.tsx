'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { ItemRow } from './ItemRow';
import { weekLabel } from '@/lib/portal-utils';
import type { PortalBlockWithItems, PortalItemWithFiles, UserRole } from '@/types/portal';

interface BlockCardProps {
  block: PortalBlockWithItems;
  userRole: UserRole;
  onItemUpdated: (blockId: string, updated: PortalItemWithFiles) => void;
}

const blockAccentMap: Record<string, { header: string; badge: string; iconBg: string }> = {
  'base-accesos':        { header: 'from-violet-50 to-indigo-50', badge: 'bg-violet-100 text-violet-700', iconBg: 'bg-violet-100' },
  'diseno-marca':        { header: 'from-pink-50 to-rose-50',     badge: 'bg-pink-100 text-pink-700',     iconBg: 'bg-pink-100'   },
  'catalogo-contenido':  { header: 'from-sky-50 to-blue-50',      badge: 'bg-sky-100 text-sky-700',       iconBg: 'bg-sky-100'    },
  'servicio-tecnico-samm': { header: 'from-amber-50 to-orange-50', badge: 'bg-amber-100 text-amber-700',  iconBg: 'bg-amber-100'  },
};

const DEFAULT_ACCENT = { header: 'from-slate-50 to-white', badge: 'bg-slate-100 text-slate-600', iconBg: 'bg-slate-100' };

export function BlockCard({ block, userRole, onItemUpdated }: BlockCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const accent = blockAccentMap[block.slug] ?? DEFAULT_ACCENT;
  const { progress } = block;
  const hasBlockers = block.items.some((i) => i.is_blocker && i.status !== 'approved');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden">
      {/* Card header */}
      <div className={`px-5 py-4 bg-gradient-to-r ${accent.header}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${accent.iconBg}`}>
              {block.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-800 leading-tight">{block.title}</h3>
                {hasBlockers && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5 flex-shrink-0">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Bloqueado
                  </span>
                )}
              </div>
              {block.week_start && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {weekLabel(block.week_start, block.week_end)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${accent.badge}`}>
              {progress.approved}/{progress.total}
            </span>
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/70 hover:text-slate-600 transition-colors"
            >
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <ProgressBar percentage={progress.percentage} height="sm" showLabel />
        </div>

        {/* Mini stats */}
        <div className="flex gap-4 mt-2">
          <span className="text-[11px] text-emerald-600 font-medium">
            ✓ {progress.approved} aprobado{progress.approved !== 1 ? 's' : ''}
          </span>
          {progress.in_review > 0 && (
            <span className="text-[11px] text-amber-600 font-medium">
              ⏳ {progress.in_review} en revisión
            </span>
          )}
          {progress.pending > 0 && (
            <span className="text-[11px] text-red-500 font-medium">
              ● {progress.pending} pendiente{progress.pending !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Items list */}
      {!collapsed && (
        <div className="p-3 space-y-2">
          {block.items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              userRole={userRole}
              onItemUpdated={(updated) => onItemUpdated(block.id, updated)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
