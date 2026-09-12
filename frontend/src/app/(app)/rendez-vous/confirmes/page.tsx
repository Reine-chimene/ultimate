"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Meeting } from "@/types";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/utils";

export default function ConfirmedMeetingsPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const load = () => api.meetings.list().then(setMeetings);
  useEffect(() => { load(); }, []);

  const accepted = meetings.filter((m) => m.status === "accepted");
  const history = meetings.filter((m) => ["rejected", "cancelled"].includes(m.status));

  const getName = (m: Meeting) =>
    m.requester_id === user?.id ? m.receiver_name : m.requester_name;

  const handleCancel = async (id: string) => {
    if (!confirm("Annuler ce rendez-vous ?")) return;
    await api.meetings.cancel(id);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Rendez-vous confirmés" className="mb-0" />
        <Link href="/rendez-vous/demandes">
          <Button variant="outline" size="sm">← Demandes</Button>
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-lg font-semibold">
          À venir <span className="text-emerald-300/90">({accepted.length})</span>
        </h2>
        {accepted.length === 0 ? (
          <p className="text-sm text-[#9a8f8a]">Aucun rendez-vous confirmé pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {accepted.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                name={getName(m)}
                onCancel={() => handleCancel(m.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold">
          Historique <span className="text-[#9a8f8a]">({history.length})</span>
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-[#9a8f8a]">Aucun historique.</p>
        ) : (
          <div className="space-y-3">
            {history.map((m) => (
              <div key={m.id} className="premium-card flex items-center justify-between p-5 opacity-75">
                <div>
                  <h3 className="font-medium">{getName(m)}</h3>
                  <p className="mt-1 text-sm text-[#9a8f8a]">{formatDateTime(m.proposed_at)}</p>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
