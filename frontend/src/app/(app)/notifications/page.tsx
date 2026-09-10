"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import type { Notification } from "@/types";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  const load = async () => {
    const [list, count] = await Promise.all([
      api.notifications.list(),
      api.notifications.unreadCount(),
    ]);
    setNotifications(list);
    setUnread(count.count);
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await api.notifications.markAllRead();
    load();
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-[#c9a962]" />
          <h1 className="font-display text-2xl font-semibold">Notifications</h1>
          {unread > 0 && (
            <span className="rounded-full bg-[#6b1d3a] px-2 py-0.5 text-xs">{unread}</span>
          )}
        </div>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>Tout lire</Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="glass-card p-12 text-center text-[#9a8f8a]">
          Aucune notification.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`glass-card p-4 cursor-pointer hover:bg-white/5 transition ${
                !n.read_at ? "border-l-2 border-[#c9a962]" : "opacity-70"
              }`}
              onClick={async () => {
                if (!n.read_at) {
                  await api.notifications.markRead(n.id);
                  load();
                }
              }}
            >
              <h3 className="font-medium text-sm">{n.title}</h3>
              <p className="text-sm text-[#9a8f8a] mt-1">{n.body}</p>
              <p className="text-xs text-[#9a8f8a]/60 mt-2">{formatDateTime(n.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
