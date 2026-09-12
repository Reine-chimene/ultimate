"use client";

import Image from "next/image";
import { Heart, Sparkles } from "lucide-react";
import type { PublicProfile } from "@/types";
import { Button } from "@/components/ui/Button";
import { getPrimaryPhoto } from "@/lib/utils";

interface MatchModalProps {
  profile: PublicProfile;
  onClose: () => void;
  onMessage: () => void;
}

export function MatchModal({ profile, onClose, onMessage }: MatchModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="premium-card relative w-full max-w-md overflow-hidden p-8 text-center animate-slide-up">
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#6b1d3a]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-[#c9a962]/15 blur-3xl" />

        <div className="relative">
          <Sparkles className="mx-auto h-10 w-10 text-[#c9a962]" />
          <p className="section-label mt-4">Nouvelle connexion</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-gradient-gold md:text-4xl">
            C&apos;est un match !
          </h2>
          <p className="mt-3 text-sm text-[#9a8f8a]">
            Vous et {profile.first_name} vous êtes mutuellement intéressés.
            <br />
            Une belle occasion de faire connaissance.
          </p>

          <div className="relative mx-auto mt-8 h-36 w-36">
            <div className="absolute inset-0 animate-pulse-soft rounded-full bg-[#c9a962]/20" />
            <div className="relative h-full w-full overflow-hidden rounded-full ring-4 ring-[#c9a962]/50 ring-offset-4 ring-offset-[#1a1218]">
              <Image
                src={getPrimaryPhoto(profile.photos)}
                alt={profile.first_name}
                fill
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#6b1d3a] ring-2 ring-[#1a1218]">
              <Heart className="h-5 w-5 fill-white text-white" />
            </div>
          </div>

          <p className="mt-5 text-xl font-medium">
            {profile.first_name}, {profile.age}
          </p>
          <p className="text-sm text-[#9a8f8a]">{profile.city}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Continuer à découvrir
            </Button>
            <Button variant="gold" className="flex-1" onClick={onMessage}>
              Envoyer un message
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
