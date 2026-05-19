"use client";

import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message, ChatApiResponse } from "@/types";

const SAMPLE_MESSAGES: Message[] = [
  {
    id: "sample-1",
    conversation_id: "demo",
    user_id: "demo",
    role: "assistant",
    content:
      "Hola, soy Charlie 👋 Tu asistente personal de productividad. Puedo ayudarte a redactar emails, crear tareas en Asana, agendar eventos, configurar recordatorios y resumir tu día.",
    intent: "general_response",
    requires_action: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-2",
    conversation_id: "demo",
    user_id: "demo",
    role: "assistant",
    content:
      "Probá pedirme algo como: \"Mandale un email a Lucía pidiéndole los KPIs de marzo\", \"Agendá una reunión con el equipo el viernes a las 10\", o simplemente \"Resumime el día\".",
    intent: "general_response",
    requires_action: false,
    created_at: new Date().toISOString(),
  },
];

export function ChatArea() {
  const [messages, setMessages] = useState<Message[]>(SAMPLE_MESSAGES);
  const [thinking, setThinking] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  async function handleSend(text: string) {
    const userMsg: Message = {
      id: uuid(),
      conversation_id: conversationId ?? "new",
      user_id: "me",
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, conversation_id: conversationId }),
      });

      if (!res.ok) throw new Error(`Chat API error: ${res.status}`);

      const data = (await res.json()) as ChatApiResponse & {
        conversation_id?: string;
      };

      if (data.conversation_id) setConversationId(data.conversation_id);

      const assistantMsg: Message = {
        ...(data.message as Message),
        role: "assistant",
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: uuid(),
          conversation_id: conversationId ?? "new",
          user_id: "me",
          role: "assistant",
          content:
            "Tuve un problema procesando tu mensaje. Probá nuevamente en unos segundos.",
          intent: "general_response",
          requires_action: false,
          created_at: new Date().toISOString(),
        },
      ]);
      console.error(err);
    } finally {
      setThinking(false);
    }
  }

  async function handleExecute(msg: Message) {
    if (!msg.intent || !msg.parameters) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id ? { ...m, action_status: "executing" } : m,
      ),
    );

    try {
      const res = await fetch("/api/execute-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: msg.intent,
          parameters: msg.parameters,
          message_id: msg.id,
        }),
      });
      const data = await res.json();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id
            ? {
                ...m,
                action_status: data.status === "success" ? "success" : "error",
                action_result: data.result ?? null,
              }
            : m,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, action_status: "error" } : m,
        ),
      );
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-white/70 px-6 py-4 backdrop-blur">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Hoy</h1>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div
          ref={scrollRef}
          className="mx-auto flex h-full max-w-3xl flex-col gap-5 px-4 py-8 md:px-8"
        >
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} onExecute={handleExecute} />
          ))}
          {thinking && <ThinkingBubble />}
        </div>
      </ScrollArea>

      <ChatInput onSend={handleSend} disabled={thinking} />
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex animate-fade-in items-end gap-3">
      <Avatar className="h-9 w-9">
        <AvatarFallback className="gradient-charlie text-sm font-semibold text-white">
          C
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-soft">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-charlie-400 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-charlie-400 [animation-delay:200ms]" />
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-charlie-400 [animation-delay:400ms]" />
      </div>
    </div>
  );
}
