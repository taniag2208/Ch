import { prisma } from "@/lib/prisma";

type LogInput = {
  type: "informe" | "alerta" | "email";
  recipient: string;
  content: string;
  status: "sent" | "failed";
  error?: string | null;
  metadata?: Record<string, unknown> | null;
};

/** Persist a Charlie action to CharlieLog. Never throws — logging is best-effort. */
export async function logCharlie(input: LogInput): Promise<void> {
  try {
    await prisma.charlieLog.create({
      data: {
        type: input.type,
        recipient: input.recipient,
        content: input.content,
        status: input.status,
        error: input.error ?? null,
        metadata: (input.metadata ?? undefined) as never,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("No pude guardar en CharlieLog:", err);
  }
}
