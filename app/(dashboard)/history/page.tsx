import { prisma } from "@/lib/prisma";
import { HistoryTable, type LogRow } from "@/components/history/HistoryTable";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const logs = await prisma.charlieLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const rows: LogRow[] = logs.map((l) => ({
    id: l.id,
    type: l.type,
    recipient: l.recipient,
    content: l.content,
    status: l.status,
    error: l.error,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Historial
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todo lo que Charlie ha enviado: informes, alertas y correos.
        </p>
      </header>

      <HistoryTable logs={rows} />
    </div>
  );
}
