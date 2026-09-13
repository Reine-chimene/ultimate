"use client";

import { Lock } from "lucide-react";
import type { PrivateAlbumSummary } from "@/types";

interface PrivateAlbumCardProps {
  album: PrivateAlbumSummary;
}

export function PrivateAlbumCard({ album }: PrivateAlbumCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#6b1d3a]/30">
        <Lock className="h-5 w-5 text-[#c9a962]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{album.title}</p>
        <p className="text-xs text-[#9a8f8a]">
          {album.photo_count} photo{album.photo_count !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
