"use client";

import Image from "next/image";
import { useState } from "react";

type MarketingImageProps = {
  src: string;
  fallback: string;
  alt?: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/** Affiche vos visuels /marketing/* ; repli temporaire tant que les JPG 18+ ne sont pas déposés. */
export function MarketingImage({
  src,
  fallback,
  alt = "",
  fill,
  className,
  sizes,
  priority,
}: MarketingImageProps) {
  const [current, setCurrent] = useState(src);

  return (
    <Image
      src={current}
      alt={alt}
      fill={fill}
      priority={priority}
      className={className}
      sizes={sizes}
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
    />
  );
}
