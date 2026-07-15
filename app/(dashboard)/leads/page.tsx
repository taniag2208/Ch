import { getConfig, stageConfigOf } from "@/lib/charlie/config";
import { getAllDeals } from "@/lib/integrations/hubspot";
import { suggestNextAction } from "@/lib/leads/sync";
import { LeadsTable, type LeadRow } from "@/components/leads/LeadsTable";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const config = await getConfig();
  const stageConfig = stageConfigOf(config);

  let leads: LeadRow[] = [];
  let hubspotError: string | null = null;

  if (!process.env.HUBSPOT_TOKEN) {
    hubspotError = "no-token";
  } else {
    try {
      const deals = await getAllDeals();
      leads = deals.map((d) => ({
        id: d.id,
        hubspotId: d.id,
        name: d.name,
        stage: d.stage,
        owner: d.owner,
        vertical: d.vertical,
        dealValue: d.dealValue,
        lastActivity: d.lastActivity ? d.lastActivity.toISOString() : null,
        daysStale: d.daysStale,
        nextAction: suggestNextAction(d, stageConfig),
        company: d.company,
      }));
    } catch (err) {
      hubspotError = err instanceof Error ? err.message : "Error conectando HubSpot";
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Leads
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pipeline en tiempo real desde HubSpot · Verde = activo · Amarillo = ojo · Rojo = frío
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
                  Agrega <code className="font-mono">HUBSPOT_TOKEN</code> en Vercel.
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

      <LeadsTable leads={leads} stageConfig={stageConfig} />
    </div>
  );
}
