"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, Radio, Users, Video } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { LiveRoom } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function LivePage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [totalLive, setTotalLive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [vipOnly, setVipOnly] = useState(false);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.live.list();
      setRooms(res.rooms);
      setTotalLive(res.total_live);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible de charger les salons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startRoom = async () => {
    if (title.trim().length < 3) return;
    setStarting(true);
    setError(null);
    try {
      const room = await api.live.start({
        title: title.trim(),
        description: description.trim() || undefined,
        is_vip_only: vipOnly,
      });
      setTitle("");
      setDescription("");
      setVipOnly(false);
      router.push(`/live/${room.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible de lancer le salon");
    } finally {
      setStarting(false);
    }
  };

  const joinRoom = async (room: LiveRoom) => {
    try {
      await api.live.join(room.id);
      router.push(`/live/${room.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible de rejoindre");
    }
  };

  if (loading) return <LoadingSpinner />;

  const myLiveRoom = rooms.find((r) => r.is_host);

  return (
    <div>
      <header className="mb-8">
        <p className="section-label">Phase 3b · WebRTC Live</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-wide text-[#c9a962] md:text-4xl">
          SALONS LIVE
        </h1>
        <p className="mt-2 max-w-2xl text-[#9a8f8a]">
          Lancez votre cam ou rejoignez un salon — vidéo en direct via WebRTC, micro et caméra contrôlables.
        </p>
      </header>

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <div className="premium-card flex items-center gap-3 p-4">
          <Radio className="h-8 w-8 text-[#c9a962]" />
          <div>
            <p className="text-2xl font-display font-bold">{totalLive}</p>
            <p className="text-xs text-[#9a8f8a]">salon{totalLive !== 1 ? "s" : ""} en direct</p>
          </div>
        </div>
        <div className="premium-card flex items-center gap-3 p-4">
          <Video className="h-8 w-8 text-[#c9a962]" />
          <div>
            <p className="text-sm font-medium text-[#f5f0e8]">WebRTC actif</p>
            <p className="text-xs text-[#9a8f8a]">Diffusion cam · spectateurs en temps réel</p>
          </div>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-[#6b1d3a]/30 px-4 py-3 text-sm text-[#f5f0e8]">{error}</p>
      )}

      {myLiveRoom ? (
        <div className="premium-card mb-10 flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#c9a962]">Votre salon</p>
            <h2 className="font-display text-lg font-semibold">{myLiveRoom.title}</h2>
            <p className="text-sm text-[#9a8f8a]">Reprenez la diffusion ou terminez le live.</p>
          </div>
          <Link href={`/live/${myLiveRoom.id}`}>
            <Button variant="gold" size="sm">Entrer dans mon salon</Button>
          </Link>
        </div>
      ) : (
        <div className="premium-card mb-10 p-6 md:p-8">
          <h2 className="font-display text-lg font-semibold">Lancer un salon live</h2>
          <p className="mt-1 text-sm text-[#9a8f8a]">
            Caméra + micro requis pour diffuser. Les spectateurs vous voient en direct.
          </p>
          <div className="mt-4 space-y-4">
            <Input
              label="Titre du salon"
              placeholder="Ex. : Show lingerie · Duo en cam · Soirée coquine"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              label="Description (optionnelle)"
              placeholder="Dites aux spectateurs à quoi s'attendre…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#9a8f8a]">
              <input
                type="checkbox"
                checked={vipOnly}
                onChange={(e) => setVipOnly(e.target.checked)}
                className="rounded border-white/20 bg-white/5"
              />
              <Crown className="h-4 w-4 text-[#c9a962]" />
              Salon VIP Gold uniquement
            </label>
            <Button variant="gold" size="sm" disabled={starting || title.trim().length < 3} onClick={startRoom}>
              {starting ? "Lancement…" : "Démarrer et ouvrir la cam"}
            </Button>
          </div>
        </div>
      )}

      <h2 className="mb-4 font-display text-lg font-semibold">En direct maintenant</h2>

      {rooms.length === 0 ? (
        <EmptyState
          icon={Video}
          title="Aucun salon en direct"
          description="Soyez le premier·e à lancer un show cam — ou revenez un peu plus tard."
        />
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => (
            <div key={room.id} className="premium-card p-5 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-400">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                      Live
                    </span>
                    {room.is_vip_only && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#c9a962]/20 px-2 py-0.5 text-[10px] font-medium text-[#c9a962]">
                        <Crown className="h-3 w-3" />
                        VIP
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-xl font-semibold">{room.title}</h3>
                  <p className="text-sm text-[#9a8f8a]">Hôte · {room.host_display_name}</p>
                  {room.description && (
                    <p className="mt-2 text-sm text-[#f5f0e8]/80">{room.description}</p>
                  )}
                  <p className="mt-3 flex items-center gap-1 text-xs text-[#9a8f8a]">
                    <Users className="h-3.5 w-3.5" />
                    {room.viewer_count} spectateur{room.viewer_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {room.is_host || room.is_joined ? (
                    <Link href={`/live/${room.id}`}>
                      <Button variant="gold" size="sm">
                        {room.is_host ? "Diffuser" : "Regarder"}
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="gold" size="sm" onClick={() => joinRoom(room)}>
                      Rejoindre
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
