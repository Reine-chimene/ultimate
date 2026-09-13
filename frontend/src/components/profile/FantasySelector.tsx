"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Fantasy } from "@/types";

interface FantasySelectorProps {
  selected: Fantasy[];
  onChange: () => void | Promise<void>;
}

const CATEGORY_LABELS: Record<string, string> = {
  ambiance: "Ambiance",
  experience: "Expérience",
  contexte: "Contexte",
  relation: "Relation",
  style: "Style",
};

export function FantasySelector({ selected, onChange }: FantasySelectorProps) {
  const [catalog, setCatalog] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.profiles
      .fantasiesCatalog()
      .then((res) => setCatalog(res.categories))
      .catch(() => setError("Impossible de charger le catalogue de fantaisies."))
      .finally(() => setLoading(false));
  }, []);

  const selectedTags = new Set(selected.map((f) => f.tag));

  const toggle = async (tag: string, category: string) => {
    const existing = selected.find((f) => f.tag === tag);
    setBusy(tag);
    setError(null);
    try {
      if (existing) {
        await api.profiles.deleteFantasy(existing.id);
      } else {
        await api.profiles.addFantasy(tag, category);
      }
      await onChange();
    } catch {
      setError("Impossible de mettre à jour cette fantaisie.");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#9a8f8a]">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#9a8f8a]">
        Sélectionnez vos préférences et fantaisies (discrétion assurée, visibles sur votre profil).
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {Object.entries(catalog).map(([category, tags]) => (
        <div key={category}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#c9a962]">
            {CATEGORY_LABELS[category] ?? category}
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const active = selectedTags.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  disabled={busy === tag}
                  onClick={() => toggle(tag, category)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    active
                      ? "border-[#c9a962]/50 bg-[#c9a962]/15 text-[#f5f0e8]"
                      : "border-white/10 text-[#9a8f8a] hover:border-[#c9a962]/30"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
