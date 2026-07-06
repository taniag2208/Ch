import { prisma } from "@/lib/prisma";
import { getDealById } from "@/lib/integrations/hubspot";
import { generateLeadSummary } from "@/lib/charlie/ai";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Mail,
  Phone,
  Building2,
  User,
  Clock,
} from "lucide-react";
import type { DealWithActivities } from "@/lib/types";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  note: "Nota",
  call: "Llamada",
  meeting: "Reunión",
  email: "Correo",
  task: "Tarea",
};

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let deal: DealWithActivities | null = null;
  let liveError: string | null = null;
  try {
    deal = await getDealById(id);
  } catch (err) {
    liveError = err instanceof Error ? err.message : "Error consultando HubSpot";
  }

  // Fall back to the local snapshot if the live call failed.
  const snapshot = await prisma.leadSnapshot.findUnique({
    where: { hubspotId: id },
  });

  if (!deal && !snapshot) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          No encontré este lead ni en HubSpot ni en la caché local.
          {liveError && <p className="mt-2 opacity-80">{liveError}</p>}
        </div>
      </div>
    );
  }

  const name = deal?.name || snapshot?.name || "Lead";
  const stage = deal?.stage || snapshot?.stage || "—";
  const owner = deal?.owner || snapshot?.owner || "—";
  const vertical = deal?.vertical || snapshot?.vertical || null;
  const dealValue = deal?.dealValue ?? snapshot?.dealValue ?? null;
  const company = deal?.company || snapshot?.company || null;
  const email = deal?.email || snapshot?.email || null;
  const phone = deal?.phone || snapshot?.phone || null;

  // Charlie's AI read — only when we have full activity context.
  let summary: string | null = null;
  let summaryError: string | null = null;
  if (deal) {
    try {
      summary = await generateLeadSummary(deal);
    } catch (err) {
      summaryError =
        err instanceof Error ? err.message : "No pude generar el análisis";
    }
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <header className="rounded-2xl border bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge>{stage}</Badge>
              {vertical && <Badge variant="secondary">{vertical}</Badge>}
              <span className="text-sm text-muted-foreground">
                Dueño: <span className="font-medium">{owner}</span>
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Valor del deal
            </p>
            <p className="text-2xl font-bold text-charlie-600">
              {formatCurrency(dealValue)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 border-t pt-5 sm:grid-cols-3">
          <InfoItem icon={Building2} label="Empresa" value={company} />
          <InfoItem icon={Mail} label="Correo" value={email} />
          <InfoItem icon={Phone} label="Teléfono" value={phone} />
        </div>
      </header>

      {liveError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Mostrando datos de la caché local — no pude consultar HubSpot en vivo:{" "}
          {liveError}
        </div>
      )}

      <section className="rounded-2xl border bg-white p-6 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          <Bot className="h-5 w-5 text-charlie-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Lectura de Charlie
          </h2>
        </div>
        {summary ? (
          <div className="whitespace-pre-wrap rounded-xl bg-charlie-50/60 p-4 text-sm leading-relaxed text-gray-800">
            {summary}
          </div>
        ) : summaryError ? (
          <p className="text-sm text-amber-700">{summaryError}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            El análisis de Charlie necesita la actividad en vivo de HubSpot, que
            no está disponible ahora mismo.
          </p>
        )}
      </section>

      {deal && deal.contacts.length > 0 && (
        <section className="rounded-2xl border bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Contactos</h2>
          <ul className="divide-y">
            {deal.contacts.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-charlie-100 text-charlie-700">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.jobTitle ? `${c.jobTitle} · ` : ""}
                    {c.email || "sin correo"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-charlie-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Timeline de actividad
          </h2>
        </div>
        {deal && deal.activities.length > 0 ? (
          <ol className="relative space-y-4 border-l border-gray-200 pl-6">
            {deal.activities.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-charlie-400" />
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{TYPE_LABEL[a.type] || a.type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(a.timestamp)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700">{a.summary}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            {deal
              ? "Este lead aún no tiene actividades registradas en HubSpot."
              : "Timeline no disponible sin la conexión en vivo a HubSpot."}
          </p>
        )}

        {deal && deal.notes.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Notas</h3>
            <ul className="space-y-2">
              {deal.notes.slice(0, 8).map((n, i) => (
                <li
                  key={i}
                  className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700"
                >
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/leads"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-charlie-600"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver a leads
    </Link>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || "—"}</p>
      </div>
    </div>
  );
}
