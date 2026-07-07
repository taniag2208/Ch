import type { StageConfig } from "@/lib/types";

export type LeadStatus = "active" | "warning" | "stale";

/** Determine the traffic-light status of a lead against the stage thresholds. */
export function leadStatus(
  stage: string,
  daysStale: number,
  stageConfig: StageConfig,
): LeadStatus {
  const threshold = stageConfig[stage];
  if (threshold == null) {
    // Stage not monitored — fall back to a generic scale.
    if (daysStale >= 10) return "stale";
    if (daysStale >= 5) return "warning";
    return "active";
  }
  if (daysStale >= threshold) return "stale";
  if (daysStale >= Math.ceil(threshold * 0.6)) return "warning";
  return "active";
}

export const STATUS_LABEL: Record<LeadStatus, string> = {
  active: "Activo",
  warning: "Ojo",
  stale: "Frío",
};

export const STATUS_DOT: Record<LeadStatus, string> = {
  active: "bg-emerald-500",
  warning: "bg-amber-500",
  stale: "bg-red-500",
};

export const STATUS_ROW: Record<LeadStatus, string> = {
  active: "",
  warning: "bg-amber-50/40",
  stale: "bg-red-50/40",
};
