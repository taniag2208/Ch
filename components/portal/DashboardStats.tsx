'use client';

import { Package2, CheckCircle2, Clock, CircleDot } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import type { PortalProgress } from '@/types/portal';

interface DashboardStatsProps {
  progress:    PortalProgress;
  projectName: string;
  clientName:  string;
}

export function DashboardStats({ progress, projectName, clientName }: DashboardStatsProps) {
  const cards = [
    { label: 'Total insumos', value: progress.total_items,    Icon: Package2,    color: 'text-slate-600', bg: 'bg-slate-100' },
    { label: 'Aprobados',     value: progress.approved_items, Icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'En revisión',   value: progress.in_review_items, Icon: Clock,       color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Pendientes',    value: progress.pending_items,  Icon: CircleDot,   color: 'text-rose-500',  bg: 'bg-rose-100' },
  ];

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="inline-block text-xs font-bold text-tita-600 bg-tita-50 border border-tita-100
            rounded-full px-2.5 py-0.5 uppercase tracking-wide mb-2">
            {clientName}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">{projectName}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Portal de recolección de insumos</p>
        </div>

        {/* Big % badge */}
        <div className="gradient-tita text-white rounded-2xl px-5 py-3 text-center shadow-card flex-shrink-0">
          <p className="text-3xl font-black leading-none">{progress.overall_percentage}%</p>
          <p className="text-[11px] text-tita-100 mt-0.5 font-medium">completado</p>
        </div>
      </div>

      {/* Overall bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-semibold text-slate-700">Progreso general del proyecto</span>
          <span className="text-sm font-bold text-tita-600">{progress.overall_percentage}%</span>
        </div>
        <ProgressBar percentage={progress.overall_percentage} height="md" />
        <p className="text-xs text-slate-400 mt-2">
          {progress.approved_items} de {progress.total_items} insumos aprobados
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-soft px-4 py-3.5 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
              <Icon className={color} style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800">{value}</p>
              <p className="text-[11px] text-slate-400 font-medium leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
