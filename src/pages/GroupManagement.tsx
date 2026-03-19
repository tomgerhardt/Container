import { useState } from "react";
import { ArrowLeft, Crown, UserMinus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGroup } from "@/contexts/GroupContext";
import { useAuth } from "@/contexts/AuthContext";
import { updateMemberRole, removeMember } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function GroupManagement() {
  const navigate = useNavigate();
  const { activeGroup, members, myRole } = useGroup();
  const { user } = useAuth();
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const isAdmin = myRole === "admin";

  async function handleToggleAdmin(uid: string, currentRole: string) {
    if (!activeGroup) return;
    await updateMemberRole(activeGroup.id, uid, currentRole === "admin" ? "member" : "admin");
  }

  async function handleRemove() {
    if (!activeGroup || !confirmRemove) return;
    await removeMember(activeGroup.id, confirmRemove);
    setConfirmRemove(null);
  }

  if (!activeGroup) return null;

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="font-semibold">Group Management</h1>
      </div>

      <div className="rounded-xl border">
        <div className="px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">{activeGroup.name}</h2>
          <p className="text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>

        {!isAdmin && (
          <div className="p-4 text-sm text-muted-foreground">
            Only admins can manage this group.
          </div>
        )}

        {isAdmin && (
          <div className="divide-y">
            {members.map((m) => (
              <div key={m.uid} className="flex items-center gap-3 p-4">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={m.photoURL ?? undefined} />
                  <AvatarFallback>{m.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {m.displayName}
                    {m.uid === user?.uid && <span className="text-muted-foreground font-normal"> (you)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
                {m.uid !== user?.uid && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAdmin(m.uid, m.role)}
                      className={m.role === "admin" ? "text-primary" : "text-muted-foreground"}
                    >
                      <Crown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmRemove(m.uid)}
                      className="text-destructive"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmRemove} onOpenChange={(v) => !v && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This member will be removed from the group. They can be re-invited.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
