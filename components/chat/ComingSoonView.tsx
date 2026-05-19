"use client";

import { CheckSquare, FolderKanban, Calendar, Users, Settings, Construction } from "lucide-react";

const views: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  tasks: {
    label: "Tareas",
    icon: CheckSquare,
    description: "Gestiona y visualiza todas tus tareas pendientes desde aquí.",
  },
  projects: {
    label: "Proyectos",
    icon: FolderKanban,
    description: "Organiza tus proyectos activos y haz seguimiento del progreso.",
  },
  calendar: {
    label: "Calendario",
    icon: Calendar,
    description: "Visualiza tus eventos y reuniones del día, semana o mes.",
  },
  crm: {
    label: "CRM",
    icon: Users,
    description: "Gestiona tus contactos, clientes y oportunidades comerciales.",
  },
  settings: {
    label: "Ajustes",
    icon: Settings,
    description: "Configura Charlie, integraciones y preferencias de tu cuenta.",
  },
};

export function ComingSoonView({ view }: { view: string }) {
  const current = views[view];
  if (!current) return null;

  const Icon = current.icon;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-charlie-50">
          <Icon className="h-9 w-9 text-charlie-500" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">
          <Construction className="h-4 w-4 text-amber-600" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">{current.label}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{current.description}</p>
      </div>

      <div className="rounded-xl border border-dashed border-charlie-200 bg-charlie-50/50 px-6 py-4">
        <p className="text-sm text-charlie-600">
          Esta sección estará disponible próximamente. Mientras tanto, puedes usar el chat para gestionar {current.label.toLowerCase()} con instrucciones en lenguaje natural.
        </p>
      </div>
    </div>
  );
}
