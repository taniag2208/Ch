"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, AlertCircle, Play } from "lucide-react";
import type { IntentParameters, IntentType } from "@/types";

interface ActionConfirmationProps {
  intent: IntentType;
  parameters: IntentParameters;
  status: "pending" | "executing" | "success" | "error" | null;
  onExecute: () => void;
}

const friendlyKeys: Record<string, string> = {
  recipient: "Para",
  subject: "Asunto",
  body: "Mensaje",
  cc: "CC",
  title: "Título",
  description: "Descripción",
  assignee: "Asignado a",
  project: "Proyecto",
  due_date: "Vencimiento",
  message: "Mensaje",
  date: "Fecha",
  time: "Hora",
  duration: "Duración",
  attendees: "Invitados",
  location: "Lugar",
};

const intentLabels: Record<IntentType, string> = {
  send_email: "Enviar email",
  create_task: "Crear tarea",
  create_reminder: "Crear recordatorio",
  create_calendar_event: "Agendar evento",
  summarize_today: "Resumir el día",
  general_response: "Responder",
};

function renderValue(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ");
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function ActionConfirmation({
  intent,
  parameters,
  status,
  onExecute,
}: ActionConfirmationProps) {
  const entries = Object.entries(parameters).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );

  return (
    <Card className="w-full max-w-md p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{intentLabels[intent]}</span>
          {status === "success" && (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" /> Ejecutada
            </Badge>
          )}
          {status === "error" && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" /> Error
            </Badge>
          )}
          {status === "executing" && (
            <Badge variant="warning" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Ejecutando
            </Badge>
          )}
          {(status === "pending" || status === null) && (
            <Badge variant="secondary">Pendiente</Badge>
          )}
        </div>
      </div>

      {entries.length > 0 ? (
        <dl className="mb-3 space-y-1.5 rounded-xl bg-secondary/50 p-3">
          {entries.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[110px_1fr] gap-2 text-xs">
              <dt className="font-medium text-muted-foreground">
                {friendlyKeys[k] ?? k}
              </dt>
              <dd className="break-words text-foreground">{renderValue(v)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mb-3 text-xs text-muted-foreground">
          Sin parámetros adicionales.
        </p>
      )}

      {(status === "pending" || status === null) && (
        <Button
          onClick={onExecute}
          variant="gradient"
          size="sm"
          className="w-full"
        >
          <Play className="h-3.5 w-3.5" /> Confirmar y ejecutar
        </Button>
      )}
    </Card>
  );
}
