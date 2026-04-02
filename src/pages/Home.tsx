import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Check, X, ExternalLink, MapPin, Clock } from "lucide-react";
import { useGroup } from "@/contexts/GroupContext";
import { useAuth } from "@/contexts/AuthContext";
import { updateGroupContent, subscribeToEvents } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { GroupEvent, SocialLink } from "@/types";
import { format } from "date-fns";

export function Home() {
  const { activeGroup, myRole } = useGroup();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [nextEvent, setNextEvent] = useState<GroupEvent | null>(null);

  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAgreements, setEditAgreements] = useState("");
  const [editLinks, setEditLinks] = useState<SocialLink[]>([]);
  const [saving, setSaving] = useState(false);

  const isAdmin = myRole === "admin";

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

  const agreements = (activeGroup.agreements ?? "").split("\n").filter(Boolean);

  return (
    <div className="px-4 py-4 space-y-6 max-w-2xl mx-auto">

      {/* Hero: Next Meeting Banner */}
      {nextEvent && (
        <button
          onClick={() => navigate(`/schedule/${nextEvent.id}`)}
          className="w-full text-left rounded-xl border border-border overflow-hidden relative"
          style={{ background: "hsl(var(--secondary))" }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative p-6 flex flex-col items-center text-center gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70">
              Next Gathering
            </p>
            <div className="flex flex-col leading-none">
              <span className="text-3xl font-black uppercase tracking-tight text-foreground">
                {format(nextEvent.date.toDate(), "EEEE")}
              </span>
              <span className="text-6xl font-black text-primary leading-none">
                {format(nextEvent.date.toDate(), "MMM d").toUpperCase()}
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary/70" />
                {nextEvent.time}
              </span>
              {nextEvent.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary/70" />
                  {nextEvent.location}
                </span>
              )}
            </div>
            {!nextEvent.confirmed && (
              <span className="text-xs font-medium text-yellow-500 border border-yellow-500/30 rounded-full px-3 py-1">
                Unconfirmed
              </span>
            )}
          </div>
        </button>
      )}

      {/* Group Name */}
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="text-xl font-bold h-auto py-1 px-2 border-dashed"
          />
        ) : (
          <h1 className="text-2xl font-bold">{activeGroup.name}</h1>
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

      {/* Purpose / Agreements */}
      <section className="rounded-xl border border-border p-5 space-y-4 bg-card">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="text-primary">◈</span> Our Purpose
        </h2>
        {editing ? (
          <Textarea
            value={editAgreements}
            onChange={(e) => setEditAgreements(e.target.value)}
            placeholder="One agreement per line…"
            rows={6}
          />
        ) : agreements.length > 0 ? (
          <div className="space-y-3">
            {agreements.map((line, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-lg bg-secondary">
                <span className="font-black text-primary/60 text-sm shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">{line}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No agreements set yet.</p>
        )}
      </section>

      {/* Description */}
      {(editing || activeGroup.description) && (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">About</h2>
          {editing ? (
            <Textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Describe your group…"
              rows={4}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap text-foreground/80">
              {activeGroup.description}
            </p>
          )}
        </section>
      )}

      {/* Social Links / Channels */}
      <section className="rounded-xl border border-border p-5 bg-card">
        <h2 className="text-lg font-bold mb-4">Socials</h2>
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
              + Add Channel
            </Button>
          </div>
        ) : (activeGroup.socialLinks ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No links added yet.</p>
        ) : (
          <div className="space-y-2">
            {(activeGroup.socialLinks ?? []).map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary hover:border-primary/40 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-primary/70 shrink-0" />
                <span className="font-medium text-sm">{link.label}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      {!user && (
        <p className="text-center text-sm text-muted-foreground py-8">Sign in to see your group.</p>
      )}
    </div>
  );
}
