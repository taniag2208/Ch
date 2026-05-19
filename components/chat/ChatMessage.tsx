"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import {
  Mail,
  CheckSquare,
  Bell,
  Calendar,
  ListTodo,
  MessageSquare,
} from "lucide-react";
import { ActionConfirmation } from "./ActionConfirmation";

interface ChatMessageProps {
  message: Message;
  onExecute?: (m: Message) => void;
}

const intentMeta: Record<string, { label: string; icon: typeof Mail }> = {
  send_email: { label: "Enviar email", icon: Mail },
  create_task: { label: "Crear tarea", icon: CheckSquare },
  create_reminder: { label: "Crear recordatorio", icon: Bell },
  create_calendar_event: { label: "Agendar evento", icon: Calendar },
  summarize_today: { label: "Resumen del día", icon: ListTodo },
  general_response: { label: "Conversación", icon: MessageSquare },
};

export function ChatMessage({ message, onExecute }: ChatMessageProps) {
  const isUser = message.role === "user";
  const meta = message.intent ? intentMeta[message.intent] : null;
  const Icon = meta?.icon;

  return (
    <div
      className={cn(
        "flex w-full animate-fade-in gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="gradient-charlie text-sm font-semibold text-white">
            C
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "flex max-w-[78%] flex-col gap-2",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft",
            isUser
              ? "rounded-br-md bg-charlie-600 text-white"
              : "rounded-bl-md bg-white text-foreground",
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {!isUser && message.intent && meta && Icon && message.intent !== "general_response" && (
          <Badge variant="default" className="flex items-center gap-1.5">
            <Icon className="h-3 w-3" />
            {meta.label}
          </Badge>
        )}

        {!isUser && message.requires_action && message.parameters && (
          <ActionConfirmation
            intent={message.intent ?? "general_response"}
            parameters={message.parameters}
            status={message.action_status ?? "pending"}
            onExecute={() => onExecute?.(message)}
          />
        )}
      </div>
    </div>
  );
}
