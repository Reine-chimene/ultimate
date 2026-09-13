import { Moon } from "lucide-react";

export function AvailabilityBadge({ note }: { note?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#6b1d3a]/50 px-2.5 py-1 text-xs text-[#f5d0dc]">
      <Moon className="h-3 w-3" />
      Disponible ce soir{note ? ` · ${note}` : ""}
    </span>
  );
}
