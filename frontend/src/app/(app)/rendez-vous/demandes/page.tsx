"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Meeting } from "@/types";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Demandes de rendez-vous</h1>
        <Link href="/rendez-vous/confirmes" className="text-sm text-[#c9a962] hover:underline">
          Voir confirmés →
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-medium mb-4">Reçues ({incoming.length})</h2>
        {incoming.length === 0 ? (
          <p className="text-[#9a8f8a] text-sm">Aucune demande reçue.</p>
        ) : (
          <div className="space-y-3">
            {incoming.map((m) => (
              <MeetingCard key={m.id} meeting={m} name={m.requester_name} onAccept={() => handleAction(m.id, "accept")} onReject={() => handleAction(m.id, "reject")} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">Envoyées ({outgoing.length})</h2>
        {outgoing.length === 0 ? (
          <p className="text-[#9a8f8a] text-sm">Aucune demande envoyée.</p>
        ) : (
          <div className="space-y-3">
            {outgoing.map((m) => (
              <MeetingCard key={m.id} meeting={m} name={m.receiver_name} onCancel={() => handleAction(m.id, "cancel")} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MeetingCard({
  meeting,
  name,
  onAccept,
  onReject,
  onCancel,
}: {
  meeting: Meeting;
  name?: string | null;
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">{name ?? "Utilisateur"}</h3>
          <p className="text-sm text-[#c9a962] mt-1">{formatDateTime(meeting.proposed_at)}</p>
          {meeting.location && <p className="text-sm text-[#9a8f8a] mt-1">📍 {meeting.location}</p>}
          {meeting.message && <p className="text-sm mt-2 italic">&ldquo;{meeting.message}&rdquo;</p>}
        </div>
        <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-300">En attente</span>
      </div>
      <div className="flex gap-2 mt-4">
        {onAccept && <Button variant="gold" size="sm" onClick={onAccept}>Accepter</Button>}
        {onReject && <Button variant="ghost" size="sm" onClick={onReject}>Refuser</Button>}
        {onCancel && <Button variant="danger" size="sm" onClick={onCancel}>Annuler</Button>}
      </div>
    </div>
  );
}
