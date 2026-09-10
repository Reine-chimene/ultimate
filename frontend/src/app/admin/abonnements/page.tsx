"use client";

import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { api } from "@/lib/api";
import type { AdminStats } from "@/types";

export default function AdminSubscriptionsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.admin.stats().then(setStats);
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Abonnements</h1>

      <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
        <div className="glass-card p-6 text-center">
          <Crown className="mx-auto h-8 w-8 text-[#c9a962]" />
          <p className="mt-3 text-3xl font-bold">{stats?.active_subscriptions ?? "—"}</p>
          <p className="text-sm text-[#9a8f8a]">Abonnements actifs</p>
        </div>
        <div className="glass-card p-6 text-center">
          <p className="text-3xl font-bold">{stats?.total_users ?? "—"}</p>
          <p className="text-sm text-[#9a8f8a]">Utilisateurs totaux</p>
        </div>
      </div>

      <div className="glass-card p-6 mt-6">
        <h2 className="font-medium mb-2">Tarification actuelle (CAD)</h2>
        <ul className="text-sm text-[#9a8f8a] space-y-1">
          <li>1 mois — 19,99 $ CAD</li>
          <li>3 mois — 44,99 $ CAD</li>
          <li>6 mois — 69,99 $ CAD</li>
        </ul>
        <p className="text-xs text-[#9a8f8a]/60 mt-4">Paiements simulés pour le MVP. Intégration Stripe à venir.</p>
      </div>
    </div>
  );
}
