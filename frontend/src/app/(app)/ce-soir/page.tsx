"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { Availability, PublicProfile } from "@/types";
import { ProfileCard } from "@/components/discovery/ProfileCard";
import { MatchModal } from "@/components/discovery/MatchModal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function TonightPage() {
  const router = useRouter();
  const [myAvailability, setMyAvailability] = useState<Availability | null>(null);
  const [tonightUsers, setTonightUsers] = useState<PublicProfile[]>([]);
  const [note, setNote] = useState("");
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("23:00");
  const [matchProfile, setMatchProfile] = useState<PublicProfile | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [availList, tonight] = await Promise.all([
        api.availability.me().catch(() => [] as Availability[]),
        api.availability.tonight(),
      ]);
      const avail = availList.find((a) => a.is_available) ?? availList[0] ?? null;
      setMyAvailability(avail);
      setTonightUsers(tonight.users);
      if (avail?.note) setNote(avail.note);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleAvailability = async () => {
    const isAvailable = !myAvailability?.is_available;
    const result = await api.availability.set({
      is_available: isAvailable,
      note: note || undefined,
      start_time: isAvailable ? startTime : undefined,
      end_time: isAvailable ? endTime : undefined,
    });
    setMyAvailability(result);
    await load();
  };

  const handleLike = async (profile: PublicProfile) => {
    const result = await api.profiles.like(profile.user_id);
    if (result.is_match && result.match_id) {
      setMatchProfile(profile);
      setMatchId(result.match_id);
      setTonightUsers((prev) =>
        prev.map((p) => (p.user_id === profile.user_id ? { ...p, connection_state: "connected" } : p)),
      );
      return;
    }
    setTonightUsers((prev) =>
      prev.map((p) => (p.user_id === profile.user_id ? { ...p, connection_state: "interest_sent" } : p)),
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <header className="mb-8 text-center md:text-left">
        <p className="section-label">Fonctionnalité signature</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-wide text-[#c9a962] md:text-4xl">
          CE SOIR
        </h1>
        <p className="mt-2 text-base text-[#9a8f8a] md:text-lg">
          Qui est disponible pour une rencontre aujourd&apos;hui ?
        </p>
      </header>

      <div className="premium-card mb-10 overflow-hidden">
        <div className="bg-gradient-to-r from-[#6b1d3a]/25 to-transparent px-6 py-5 md:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#6b1d3a]/40 ring-1 ring-[#c9a962]/20">
                <Moon className="h-6 w-6 text-[#c9a962]" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">Ma disponibilité</h2>
                <p className="mt-1 text-sm text-[#9a8f8a]">
                  {myAvailability?.is_available
                    ? "Vous êtes visible pour les personnes compatibles ce soir."
                    : "Activez pour apparaître aux autres membres disponibles aujourd'hui."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleAvailability}
              aria-label="Basculer la disponibilité"
              className={`relative h-9 w-16 shrink-0 self-start rounded-full transition-colors duration-300 sm:self-center ${
                myAvailability?.is_available ? "bg-[#6b1d3a]" : "bg-white/10"
              }`}
            >
              <span
                className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  myAvailability?.is_available ? "left-8" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
        {myAvailability?.is_available && (
          <div className="border-t border-white/[0.06] p-6 md:p-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="De" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <Input label="À" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            {myAvailability.availability_label && (
              <p className="text-sm text-[#c9a962]">{myAvailability.availability_label}</p>
            )}
            <Textarea
              label="Note pour les autres (optionnelle)"
              placeholder="Ex. : Centre-ville, café public..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const result = await api.availability.set({
                  is_available: true,
                  note: note || undefined,
                  start_time: startTime,
                  end_time: endTime,
                });
                setMyAvailability(result);
              }}
            >
              Mettre à jour
            </Button>
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[#c9a962]" />
        <h2 className="font-display text-lg font-semibold">
          {tonightUsers.length} personne{tonightUsers.length !== 1 ? "s" : ""} disponible{tonightUsers.length !== 1 ? "s" : ""} ce soir
        </h2>
      </div>

      {tonightUsers.length === 0 ? (
        <EmptyState
          icon={Moon}
          title="Personne de compatible n'est disponible ce soir"
          description="Activez votre disponibilité ou revenez un peu plus tard."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tonightUsers.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              compact
              showActions
              onView={() => router.push(`/profil/${p.id}`)}
              onLike={() => void handleLike(p)}
              likeLabel="J'aime"
              onMeeting={p.is_connected ? () => router.push(`/rendez-vous/nouveau?user=${p.user_id}`) : undefined}
            />
          ))}
        </div>
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
