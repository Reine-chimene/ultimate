import Link from "next/link";
import type { ProfileCompletion } from "@/types";
import { Check } from "lucide-react";

export function ProfileCompletionBar({ completion }: { completion: ProfileCompletion }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Profil complété à {completion.percent}%</p>
        {!completion.is_complete && (
          <Link href="/mon-profil/modifier" className="text-xs text-[#c9a962] hover:underline">
            Compléter
          </Link>
        )}
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#c9a962] transition-all"
          style={{ width: `${completion.percent}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {completion.items.map((item) => (
          <span
            key={item.key}
            className={`inline-flex items-center gap-1 text-xs ${item.done ? "text-[#c9a962]" : "text-[#9a8f8a]"}`}
          >
            {item.done ? <Check className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-white/20" />}
            {item.label}
          </span>
        ))}
      </div>
      {completion.missing.length > 0 && (
        <p className="mt-2 text-xs text-[#9a8f8a]">{completion.missing[0]}</p>
      )}
    </div>
  );
}
