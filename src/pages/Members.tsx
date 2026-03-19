import { useState } from "react";
import { UserPlus, Copy, Check, Crown } from "lucide-react";
import { useGroup } from "@/contexts/GroupContext";
import { useAuth } from "@/contexts/AuthContext";
import { createInvite } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export function Members() {
  const { activeGroup, members, myRole } = useGroup();
  const { user } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const isAdmin = myRole === "admin";

  async function handleGenerateInvite() {
    if (!activeGroup || !user) return;
    setGenerating(true);
    const inviteId = await createInvite(activeGroup.id, activeGroup.name, user.uid);
    const link = `${window.location.origin}/join/${inviteId}`;
    setInviteLink(link);
    setGenerating(false);
    setInviteOpen(true);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === "admin" && b.role !== "admin") return -1;
    if (b.role === "admin" && a.role !== "admin") return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  return (
    <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        {isAdmin && (
          <Button size="sm" onClick={handleGenerateInvite} disabled={generating}>
            <UserPlus className="h-4 w-4 mr-1" />
            {generating ? "Generating…" : "Invite"}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {sortedMembers.map((m) => (
          <div key={m.uid} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
            <Avatar className="h-10 w-10">
              <AvatarImage src={m.photoURL ?? undefined} />
              <AvatarFallback>{m.displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{m.displayName}</p>
                {m.uid === user?.uid && (
                  <span className="text-xs text-muted-foreground">(you)</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{m.email}</p>
            </div>
            {m.role === "admin" && (
              <Badge variant="secondary" className="shrink-0 gap-1">
                <Crown className="h-3 w-3" /> Admin
              </Badge>
            )}
          </div>
        ))}
      </div>

      {/* Invite Link Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite Link</DialogTitle>
            <DialogDescription>
              Share this link with anyone to invite them to {activeGroup?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <p className="text-xs font-mono flex-1 min-w-0 break-all">{inviteLink}</p>
            <Button size="icon" variant="ghost" onClick={handleCopy} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
