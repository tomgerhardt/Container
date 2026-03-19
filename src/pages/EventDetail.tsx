import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, CheckCircle, Circle, Pencil, Check, X } from "lucide-react";
import { useGroup } from "@/contexts/GroupContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToEvents, subscribeToRsvps, upsertRsvp,
  updateEvent,
} from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { GroupEvent, Rsvp, RsvpStatus } from "@/types";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

const RSVP_OPTIONS: { value: RsvpStatus; label: string; active: string; inactive: string }[] = [
  { value: "yes", label: "Going", active: "bg-green-600 text-white", inactive: "bg-muted text-muted-foreground" },
  { value: "maybe", label: "Maybe", active: "bg-yellow-500 text-white", inactive: "bg-muted text-muted-foreground" },
  { value: "no", label: "Can't go", active: "bg-red-600 text-white", inactive: "bg-muted text-muted-foreground" },
];

export function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { activeGroup, myRole } = useGroup();
  const { user, profile } = useAuth();
  const [event, setEvent] = useState<GroupEvent | null>(null);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [myRsvp, setMyRsvp] = useState<Rsvp | null>(null);
  const [rsvpNote, setRsvpNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = myRole === "admin";
  const isPast = event ? event.date.toMillis() < Date.now() : false;

  useEffect(() => {
    if (!activeGroup || !eventId) return;
    const unsub = subscribeToEvents(activeGroup.id, (events) => {
      const e = events.find((ev) => ev.id === eventId);
      setEvent(e ?? null);
    });
    return unsub;
  }, [activeGroup, eventId]);

  useEffect(() => {
    if (!activeGroup || !eventId) return;
    const unsub = subscribeToRsvps(activeGroup.id, eventId, (rs) => {
      setRsvps(rs);
      if (user) {
        const mine = rs.find((r) => r.uid === user.uid) ?? null;
        setMyRsvp(mine);
        setRsvpNote(mine?.note ?? "");
      }
    });
    return unsub;
  }, [activeGroup, eventId, user]);

  function startEdit() {
    if (!event) return;
    setEditDate(format(event.date.toDate(), "yyyy-MM-dd"));
    setEditTime(event.time);
    setEditLocation(event.location);
    setEditDescription(event.description);
    setEditing(true);
  }

  async function saveEdit() {
    if (!activeGroup || !eventId || !event) return;
    setSaving(true);
    await updateEvent(activeGroup.id, eventId, {
      date: Timestamp.fromDate(new Date(editDate)),
      time: editTime,
      location: editLocation,
      description: editDescription,
    });
    setSaving(false);
    setEditing(false);
  }

  async function setRsvpStatus(status: RsvpStatus) {
    if (!activeGroup || !eventId || !user || isPast) return;
    await upsertRsvp(activeGroup.id, eventId, user.uid, {
      uid: user.uid,
      displayName: profile?.displayName ?? user.displayName ?? "Unknown",
      photoURL: user.photoURL,
      status,
      note: rsvpNote,
    });
  }

  async function saveRsvpNote() {
    if (!activeGroup || !eventId || !user || !myRsvp || isPast) return;
    await upsertRsvp(activeGroup.id, eventId, user.uid, {
      ...myRsvp,
      note: rsvpNote,
    });
  }

  async function toggleConfirmed() {
    if (!activeGroup || !eventId || !event) return;
    await updateEvent(activeGroup.id, eventId, { confirmed: !event.confirmed });
  }

  if (!event) return (
    <div className="p-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      <p className="text-center text-muted-foreground mt-8">Event not found.</p>
    </div>
  );

  const eventDate = event.date.toDate();

  const rsvpGroups: Record<RsvpStatus, Rsvp[]> = { yes: [], no: [], maybe: [] };
  for (const r of rsvps) rsvpGroups[r.status].push(r);

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex gap-1">
          {isAdmin && (
            <>
              {/* Confirm toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleConfirmed}
                className={event.confirmed ? "text-green-700" : "text-muted-foreground"}
              >
                {event.confirmed ? (
                  <><CheckCircle className="h-4 w-4 mr-1" /> Confirmed</>
                ) : (
                  <><Circle className="h-4 w-4 mr-1" /> Unconfirmed</>
                )}
              </Button>
              {/* Edit button */}
              {!editing && (
                <Button variant="ghost" size="icon" onClick={startEdit}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
          {editing && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setEditing(false)} disabled={saving}>
                <X className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={saveEdit} disabled={saving}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Date large */}
      {editing ? (
        <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="text-2xl h-auto py-2" />
      ) : (
        <div>
          <h1 className="text-3xl font-bold">
            {format(eventDate, "MMMM")} {ordinalSuffix(eventDate.getDate())}
          </h1>
        </div>
      )}

      {/* Time & Location */}
      {editing ? (
        <div className="space-y-2">
          <div>
            <Label>Time</Label>
            <Input value={editTime} onChange={(e) => setEditTime(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="mt-1" />
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-lg font-medium">{event.time}</p>
          {event.location && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
            >
              <MapPin className="h-4 w-4" />
              {event.location}
            </a>
          )}
        </div>
      )}

      {/* Description */}
      {editing ? (
        <div>
          <Label>Description</Label>
          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Optional description"
            rows={4}
            className="mt-1"
          />
        </div>
      ) : event.description ? (
        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{event.description}</p>
      ) : null}

      {/* RSVP — only available if not past */}
      {!isPast && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Your RSVP</h2>
          <div className="flex rounded-lg overflow-hidden border">
            {RSVP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRsvpStatus(opt.value)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  myRsvp?.status === opt.value ? opt.active : opt.inactive
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {myRsvp && (
            <div className="mt-3">
              <Textarea
                value={rsvpNote}
                onChange={(e) => setRsvpNote(e.target.value)}
                placeholder="Optional note (e.g., running 10 minutes late…)"
                rows={2}
                onBlur={saveRsvpNote}
              />
            </div>
          )}
        </section>
      )}

      {/* RSVP summary */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">RSVPs</h2>
        {rsvps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No responses yet.</p>
        ) : (
          <div className="space-y-4">
            {(["yes", "maybe", "no"] as RsvpStatus[]).map((status) => {
              const group = rsvpGroups[status];
              if (group.length === 0) return null;
              const label = status === "yes" ? "Going" : status === "no" ? "Can't go" : "Maybe";
              return (
                <div key={status}>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{label} ({group.length})</p>
                  <div className="space-y-2">
                    {group.map((r) => (
                      <div key={r.uid} className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={r.photoURL ?? undefined} />
                          <AvatarFallback className="text-xs">{r.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.displayName}</p>
                          {r.note && <p className="text-xs text-muted-foreground truncate">{r.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
