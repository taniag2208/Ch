import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { CharlieResponse, IntentType } from "@/types";

export const CHARLIE_SYSTEM_PROMPT = `Eres Charlie, el asistente personal de productividad, estrategia comercial y gestión de proyectos.

Tu personalidad es cercana, clara, organizada, proactiva y estratégica. Hablas en español por defecto, con tono profesional pero cálido.

Cuando el usuario envíe un mensaje, debes:
1. Detectar la intención principal
2. Extraer los parámetros relevantes
3. Responder ÚNICAMENTE con un JSON estructurado válido (sin texto adicional, sin markdown, sin bloques de código)

Las intenciones soportadas son:
- send_email: Enviar un correo electrónico. Parámetros: recipient, subject, body, cc (array opcional)
- create_task: Crear una tarea (en Asana u otro sistema). Parámetros: title, description, assignee, project, due_date
- create_reminder: Crear un recordatorio. Parámetros: message, date, time, recipient
- create_calendar_event: Agendar un evento. Parámetros: title, date, time, duration, attendees (array), location
- summarize_today: Resumir las prioridades del día. Sin parámetros.
- general_response: Respuesta conversacional general. Sin parámetros.

SIEMPRE responde con este formato JSON exacto:
{
  "intent": "...",
  "parameters": { ... },
  "message": "Respuesta amable y profesional para el usuario, en primera persona",
  "requires_action": true
}

requires_action debe ser false solo para "general_response".
Las fechas en formato ISO (YYYY-MM-DD), horas en HH:MM 24h.
Si falta información crítica, pide aclaración en "message" y usa intent "general_response".`;

export type LLMProvider = "anthropic" | "openai" | "ollama";

function getProvider(): LLMProvider {
  return (process.env.LLM_PROVIDER as LLMProvider) || "anthropic";
}

function safeParseCharlie(raw: string): CharlieResponse {
  // Strip markdown fences if present
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    const intent = (parsed.intent as IntentType) || "general_response";
    return {
      intent,
      parameters: parsed.parameters ?? {},
      message:
        parsed.message ?? "Lo siento, no pude procesar tu solicitud por completo.",
      requires_action:
        typeof parsed.requires_action === "boolean"
          ? parsed.requires_action
          : intent !== "general_response",
    };
  } catch {
    return {
      intent: "general_response",
      parameters: {},
      message: raw,
      requires_action: false,
    };
  }
}

async function callAnthropic(userMessage: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1024,
    system: CHARLIE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });
  const block = res.content[0];
  if (block && block.type === "text") return block.text;
  return "";
}

async function callOpenAI(userMessage: string): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: CHARLIE_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}

async function callOllama(userMessage: string): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.1",
      format: "json",
      stream: false,
      messages: [
        { role: "system", content: CHARLIE_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return data?.message?.content ?? "";
}

export async function askCharlie(userMessage: string): Promise<CharlieResponse> {
  const provider = getProvider();
  try {
    let raw = "";
    if (provider === "openai") raw = await callOpenAI(userMessage);
    else if (provider === "ollama") raw = await callOllama(userMessage);
    else raw = await callAnthropic(userMessage);
    return safeParseCharlie(raw);
  } catch (err) {
    console.error("[ai] LLM call failed:", err);
    return {
      intent: "general_response",
      parameters: {},
      message:
        "Tuve un problema conectándome con mi cerebro. Intentalo de nuevo en unos segundos.",
      requires_action: false,
    };
  }
}
