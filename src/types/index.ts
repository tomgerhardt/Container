import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  isSuperAdmin?: boolean;
  createdAt: Timestamp;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  agreements: string;
  socialLinks: SocialLink[];
  cadence: EventCadence | null;
  cadenceDescription: string;
  timezone: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface SocialLink {
  label: string;
  url: string;
}

export type MemberRole = "admin" | "member";

export interface GroupMember {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: MemberRole;
  joinedAt: Timestamp;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  groupName: string;
  createdBy: string;
  createdAt: Timestamp;
  expiresAt: Timestamp | null;
}

export type RsvpStatus = "yes" | "no" | "maybe";

export interface Rsvp {
  uid: string;
  displayName: string;
  photoURL: string | null;
  status: RsvpStatus;
  note: string;
  updatedAt: Timestamp;
}

export interface GroupEvent {
  id: string;
  date: Timestamp;
  time: string; // "7:30pm"
  location: string;
  description: string;
  confirmed: boolean;
  isAdHoc: boolean;
  createdAt: Timestamp;
}

export type FrequencyType = "daily" | "weekly" | "monthly" | "yearly";

export interface EventCadence {
  frequency: FrequencyType;
  every: number;
  // weekly: days of week (0=Sun, 1=Mon, ...)
  daysOfWeek?: number[];
  // monthly: day of month (1-31)
  dayOfMonth?: number;
  // monthly by weekday: e.g., 3rd Wednesday
  weekOfMonth?: number; // 1-5
  weekdayOfMonth?: number; // 0-6
  useWeekdayOfMonth?: boolean;
  // yearly: month (0-11)
  monthOfYear?: number;
  time: string; // "7:30pm"
  startDate: Timestamp;
  qtyAhead: number;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  imageUrl: string | null;
  customImageUrl: string | null;
  addedBy: string | null; // null = from library
  addedByName: string | null;
  addedAt: Timestamp;
  pinned: boolean;
  pinnedOrder: number;
  fromLibrary: boolean;
  libraryResourceId: string | null;
}

export interface LibraryResource {
  id: string;
  title: string;
  url: string;
  imageUrl: string | null;
  addedAt: Timestamp;
  addedBy: string;
  category?: string;
  type?: string;
  author?: string;
  description?: string;
}
