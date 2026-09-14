"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { Match } from "@/types";
import { getPrimaryPhoto, formatDate, profileDisplayName } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default function MessagesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.matches.list().then(setMatches).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Messages" subtitle="Conversations instantanées avec vos matchs — temps réel dans chaque chat." />

      {loading ? (
        <p className="py-12 text-center text-[#9a8f8a]">Chargement...</p>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Aucune conversation"
          description="Faites un match pour commencer à échanger. Chaque connexion mutuelle ouvre une conversation privée."
          actionLabel="Voir mes matchs"
          actionHref="/matchs"
        />
      ) : (
        <div className="space-y-2">
          {matches.map((m) => {
            const other = m.other_user;
            if (!other) return null;
            return (
              <Link key={m.id} href={`/messages/${m.id}`}>
                <div className="premium-card flex items-center gap-4 p-4 transition hover:bg-white/[0.03]">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-[#6b1d3a]/30">
                    <Image
                      src={getPrimaryPhoto(other.photos)}
                      alt={profileDisplayName(other)}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-medium">{profileDisplayName(other)}</h3>
                      <span className="shrink-0 text-[11px] text-[#9a8f8a]">{formatDate(m.matched_at)}</span>
                    </div>
                    <p className="truncate text-sm text-[#9a8f8a]">{other.city}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
