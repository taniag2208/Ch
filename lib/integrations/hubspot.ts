/**
 * HubSpot integration — direct REST API v3 calls (no MCP).
 * Uses a private app token from HUBSPOT_TOKEN.
 */
import { unstable_cache } from "next/cache";
import type { Deal, DealWithActivities, Activity, Contact, StageConfig } from "@/lib/types";

const HUBSPOT_BASE = "https://api.hubapi.com";

function token(): string {
  const t = process.env.HUBSPOT_TOKEN;
  if (!t) throw new Error("HUBSPOT_TOKEN no está configurado");
  return t;
}

async function hsFetch<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${HUBSPOT_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    // Never cache CRM data
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HubSpot ${res.status} en ${path}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

const DEAL_PROPERTIES = [
  "dealname",
  "dealstage",
  "pipeline",
  "amount",
  "hubspot_owner_id",
  "notes_last_updated",
  "hs_lastmodifieddate",
  "closedate",
  "vertical",
  "industry",
  "createdate",
];

/** Cache for owner-id -> name and stage-id -> label resolution. */
let ownerCache: Record<string, string> | null = null;
let stageCache: Record<string, string> | null = null;

async function getOwnerMap(): Promise<Record<string, string>> {
  if (ownerCache) return ownerCache;
  const map: Record<string, string> = {};
  try {
    const data = await hsFetch<{ results: any[] }>("/crm/v3/owners?limit=100");
    for (const o of data.results || []) {
      const name = [o.firstName, o.lastName].filter(Boolean).join(" ").trim();
      map[o.id] = name || o.email || `Owner ${o.id}`;
    }
  } catch {
    // Owners endpoint may be restricted; fall back to raw ids.
  }
  ownerCache = map;
  return map;
}

async function getStageMap(): Promise<Record<string, string>> {
  if (stageCache) return stageCache;
  const map: Record<string, string> = {};
  try {
    const data = await hsFetch<{ results: any[] }>(
      "/crm/v3/pipelines/deals",
    );
    for (const pipeline of data.results || []) {
      for (const stage of pipeline.stages || []) {
        map[stage.id] = stage.label;
      }
    }
  } catch {
    // ignore, use raw ids
  }
  stageCache = map;
  return map;
}

function daysBetween(from: Date | null, to: Date = new Date()): number {
  if (!from) return 0;
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

async function mapDeal(raw: any): Promise<Deal> {
  const [owners, stages] = await Promise.all([getOwnerMap(), getStageMap()]);
  const p = raw.properties || {};
  const lastActivityRaw =
    p.notes_last_updated || p.hs_lastmodifieddate || p.createdate;
  const lastActivity = lastActivityRaw ? new Date(lastActivityRaw) : null;
  return {
    id: raw.id,
    name: p.dealname || `Deal ${raw.id}`,
    stage: stages[p.dealstage] || p.dealstage || "Sin etapa",
    owner: owners[p.hubspot_owner_id] || p.hubspot_owner_id || "Sin asignar",
    vertical: p.vertical || p.industry || null,
    dealValue: p.amount ? Number(p.amount) : null,
    lastActivity,
    daysStale: daysBetween(lastActivity),
    email: null,
    phone: null,
    company: null,
  };
}

/** Fetch deals modified in the last N days. */
export async function getRecentDeals(days: number): Promise<Deal[]> {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const data = await hsFetch<{ results: any[] }>(
    "/crm/v3/objects/deals/search",
    {
      method: "POST",
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "hs_lastmodifieddate",
                operator: "GTE",
                value: String(since),
              },
            ],
          },
        ],
        properties: DEAL_PROPERTIES,
        sorts: [{ propertyName: "hs_lastmodifieddate", direction: "DESCENDING" }],
        limit: 100,
      }),
    },
  );
  return Promise.all((data.results || []).map(mapDeal));
}

/**
 * Fetch stale deals: for each configured stage, deals in that stage whose last
 * activity exceeds the configured inactivity threshold (in days).
 */
export async function getStaleDeals(stageConfig: StageConfig): Promise<Deal[]> {
  // Pull all open deals, then filter in memory against the per-stage thresholds.
  const all = await getAllDeals();
  const out: Deal[] = [];
  for (const deal of all) {
    const threshold = stageConfig[deal.stage];
    if (threshold == null) continue; // stage not monitored
    if (deal.daysStale >= threshold) out.push(deal);
  }
  return out.sort((a, b) => b.daysStale - a.daysStale);
}

/** Fetch all deals (paginated) — cached 5 min so HubSpot isn't hit on every click. */
export const getAllDeals = unstable_cache(
  async (): Promise<Deal[]> => _getAllDeals(),
  ["hubspot-deals"],
  { revalidate: 300 },
);

