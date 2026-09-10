"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { Availability, PublicProfile } from "@/types";
import { ProfileCard } from "@/components/discovery/ProfileCard";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

export default function TonightPage() {
  const router = useRouter();
  const [myAvailability, setMyAvailability] = useState<Availability | null>(null);
  const [tonightUsers, setTonightUsers] = useState<PublicProfile[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [availList, tonight] = await Promise.all([
        api.availability.me().catch(() => [] as Availability[]),
        api.availability.tonight(),
      ]);
      const avail = availList.find((a) => a.is_available) ?? availList[0] ?? null;
      setMyAvailability(avail);
      setTonightUsers(tonight.users);
      if (avail?.note) setNote(avail.note);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleAvailability = async () => {
    const isAvailable = !myAvailability?.is_available;
    const result = await api.availability.set({ is_available: isAvailable, note: note || undefined });
    setMyAvailability(result);
    await load();
  };

  if (loading) return <div className="py-20 text-center">Chargement...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Moon className="h-7 w-7 text-[#c9a962]" />
        <div>
          <h1 className="font-display text-2xl font-semibold">Ce soir</h1>
          <p className="text-sm text-[#9a8f8a]">Rencontrez des personnes disponibles aujourd&apos;hui</p>
        </div>
      </div>

      <div className="glass-card p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Disponible ce soir</h2>
            <p className="text-sm text-[#9a8f8a] mt-1">
              {myAvailability?.is_available ? "Vous êtes visible pour les autres" : "Activez pour apparaître ce soir"}
            </p>
          </div>
          <button
            onClick={toggleAvailability}
            className={`relative h-8 w-14 rounded-full transition ${
              myAvailability?.is_available ? "bg-[#6b1d3a]" : "bg-white/10"
            }`}
          >
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${
              myAvailability?.is_available ? "left-7" : "left-1"
            }`} />
          </button>
        </div>
        {myAvailability?.is_available && (
          <div className="mt-4">
            <Textarea
              label="Note (optionnelle)"
              placeholder="Ex: Disponible après 20h, centre-ville..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
            <Button variant="outline" size="sm" className="mt-2" onClick={async () => {
              const result = await api.availability.set({ is_available: true, note: note || undefined });
              setMyAvailability(result);
            }}>
              Mettre à jour
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-[#c9a962]" />
        <h2 className="font-semibold">{tonightUsers.length} personne{tonightUsers.length !== 1 ? "s" : ""} disponible{tonightUsers.length !== 1 ? "s" : ""}</h2>
      </div>

      {tonightUsers.length === 0 ? (
        <div className="glass-card p-12 text-center text-[#9a8f8a]">
          Personne d&apos;autre n&apos;est disponible ce soir pour le moment.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tonightUsers.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              compact
              onView={() => router.push(`/profil/${p.id}`)}
              onLike={async () => {
                await api.likes.action(p.user_id, true);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
