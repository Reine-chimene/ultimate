import type { Message } from "@/types";

export type MessageRealtimeEvent =
  | { type: "connected" }
  | { type: "message"; message: Message }
  | { type: "typing"; user_id: string; is_typing: boolean }
  | { type: "read"; reader_id: string; read_at: string }
  | { type: "presence"; user_id: string; online: boolean }
  | { type: "pong" };

export function getMessageWsUrl(matchId: string): string {
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
  return `${wsBase}/api/v1/messages/${matchId}/ws?token=${encodeURIComponent(token)}`;
}

type MessageRealtimeOptions = {
  matchId: string;
  onEvent: (event: MessageRealtimeEvent) => void;
  onError?: () => void;
};

export class MessageRealtimeClient {
  private ws: WebSocket | null = null;
  private typingTimer: ReturnType<typeof setTimeout> | null = null;
  private options: MessageRealtimeOptions;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: MessageRealtimeOptions) {
    this.options = options;
  }

  connect() {
    const url = getMessageWsUrl(this.options.matchId);
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as MessageRealtimeEvent;
        this.options.onEvent(data);
      } catch {
        /* ignore */
      }
    };

    this.ws.onerror = () => this.options.onError?.();
    this.ws.onclose = () => this.stopPing();

    this.ws.onopen = () => {
      this.startPing();
    };
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      this.send({ type: "ping" });
    }, 25000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  sendTyping(isTyping: boolean) {
    this.send({ type: "typing", is_typing: isTyping });
  }

  notifyTypingInput() {
    this.sendTyping(true);
    if (this.typingTimer) clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => this.sendTyping(false), 2000);
  }

  private send(payload: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  disconnect() {
    this.sendTyping(false);
    this.stopPing();
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
