import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

initializeApp();

function icsDateUTC(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}00Z`;
}

function escapeICS(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export const ical = onRequest({ cors: true }, async (req, res) => {
  const groupId = req.query.groupId as string;
  if (!groupId) {
    res.status(400).send("Missing groupId");
    return;
  }

  const db = getFirestore();

  const groupSnap = await db.doc(`groups/${groupId}`).get();
  if (!groupSnap.exists) {
    res.status(404).send("Group not found");
    return;
  }
  const group = groupSnap.data()!;

  const eventsSnap = await db
    .collection(`groups/${groupId}/events`)
    .orderBy("date", "asc")
    .get();

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Container//${groupId}//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICS(group.name)}`,
  ];

  for (const doc of eventsSnap.docs) {
    const event = doc.data();
    const start = (event.date as Timestamp).toDate();
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${doc.id}@container-cc1fd`);
    lines.push(`DTSTART:${icsDateUTC(start)}`);
    lines.push(`DTEND:${icsDateUTC(end)}`);
    lines.push(`SUMMARY:${escapeICS(group.name)}`);
    if (event.location) lines.push(`LOCATION:${escapeICS(event.location)}`);
    if (event.description) lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
    lines.push(`STATUS:${event.confirmed ? "CONFIRMED" : "TENTATIVE"}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  res.set("Content-Type", "text/calendar; charset=utf-8");
  res.set("Cache-Control", "no-cache, no-store");
  res.send(lines.join("\r\n"));
});
