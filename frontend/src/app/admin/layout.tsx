"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, Flag, Crown, ImageIcon, ArrowLeft } from "lucide-react";
import { useRequireAdmin } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Stats", icon: BarChart3 },
  { href: "/admin/utilisateurs", label: "Users", icon: Users },
  { href: "/admin/profils", label: "Profils", icon: ImageIcon },
  { href: "/admin/signalements", label: "Signalements", icon: Flag },
  { href: "/admin/abonnements", label: "Abos", icon: Crown },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useRequireAdmin();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9a962] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:pl-64">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-[#0a0a0b]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo size="sm" />
        <Link href="/decouvrir" className="flex items-center gap-1 text-xs text-[#c9a8f8a]">
          <ArrowLeft className="h-4 w-4" /> App
        </Link>
      </header>

      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-white/5 bg-[#0a0a0b] lg:flex">
        <div className="p-6"><Logo size="sm" /></div>
        <nav className="flex-1 px-3 space-y-1">
          {adminNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition",
                pathname === href ? "bg-[#6b1d3a]/30 text-[#c9a962]" : "text-[#9a8f8a] hover:bg-white/5",
              )}
            >
              <Icon className="h-5 w-5" /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <Link href="/decouvrir" className="text-sm text-[#9a8f8a] hover:text-[#f5f0e8]">← Retour à l&apos;app</Link>
        </div>
      </aside>

      <main className="mx-auto max-w-6xl px-4 py-4 pb-24 lg:pb-6 lg:px-8 lg:py-6">{children}</main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-white/10 bg-[#0a0a0b]/98 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {adminNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex flex-col items-center justify-center gap-0.5 py-2.5",
              pathname === href ? "text-[#c9a962]" : "text-[#9a8f8a]",
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
