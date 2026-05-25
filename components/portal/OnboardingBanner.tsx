'use client';

import { useState } from 'react';
import { X, Upload, MessageSquare, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    Icon:  Upload,
    title: 'Sube tus archivos',
    desc:  'Haz clic en un ítem para expandirlo. Puedes arrastrar o seleccionar múltiples archivos.',
  },
  {
    Icon:  MessageSquare,
    title: 'Agrega comentarios',
    desc:  'Usa el campo de comentarios para aclarar dudas o agregar notas al equipo.',
  },
  {
    Icon:  CheckCircle2,
    title: 'Sigue el avance',
    desc:  'Pendiente (rojo) → En revisión (amarillo) → Aprobado (verde). El equipo actualiza los estados.',
  },
];

export function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="relative bg-slate-800 rounded-2xl p-5 overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-tita-700/20 pointer-events-none" />
      <div className="absolute -bottom-10 right-12 w-28 h-28 rounded-full bg-tita-600/10 pointer-events-none" />

      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20
          flex items-center justify-center text-white/60 hover:text-white transition-colors z-10"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg gradient-tita flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[10px] font-bold">TM</span>
        </div>
        <p className="text-white font-semibold text-sm">¿Cómo funciona el portal?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
        {STEPS.map(({ Icon, title, desc }, i) => (
          <div key={i} className="bg-white/8 hover:bg-white/12 transition-colors rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-tita-500/30 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-tita-300" />
              </div>
              <span className="text-sm font-semibold text-white">{title}</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
