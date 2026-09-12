import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="premium-card mx-auto max-w-md px-6 py-14 text-center animate-fade-in">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#6b1d3a]/20 ring-1 ring-[#6b1d3a]/30">
        <Icon className="h-7 w-7 text-[#c9a962]" />
      </div>
      <h2 className="mt-5 font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#9a8f8a]">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-6 inline-block">
          <Button variant="gold">{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
