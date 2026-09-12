"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Profile, RelationshipIntention } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { INTEREST_SUGGESTIONS, INTENTION_LABELS } from "@/lib/constants";
import { COUNTRIES, defaultTimezoneForCountry } from "@/lib/countries";
import { getPrimaryPhoto } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { PhotoUpload } from "@/components/profile/PhotoUpload";

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState("");
  const [occupation, setOccupation] = useState("");
  const [intention, setIntention] = useState<RelationshipIntention>("friendship");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("CA");
  const [timezone, setTimezone] = useState("America/Toronto");
  const [loading, setLoading] = useState(false);

  const refreshProfile = () => api.profiles.me().then(setProfile);

  useEffect(() => {
    api.profiles.me().then((p) => {
      setProfile(p);
      setBio(p.bio ?? "");
      setOccupation(p.occupation ?? "");
      setIntention(p.relationship_intention);
      setCity(p.city ?? "");
      setCountry(p.country ?? "CA");
      setTimezone(p.timezone ?? "America/Toronto");
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.profiles.update({
        bio,
        occupation,
        relationship_intention: intention,
        city,
        country,
        timezone,
      });
      router.push("/mon-profil");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    await api.profiles.deletePhoto(id);
    await refreshProfile();
  };

  const handleAddInterest = async (name: string) => {
    await api.profiles.addInterest(name);
    await refreshProfile();
  };

  if (!profile) return <div className="py-20 text-center">Chargement...</div>;

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="À propos de moi" subtitle="Votre présentation personnelle — distincte de vos préférences de recherche." />

      <section className="premium-card mb-6 p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Photo de profil</h2>
        <PhotoUpload
          label={profile.photos.length > 0 ? "Changer la photo" : "Ajouter une photo"}
          previewUrl={getPrimaryPhoto(profile.photos)}
          isPrimary={profile.photos.length === 0}
          onProfileRefresh={refreshProfile}
        />
        {profile.photos.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.photos.map((ph) => (
              <div key={ph.id} className="relative h-16 w-16 overflow-hidden rounded-lg">
                <Image src={ph.url} alt="" fill className="object-cover" sizes="64px" />
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(ph.id)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-red-300" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="premium-card space-y-4 p-6">
        <Textarea label="Bio / présentation" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Parlez de vous..." />
        <Input label="Profession" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
        <Select
          label="Pays"
          value={country}
          onChange={(e) => {
            const c = e.target.value;
            setCountry(c);
            setTimezone(defaultTimezoneForCountry(c));
          }}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.flag} {c.nameFr}</option>
          ))}
        </Select>
        <Input label="Ville" value={city} onChange={(e) => setCity(e.target.value)} />
        <Select label="Mon intention" value={intention} onChange={(e) => setIntention(e.target.value as RelationshipIntention)}>
          {(Object.keys(INTENTION_LABELS) as RelationshipIntention[]).map((key) => (
            <option key={key} value={key}>{INTENTION_LABELS[key]}</option>
          ))}
        </Select>

        <div>
          <label className="mb-2 block text-sm text-[#9a8f8a]">Centres d&apos;intérêt</label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_SUGGESTIONS.filter((s) => !profile.interests.some((i) => i.name === s)).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleAddInterest(s)}
                className="rounded-full border border-white/10 px-3 py-1 text-sm hover:bg-white/5"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="ghost" onClick={() => router.back()}>Annuler</Button>
          <Button variant="gold" onClick={handleSave} loading={loading}>Enregistrer</Button>
        </div>
      </div>
    </div>
  );
}
