"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Heart, Flag, MapPin, Ban, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import type { PublicProfile } from "@/types";
import { Button } from "@/components/ui/Button";
import { INTENTION_LABELS, GENDER_LABELS } from "@/lib/constants";
import { getPrimaryPhoto } from "@/lib/utils";

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    api.profiles.get(id).then(setProfile).finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!profile) return;
    const result = await api.likes.action(profile.user_id, true);
    if (result.is_match) router.push("/matchs");
  };

  const handleReport = async () => {
    if (!profile || !reportReason) return;
    await api.reports.create(profile.user_id, reportReason);
    setShowReport(false);
    alert("Signalement envoyé. Merci.");
  };

  const handleBlock = async () => {
    if (!profile || !confirm("Bloquer cet utilisateur ?")) return;
    await api.reports.block(profile.user_id);
    router.push("/decouvrir");
  };

  if (loading) return <div className="py-20 text-center">Chargement...</div>;
  if (!profile) return <div className="py-20 text-center">Profil introuvable</div>;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
        <Image src={getPrimaryPhoto(profile.photos)} alt={profile.first_name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 p-6">
          <h1 className="font-display text-4xl font-bold">{profile.first_name}, {profile.age}</h1>
          <div className="flex items-center gap-2 mt-2 text-[#9a8f8a]">
            <MapPin className="h-4 w-4" /> {profile.city}
          </div>
        </div>
      </div>

      <div className="glass-card mt-6 p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#6b1d3a]/40 px-3 py-1 text-sm">{INTENTION_LABELS[profile.relationship_intention]}</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm">{GENDER_LABELS[profile.gender]}</span>
          {profile.compatibility_score != null && (
            <span className="rounded-full bg-[#c9a962]/20 px-3 py-1 text-sm text-[#c9a962]">
              {Math.round(profile.compatibility_score)}% compatible
            </span>
          )}
        </div>

        {profile.occupation && <p className="text-[#9a8f8a]">{profile.occupation}</p>}
        {profile.bio && <p className="leading-relaxed">{profile.bio}</p>}

        {profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((i) => (
              <span key={i.id} className="rounded-full border border-white/10 px-3 py-1 text-sm">{i.name}</span>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="gold" onClick={handleLike} className="flex-1">
            <Heart className="h-4 w-4" /> J&apos;aime
          </Button>
          <Button variant="outline" onClick={() => router.push(`/rendez-vous/nouveau?user=${profile.user_id}`)}>
            <Calendar className="h-4 w-4" /> Proposer un RDV
          </Button>
        </div>

        <div className="flex gap-3 pt-2 border-t border-white/5">
          <button onClick={() => setShowReport(true)} className="flex items-center gap-1 text-sm text-[#9a8f8a] hover:text-red-400">
            <Flag className="h-4 w-4" /> Signaler
          </button>
          <button onClick={handleBlock} className="flex items-center gap-1 text-sm text-[#9a8f8a] hover:text-red-400">
            <Ban className="h-4 w-4" /> Bloquer
          </button>
        </div>
      </div>

      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="glass-card w-full max-w-md p-6">
            <h3 className="font-semibold">Signaler {profile.first_name}</h3>
            <textarea
              className="input-field mt-4 min-h-[80px]"
              placeholder="Raison du signalement..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            <div className="mt-4 flex gap-3">
              <Button variant="ghost" onClick={() => setShowReport(false)}>Annuler</Button>
              <Button variant="danger" onClick={handleReport}>Envoyer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
