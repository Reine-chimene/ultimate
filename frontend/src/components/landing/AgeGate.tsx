"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "ultimate_age_verified";

export function AgeGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem(STORAGE_KEY) === "1";
    setVisible(!verified);
  }, []);

  const confirm = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
      <div className="premium-card max-w-md p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a962]">18+ · Contenu adulte</p>
        <h2 className="mt-4 font-display text-2xl font-bold">Entrée réservée aux adultes</h2>
        <p className="mt-3 text-sm leading-relaxed text-[#9a8f8a]">
          ULTIMATE est une plateforme de rencontres adultes. En entrant, vous confirmez avoir 18 ans ou plus
          et accepter de voir du contenu sexuellement explicite.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button variant="gold" size="lg" onClick={confirm} className="w-full">
            J&apos;ai 18 ans ou plus — entrer
          </Button>
          <a
            href="https://www.google.com"
            className="text-sm text-[#9a8f8a] transition hover:text-[#f5f0e8]"
          >
            Non, quitter le site
          </a>
        </div>
        <p className="mt-6 text-[10px] text-[#9a8f8a]/80">
          <Link href="/conditions" className="underline">Conditions</Link>
          {" · "}
          <Link href="/confidentialite" className="underline">Confidentialité</Link>
        </p>
      </div>
    </div>
  );
}
