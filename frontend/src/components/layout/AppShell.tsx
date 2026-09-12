"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Calendar,
  Compass,
  Crown,
  Globe2,
  Heart,
  MessageCircle,
  Moon,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { href: "/decouvrir", label: "Découvrir", icon: Compass, match: (p: string) => p.startsWith("/decouvrir") },
  { href: "/matchs", label: "Connexions", icon: Heart, match: (p: string) => p.startsWith("/matchs") },
  { href: "/messages", label: "Messages", icon: MessageCircle, match: (p: string) => p.startsWith("/messages") },
  { href: "/ce-soir", label: "Ce soir", icon: Moon, match: (p: string) => p.startsWith("/ce-soir") },
  { href: "/mon-profil", label: "Profil", icon: User, match: (p: string) => p.startsWith("/mon-profil") || p.startsWith("/profil") || p.startsWith("/preferences") || p.startsWith("/parametres") || p.startsWith("/voyage") || p.startsWith("/world") || p.startsWith("/premium") || p.startsWith("/rendez-vous") },
];

const desktopExtraNav = [
  { href: "/world", label: "Ultimate World", icon: Globe2, match: (p: string) => p.startsWith("/world") },
  { href: "/rendez-vous/demandes", label: "Rendez-vous", icon: Calendar, match: (p: string) => p.startsWith("/rendez-vous") },
  { href: "/premium", label: "Premium", icon: Crown, match: (p: string) => p.startsWith("/premium") },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  compact,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "transition duration-200 active:scale-95",
        compact
          ? "relative flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-2.5"
          : "flex items-center gap-3 rounded-xl px-4 py-3 text-sm",
        active
          ? compact
            ? "text-[#c9a962]"
            : "bg-[#6b1d3a]/25 text-[#c9a962]"
          : compact
            ? "text-[#9a8f8a]"
            : "text-[#9a8f8a] hover:bg-white/5 hover:text-[#f5f0e8]",
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", active && compact && "drop-shadow-[0_0_8px_rgba(201,169,98,0.45)]")} />
      <span className={cn(compact ? "max-w-full truncate text-[9px] font-medium leading-tight sm:text-[10px]" : "")}>
        {compact && label === "Ultimate World" ? "Monde" : label}
      </span>
      {active && compact && (
        <span className="absolute bottom-1 h-0.5 w-5 rounded-full bg-[#c9a962]" />
      )}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();


  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-white/[0.06] bg-[#0a0a0b]/95 backdrop-blur-xl lg:flex">
        <div className="border-b border-white/[0.06] p-6">
          <Logo showTagline size="sm" />
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {mainNavItems.map(({ href, label, icon, match }) => (
            <NavLink key={href} href={href} label={label} icon={icon} active={match(pathname)} />
          ))}
          {desktopExtraNav.map(({ href, label, icon, match }) => (
            <NavLink key={href} href={href} label={label} icon={icon} active={match(pathname)} />
          ))}
          {user?.role === "admin" && (
            <NavLink href="/admin" label="Administration" icon={Shield} active={pathname.startsWith("/admin")} />
          )}
        </nav>
        <div className="space-y-1 border-t border-white/[0.06] p-4">
          <Link
            href="/parametres"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-[#9a8f8a] transition hover:bg-white/5 hover:text-[#f5f0e8]"
          >
            <Settings className="h-4 w-4" />
            Paramètres
          </Link>
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-[#9a8f8a] transition hover:bg-white/5"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-[#0a0a0b]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <Link
            href="/parametres"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition",
              pathname.startsWith("/parametres") ? "bg-[#6b1d3a]/40 text-[#c9a962]" : "bg-white/5 text-[#9a8f8a]",
            )}
            aria-label="Paramètres"
          >
            <Settings className="h-5 w-5" />
          </Link>
          <Link
            href="/notifications"
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-full transition",
              pathname.startsWith("/notifications") ? "bg-[#6b1d3a]/40 text-[#c9a962]" : "bg-white/5 text-[#9a8f8a]",
            )}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 pb-32 md:px-6 md:py-6 lg:pb-6 lg:px-8">
        {children}
      </main>

      <nav
        className="nav-glow fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] bg-[#0a0a0b]/98 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="grid grid-cols-5">
          {mainNavItems.map(({ href, label, icon, match }) => (
            <NavLink key={href} href={href} label={label} icon={icon} active={match(pathname)} compact />
          ))}
        </div>
      </nav>
    </div>
  );
}
