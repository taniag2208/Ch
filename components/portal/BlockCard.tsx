'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { ItemRow } from './ItemRow';
import { weekLabel } from '@/lib/portal-utils';
import type { PortalBlockWithItems, PortalItemWithFiles, UserRole } from '@/types/portal';

interface BlockCardProps {
  block:         PortalBlockWithItems;
  userRole:      UserRole;
  onItemUpdated: (blockId: string, item: PortalItemWithFiles) => void;
}

const ACCENT: Record<string, { gradient: string; badge: string; iconBg: string; border: string }> = {
  'base-accesos':          { gradient: 'from-slate-800 to-slate-700', badge: 'bg-slate-600/40 text-slate-100', iconBg: 'bg-white/10', border: 'border-slate-700' },
  'diseno-marca':          { gradient: 'from-rose-600 to-pink-500',   badge: 'bg-white/20 text-white',         iconBg: 'bg-white/10', border: 'border-rose-500' },
  'catalogo-contenido':    { gradient: 'from-sky-600 to-blue-500',    badge: 'bg-white/20 text-white',         iconBg: 'bg-white/10', border: 'border-sky-500'  },
  'servicio-tecnico-samm': { gradient: 'from-tita-700 to-tita-600',   badge: 'bg-white/20 text-white',         iconBg: 'bg-white/10', border: 'border-tita-600' },
};

const DEFAULT_ACCENT = { gradient: 'from-slate-600 to-slate-500', badge: 'bg-white/20 text-white', iconBg: 'bg-white/10', border: 'border-slate-500' };

export function BlockCard({ block, userRole, onItemUpdated }: BlockCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const a = ACCENT[block.slug] ?? DEFAULT_ACCENT;
  const { progress } = block;
  const hasBlockers = block.items.some((i) => i.is_blocker && i.status !== 'approved');

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-card">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-r ${a.gradient} px-5 py-4`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${a.iconBg}`}>
              {block.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-white font-bold leading-tight">{block.title}</h3>
                {hasBlockers && (
                  <span className="flex items-center gap-1 text-[10px] font-bold
                    text-amber-300 bg-amber-400/20 border border-amber-400/30 rounded-full px-2 py-0.5">
                    <AlertTriangle style={{ width: 9, height: 9 }} />
                    Bloqueado
                  </span>
                )}
              </div>
              {block.week_start && (
                <p className="text-white/60 text-xs mt-0.5">
                  {weekLabel(block.week_start, block.week_end)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${a.badge}`}>
              {progress.approved}/{progress.total} aprobados
            </span>
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center
                justify-center text-white/70 hover:text-white transition-colors"
            >
              {collapsed
                ? <ChevronDown className="w-4 h-4" />
                : <ChevronUp className="w-4 h-4" />
              }
            </button>
          </div>
        </div>

        {/* Progress + stats */}
        <div className="mt-3">
          <ProgressBar percentage={progress.percentage} height="xs" showLabel />
        </div>
        <div className="flex gap-4 mt-1.5">
          {progress.approved > 0 && (
            <span className="text-[11px] text-emerald-300 font-medium">
              ✓ {progress.approved} aprobado{progress.approved !== 1 ? 's' : ''}
            </span>
          )}
          {progress.in_review > 0 && (
            <span className="text-[11px] text-amber-300 font-medium">
              ⏳ {progress.in_review} en revisión
            </span>
          )}
          {progress.pending > 0 && (
            <span className="text-[11px] text-white/50 font-medium">
              ● {progress.pending} pendiente{progress.pending !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Items ─────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="bg-slate-50/50 p-3 space-y-2">
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
