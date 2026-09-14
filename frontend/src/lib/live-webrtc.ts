import type { RefObject } from "react";
import { api } from "@/lib/api";

export type SignalMessage = {
  type: string;
  from?: string;
  to?: string;
  user_id?: string;
  display_name?: string;
  is_host?: boolean;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  peers?: { user_id: string; display_name: string; is_host: boolean }[];
  message?: string;
};

const FALLBACK_ICE: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

let cachedIceServers: RTCIceServer[] | null = null;

export async function fetchIceServers(): Promise<RTCIceServer[]> {
  if (cachedIceServers) return cachedIceServers;
  try {
    const config = await api.live.config();
    cachedIceServers = config.ice_servers as RTCIceServer[];
    return cachedIceServers;
  } catch {
    return FALLBACK_ICE;
  }
}

export function getLiveSignalUrl(roomId: string): string {
  if (typeof window === "undefined") return "";
  const token = localStorage.getItem("access_token") ?? "";
  const explicit = process.env.NEXT_PUBLIC_API_URL?.trim();
  let wsBase: string;
  if (explicit) {
    wsBase = explicit.replace(/^http/i, "ws");
  } else {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    wsBase = `${proto}//${window.location.host}`;
  }
  return `${wsBase}/api/v1/live/rooms/${roomId}/signal?token=${encodeURIComponent(token)}`;
}

type LiveWebRTCOptions = {
  roomId: string;
  isHost: boolean;
  localVideoRef: RefObject<HTMLVideoElement | null>;
  remoteVideoRef: RefObject<HTMLVideoElement | null>;
  onStatus?: (status: string) => void;
  onError?: (message: string) => void;
  onConnectionState?: (state: RTCPeerConnectionState | "disconnected") => void;
  onViewerCount?: (count: number) => void;
};

export class LiveWebRTC {
  private ws: WebSocket | null = null;
  private localStream: MediaStream | null = null;
  private iceServers: RTCIceServer[] = FALLBACK_ICE;
  private peers = new Map<string, RTCPeerConnection>();
  private options: LiveWebRTCOptions;

  constructor(options: LiveWebRTCOptions) {
    this.options = options;
  }

  async start() {
    const { isHost, localVideoRef, remoteVideoRef, onStatus, onError } = this.options;
    onStatus?.("Connexion au salon…");

    this.iceServers = await fetchIceServers();

    if (isHost) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        this.localStream = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          await localVideoRef.current.play().catch(() => undefined);
        }
      } catch {
        onError?.("Autorisez la caméra et le micro pour diffuser.");
        throw new Error("media denied");
      }
    }

    const url = getLiveSignalUrl(this.options.roomId);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => onStatus?.(isHost ? "En direct — en attente de spectateurs" : "Connecté au salon");

    this.ws.onmessage = async (event) => {
      let msg: SignalMessage;
      try {
        msg = JSON.parse(event.data as string) as SignalMessage;
      } catch {
        return;
      }
      await this.handleSignal(msg, remoteVideoRef);
    };

    this.ws.onclose = (event) => {
      if (event.code === 4429) {
        onError?.("Salon complet — réessayez plus tard");
      }
      onStatus?.("Déconnecté du salon");
      this.options.onConnectionState?.("disconnected");
    };
    this.ws.onerror = () => onError?.("Connexion signalisation interrompue");
  }

  private send(payload: SignalMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private adaptHostQuality() {
    if (!this.options.isHost || !this.localStream) return;
    const count = this.peers.size;
    this.options.onViewerCount?.(count);
    const track = this.localStream.getVideoTracks()[0];
    if (!track) return;
    const height = count > 8 ? 360 : count > 4 ? 480 : 720;
    track.applyConstraints({ height: { ideal: height }, width: { ideal: Math.round(height * 16 / 9) } }).catch(() => undefined);
  }

  private createPeer(viewerId: string, remoteVideoRef: RefObject<HTMLVideoElement | null>) {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    this.peers.set(viewerId, pc);

    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream);
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: "ice",
          to: viewerId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    if (!this.options.isHost) {
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(() => undefined);
        }
        this.options.onStatus?.("Flux vidéo reçu");
      };
    }

    pc.onconnectionstatechange = () => {
      this.options.onConnectionState?.(pc.connectionState);
      if (pc.connectionState === "failed") {
        this.options.onError?.("Connexion vidéo échouée — relais TURN activé, réessayez");
      }
      if (pc.connectionState === "connected" && !this.options.isHost) {
        this.options.onStatus?.("Connecté en HD");
      }
    };

    if (this.options.isHost) {
      this.adaptHostQuality();
    }

    return pc;
  }

  private async handleSignal(msg: SignalMessage, remoteVideoRef: RefObject<HTMLVideoElement | null>) {
    const { isHost, onStatus } = this.options;

    if (msg.type === "connected") {
      if (isHost && msg.peers) {
        for (const peer of msg.peers) {
          if (!peer.is_host) {
            await this.initHostOffer(peer.user_id);
          }
        }
      }
      return;
    }

    if (msg.type === "viewer-joined" && isHost && msg.user_id) {
      onStatus?.(`Spectateur · ${msg.display_name ?? "anonyme"}`);
      await this.initHostOffer(msg.user_id);
      return;
    }

    if (msg.type === "viewer-left" && isHost && msg.user_id) {
      const pc = this.peers.get(msg.user_id);
      pc?.close();
      this.peers.delete(msg.user_id);
      this.adaptHostQuality();
      return;
    }

    if (msg.type === "host-left") {
      this.options.onError?.("L'hôte a quitté le salon");
      return;
    }

    if (msg.type === "offer" && !isHost && msg.from && msg.sdp) {
      const pc = this.createPeer(msg.from, remoteVideoRef);
      await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.send({ type: "answer", to: msg.from, sdp: answer });
      return;
    }

    if (msg.type === "answer" && isHost && msg.from && msg.sdp) {
      const pc = this.peers.get(msg.from);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      }
      return;
    }

    if (msg.type === "ice" && msg.from && msg.candidate) {
      const pc = this.peers.get(msg.from);
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        } catch {
          /* ignore stale candidates */
        }
      }
    }
  }

  private async initHostOffer(viewerId: string) {
    if (!this.options.isHost) return;
    const existing = this.peers.get(viewerId);
    if (existing) {
      existing.close();
      this.peers.delete(viewerId);
    }
    const pc = this.createPeer(viewerId, this.options.remoteVideoRef);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.send({ type: "offer", to: viewerId, sdp: offer });
  }

  stop() {
    for (const pc of this.peers.values()) {
      pc.close();
    }
    this.peers.clear();
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        track.stop();
      }
      this.localStream = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
