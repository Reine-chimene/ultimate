"use client";

import { useEffect, useState } from "react";
import { Users, Heart, MessageCircle, Moon, Calendar, Crown, Flag } from "lucide-react";
import { api } from "@/lib/api";
import type { AdminStats } from "@/types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.admin.stats().then(setStats);
  }, []);

  if (!stats) return <div className="py-20 text-center">Chargement...</div>;

  const cards = [
    { label: "Utilisateurs totaux", value: stats.total_users, icon: Users },
    { label: "Utilisateurs actifs", value: stats.active_users, icon: Users },
    { label: "Nouveaux (7 jours)", value: stats.new_users_7d, icon: Users },
    { label: "Matchs", value: stats.total_matches, icon: Heart },
    { label: "Messages", value: stats.total_messages, icon: MessageCircle },
    { label: "Disponibles ce soir", value: stats.tonight_users, icon: Moon },
    { label: "Rendez-vous", value: stats.total_meetings, icon: Calendar },
    { label: "Abonnements actifs", value: stats.active_subscriptions, icon: Crown },
    { label: "Signalements en attente", value: stats.pending_reports, icon: Flag },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Tableau de bord</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#9a8f8a]">{label}</p>
                <p className="mt-1 text-3xl font-bold">{value}</p>
              </div>
              <Icon className="h-8 w-8 text-[#c9a962]/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
