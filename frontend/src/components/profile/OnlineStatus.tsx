import type { OnlineStatus as OnlineStatusType } from "@/types";
import { cn } from "@/lib/utils";

const LABELS: Record<OnlineStatusType, string> = {
  online: "En ligne",
  recently_active: "Actif·ve récemment",
  offline: "",
};

export function OnlineStatus({ status, className }: { status?: OnlineStatusType | null; className?: string }) {
  if (!status || status === "offline") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        status === "online" ? "text-emerald-400" : "text-[#9a8f8a]",
        className,
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          status === "online" ? "bg-emerald-400" : "bg-[#9a8f8a]",
        )}
      />
      {LABELS[status]}
    </span>
  );
}
