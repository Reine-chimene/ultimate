"use client";

import Image from "next/image";
import { Briefcase, Check, Eye, Heart, MapPin, Sparkles, X } from "lucide-react";
import type { PublicProfile } from "@/types";
import { INTENTION_LABELS } from "@/lib/constants";
import { OnlineStatus } from "@/components/profile/OnlineStatus";
import { cn, getPrimaryPhoto, profileDisplayName } from "@/lib/utils";

interface ProfileCardProps {
  profile: PublicProfile;
  onLike?: () => void;
  onPass?: () => void;
  onView?: () => void;
  onMeeting?: () => void;
  compact?: boolean;
  showActions?: boolean;
  likeLabel?: string;
}

export function ProfileCard({
  profile,
  onLike,
  onPass,
  onView,
  onMeeting,
  compact,
  showActions = true,
  likeLabel = "J'aime",
}: ProfileCardProps) {
  const photo = getPrimaryPhoto(profile.photos);
  const location = profile.location_label || `${profile.city}, ${profile.country_name} ${profile.country_flag}`;
  const state = profile.connection_state;
  const likeDisabled = state === "interest_sent" || state === "connected";
  const effectiveLikeLabel =
    state === "interest_received" ? "J'aime en retour" : likeLabel;

  return (
    <article
      className={cn(
        "premium-card overflow-hidden animate-fade-in group shadow-[0_20px_60px_rgba(107,29,58,0.15)]",
        compact ? "w-full max-w-xs" : "mx-auto w-full max-w-md",
      )}
    >
      <div
        className="relative aspect-[3/4] cursor-pointer overflow-hidden"
        onClick={onView}
        role={onView ? "button" : undefined}
        tabIndex={onView ? 0 : undefined}
        onKeyDown={(e) => e.key === "Enter" && onView?.()}
      >
        <Image
          src={photo}
          alt={profileDisplayName(profile)}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 420px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/20 to-transparent" />

        {profile.profile_completion_percent != null && profile.profile_completion_percent >= 60 && (
          <div className="absolute right-3 top-3 rounded-full bg-black/55 px-3 py-1.5 text-xs backdrop-blur-md ring-1 ring-[#c9a962]/20">
            Profil {profile.profile_completion_percent}%
          </div>
        )}
        {profile.compatibility_indicators && profile.compatibility_indicators.length > 0 && (
          <div className="absolute right-3 top-12 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] text-[#c9a962] backdrop-blur-md">
            <Sparkles className="h-3 w-3" />
            Compatible
          </div>
        )}

        {profile.is_available_tonight && (
          <div className="absolute left-3 top-3 rounded-full bg-[#6b1d3a]/90 px-3 py-1 text-[11px] font-medium uppercase tracking-wide backdrop-blur-md animate-pulse-soft">
            Ce soir
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
          <h3 className="font-display text-2xl font-semibold md:text-3xl">
            {profileDisplayName(profile)}, {profile.age}
          </h3>
          <OnlineStatus status={profile.online_status} className="mt-1" />
          <div className="mt-1 flex items-center gap-1.5 text-sm text-[#9a8f8a]">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {location}
          </div>
          {profile.occupation && (
            <div className="mt-1 flex items-center gap-1.5 text-sm text-[#c9a962]/90">
              <Briefcase className="h-3.5 w-3.5 shrink-0" />
              {profile.occupation}
            </div>
          )}
          {!compact && profile.bio && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#f5f0e8]/85">{profile.bio}</p>
          )}
          {profile.compatibility_indicators && profile.compatibility_indicators.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {profile.compatibility_indicators.map((indicator) => (
                <span
                  key={indicator}
                  className="inline-flex items-center gap-0.5 rounded-full bg-[#c9a962]/10 px-2 py-0.5 text-[10px] text-[#c9a962]"
                >
                  <Check className="h-2.5 w-2.5" />
                  {indicator}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-[#6b1d3a]/50 px-2.5 py-0.5 text-[11px] font-medium">
              {INTENTION_LABELS[profile.relationship_intention]}
            </span>
            {profile.is_available_tonight && profile.availability_note && (
              <span className="rounded-full bg-[#c9a962]/15 px-2.5 py-0.5 text-[11px] text-[#c9a962]">
                {profile.availability_note}
              </span>
            )}
            {profile.interests.slice(0, compact ? 2 : 3).map((i) => (
              <span key={i.id} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px]">
                {i.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {showActions && (onLike || onPass || onView || onMeeting) && (
        <div className="space-y-3 border-t border-white/[0.06] p-4">
          {(onLike || onPass) && (
            <div className="flex items-center justify-center gap-5">
              {onPass && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onPass(); }}
                  aria-label="Passer"
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] transition hover:border-red-400/40 hover:bg-red-500/10"
                >
                  <X className="h-6 w-6 text-red-300" />
                </button>
              )}
              {onLike && !likeDisabled && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onLike(); }}
                  aria-label={effectiveLikeLabel}
                  className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-gradient-to-br from-[#6b1d3a] to-[#8b2a4d] shadow-lg shadow-[#6b1d3a]/40 ring-2 ring-[#c9a962]/20 transition hover:scale-105 active:scale-95"
                >
                  <Heart className="h-7 w-7 fill-white text-white" />
                </button>
              )}
              {onLike && likeDisabled && (
                <span className="text-center text-xs text-[#c9a962]">
                  {state === "connected" ? "Match" : "Intérêt envoyé"}
                </span>
              )}
            </div>
          )}
          {onLike && !likeDisabled && (
            <p className="text-center text-xs text-[#9a8f8a]">
              {state === "interest_received"
                ? "Cette personne s'intéresse à vous — répondez pour matcher"
                : `${effectiveLikeLabel} — match mutuel requis pour la messagerie`}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            {onView && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onView(); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 py-2.5 text-sm transition hover:bg-white/5"
              >
                <Eye className="h-4 w-4 text-[#c9a962]" />
                Voir le profil
              </button>
            )}
            {onMeeting && profile.is_connected && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMeeting(); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#c9a962]/15 py-2.5 text-sm text-[#c9a962] transition hover:bg-[#c9a962]/25"
              >
                Proposer un rendez-vous
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
