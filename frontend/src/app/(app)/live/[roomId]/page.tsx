"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Crown, Users } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { LiveRoom } from "@/types";
import { LiveVideoPanel } from "@/components/live/LiveVideoPanel";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function LiveRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = String(params.roomId);
  const [room, setRoom] = useState<LiveRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inRoom, setInRoom] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.live.get(roomId);
      setRoom(data);
      setInRoom(data.is_host || data.is_joined);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Salon introuvable");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    load();
  }, [load]);

  const enterRoom = async () => {
    try {
      const data = await api.live.join(roomId);
      setRoom(data);
      setInRoom(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible de rejoindre");
    }
  };

  const leaveRoom = async () => {
    try {
      await api.live.leave(roomId);
    } catch {
      /* ignore */
    }
    router.push("/live");
  };

  const endRoom = async () => {
    try {
      await api.live.end(roomId);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible de terminer");
      return;
    }
    router.push("/live");
  };

  if (loading) return <LoadingSpinner />;

  if (error && !room) {
    return (
      <div className="premium-card p-8 text-center">
        <p className="text-[#9a8f8a]">{error}</p>
        <Link href="/live" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Retour aux salons</Button>
        </Link>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/live"
            className="mb-3 inline-flex items-center gap-1 text-sm text-[#9a8f8a] transition hover:text-[#f5f0e8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Salons live
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {room.is_vip_only && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#c9a962]/20 px-2 py-0.5 text-[10px] font-medium text-[#c9a962]">
                <Crown className="h-3 w-3" />
                VIP
              </span>
            )}
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-[#c9a962] md:text-3xl">{room.title}</h1>
          <p className="text-sm text-[#9a8f8a]">Hôte · {room.host_display_name}</p>
          {room.description && <p className="mt-2 text-sm text-[#f5f0e8]/80">{room.description}</p>}
          <p className="mt-2 flex items-center gap-1 text-xs text-[#9a8f8a]">
            <Users className="h-3.5 w-3.5" />
            {room.viewer_count} spectateur{room.viewer_count !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {room.is_host ? (
            <Button variant="outline" size="sm" onClick={endRoom}>
              Terminer le live
            </Button>
          ) : inRoom ? (
            <Button variant="outline" size="sm" onClick={leaveRoom}>
              Quitter
            </Button>
          ) : (
            <Button variant="gold" size="sm" onClick={enterRoom}>
              Rejoindre le salon
            </Button>
          )}
        </div>
      </div>

      {inRoom ? (
        <LiveVideoPanel roomId={roomId} isHost={room.is_host} />
      ) : (
        <div className="premium-card p-8 text-center">
          <p className="text-[#9a8f8a]">Rejoignez le salon pour voir le flux vidéo de l&apos;hôte.</p>
          <Button variant="gold" size="sm" className="mt-4" onClick={enterRoom}>
            Entrer dans le salon
          </Button>
        </div>
      )}
    </div>
  );
}
