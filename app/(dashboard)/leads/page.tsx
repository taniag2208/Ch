import { prisma } from "@/lib/prisma";
import { getConfig, stageConfigOf } from "@/lib/charlie/config";
import { LeadsTable, type LeadRow } from "@/components/leads/LeadsTable";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const [snapshots, config] = await Promise.all([
    prisma.leadSnapshot.findMany({ orderBy: { daysStale: "desc" } }),
    getConfig(),
  ]);

  const leads: LeadRow[] = snapshots.map((l) => ({
    id: l.id,
    hubspotId: l.hubspotId,
    name: l.name,
    stage: l.stage,
    owner: l.owner,
    vertical: l.vertical,
    dealValue: l.dealValue,
    lastActivity: l.lastActivity ? l.lastActivity.toISOString() : null,
    daysStale: l.daysStale,
    nextAction: l.nextAction,
    company: l.company,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Leads
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Caché local del pipeline de HubSpot. Verde = activo · Amarillo = ojo ·
          Rojo = frío.
        </p>
      </header>

      <LeadsTable leads={leads} stageConfig={stageConfigOf(config)} />
    </div>
  );
}
