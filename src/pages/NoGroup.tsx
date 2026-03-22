import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/contexts/GroupContext";
import { createGroup } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NoGroup() {
  const { user, profile } = useAuth();
  const { setActiveGroupId, refreshGroups } = useGroup();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!user || !name.trim()) return;
    setCreating(true);
    try {
      const gid = await createGroup(
        name.trim(),
        user.uid,
        profile?.displayName ?? user.displayName ?? "Unknown",
        user.photoURL
      );
      setActiveGroupId(gid);
      refreshGroups();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100svh-7rem)] flex-col items-center justify-center gap-6 p-6 text-center">
      <div>
        <h2 className="text-xl font-semibold">You're not in any group yet</h2>
        <p className="text-muted-foreground text-sm mt-1">Start by creating your first group, or ask an admin for an invite link.</p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <div className="text-left">
          <Label htmlFor="ng-name">Group Name</Label>
          <Input
            id="ng-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Thursday Brotherhood"
            className="mt-1"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
        <Button onClick={handleCreate} disabled={!name.trim() || creating} className="w-full">
          {creating ? "Creating…" : "Create Group"}
        </Button>
      </div>
    </div>
  );
}
