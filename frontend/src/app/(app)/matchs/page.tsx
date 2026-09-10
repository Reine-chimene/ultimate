"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { Match } from "@/types";
import { getPrimaryPhoto } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.matches.list().then(setMatches).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center">Chargement...</div>;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Mes matchs</h1>
      {matches.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-[#9a8f8a]">Aucun match pour le moment.</p>
          <Link href="/decouvrir" className="mt-4 inline-block text-[#c9a962] hover:underline">
            Découvrir des profils →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => {
            const other = m.other_user;
            if (!other) return null;
            return (
              <div key={m.id} className="glass-card overflow-hidden animate-fade-in">
                <div className="relative h-48">
                  <Image src={getPrimaryPhoto(other.photos)} alt={other.first_name} fill className="object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{other.first_name}, {other.age}</h3>
                  <p className="text-sm text-[#9a8f8a]">{other.city}</p>
                  <p className="text-xs text-[#9a8f8a] mt-1">Match le {formatDate(m.matched_at)}</p>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/messages/${m.id}`} className="flex-1">
                      <button className="flex w-full items-center justify-center gap-1 rounded-full bg-[#6b1d3a]/40 py-2 text-sm hover:bg-[#6b1d3a]/60 transition">
                        <MessageCircle className="h-4 w-4" /> Message
                      </button>
                    </Link>
                    <Link href={`/profil/${other.id}`}>
                      <button className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/5">Profil</button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
