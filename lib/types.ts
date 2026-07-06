/** Shared domain types used across integrations, AI, scripts and UI. */

export interface Deal {
  id: string;
  name: string;
  stage: string;
  owner: string;
  vertical: string | null;
  dealValue: number | null;
  lastActivity: Date | null;
  daysStale: number;
  email: string | null;
  phone: string | null;
  company: string | null;
}

export interface Activity {
  id: string;
  type: string; // "note" | "email" | "call" | "meeting" | "task"
  timestamp: Date;
  summary: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
}

export interface DealWithActivities extends Deal {
  activities: Activity[];
  contacts: Contact[];
  notes: string[];
}

export interface Alert {
  hubspotId: string;
  leadName: string;
  owner: string;
  stage: string;
  daysStale: number;
  priority: "alta" | "media" | "baja";
  message: string;
}

export interface StageConfig {
  [stage: string]: number;
}
