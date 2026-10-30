export type UserId = string;
export type VenueId = string;
export type Activity =
  | 'badminton'
  | 'pickleball'
  | 'running'
  | 'sketching'
  | 'swimming'
  | 'cricket'
  | 'football'
  | 'yoga'
  | 'cycling'
  | 'trekking'
  | 'photography'
  | 'boardgames'
  | 'bookclub'
  | 'cooking';
export type Slot = 'early' | 'morning' | 'afternoon' | 'evening';
/** 0 = Sunday ... 6 = Saturday */
export type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type Gender = 'M' | 'F' | 'O';
export type Stage = 'New' | 'Exploring' | 'Regular' | 'In a toli';
export type QuizAnswer = 0 | 1 | 2;
export type MeetGender = Gender | 'any';
export type MeetMode = 'solo' | 'group' | 'both';
export interface Geo {
  lat: number;
  lng: number;
}

export interface Routine {
  venueId: VenueId;
  activity: Activity;
  days: Day[];
  slot: Slot;
}

export interface AvatarSeed {
  skin: number;
  hair: number;
  beard: boolean;
  glasses: boolean;
  shirt: number;
}

export interface Consents {
  location: boolean;
  photos: boolean;
  quiz: boolean;
}

export interface Prefs {
  womenOnly: boolean;
  smartCheckin: boolean;
  notifications: boolean;
  consents: Consents;
}

export interface User {
  id: UserId;
  name: string;
  age: number;
  gender: Gender;
  hometown: string;
  region: string;
  /** Months lived in the current city. */
  monthsInCity: number;
  city: string;
  homeSector: number;
  bio: string;
  languages: string[];
  interests: string[];
  quiz: [QuizAnswer, QuizAnswer, QuizAnswer, QuizAnswer];
  routines: Routine[];
  avatar: AvatarSeed;
  verification: {
    otp: boolean;
    selfie: boolean;
    adult: boolean;
    /** DigiLocker check. The ID itself is never shown or stored. */
    govId: boolean;
    /** Photos taken at a checked-in place (the first 2 count toward the score). */
    moments: number;
  };
  /** Who they want to meet, and how. */
  meetGender: MeetGender;
  meetMode: MeetMode;
  /** Coarse home position, used only for the 100 km radius. */
  geo: Geo;
  prefs: Prefs;
}

export type PartnerSource = 'District' | 'BookMyShow' | 'TripAdvisor' | 'Venue site';
export interface Partner {
  tier: 'partner' | 'sponsored';
  source: PartnerSource;
  /** What a toli gets for booking through Toli. */
  offer: string;
  /** Simulated price per person in rupees; used for the B2B revenue estimate. */
  price: number;
}

export interface Venue {
  id: VenueId;
  name: string;
  short: string;
  sector: number;
  activities: Activity[];
  kind: 'court' | 'park' | 'studio' | 'pool' | 'cafe' | 'turf';
  city: string;
  geo: Geo;
  /** B2B: a partner or sponsored place that can be booked through a listing site. */
  partner?: Partner;
  /** Position on the stylised neighbourhood map, 0-100. */
  map: { x: number; y: number };
  landmark: string;
}

export interface Visit {
  id: string;
  userId: UserId;
  venueId: VenueId;
  at: number;
}

export type ConnectionStatus = 'pending' | 'connected' | 'declined';
export interface Connection {
  id: string;
  from: UserId;
  to: UserId;
  status: ConnectionStatus;
  note?: string;
  at: number;
}

export type ToliStatus = 'suggested' | 'forming' | 'formed' | 'happened' | 'closed';
export interface ToliMember {
  userId: UserId;
  state: 'accepted' | 'pending';
}
export interface Toli {
  id: string;
  name: string;
  venueId: VenueId;
  activity: Activity;
  slot: Slot;
  day: Day;
  members: ToliMember[];
  status: ToliStatus;
  /** Plan start that will be proposed when the toli forms. */
  proposedStart: number;
  planId?: string;
  chatId?: string;
  womenOnly: boolean;
}

export type FeltSafe = 'yes' | 'mostly' | 'no';
export interface Plan {
  id: string;
  title: string;
  activity: Activity;
  venueId: VenueId;
  hostId: UserId;
  start: number;
  durationMin: number;
  spots: number;
  members: UserId[];
  attended: UserId[];
  womenOnly: boolean;
  toliId?: string;
  chatId?: string;
  /** Private: who each attendee would meet again. Never rendered directly. */
  meetAgain: Record<UserId, UserId[]>;
  feltSafe: Record<UserId, FeltSafe>;
  note?: string;
}

export type MessageKind = 'text' | 'system' | 'plan';
export interface Message {
  id: string;
  authorId: UserId | 'system';
  text: string;
  at: number;
  kind: MessageKind;
  planId?: string;
}

export interface Conversation {
  id: string;
  kind: 'dm' | 'group';
  title?: string;
  members: UserId[];
  messages: Message[];
  /** Last time each member read the conversation (demo clock + sequence). */
  readUpTo: Record<UserId, number>;
}

export type ReportReason =
  | 'Made me uncomfortable'
  | 'Asked about my routine or location'
  | 'Romantic or sexual messages'
  | 'Fake profile'
  | 'Something else';

export interface Report {
  id: string;
  by: UserId;
  against: UserId;
  reason: ReportReason;
  note: string;
  at: number;
  open: boolean;
}

export interface Block {
  by: UserId;
  against: UserId;
}

export interface Notification {
  id: string;
  userId: UserId;
  text: string;
  at: number;
  /** Route inside the phone app to open when tapped. */
  link?: string;
}

export type EventType =
  | 'signup'
  | 'verified'
  | 'checkin'
  | 'regular_badge'
  | 'connect_sent'
  | 'connect_accepted'
  | 'toli_formed'
  | 'plan_joined'
  | 'attended'
  | 'meet_again_pick'
  | 'mutual_meet_again'
  | 'felt_safe'
  | 'report'
  | 'notif_optout'
  | 'partner_click'
  | 'partner_booked'
  | 'activity_suggested';

export interface MetricEvent {
  id: string;
  type: EventType;
  at: number;
  userId: UserId;
  props: Record<string, string | number | boolean | string[]>;
}

export interface CheckinPrompt {
  userId: UserId;
  venueId: VenueId;
  minutes: number;
}

export interface World {
  clock: number;
  seq: number;
  users: Record<UserId, User>;
  venues: Record<VenueId, Venue>;
  visits: Visit[];
  connections: Connection[];
  tolis: Toli[];
  plans: Plan[];
  conversations: Conversation[];
  reports: Report[];
  blocks: Block[];
  notifications: Notification[];
  events: MetricEvent[];
  /** Who is typing in which conversation. */
  typing: Record<string, UserId | undefined>;
  prompt: CheckinPrompt | null;
  /** Next scripted line per bot per conversation. */
  botCursor: Record<string, number>;
  /** Activities people asked us to add (demand signal). */
  activitySuggestions: { userId: UserId; text: string; at: number }[];
}
