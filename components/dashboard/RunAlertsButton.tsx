"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, CheckCircle2, XCircle } from "lucide-react";

export function RunAlertsButton() {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [summary, setSummary] = useState("");

  async function run() {
    setState("loading");
    setSummary("");
    try {
      const res = await fetch("/api/charlie/alerts", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        const results = data.results as { owner: string; staleCount: number; sent: boolean }[];
        if (results.length === 0) {
          setSummary("No hay leads con más de 7 días sin actividad. ¡Todo al día!");
        } else {
          const sent = results.filter((r) => r.sent).length;
          setSummary(
            `${sent} mensaje${sent !== 1 ? "s" : ""} enviado${sent !== 1 ? "s" : ""} a Google Chat (${results.map((r) => r.owner.split(" ")[0]).join(", ")})`,
          );
        }
        setState("ok");
      } else {
        setSummary(data.error || "Error desconocido");
        setState("error");
      }
    } catch {
      setSummary("No se pudo conectar con el servidor");
      setState("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={run}
        disabled={state === "loading"}
        variant="outline"
        className="gap-2 border-charlie-200 text-charlie-700 hover:bg-charlie-50"
      >
        {state === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {state === "loading" ? "Enviando alertas..." : "Enviar alertas de seguimiento"}
      </Button>

      {summary && (
        <span className="flex items-center gap-1.5 text-sm">
          {state === "ok" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <span className={state === "ok" ? "text-emerald-700" : "text-red-700"}>
            {summary}
          </span>
        </span>
      )}
    </div>
  );
}
