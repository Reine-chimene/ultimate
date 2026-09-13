"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Globe2, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { CountryStats } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { REGION_LABELS } from "@/lib/world-countries";
import { getCountry } from "@/lib/countries";

export default function WorldPage() {
  const [countries, setCountries] = useState<CountryStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.world.overview().then((data) => setCountries(data.countries)).finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, CountryStats[]>();
    for (const c of countries) {
      const region = getCountry(c.code).region ?? "europe";
      const list = map.get(region) ?? [];
      list.push(c);
      map.set(region, list);
    }
    return map;
  }, [countries]);

  if (loading) return <LoadingSpinner />;

  const activeTotal = countries.filter((c) => c.user_count > 0).length;

  return (
    <div>
      <PageHeader
        eyebrow="Monde entier — gratuit"
        title="ULTIMATE WORLD"
        subtitle="25 pays · une communauté adulte sans frontières."
        centered
      />
      <p className="-mt-4 mb-10 text-center text-sm text-[#9a8f8a] md:text-base">
        {activeTotal} région{activeTotal !== 1 ? "s" : ""} avec des membres actifs · explorez le monde entier.
      </p>

      {Array.from(grouped.entries()).map(([region, list]) => (
        <section key={region} className="mb-10">
          <h2 className="mb-4 font-display text-lg font-semibold text-[#c9a962]">
            {REGION_LABELS[region as keyof typeof REGION_LABELS] ?? region}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
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
                  {c.user_count > 0
                    ? `${c.user_count} profil${c.user_count !== 1 ? "s" : ""} actif${c.user_count !== 1 ? "s" : ""}`
                    : "Soyez parmi les premiers"}
                </p>
                <p className="mt-4 text-xs text-[#c9a962]">Explorer en mode Monde entier →</p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <p className="mt-4 text-center text-xs text-[#9a8f8a]">
        Le Monde entier est gratuit pour tous les membres ULTIMATE.
      </p>
    </div>
  );
}
