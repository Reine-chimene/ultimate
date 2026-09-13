"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import type { PrivateAlbumSummary } from "@/types";
import { PrivatePhotoImage } from "./PrivatePhotoImage";
import { PrivateAlbumAccessButton } from "./PrivateAlbumAccessButton";

interface PrivateAlbumGalleryProps {
  ownerUserId: string;
  album: PrivateAlbumSummary;
  onAccessChange?: () => void;
}

export function PrivateAlbumGallery({ ownerUserId, album, onAccessChange }: PrivateAlbumGalleryProps) {
  const [active, setActive] = useState(0);
  const photos = album.photos;
  const locked = !album.can_view_photos;

  return (
    <div className="premium-card overflow-hidden p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h4 className="font-display text-lg font-semibold text-[#c9a962]">{album.title}</h4>
          {album.description && (
            <p className="mt-1 text-sm text-[#9a8f8a]">{album.description}</p>
          )}
          <p className="mt-1 text-xs uppercase tracking-wider text-[#9a8f8a]">
            Album privé · {album.photo_count} photo{album.photo_count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {locked ? (
        <div className="relative flex aspect-[4/3] items-center justify-center rounded-lg bg-gradient-to-br from-[#1a1a1c] to-[#0a0a0b]">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#6b1d3a]/30">
              <Lock className="h-8 w-8 text-[#c9a962]" />
            </div>
            <p className="mt-3 text-sm text-[#9a8f8a]">Contenu privé</p>
          </div>
        </div>
      ) : (
        <>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
            {photos[active] && (
              <PrivatePhotoImage
                albumId={album.id}
                photoId={photos[active].id}
                alt={album.title}
                className="h-full w-full"
              />
            )}
          </div>
          {photos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 ${
                    i === active ? "ring-[#c9a962]" : "ring-transparent"
                  }`}
                >
                  <PrivatePhotoImage
                    albumId={album.id}
                    photoId={p.id}
                    alt=""
                    className="h-full w-full"
                  />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {!album.is_owner && (
        <div className="mt-4">
          <PrivateAlbumAccessButton
            ownerUserId={ownerUserId}
            album={album}
            onUpdated={() => onAccessChange?.()}
          />
        </div>
      )}
    </div>
  );
}
