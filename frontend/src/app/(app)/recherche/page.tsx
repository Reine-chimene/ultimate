"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { DiscoveryMode, Gender, PublicProfile, RelationshipIntention } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { ProfileCard } from "@/components/discovery/ProfileCard";
import { Input, Select } from "@/components/ui/Input";
import { DISCOVERY_MODE_LABELS, GENDER_LABELS, INTENTION_LABELS, INTEREST_CATEGORY_LABELS } from "@/lib/constants";
import { COUNTRIES } from "@/lib/countries";

export default function SearchPage() {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [premiumError, setPremiumError] = useState<string | null>(null);

  const [mode, setMode] = useState<DiscoveryMode>("near_me");
  const [gender, setGender] = useState<Gender | "">("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [intention, setIntention] = useState<RelationshipIntention | "">("");
  const [availableTonight, setAvailableTonight] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState("");
  const [interestCategory, setInterestCategory] = useState("");

  const runSearch = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    setPremiumError(null);
    try {
      const params: Record<string, string | number | boolean> = {
        page: pageNum,
        page_size: 12,
        mode,
      };
      if (gender) params.gender = gender;
      if (minAge) params.min_age = Number(minAge);
      if (maxAge) params.max_age = Number(maxAge);
      if (country) params.country = country;
      if (city) params.city = city;
      if (intention) params.intention = intention;
      if (availableTonight) params.available_tonight = true;
      if (hasPhoto) params.has_photo = true;
      if (onlineOnly) params.online_only = true;
      if (maxDistance) params.max_distance_km = Number(maxDistance);
      if (interestCategory) params.interest_category = interestCategory;

      const data = await api.search.query(params);
      setProfiles(append ? (prev) => [...prev, ...data.profiles] : data.profiles);
      setHasMore(data.has_more);
      setPage(pageNum);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setPremiumError(err.message);
      }
      if (!append) setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [mode, gender, minAge, maxAge, country, city, intention, availableTonight, hasPhoto, onlineOnly, maxDistance, interestCategory]);

  useEffect(() => {
    void runSearch(1, false);
  }, [runSearch]);

  return (
    <div>
      <PageHeader
        title="Recherche"
        subtitle="Trouvez des profils compatibles avec des critères précis."
      />

      <div className="premium-card mb-6 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Select label="Mode" value={mode} onChange={(e) => setMode(e.target.value as DiscoveryMode)}>
          {(Object.keys(DISCOVERY_MODE_LABELS) as DiscoveryMode[]).map((m) => (
            <option key={m} value={m}>{DISCOVERY_MODE_LABELS[m]}</option>
          ))}
        </Select>
        <Select label="Genre" value={gender} onChange={(e) => setGender(e.target.value as Gender | "")}>
          <option value="">Tous</option>
          {(Object.keys(GENDER_LABELS) as Gender[]).map((g) => (
            <option key={g} value={g}>{GENDER_LABELS[g]}</option>
          ))}
        </Select>
        <Input label="Ville" value={city} onChange={(e) => setCity(e.target.value)} />
        <Select label="Pays" value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="">Tous</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.flag} {c.nameFr}</option>
          ))}
        </Select>
        <Select label="Âge min" value={minAge} onChange={(e) => setMinAge(e.target.value)}>
          <option value="">—</option>
          {[22, 25, 28, 30, 35, 40].map((a) => <option key={a} value={a}>{a}</option>)}
        </Select>
        <Select label="Âge max" value={maxAge} onChange={(e) => setMaxAge(e.target.value)}>
          <option value="">—</option>
          {[30, 35, 40, 45, 50].map((a) => <option key={a} value={a}>{a}</option>)}
        </Select>
        <Select label="Intention" value={intention} onChange={(e) => setIntention(e.target.value as RelationshipIntention | "")}>
          <option value="">Toutes</option>
          {(Object.keys(INTENTION_LABELS) as RelationshipIntention[]).map((i) => (
            <option key={i} value={i}>{INTENTION_LABELS[i]}</option>
          ))}
        </Select>
        <Input label="Distance max (km) — Premium" type="number" min={1} max={500} value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)} placeholder="Ex. 50" />
        <Select label="Catégorie d'intérêt — Premium" value={interestCategory} onChange={(e) => setInterestCategory(e.target.value)}>
          <option value="">Toutes</option>
          {Object.entries(INTEREST_CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={availableTonight} onChange={(e) => setAvailableTonight(e.target.checked)} className="accent-[#c9a962]" />
          Disponible ce soir
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={hasPhoto} onChange={(e) => setHasPhoto(e.target.checked)} className="accent-[#c9a962]" />
          Avec photo <span className="text-[#c9a962]">Premium</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} className="accent-[#c9a962]" />
          Actif·ve récemment <span className="text-[#c9a962]">Premium</span>
        </label>
        <button
          type="button"
          onClick={() => void runSearch(1, false)}
          className="rounded-full bg-[#c9a962]/20 px-4 py-2 text-sm text-[#c9a962] sm:col-span-3"
        >
          Rechercher
        </button>
      </div>

      {premiumError && <div className="mb-6"><PremiumGate message={premiumError} /></div>}

      {loading && profiles.length === 0 ? (
        <LoadingSpinner />
      ) : profiles.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="Aucun résultat"
          description="Élargissez vos critères ou essayez un autre mode."
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <ProfileCard
                key={p.id}
                profile={p}
                compact
                showActions={false}
                onView={() => window.location.assign(`/profil/${p.id}`)}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                type="button"
                disabled={loading}
                onClick={() => void runSearch(page + 1, true)}
                className="rounded-full border border-[#c9a962]/30 px-6 py-2 text-sm text-[#c9a962]"
              >
                Charger plus
              </button>
            </div>
          )}
        </>
      )}

      <p className="mt-8 text-center text-xs text-[#9a8f8a]">
        <Link href="/premium" className="text-[#c9a962] hover:underline">Premium</Link>
        {" "}débloque la recherche avancée, le mode Voyage et le mode Incognito.
      </p>
    </div>
  );
}
