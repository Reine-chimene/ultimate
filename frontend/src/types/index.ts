export type Gender = "male" | "female" | "non_binary" | "other";
export type RelationshipIntention = "relationship" | "casual" | "friendship" | "unsure";
export type MeetingStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type UserRole = "user" | "admin";
export type SubscriptionPlan = "free" | "premium" | "vip";
export type SubscriptionStatus = "active" | "cancelled" | "expired";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export interface User {
  id: string;
  email: string;
  first_name: string;
  date_of_birth: string;
  gender: Gender;
  city: string;
  role: UserRole;
  is_active: boolean;
  terms_accepted_at: string;
  created_at: string;
}

export interface Photo {
  id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Interest {
  id: string;
  name: string;
}

export interface PublicProfile {
  id: string;
  user_id: string;
  first_name: string;
  age: number;
  gender: Gender;
  city: string;
  bio: string | null;
  relationship_intention: RelationshipIntention;
  occupation: string | null;
  photos: Photo[];
  interests: Interest[];
  compatibility_score?: number | null;
  is_available_tonight?: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  bio: string | null;
  relationship_intention: RelationshipIntention;
  looking_for_genders: Gender[];
  min_age: number;
  max_age: number;
  max_distance_km: number;
  occupation: string | null;
  photos: Photo[];
  interests: Interest[];
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  conversation_id: string;
  matched_at: string;
  other_user?: PublicProfile | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  match_id?: string | null;
  messages: Message[];
}

export interface Meeting {
  id: string;
  requester_id: string;
  receiver_id: string;
  proposed_at: string;
  location: string | null;
  message: string | null;
  status: MeetingStatus;
  requester_name?: string | null;
  receiver_name?: string | null;
}

export interface Availability {
  id: string;
  user_id: string;
  available_date: string;
  is_available: boolean;
  note: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  payments: { id: string; amount: string; currency: string; status: string }[];
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  new_users_7d: number;
  total_matches: number;
  total_messages: number;
  tonight_users: number;
  total_meetings: number;
  pending_reports: number;
  active_subscriptions: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
