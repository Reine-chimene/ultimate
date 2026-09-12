"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";

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
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Proposer un rendez-vous"
        subtitle="Choisissez un moment et un lieu public. L'autre personne devra accepter explicitement."
      />
      <form onSubmit={handleSubmit} className="premium-card space-y-4 p-6 md:p-8">
        <div className="flex items-center gap-3 rounded-xl bg-[#6b1d3a]/15 p-4 text-sm text-[#9a8f8a]">
          <Calendar className="h-5 w-5 shrink-0 text-[#c9a962]" />
          Un match ne signifie pas un consentement automatique. Chaque rencontre est confirmée mutuellement.
        </div>
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input label="Heure approximative" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        <Input
          label="Lieu de rencontre"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Café, restaurant, parc public..."
        />
        <Textarea label="Message (optionnel)" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" variant="gold" className="w-full" loading={loading}>
          Envoyer la demande
        </Button>
      </form>
    </div>
  );
}

export default function NewMeetingPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-[#9a8f8a]">Chargement...</div>}>
      <NewMeetingForm />
    </Suspense>
  );
}
