import type {
  AdminStats,
  AuthTokens,
  Availability,
  Conversation,
  Match,
  Meeting,
  Message,
  Notification,
  Photo,
  PendingRequests,
  Preferences,
  Profile,
  PublicProfile,
  Report,
  Subscription,
  TravelMeResponse,
  TravelPlan,
  User,
  WorldResponse,
} from "@/types";

// Vide en prod Netlify → requêtes relatives proxifiées vers Fly.io
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8100";

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
      if (typeof body.detail === "string") {
        detail = body.detail;
      } else if (Array.isArray(body.detail)) {
        detail = body.detail.map((e: { msg?: string }) => e.msg).filter(Boolean).join(". ") || detail;
      }
    } catch {
      /* ignore */
    }
    if (detail === "Une erreur est survenue") {
      const defaults: Record<number, string> = {
        401: "Session expirée ou identifiants invalides.",
        403: "Vous n'avez pas l'autorisation pour cette action.",
        404: "Ressource introuvable.",
        409: "Une demande de connexion existe déjà.",
        422: "Vérifiez les informations saisies.",
        500: "Une erreur est survenue. Veuillez réessayer.",
      };
      detail = defaults[res.status] ?? detail;
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
    completeOnboarding: () =>
      request<User>("/auth/onboarding/complete", { method: "POST" }),
    refresh: (refreshToken: string) =>
      request<AuthTokens>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      }),
    forgotPassword: (email: string) =>
      request<{ detail: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token: string, newPassword: string) =>
      request<{ detail: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password: newPassword }),
      }),
  },
  profiles: {
    me: () => request<Profile>("/profiles/me"),
    update: (data: Record<string, unknown>) =>
      request<Profile>("/profiles/me", { method: "PATCH", body: JSON.stringify(data) }),
    preferences: () => request<Preferences>("/profiles/me/preferences"),
    updatePreferences: (data: Partial<Preferences>) =>
      request<Preferences>("/profiles/me/preferences", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    get: (id: string) => request<PublicProfile>(`/profiles/${id}`),
    addPhoto: (url: string, isPrimary = false) =>
      request<Photo>("/profiles/me/photos", {
        method: "POST",
        body: JSON.stringify({ url, is_primary: isPrimary }),
      }),
    uploadPhoto: async (file: File, isPrimary = false): Promise<Photo> => {
      const token = getToken();
      const form = new FormData();
      form.append("file", file);
      form.append("is_primary", String(isPrimary));
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/v1/profiles/me/photos/upload`, {
        method: "POST",
        headers,
        body: form,
      });
      if (!res.ok) {
        let detail = "Impossible d'ajouter cette photo. Vérifiez le format et la taille.";
        try {
          const body = await res.json();
          if (typeof body.detail === "string") detail = body.detail;
        } catch {
          /* ignore */
        }
        throw new ApiError(res.status, detail);
      }
      return res.json();
    },
    deletePhoto: (id: string) => request(`/profiles/me/photos/${id}`, { method: "DELETE" }),
    addInterest: (name: string, category?: string) =>
      request("/profiles/me/interests", {
        method: "POST",
        body: JSON.stringify({ name, category: category || null }),
      }),
    like: (userId: string) =>
      request<{ is_like: boolean; is_match: boolean; match_id: string | null; likes_remaining: number | null }>(
        `/profiles/me/like/${userId}`,
        { method: "POST" },
      ),
    unlike: (userId: string) =>
      request(`/profiles/me/like/${userId}`, { method: "DELETE" }),
    pass: (userId: string) =>
      request(`/profiles/me/pass/${userId}`, { method: "POST" }),
    clearPasses: () => request<{ cleared: number }>("/profiles/me/passes", { method: "DELETE" }),
    likesReceived: () =>
      request<{ received: { user_id: string; profile: PublicProfile; created_at: string }[]; likes_remaining: number }>(
        "/profiles/me/likes-received",
      ),
    likesSent: () =>
      request<{ sent: { user_id: string; profile: PublicProfile; created_at: string }[]; likes_remaining: number }>(
        "/profiles/me/likes-sent",
      ),
    interestsCatalog: () => request<{ categories: Record<string, string[]> }>("/profiles/interests/catalog"),
    deleteInterest: (id: string) =>
      request(`/profiles/me/interests/${id}`, { method: "DELETE" }),
    completion: () =>
      request<{ percent: number; is_complete: boolean; missing: string[]; items: { key: string; label: string; done: boolean }[] }>(
        "/profiles/me/completion",
      ),
  },
  search: {
    query: (params?: Record<string, string | number | boolean>) => {
      const qs = params
        ? "?" + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
        : "";
      return request<{
        profiles: PublicProfile[];
        total: number;
        page: number;
        page_size: number;
        has_more: boolean;
      }>(`/search${qs}`);
    },
  },
  discovery: {
    list: (params?: Record<string, string | number | boolean>) => {
      const qs = params
        ? "?" + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
        : "";
      return request<{ profiles: PublicProfile[]; total: number }>(`/discovery${qs}`);
    },
  },
  connections: {
    request: (receiverId: string, introMessage?: string) =>
      request<{ state: string; match_id: string | null; requests_remaining: number | null }>(
        "/connections/request",
        {
          method: "POST",
          body: JSON.stringify({ receiver_id: receiverId, intro_message: introMessage || null }),
        },
      ),
    accept: (userId: string) =>
      request<{ state: string; match_id: string | null }>(`/connections/${userId}/accept`, {
        method: "POST",
      }),
    decline: (userId: string) =>
      request<{ state: string }>(`/connections/${userId}/decline`, { method: "POST" }),
    status: (userId: string) =>
      request<{ state: string; match_id: string | null; intro_message: string | null; requests_remaining: number | null }>(
        `/connections/status/${userId}`,
      ),
    pending: () => request<PendingRequests>("/connections/pending"),
  },
  likes: {
    action: (receiverId: string, isLike: boolean, introMessage?: string) =>
      request<{ is_like: boolean; is_match: boolean; match_id: string | null; likes_remaining: number | null }>("/likes", {
        method: "POST",
        body: JSON.stringify({
          receiver_id: receiverId,
          is_like: isLike,
          intro_message: introMessage || null,
        }),
      }),
    received: () => request<{ sender_ids: string[]; count: number }>("/likes/received"),
    pending: () => request<PendingRequests>("/connections/pending"),
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
    set: (data: {
      is_available: boolean;
      note?: string;
      start_time?: string;
      end_time?: string;
    }) => request<Availability>("/availability", { method: "POST", body: JSON.stringify(data) }),
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
  world: {
    overview: () => request<WorldResponse>("/world"),
  },
  travel: {
    me: () => request<TravelMeResponse>("/travel/me"),
    create: (data: {
      country: string;
      city: string;
      arrival_date: string;
      departure_date: string;
      wants_to_meet?: boolean;
    }) =>
      request<TravelPlan>("/travel", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request(`/travel/${id}`, { method: "DELETE" }),
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
