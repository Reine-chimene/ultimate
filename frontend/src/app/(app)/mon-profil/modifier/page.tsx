"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Profile, RelationshipIntention } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { INTEREST_SUGGESTIONS } from "@/lib/constants";

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState("");
  const [occupation, setOccupation] = useState("");
  const [intention, setIntention] = useState<RelationshipIntention>("friendship");
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.profiles.me().then((p) => {
      setProfile(p);
      setBio(p.bio ?? "");
      setOccupation(p.occupation ?? "");
      setIntention(p.relationship_intention);
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.profiles.update({ bio, occupation, relationship_intention: intention });
      router.push("/mon-profil");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!photoUrl) return;
    await api.profiles.addPhoto(photoUrl, profile?.photos.length === 0);
    const p = await api.profiles.me();
    setProfile(p);
    setPhotoUrl("");
  };

  const handleAddInterest = async (name: string) => {
    await api.profiles.addInterest(name);
    const p = await api.profiles.me();
    setProfile(p);
  };

  if (!profile) return <div className="py-20 text-center">Chargement...</div>;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-6">Modifier mon profil</h1>
      <div className="space-y-4">
        <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
        <Input label="Profession" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
        <Select label="Intention" value={intention} onChange={(e) => setIntention(e.target.value as RelationshipIntention)}>
          <option value="relationship">Relation sérieuse</option>
          <option value="friendship">Faire connaissance</option>
          <option value="unsure">Rendez-vous</option>
          <option value="casual">Rencontre sans engagement</option>
        </Select>

        <div>
          <label className="block text-sm text-[#9a8f8a] mb-2">Ajouter une photo (URL)</label>
          <div className="flex gap-2">
            <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
            <Button variant="outline" onClick={handleAddPhoto}>Ajouter</Button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#9a8f8a] mb-2">Centres d&apos;intérêt</label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_SUGGESTIONS.filter((s) => !profile.interests.some((i) => i.name === s)).map((s) => (
              <button key={s} onClick={() => handleAddInterest(s)} className="rounded-full border border-white/10 px-3 py-1 text-sm hover:bg-white/5">
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
