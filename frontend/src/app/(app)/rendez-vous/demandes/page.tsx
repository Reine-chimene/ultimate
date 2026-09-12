"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Meeting } from "@/types";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default function MeetingRequestsPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const load = () => api.meetings.list().then(setMeetings);
  useEffect(() => { load(); }, []);

  const pending = meetings.filter((m) => m.status === "pending");
  const incoming = pending.filter((m) => m.receiver_id === user?.id);
  const outgoing = pending.filter((m) => m.requester_id === user?.id);

  const handleAction = async (id: string, action: "accept" | "reject" | "cancel") => {
    if (action === "accept") await api.meetings.accept(id);
    else if (action === "reject") await api.meetings.reject(id);
    else await api.meetings.cancel(id);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Rendez-vous"
          subtitle="Gérez vos demandes en attente — chaque rencontre requiert un consentement mutuel."
          className="mb-0"
        />
        <div className="flex shrink-0 gap-2">
          <Link href="/rendez-vous/confirmes">
            <Button variant="outline" size="sm">Confirmés</Button>
          </Link>
          <Link href="/rendez-vous/nouveau">
            <Button variant="gold" size="sm">Nouveau</Button>
          </Link>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-lg font-semibold">
          Reçues <span className="text-[#c9a962]">({incoming.length})</span>
        </h2>
        {incoming.length === 0 ? (
          <p className="text-sm text-[#9a8f8a]">Aucune demande reçue pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {incoming.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                name={m.requester_name}
                onAccept={() => handleAction(m.id, "accept")}
                onReject={() => handleAction(m.id, "reject")}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold">
          Envoyées <span className="text-[#9a8f8a]">({outgoing.length})</span>
        </h2>
        {outgoing.length === 0 ? (
          <p className="text-sm text-[#9a8f8a]">Aucune demande envoyée.</p>
        ) : (
          <div className="space-y-4">
            {outgoing.map((m) => (
              <MeetingCard
                key={m.id}
                meeting={m}
                name={m.receiver_name}
                onCancel={() => handleAction(m.id, "cancel")}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
