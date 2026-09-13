"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { AccountType, Gender, Profile, RelationshipIntention } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { INTENTION_LABELS } from "@/lib/constants";
import { InterestSelector } from "@/components/profile/InterestSelector";
import { FantasySelector } from "@/components/profile/FantasySelector";
import { COUNTRIES, defaultTimezoneForCountry } from "@/lib/countries";
import { getPrimaryPhoto } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { PhotoUpload } from "@/components/profile/PhotoUpload";

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [occupation, setOccupation] = useState("");
  const [intention, setIntention] = useState<RelationshipIntention>("friendship");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("CA");
  const [timezone, setTimezone] = useState("America/Toronto");
  const [accountType, setAccountType] = useState<AccountType>("single");
  const [partnerFirstName, setPartnerFirstName] = useState("");
  const [partnerGender, setPartnerGender] = useState<Gender>("male");
  const [partnerDob, setPartnerDob] = useState("");
  const [loading, setLoading] = useState(false);

  const refreshProfile = () => api.profiles.me().then(setProfile);

  useEffect(() => {
    api.profiles.me().then((p) => {
      setProfile(p);
      setDisplayName(p.display_name ?? "");
      setBio(p.bio ?? "");
      setOccupation(p.occupation ?? "");
      setIntention(p.relationship_intention);
      setCity(p.city ?? "");
      setCountry(p.country ?? "CA");
      setTimezone(p.timezone ?? "America/Toronto");
      setAccountType(p.account_type ?? "single");
      setPartnerFirstName(p.partner_first_name ?? "");
      setPartnerGender(p.partner_gender ?? "male");
      setPartnerDob(p.partner_date_of_birth ?? "");
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.profiles.update({
        display_name: displayName.trim() || undefined,
        bio,
        occupation,
        relationship_intention: intention,
        city,
        country,
        timezone,
        account_type: accountType,
        partner_first_name: accountType === "couple" ? partnerFirstName.trim() : null,
        partner_gender: accountType === "couple" ? partnerGender : null,
        partner_date_of_birth: accountType === "couple" ? partnerDob || null : null,
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
        <Input
          label="Nom affiché"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          minLength={2}
          maxLength={50}
          placeholder="Pseudonyme visible publiquement"
        />
        <p className="-mt-2 text-xs text-[#9a8f8a]">Votre prénom réel reste privé. Ce nom apparaît dans la découverte, la recherche et les messages.</p>
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

        <Select label="Type de profil" value={accountType} onChange={(e) => setAccountType(e.target.value as AccountType)}>
          <option value="single">Célibataire</option>
          <option value="couple">Couple</option>
        </Select>
        {accountType === "couple" && (
          <>
            <Input label="Prénom du/de la partenaire" value={partnerFirstName} onChange={(e) => setPartnerFirstName(e.target.value)} />
            <Select label="Genre du/de la partenaire" value={partnerGender} onChange={(e) => setPartnerGender(e.target.value as Gender)}>
              <option value="female">Femme</option>
              <option value="male">Homme</option>
              <option value="non_binary">Non-binaire</option>
              <option value="other">Autre</option>
            </Select>
            <Input label="Date de naissance du/de la partenaire" type="date" value={partnerDob} onChange={(e) => setPartnerDob(e.target.value)} />
          </>
        )}

        <div>
          <label className="mb-2 block text-sm text-[#9a8f8a]">Centres d&apos;intérêt</label>
          <InterestSelector selected={profile.interests} onChange={refreshProfile} />
        </div>

        <div>
          <label className="mb-2 block text-sm text-[#9a8f8a]">Préférences & fantaisies</label>
          <FantasySelector selected={profile.fantasies ?? []} onChange={refreshProfile} />
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="ghost" onClick={() => router.back()}>Annuler</Button>
          <Button variant="gold" onClick={handleSave} loading={loading}>Enregistrer</Button>
        </div>
      </div>
    </div>
  );
}
