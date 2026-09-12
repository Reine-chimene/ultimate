import { cn } from "@/lib/utils";
import { MEETING_STATUS_LABELS } from "@/lib/constants";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-200 ring-amber-500/25",
  accepted: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/25",
  rejected: "bg-red-500/15 text-red-200 ring-red-500/25",
  cancelled: "bg-white/5 text-[#9a8f8a] ring-white/10",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1",
        STATUS_STYLES[status] ?? STATUS_STYLES.cancelled,
      )}
    >
      {MEETING_STATUS_LABELS[status] ?? status}
    </span>
  );
}