async function _getAllDeals(): Promise<Deal[]> {
  const deals: any[] = [];
  let after: string | undefined;
  do {
    const params = new URLSearchParams({
      limit: "100",
      properties: DEAL_PROPERTIES.join(","),
      archived: "false",
    });
    if (after) params.set("after", after);
    const data = await hsFetch<{ results: any[]; paging?: any }>(
      `/crm/v3/objects/deals?${params.toString()}`,
    );
    deals.push(...(data.results || []));
    after = data.paging?.next?.after;
  } while (after && deals.length < 1000);

  return Promise.all(deals.map(mapDeal));
}

async function getAssociations(
  dealId: string,
  toObject: string,
): Promise<string[]> {
  try {
    const data = await hsFetch<{ results: any[] }>(
      `/crm/v3/objects/deals/${dealId}/associations/${toObject}?limit=100`,
    );
    return (data.results || []).map((r: any) => r.toObjectId || r.id);
  } catch {
    return [];
  }
}

/** Full deal with contacts, notes and activity timeline for Cliente 360. */
export async function getDealById(id: string): Promise<DealWithActivities> {
  const raw = await hsFetch<any>(
    `/crm/v3/objects/deals/${id}?properties=${DEAL_PROPERTIES.join(",")}`,
  );
  const base = await mapDeal(raw);

  // Contacts
  const contactIds = await getAssociations(id, "contacts");
  const contacts: Contact[] = [];
  for (const cid of contactIds.slice(0, 10)) {
    try {
      const c = await hsFetch<any>(
        `/crm/v3/objects/contacts/${cid}?properties=firstname,lastname,email,phone,jobtitle`,
      );
      const cp = c.properties || {};
      contacts.push({
        id: c.id,
        name:
          [cp.firstname, cp.lastname].filter(Boolean).join(" ").trim() ||
          cp.email ||
          "Contacto",
        email: cp.email || null,
        phone: cp.phone || null,
        jobTitle: cp.jobtitle || null,
      });
    } catch {
      /* skip */
    }
  }
  if (contacts[0]) {
    base.email = contacts[0].email;
    base.phone = contacts[0].phone;
  }

  // Notes + engagements => timeline
  const activities: Activity[] = [];
  const notes: string[] = [];
  const noteIds = await getAssociations(id, "notes");
  for (const nid of noteIds.slice(0, 25)) {
    try {
      const n = await hsFetch<any>(
        `/crm/v3/objects/notes/${nid}?properties=hs_note_body,hs_timestamp`,
      );
      const body = (n.properties?.hs_note_body || "").replace(/<[^>]+>/g, "");
      if (body) {
        notes.push(body);
        activities.push({
          id: n.id,
          type: "note",
          timestamp: new Date(n.properties?.hs_timestamp || Date.now()),
          summary: body.slice(0, 240),
        });
      }
    } catch {
      /* skip */
    }
  }

  for (const [obj, label] of [
    ["calls", "call"],
    ["meetings", "meeting"],
    ["emails", "email"],
    ["tasks", "task"],
  ] as const) {
    const ids = await getAssociations(id, obj);
    for (const eid of ids.slice(0, 10)) {
      try {
        const e = await hsFetch<any>(
          `/crm/v3/objects/${obj}/${eid}?properties=hs_timestamp,hs_call_title,hs_meeting_title,hs_email_subject,hs_task_subject,hs_call_body`,
        );
        const ep = e.properties || {};
        const summary =
          ep.hs_call_title ||
          ep.hs_meeting_title ||
          ep.hs_email_subject ||
          ep.hs_task_subject ||
          ep.hs_call_body ||
          label;
        activities.push({
          id: e.id,
          type: label,
          timestamp: new Date(ep.hs_timestamp || Date.now()),
          summary: String(summary).replace(/<[^>]+>/g, "").slice(0, 240),
        });
      } catch {
        /* skip */
      }
    }
  }

  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return { ...base, activities, contacts, notes };
}

/** Create a note on a deal to log a Charlie action. */
export async function createNote(
  dealId: string,
  content: string,
): Promise<void> {
  const note = await hsFetch<any>("/crm/v3/objects/notes", {
    method: "POST",
    body: JSON.stringify({
      properties: {
        hs_note_body: content,
        hs_timestamp: String(Date.now()),
      },
    }),
  });
  // Associate note -> deal (association type 214 = note_to_deal)
  await hsFetch(
    `/crm/v4/objects/notes/${note.id}/associations/default/deals/${dealId}`,
    { method: "PUT" },
  ).catch(() => {
    /* association is best-effort */
  });
}
