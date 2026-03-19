import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Check, X, ExternalLink, Calendar } from "lucide-react";
import { useGroup } from "@/contexts/GroupContext";
import { useAuth } from "@/contexts/AuthContext";
import { updateGroupContent, subscribeToEvents } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { GroupEvent, SocialLink } from "@/types";
import { format } from "date-fns";

export function Home() {
  const { activeGroup, myRole } = useGroup();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [nextEvent, setNextEvent] = useState<GroupEvent | null>(null);

  // Editable state
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAgreements, setEditAgreements] = useState("");
  const [editLinks, setEditLinks] = useState<SocialLink[]>([]);
  const [saving, setSaving] = useState(false);

  const isAdmin = myRole === "admin";

  // Get next upcoming event
  useEffect(() => {
    if (!activeGroup) return;
    const unsub = subscribeToEvents(activeGroup.id, (events) => {
      const now = Date.now();
      const upcoming = events.find((e) => e.date.toMillis() > now);
      setNextEvent(upcoming ?? null);
    });
    return unsub;
  }, [activeGroup]);

  function startEdit() {
    if (!activeGroup) return;
    setEditName(activeGroup.name);
    setEditDesc(activeGroup.description);
    setEditAgreements(activeGroup.agreements);
    setEditLinks(activeGroup.socialLinks ?? []);
    setEditing(true);
  }

  async function saveEdit() {
    if (!activeGroup) return;
    setSaving(true);
    await updateGroupContent(activeGroup.id, {
      name: editName.trim() || activeGroup.name,
      description: editDesc,
      agreements: editAgreements,
      socialLinks: editLinks.filter((l) => l.label.trim() && l.url.trim()),
    });
    setSaving(false);
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function updateLink(i: number, field: keyof SocialLink, value: string) {
    setEditLinks((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  }

  if (!activeGroup) return null;

  return (
    <div className="px-4 py-4 space-y-5 max-w-2xl mx-auto">
      {/* Next Meeting Banner */}
      {nextEvent && (
        <button
          onClick={() => navigate(`/schedule/${nextEvent.id}`)}
          className="w-full text-left rounded-xl bg-primary text-primary-foreground p-4 shadow-sm"
        >
          <p className="text-xs font-medium opacity-75 uppercase tracking-wide">Next Meeting</p>
          <p className="text-2xl font-bold mt-1">
            {format(nextEvent.date.toDate(), "EEEE, MMMM d")}
          </p>
          <p className="text-sm opacity-80 mt-0.5">
            {nextEvent.time}{nextEvent.location ? ` · ${nextEvent.location}` : ""}
          </p>
          {!nextEvent.confirmed && (
            <Badge variant="warning" className="mt-2 text-xs">Unconfirmed</Badge>
          )}
        </button>
      )}

      {/* Group Name + Edit */}
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="text-xl font-bold h-auto py-1 px-2 border-dashed"
          />
        ) : (
          <h1 className="text-xl font-bold">{activeGroup.name}</h1>
        )}
        {isAdmin && !editing && (
          <Button variant="ghost" size="icon" onClick={startEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {editing && (
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={cancelEdit} disabled={saving}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={saveEdit} disabled={saving}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Description */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">About</h2>
        {editing ? (
          <Textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="Describe your group…"
            rows={4}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap text-foreground/80">
            {activeGroup.description || <span className="text-muted-foreground italic">No description yet.</span>}
          </p>
        )}
      </section>

      {/* Agreements */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Agreements</h2>
        {editing ? (
          <Textarea
            value={editAgreements}
            onChange={(e) => setEditAgreements(e.target.value)}
            placeholder="Group agreements or guidelines…"
            rows={6}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap text-foreground/80">
            {activeGroup.agreements || <span className="text-muted-foreground italic">No agreements set yet.</span>}
          </p>
        )}
      </section>

      {/* Social Links */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Chats & Socials</h2>
        {editing ? (
          <div className="space-y-3">
            {editLinks.map((link, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1.5">
                  <Input
                    value={link.label}
                    onChange={(e) => updateLink(i, "label", e.target.value)}
                    placeholder="Label (e.g., WhatsApp)"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => updateLink(i, "url", e.target.value)}
                    placeholder="https://…"
                    type="url"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-0.5"
                  onClick={() => setEditLinks((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditLinks((prev) => [...prev, { label: "", url: "" }])}
            >
              + Add Link
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(activeGroup.socialLinks ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No links added yet.</p>
            ) : (
              (activeGroup.socialLinks ?? []).map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  {link.label}
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              ))
            )}
          </div>
        )}
      </section>

      {!activeGroup && !user && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Sign in to see your group.</p>
        </div>
      )}
    </div>
  );
}
