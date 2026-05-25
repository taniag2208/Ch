'use client';

import { Package, CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import type { PortalProgress } from '@/types/portal';

interface DashboardStatsProps {
  progress: PortalProgress;
  projectName: string;
  clientName: string;
}

export function DashboardStats({ progress, projectName, clientName }: DashboardStatsProps) {
  const stats = [
    {
      label: 'Total insumos',
      value: progress.total_items,
      icon: Package,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
    {
      label: 'Aprobados',
      value: progress.approved_items,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'En revisión',
      value: progress.in_review_items,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      label: 'Pendientes',
      value: progress.pending_items,
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5 uppercase tracking-wide">
              {clientName}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{projectName}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Portal de recolección de insumos</p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-4 py-2.5 rounded-xl shadow-sm flex-shrink-0">
          <TrendingUp className="w-4 h-4" />
          <span className="text-lg font-bold">{progress.overall_percentage}%</span>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-semibold text-slate-700">Progreso general</span>
          <span className="text-sm font-bold text-indigo-600">{progress.overall_percentage}%</span>
        </div>
        <ProgressBar percentage={progress.overall_percentage} height="lg" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-slate-200 shadow-soft px-4 py-3.5 flex items-center gap-3"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                <Icon className={`w-4.5 h-4.5 ${s.color}`} style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{s.value}</p>
                <p className="text-[11px] text-slate-400 font-medium leading-tight">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
