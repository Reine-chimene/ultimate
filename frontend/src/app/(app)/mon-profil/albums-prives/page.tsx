"use client";

import Link from "next/link";
import { ChevronLeft, Lock } from "lucide-react";
import { PrivateAlbumManager } from "@/components/private-albums/PrivateAlbumManager";

export default function PrivateAlbumsPage() {
  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <Link
        href="/mon-profil"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[#9a8f8a] hover:text-[#c9a962]"
      >
        <ChevronLeft className="h-4 w-4" /> Retour au profil
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <Lock className="h-6 w-6 text-[#c9a962]" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Mes albums privés</h1>
          <p className="text-sm text-[#9a8f8a]">
            Partagez des photos en toute confidentialité. Vous contrôlez qui y accède.
          </p>
        </div>
      </div>

      <PrivateAlbumManager />
    </div>
  );
}
