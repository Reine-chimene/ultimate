export type Gender = "male" | "female" | "non_binary" | "other";
export type RelationshipIntention =
  | "relationship"
  | "casual"
  | "friendship"
  | "unsure"
  | "tonight"
  | "travel";
export type DiscoveryMode = "near_me" | "worldwide" | "travel";
export type PreferredLanguage = "fr" | "en" | "es" | "pt";
export type MeetingStatus = "pending" | "accepted" | "rejected" | "cancelled";
export type UserRole = "user" | "admin";
export type SubscriptionPlan = "free" | "premium" | "vip";
export type SubscriptionStatus = "active" | "cancelled" | "expired";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export type ConnectionState =
  | "none"
  | "interest_sent"
  | "interest_received"
  | "pending_sent"
  | "pending_received"
  | "connected"
  | "declined"
  | "blocked";

export type OnlineStatus = "online" | "recently_active" | "offline";

export interface PrivacySettings {
  show_online: boolean;
  show_last_seen: boolean;
  incognito_enabled: boolean;
  can_use_incognito: boolean;
}

export interface ProfileVisitorItem {
  user_id: string;
  visited_at: string;
  profile: PublicProfile;
}

export interface ProfileVisitorsResponse {
  is_premium: boolean;
  total_count: number;
  page: number;
  limit: number;
  visitors: ProfileVisitorItem[];
  teaser?: string | null;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  display_name?: string | null;
  date_of_birth: string;
  gender: Gender;
  city: string;
  country: string;
  timezone: string;
  role: UserRole;
  is_active: boolean;
  onboarding_completed: boolean;
  preferred_language: PreferredLanguage;
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
  category?: string | null;
}

export interface PublicProfile {
  id: string;
  user_id: string;
  display_name: string;
  first_name?: string | null;
  age: number;
  online_status?: OnlineStatus | null;
  gender: Gender;
  city: string;
  country: string;
  country_name: string;
  country_flag: string;
  timezone: string;
  location_label: string;
  bio: string | null;
  relationship_intention: RelationshipIntention;
  occupation: string | null;
  photos: Photo[];
  interests: Interest[];
  compatibility_score?: number | null;
  compatibility_indicators?: string[];
  is_available_tonight?: boolean;
  availability_note?: string | null;
  distance_km?: number | null;
  is_connected?: boolean;
  profile_completion_percent?: number | null;
  connection_state?: ConnectionState | null;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name?: string | null;
  bio: string | null;
  relationship_intention: RelationshipIntention;
  looking_for_genders: Gender[];
  min_age: number;
  max_age: number;
  max_distance_km: number;
  occupation: string | null;
  preferred_intentions?: RelationshipIntention[];
  preferred_countries?: string[];
  city?: string | null;
  country?: string | null;
  country_name?: string | null;
  timezone?: string | null;
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
  proposed_at_display?: string | null;
}

export interface Availability {
  id: string;
  user_id: string;
  available_date: string;
  is_available: boolean;
  note: string | null;
  start_time?: string | null;
  end_time?: string | null;
  availability_label?: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  actor_user_id?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  read_at: string | null;
  is_read?: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  unread_count: number;
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

export interface CountryUserCount {
  code: string;
  name: string;
  count: number;
}

export interface CountryStats {
  code: string;
  name: string;
  name_fr: string;
  flag: string;
  user_count: number;
}

export interface WorldResponse {
  countries: CountryStats[];
  total_countries: number;
}

export interface TravelPlan {
  id: string;
  user_id: string;
  country: string;
  city: string;
  arrival_date: string;
  departure_date: string;
  wants_to_meet: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TravelMeResponse {
  active_plan: TravelPlan | null;
  plans: TravelPlan[];
  destination_profiles: PublicProfile[];
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
  users_by_country?: CountryUserCount[];
}

export interface Preferences {
  looking_for_genders: Gender[];
  preferred_intentions: RelationshipIntention[];
  preferred_countries: string[];
  min_age: number;
  max_age: number;
  max_distance_km: number;
}

export interface PendingRequestItem {
  user_id: string;
  profile: PublicProfile;
  intro_message?: string | null;
  created_at: string;
}

export interface PendingRequests {
  received: PendingRequestItem[];
  sent: PendingRequestItem[];
  requests_remaining?: number;
}

export interface ProfileCompletion {
  percent: number;
  is_complete: boolean;
  missing: string[];
  items: { key: string; label: string; done: boolean }[];
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export type PrivateAlbumAccessStatus = "pending" | "approved" | "rejected" | "revoked";

export interface PrivateAlbumPhoto {
  id: string;
  album_id: string;
  mime_type: string;
  file_size: number;
  width?: number | null;
  height?: number | null;
  moderation_status: string;
  view_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PrivateAlbumSummary {
  id: string;
  owner_id: string;
  title: string;
  description?: string | null;
  photo_count: number;
  is_owner: boolean;
  access_status?: PrivateAlbumAccessStatus | null;
  can_view_photos: boolean;
  is_visible_on_profile: boolean;
  photos: PrivateAlbumPhoto[];
}

export interface PrivateAlbumDetail extends PrivateAlbumSummary {
  pending_request_count: number;
}

export interface PrivateAlbumListResponse {
  albums: PrivateAlbumSummary[];
}

export interface PrivateAlbumAccessRequest {
  id: string;
  album_id: string;
  requester_id: string;
  requester_display_name: string;
  status: PrivateAlbumAccessStatus;
  responded_at?: string | null;
  created_at: string;
  updated_at: string;
}
