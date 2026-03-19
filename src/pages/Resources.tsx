import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Library, Pin } from "lucide-react";
import { useGroup } from "@/contexts/GroupContext";
import { subscribeToResources } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { AddResourceDialog } from "@/components/resources/AddResourceDialog";
import { ResourceLibrarySheet } from "@/components/resources/ResourceLibrarySheet";
import type { Resource } from "@/types";

function ResourceCard({ resource, onClick }: { resource: Resource; onClick: () => void }) {
  const imgSrc = resource.customImageUrl ?? resource.imageUrl;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors text-left"
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={resource.title}
          className="h-14 w-14 rounded-lg object-cover shrink-0 bg-muted"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div className="h-14 w-14 rounded-lg bg-muted shrink-0 flex items-center justify-center text-muted-foreground text-xl font-bold">
          {resource.title.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {resource.pinned && <Pin className="h-3 w-3 text-muted-foreground shrink-0" />}
          <p className="text-sm font-medium truncate">{resource.title}</p>
        </div>
        {resource.fromLibrary ? (
          <p className="text-xs text-muted-foreground">From library</p>
        ) : (
          <p className="text-xs text-muted-foreground">Added by {resource.addedByName ?? "Unknown"}</p>
        )}
      </div>
    </button>
  );
}

export function Resources() {
  const { activeGroup } = useGroup();
  const [resources, setResources] = useState<Resource[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeGroup) return;
    const unsub = subscribeToResources(activeGroup.id, setResources);
    return unsub;
  }, [activeGroup]);

  if (!activeGroup) return null;

  // Sort: pinned first (by pinnedOrder), then chronological
  const pinned = resources.filter((r) => r.pinned).sort((a, b) => a.pinnedOrder - b.pinnedOrder);
  const unpinned = resources.filter((r) => !r.pinned);
  const sorted = [...pinned, ...unpinned];

  return (
    <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
        <Button size="sm" variant="outline" onClick={() => setLibraryOpen(true)}>
          <Library className="h-4 w-4 mr-1" /> Add from Library
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Library className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No resources yet. Add your first one!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              onClick={() => navigate(`/resources/${r.id}`)}
            />
          ))}
        </div>
      )}

      {addOpen && (
        <AddResourceDialog
          groupId={activeGroup.id}
          open={addOpen}
          onClose={() => setAddOpen(false)}
        />
      )}

      {libraryOpen && (
        <ResourceLibrarySheet
          groupId={activeGroup.id}
          open={libraryOpen}
          onClose={() => setLibraryOpen(false)}
        />
      )}
    </div>
  );
}
