import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { GroupProvider, useGroup } from "@/contexts/GroupContext";
import { AppShell } from "@/components/layout/AppShell";
import { Login } from "@/pages/Login";
import { Home } from "@/pages/Home";
import { Schedule } from "@/pages/Schedule";
import { EventDetail } from "@/pages/EventDetail";
import { Resources } from "@/pages/Resources";
import { ResourceDetail } from "@/pages/ResourceDetail";
import { Members } from "@/pages/Members";
import { JoinGroup } from "@/pages/JoinGroup";
import { SeedGroup } from "@/pages/SeedGroup";
import { GroupManagement } from "@/pages/GroupManagement";
import { NoGroup } from "@/pages/NoGroup";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { activeGroup, groups } = useGroup();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/join/:inviteId" element={<JoinGroup />} />
      <Route
        path="/seed"
        element={<RequireAuth><AppShell><SeedGroup /></AppShell></RequireAuth>}
      />
      <Route
        path="/group-management"
        element={<RequireAuth><AppShell><GroupManagement /></AppShell></RequireAuth>}
      />

      <Route
        path="/home"
        element={
          <RequireAuth>
            <AppShell>
              {groups.length === 0 ? <NoGroup /> : <Home />}
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/schedule"
        element={
          <RequireAuth>
            <AppShell>
              {!activeGroup ? <NoGroup /> : <Schedule />}
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/schedule/:eventId"
        element={
          <RequireAuth>
            <AppShell>
              <EventDetail />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/resources"
        element={
          <RequireAuth>
            <AppShell>
              {!activeGroup ? <NoGroup /> : <Resources />}
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/resources/:resourceId"
        element={
          <RequireAuth>
            <AppShell>
              <ResourceDetail />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/members"
        element={
          <RequireAuth>
            <AppShell>
              {!activeGroup ? <NoGroup /> : <Members />}
            </AppShell>
          </RequireAuth>
        }
      />

      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GroupProvider>
          <AppRoutes />
        </GroupProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
