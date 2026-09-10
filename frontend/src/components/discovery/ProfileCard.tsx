"use client";

import Image from "next/image";
import { Heart, MapPin, Sparkles, X } from "lucide-react";
import type { PublicProfile } from "@/types";
import { INTENTION_LABELS } from "@/lib/constants";
import { cn, getPrimaryPhoto } from "@/lib/utils";

interface ProfileCardProps {
  profile: PublicProfile;
  onLike?: () => void;
  onPass?: () => void;
  onView?: () => void;
  compact?: boolean;
}

export function ProfileCard({ profile, onLike, onPass, onView, compact }: ProfileCardProps) {
  const photo = getPrimaryPhoto(profile.photos);

  return (
    <div
      className={cn(
        "glass-card overflow-hidden animate-fade-in cursor-pointer group",
        compact ? "max-w-xs w-full" : "w-full max-w-sm mx-auto",
      )}
      onClick={onView}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={photo}
          alt={profile.first_name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 400px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {profile.compatibility_score != null && (
          <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-sm backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#c9a962]" />
            <span className="text-[#c9a962] font-medium">{Math.round(profile.compatibility_score)}%</span>
          </div>
        )}

        {profile.is_available_tonight && (
          <div className="absolute top-4 left-4 rounded-full bg-[#6b1d3a]/90 px-3 py-1 text-xs font-medium backdrop-blur-sm animate-pulse-soft">
            Disponible ce soir
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-2xl font-display font-semibold">
            {profile.first_name}, {profile.age}
          </h3>
          <div className="mt-1 flex items-center gap-1 text-sm text-[#9a8f8a]">
            <MapPin className="h-3.5 w-3.5" />
            {profile.city}
          </div>
          {!compact && profile.bio && (
            <p className="mt-2 line-clamp-2 text-sm text-[#f5f0e8]/80">{profile.bio}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-[#6b1d3a]/40 px-2.5 py-0.5 text-xs">
              {INTENTION_LABELS[profile.relationship_intention]}
            </span>
            {profile.interests.slice(0, 3).map((i) => (
              <span key={i.id} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">
                {i.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {(onLike || onPass) && (
        <div className="flex items-center justify-center gap-6 p-4">
          {onPass && (
            <button
              onClick={(e) => { e.stopPropagation(); onPass(); }}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-red-500/20 hover:border-red-500/30"
            >
              <X className="h-6 w-6 text-red-400" />
            </button>
          )}
          {onLike && (
            <button
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#6b1d3a] to-[#8b2a4d] shadow-lg shadow-[#6b1d3a]/30 transition hover:scale-105"
            >
              <Heart className="h-7 w-7 fill-white text-white" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
