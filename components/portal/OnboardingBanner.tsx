'use client';

import { useState } from 'react';
import { X, Upload, MessageSquare, CheckCircle2, BookOpen } from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    title: 'Sube tus archivos',
    desc: 'Haz clic en cualquier ítem para expandirlo y subir archivos. Puedes arrastrar o seleccionar múltiples archivos a la vez.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
  },
  {
    icon: MessageSquare,
    title: 'Agrega comentarios',
    desc: 'Usa el campo de comentarios para agregar notas, aclaraciones o preguntas al equipo de desarrollo.',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
  },
  {
    icon: CheckCircle2,
    title: 'Sigue el progreso',
    desc: 'Cada ítem tiene un estado: Pendiente (rojo), En revisión (amarillo) y Aprobado (verde). El equipo actualizará los estados.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
];

export function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl p-5 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
      <div className="absolute -bottom-8 -right-2 w-24 h-24 bg-white/5 rounded-full" />

      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4" />
        <span className="text-sm font-semibold">¿Cómo funciona este portal?</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold">{step.title}</span>
              </div>
              <p className="text-[11px] text-white/80 leading-relaxed">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
