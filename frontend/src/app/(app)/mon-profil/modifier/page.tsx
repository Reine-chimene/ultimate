"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Profile, RelationshipIntention } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { INTEREST_SUGGESTIONS, INTENTION_LABELS } from "@/lib/constants";
import { COUNTRIES, defaultTimezoneForCountry } from "@/lib/countries";
import { getPrimaryPhoto } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";

export default function EditProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState("");
  const [occupation, setOccupation] = useState("");
  const [intention, setIntention] = useState<RelationshipIntention>("friendship");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("CA");
  const [timezone, setTimezone] = useState("America/Toronto");
  const [photoUrl, setPhotoUrl] = useState("");
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

  const handleAddPhoto = async (url: string, isPrimary = false) => {
    if (!url) return;
    await api.profiles.addPhoto(url, isPrimary || profile?.photos.length === 0);
    await refreshProfile();
    setPhotoUrl("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    alert(
      "Collez l'URL de votre photo ci-dessous (ex. Unsplash, Imgur). Le stockage de fichiers sera disponible dans une prochaine version.",
    );
    e.target.value = "";
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
        <div className="relative mx-auto mb-4 aspect-square max-w-[200px] overflow-hidden rounded-2xl">
          <Image
            src={getPrimaryPhoto(profile.photos)}
            alt="Photo de profil"
            fill
            className="object-cover"
            sizes="200px"
          />
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        <Button variant="gold" size="sm" className="w-full" onClick={() => fileRef.current?.click()}>
          <Camera className="h-4 w-4" /> Ajouter une photo
        </Button>
        <p className="mt-2 text-center text-xs text-[#9a8f8a]">Ou collez une URL ci-dessous</p>
        <div className="mt-3 flex gap-2">
          <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
          <Button variant="outline" onClick={() => handleAddPhoto(photoUrl)}>Ajouter</Button>
        </div>
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
