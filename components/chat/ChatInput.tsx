"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autosize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    requestAnimationFrame(autosize);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-border bg-background/80 px-4 py-4 backdrop-blur md:px-8">
      <div className="mx-auto max-w-3xl">
        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl border border-border bg-white p-2 shadow-elegant transition-all",
            "focus-within:border-charlie-300 focus-within:ring-2 focus-within:ring-charlie-100",
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground"
            aria-label="Adjuntar archivo"
            disabled
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              autosize();
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Pedile algo a Charlie... (Enter para enviar, Shift+Enter para nueva línea)"
            className="flex-1 resize-none bg-transparent px-2 py-2 text-sm placeholder:text-muted-foreground focus:outline-none"
            disabled={disabled}
          />

          <Button
            type="button"
            onClick={submit}
            disabled={disabled || !value.trim()}
            size="icon"
            variant="gradient"
            aria-label="Enviar mensaje"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <p className="mt-2 px-2 text-center text-xs text-muted-foreground">
          Charlie puede equivocarse. Confirmá la información sensible antes de
          ejecutar acciones.
        </p>
      </div>
    </div>
  );
}
