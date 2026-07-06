/**
 * Flow 1 — Informe Diario.
 * Fetches recent + stale deals, has Charlie write an executive report, posts it
 * to Google Chat, and logs the result.
 *
 * Run by .github/workflows/flow1-daily-report.yml
 */
import { PrismaClient } from "@prisma/client";
import { getRecentDeals, getStaleDeals } from "../lib/integrations/hubspot";
import { postMessage } from "../lib/integrations/googlechat";
import { generateDailyReport } from "../lib/charlie/ai";
import type { Deal } from "../lib/types";

const prisma = new PrismaClient();

async function main() {
  const config =
    (await prisma.charlieConfig.findFirst({ orderBy: { createdAt: "asc" } })) ??
    (await prisma.charlieConfig.create({ data: {} }));

  if (!config.flow1Enabled) {
    console.log("Flujo 1 desactivado en la configuración. Saliendo.");
    return;
  }

  const stageConfig = (config.stageInactivityDays as Record<string, number>) || {};

  // Recent activity (last 24h) + stale deals, de-duplicated by id.
  const [recent, stale] = await Promise.all([
    getRecentDeals(1),
    getStaleDeals(stageConfig),
  ]);
  const seen = new Set<string>();
  const deals: Deal[] = [];
  for (const d of [...recent, ...stale]) {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      deals.push(d);
    }
  }

  const report = await generateDailyReport(deals);

  let status: "sent" | "failed" = "sent";
  let error: string | null = null;
  try {
    await postMessage(report);
    console.log("Informe publicado en Google Chat.");
  } catch (err) {
    status = "failed";
    error = err instanceof Error ? err.message : String(err);
    console.error("Fallo publicando el informe:", error);
  }

  await prisma.charlieLog.create({
    data: {
      type: "informe",
      recipient: "Google Chat · equipo comercial",
      content: report,
      status,
      error,
      metadata: { dealsAnalizados: deals.length } as never,
    },
  });
}

main()
  .catch((err) => {
    console.error("Error fatal en flow1:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
