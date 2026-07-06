import { getConfig, stageConfigOf } from "@/lib/charlie/config";
import { ConfigForm, type ConfigShape } from "@/components/config/ConfigForm";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const config = await getConfig();

  const initial: ConfigShape = {
    stageInactivityDays: stageConfigOf(config),
    dailyEmailLimit: config.dailyEmailLimit,
    exclusionList: config.exclusionList,
    flow1Enabled: config.flow1Enabled,
    flow2Enabled: config.flow2Enabled,
    flow3Enabled: config.flow3Enabled,
    flow1Cron: config.flow1Cron,
    flow2Cron: config.flow2Cron,
    flow3Cron: config.flow3Cron,
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Configuración de Charlie
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define cuándo y cómo trabaja Charlie por ti.
        </p>
      </header>

      <ConfigForm initial={initial} />
    </div>
  );
}
