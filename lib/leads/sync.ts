import { prisma } from "@/lib/prisma";
import { getAllDeals } from "@/lib/integrations/hubspot";
import { getConfig, stageConfigOf } from "@/lib/charlie/config";
import type { Deal, StageConfig } from "@/lib/types";

/** Suggest a next action based on stage and how stale the deal is. */
export function suggestNextAction(deal: Deal, stageConfig: StageConfig): string {
  const threshold = stageConfig[deal.stage];
  const stale = threshold != null && deal.daysStale >= threshold;

  if (!stale) {
    switch (deal.stage) {
      case "Prospecto":
        return "Calificar y agendar primer contacto";
      case "Demo":
        return "Confirmar asistencia a la demo";
      case "Propuesta":
        return "Dar seguimiento a la propuesta enviada";
      case "Negociación":
        return "Cerrar condiciones y siguiente reunión";
      default:
        return "Mantener el ritmo de seguimiento";
    }
  }

  if (deal.daysStale >= 10) return "Llamar hoy — lleva demasiado sin movimiento";
  return `Retomar contacto (${deal.daysStale} días sin actividad)`;
}

/**
 * Pull all deals from HubSpot and upsert them into LeadSnapshot (local cache).
 * Returns the number of leads synced.
 */
export async function syncLeadSnapshots(): Promise<number> {
  const config = await getConfig();
  const stageConfig = stageConfigOf(config);
  const deals = await getAllDeals();

  for (const deal of deals) {
    const nextAction = suggestNextAction(deal, stageConfig);
    await prisma.leadSnapshot.upsert({
      where: { hubspotId: deal.id },
      create: {
        id: deal.id,
        hubspotId: deal.id,
        name: deal.name,
        stage: deal.stage,
        owner: deal.owner,
        vertical: deal.vertical,
        dealValue: deal.dealValue,
        lastActivity: deal.lastActivity,
        daysStale: deal.daysStale,
        nextAction,
        email: deal.email,
        phone: deal.phone,
        company: deal.company,
      },
      update: {
        name: deal.name,
        stage: deal.stage,
        owner: deal.owner,
        vertical: deal.vertical,
        dealValue: deal.dealValue,
        lastActivity: deal.lastActivity,
        daysStale: deal.daysStale,
        nextAction,
        email: deal.email,
        phone: deal.phone,
        company: deal.company,
      },
    });
  }

  return deals.length;
}
