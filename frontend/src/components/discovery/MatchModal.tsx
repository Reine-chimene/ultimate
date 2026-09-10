"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card mx-4 max-w-md p-8 text-center animate-slide-up">
        <Sparkles className="mx-auto h-10 w-10 text-[#c9a962]" />
        <h2 className="mt-4 font-display text-3xl font-bold text-gradient-gold">C&apos;est un match !</h2>
        <p className="mt-2 text-[#9a8f8a]">
          Vous et {profile.first_name} vous êtes mutuellement intéressés
        </p>

        <div className="mx-auto mt-6 h-32 w-32 overflow-hidden rounded-full ring-4 ring-[#c9a962]/40">
          <Image
            src={getPrimaryPhoto(profile.photos)}
            alt={profile.first_name}
            width={128}
            height={128}
            className="h-full w-full object-cover"
          />
        </div>

        <p className="mt-4 text-xl font-medium">{profile.first_name}, {profile.age}</p>

        <div className="mt-8 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Continuer
          </Button>
          <Button variant="gold" className="flex-1" onClick={onMessage}>
            Envoyer un message
          </Button>
        </div>
      </div>
    </div>
  );
}
