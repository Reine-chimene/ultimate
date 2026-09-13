"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import type { ProfileVisitorsResponse } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { OnlineStatus } from "@/components/profile/OnlineStatus";
import { getPrimaryPhoto, formatDate, profileDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export default function VisitorsPage() {
  const [data, setData] = useState<ProfileVisitorsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.profiles.visitors(p, 20);
      setData(res);
      setPage(res.page);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1);
  }, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total_count / data.limit)) : 1;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Visiteurs"
        subtitle="Découvrez qui a consulté votre profil récemment."
      />

      {loading && !data ? (
        <LoadingSpinner />
      ) : !data ? (
        <p className="py-12 text-center text-[#9a8f8a]">Impossible de charger les visiteurs.</p>
      ) : !data.is_premium ? (
        <div className="space-y-4">
          {data.total_count > 0 && (
            <div className="premium-card p-6 text-center">
              <Eye className="mx-auto mb-3 h-10 w-10 text-[#c9a962]" />
              <p className="text-lg font-medium">{data.total_count}</p>
              <p className="mt-1 text-sm text-[#9a8f8a]">
                {data.teaser ?? "Des membres ont visité votre profil récemment."}
              </p>
            </div>
          )}
          <PremiumGate message="Passez à Premium pour voir la liste détaillée de vos visiteurs." />
        </div>
      ) : data.visitors.length === 0 ? (
        <div className="premium-card p-8 text-center">
          <Eye className="mx-auto mb-3 h-10 w-10 text-[#9a8f8a]" />
          <p className="font-medium">Aucun visiteur pour le moment</p>
          <p className="mt-2 text-sm text-[#9a8f8a]">
            Lorsque des membres consulteront votre profil, ils apparaîtront ici.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-[#9a8f8a]">
            {data.total_count} visite{data.total_count > 1 ? "s" : ""} au cours des 30 derniers jours
          </p>
          <div className="space-y-2">
            {data.visitors.map((item) => (
              <Link key={`${item.user_id}-${item.visited_at}`} href={`/profil/${item.profile.id}`}>
                <div className="premium-card flex items-center gap-4 p-4 transition hover:bg-white/[0.03]">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-[#6b1d3a]/30">
                    <Image
                      src={getPrimaryPhoto(item.profile.photos)}
                      alt={profileDisplayName(item.profile)}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-medium">{profileDisplayName(item.profile)}</h3>
                      <span className="shrink-0 text-[11px] text-[#9a8f8a]">
                        {formatDate(item.visited_at)}
                      </span>
                    </div>
                    <p className="truncate text-sm text-[#9a8f8a]">{item.profile.city}</p>
                    <OnlineStatus status={item.profile.online_status} className="mt-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => void load(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-[#9a8f8a]">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => void load(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
