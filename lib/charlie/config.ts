import { prisma } from "@/lib/prisma";
import type { CharlieConfig } from "@prisma/client";
import type { StageConfig } from "@/lib/types";

/** Fetch the singleton CharlieConfig, creating defaults on first run. */
export async function getConfig(): Promise<CharlieConfig> {
  const existing = await prisma.charlieConfig.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;
  return prisma.charlieConfig.create({ data: {} });
}

/** Parse the JSON stageInactivityDays column into a typed record. */
export function stageConfigOf(config: CharlieConfig): StageConfig {
  const raw = config.stageInactivityDays as unknown;
  if (raw && typeof raw === "object") {
    return raw as StageConfig;
  }
  return { Prospecto: 3, Propuesta: 5, "Negociación": 7, Demo: 4 };
}
