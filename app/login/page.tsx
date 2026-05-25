'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';

type Mode = 'signin' | 'magic';

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = searchParams.get('next') ?? '/portal';

  const [mode, setMode]       = useState<Mode>('signin');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [sent, setSent]       = useState(false);

  const supabase = createSupabaseBrowserClient();

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.push(next);
    router.refresh();
  };

  const handleMagicLink = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${next}` },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-tita-900 via-tita-800 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl gradient-tita flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">TM</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Tita Media</span>
        </div>
        <p className="text-tita-300 text-sm">Portal de proyectos</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-7">
        <h1 className="text-xl font-bold text-slate-800 mb-1">Iniciar sesión</h1>
        <p className="text-sm text-slate-500 mb-6">Accede al portal de tu proyecto</p>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
          {(['signin', 'magic'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSent(false); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === m
                  ? 'bg-white text-slate-800 shadow-soft'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {m === 'signin' ? 'Contraseña' : 'Magic Link'}
            </button>
          ))}
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-tita-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-tita-600" />
            </div>
            <h2 className="font-semibold text-slate-800 mb-1">Revisa tu correo</h2>
            <p className="text-sm text-slate-500">
              Enviamos un enlace de acceso a <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={mode === 'signin' ? handleSignIn : handleMagicLink} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@correo.com"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-tita-400 focus:border-tita-400 transition"
                />
              </div>
            </div>

            {/* Password (only in signin mode) */}
            {mode === 'signin' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-tita-400 focus:border-tita-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white gradient-tita hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' ? 'Ingresar' : 'Enviar enlace de acceso'}
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-xs text-tita-400">
        © {new Date().getFullYear()} Tita Media · Portal de proyectos
      </p>
    </div>
  );
}
