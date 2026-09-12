"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Conversation, Match, Message } from "@/types";
import { formatTime, getPrimaryPhoto } from "@/lib/utils";
import { SafetyTips } from "@/components/ui/SafetyTips";

export default function ConversationPage() {
  const { id: matchId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const [conv, matches] = await Promise.all([
      api.matches.conversation(matchId),
      api.matches.list(),
    ]);
    setConversation(conv);
    setMatch(matches.find((m) => m.id === matchId) ?? null);
    await api.messages.markRead(matchId);
  };

  useEffect(() => { load(); }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.messages.send(matchId, text.trim());
      setText("");
      await load();
    } finally {
      setSending(false);
    }
  };

  const other = match?.other_user;

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <header className="premium-card mb-4 flex items-center gap-3 p-4">
        <Link href="/messages" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 transition hover:bg-white/10 lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {other && (
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-[#c9a962]/30">
            <Image src={getPrimaryPhoto(other.photos)} alt={other.first_name} fill className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg font-semibold">{other?.first_name ?? "Conversation"}</h1>
          <p className="truncate text-xs text-[#9a8f8a]">{other?.city ?? "Match"}</p>
        </div>
        {other && (
          <Link href={`/profil/${other.id}`} className="shrink-0 text-xs text-[#c9a962] hover:underline">
            Profil
          </Link>
        )}
      </header>

      <div className="premium-card flex min-h-[50dvh] flex-col lg:min-h-[calc(100vh-14rem)]">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {conversation?.messages.length === 0 && (
            <p className="py-8 text-center text-sm text-[#9a8f8a]">
              Démarrez la conversation — un simple « bonjour » suffit.
            </p>
          )}
          {conversation?.messages.map((msg: Message) => {
            const isMine = msg.sender_id === user?.id;
            const unread = !isMine && !msg.read_at;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`relative max-w-[82%] rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? "rounded-br-md bg-gradient-to-br from-[#6b1d3a]/80 to-[#8b2a4d]/70"
                      : "rounded-bl-md bg-white/[0.08]"
                  } ${unread ? "ring-1 ring-[#c9a962]/30" : ""}`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`mt-1 text-[10px] ${isMine ? "text-white/60" : "text-[#9a8f8a]"}`}>
                    {formatTime(msg.created_at)}
                    {unread && " · Nouveau"}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-2 border-t border-white/[0.06] p-4">
          <input
            className="input-field flex-1"
            placeholder="Écrire un message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            aria-label="Envoyer"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6b1d3a] to-[#8b2a4d] transition hover:shadow-lg hover:shadow-[#6b1d3a]/25 disabled:opacity-40"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>

      <div className="mt-4">
        <SafetyTips compact />
      </div>
    </div>
  );
}
