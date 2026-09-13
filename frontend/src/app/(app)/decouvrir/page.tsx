"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import type { DiscoveryMode, Gender, PublicProfile, RelationshipIntention } from "@/types";
import { ProfileCard } from "@/components/discovery/ProfileCard";
import { MatchModal } from "@/components/discovery/MatchModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Input, Select } from "@/components/ui/Input";
import { DISCOVERY_MODE_LABELS, GENDER_LABELS, INTENTION_LABELS } from "@/lib/constants";
import { COUNTRIES } from "@/lib/countries";
import { Compass } from "lucide-react";

export default function DiscoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [matchProfile, setMatchProfile] = useState<PublicProfile | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [likesRemaining, setLikesRemaining] = useState<number | null>(null);

  const [mode, setMode] = useState<DiscoveryMode>(
    (searchParams.get("mode") as DiscoveryMode) || "near_me",
  );
  const [country, setCountry] = useState(searchParams.get("country") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [gender, setGender] = useState<Gender | "">("");
  const [intention, setIntention] = useState<RelationshipIntention | "">("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [availableTonight, setAvailableTonight] = useState(false);
  const [maxDistance, setMaxDistance] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { limit: 20, mode };
      if (country) params.country = country;
      if (city) params.city = city;
      if (gender) params.gender = gender;
      if (intention) params.intention = intention;
      if (minAge) params.min_age = Number(minAge);
      if (maxAge) params.max_age = Number(maxAge);
      if (availableTonight) params.available_tonight = true;
      if (maxDistance) params.max_distance_km = Number(maxDistance);
      const data = await api.discovery.list(params);
      setProfiles(data.profiles);
      setIndex(0);
    } finally {
      setLoading(false);
    }
  }, [mode, country, city, gender, intention, minAge, maxAge, availableTonight, maxDistance]);

  useEffect(() => {
    const c = searchParams.get("country");
    const m = searchParams.get("mode") as DiscoveryMode | null;
    if (c) setCountry(c);
    if (m) setMode(m);
  }, [searchParams]);

  useEffect(() => { load(); }, [load]);

  const current = profiles[index];

  const handlePass = async () => {
    if (!current) return;
    await api.profiles.pass(current.user_id).catch(() => {});
    setIndex((i) => i + 1);
  };

  const handleLike = async () => {
    if (!current) return;
    try {
      const result = await api.profiles.like(current.user_id);
      setLikesRemaining(result.likes_remaining);
      if (result.is_match && result.match_id) {
        setMatchProfile(current);
        setMatchId(result.match_id);
        setProfiles((prev) =>
          prev.map((p, i) => (i === index ? { ...p, connection_state: "connected" } : p)),
        );
        return;
      }
      setProfiles((prev) =>
        prev.map((p, i) => (i === index ? { ...p, connection_state: "interest_sent" } : p)),
      );
      setIndex((i) => i + 1);
    } catch {
      /* error shown via UI if needed */
    }
  };

  if (loading && profiles.length === 0) return <LoadingSpinner />;

  return (
    <div className="w-full">
      <PageHeader
        title="Découvrir"
        subtitle="Rencontrez localement, internationalement ou pendant vos voyages."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(DISCOVERY_MODE_LABELS) as DiscoveryMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              mode === m
                ? "bg-[#6b1d3a] text-[#f5f0e8] ring-1 ring-[#c9a962]/30"
                : "bg-white/5 text-[#9a8f8a] hover:bg-white/10"
            }`}
          >
            {DISCOVERY_MODE_LABELS[m]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="ml-auto flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#c9a962]"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
        </button>
      </div>

      {showFilters && (
        <div className="premium-card mb-6 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select label="Pays" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Tous les pays</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.nameFr}</option>
            ))}
          </Select>
          <Input label="Ville" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex. Paris, Montréal..." />
          <Select label="Genre" value={gender} onChange={(e) => setGender(e.target.value as Gender | "")}>
            <option value="">Tous</option>
            {(Object.keys(GENDER_LABELS) as Gender[]).map((g) => (
              <option key={g} value={g}>{GENDER_LABELS[g]}</option>
            ))}
          </Select>
          <Select label="Intention" value={intention} onChange={(e) => setIntention(e.target.value as RelationshipIntention | "")}>
            <option value="">Toutes</option>
            {(Object.keys(INTENTION_LABELS) as RelationshipIntention[]).map((i) => (
              <option key={i} value={i}>{INTENTION_LABELS[i]}</option>
            ))}
          </Select>
          <Select label="Âge min" value={minAge} onChange={(e) => setMinAge(e.target.value)}>
            <option value="">—</option>
            {[22, 25, 28, 30, 35, 40].map((a) => <option key={a} value={a}>{a} ans</option>)}
          </Select>
          <Select label="Âge max" value={maxAge} onChange={(e) => setMaxAge(e.target.value)}>
            <option value="">—</option>
            {[30, 35, 40, 45, 50, 55].map((a) => <option key={a} value={a}>{a} ans</option>)}
          </Select>
          <Select label="Distance max (km)" value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)}>
            <option value="">—</option>
            {[25, 50, 100, 200, 500].map((d) => <option key={d} value={d}>{d} km</option>)}
          </Select>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={availableTonight}
              onChange={(e) => setAvailableTonight(e.target.checked)}
              className="accent-[#c9a962]"
            />
            Disponible ce soir uniquement
          </label>
          <button type="button" onClick={load} className="rounded-full bg-[#c9a962]/20 px-4 py-2 text-sm text-[#c9a962] sm:col-span-3">
            Appliquer les filtres
          </button>
        </div>
      )}

      {!current ? (
        <>
          <EmptyState
            icon={Compass}
            title="Plus de profils pour le moment"
            description="Essayez le mode International, changez de pays ou ajustez vos filtres."
            actionLabel="Mode International"
            actionHref="/decouvrir?mode=international"
          />
          <div className="mt-4 text-center">
            <button type="button" onClick={load} className="inline-flex items-center gap-2 text-sm text-[#c9a962] hover:underline">
              <RefreshCw className="h-4 w-4" /> Actualiser
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-center px-0 sm:px-4">
            <ProfileCard
              profile={current}
              onLike={() => void handleLike()}
              onPass={() => void handlePass()}
              onView={() => router.push(`/profil/${current.id}`)}
              likeLabel="J'aime"
            />
          </div>
          <p className="mt-5 text-center text-sm text-[#9a8f8a]">
            {index + 1} sur {profiles.length} profils
            {likesRemaining != null && ` · ${likesRemaining} interactions restantes aujourd'hui`}
          </p>
        </>
      )}

      {matchProfile && matchId && (
        <MatchModal
          profile={matchProfile}
          onClose={() => {
            setMatchProfile(null);
            setMatchId(null);
          }}
          onMessage={() => router.push(`/messages/${matchId}`)}
        />
      )}
    </div>
  );
}
