"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plane } from "lucide-react";
import { api } from "@/lib/api";
import type { PublicProfile, TravelPlan } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { ProfileCard } from "@/components/discovery/ProfileCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { COUNTRIES, getCountry } from "@/lib/countries";
import { formatDate } from "@/lib/utils";

export default function VoyagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<TravelPlan | null>(null);
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [form, setForm] = useState({
    country: "FR",
    city: "Paris",
    arrival_date: "",
    departure_date: "",
    wants_to_meet: true,
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.travel.me();
      setActivePlan(data.active_plan);
      setProfiles(data.destination_profiles);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.travel.create(form);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activePlan) return;
    await api.travel.delete(activePlan.id);
    await load();
  };

  if (loading) return <LoadingSpinner />;

  const activeCountry = activePlan ? getCountry(activePlan.country) : null;

  return (
    <div>
      <PageHeader
        eyebrow="Premium"
        title="Mode Voyage"
        subtitle="Indiquez votre prochaine destination et rencontrez des personnes sur place."
      />

      {activePlan && activeCountry ? (
        <div className="premium-card mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-[#6b1d3a]/30 to-transparent p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6b1d3a]/40">
                <Plane className="h-6 w-6 text-[#c9a962]" />
              </div>
              <div>
                <p className="text-sm text-[#c9a962]">Votre prochain séjour</p>
                <h2 className="mt-1 font-display text-2xl font-semibold">
                  Vous serez bientôt à {activePlan.city}
                </h2>
                <p className="mt-1 text-lg">
                  {activeCountry.flag} {activePlan.city}, {activeCountry.nameFr}
                </p>
                <p className="mt-2 text-sm text-[#9a8f8a]">
                  {formatDate(activePlan.arrival_date)} → {formatDate(activePlan.departure_date)}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="mt-4" onClick={handleDelete}>
              Annuler ce plan
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="premium-card mb-8 space-y-4 p-6 md:p-8">
          <h2 className="font-display text-lg font-semibold">Planifier un voyage</h2>
          <Select label="Pays de destination" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.nameFr}</option>
            ))}
          </Select>
          <Input label="Ville" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required placeholder="Paris" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Date d'arrivée" type="date" value={form.arrival_date} onChange={(e) => setForm({ ...form, arrival_date: e.target.value })} required />
            <Input label="Date de départ" type="date" value={form.departure_date} onChange={(e) => setForm({ ...form, departure_date: e.target.value })} required />
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.wants_to_meet}
              onChange={(e) => setForm({ ...form, wants_to_meet: e.target.checked })}
              className="mt-1 accent-[#c9a962]"
            />
            <span>Je souhaite rencontrer des personnes pendant mon séjour.</span>
          </label>
          <Button type="submit" variant="gold" disabled={saving}>
            {saving ? "Enregistrement..." : "Activer le Mode Voyage"}
          </Button>
        </form>
      )}

      <div className="mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-[#c9a962]" />
        <h2 className="font-display text-lg font-semibold">
          {activePlan ? `Personnes à ${activePlan.city}` : "Compatibles en voyage"}
        </h2>
      </div>

      {profiles.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="Aucun profil pour cette destination"
          description="Créez un plan de voyage ou explorez d'autres pays via Ultimate World."
          actionLabel="Ultimate World"
          actionHref="/world"
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              compact
              onView={() => router.push(`/profil/${p.id}`)}
              onLike={async () => { await api.likes.action(p.user_id, true); }}
              likeLabel="Envoyer une demande"
              onMeeting={p.is_connected ? () => router.push(`/rendez-vous/nouveau?user=${p.user_id}`) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
