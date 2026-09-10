"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { PublicProfile } from "@/types";
import { ProfileCard } from "@/components/discovery/ProfileCard";
import { MatchModal } from "@/components/discovery/MatchModal";

export default function DiscoverPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchProfile, setMatchProfile] = useState<PublicProfile | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.discovery.list({ limit: 20 });
      setProfiles(data.profiles);
      setIndex(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const current = profiles[index];

  const handleAction = async (isLike: boolean) => {
    if (!current) return;
    try {
      const result = await api.likes.action(current.user_id, isLike);
      if (result.is_match && isLike) {
        setMatchProfile(current);
        setMatchId(result.match_id);
      }
      setIndex((i) => i + 1);
    } catch {
      setIndex((i) => i + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9a962] border-t-transparent" />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="text-center py-20">
        <h1 className="font-display text-2xl font-semibold">Plus de profils pour le moment</h1>
        <p className="mt-2 text-[#9a8f8a]">Revenez plus tard ou ajustez vos préférences.</p>
        <button onClick={load} className="mt-4 text-[#c9a962] hover:underline">Actualiser</button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="font-display text-xl font-semibold mb-4 lg:hidden">Découvrir</h1>
      <h1 className="font-display text-2xl font-semibold mb-6 hidden lg:block">Découvrir</h1>
      <div className="flex justify-center w-full px-0 sm:px-4">
        <ProfileCard
          profile={current}
          onLike={() => handleAction(true)}
          onPass={() => handleAction(false)}
          onView={() => router.push(`/profil/${current.id}`)}
        />
      </div>
      <p className="mt-4 text-center text-sm text-[#9a8f8a]">
        {index + 1} / {profiles.length} profils
      </p>

      {matchProfile && (
        <MatchModal
          profile={matchProfile}
          onClose={() => { setMatchProfile(null); setMatchId(null); }}
          onMessage={() => {
            if (matchId) router.push(`/messages/${matchId}`);
            setMatchProfile(null);
          }}
        />
      )}
    </div>
  );
}
