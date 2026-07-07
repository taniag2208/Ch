/**
 * Flow 2 — Alertas de Seguimiento.
 * Finds stale deals per stage thresholds, filters the exclusion list, has
 * Charlie write one prioritized alert per lead, posts each to Google Chat, and
 * logs the result.
 *
 * Run by .github/workflows/flow2-alerts.yml
 */
import { PrismaClient } from "@prisma/client";
import { getStaleDeals } from "../lib/integrations/hubspot";
import { postMessage } from "../lib/integrations/googlechat";
import { generateAlerts } from "../lib/charlie/ai";

const prisma = new PrismaClient();

async function main() {
  const config =
    (await prisma.charlieConfig.findFirst({ orderBy: { createdAt: "asc" } })) ??
    (await prisma.charlieConfig.create({ data: {} }));

  if (!config.flow2Enabled) {
    console.log("Flujo 2 desactivado en la configuración. Saliendo.");
    return;
  }

  const stageConfig = (config.stageInactivityDays as Record<string, number>) || {};
  const exclusion = new Set(config.exclusionList);

  const stale = (await getStaleDeals(stageConfig)).filter(
    (d) => !exclusion.has(d.id),
  );

  if (stale.length === 0) {
    console.log("No hay leads fríos que alertar. Saliendo.");
    return;
  }

  const alerts = await generateAlerts(stale);

  for (const alert of alerts) {
    let status: "sent" | "failed" = "sent";
    let error: string | null = null;
    try {
      await postMessage(alert.message);
      console.log(`Alerta enviada para ${alert.leadName} (${alert.priority}).`);
    } catch (err) {
      status = "failed";
      error = err instanceof Error ? err.message : String(err);
      console.error(`Fallo enviando alerta de ${alert.leadName}:`, error);
    }

    await prisma.charlieLog.create({
      data: {
        type: "alerta",
        recipient: `Google Chat · ${alert.owner}`,
        content: alert.message,
        status,
        error,
        metadata: {
          hubspotId: alert.hubspotId,
          prioridad: alert.priority,
          diasSinMovimiento: alert.daysStale,
        } as never,
      },
    });
  }
}

main()
  .catch((err) => {
    console.error("Error fatal en flow2:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
