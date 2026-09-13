"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Eye, Heart, MessageCircle, Sparkles, UserPlus, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Match, PendingRequestItem } from "@/types";
import { getPrimaryPhoto, formatDate, profileDisplayName } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { MatchModal } from "@/components/discovery/MatchModal";

type Tab = "interests_received" | "interests_sent" | "requests_received" | "requests_sent" | "connections";
type InterestItem = { user_id: string; profile: PendingRequestItem["profile"]; created_at: string };

export default function MatchesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("interests_received");
  const [matches, setMatches] = useState<Match[]>([]);
  const [interestsReceived, setInterestsReceived] = useState<InterestItem[]>([]);
  const [interestsSent, setInterestsSent] = useState<InterestItem[]>([]);
  const [received, setReceived] = useState<PendingRequestItem[]>([]);
  const [sent, setSent] = useState<PendingRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchProfile, setMatchProfile] = useState<PendingRequestItem["profile"] | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [likesRemaining, setLikesRemaining] = useState<number | null>(null);
  const [requestsRemaining, setRequestsRemaining] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [matchList, pending, likesIn, likesOut] = await Promise.all([
        api.matches.list(),
        api.connections.pending(),
        api.profiles.likesReceived(),
        api.profiles.likesSent(),
      ]);
      setMatches(matchList);
      setReceived(pending.received);
      setSent(pending.sent);
      setInterestsReceived(likesIn.received);
      setInterestsSent(likesOut.sent);
      setLikesRemaining(likesIn.likes_remaining ?? null);
      setRequestsRemaining(pending.requests_remaining ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAccept = async (item: PendingRequestItem) => {
    const result = await api.connections.accept(item.user_id);
    if (result.match_id) {
      setMatchProfile(item.profile);
      setMatchId(result.match_id);
    }
    await load();
  };

  const handleReject = async (item: PendingRequestItem) => {
    await api.connections.decline(item.user_id);
    await load();
  };

  const handleInterestBack = async (item: InterestItem) => {
    const result = await api.profiles.like(item.user_id);
    if (result.is_match && result.match_id) {
      setMatchProfile(item.profile);
      setMatchId(result.match_id);
    }
    await load();
  };

  if (loading) return <LoadingSpinner />;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "interests_received", label: "Intérêts reçus", count: interestsReceived.length },
    { id: "interests_sent", label: "Intérêts envoyés", count: interestsSent.length },
    { id: "connections", label: "Matchs", count: matches.length },
    { id: "requests_received", label: "Demandes reçues", count: received.length },
    { id: "requests_sent", label: "Demandes envoyées", count: sent.length },
  ];

  return (
    <div>
      <PageHeader
        title="Matchs & connexions"
        subtitle="J'aime → intérêt réciproque → match → message. Les demandes de connexion restent disponibles en parallèle."
      />

      <Link
        href="/visiteurs"
        className="premium-card mb-6 flex items-center gap-3 p-4 transition hover:bg-white/[0.03]"
      >
        <Eye className="h-5 w-5 shrink-0 text-[#c9a962]" />
        <div>
          <p className="font-medium">Visiteurs de profil</p>
          <p className="text-sm text-[#9a8f8a]">Voir qui a consulté votre profil récemment</p>
        </div>
      </Link>

      {likesRemaining != null && (
        <p className="mb-2 text-sm text-[#9a8f8a]">
          {likesRemaining > 0
            ? `${likesRemaining} interaction${likesRemaining > 1 ? "s" : ""} restante${likesRemaining > 1 ? "s" : ""} aujourd'hui`
            : "Limite quotidienne atteinte — Passez à Premium pour plus d'interactions."}
        </p>
      )}
      {requestsRemaining != null && received.length + sent.length > 0 && (
        <p className="mb-4 text-sm text-[#9a8f8a]">
          {requestsRemaining > 0
            ? `${requestsRemaining} demande${requestsRemaining > 1 ? "s" : ""} de connexion restante${requestsRemaining > 1 ? "s" : ""}`
            : "Limite de demandes de connexion atteinte."}
        </p>
      )}

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map(({ id, label, count }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
              tab === id
                ? "bg-[#6b1d3a] text-[#f5f0e8] ring-1 ring-[#c9a962]/30"
                : "bg-white/5 text-[#9a8f8a] hover:bg-white/10"
            }`}
          >
            {label} {count > 0 && <span className="ml-1 text-[#c9a962]">({count})</span>}
          </button>
        ))}
      </div>

      {tab === "interests_received" && (
        interestsReceived.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Aucun intérêt reçu"
            description="Quand quelqu'un vous aime, son profil apparaît ici. Répondez par un J'aime pour créer un match."
            actionLabel="Découvrir des profils"
            actionHref="/decouvrir"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {interestsReceived.map((item) => (
              <InterestCard
                key={item.user_id}
                item={item}
                badge="Intéressé·e par vous"
                actionLabel="J'aime en retour"
                onAction={() => handleInterestBack(item)}
                onView={() => router.push(`/profil/${item.profile.id}`)}
              />
            ))}
          </div>
        )
      )}

      {tab === "interests_sent" && (
        interestsSent.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Aucun intérêt envoyé"
            description="Exprimez votre intérêt via Découvrir, Recherche ou Ce soir."
            actionLabel="Découvrir"
            actionHref="/decouvrir"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {interestsSent.map((item) => (
              <InterestCard
                key={item.user_id}
                item={item}
                badge="En attente de réponse"
                actionLabel="Voir le profil"
                onAction={() => router.push(`/profil/${item.profile.id}`)}
                onView={() => router.push(`/profil/${item.profile.id}`)}
              />
            ))}
          </div>
        )
      )}

      {tab === "requests_received" && (
        received.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="Aucune demande reçue"
            description="Les demandes de connexion avec message apparaissent ici (mode hybride)."
            actionLabel="Découvrir des profils"
            actionHref="/decouvrir"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {received.map((item) => (
              <PendingCard
                key={item.user_id}
                item={item}
                onAccept={() => handleAccept(item)}
                onReject={() => handleReject(item)}
                onView={() => router.push(`/profil/${item.profile.id}`)}
              />
            ))}
          </div>
        )
      )}

      {tab === "requests_sent" && (
        sent.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Aucune demande en attente"
            description="Les demandes de connexion avec message apparaissent ici."
            actionLabel="Découvrir"
            actionHref="/decouvrir"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sent.map((item) => (
              <article key={item.user_id} className="premium-card overflow-hidden">
                <div className="relative h-40">
                  <Image
                    src={getPrimaryPhoto(item.profile.photos)}
                    alt={profileDisplayName(item.profile)}
                    fill
                    className="object-cover"
                    sizes="320px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wide backdrop-blur-sm">
                    Demande envoyée
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-semibold">
                    {profileDisplayName(item.profile)}, {item.profile.age}
                  </h3>
                  <p className="text-sm text-[#9a8f8a]">{item.profile.location_label}</p>
                  <Link href={`/profil/${item.profile.id}`} className="mt-3 block">
                    <Button variant="outline" size="sm" className="w-full">Voir le profil</Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )
      )}

      {tab === "connections" && (
        matches.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Aucune connexion pour le moment"
            description="Acceptez une demande ou attendez qu'une personne réponde à la vôtre."
            actionLabel="Voir les demandes"
            actionHref="/decouvrir"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => {
              const other = m.other_user;
              if (!other) return null;
              return (
                <article key={m.id} className="premium-card overflow-hidden animate-fade-in">
                  <div className="relative h-52">
                    <Image
                      src={getPrimaryPhoto(other.photos)}
                      alt={profileDisplayName(other)}
                      fill
                      className="object-cover"
                      sizes="320px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent" />
                    {other.compatibility_score != null && other.compatibility_score > 0 && (
                      <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-[#c9a962] backdrop-blur-sm">
                        <Sparkles className="h-3 w-3" />
                        {Math.round(other.compatibility_score)}%
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-xl font-semibold">
                      {profileDisplayName(other)}, {other.age}
                    </h3>
                    <p className="text-sm text-[#9a8f8a]">{other.location_label || other.city}</p>
                    <p className="mt-1 text-xs text-[#9a8f8a]/80">
                      Connecté·e le {formatDate(m.matched_at)}
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Link href={`/messages/${m.id}`} className="flex-1">
                        <Button variant="gold" size="sm" className="w-full">
                          <MessageCircle className="h-4 w-4" />
                          Message
                        </Button>
                      </Link>
                      <Link href={`/profil/${other.id}`}>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          Profil
                        </Button>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )
      )}

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

function InterestCard({
  item,
  badge,
  actionLabel,
  onAction,
  onView,
}: {
  item: InterestItem;
  badge: string;
  actionLabel: string;
  onAction: () => void;
  onView: () => void;
}) {
  const p = item.profile;
  return (
    <article className="premium-card overflow-hidden">
      <div className="relative h-44 cursor-pointer" onClick={onView}>
        <Image
          src={getPrimaryPhoto(p.photos)}
          alt={profileDisplayName(p)}
          fill
          className="object-cover"
          sizes="320px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wide backdrop-blur-sm">
          {badge}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold">{profileDisplayName(p)}, {p.age}</h3>
        <p className="text-sm text-[#9a8f8a]">{p.location_label}</p>
        <Button variant="gold" size="sm" className="mt-4 w-full" onClick={onAction}>
          <Heart className="h-4 w-4" /> {actionLabel}
        </Button>
      </div>
    </article>
  );
}

function PendingCard({
  item,
  onAccept,
  onReject,
  onView,
}: {
  item: PendingRequestItem;
  onAccept: () => void;
  onReject: () => void;
  onView: () => void;
}) {
  const p = item.profile;
  return (
    <article className="premium-card overflow-hidden">
      <div className="relative h-44 cursor-pointer" onClick={onView}>
        <Image
          src={getPrimaryPhoto(p.photos)}
          alt={profileDisplayName(p)}
          fill
          className="object-cover"
          sizes="320px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] to-transparent" />
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold">{profileDisplayName(p)}, {p.age}</h3>
        <p className="text-sm text-[#9a8f8a]">{p.location_label}</p>
        {item.intro_message && (
          <div className="mt-3 rounded-lg bg-white/[0.03] p-3">
            <p className="text-xs uppercase tracking-wide text-[#9a8f8a]">Pourquoi cette demande ?</p>
            <p className="mt-1 text-sm italic text-[#f5f0e8]/90">&ldquo;{item.intro_message}&rdquo;</p>
          </div>
        )}
        {p.compatibility_indicators && p.compatibility_indicators.length > 0 && (
          <p className="mt-1 text-xs text-[#c9a962]">
            Compatible : {p.compatibility_indicators.slice(0, 3).join(" · ")}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <Button variant="gold" size="sm" className="flex-1" onClick={onAccept}>
            <Heart className="h-4 w-4" /> Accepter
          </Button>
          <Button variant="ghost" size="sm" onClick={onReject}>
            <X className="h-4 w-4" /> Refuser
          </Button>
        </div>
      </div>
    </article>
  );
}
