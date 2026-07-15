import { getConfig, stageConfigOf } from "@/lib/charlie/config";
import { leadStatus } from "@/lib/leads/status";
import { getAllDeals } from "@/lib/integrations/hubspot";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import Link from "next/link";
import { CheckCircle2, XCircle, Bot, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const config = await getConfig();
  const stageConfig = stageConfigOf(config);

  // Fetch HubSpot en tiempo real (con caché de 5 min de Next.js)
  let leads: Awaited<ReturnType<typeof getAllDeals>> = [];
  let hubspotError: string | null = null;

  if (!process.env.HUBSPOT_TOKEN) {
    hubspotError = "no-token";
  } else {
    try {
      leads = await getAllDeals();
    } catch (err) {
      hubspotError = err instanceof Error ? err.message : "Error conectando HubSpot";
    }
  }

  const logs = await prisma.charlieLog
    .findMany({ orderBy: { createdAt: "desc" }, take: 5 })
    .catch(() => []);

  const total = leads.length;
  const totalValue = leads.reduce((s, l) => s + (l.dealValue || 0), 0);

  const byStage = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.stage] = (acc[l.stage] || 0) + 1;
    return acc;
  }, {});

  const byOwner = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.owner] = (acc[l.owner] || 0) + 1;
    return acc;
  }, {});

  const staleCount = leads.filter(
    (l) => leadStatus(l.stage, l.daysStale, stageConfig) === "stale",
  ).length;

  const warningCount = leads.filter(
    (l) => leadStatus(l.stage, l.daysStale, stageConfig) === "warning",
  ).length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          El pulso del pipeline comercial, según Charlie 🤖
        </p>
      </header>

      {hubspotError && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            {hubspotError === "no-token" ? (
              <>
                <p className="font-medium">HubSpot no está conectado</p>
                <p className="mt-0.5 text-amber-700">
                  Agrega la variable <code className="font-mono">HUBSPOT_TOKEN</code> en Vercel para ver los leads del pipeline.
                  Crea un Private App en HubSpot → Settings → Integrations → Private Apps.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">Error al conectar con HubSpot</p>
                <p className="mt-0.5 text-amber-700">{hubspotError}</p>
              </>
            )}
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total de leads"
          value={total}
          sub={formatCurrency(totalValue)}
          trend="flat"
          accent="charlie"
        />
        <StatCard
          label="Etapas activas"
          value={Object.keys(byStage).length}
          sub={`${Object.keys(byOwner).length} dueños comerciales`}
          accent="emerald"
        />
        <StatCard
          label="En alerta"
          value={warningCount}
          sub="Cerca del umbral de inactividad"
          trend={warningCount > 0 ? "down" : "flat"}
          accent="amber"
        />
        <StatCard
          label="Leads fríos"
          value={staleCount}
          sub="Sin movimiento sobre el umbral"
          trend={staleCount > 0 ? "down" : "flat"}
          accent="red"
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Pipeline por etapa
          </h2>
          {Object.keys(byStage).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {hubspotError
                ? "Conecta HubSpot para ver el pipeline."
                : "No hay leads activos."}
            </p>
          ) : (
            <ul className="space-y-3">
              {Object.entries(byStage)
                .sort((a, b) => b[1] - a[1])
                .map(([stage, count]) => {
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <li key={stage}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{stage}</span>
                        <span className="text-muted-foreground">
                          {count} · {pct}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full gradient-charlie"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Pipeline por dueño
          </h2>
          {Object.keys(byOwner).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {hubspotError ? "Conecta HubSpot para ver los dueños." : "Sin datos aún."}
            </p>
          ) : (
            <ul className="divide-y">
              {Object.entries(byOwner)
                .sort((a, b) => b[1] - a[1])
                .map(([owner, count]) => (
                  <li
                    key={owner}
                    className="flex items-center justify-between py-2.5 text-sm"
                  >
                    <span className="font-medium text-gray-700">{owner}</span>
                    <Badge variant="secondary">{count} leads</Badge>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Bot className="h-5 w-5 text-charlie-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Actividad reciente de Charlie
          </h2>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Charlie todavía no ha ejecutado ningún flujo.
          </p>
        ) : (
          <ul className="divide-y">
            {logs.map((log) => (
              <li key={log.id} className="flex items-start gap-3 py-3">
                {log.status === "sent" ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        log.type === "informe"
                          ? "default"
                          : log.type === "alerta"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {log.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-gray-700">
                    {log.content.slice(0, 140)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    → {log.recipient}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
