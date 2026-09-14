"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type LandingMediaProps = {
  src: string;
  alt?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Affichage plus « hot » si l'image marketing n'est pas encore uploadée */
  fallbackLabel?: string;
};

export function LandingMedia({
  src,
  alt = "",
  fill,
  priority,
  sizes,
  className,
  fallbackLabel = "18+",
}: LandingMediaProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-[#6b1d3a] via-[#2a0a14] to-[#0a0a0b]",
          fill && "absolute inset-0",
          className,
        )}
      >
        <span className="font-display text-4xl font-bold tracking-widest text-[#c9a962]/40">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      priority={priority}
      sizes={sizes}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
