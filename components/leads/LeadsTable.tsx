"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency, relativeDays } from "@/lib/format";
import {
  leadStatus,
  STATUS_DOT,
  STATUS_ROW,
  STATUS_LABEL,
} from "@/lib/leads/status";
import type { StageConfig } from "@/lib/types";

export type LeadRow = {
  id: string;
  hubspotId: string;
  name: string;
  stage: string;
  owner: string;
  vertical: string | null;
  dealValue: number | null;
  lastActivity: string | null;
  daysStale: number;
  nextAction: string | null;
  company: string | null;
};

type SortKey = "name" | "stage" | "owner" | "daysStale" | "dealValue";

export function LeadsTable({
  leads,
  stageConfig,
}: {
  leads: LeadRow[];
  stageConfig: StageConfig;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vertical, setVertical] = useState("");
  const [owner, setOwner] = useState("");
  const [stage, setStage] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("daysStale");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const verticals = useMemo(
    () => Array.from(new Set(leads.map((l) => l.vertical).filter(Boolean))),
    [leads],
  );
  const owners = useMemo(
    () => Array.from(new Set(leads.map((l) => l.owner))),
    [leads],
  );
  const stages = useMemo(
    () => Array.from(new Set(leads.map((l) => l.stage))),
    [leads],
  );

  const filtered = useMemo(() => {
    const rows = leads.filter(
      (l) =>
        (!vertical || l.vertical === vertical) &&
        (!owner || l.owner === owner) &&
        (!stage || l.stage === stage),
    );
    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "daysStale":
          cmp = a.daysStale - b.daysStale;
          break;
        case "dealValue":
          cmp = (a.dealValue || 0) - (b.dealValue || 0);
          break;
        default:
          cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [leads, vertical, owner, stage, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/refresh", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No pude sincronizar con HubSpot");
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setRefreshing(false);
    }
  }

  const selectClass =
    "h-10 rounded-xl border border-input bg-white px-3 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className={selectClass}
          value={stage}
          onChange={(e) => setStage(e.target.value)}
        >
          <option value="">Todas las etapas</option>
          {stages.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
        >
          <option value="">Todos los dueños</option>
          {owners.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={vertical}
          onChange={(e) => setVertical(e.target.value)}
        >
          <option value="">Todas las verticales</option>
          {verticals.map((v) => (
            <option key={v} value={v as string}>
              {v}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {filtered.length} de {leads.length}
          </span>
          <Button
            onClick={refresh}
            disabled={refreshing || isPending}
            variant="gradient"
          >
            <RefreshCw
              className={cn("h-4 w-4", (refreshing || isPending) && "animate-spin")}
            />
            {refreshing ? "Sincronizando…" : "Actualizar desde HubSpot"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">
                <button
                  className="flex items-center gap-1"
                  onClick={() => toggleSort("name")}
                >
                  Lead <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  className="flex items-center gap-1"
                  onClick={() => toggleSort("stage")}
                >
                  Etapa <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  className="flex items-center gap-1"
                  onClick={() => toggleSort("owner")}
                >
                  Dueño <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3">Vertical</th>
              <th className="px-4 py-3 text-right">
                <button
                  className="ml-auto flex items-center gap-1"
                  onClick={() => toggleSort("dealValue")}
                >
                  Valor <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3">Última actividad</th>
              <th className="px-4 py-3 text-center">
                <button
                  className="mx-auto flex items-center gap-1"
                  onClick={() => toggleSort("daysStale")}
                >
                  Días <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3">Próxima acción</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No hay leads que coincidan. Pulsa “Actualizar desde HubSpot”
                  para sincronizar.
                </td>
              </tr>
            ) : (
              filtered.map((l) => {
                const status = leadStatus(l.stage, l.daysStale, stageConfig);
                return (
                  <tr
                    key={l.id}
                    className={cn("hover:bg-gray-50", STATUS_ROW[status])}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/leads/${l.hubspotId}`}
                        className="flex items-center gap-2 font-medium text-gray-900 hover:text-charlie-600"
                      >
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            STATUS_DOT[status],
                          )}
                          title={STATUS_LABEL[status]}
                        />
                        <span>
                          {l.name}
                          {l.company && (
                            <span className="block text-xs text-muted-foreground">
                              {l.company}
                            </span>
                          )}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{l.stage}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{l.owner}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {l.vertical || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(l.dealValue)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {relativeDays(
                        l.lastActivity ? new Date(l.lastActivity) : null,
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "font-semibold",
                          status === "stale"
                            ? "text-red-600"
                            : status === "warning"
                              ? "text-amber-600"
                              : "text-gray-700",
                        )}
                      >
                        {l.daysStale}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {l.nextAction || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
