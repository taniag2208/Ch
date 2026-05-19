import type { IntentParameters, IntentType } from "@/types";

export interface N8nPayload {
  intent: IntentType;
  parameters: IntentParameters;
  user_id: string;
  message_id?: string;
  timestamp: string;
}

export interface N8nResult {
  status: "success" | "error";
  result?: Record<string, unknown>;
  error?: string;
}

export async function triggerN8nWorkflow(
  payload: N8nPayload,
): Promise<N8nResult> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    return {
      status: "error",
      error: "N8N_WEBHOOK_URL no está configurado",
    };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return {
        status: "error",
        error: `n8n responded with status ${res.status}`,
      };
    }

    let data: Record<string, unknown> = {};
    try {
      data = await res.json();
    } catch {
      data = { raw: await res.text() };
    }

    return { status: "success", result: data };
  } catch (err) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
