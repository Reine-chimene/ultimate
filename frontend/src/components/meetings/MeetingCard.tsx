"use client";

import type { Meeting } from "@/types";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { Calendar, MapPin } from "lucide-react";

interface MeetingCardProps {
  meeting: Meeting;
  name?: string | null;
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
}

export function MeetingCard({ meeting, name, onAccept, onReject, onCancel }: MeetingCardProps) {
  return (
    <article className="premium-card p-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold">{name ?? "Utilisateur"}</h3>
            <StatusBadge status={meeting.status} />
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm text-[#c9a962]">
            <Calendar className="h-4 w-4 shrink-0" />
            {meeting.proposed_at_display ?? formatDateTime(meeting.proposed_at)}
          </p>
          {meeting.location && (
            <p className="mt-1 flex items-start gap-2 text-sm text-[#9a8f8a]">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {meeting.location}
            </p>
          )}
          {meeting.message && (
            <p className="mt-3 rounded-xl bg-white/[0.03] p-3 text-sm italic text-[#f5f0e8]/90">
              &ldquo;{meeting.message}&rdquo;
            </p>
          )}
        </div>
      </div>
      {(onAccept || onReject || onCancel) && (
        <div className="mt-5 flex flex-wrap gap-2">
          {onAccept && (
            <Button variant="gold" size="sm" onClick={onAccept}>Accepter</Button>
          )}
          {onReject && (
            <Button variant="ghost" size="sm" onClick={onReject}>Refuser</Button>
          )}
          {onCancel && (
            <Button variant="danger" size="sm" onClick={onCancel}>Annuler</Button>
          )}
        </div>
      )}
    </article>
  );
}
