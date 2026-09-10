"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Meeting } from "@/types";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  accepted: "Confirmé",
  rejected: "Refusé",
  cancelled: "Annulé",
  pending: "En attente",
};

export default function ConfirmedMeetingsPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const load = () => api.meetings.list().then(setMeetings);
  useEffect(() => { load(); }, []);

  const accepted = meetings.filter((m) => m.status === "accepted");
  const history = meetings.filter((m) => ["rejected", "cancelled"].includes(m.status));

  const getName = (m: Meeting) => {
    if (m.requester_id === user?.id) return m.receiver_name;
    return m.requester_name;
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Annuler ce rendez-vous ?")) return;
    await api.meetings.cancel(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Rendez-vous confirmés</h1>
        <Link href="/rendez-vous/demandes" className="text-sm text-[#c9a962] hover:underline">
          ← Demandes
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-medium mb-4">À venir ({accepted.length})</h2>
        {accepted.length === 0 ? (
          <p className="text-[#9a8f8a] text-sm">Aucun rendez-vous confirmé.</p>
        ) : (
          <div className="space-y-3">
            {accepted.map((m) => (
              <div key={m.id} className="glass-card p-5">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{getName(m)}</h3>
                    <p className="text-sm text-[#c9a962] mt-1">{formatDateTime(m.proposed_at)}</p>
                    {m.location && <p className="text-sm text-[#9a8f8a] mt-1">📍 {m.location}</p>}
                  </div>
                  <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">Confirmé</span>
                </div>
                <Button variant="danger" size="sm" className="mt-4" onClick={() => handleCancel(m.id)}>
                  Annuler le rendez-vous
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">Historique ({history.length})</h2>
        {history.length === 0 ? (
          <p className="text-[#9a8f8a] text-sm">Aucun historique.</p>
        ) : (
          <div className="space-y-3">
            {history.map((m) => (
              <div key={m.id} className="glass-card p-5 opacity-70">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{getName(m)}</h3>
                    <p className="text-sm text-[#9a8f8a] mt-1">{formatDateTime(m.proposed_at)}</p>
                  </div>
                  <span className="text-xs text-[#9a8f8a]">{STATUS_LABELS[m.status]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
