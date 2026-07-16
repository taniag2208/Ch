import { NextResponse } from "next/server";
import { runStaleAlerts } from "@/lib/charlie/alerts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    const results = await runStaleAlerts();
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
