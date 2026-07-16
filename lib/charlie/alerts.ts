import Anthropic from "@anthropic-ai/sdk";
import { get2026Deals } from "@/lib/integrations/hubspot";
import { postMessage } from "@/lib/integrations/googlechat";
import { prisma } from "@/lib/prisma";
import type { Deal } from "@/lib/types";

const MODEL = process.env.LLM_MODEL || "claude-sonnet-4-6";

// Stages that mean the deal is over — never alert on these
const CLOSED_STAGES = new Set([
  "closed won", "closed lost", "ganado", "perdido",
  "descalificado", "discarded", "cancelado", "cerrado ganado",
  "cerrado perdido", "won", "lost",
]);

function isClosed(stage: string): boolean {
  return CLOSED_STAGES.has(stage.toLowerCase().trim());
}

function fmtCurrency(n: number | null): string {
  if (!n) return "";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function dayLabel(): string {
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return days[new Date().getDay()];
}

function buildDealContext(deals: Deal[]): string {
  return deals
    .map((d) => {
      const valor = d.dealValue ? ` | Valor: ${fmtCurrency(d.dealValue)}` : "";
      const fire = d.daysStale >= 30 ? " 🔥 MÁS DE 30 DÍAS" : "";
      const danger = d.daysStale >= 90 ? " ⚠️ POSIBLEMENTE PERDIDO (+90 días)" : "";
      return `- ${d.name} | Etapa: ${d.stage} | ${d.daysStale} días sin actividad${valor}${fire}${danger}`;
    })
    .join("\n");
}

const CHARLIE_PERSONA = `Eres Charlie, el asistente comercial con personalidad del equipo de ventas de Tita Media.

Tu personalidad:
- Hablas como un compañero de trabajo, no como un sistema.
- Eres cercano, divertido y un poco sarcástico, pero NUNCA ofensivo.
- Usas frases naturales, emojis moderados y haces que leer el mensaje tome menos de un minuto.
- NUNCA escribes como un reporte técnico.
- Tu objetivo no es mostrar datos; tu objetivo es lograr que la persona abra el CRM.
- Eres un poco intenso con el seguimiento porque "el dinero está en el follow up".
- Celebras los logros. Nunca regañas.
- Priorizas y resumes, no pegas listas interminables.
- Siempre terminas con una misión del día.

Reglas:
1. NO incluyas negocios cerrados (Closed Won, Closed Lost, Ganado, Perdido, Descalificado, etc.).
2. Solo muestra máximo 7 oportunidades. Si hay más, menciona cuántas quedaron fuera.
3. Ordena por: más días sin gestión → mayor valor → etapas cercanas al cierre.
4. Si un negocio lleva +30 días sin actividad, márcalo con 🔥.
5. Si lleva +90 días, recomienda decidir si reactivar o cerrar.
6. El mensaje completo debe parecer un mensaje de WhatsApp de un compañero.

Formato del mensaje:
- Saludo personalizado con el nombre (varía por día de semana)
- Resumen ejecutivo (2 frases máximo, con algo de humor)
- Prioridades del día (lista corta, máximo 7)
- Misión del día (una sola acción concreta)
- Frase de cierre divertida

NUNCA escribas listas enormes. NUNCA suenes como una alerta automática.`;

async function generateMessageForOwner(
  ownerName: string,
  deals: Deal[],
): Promise<string> {
  const firstName = ownerName.split(" ")[0];
  const dia = dayLabel();
  const dealContext = buildDealContext(deals);

  const prompt = `Hoy es ${dia}. Estás escribiendo para ${firstName} del equipo comercial de Tita Media.

Estas son las oportunidades de 2026 que llevan más de 7 días sin gestión en el CRM:

${dealContext}

Total de oportunidades con atraso: ${deals.length}

Escribe el mensaje de alerta matutino con TU voz (Charlie).
Saluda a ${firstName} de forma personalizada según el día (${dia}).
Prioriza, resume y termina con una misión del día.
No muestres más de 7 oportunidades. Si hay más, menciona cuántas quedaron fuera.
El mensaje debe sentirse como un WhatsApp de un compañero que ya revisó el CRM por ti.`;

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
  });

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    system: CHARLIE_PERSONA,
    messages: [{ role: "user", content: prompt }],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return text;
}

export interface AlertResult {
  owner: string;
  staleCount: number;
  sent: boolean;
  error?: string;
  message?: string;
}

export async function runStaleAlerts(): Promise<AlertResult[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY no está configurado");
  }
  if (!process.env.GOOGLE_CHAT_WEBHOOK_URL) {
    throw new Error("GOOGLE_CHAT_WEBHOOK_URL no está configurado");
  }

  const allDeals = await get2026Deals();

  // Filter: open deals only, stale 7+ days
  const actionable = allDeals.filter(
    (d) => !isClosed(d.stage) && d.daysStale >= 7,
  );

  if (actionable.length === 0) {
    return [];
  }

  // Group by owner
  const byOwner = actionable.reduce<Record<string, Deal[]>>((acc, d) => {
    const key = d.owner || "Sin asignar";
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  // Sort each owner's deals: most stale → highest value
  for (const deals of Object.values(byOwner)) {
    deals.sort(
      (a, b) =>
        b.daysStale - a.daysStale || (b.dealValue || 0) - (a.dealValue || 0),
    );
  }

  const results: AlertResult[] = [];

  for (const [owner, deals] of Object.entries(byOwner)) {
    let sent = false;
    let error: string | undefined;
    let message = "";

    try {
      message = await generateMessageForOwner(owner, deals);
      await postMessage(message);
      sent = true;
    } catch (err) {
      error = err instanceof Error ? err.message : "Error desconocido";
    }

    await prisma.charlieLog
      .create({
        data: {
          type: "alerta",
          status: sent ? "sent" : "error",
          recipient: owner,
          content: message || error || "",
        },
      })
      .catch(() => {});

    results.push({ owner, staleCount: deals.length, sent, error, message });
  }

  return results;
}
