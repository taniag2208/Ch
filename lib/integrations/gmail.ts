/**
 * Gmail integration — sends email via the Gmail API using OAuth2 refresh token.
 * Uses GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN and
 * GMAIL_SENDER_EMAIL.
 */
import { google } from "googleapis";

function buildRawEmail(
  from: string,
  to: string,
  subject: string,
  html: string,
): string {
  // RFC 2822 message, base64url-encoded for the Gmail API.
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const lines = [
    `From: Charlie · Tita Media <${from}>`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html).toString("base64"),
  ];
  return Buffer.from(lines.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<{ id: string }> {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const sender = process.env.GMAIL_SENDER_EMAIL || "charlie@titamedia.com";

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Faltan credenciales de Gmail (GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN)",
    );
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2 });
  const raw = buildRawEmail(sender, to, subject, html);

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return { id: res.data.id || "" };
}
