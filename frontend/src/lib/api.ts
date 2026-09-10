import type {
  AdminStats,
  AuthTokens,
  Availability,
  Conversation,
  Match,
  Meeting,
  Message,
  Notification,
  Profile,
  PublicProfile,
  Report,
  Subscription,
  User,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/v1${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = "Une erreur est survenue";
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    register: (data: Record<string, unknown>) =>
      request<{ user: User; tokens: AuthTokens }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    login: (email: string, password: string) =>
      request<{ user: User; tokens: AuthTokens }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<User>("/auth/me"),
  },
  profiles: {
    me: () => request<Profile>("/profiles/me"),
    update: (data: Partial<Profile>) =>
      request<Profile>("/profiles/me", { method: "PATCH", body: JSON.stringify(data) }),
    get: (id: string) => request<PublicProfile>(`/profiles/${id}`),
    addPhoto: (url: string, isPrimary = false) =>
      request("/profiles/me/photos", {
        method: "POST",
        body: JSON.stringify({ url, is_primary: isPrimary }),
      }),
    deletePhoto: (id: string) => request(`/profiles/me/photos/${id}`, { method: "DELETE" }),
    addInterest: (name: string) =>
      request("/profiles/me/interests", { method: "POST", body: JSON.stringify({ name }) }),
    deleteInterest: (id: string) =>
      request(`/profiles/me/interests/${id}`, { method: "DELETE" }),
  },
  discovery: {
    list: (params?: Record<string, string | number | boolean>) => {
      const qs = params
        ? "?" + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
        : "";
      return request<{ profiles: PublicProfile[]; total: number }>(`/discovery${qs}`);
    },
  },
  likes: {
    action: (receiverId: string, isLike: boolean) =>
      request<{ is_like: boolean; is_match: boolean; match_id: string | null }>("/likes", {
        method: "POST",
        body: JSON.stringify({ receiver_id: receiverId, is_like: isLike }),
      }),
    received: () => request<{ sender_ids: string[]; count: number }>("/likes/received"),
  },
  matches: {
    list: () => request<Match[]>("/matches"),
    conversation: (matchId: string) =>
      request<Conversation>(`/matches/${matchId}/conversation`),
  },
  messages: {
    send: (matchId: string, content: string) =>
      request<Message>(`/messages/${matchId}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    markRead: (matchId: string) =>
      request(`/messages/${matchId}/read`, { method: "POST" }),
  },
  availability: {
    set: (data: { is_available: boolean; note?: string }) =>
      request<Availability>("/availability", { method: "POST", body: JSON.stringify(data) }),
    me: () => request<Availability[]>("/availability/me"),
    tonight: () =>
      request<{ date: string; users: PublicProfile[] }>("/availability/tonight"),
  },
  meetings: {
    list: () => request<Meeting[]>("/meetings"),
    create: (data: {
      receiver_id: string;
      proposed_at: string;
      location?: string;
      message?: string;
    }) => request<Meeting>("/meetings", { method: "POST", body: JSON.stringify(data) }),
    accept: (id: string) => request<Meeting>(`/meetings/${id}/accept`, { method: "POST" }),
    reject: (id: string) => request<Meeting>(`/meetings/${id}/reject`, { method: "POST" }),
    cancel: (id: string) => request<Meeting>(`/meetings/${id}/cancel`, { method: "POST" }),
  },
  subscriptions: {
    me: () => request<Subscription | null>("/subscriptions/me"),
    subscribe: (durationMonths: number) =>
      request<Subscription>("/subscriptions", {
        method: "POST",
        body: JSON.stringify({ plan: "premium", duration_months: durationMonths }),
      }),
    cancel: () => request<Subscription>("/subscriptions/cancel", { method: "POST" }),
  },
  notifications: {
    list: (unreadOnly = false) =>
      request<Notification[]>(`/notifications?unread_only=${unreadOnly}`),
    unreadCount: () => request<{ count: number }>("/notifications/unread-count"),
    markRead: (id: string) =>
      request<Notification>(`/notifications/${id}/read`, { method: "POST" }),
    markAllRead: () => request("/notifications/read-all", { method: "POST" }),
  },
  reports: {
    create: (reportedId: string, reason: string, description?: string) =>
      request<Report>("/reports", {
        method: "POST",
        body: JSON.stringify({ reported_id: reportedId, reason, description }),
      }),
    block: (blockedId: string) =>
      request("/reports/block", { method: "POST", body: JSON.stringify({ blocked_id: blockedId }) }),
    unblock: (blockedId: string) =>
      request(`/reports/block/${blockedId}`, { method: "DELETE" }),
    blocks: () => request<{ id: string; blocked_id: string }[]>("/reports/blocks"),
  },
  admin: {
    stats: () => request<AdminStats>("/admin/stats"),
    users: (skip = 0, limit = 50) =>
      request<{ users: User[]; total: number }>(`/admin/users?skip=${skip}&limit=${limit}`),
    updateUser: (id: string, data: { is_active?: boolean; role?: string }) =>
      request<User>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    reports: (status?: string) =>
      request<Report[]>(`/admin/reports${status ? `?status=${status}` : ""}`),
    updateReport: (id: string, status: string) =>
      request<Report>(`/admin/reports/${id}?status=${status}`, { method: "PATCH" }),
  },
};

export { ApiError };
