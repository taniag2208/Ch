"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, CheckCircle2 } from "lucide-react";

export type ConfigShape = {
  stageInactivityDays: Record<string, number>;
  dailyEmailLimit: number;
  exclusionList: string[];
  flow1Enabled: boolean;
  flow2Enabled: boolean;
  flow3Enabled: boolean;
  flow1Cron: string;
  flow2Cron: string;
  flow3Cron: string;
};

const FLOWS = [
  {
    key: "flow1",
    title: "Flujo 1 — Informe diario",
    desc: "Resumen ejecutivo del pipeline a Google Chat (8:00 am Colombia).",
  },
  {
    key: "flow2",
    title: "Flujo 2 — Alertas de seguimiento",
    desc: "Alertas de leads fríos a Google Chat (varias veces al día).",
  },
  {
    key: "flow3",
    title: "Flujo 3 — Correos de follow-up",
    desc: "Correos automáticos a leads inactivos vía Gmail (9:00 am Colombia).",
  },
] as const;

export function ConfigForm({ initial }: { initial: ConfigShape }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stages, setStages] = useState<Record<string, number>>(
    initial.stageInactivityDays,
  );
  const [dailyEmailLimit, setDailyEmailLimit] = useState(
    initial.dailyEmailLimit,
  );
  const [exclusion, setExclusion] = useState(initial.exclusionList.join(", "));
  const [flags, setFlags] = useState({
    flow1Enabled: initial.flow1Enabled,
    flow2Enabled: initial.flow2Enabled,
    flow3Enabled: initial.flow3Enabled,
  });
  const [crons, setCrons] = useState({
    flow1Cron: initial.flow1Cron,
    flow2Cron: initial.flow2Cron,
    flow3Cron: initial.flow3Cron,
  });

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageInactivityDays: stages,
          dailyEmailLimit,
          exclusionList: exclusion
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          ...flags,
          ...crons,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No pude guardar la configuración");
      }
      setSaved(true);
      startTransition(() => router.refresh());
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-gray-900">
          Días de inactividad por etapa
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuántos días sin movimiento disparan una alerta en cada etapa.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(stages).map(([stage, days]) => (
            <label key={stage} className="block">
              <span className="text-sm font-medium text-gray-700">{stage}</span>
              <Input
                type="number"
                min={1}
                value={days}
                onChange={(e) =>
                  setStages((prev) => ({
                    ...prev,
                    [stage]: Number(e.target.value),
                  }))
                }
                className="mt-1"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-gray-900">Correos</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Límite diario de correos
            </span>
            <Input
              type="number"
              min={0}
              value={dailyEmailLimit}
              onChange={(e) => setDailyEmailLimit(Number(e.target.value))}
              className="mt-1"
            />
          </label>
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-gray-700">
            Lista de exclusión (IDs de HubSpot, separados por coma)
          </span>
          <p className="text-xs text-muted-foreground">
            Clientes actuales o VIP que Charlie nunca debe contactar
            automáticamente.
          </p>
          <textarea
            value={exclusion}
            onChange={(e) => setExclusion(e.target.value)}
            rows={2}
            placeholder="1234567890, 9876543210"
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-gray-900">Flujos de Charlie</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Activa o desactiva cada flujo y ajusta su horario (formato cron, hora
          UTC).
        </p>
        <div className="mt-4 space-y-4">
          {FLOWS.map((flow) => {
            const enabledKey = `${flow.key}Enabled` as keyof typeof flags;
            const cronKey = `${flow.key}Cron` as keyof typeof crons;
            return (
              <div
                key={flow.key}
                className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={flags[enabledKey]}
                    onClick={() =>
                      setFlags((prev) => ({
                        ...prev,
                        [enabledKey]: !prev[enabledKey],
                      }))
                    }
                    className={`mt-0.5 relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      flags[enabledKey] ? "bg-charlie-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        flags[enabledKey] ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {flow.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{flow.desc}</p>
                  </div>
                </div>
                <label className="block sm:w-56">
                  <span className="text-xs font-medium text-gray-600">
                    Horario (cron)
                  </span>
                  <Input
                    value={crons[cronKey]}
                    onChange={(e) =>
                      setCrons((prev) => ({
                        ...prev,
                        [cronKey]: e.target.value,
                      }))
                    }
                    className="mt-1 font-mono text-xs"
                  />
                </label>
              </div>
            );
          })}
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving || isPending} variant="gradient">
          <Save className="h-4 w-4" />
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Guardado
          </span>
        )}
      </div>
    </div>
  );
}
