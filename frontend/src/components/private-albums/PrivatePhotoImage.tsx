"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { api } from "@/lib/api";

interface PrivatePhotoImageProps {
  albumId: string;
  photoId: string;
  alt: string;
  className?: string;
  mediaType?: "photo" | "video";
}

export function PrivatePhotoImage({
  albumId,
  photoId,
  alt,
  className = "",
  mediaType = "photo",
}: PrivatePhotoImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    api.privateAlbums
      .fetchPhotoBlob(albumId, photoId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [albumId, photoId]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-[#1a1a1c] ${className}`}>
        <Lock className="h-8 w-8 text-[#9a8f8a]" />
      </div>
    );
  }

  if (!src) {
    return <div className={`animate-pulse bg-white/5 ${className}`} />;
  }

  if (mediaType === "video") {
    return <video src={src} controls className={`object-cover ${className}`} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`object-cover ${className}`} />
  );
}
