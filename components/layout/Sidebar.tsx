"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Settings,
  History,
  LogOut,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/leads", label: "Cliente 360", icon: UserCircle, hint: true },
  { href: "/config", label: "Configuración", icon: Settings },
  { href: "/history", label: "Historial", icon: History },
];

export function Sidebar({
  user,
  signOutAction,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  signOutAction: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-charlie text-xl shadow-soft">
          🤖
        </div>
        <div>
          <p className="text-base font-bold leading-tight text-gray-900">
            Charlie
          </p>
          <p className="text-xs text-muted-foreground">Tita Media</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href) && !item.hint;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-charlie-50 text-charlie-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{item.label}</span>
              {item.hint && (
                <span className="ml-auto text-[10px] text-muted-foreground">
                  ficha
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="mb-3 flex items-center gap-3">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name || "Usuario"}
              className="h-9 w-9 rounded-full"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-charlie-100 text-sm font-semibold text-charlie-700">
              {initials(user.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {user.name || "Usuario"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
