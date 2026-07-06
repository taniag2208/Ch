/**
 * Charlie AI — all Claude calls go through here, always wearing Charlie's
 * persona (lib/charlie/persona.ts). Uses the Anthropic TypeScript SDK.
 */
import Anthropic from "@anthropic-ai/sdk";
import {
  CHARLIE_SYSTEM_PROMPT,
  CHARLIE_EMAIL_VOICE,
  CHARLIE_SIGNATURE,
  withSignature,
} from "@/lib/charlie/persona";
import type { Deal, DealWithActivities, Alert } from "@/lib/types";

const MODEL = process.env.LLM_MODEL || "claude-sonnet-4-6";

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurado");
  return new Anthropic({ apiKey });
}

/** Extract concatenated text from a Claude response. */
function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

async function ask(
  userPrompt: string,
  opts: { system?: string; maxTokens?: number } = {},
): Promise<string> {
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 1500,
    system: opts.system ?? CHARLIE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });
  return textOf(res);
}

function fmtCurrency(n: number | null): string {
  if (n == null) return "sin valor";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

function dealLine(d: Deal): string {
  return `- ${d.name} | etapa: ${d.stage} | dueño: ${d.owner} | vertical: ${
    d.vertical || "n/d"
  } | valor: ${fmtCurrency(d.dealValue)} | ${d.daysStale} días sin movimiento`;
}

/** Executive daily report for Google Chat. */
export async function generateDailyReport(deals: Deal[]): Promise<string> {
  if (deals.length === 0) {
    return withSignature(
      "¡Buenas equipo! 👋 Hoy revisé el pipeline y no encontré movimientos ni deals que me preocupen. Día tranquilo — sigan cerrando. 💪",
    );
  }

  const stale = deals.filter((d) => d.daysStale >= 3);
  const totalValue = deals.reduce((s, d) => s + (d.dealValue || 0), 0);

  const prompt = `Prepara el informe diario del pipeline comercial para el equipo de Tita Media, para publicar en Google Chat.

Datos de los deals con actividad reciente o que requieren atención (${deals.length} en total, valor combinado ${fmtCurrency(
    totalValue,
  )}):
${deals.map(dealLine).join("\n")}

${stale.length} de estos llevan 3+ días sin movimiento.

Escribe el informe con TU voz (Charlie): saludo cálido, un resumen ejecutivo de 2-3 frases sobre cómo viene el pipeline, luego una lista corta con lo más importante (deals que se están enfriando, oportunidades grandes, a quién le toca mover ficha). Sé concreto y accionable. Cierra firmando como ${CHARLIE_SIGNATURE}. No inventes datos que no estén arriba.`;

  const out = await ask(prompt, { maxTokens: 1800 });
  return withSignature(out);
}

/** One prioritized alert per stale deal, for Google Chat. */
export async function generateAlerts(staleDeals: Deal[]): Promise<Alert[]> {
  const alerts: Alert[] = [];

  for (const d of staleDeals) {
    const priority: Alert["priority"] =
      d.daysStale >= 10 ? "alta" : d.daysStale >= 5 ? "media" : "baja";

    const prompt = `Genera una alerta de seguimiento para este lead que se está enfriando, para publicar en Google Chat dirigida a su dueño comercial.

Lead: ${d.name}
Etapa: ${d.stage}
Dueño: ${d.owner}
Vertical: ${d.vertical || "n/d"}
Valor: ${fmtCurrency(d.dealValue)}
Días sin movimiento: ${d.daysStale}
Prioridad: ${priority}

Escribe la alerta con TU voz (Charlie): directo, cálido, con un poco de urgencia según la prioridad. Menciona al dueño, cuántos días lleva sin moverse y sugiere UNA acción concreta de seguimiento. Máximo 3-4 frases. Cierra firmando como ${CHARLIE_SIGNATURE}. No suenes a alerta automática genérica.`;

    const message = withSignature(await ask(prompt, { maxTokens: 600 }));

    alerts.push({
      hubspotId: d.id,
      leadName: d.name,
      owner: d.owner,
      stage: d.stage,
      daysStale: d.daysStale,
      priority,
      message,
    });
  }

  // Highest priority first, then most stale.
  const rank = { alta: 0, media: 1, baja: 2 } as const;
  alerts.sort(
    (a, b) => rank[a.priority] - rank[b.priority] || b.daysStale - a.daysStale,
  );
  return alerts;
}

/** Personalized follow-up email (subject + HTML body). */
export async function generateFollowUpEmail(
  deal: Deal,
): Promise<{ subject: string; html: string }> {
  const prompt = `Escribe un correo de seguimiento para reactivar esta oportunidad comercial de Tita Media.

Contacto/empresa: ${deal.company || deal.name}
Nombre del deal: ${deal.name}
Etapa actual: ${deal.stage}
Vertical: ${deal.vertical || "n/d"}
Días sin contacto: ${deal.daysStale}

${CHARLIE_EMAIL_VOICE}

Devuelve EXACTAMENTE este formato, sin nada más:
ASUNTO: <asunto del correo>
CUERPO:
<cuerpo del correo en texto plano, con saltos de línea entre párrafos>`;

  const raw = await ask(prompt, {
    system: `${CHARLIE_SYSTEM_PROMPT}\n\n${CHARLIE_EMAIL_VOICE}`,
    maxTokens: 900,
  });

  let subject = `Retomamos la conversación — Tita Media`;
  let body = raw;

  const subjectMatch = raw.match(/ASUNTO:\s*(.+)/i);
  if (subjectMatch) subject = subjectMatch[1].trim();

  const bodyMatch = raw.match(/CUERPO:\s*([\s\S]+)/i);
  if (bodyMatch) body = bodyMatch[1].trim();

  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f4f4f7;font-family:Inter,Arial,sans-serif;color:#1f2937;">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
      <div style="background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        ${paragraphs}
        <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">Equipo comercial · Tita Media 🚀</p>
      </div>
    </div>
  </body>
</html>`;

  return { subject, html };
}

/** AI summary + recommendation for the Cliente 360 view. */
export async function generateLeadSummary(
  deal: DealWithActivities,
): Promise<string> {
  const timeline = deal.activities
    .slice(0, 15)
    .map(
      (a) =>
        `- [${a.timestamp.toISOString().slice(0, 10)}] ${a.type}: ${a.summary}`,
    )
    .join("\n");

  const prompt = `Analiza este lead y dame tu lectura y recomendación como agente comercial de Tita Media, para mostrar en la ficha del cliente.

Nombre: ${deal.name}
Empresa: ${deal.company || "n/d"}
Etapa: ${deal.stage}
Dueño: ${deal.owner}
Vertical: ${deal.vertical || "n/d"}
Valor: ${fmtCurrency(deal.dealValue)}
Días sin movimiento: ${deal.daysStale}
Contactos: ${deal.contacts.map((c) => `${c.name} (${c.jobTitle || "?"})`).join(", ") || "n/d"}

Timeline reciente:
${timeline || "Sin actividades registradas."}

Escribe con TU voz (Charlie): 1) un resumen breve de en qué va este deal, 2) qué me preocupa o qué está bien, 3) la próxima acción concreta que recomiendo. Máximo 6 frases, directo y útil. Firma como ${CHARLIE_SIGNATURE}.`;

  return withSignature(await ask(prompt, { maxTokens: 900 }));
}
