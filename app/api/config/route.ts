import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getConfig } from "@/lib/charlie/config";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const current = await getConfig();

  // Validate + coerce.
  const stageInactivityDays =
    body.stageInactivityDays && typeof body.stageInactivityDays === "object"
      ? (body.stageInactivityDays as Record<string, number>)
      : (current.stageInactivityDays as never);

  const dailyEmailLimit = Number(body.dailyEmailLimit);
  const exclusionList = Array.isArray(body.exclusionList)
    ? (body.exclusionList as string[]).map((s) => String(s).trim()).filter(Boolean)
    : current.exclusionList;

  try {
    const updated = await prisma.charlieConfig.update({
      where: { id: current.id },
      data: {
        stageInactivityDays: stageInactivityDays as never,
        dailyEmailLimit:
          Number.isFinite(dailyEmailLimit) && dailyEmailLimit > 0
            ? Math.floor(dailyEmailLimit)
            : current.dailyEmailLimit,
        exclusionList,
        flow1Enabled: Boolean(body.flow1Enabled),
        flow2Enabled: Boolean(body.flow2Enabled),
        flow3Enabled: Boolean(body.flow3Enabled),
        flow1Cron: String(body.flow1Cron || current.flow1Cron),
        flow2Cron: String(body.flow2Cron || current.flow2Cron),
        flow3Cron: String(body.flow3Cron || current.flow3Cron),
      },
    });
    return NextResponse.json({ ok: true, config: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error guardando";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
