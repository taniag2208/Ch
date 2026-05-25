'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, RefreshCw, Settings, ShoppingBag } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { DashboardStats } from '@/components/portal/DashboardStats';
import { BlockCard } from '@/components/portal/BlockCard';
import { WeeklyTimeline } from '@/components/portal/WeeklyTimeline';
import { OnboardingBanner } from '@/components/portal/OnboardingBanner';
import type { PortalDashboardData, PortalBlockWithItems, PortalItemWithFiles } from '@/types/portal';

export default function PortalPage() {
  const router = useRouter();
  const [data, setData] = useState<PortalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/portal/blocks?project=technofoods-shopify');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `Error ${res.status}`);
      }
      const json: PortalDashboardData = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleItemUpdated = useCallback(
    (blockId: string, updated: PortalItemWithFiles) => {
      setData((prev) => {
        if (!prev) return prev;
        const blocks: PortalBlockWithItems[] = prev.blocks.map((block) => {
          if (block.id !== blockId) return block;
          const items = block.items.map((item) =>
            item.id === updated.id ? updated : item,
          );
          const approved = items.filter((i) => i.status === 'approved').length;
          const in_review = items.filter((i) => i.status === 'in_review').length;
          const pending = items.filter((i) => i.status === 'pending').length;
          const percentage = items.length === 0 ? 0 : Math.round((approved / items.length) * 100);
          return {
            ...block,
            items,
            progress: { block_id: blockId, total: items.length, approved, in_review, pending, percentage },
          };
        });

        const allItems = blocks.flatMap((b) => b.items);
        const total_items = allItems.length;
        const approved_items = allItems.filter((i) => i.status === 'approved').length;
        const in_review_items = allItems.filter((i) => i.status === 'in_review').length;
        const pending_items = allItems.filter((i) => i.status === 'pending').length;
        const overall_percentage =
          total_items === 0 ? 0 : Math.round((approved_items / total_items) * 100);

        return {
          ...prev,
          blocks,
          progress: {
            total_items,
            approved_items,
            in_review_items,
            pending_items,
            overall_percentage,
            by_block: blocks.map((b) => b.progress),
          },
        };
      });
    },
    [],
  );

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
          <p className="text-sm text-slate-500">Cargando portal...</p>
        </div>
      </div>
    );
  }

  // ── Error / empty state ──────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="font-semibold text-slate-800 mb-1">Proyecto no encontrado</h2>
          <p className="text-sm text-slate-500 mb-4">
            {error ?? 'No tienes acceso a este proyecto.'}
          </p>
          <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3 text-left mb-4">
            <strong>Setup:</strong> Ejecuta <code className="bg-slate-100 rounded px-1">POST /api/portal/seed</code> para inicializar el proyecto Technofoods en la base de datos.
          </p>
          <button
            onClick={() => fetchData()}
            className="w-full py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg gradient-charlie flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">
              {data.project.client_name}
            </span>
            <span className="text-slate-300 text-sm hidden sm:block">·</span>
            <span className="text-xs text-slate-400 hidden sm:block">{data.project.name}</span>
          </div>

          <div className="flex items-center gap-2">
            {data.user_role === 'admin' && (
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                <Settings className="w-3 h-3" />
                Admin
              </span>
            )}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleSignOut}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-red-500 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Onboarding banner (dismissible) */}
        <OnboardingBanner />

        {/* Stats */}
        <DashboardStats
          progress={data.progress}
          projectName={data.project.name}
          clientName={data.project.client_name}
        />

        {/* Timeline */}
        <WeeklyTimeline blocks={data.blocks} />

        {/* Block cards */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Insumos por bloque
          </h2>
          {data.blocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              userRole={data.user_role}
              onItemUpdated={handleItemUpdated}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
