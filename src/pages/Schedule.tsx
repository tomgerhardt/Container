import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, MapPin, CheckCircle, Circle } from "lucide-react";
import { useGroup } from "@/contexts/GroupContext";
import { subscribeToEvents } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { CadenceEditor } from "@/components/schedule/CadenceEditor";
import { NewEventDialog } from "@/components/schedule/NewEventDialog";
import type { GroupEvent, RsvpStatus } from "@/types";
import { format } from "date-fns";
import { subscribeToRsvps } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";

function RsvpBadge({ status }: { status: RsvpStatus | undefined }) {
  if (!status) return null;
  const map: Record<RsvpStatus, string> = {
    yes: "bg-green-100 text-green-800",
    no: "bg-red-100 text-red-800",
    maybe: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      {status === "yes" ? "Going" : status === "no" ? "Can't go" : "Maybe"}
    </span>
  );
}

function EventRow({
  event,
  groupId,
}: {
  event: GroupEvent;
  groupId: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myRsvp, setMyRsvp] = useState<RsvpStatus | undefined>();
  const eventDate = event.date.toDate();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToRsvps(groupId, event.id, (rsvps) => {
      const mine = rsvps.find((r) => r.uid === user.uid);
      setMyRsvp(mine?.status);
    });
    return unsub;
  }, [groupId, event.id, user]);

  return (
    <button
      onClick={() => navigate(`/schedule/${event.id}`)}
      className="w-full flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors text-left"
    >
      {/* Date block */}
      <div className="flex flex-col items-center justify-center min-w-[48px] text-center">
        <span className="text-xs font-semibold text-muted-foreground uppercase">
          {format(eventDate, "MMM")}
        </span>
        <span className="text-2xl font-bold leading-none">{format(eventDate, "d")}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{event.time}</span>
          {event.confirmed ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
              <CheckCircle className="h-3 w-3" /> Confirmed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Circle className="h-3 w-3" /> Unconfirmed
            </span>
          )}
          <RsvpBadge status={myRsvp} />
        </div>
        {event.location && (
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{event.location}</span>
          </p>
        )}
      </div>
    </button>
  );
}

export function Schedule() {
  const { activeGroup, myRole } = useGroup();
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [cadenceOpen, setCadenceOpen] = useState(false);
  const [newEventOpen, setNewEventOpen] = useState(false);

  const isAdmin = myRole === "admin";

  useEffect(() => {
    if (!activeGroup) return;
    const unsub = subscribeToEvents(activeGroup.id, setEvents);
    return unsub;
  }, [activeGroup]);

  if (!activeGroup) return null;

  const now = Date.now();
  const upcoming = events.filter((e) => e.date.toMillis() >= now);
  const past = events.filter((e) => e.date.toMillis() < now);

  return (
    <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
      {/* Cadence description */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground flex-1">
          {activeGroup.cadenceDescription || "No schedule cadence set yet."}
        </p>
        {isAdmin && (
          <Button variant="ghost" size="icon" onClick={() => setCadenceOpen(true)} className="shrink-0 mt-[-2px]">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Upcoming events */}
      {upcoming.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p className="text-sm">No upcoming events.</p>
          {isAdmin && (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setNewEventOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Event
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {upcoming.map((e) => (
            <EventRow key={e.id} event={e} groupId={activeGroup.id} />
          ))}
        </div>
      )}

      {/* Past events collapsible could go here */}
      {past.length > 0 && (
        <details className="mt-4">
          <summary className="text-xs text-muted-foreground cursor-pointer select-none py-1">
            {past.length} past event{past.length !== 1 ? "s" : ""}
          </summary>
          <div className="space-y-2 mt-2 opacity-60">
            {[...past].reverse().map((e) => (
              <EventRow key={e.id} event={e} groupId={activeGroup.id} />
            ))}
          </div>
        </details>
      )}

      {/* Admin: New Event button at bottom */}
      {isAdmin && upcoming.length > 0 && (
        <div className="pt-2">
          <Button variant="outline" className="w-full" onClick={() => setNewEventOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Ad-hoc Event
          </Button>
        </div>
      )}

      {cadenceOpen && (
        <CadenceEditor
          groupId={activeGroup.id}
          currentCadence={activeGroup.cadence}
          open={cadenceOpen}
          onClose={() => setCadenceOpen(false)}
        />
      )}

      {newEventOpen && (
        <NewEventDialog
          groupId={activeGroup.id}
          open={newEventOpen}
          onClose={() => setNewEventOpen(false)}
        />
      )}
    </div>
  );
}
