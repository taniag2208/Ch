'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, LogOut, Settings, ShoppingBag } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { DashboardStats } from '@/components/portal/DashboardStats';
import { BlockCard } from '@/components/portal/BlockCard';
import { WeeklyTimeline } from '@/components/portal/WeeklyTimeline';
import { OnboardingBanner } from '@/components/portal/OnboardingBanner';
import { calcBlockProgress, calcOverallProgress } from '@/lib/portal-utils';
import type {
  PortalDashboardData,
  PortalBlockWithItems,
  PortalItemWithFiles,
} from '@/types/portal';

export default function PortalPage() {
  const router = useRouter();
  const [data, setData] = useState<PortalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch dashboard ──────────────────────────────────────────────
  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await fetch('/api/portal/blocks?project=technofoods-shopify');
      if (res.status === 401) { router.push('/login'); return; }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      setData(json as PortalDashboardData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ── Optimistic item update ────────────────────────────────────────
  const handleItemUpdated = useCallback((blockId: string, updated: PortalItemWithFiles) => {
    setData((prev) => {
      if (!prev) return prev;

      const blocks: PortalBlockWithItems[] = prev.blocks.map((b) => {
        if (b.id !== blockId) return b;
        const items = b.items.map((i) => (i.id === updated.id ? updated : i));
        return { ...b, items, progress: calcBlockProgress(b.id, items) };
      });

      return { ...prev, blocks, progress: calcOverallProgress(blocks) };
    });
  }, []);

  // ── Sign out ─────────────────────────────────────────────────────
  const signOut = async () => {
    await createSupabaseBrowserClient().auth.signOut();
    router.push('/login');
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl gradient-tita flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">TM</span>
          </div>
          <div className="w-5 h-5 border-2 border-tita-500 border-t-transparent rounded-full animate-spin mt-1" />
          <p className="text-sm text-slate-500">Cargando portal...</p>
        </div>
      </div>
    );
  }

  // ── Error / empty ────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8 max-w-md w-full">
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="font-bold text-slate-800 mb-1">Proyecto no encontrado</h2>
          <p className="text-sm text-slate-500 mb-4">
            {error ?? 'No tienes acceso a este proyecto o aún no ha sido inicializado.'}
          </p>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4 text-xs text-slate-600 leading-relaxed">
            <p className="font-bold mb-1">Paso 1 — Configuración inicial:</p>
            <p>Ejecuta este endpoint autenticado para inicializar el proyecto:</p>
            <code className="block mt-1 font-mono bg-slate-100 rounded px-2 py-1">
              POST /api/portal/seed
            </code>
            <p className="font-bold mt-3 mb-1">Paso 2 — Variables de entorno:</p>
            <p>Asegúrate de tener <code className="bg-slate-100 rounded px-1">SUPABASE_SERVICE_ROLE_KEY</code> configurado.</p>
          </div>
          <button
            onClick={() => fetchDashboard()}
            className="w-full py-2.5 text-sm font-semibold text-white gradient-tita rounded-xl hover:opacity-90 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-soft">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg gradient-tita flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-[10px]">TM</span>
            </div>
            <span className="font-bold text-slate-800 text-sm hidden sm:block">Tita Media</span>
            <span className="text-slate-300 hidden sm:block">·</span>
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm text-slate-600 font-medium">
                {data.project.client_name}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {data.user_role === 'admin' && (
              <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold
                text-tita-700 bg-tita-50 border border-tita-100 rounded-full px-2.5 py-0.5">
                <Settings className="w-3 h-3" />
                Admin
              </span>
            )}
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              title="Actualizar"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400
                hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={signOut}
              title="Cerrar sesión"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400
                hover:bg-rose-50 hover:text-rose-500 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Onboarding */}
        <OnboardingBanner />

        {/* Stats + overall progress */}
        <DashboardStats
          progress={data.progress}
          projectName={data.project.name}
          clientName={data.project.client_name}
        />

        {/* Timeline */}
        <WeeklyTimeline blocks={data.blocks} />

        {/* Blocks */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
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

        {/* Footer */}
        <footer className="text-center pt-4 pb-2">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Tita Media · Portal de proyectos
          </p>
        </footer>
      </main>
    </div>
  );
}
