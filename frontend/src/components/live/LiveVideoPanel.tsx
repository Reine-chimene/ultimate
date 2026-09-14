"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Signal, Video, VideoOff, Users } from "lucide-react";
import { LiveWebRTC } from "@/lib/live-webrtc";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";

type LiveVideoPanelProps = {
  roomId: string;
  isHost: boolean;
};

const CONNECTION_LABELS: Record<string, string> = {
  new: "Connexion…",
  connecting: "Connexion…",
  connected: "HD · connecté",
  disconnected: "Déconnecté",
  failed: "Échec — réessayez",
  closed: "Fermé",
};

export function LiveVideoPanel({ roomId, isHost }: LiveVideoPanelProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const rtcRef = useRef<LiveWebRTC | null>(null);
  const [status, setStatus] = useState("Initialisation…");
  const [error, setError] = useState<string | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState<string>("new");
  const [viewerCount, setViewerCount] = useState(0);
  const [maxViewers, setMaxViewers] = useState(15);

  useEffect(() => {
    api.live.config().then((c) => setMaxViewers(c.max_viewers)).catch(() => undefined);
  }, []);

  useEffect(() => {
    const rtc = new LiveWebRTC({
      roomId,
      isHost,
      localVideoRef,
      remoteVideoRef,
      onStatus: setStatus,
      onError: setError,
      onConnectionState: (state) => setConnectionState(state),
      onViewerCount: setViewerCount,
    });
    rtcRef.current = rtc;
    rtc.start().catch(() => undefined);

    return () => {
      rtc.stop();
      rtcRef.current = null;
    };
  }, [roomId, isHost]);

  const toggleTrack = (kind: "video" | "audio") => {
    const stream = localVideoRef.current?.srcObject as MediaStream | null;
    if (!stream) return;
    const tracks = kind === "video" ? stream.getVideoTracks() : stream.getAudioTracks();
    for (const track of tracks) {
      track.enabled = !track.enabled;
    }
    if (kind === "video") setVideoEnabled((v) => !v);
    else setAudioEnabled((a) => !a);
  };

  const connLabel = CONNECTION_LABELS[connectionState] ?? connectionState;

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
        {!isHost && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {isHost && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {!isHost && <video ref={localVideoRef} autoPlay playsInline muted className="hidden" />}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-[#f5f0e8]">
            <Signal className="h-3 w-3 text-[#c9a962]" />
            {connLabel}
          </span>
          {isHost && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-[#f5f0e8]">
              <Users className="h-3 w-3" />
              {viewerCount}/{maxViewers}
            </span>
          )}
        </div>
        <p className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-[#9a8f8a]">
          {status}
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-[#6b1d3a]/30 px-3 py-2 text-sm text-[#f5f0e8]">{error}</p>
      )}

      {isHost && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => toggleTrack("video")}>
            {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            Caméra
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => toggleTrack("audio")}>
            {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            Micro
          </Button>
        </div>
      )}

      {!isHost && (
        <p className="text-xs text-[#9a8f8a]">
          Relais TURN activé pour une connexion stable derrière les firewalls et réseaux mobiles.
        </p>
      )}
    </div>
  );
}
