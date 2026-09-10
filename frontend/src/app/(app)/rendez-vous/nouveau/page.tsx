"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

function NewMeetingForm() {
  const router = useRouter();
  const params = useSearchParams();
  const receiverId = params.get("user") ?? "";
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId) { setError("Utilisateur non spécifié"); return; }
    setLoading(true);
    try {
      const proposedAt = new Date(`${date}T${time}`).toISOString();
      await api.meetings.create({ receiver_id: receiverId, proposed_at: proposedAt, location, message });
      router.push("/rendez-vous/demandes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-6">Proposer un rendez-vous</h1>
      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input label="Heure approximative" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        <Input label="Lieu de rencontre" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Café, restaurant, parc..." />
        <Textarea label="Message (optionnel)" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <p className="text-xs text-[#9a8f8a]">
          Un match ne signifie pas un consentement automatique. L&apos;autre personne devra accepter explicitement.
        </p>
        <Button type="submit" variant="gold" className="w-full" loading={loading}>Envoyer la demande</Button>
      </form>
    </div>
  );
}

export default function NewMeetingPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Chargement...</div>}>
      <NewMeetingForm />
    </Suspense>
  );
}
