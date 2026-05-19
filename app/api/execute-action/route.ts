import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { triggerN8nWorkflow } from "@/lib/n8n";
import type { IntentParameters, IntentType } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      intent: IntentType;
      parameters: IntentParameters;
      message_id?: string;
    };

    if (!body.intent) {
      return NextResponse.json({ error: "Missing intent" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Insert pending log
    const { data: logRow } = await supabase
      .from("actions_log")
      .insert({
        user_id: user.id,
        message_id: body.message_id ?? null,
        intent: body.intent,
        parameters: body.parameters,
        status: "executing",
      })
      .select()
      .single();

    const result = await triggerN8nWorkflow({
      intent: body.intent,
      parameters: body.parameters,
      user_id: user.id,
      message_id: body.message_id,
      timestamp: new Date().toISOString(),
    });

    // Update log
    if (logRow?.id) {
      await supabase
        .from("actions_log")
        .update({
          status: result.status,
          result: result.result ?? null,
          error: result.error ?? null,
        })
        .eq("id", logRow.id);
    }

    // Update originating message
    if (body.message_id) {
      await supabase
        .from("messages")
        .update({
          action_status: result.status,
          action_result: result.result ?? null,
        })
        .eq("id", body.message_id);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/execute-action] error:", err);
    return NextResponse.json(
      {
        status: "error",
        error: err instanceof Error ? err.message : "Internal error",
      },
      { status: 500 },
    );
  }
}
