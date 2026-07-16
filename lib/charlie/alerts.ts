import { get2026Deals } from "@/lib/integrations/hubspot";
import { postMessage } from "@/lib/integrations/googlechat";
import { prisma } from "@/lib/prisma";
import type { Deal } from "@/lib/types";

const STALE_DAYS = 7;

function firstName(fullName: string): string {
  return fullName.split(" ")[0] || fullName;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

function buildMessage(owner: string, deals: Deal[]): string {
  const saludo = greeting();
  const nombre = firstName(owner);
  const lines: string[] = [];

  lines.push(`${saludo}, ${nombre} 👋`);
  lines.push("");
  lines.push(
    `Estos negocios (2026) llevan más de ${STALE_DAYS} días sin gestión en el CRM y necesitan tu atención:`,
  );
  lines.push("");

  for (const d of deals) {
    const dias = d.daysStale;
    const valor = d.dealValue
      ? ` · $${d.dealValue.toLocaleString("es-CO")}`
      : "";
    lines.push(`🔴 *${d.name}* — ${dias} días sin actividad · Etapa: ${d.stage}${valor}`);
  }

  lines.push("");
  lines.push(
    "Un pequeño seguimiento hoy puede marcar la diferencia. ¡Tú puedes! 💪",
  );

  return lines.join("\n");
}

export interface AlertResult {
  owner: string;
  staleCount: number;
  sent: boolean;
  error?: string;
}

export async function runStaleAlerts(): Promise<AlertResult[]> {
  const deals = await get2026Deals();

  // Keep only deals stale >= STALE_DAYS
  const stale = deals.filter((d) => d.daysStale >= STALE_DAYS);

  if (stale.length === 0) {
    return [];
  }

  // Group by owner
  const byOwner = stale.reduce<Record<string, Deal[]>>((acc, d) => {
    const key = d.owner || "Sin asignar";
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  const results: AlertResult[] = [];

  for (const [owner, ownerDeals] of Object.entries(byOwner)) {
    const message = buildMessage(owner, ownerDeals);
    let sent = false;
    let error: string | undefined;

    try {
      await postMessage(message);
      sent = true;
    } catch (err) {
      error = err instanceof Error ? err.message : "Error enviando mensaje";
    }

    // Log to DB
    await prisma.charlieLog
      .create({
        data: {
          type: "alerta",
          status: sent ? "sent" : "error",
          recipient: owner,
          content: message,
        },
      })
      .catch(() => {});

    results.push({ owner, staleCount: ownerDeals.length, sent, error });
  }

  return results;
}
