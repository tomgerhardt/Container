import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import type { Group, GroupMember } from "@/types";
import {
  subscribeToGroup,
  subscribeToMembers,
} from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

interface GroupContextValue {
  groups: Group[];
  activeGroup: Group | null;
  activeGroupId: string | null;
  members: GroupMember[];
  myRole: "admin" | "member" | null;
  setActiveGroupId: (id: string) => void;
  refreshGroups: () => void;
}

const GroupContext = createContext<GroupContextValue | null>(null);

export function GroupProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(() =>
    localStorage.getItem("activeGroupId")
  );
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [myRole, setMyRole] = useState<"admin" | "member" | null>(null);

  // Listen for groups the user belongs to via groupMemberships
  useEffect(() => {
    if (!user) {
      setGroups([]);
      return;
    }
    const q = query(collection(db, "groupMemberships"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const gids = snap.docs.map((d) => d.data().groupId as string);
      if (gids.length === 0) {
        setGroups([]);
        return;
      }
      // Subscribe to each group doc
      const fetched: Map<string, Group> = new Map();
      const unsubs: (() => void)[] = [];
      for (const gid of gids) {
        const u = subscribeToGroup(gid, (g) => {
          fetched.set(gid, g);
          setGroups([...fetched.values()]);
        });
        unsubs.push(u);
      }
      return () => unsubs.forEach((u) => u());
    });
    return unsub;
  }, [user]);

  // Auto-select first group if none selected
  useEffect(() => {
    if (!activeGroupId && groups.length > 0) {
      setActiveGroupId(groups[0].id);
    }
  }, [groups, activeGroupId]);

  // Subscribe to active group
  useEffect(() => {
    if (!activeGroupId) {
      setActiveGroup(null);
      return;
    }
    localStorage.setItem("activeGroupId", activeGroupId);
    const unsub = subscribeToGroup(activeGroupId, setActiveGroup);
    return unsub;
  }, [activeGroupId]);

  // Subscribe to members
  useEffect(() => {
    if (!activeGroupId) { setMembers([]); return; }
    const unsub = subscribeToMembers(activeGroupId, setMembers);
    return unsub;
  }, [activeGroupId]);

  // Get my role
  useEffect(() => {
    if (!user) { setMyRole(null); return; }
    const myMember = members.find((m) => m.uid === user.uid);
    setMyRole(myMember?.role ?? null);
  }, [user, members]);

  const refreshGroups = useCallback(() => {}, []);

  const handleSetActiveGroupId = useCallback((id: string) => {
    setActiveGroupId(id);
    localStorage.setItem("activeGroupId", id);
  }, []);

  return (
    <GroupContext.Provider
      value={{
        groups,
        activeGroup,
        activeGroupId,
        members,
        myRole,
        setActiveGroupId: handleSetActiveGroupId,
        refreshGroups,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroup must be used within GroupProvider");
  return ctx;
}
