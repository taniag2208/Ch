"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckSquare,
  FolderKanban,
  Users,
  Settings,
  Sparkles,
  LogOut,
  Plus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, initials } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase";

interface SidebarProps {
  name: string;
  email: string;
  avatarUrl?: string;
}

const nav = [
  { label: "Hoy", href: "/chat", icon: Sparkles },
  { label: "Tareas", href: "/chat?view=tasks", icon: CheckSquare },
  { label: "Proyectos", href: "/chat?view=projects", icon: FolderKanban },
  { label: "Calendario", href: "/chat?view=calendar", icon: Calendar },
  { label: "CRM", href: "/chat?view=crm", icon: Users },
  { label: "Ajustes", href: "/chat?view=settings", icon: Settings },
];

export function Sidebar({ name, email, avatarUrl }: SidebarProps) {
  const [active, setActive] = useState("Hoy");

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside className="hidden h-full w-72 shrink-0 flex-col border-r border-border bg-white md:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="gradient-charlie flex h-9 w-9 items-center justify-center rounded-xl shadow-soft">
          <span className="text-sm font-semibold text-white">C</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight">Charlie</span>
          <span className="text-xs text-muted-foreground">
            Asistente personal
          </span>
        </div>
      </div>

      {/* New chat */}
      <div className="px-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 rounded-xl border-dashed text-muted-foreground hover:text-foreground"
          onClick={() => (window.location.href = "/chat")}
        >
          <Plus className="h-4 w-4" /> Nueva conversación
        </Button>
      </div>

      {/* Nav */}
      <nav className="mt-6 flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.label;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setActive(item.label)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-charlie-50 text-charlie-700"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback className="bg-charlie-100 text-charlie-700">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
