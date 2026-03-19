import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  UserProfile,
  Group,
  GroupMember,
  GroupEvent,
  EventCadence,
  Rsvp,
  Resource,
  LibraryResource,
  GroupInvite,
} from "@/types";
import { generateEventsFromCadence } from "./cadence";

// ── Users ─────────────────────────────────────────────────────────────────────

export async function upsertUserProfile(profile: Omit<UserProfile, "createdAt"> & { createdAt?: Timestamp }) {
  const ref = doc(db, "users", profile.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { ...profile, createdAt: serverTimestamp() });
  } else {
    await updateDoc(ref, {
      displayName: profile.displayName,
      photoURL: profile.photoURL,
    });
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserProfile) : null;
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function createGroup(name: string, uid: string, displayName: string, photoURL: string | null): Promise<string> {
  const groupRef = await addDoc(collection(db, "groups"), {
    name,
    description: "",
    agreements: "",
    socialLinks: [],
    cadence: null,
    cadenceDescription: "",
    createdAt: serverTimestamp(),
    createdBy: uid,
  });
  // Add creator as admin member
  await setDoc(doc(db, "groups", groupRef.id, "members", uid), {
    uid,
    displayName,
    email: "",
    photoURL,
    role: "admin",
    joinedAt: serverTimestamp(),
  });
  return groupRef.id;
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const snap = await getDoc(doc(db, "groups", groupId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Group) : null;
}

export function subscribeToGroup(groupId: string, cb: (g: Group) => void) {
  return onSnapshot(doc(db, "groups", groupId), (snap) => {
    if (snap.exists()) cb({ id: snap.id, ...snap.data() } as Group);
  });
}

export async function updateGroupContent(
  groupId: string,
  data: Partial<Pick<Group, "name" | "description" | "agreements" | "socialLinks">>
) {
  await updateDoc(doc(db, "groups", groupId), data);
}

// ── Members ───────────────────────────────────────────────────────────────────

export function subscribeToMembers(groupId: string, cb: (members: GroupMember[]) => void) {
  return onSnapshot(collection(db, "groups", groupId, "members"), (snap) => {
    cb(snap.docs.map((d) => ({ ...d.data() } as GroupMember)));
  });
}

export async function getMyGroupIds(uid: string): Promise<string[]> {
  const snap = await getDocs(query(collection(db, "groups"), where("createdBy", "==", uid)));
  // We do a collectionGroup query for members
  return snap.docs.map((d) => d.id);
}

export async function getUserGroups(uid: string): Promise<Group[]> {
  // Query collectionGroup for memberships
  const memberSnaps = await getDocs(
    query(collection(db, "groupMemberships"), where("uid", "==", uid))
  );
  const groupIds = memberSnaps.docs.map((d) => d.data().groupId as string);
  if (groupIds.length === 0) return [];
  const groups: Group[] = [];
  for (const gid of groupIds) {
    const g = await getGroup(gid);
    if (g) groups.push(g);
  }
  return groups;
}

export async function addMemberToGroup(
  groupId: string,
  groupName: string,
  user: Pick<UserProfile, "uid" | "displayName" | "email" | "photoURL">
) {
  const batch = writeBatch(db);
  // Add to group members subcollection
  batch.set(doc(db, "groups", groupId, "members", user.uid), {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    role: "member",
    joinedAt: serverTimestamp(),
  });
  // Add to flat groupMemberships for reverse lookup
  batch.set(doc(db, "groupMemberships", `${user.uid}_${groupId}`), {
    uid: user.uid,
    groupId,
    groupName,
    joinedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function updateMemberRole(groupId: string, uid: string, role: "admin" | "member") {
  await updateDoc(doc(db, "groups", groupId, "members", uid), { role });
}

export async function removeMember(groupId: string, uid: string) {
  const batch = writeBatch(db);
  batch.delete(doc(db, "groups", groupId, "members", uid));
  batch.delete(doc(db, "groupMemberships", `${uid}_${groupId}`));
  await batch.commit();
}

export async function getMemberDoc(groupId: string, uid: string): Promise<GroupMember | null> {
  const snap = await getDoc(doc(db, "groups", groupId, "members", uid));
  return snap.exists() ? (snap.data() as GroupMember) : null;
}

// ── Invites ───────────────────────────────────────────────────────────────────

export async function createInvite(groupId: string, groupName: string, createdBy: string): Promise<string> {
  const ref = await addDoc(collection(db, "invites"), {
    groupId,
    groupName,
    createdBy,
    createdAt: serverTimestamp(),
    expiresAt: null,
  });
  return ref.id;
}

export async function getInvite(inviteId: string): Promise<GroupInvite | null> {
  const snap = await getDoc(doc(db, "invites", inviteId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as GroupInvite) : null;
}

// ── Events ────────────────────────────────────────────────────────────────────

export function subscribeToEvents(groupId: string, cb: (events: GroupEvent[]) => void) {
  return onSnapshot(
    query(collection(db, "groups", groupId, "events"), orderBy("date", "asc")),
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as GroupEvent)));
    }
  );
}

export async function addEvent(groupId: string, event: Omit<GroupEvent, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, "groups", groupId, "events"), {
    ...event,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateEvent(groupId: string, eventId: string, data: Partial<GroupEvent>) {
  await updateDoc(doc(db, "groups", groupId, "events", eventId), data);
}

export async function deleteEvent(groupId: string, eventId: string) {
  await deleteDoc(doc(db, "groups", groupId, "events", eventId));
}

export async function applyCadence(groupId: string, cadence: EventCadence) {
  // 1. Delete all unconfirmed events on or after start date
  const startMs = cadence.startDate.toMillis();
  const allSnap = await getDocs(collection(db, "groups", groupId, "events"));
  const batch = writeBatch(db);
  for (const d of allSnap.docs) {
    const ev = d.data() as GroupEvent;
    if (!ev.confirmed && ev.date.toMillis() >= startMs) {
      batch.delete(d.ref);
    }
  }
  // 2. Save cadence to group
  const cadenceDescription = buildCadenceDescription(cadence);
  batch.update(doc(db, "groups", groupId), { cadence, cadenceDescription });
  await batch.commit();

  // 3. Generate new events
  const dates = generateEventsFromCadence(cadence);
  const batch2 = writeBatch(db);
  for (const date of dates) {
    const ref = doc(collection(db, "groups", groupId, "events"));
    batch2.set(ref, {
      date: Timestamp.fromDate(date),
      time: cadence.time,
      location: "",
      description: "",
      confirmed: false,
      isAdHoc: false,
      createdAt: serverTimestamp(),
    });
  }
  await batch2.commit();
}

function buildCadenceDescription(c: EventCadence): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const ordinals = ["", "1st", "2nd", "3rd", "4th", "5th"];

  if (c.frequency === "weekly") {
    const dayNames = (c.daysOfWeek ?? []).map((d) => days[d]).join(", ");
    return `Every ${c.every > 1 ? `${c.every} weeks` : "week"} on ${dayNames} at ${c.time}`;
  }
  if (c.frequency === "monthly") {
    if (c.useWeekdayOfMonth && c.weekOfMonth != null && c.weekdayOfMonth != null) {
      return `${ordinals[c.weekOfMonth]} ${days[c.weekdayOfMonth]} of every ${c.every > 1 ? `${c.every} months` : "month"} at ${c.time}`;
    }
    return `Every ${c.every > 1 ? `${c.every} months` : "month"} on the ${ordinals[c.dayOfMonth ?? 1]} at ${c.time}`;
  }
  if (c.frequency === "yearly") {
    return `Every year in ${months[c.monthOfYear ?? 0]} at ${c.time}`;
  }
  return `Every ${c.every > 1 ? `${c.every} days` : "day"} at ${c.time}`;
}

// ── RSVPs ─────────────────────────────────────────────────────────────────────

export function subscribeToRsvps(groupId: string, eventId: string, cb: (rsvps: Rsvp[]) => void) {
  return onSnapshot(collection(db, "groups", groupId, "events", eventId, "rsvps"), (snap) => {
    cb(snap.docs.map((d) => ({ ...d.data() } as Rsvp)));
  });
}

export async function upsertRsvp(
  groupId: string,
  eventId: string,
  uid: string,
  rsvp: Omit<Rsvp, "updatedAt">
) {
  await setDoc(doc(db, "groups", groupId, "events", eventId, "rsvps", uid), {
    ...rsvp,
    updatedAt: serverTimestamp(),
  });
}

// ── Resources ─────────────────────────────────────────────────────────────────

export function subscribeToResources(groupId: string, cb: (resources: Resource[]) => void) {
  return onSnapshot(
    query(collection(db, "groups", groupId, "resources"), orderBy("addedAt", "desc")),
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Resource)));
    }
  );
}

export async function addResource(groupId: string, resource: Omit<Resource, "id" | "addedAt">): Promise<string> {
  const ref = await addDoc(collection(db, "groups", groupId, "resources"), {
    ...resource,
    addedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateResource(groupId: string, resourceId: string, data: Partial<Resource>) {
  await updateDoc(doc(db, "groups", groupId, "resources", resourceId), data);
}

export async function deleteResource(groupId: string, resourceId: string) {
  await deleteDoc(doc(db, "groups", groupId, "resources", resourceId));
}

// ── Library Resources ─────────────────────────────────────────────────────────

export function subscribeToLibraryResources(cb: (resources: LibraryResource[]) => void) {
  return onSnapshot(
    query(collection(db, "libraryResources"), orderBy("addedAt", "desc")),
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as LibraryResource)));
    }
  );
}

export async function addLibraryResource(resource: Omit<LibraryResource, "id" | "addedAt">) {
  await addDoc(collection(db, "libraryResources"), {
    ...resource,
    addedAt: serverTimestamp(),
  });
}

// ── OG Image fetch ────────────────────────────────────────────────────────────

export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    const data = await res.json() as { contents: string };
    const html = data.contents;
    const match = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
