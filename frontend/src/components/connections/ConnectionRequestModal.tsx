"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ConnectionRequestModalProps {
  name: string;
  requestsRemaining?: number | null;
  onClose: () => void;
  onSend: (introMessage: string) => Promise<void>;
}

export function ConnectionRequestModal({
  name,
  requestsRemaining,
  onClose,
  onSend,
}: ConnectionRequestModalProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const maxLen = 150;

  const handleSend = async () => {
    setSending(true);
    try {
      await onSend(message.trim());
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="premium-card w-full max-w-md p-6">
        <h3 className="font-display text-xl font-semibold">Envoyer une demande de connexion</h3>
        <p className="mt-2 text-sm text-[#9a8f8a]">
          {name} recevra votre demande et pourra l&apos;accepter ou la décliner. La messagerie s&apos;ouvrira
          uniquement après acceptation.
        </p>
        <textarea
          className="input-field mt-4 min-h-[90px]"
          placeholder="Ajouter un petit message... (optionnel)"
          value={message}
          maxLength={maxLen}
          onChange={(e) => setMessage(e.target.value)}
        />
        <p className="mt-1 text-right text-xs text-[#9a8f8a]">
          {message.length} / {maxLen}
        </p>
        {requestsRemaining != null && (
          <p className="mt-2 text-xs text-[#c9a962]">
            {requestsRemaining} demande{requestsRemaining > 1 ? "s" : ""} restante
            {requestsRemaining > 1 ? "s" : ""} aujourd&apos;hui
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button variant="gold" onClick={handleSend} disabled={sending} className="flex-1">
            <Heart className="h-4 w-4" />
            Envoyer la demande
          </Button>
        </div>
      </div>
    </div>
  );
}
