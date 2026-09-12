"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Camera, Edit, MapPin, Settings, SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Profile, ProfileCompletion } from "@/types";
import { ProfileCompletionBar } from "@/components/profile/ProfileCompletionBar";
import { Button } from "@/components/ui/Button";
import { INTENTION_LABELS, GENDER_LABELS } from "@/lib/constants";
import { getCountry } from "@/lib/countries";
import { calculateAge, getPrimaryPhoto } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function MyProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);

  useEffect(() => {
    Promise.all([api.profiles.me(), api.profiles.completion()])
      .then(([p, c]) => {
        setProfile(p);
        setCompletion(c);
      })
      .catch(() => {});
  }, []);

  if (!user || !profile) return <LoadingSpinner />;

  const country = getCountry(user.country);

  return (
    <div className="mx-auto max-w-2xl">
      {completion && (
        <div className="mb-6">
          <ProfileCompletionBar completion={completion} />
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Mon profil</h1>
        <div className="flex gap-2">
          <Link href="/parametres">
            <Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button>
          </Link>
          <Link href="/mon-profil/modifier">
            <Button variant="outline" size="sm"><Edit className="h-4 w-4" /> Modifier</Button>
          </Link>
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="relative aspect-[4/5] max-h-[480px]">
          <Image
            src={getPrimaryPhoto(profile.photos)}
            alt={user.first_name}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 640px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] to-transparent" />
          <div className="absolute bottom-0 p-6">
            <h2 className="font-display text-4xl font-bold">
              {user.first_name}, {calculateAge(user.date_of_birth)}
            </h2>
            <div className="mt-2 flex items-center gap-2 text-[#9a8f8a]">
              <MapPin className="h-4 w-4" />
              {country.flag} {user.city}, {country.nameFr}
            </div>
          </div>
          <Link
            href="/mon-profil/modifier"
            className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-sm backdrop-blur-sm transition hover:bg-black/70"
          >
            <Camera className="h-4 w-4" /> Ajouter une photo
          </Link>
        </div>
      </div>

      <section className="premium-card mt-6 p-6 md:p-8">
        <h3 className="mb-4 font-display text-lg font-semibold text-[#c9a962]">À propos de moi</h3>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#6b1d3a]/40 px-3 py-1 text-sm">
            {INTENTION_LABELS[profile.relationship_intention]}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm">{GENDER_LABELS[user.gender]}</span>
        </div>
        {profile.occupation && <p className="mt-3 text-[#c9a962]/90">{profile.occupation}</p>}
        {profile.bio ? (
          <p className="mt-3 leading-relaxed">{profile.bio}</p>
        ) : (
          <p className="mt-3 text-sm italic text-[#9a8f8a]">Ajoutez une bio pour vous présenter.</p>
        )}
        {profile.interests.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.interests.map((i) => (
              <span key={i.id} className="rounded-full border border-white/10 px-3 py-1 text-sm">{i.name}</span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#9a8f8a]">Ajoutez vos centres d&apos;intérêt.</p>
        )}
        <Link href="/mon-profil/modifier" className="mt-5 inline-block">
          <Button variant="outline" size="sm">Compléter mon profil</Button>
        </Link>
      </section>

      <section className="premium-card mt-4 p-6 md:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-[#c9a962]">Ce que je recherche</h3>
          <SlidersHorizontal className="h-5 w-5 text-[#9a8f8a]" />
        </div>
        <div className="space-y-2 text-sm text-[#9a8f8a]">
          <p>Genre : {profile.looking_for_genders.map((g) => GENDER_LABELS[g]).join(", ") || "—"}</p>
          <p>Âge : {profile.min_age} – {profile.max_age} ans</p>
          <p>Distance max : {profile.max_distance_km} km</p>
          {profile.preferred_intentions && profile.preferred_intentions.length > 0 && (
            <p>
              Intentions : {profile.preferred_intentions.map((i) => INTENTION_LABELS[i]).join(", ")}
            </p>
          )}
        </div>
        <Link href="/preferences" className="mt-5 inline-block">
          <Button variant="gold" size="sm">Modifier mes préférences</Button>
        </Link>
      </section>
    </div>
  );
}
