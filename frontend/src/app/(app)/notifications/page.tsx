"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Lock,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Notification } from "@/types";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatRelativeTime } from "@/lib/utils";

function notificationIcon(type: string) {
  if (type === "like_received") return Heart;
  if (type === "match_created" || type === "match") return Heart;
  if (type === "message_received") return MessageCircle;
  if (type === "profile_view") return Eye;
  if (type.startsWith("private_album")) return Lock;
  if (type.startsWith("connection")) return UserPlus;
  return Bell;
}

function notificationHref(n: Notification): string | null {
  if (n.reference_type === "match" && n.reference_id) {
    return `/messages/${n.reference_id}`;
  }
  if (n.reference_type === "profile" && n.reference_id) {
    return `/profil/${n.reference_id}`;
  }
  if (n.type.startsWith("connection")) return "/matchs";
  if (n.reference_type === "private_album") return "/mon-profil/albums-prives";
  return null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.notifications.list(p, 20);
      setNotifications(res.items);
      setUnread(res.unread_count);
      setPage(res.page);
      setTotalPages(Math.max(1, Math.ceil(res.total / res.limit)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1);
  }, [load]);

  const markAllRead = async () => {
    await api.notifications.markAllRead();
    await load(page);
  };

  const handleClick = async (n: Notification) => {
    if (!n.read_at) {
      await api.notifications.markRead(n.id);
      setUnread((c) => Math.max(0, c - 1));
      setNotifications((items) =>
        items.map((item) =>
          item.id === n.id ? { ...item, read_at: new Date().toISOString(), is_read: true } : item,
        ),
      );
    }
    const href = notificationHref(n);
    if (href) router.push(href);
  };

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Notifications"
        subtitle="Vos intérêts, matchs, messages et visites de profil."
      />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#c9a962]" />
          {unread > 0 && (
            <span className="rounded-full bg-[#6b1d3a] px-2.5 py-0.5 text-xs font-medium">
              {unread}
            </span>
          )}
        </div>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={() => void markAllRead()}>
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <LoadingSpinner />
      ) : notifications.length === 0 ? (
        <div className="glass-card p-12 text-center text-[#9a8f8a]">
          Aucune notification.
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = notificationIcon(n.type);
              const unreadItem = !n.read_at;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => void handleClick(n)}
                  className={`glass-card w-full p-4 text-left transition hover:bg-white/[0.05] ${
                    unreadItem ? "border-l-2 border-[#c9a962] bg-white/[0.02]" : "opacity-75"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6b1d3a]/30">
                      <Icon className="h-5 w-5 text-[#c9a962]" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium">{n.title}</h3>
                        <span className="shrink-0 text-[11px] text-[#9a8f8a]">
                          {formatRelativeTime(n.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#9a8f8a]">{n.body}</p>
                      {unreadItem && (
                        <span className="mt-2 inline-block text-[10px] uppercase tracking-wide text-[#c9a962]">
                          Non lu
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => void load(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-[#9a8f8a]">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => void load(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
