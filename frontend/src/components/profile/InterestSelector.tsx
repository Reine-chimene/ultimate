"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Interest } from "@/types";
import { INTEREST_CATEGORY_LABELS } from "@/lib/constants";

interface InterestSelectorProps {
  selected: Interest[];
  onChange: () => void | Promise<void>;
  minHint?: number;
}

export function InterestSelector({ selected, onChange, minHint = 3 }: InterestSelectorProps) {
  const [catalog, setCatalog] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.profiles
      .interestsCatalog()
      .then((res) => setCatalog(res.categories))
      .catch(() => setError("Impossible de charger le catalogue d'intérêts."))
      .finally(() => setLoading(false));
  }, []);

  const selectedNames = new Set(selected.map((i) => i.name));
  const legacyInterests = selected.filter(
    (i) => !Object.values(catalog).some((labels) => labels.includes(i.name)),
  );

  const toggle = async (name: string, category: string) => {
    const existing = selected.find((i) => i.name === name);
    setBusy(name);
    setError(null);
    try {
      if (existing) {
        await api.profiles.deleteInterest(existing.id);
      } else {
        await api.profiles.addInterest(name, category);
      }
      await onChange();
    } catch {
      setError("Impossible de mettre à jour cet intérêt.");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#9a8f8a]">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement des intérêts...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selected.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-[#9a8f8a]">Sélectionnés ({selected.length})</p>
          <div className="flex flex-wrap gap-2">
            {selected.map((i) => (
              <button
                key={i.id}
                type="button"
                disabled={busy === i.name}
                onClick={() => void toggle(i.name, i.category ?? "")}
                className="inline-flex items-center gap-1 rounded-full bg-[#6b1d3a]/40 px-3 py-1 text-sm ring-1 ring-[#c9a962]/30 transition hover:bg-[#6b1d3a]/60"
              >
                {i.name}
                <X className="h-3 w-3 opacity-70" />
              </button>
            ))}
          </div>
        </div>
      )}

      {legacyInterests.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-[#9a8f8a]">Intérêts existants (conservés)</p>
          <div className="flex flex-wrap gap-2">
            {legacyInterests.map((i) => (
              <span key={i.id} className="rounded-full border border-white/10 px-3 py-1 text-sm text-[#9a8f8a]">
                {i.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {Object.entries(catalog).map(([category, labels]) => (
        <div key={category}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#c9a962]">
            {INTEREST_CATEGORY_LABELS[category] ?? category}
          </p>
          <div className="flex flex-wrap gap-2">
            {labels.map((name) => {
              const isSelected = selectedNames.has(name);
              return (
                <button
                  key={name}
                  type="button"
                  disabled={busy === name}
                  onClick={() => void toggle(name, category)}
                  className={`rounded-full px-3 py-1 text-sm transition ${
                    isSelected
                      ? "bg-[#c9a962]/20 text-[#c9a962] ring-1 ring-[#c9a962]/40"
                      : "border border-white/10 hover:bg-white/5"
                  }`}
                >
                  {isSelected ? "✓ " : "+ "}
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-red-300">{error}</p>}
      <p className="text-xs text-[#9a8f8a]">Sélectionnez au moins {minHint} intérêts pour un profil complet.</p>
    </div>
  );
}
