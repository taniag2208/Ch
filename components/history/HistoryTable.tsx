"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type LogRow = {
  id: string;
  type: string;
  recipient: string;
  content: string;
  status: string;
  error: string | null;
  createdAt: string;
};

export function HistoryTable({ logs }: { logs: LogRow[] }) {
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (type && l.type !== type) return false;
      const t = new Date(l.createdAt).getTime();
      if (from && t < new Date(from).getTime()) return false;
      if (to && t > new Date(to).getTime() + 24 * 60 * 60 * 1000) return false;
      return true;
    });
  }, [logs, type, from, to]);

  const selectClass =
    "h-10 rounded-xl border border-input bg-white px-3 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-xs font-medium text-gray-600">Tipo</span>
          <select
            className={cn(selectClass, "mt-1 block")}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="informe">Informe</option>
            <option value="alerta">Alerta</option>
            <option value="email">Email</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">Desde</span>
          <input
            type="date"
            className={cn(selectClass, "mt-1 block")}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">Hasta</span>
          <input
            type="date"
            className={cn(selectClass, "mt-1 block")}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} de {logs.length} registros
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-soft">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Destinatario</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Contenido</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No hay registros que coincidan.
                </td>
              </tr>
            ) : (
              filtered.map((log) => {
                const open = expanded === log.id;
                return (
                  <>
                    <tr
                      key={log.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpanded(open ? null : log.id)}
                    >
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            log.type === "informe"
                              ? "default"
                              : log.type === "alerta"
                                ? "warning"
                                : "secondary"
                          }
                        >
                          {log.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {log.recipient}
                      </td>
                      <td className="px-4 py-3">
                        {log.status === "sent" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" /> Enviado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" /> Falló
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(new Date(log.createdAt))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="max-w-xs truncate text-gray-600">
                            {log.content.slice(0, 80)}
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 shrink-0 text-gray-400 transition-transform",
                              open && "rotate-180",
                            )}
                          />
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr key={`${log.id}-detail`} className="bg-gray-50/60">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="whitespace-pre-wrap rounded-xl bg-white p-4 text-sm text-gray-700 shadow-soft">
                            {log.content}
                          </div>
                          {log.error && (
                            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                              Error: {log.error}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
