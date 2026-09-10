"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Edit, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Profile } from "@/types";
import { Button } from "@/components/ui/Button";
import { INTENTION_LABELS, GENDER_LABELS } from "@/lib/constants";
import { calculateAge, getPrimaryPhoto } from "@/lib/utils";

export default function MyProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    api.profiles.me().then(setProfile).catch(() => {});
  }, []);

  if (!user || !profile) {
    return <div className="py-20 text-center">Chargement...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Mon profil</h1>
        <Link href="/mon-profil/modifier">
          <Button variant="outline" size="sm"><Edit className="h-4 w-4" /> Modifier</Button>
        </Link>
      </div>

      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
        <Image src={getPrimaryPhoto(profile.photos)} alt={user.first_name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 p-6">
          <h2 className="font-display text-4xl font-bold">{user.first_name}, {calculateAge(user.date_of_birth)}</h2>
          <div className="flex items-center gap-2 mt-2 text-[#9a8f8a]">
            <MapPin className="h-4 w-4" /> {user.city}
          </div>
        </div>
      </div>

      <div className="glass-card mt-6 p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#6b1d3a]/40 px-3 py-1 text-sm">{INTENTION_LABELS[profile.relationship_intention]}</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm">{GENDER_LABELS[user.gender]}</span>
        </div>
        {profile.occupation && <p className="text-[#9a8f8a]">{profile.occupation}</p>}
        {profile.bio && <p>{profile.bio}</p>}
        {profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((i) => (
              <span key={i.id} className="rounded-full border border-white/10 px-3 py-1 text-sm">{i.name}</span>
            ))}
          </div>
        )}
        <div className="pt-4 border-t border-white/5 text-sm text-[#9a8f8a]">
          <p>Recherche : {profile.looking_for_genders.map((g) => GENDER_LABELS[g]).join(", ")}</p>
          <p>Âge : {profile.min_age} – {profile.max_age} ans</p>
          <p>Distance max : {profile.max_distance_km} km</p>
        </div>
      </div>
    </div>
  );
}
