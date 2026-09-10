import Image from "next/image";
import Link from "next/link";
import { TAGLINE, TAGLINE_SECONDARY } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({
  showTagline = false,
  size = "md",
}: {
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: { width: 120, height: 48, className: "h-10 w-auto" },
    md: { width: 180, height: 72, className: "h-14 w-auto" },
    lg: { width: 320, height: 128, className: "h-28 md:h-36 w-auto" },
  };

  const s = sizes[size];

  return (
    <Link href="/" className="group inline-flex flex-col items-start">
      <Image
        src="/logo.png"
        alt="ULTIMATE — MEET. TONIGHT. CONNECT."
        width={s.width}
        height={s.height}
        className={cn(s.className, "object-contain object-left")}
        priority
      />
      {showTagline && (
        <div className="mt-1 hidden sm:block">
          <p className="text-[10px] tracking-[0.25em] text-[#e8a0b4] uppercase">{TAGLINE}</p>
          <p className="text-[9px] tracking-[0.2em] text-[#9a8f8a] mt-0.5">{TAGLINE_SECONDARY}</p>
        </div>
      )}
    </Link>
  );
}
