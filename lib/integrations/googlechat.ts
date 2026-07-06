/**
 * Google Chat integration — posts messages to an incoming webhook.
 * Uses GOOGLE_CHAT_WEBHOOK_URL.
 */

export async function postMessage(text: string): Promise<void> {
  const url = process.env.GOOGLE_CHAT_WEBHOOK_URL;
  if (!url) throw new Error("GOOGLE_CHAT_WEBHOOK_URL no está configurado");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Google Chat respondió ${res.status}: ${body.slice(0, 200)}`,
    );
  }
}
