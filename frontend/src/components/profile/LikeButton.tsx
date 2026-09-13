"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { ConnectionState, PublicProfile } from "@/types";
import { Button } from "@/components/ui/Button";
import { MatchModal } from "@/components/discovery/MatchModal";

interface LikeButtonProps {
  profile: PublicProfile;
  onStateChange?: () => void;
  variant?: "gold" | "outline";
  className?: string;
}

function labelForState(state?: ConnectionState): string {
  if (state === "interest_received") return "J'aime en retour";
  return "J'aime";
}

export function LikeButton({ profile, onStateChange, variant = "gold", className }: LikeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchProfile, setMatchProfile] = useState<PublicProfile | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);

  const state = profile.connection_state as ConnectionState | undefined;

  if (state === "connected") return null;

  if (state === "interest_sent") {
    return <p className="text-center text-sm text-[#c9a962]">Intérêt envoyé — en attente de réciprocité</p>;
  }

  const handleLike = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.profiles.like(profile.user_id);
      if (result.is_match && result.match_id) {
        setMatchId(result.match_id);
        setMatchProfile(profile);
      }
      onStateChange?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'envoyer votre intérêt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {state === "interest_received" && (
        <p className="mb-2 text-center text-sm text-[#c9a962]">Cette personne s&apos;intéresse à vous</p>
      )}
      <Button variant={variant} className={className} disabled={loading} onClick={() => void handleLike()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
        {labelForState(state)}
      </Button>
      {error && <p className="mt-2 text-center text-sm text-red-300">{error}</p>}
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
    </>
  );
}
