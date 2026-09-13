"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Globe2, Moon, Sparkles, Users } from "lucide-react";
import { api } from "@/lib/api";
import { TONIGHT_INTENT_CHIPS } from "@/lib/constants";
import type { Availability, PublicProfile, TonightAvailability } from "@/types";
import { ProfileCard } from "@/components/discovery/ProfileCard";
import { MatchModal } from "@/components/discovery/MatchModal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function TonightPage() {
  const router = useRouter();
  const [myAvailability, setMyAvailability] = useState<Availability | null>(null);
  const [tonight, setTonight] = useState<TonightAvailability | null>(null);
  const [note, setNote] = useState("");
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("23:00");
  const [matchProfile, setMatchProfile] = useState<PublicProfile | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [availList, tonightData] = await Promise.all([
        api.availability.me().catch(() => [] as Availability[]),
        api.availability.tonight(),
      ]);
      const avail = availList.find((a) => a.is_available) ?? availList[0] ?? null;
      setMyAvailability(avail);
      setTonight(tonightData);
      if (avail?.note) setNote(avail.note);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const tonightUsers = tonight?.users ?? [];

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

  const applyIntent = (intent: string) => {
    setNote(intent);
  };

  const handleLike = async (profile: PublicProfile) => {
    const result = await api.profiles.like(profile.user_id);
    if (result.is_match && result.match_id) {
      setMatchProfile(profile);
      setMatchId(result.match_id);
      setTonight((prev) =>
        prev
          ? {
              ...prev,
              users: prev.users.map((p) =>
                p.user_id === profile.user_id ? { ...p, connection_state: "connected" } : p,
              ),
            }
          : prev,
      );
      return;
    }
    setTonight((prev) =>
      prev
        ? {
            ...prev,
            users: prev.users.map((p) =>
              p.user_id === profile.user_id ? { ...p, connection_state: "interest_sent" } : p,
            ),
          }
        : prev,
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
          Qui est chaud·e pour une rencontre aujourd&apos;hui ? Parcourez, likez, connectez.
        </p>
      </header>

      {/* Stats — activité en direct */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <div className="premium-card flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6b1d3a]/40">
            <Users className="h-5 w-5 text-[#c9a962]" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-[#f5f0e8]">
              {tonight?.total_available ?? 0}
            </p>
            <p className="text-xs text-[#9a8f8a]">membres dispo ce soir</p>
          </div>
        </div>
        <div className="premium-card flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6b1d3a]/40">
            <Flame className="h-5 w-5 text-[#c9a962]" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-[#f5f0e8]">
              {tonight?.compatible_available ?? tonightUsers.length}
            </p>
            <p className="text-xs text-[#9a8f8a]">compatibles pour vous</p>
          </div>
        </div>
        <div className="premium-card flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6b1d3a]/40">
            <Globe2 className="h-5 w-5 text-[#c9a962]" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-[#f5f0e8]">
              {tonight?.in_your_country ?? 0}
            </p>
            <p className="text-xs text-[#9a8f8a]">dans votre pays</p>
          </div>
        </div>
      </div>

      {/* Qui est dispo — en premier */}
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[#c9a962]" />
        <h2 className="font-display text-lg font-semibold">
          {tonightUsers.length} personne{tonightUsers.length !== 1 ? "s" : ""} prête
          {tonightUsers.length !== 1 ? "s" : ""} ce soir
        </h2>
      </div>

      {tonightUsers.length === 0 ? (
        <EmptyState
          icon={Moon}
          title="Personne de compatible n'est disponible pour l'instant"
          description="Soyez le premier·e à vous afficher — activez votre disponibilité ci-dessous et attirez les curieux·ses."
        />
      ) : (
        <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Ma disponibilité — enrichie */}
      <div className="premium-card overflow-hidden">
        <div className="bg-gradient-to-r from-[#6b1d3a]/25 to-transparent px-6 py-5 md:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#6b1d3a]/40 ring-1 ring-[#c9a962]/20">
                <Moon className="h-6 w-6 text-[#c9a962]" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold">Affichez-vous ce soir</h2>
                <p className="mt-1 text-sm text-[#9a8f8a]">
                  {myAvailability?.is_available
                    ? "Vous êtes visible — les membres compatibles voient votre intention."
                    : "Activez pour apparaître dans la liste. Plus c'est clair, plus ça matche."}
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

        <div className="border-t border-white/[0.06] p-6 md:p-8 space-y-5">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#c9a962]">
              Votre intention ce soir
            </p>
            <div className="flex flex-wrap gap-2">
              {TONIGHT_INTENT_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => applyIntent(chip)}
                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                    note === chip
                      ? "bg-[#6b1d3a] text-[#f5f0e8] ring-1 ring-[#c9a962]/40"
                      : "bg-white/5 text-[#9a8f8a] hover:bg-white/10 hover:text-[#f5f0e8]"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {myAvailability?.is_available && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="De" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                <Input label="À" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
              {myAvailability.availability_label && (
                <p className="text-sm text-[#c9a962]">{myAvailability.availability_label}</p>
              )}
            </>
          )}

          <Textarea
            label="Message pour attirer l'attention (optionnel)"
            placeholder="Ex. : Centre-ville, verre puis on verra… · Hôtel dispo · Couple cherche…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />

          {myAvailability?.is_available && (
            <Button
              variant="gold"
              size="sm"
              onClick={async () => {
                const result = await api.availability.set({
                  is_available: true,
                  note: note || undefined,
                  start_time: startTime,
                  end_time: endTime,
                });
                setMyAvailability(result);
                await load();
              }}
            >
              Mettre à jour mon statut
            </Button>
          )}
        </div>
      </div>

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
