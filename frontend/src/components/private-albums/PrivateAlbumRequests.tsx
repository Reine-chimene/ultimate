"use client";

import { useState } from "react";
import { Check, X, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import type { PrivateAlbumAccessRequest } from "@/types";

interface PrivateAlbumRequestsProps {
  albumId: string;
  requests: PrivateAlbumAccessRequest[];
  onChange: () => void;
}

export function PrivateAlbumRequests({ albumId, requests, onChange }: PrivateAlbumRequestsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (requestId: string, action: "approve" | "reject" | "revoke") => {
    setLoadingId(requestId);
    setError(null);
    try {
      if (action === "approve") await api.privateAlbums.approveRequest(albumId, requestId);
      if (action === "reject") await api.privateAlbums.rejectRequest(albumId, requestId);
      if (action === "revoke") await api.privateAlbums.revokeAccess(albumId, requestId);
      onChange();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Action impossible");
    } finally {
      setLoadingId(null);
    }
  };

  if (requests.length === 0) {
    return <p className="text-sm text-[#9a8f8a]">Aucune demande d&apos;accès pour cet album.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {requests.map((r) => (
        <div
          key={r.id}
          className="flex flex-col gap-3 rounded-lg border border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium">{r.requester_display_name}</p>
            <p className="text-xs capitalize text-[#9a8f8a]">{r.status}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {r.status === "pending" && (
              <>
                <Button
                  variant="gold"
                  size="sm"
                  loading={loadingId === r.id}
                  onClick={() => act(r.id, "approve")}
                >
                  <Check className="h-4 w-4" /> Accepter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  loading={loadingId === r.id}
                  onClick={() => act(r.id, "reject")}
                >
                  <X className="h-4 w-4" /> Refuser
                </Button>
              </>
            )}
            {r.status === "approved" && (
              <Button
                variant="danger"
                size="sm"
                loading={loadingId === r.id}
                onClick={() => act(r.id, "revoke")}
              >
                <UserMinus className="h-4 w-4" /> Révoquer
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
