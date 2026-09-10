"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Gender, Profile } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { GENDER_LABELS } from "@/lib/constants";

export default function PreferencesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(50);
  const [maxDistance, setMaxDistance] = useState(50);
  const [lookingFor, setLookingFor] = useState<Gender[]>(["male", "female"]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.profiles.me().then((p) => {
      setProfile(p);
      setMinAge(p.min_age);
      setMaxAge(p.max_age);
      setMaxDistance(p.max_distance_km);
      setLookingFor(p.looking_for_genders);
    });
  }, []);

  const toggleGender = (g: Gender) => {
    setLookingFor((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
  };

  const handleSave = async () => {
    await api.profiles.update({
      min_age: minAge,
      max_age: maxAge,
      max_distance_km: maxDistance,
      looking_for_genders: lookingFor,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!profile) return <div className="py-20 text-center">Chargement...</div>;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-6">Préférences</h1>
      <div className="glass-card p-6 space-y-6">
        <div>
          <label className="block text-sm text-[#9a8f8a] mb-3">Je recherche</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(GENDER_LABELS) as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => toggleGender(g)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  lookingFor.includes(g) ? "bg-[#6b1d3a]/40 text-[#c9a962]" : "border border-white/10"
                }`}
              >
                {GENDER_LABELS[g]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Âge minimum" type="number" min={18} max={99} value={minAge} onChange={(e) => setMinAge(+e.target.value)} />
          <Input label="Âge maximum" type="number" min={18} max={99} value={maxAge} onChange={(e) => setMaxAge(+e.target.value)} />
        </div>
        <Input label="Distance maximum (km)" type="number" min={1} max={500} value={maxDistance} onChange={(e) => setMaxDistance(+e.target.value)} />
        <Button variant="gold" onClick={handleSave} className="w-full">
          {saved ? "Enregistré ✓" : "Enregistrer les préférences"}
        </Button>
      </div>
    </div>
  );
}
