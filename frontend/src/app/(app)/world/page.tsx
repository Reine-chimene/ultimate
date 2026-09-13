"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe2, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { CountryStats } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function WorldPage() {
  const [countries, setCountries] = useState<CountryStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.world.overview().then((data) => setCountries(data.countries)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        eyebrow="Premium experience"
        title="ULTIMATE WORLD"
        subtitle="Le monde est à portée de rencontre."
        centered
      />
      <p className="-mt-4 mb-10 text-center text-sm text-[#9a8f8a] md:text-base">
        Découvrez des personnes compatibles partout dans le monde.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {countries.map((c) => (
          <Link
            key={c.code}
            href={`/decouvrir?country=${c.code}&mode=worldwide`}
            className="premium-card group p-6 transition hover:ring-1 hover:ring-[#c9a962]/30"
          >
            <div className="flex items-start justify-between">
              <span className="text-4xl">{c.flag}</span>
              <Globe2 className="h-5 w-5 text-[#c9a962]/40 transition group-hover:text-[#c9a962]" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">{c.name_fr}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-[#9a8f8a]">
              <Users className="h-4 w-4" />
              {c.user_count} profil{c.user_count !== 1 ? "s" : ""} actif{c.user_count !== 1 ? "s" : ""}
            </p>
            <p className="mt-4 text-xs text-[#c9a962]">Explorer →</p>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-[#9a8f8a]">
        Les comptages reflètent les profils de démonstration actifs sur la plateforme.
      </p>
    </div>
  );
}
