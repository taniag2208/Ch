import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncLeadSnapshots } from "@/lib/leads/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const count = await syncLeadSnapshots();
    return NextResponse.json({ ok: true, count });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error desconocido sincronizando";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
