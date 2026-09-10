"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Calendar,
  Compass,
  Crown,
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
  { href: "/matchs", label: "Matchs", icon: Heart, match: (p: string) => p.startsWith("/matchs") },
  { href: "/messages", label: "Messages", icon: MessageCircle, match: (p: string) => p.startsWith("/messages") },
  { href: "/ce-soir", label: "Ce soir", icon: Moon, match: (p: string) => p.startsWith("/ce-soir") },
  { href: "/rendez-vous/demandes", label: "RDV", icon: Calendar, match: (p: string) => p.startsWith("/rendez-vous") },
  { href: "/premium", label: "Premium", icon: Crown, match: (p: string) => p.startsWith("/premium") },
  { href: "/mon-profil", label: "Profil", icon: User, match: (p: string) => p.startsWith("/mon-profil") || p.startsWith("/profil") },
  { href: "/notifications", label: "Notifs", icon: Bell, match: (p: string) => p.startsWith("/notifications") },
  { href: "/parametres", label: "Réglages", icon: Settings, match: (p: string) => p.startsWith("/parametres") || p.startsWith("/preferences") },
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
        "transition active:scale-95",
        compact
          ? "relative flex min-w-[4.5rem] flex-col items-center justify-center gap-0.5 px-2 py-2.5"
          : "flex items-center gap-3 rounded-xl px-4 py-3 text-sm",
        active
          ? compact
            ? "text-[#c9a962]"
            : "bg-[#6b1d3a]/30 text-[#c9a962]"
          : compact
            ? "text-[#9a8f8a]"
            : "text-[#9a8f8a] hover:bg-white/5 hover:text-[#f5f0e8]",
      )}
    >
      <Icon className={cn(compact ? "h-5 w-5" : "h-5 w-5", active && compact && "drop-shadow-[0_0_6px_rgba(201,169,98,0.5)]")} />
      <span className={cn(compact ? "text-[10px] font-medium leading-tight" : "")}>{label}</span>
      {active && compact && (
        <span className="absolute bottom-1 h-0.5 w-5 rounded-full bg-[#c9a962]" />
      )}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const mobileItems = [
    ...mainNavItems,
    ...(user?.role === "admin"
      ? [{ href: "/admin", label: "Admin", icon: Shield, match: (p: string) => p.startsWith("/admin") }]
      : []),
  ];

  // Split into 2 rows for phone: first 5, rest on second row
  const row1 = mobileItems.slice(0, 5);
  const row2 = mobileItems.slice(5);

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-white/5 bg-[#0a0a0b]/95 backdrop-blur-xl lg:flex">
        <div className="p-6">
          <Logo showTagline size="sm" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {mainNavItems.map(({ href, label, icon, match }) => (
            <NavLink key={href} href={href} label={label} icon={icon} active={match(pathname)} />
          ))}
          {user?.role === "admin" && (
            <NavLink href="/admin" label="Administration" icon={Shield} active={pathname.startsWith("/admin")} />
          )}
        </nav>
        <div className="border-t border-white/5 p-4">
          <button
            onClick={logout}
            className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-[#9a8f8a] hover:bg-white/5"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile / tablet header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-[#0a0a0b]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo size="sm" />
        <Link
          href="/notifications"
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-full",
            pathname.startsWith("/notifications") ? "bg-[#6b1d3a]/40 text-[#c9a962]" : "bg-white/5 text-[#9a8f8a]",
          )}
        >
          <Bell className="h-5 w-5" />
        </Link>
      </header>

      {/* Main content — padding bottom for mobile nav */}
      <main className="mx-auto max-w-6xl px-4 py-4 pb-36 md:px-6 md:py-6 lg:pb-6 lg:px-8">
        {children}
      </main>

      {/* Mobile bottom navigation — ALL icons visible, 2 rows */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0a0a0b]/98 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="grid grid-cols-5 border-b border-white/5">
          {row1.map(({ href, label, icon, match }) => (
            <div key={href} className="relative flex justify-center">
              <NavLink href={href} label={label} icon={icon} active={match(pathname)} compact />
            </div>
          ))}
        </div>
        <div className={cn("grid border-white/5", row2.length <= 5 ? "grid-cols-5" : "grid-cols-5")}>
          {row2.map(({ href, label, icon, match }) => (
            <div key={href} className="relative flex justify-center">
              <NavLink href={href} label={label} icon={icon} active={match(pathname)} compact />
            </div>
          ))}
          {/* Fill empty cells to keep grid aligned */}
          {row2.length < 5 &&
            Array.from({ length: 5 - row2.length }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
        </div>
      </nav>
    </div>
  );
}
