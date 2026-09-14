"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { LiveWebRTC } from "@/lib/live-webrtc";
import { Button } from "@/components/ui/Button";

type LiveVideoPanelProps = {
  roomId: string;
  isHost: boolean;
};

export function LiveVideoPanel({ roomId, isHost }: LiveVideoPanelProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const rtcRef = useRef<LiveWebRTC | null>(null);
  const [status, setStatus] = useState("Initialisation…");
  const [error, setError] = useState<string | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    const rtc = new LiveWebRTC({
      roomId,
      isHost,
      localVideoRef,
      remoteVideoRef,
      onStatus: setStatus,
      onError: setError,
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
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
          <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-[#f5f0e8]">{status}</span>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-[#6b1d3a]/30 px-3 py-2 text-sm text-[#f5f0e8]">{error}</p>
      )}

      {isHost && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toggleTrack("video")}
            aria-label={videoEnabled ? "Couper la caméra" : "Activer la caméra"}
          >
            {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            Caméra
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toggleTrack("audio")}
            aria-label={audioEnabled ? "Couper le micro" : "Activer le micro"}
          >
            {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            Micro
          </Button>
        </div>
      )}
    </div>
  );
}
