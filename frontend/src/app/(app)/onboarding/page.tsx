"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Gender, Profile, RelationshipIntention } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { INTENTION_LABELS } from "@/lib/constants";
import { ProfileCompletionBar } from "@/components/profile/ProfileCompletionBar";
import { PhotoUpload } from "@/components/profile/PhotoUpload";
import type { ProfileCompletion } from "@/types";
import { getPrimaryPhoto } from "@/lib/utils";

const STEPS = [
  "Parlez-nous de vous",
  "Ajoutez une photo",
  "Ce que vous recherchez",
  "Votre intention",
  "Vos centres d'intérêt",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);
  const [interestInput, setInterestInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.onboarding_completed) {
      router.replace("/decouvrir");
      return;
    }
    Promise.all([api.profiles.me(), api.profiles.completion()])
      .then(([p, c]) => {
        setProfile(p);
        setCompletion(c);
      })
      .catch(() => {});
  }, [user, router]);

  if (!user || !profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9a962] border-t-transparent" />
      </div>
    );
  }

  const refresh = async () => {
    const [p, c] = await Promise.all([api.profiles.me(), api.profiles.completion()]);
    setProfile(p);
    setCompletion(c);
  };

  const finish = async () => {
    setSaving(true);
    try {
      await api.auth.completeOnboarding();
      await refreshUser();
      router.push("/decouvrir");
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    if (step >= STEPS.length - 1) {
      await finish();
      return;
    }
    setStep((s) => s + 1);
    await refresh();
  };

  return (
    <div className="mx-auto max-w-lg py-6">
      <p className="section-label">Étape {step + 1} / {STEPS.length}</p>
      <h1 className="mt-2 font-display text-2xl font-bold">{STEPS[step]}</h1>
      {completion && step > 0 && (
        <div className="mt-4">
          <ProfileCompletionBar completion={completion} />
        </div>
      )}

      <div className="premium-card mt-6 space-y-4 p-6">
        {step === 0 && (
          <>
            <Input label="Prénom" value={user.first_name} disabled />
            <p className="text-sm text-[#9a8f8a]">
              {user.city}, {user.country} — modifiable plus tard dans votre profil.
            </p>
          </>
        )}

        {step === 1 && (
          <PhotoUpload
            isPrimary
            label="Ajouter une photo"
            previewUrl={profile.photos.length > 0 ? getPrimaryPhoto(profile.photos) : null}
            onProfileRefresh={refresh}
          />
        )}

        {step === 2 && (
          <Select
            label="Genre recherché"
            value={profile.looking_for_genders[0] ?? "female"}
            onChange={async (e) => {
              const g = e.target.value;
              const looking: Gender[] =
                g === "both" ? ["male", "female"] : [g as Gender];
              await api.profiles.updatePreferences({ looking_for_genders: looking });
              await refresh();
            }}
          >
            <option value="male">Hommes</option>
            <option value="female">Femmes</option>
            <option value="both">Les deux</option>
          </Select>
        )}

        {step === 3 && (
          <Select
            label="Intention"
            value={profile.relationship_intention}
            onChange={async (e) => {
              await api.profiles.update({ relationship_intention: e.target.value as RelationshipIntention });
              await refresh();
            }}
          >
            {Object.entries(INTENTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        )}

        {step === 4 && (
          <>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((i) => (
                <span key={i.id} className="rounded-full bg-white/10 px-3 py-1 text-sm">{i.name}</span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ex. : Voyage, cuisine..."
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={async () => {
                  if (!interestInput.trim()) return;
                  await api.profiles.addInterest(interestInput.trim());
                  setInterestInput("");
                  await refresh();
                }}
              >
                Ajouter
              </Button>
            </div>
            <p className="text-xs text-[#9a8f8a]">Sélectionnez au moins 3 intérêts.</p>
          </>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} className="flex-1">
            Retour
          </Button>
        )}
        <Button variant="gold" onClick={next} disabled={saving} className="flex-1">
          {step === STEPS.length - 1 ? "Découvrir" : "Continuer"}
        </Button>
      </div>
    </div>
  );
}
