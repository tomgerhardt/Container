import { ChevronDown, Menu } from "lucide-react";
import { useState } from "react";
import { useGroup } from "@/contexts/GroupContext";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGroup } from "@/lib/firestore";
import { useNavigate } from "react-router-dom";

export function TopBar() {
  const { activeGroup, groups, setActiveGroupId, refreshGroups } = useGroup();
  const { user, profile, logOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  async function handleCreateGroup() {
    if (!user || !newGroupName.trim()) return;
    setCreating(true);
    try {
      const gid = await createGroup(
        newGroupName.trim(),
        user.uid,
        profile?.displayName ?? user.displayName ?? "Unknown",
        user.photoURL
      );
      setActiveGroupId(gid);
      setNewGroupOpen(false);
      setMenuOpen(false);
      setNewGroupName("");
      refreshGroups();
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4">
        {/* Group name / switcher */}
        <button
          onClick={() => groups.length > 1 && setSwitcherOpen(true)}
          className="flex items-center gap-1 min-w-0"
        >
          <span className="font-semibold text-base truncate max-w-[200px]">
            {activeGroup?.name ?? "No Group"}
          </span>
          {groups.length > 1 && <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Group Switcher Dialog */}
      <Dialog open={switcherOpen} onOpenChange={setSwitcherOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Switch Group</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => { setActiveGroupId(g.id); setSwitcherOpen(false); }}
                className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  g.id === activeGroup?.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                  {g.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium truncate">{g.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hamburger Menu Sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-1">
            {user && (
              <div className="flex items-center gap-3 p-3 mb-2 rounded-lg bg-muted">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.photoURL ?? undefined} />
                  <AvatarFallback>{user.displayName?.charAt(0) ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            )}

            <MenuItem onClick={() => { setNewGroupOpen(true); setMenuOpen(false); }}>
              Start a new group
            </MenuItem>
            <MenuItem onClick={() => { navigate("/seed"); setMenuOpen(false); }}>
              Seed a new group
            </MenuItem>
            <MenuItem onClick={() => { navigate("/group-management"); setMenuOpen(false); }}>
              Group management
            </MenuItem>
            <div className="my-2 h-px bg-border" />
            {user ? (
              <MenuItem onClick={() => { logOut(); setMenuOpen(false); }} className="text-destructive">
                Log out
              </MenuItem>
            ) : (
              <MenuItem onClick={() => { navigate("/login"); setMenuOpen(false); }}>
                Log in
              </MenuItem>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* New Group Dialog */}
      <Dialog open={newGroupOpen} onOpenChange={setNewGroupOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Start a New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., Thursday Brotherhood"
                className="mt-1"
                onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewGroupOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || creating}>
              {creating ? "Creating…" : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MenuItem({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
