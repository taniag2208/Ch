import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { askCharlie } from "@/lib/ai";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { Message } from "@/types";

export async function POST(request: Request) {
  try {
    const { content, conversation_id } = await request.json();
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure conversation exists
    let convId = conversation_id as string | undefined;
    if (!convId) {
      const { data: conv } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: content.slice(0, 60),
        })
        .select()
        .single();
      convId = conv?.id;
    }

    // Persist user message
    await supabase.from("messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content,
    });

    // Ask Charlie
    const charlie = await askCharlie(content);

    // Persist assistant message
    const assistantId = uuid();
    const assistantMessage: Partial<Message> = {
      id: assistantId,
      conversation_id: convId!,
      user_id: user.id,
      role: "assistant",
      content: charlie.message,
      intent: charlie.intent,
      parameters: charlie.parameters,
      requires_action: charlie.requires_action,
      action_status: charlie.requires_action ? "pending" : null,
    };
    await supabase.from("messages").insert(assistantMessage);

    return NextResponse.json({
      message: { ...assistantMessage, created_at: new Date().toISOString() },
      charlie,
      conversation_id: convId,
    });
  } catch (err) {
    console.error("[api/chat] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
