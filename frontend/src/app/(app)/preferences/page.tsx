"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Gender, RelationshipIntention } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GENDER_LABELS, INTENTION_LABELS } from "@/lib/constants";
import { COUNTRIES } from "@/lib/countries";
import { PageHeader } from "@/components/ui/PageHeader";

export default function PreferencesPage() {
  const [minAge, setMinAge] = useState(22);
  const [maxAge, setMaxAge] = useState(45);
  const [maxDistance, setMaxDistance] = useState(100);
  const [lookingFor, setLookingFor] = useState<Gender[]>([]);
  const [preferredIntentions, setPreferredIntentions] = useState<RelationshipIntention[]>([]);
  const [preferredCountries, setPreferredCountries] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.profiles.preferences().then((p) => {
      setMinAge(p.min_age);
      setMaxAge(p.max_age);
      setMaxDistance(p.max_distance_km);
      setLookingFor(p.looking_for_genders);
      setPreferredIntentions(p.preferred_intentions);
      setPreferredCountries(p.preferred_countries);
    }).finally(() => setLoading(false));
  }, []);

  const toggleGender = (g: Gender) => {
    setLookingFor((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
  };

  const toggleIntention = (i: RelationshipIntention) => {
    setPreferredIntentions((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
  };

  const toggleCountry = (code: string) => {
    setPreferredCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleSave = async () => {
    if (lookingFor.length === 0) return;
    await api.profiles.updatePreferences({
      min_age: minAge,
      max_age: maxAge,
      max_distance_km: maxDistance,
      looking_for_genders: lookingFor,
      preferred_intentions: preferredIntentions,
      preferred_countries: preferredCountries,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="py-20 text-center">Chargement...</div>;

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Ce que je recherche"
        subtitle="Vos critères de recherche — distincts de votre profil personnel."
      />

      <div className="premium-card mb-4 p-4 text-sm text-[#9a8f8a]">
        <Link href="/mon-profil/modifier" className="text-[#c9a962] hover:underline">
          À propos de moi
        </Link>
        {" "}décrit qui vous êtes. Cette page définit{" "}
        <strong className="text-[#f5f0e8]">ce que vous recherchez</strong> chez les autres.
      </div>

      <div className="premium-card space-y-8 p-6 md:p-8">
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">Je recherche</h2>
          <div className="flex flex-wrap gap-2">
            {(["male", "female"] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGender(g)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  lookingFor.includes(g) ? "bg-[#6b1d3a]/40 text-[#c9a962]" : "border border-white/10"
                }`}
              >
                {g === "male" ? "Hommes" : "Femmes"}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLookingFor(["male", "female"])}
              className={`rounded-full px-4 py-2 text-sm transition ${
                lookingFor.includes("male") && lookingFor.includes("female")
                  ? "bg-[#6b1d3a]/40 text-[#c9a962]"
                  : "border border-white/10"
              }`}
            >
              Les deux
            </button>
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">Pour</h2>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(INTENTION_LABELS) as RelationshipIntention[]).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleIntention(i)}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  preferredIntentions.includes(i)
                    ? "bg-[#c9a962]/20 text-[#c9a962] ring-1 ring-[#c9a962]/30"
                    : "border border-white/10 text-[#9a8f8a]"
                }`}
              >
                {INTENTION_LABELS[i]}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">Pays (optionnel)</h2>
          <p className="mb-3 text-xs text-[#9a8f8a]">Laissez vide pour tous les pays.</p>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => toggleCountry(c.code)}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  preferredCountries.includes(c.code)
                    ? "bg-[#6b1d3a]/40 text-[#c9a962]"
                    : "border border-white/10"
                }`}
              >
                {c.flag} {c.nameFr}
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <Input label="Âge minimum" type="number" min={18} max={99} value={minAge} onChange={(e) => setMinAge(+e.target.value)} />
          <Input label="Âge maximum" type="number" min={18} max={99} value={maxAge} onChange={(e) => setMaxAge(+e.target.value)} />
        </section>

        <Input
          label="Distance maximum (km)"
          type="number"
          min={1}
          max={500}
          value={maxDistance}
          onChange={(e) => setMaxDistance(+e.target.value)}
        />

        <Button variant="gold" onClick={handleSave} className="w-full" disabled={lookingFor.length === 0}>
          {saved ? "Enregistré ✓" : "Enregistrer mes préférences"}
        </Button>
      </div>
    </div>
  );
}
