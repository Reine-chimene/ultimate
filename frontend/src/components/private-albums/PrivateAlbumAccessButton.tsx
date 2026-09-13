"use client";

import { useState } from "react";
import { Lock, Check, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import type { PrivateAlbumAccessStatus, PrivateAlbumSummary } from "@/types";

interface PrivateAlbumAccessButtonProps {
  ownerUserId: string;
  album: PrivateAlbumSummary;
  onUpdated?: (status: PrivateAlbumAccessStatus | null) => void;
}

const STATUS_LABELS: Record<string, { label: string; icon: typeof Lock }> = {
  pending: { label: "Demande envoyée", icon: Clock },
  approved: { label: "Accès accordé", icon: Check },
  rejected: { label: "Demande refusée", icon: XCircle },
  revoked: { label: "Accès révoqué", icon: Lock },
};

export function PrivateAlbumAccessButton({
  ownerUserId,
  album,
  onUpdated,
}: PrivateAlbumAccessButtonProps) {
  const [status, setStatus] = useState<PrivateAlbumAccessStatus | null>(album.access_status ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (album.is_owner || album.can_view_photos) return null;

  const handleRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.privateAlbums.requestAccess(ownerUserId, album.id);
      setStatus(res.status);
      onUpdated?.(res.status);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Impossible d'envoyer la demande");
    } finally {
      setLoading(false);
    }
  };

  if (status && status !== "revoked" && status !== "rejected") {
    const meta = STATUS_LABELS[status];
    const Icon = meta.icon;
    return (
      <div className="flex items-center gap-2 text-sm text-[#9a8f8a]">
        <Icon className="h-4 w-4 text-[#c9a962]" />
        {meta.label}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button variant="gold" size="sm" loading={loading} onClick={handleRequest}>
        Demander l&apos;accès
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
