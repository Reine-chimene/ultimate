"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Ban, Calendar, Check, Flag, Heart, MapPin, MessageCircle, X } from "lucide-react";
import { api } from "@/lib/api";
import type { ConnectionState, PrivateAlbumSummary, PublicProfile } from "@/types";
import { PrivateAlbumGallery } from "@/components/private-albums/PrivateAlbumGallery";
import { Button } from "@/components/ui/Button";
import { INTENTION_LABELS, GENDER_LABELS } from "@/lib/constants";
import { LikeButton } from "@/components/profile/LikeButton";
import { OnlineStatus } from "@/components/profile/OnlineStatus";
import { getPrimaryPhoto, profileDisplayName } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { MatchModal } from "@/components/discovery/MatchModal";
import { ConnectionRequestModal } from "@/components/connections/ConnectionRequestModal";
import { SafetyTips } from "@/components/ui/SafetyTips";

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("none");
  const [requestsRemaining, setRequestsRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [activePhoto, setActivePhoto] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [privateAlbums, setPrivateAlbums] = useState<PrivateAlbumSummary[]>([]);

  const load = async () => {
    const p = await api.profiles.get(id);
    const status = await api.connections.status(p.user_id);
    setProfile(p);
    setConnectionState((p.connection_state ?? status.state) as ConnectionState);
    setRequestsRemaining(status.requests_remaining);
    if (status.match_id) setMatchId(status.match_id);
    try {
      const albums = await api.privateAlbums.listForUser(p.user_id);
      setPrivateAlbums(albums.albums);
    } catch {
      setPrivateAlbums([]);
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [id]);

  const isConnected = connectionState === "connected" || !!matchId;

  const handleSendRequest = async (introMessage: string) => {
    if (!profile) return;
    const result = await api.connections.request(profile.user_id, introMessage || undefined);
    setConnectionState("pending_sent");
    setRequestsRemaining(result.requests_remaining);
  };

  const handleAccept = async () => {
    if (!profile) return;
    const result = await api.connections.accept(profile.user_id);
    if (result.match_id) {
      setMatchId(result.match_id);
      setConnectionState("connected");
      setShowMatchModal(true);
    }
  };

  const handleDecline = async () => {
    if (!profile) return;
    await api.connections.decline(profile.user_id);
    setConnectionState("declined");
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

  if (loading) return <LoadingSpinner />;
  if (!profile) return <div className="py-20 text-center text-[#9a8f8a]">Profil introuvable</div>;

  const photos = profile.photos.length > 0 ? profile.photos : [{ url: getPrimaryPhoto([]), is_primary: true, id: "0", sort_order: 0 }];
  const currentPhoto = photos[activePhoto]?.url ?? getPrimaryPhoto(profile.photos);

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="premium-card overflow-hidden">
        <div className="relative aspect-[4/5] max-h-[70vh]">
          <Image src={currentPhoto} alt={profileDisplayName(profile)} fill className="object-cover" priority sizes="(max-width:768px) 100vw, 640px" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/10 to-transparent" />
          {profile.is_available_tonight && (
            <span className="absolute left-4 top-4 rounded-full bg-[#6b1d3a]/90 px-3 py-1 text-xs font-medium uppercase tracking-wide">
              {profile.availability_note || "Disponible ce soir"}
            </span>
          )}
          <div className="absolute bottom-0 p-6">
            <h1 className="font-display text-4xl font-bold md:text-5xl">
              {profileDisplayName(profile)}, {profile.age}
            </h1>
            <OnlineStatus status={profile.online_status} className="mt-2" />
            <div className="mt-2 flex items-center gap-2 text-[#9a8f8a]">
              <MapPin className="h-4 w-4" /> {profile.location_label || profile.city}
            </div>
          </div>
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-t border-white/[0.06] p-3">
            {photos.map((ph, i) => (
              <button
                key={ph.id}
                type="button"
                onClick={() => setActivePhoto(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                  i === activePhoto ? "ring-[#c9a962]" : "ring-transparent opacity-70"
                }`}
              >
                <Image src={ph.url} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="premium-card mt-6 space-y-5 p-6 md:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#6b1d3a]/40 px-3 py-1 text-sm">
            {INTENTION_LABELS[profile.relationship_intention]}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm">{GENDER_LABELS[profile.gender]}</span>
          {profile.profile_completion_percent != null && profile.profile_completion_percent >= 80 && (
            <span className="rounded-full bg-[#c9a962]/15 px-3 py-1 text-sm text-[#c9a962]">
              Profil {profile.profile_completion_percent}%
            </span>
          )}
        </div>

        {profile.compatibility_indicators && profile.compatibility_indicators.length > 0 && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-[#9a8f8a]">Compatible avec vos préférences</p>
            <div className="flex flex-wrap gap-2">
              {profile.compatibility_indicators.map((ind) => (
                <span key={ind} className="inline-flex items-center gap-1 text-sm text-[#c9a962]">
                  <Check className="h-3.5 w-3.5" /> {ind}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.occupation && <p className="text-sm text-[#c9a962]/90">{profile.occupation}</p>}
        {profile.bio && <p className="leading-relaxed text-[#f5f0e8]/90">{profile.bio}</p>}

        {profile.interests.length > 0 && (
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-[#9a8f8a]">Centres d&apos;intérêt</p>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((i) => (
                <span key={i.id} className="rounded-full border border-white/10 px-3 py-1 text-sm">{i.name}</span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 border-t border-white/[0.06] pt-5">
          {isConnected ? (
            <>
              <p className="text-center text-sm font-medium text-[#c9a962]">C&apos;est un match !</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="gold" onClick={() => router.push(`/messages/${matchId}`)} className="flex-1">
                  <MessageCircle className="h-4 w-4" /> Envoyer un message
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/rendez-vous/nouveau?user=${profile.user_id}`)}
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4" /> Proposer un RDV
                </Button>
              </div>
            </>
          ) : connectionState === "pending_sent" ? (
            <p className="text-center text-sm text-[#9a8f8a]">Demande envoyée — en attente de réponse</p>
          ) : connectionState === "pending_received" ? (
            <>
              <p className="text-center text-sm text-[#c9a962]">Demande de connexion reçue</p>
              <div className="flex gap-2">
                <Button variant="gold" onClick={handleAccept} className="flex-1">
                  <Heart className="h-4 w-4" /> Accepter
                </Button>
                <Button variant="ghost" onClick={handleDecline} className="flex-1">
                  <X className="h-4 w-4" /> Décliner
                </Button>
              </div>
            </>
          ) : connectionState === "interest_received" ? (
            <LikeButton profile={{ ...profile, connection_state: "interest_received" }} className="w-full" onStateChange={() => void load()} />
          ) : connectionState === "interest_sent" ? (
            <p className="text-center text-sm text-[#c9a962]">Intérêt envoyé — en attente de réciprocité</p>
          ) : connectionState === "declined" ? (
            <p className="text-center text-sm text-[#9a8f8a]">Demande déclinée</p>
          ) : (
            <>
              <LikeButton profile={profile} className="w-full" onStateChange={() => void load()} />
              <details className="text-center">
                <summary className="cursor-pointer text-xs text-[#9a8f8a] hover:text-[#f5f0e8]">
                  Autre option : demande avec message
                </summary>
                <Button variant="outline" onClick={() => setShowConnectModal(true)} className="mt-3 w-full">
                  Demande avec message
                </Button>
              </details>
              <p className="text-center text-xs text-[#9a8f8a]">
                Match mutuel requis pour la messagerie.
              </p>
            </>
          )}
        </div>

        <div className="flex gap-4 border-t border-white/[0.06] pt-4">
          <button type="button" onClick={() => setShowReport(true)} className="flex items-center gap-1.5 text-sm text-[#9a8f8a] transition hover:text-red-300">
            <Flag className="h-4 w-4" /> Signaler
          </button>
          <button type="button" onClick={handleBlock} className="flex items-center gap-1.5 text-sm text-[#9a8f8a] transition hover:text-red-300">
            <Ban className="h-4 w-4" /> Bloquer
          </button>
        </div>
      </div>

      {privateAlbums.length > 0 && (
        <section className="mt-6 space-y-4">
          <h3 className="font-display text-lg font-semibold text-[#c9a962]">Albums privés</h3>
          {privateAlbums.map((album) => (
            <PrivateAlbumGallery
              key={album.id}
              ownerUserId={profile.user_id}
              album={album}
              onAccessChange={() => void load()}
            />
          ))}
        </section>
      )}

      <div className="mt-6">
        <SafetyTips compact />
      </div>

      {showConnectModal && (
        <ConnectionRequestModal
          name={profileDisplayName(profile)}
          requestsRemaining={requestsRemaining}
          onClose={() => setShowConnectModal(false)}
          onSend={handleSendRequest}
        />
      )}

      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="premium-card w-full max-w-md p-6">
            <h3 className="font-display text-lg font-semibold">Signaler {profileDisplayName(profile)}</h3>
            <textarea
              className="input-field mt-4 min-h-[100px]"
              placeholder="Décrivez la raison du signalement..."
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

      {showMatchModal && profile && matchId && (
        <MatchModal
          profile={profile}
          onClose={() => setShowMatchModal(false)}
          onMessage={() => router.push(`/messages/${matchId}`)}
        />
      )}
    </div>
  );
}
