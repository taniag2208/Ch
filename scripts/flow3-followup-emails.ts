/**
 * Flow 3 — Follow-up Emails.
 * Finds stale leads (minus the exclusion list), respects the daily email limit,
 * has Charlie draft a personalized email per lead, sends it via Gmail, logs a
 * note back on the HubSpot deal, and records the result.
 *
 * Run by .github/workflows/flow3-followup-emails.yml
 */
import { PrismaClient } from "@prisma/client";
import { getStaleDeals, createNote } from "../lib/integrations/hubspot";
import { sendEmail } from "../lib/integrations/gmail";
import { generateFollowUpEmail } from "../lib/charlie/ai";
import { CHARLIE_SIGNATURE } from "../lib/charlie/persona";

const prisma = new PrismaClient();

async function main() {
  const config =
    (await prisma.charlieConfig.findFirst({ orderBy: { createdAt: "asc" } })) ??
    (await prisma.charlieConfig.create({ data: {} }));

  if (!config.flow3Enabled) {
    console.log("Flujo 3 desactivado en la configuración. Saliendo.");
    return;
  }

  const stageConfig = (config.stageInactivityDays as Record<string, number>) || {};
  const exclusion = new Set(config.exclusionList);

  // How many emails Charlie already sent today?
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const sentToday = await prisma.charlieLog.count({
    where: {
      type: "email",
      status: "sent",
      createdAt: { gte: startOfDay },
    },
  });

  const remaining = config.dailyEmailLimit - sentToday;
  if (remaining <= 0) {
    console.log(
      `Límite diario de correos alcanzado (${config.dailyEmailLimit}). Saliendo.`,
    );
    return;
  }

  const stale = (await getStaleDeals(stageConfig))
    .filter((d) => !exclusion.has(d.id))
    .filter((d) => d.email); // need an address to write to

  const eligible = stale.slice(0, remaining);
  if (eligible.length === 0) {
    console.log("No hay leads elegibles con correo. Saliendo.");
    return;
  }

  for (const deal of eligible) {
    const to = deal.email as string;
    let status: "sent" | "failed" = "sent";
    let error: string | null = null;
    let content = "";

    try {
      const { subject, html } = await generateFollowUpEmail(deal);
      content = `ASUNTO: ${subject}\n\n${html}`;
      await sendEmail(to, subject, html);
      console.log(`Correo enviado a ${to} (${deal.name}).`);

      // Log the action back on the HubSpot deal (best-effort).
      try {
        await createNote(
          deal.id,
          `${CHARLIE_SIGNATURE} envió un correo de seguimiento automático a ${to}.\nAsunto: ${subject}`,
        );
      } catch (noteErr) {
        console.error("No pude crear la nota en HubSpot:", noteErr);
      }
    } catch (err) {
      status = "failed";
      error = err instanceof Error ? err.message : String(err);
      console.error(`Fallo enviando correo a ${to}:`, error);
    }

    await prisma.charlieLog.create({
      data: {
        type: "email",
        recipient: to,
        content: content || `Correo de seguimiento para ${deal.name}`,
        status,
        error,
        metadata: {
          hubspotId: deal.id,
          lead: deal.name,
          diasSinMovimiento: deal.daysStale,
        } as never,
      },
    });
  }
}

main()
  .catch((err) => {
    console.error("Error fatal en flow3:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
