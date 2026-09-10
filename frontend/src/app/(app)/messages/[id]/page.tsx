"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Send } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Conversation, Message } from "@/types";
import { formatTime } from "@/lib/utils";

export default function ConversationPage() {
  const { id: matchId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const conv = await api.matches.conversation(matchId);
    setConversation(conv);
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

  return (
    <div className="flex flex-col h-[calc(100dvh-11rem)] lg:h-[calc(100vh-8rem)] max-w-2xl mx-auto">
      <h1 className="font-display text-xl font-semibold mb-4 pb-4 border-b border-white/5">Conversation</h1>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {conversation?.messages.map((msg: Message) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                isMine ? "bg-[#6b1d3a]/60 rounded-br-sm" : "bg-white/10 rounded-bl-sm"
              }`}>
                <p className="text-sm">{msg.content}</p>
                <p className="text-[10px] text-[#9a8f8a] mt-1">{formatTime(msg.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 pt-4 border-t border-white/5">
        <input
          className="input-field flex-1"
          placeholder="Écrire un message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6b1d3a] disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
