"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Match } from "@/types";
import { getPrimaryPhoto, formatDate } from "@/lib/utils";

export default function MessagesPage() {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    api.matches.list().then(setMatches);
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Messages</h1>
      {matches.length === 0 ? (
        <div className="glass-card p-12 text-center text-[#9a8f8a]">
          Aucune conversation. Faites un match pour commencer à discuter.
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((m) => {
            const other = m.other_user;
            if (!other) return null;
            return (
              <Link key={m.id} href={`/messages/${m.id}`}>
                <div className="glass-card flex items-center gap-4 p-4 hover:bg-white/5 transition cursor-pointer">
                  <div className="relative h-14 w-14 rounded-full overflow-hidden flex-shrink-0">
                    <Image src={getPrimaryPhoto(other.photos)} alt={other.first_name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{other.first_name}</h3>
                    <p className="text-sm text-[#9a8f8a] truncate">{other.city}</p>
                  </div>
                  <span className="text-xs text-[#9a8f8a]">{formatDate(m.matched_at)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
