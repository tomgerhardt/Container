import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Library, Pin } from "lucide-react";
import { useGroup } from "@/contexts/GroupContext";
import { subscribeToResources } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { AddResourceDialog } from "@/components/resources/AddResourceDialog";
import { ResourceLibrarySheet } from "@/components/resources/ResourceLibrarySheet";
import type { Resource } from "@/types";

function PinnedCard({ resource, onClick }: { resource: Resource; onClick: () => void }) {
  const imgSrc = resource.customImageUrl ?? resource.imageUrl;
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer h-56 w-full text-left"
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={resource.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div className="absolute inset-0 bg-secondary flex items-center justify-center text-5xl font-black text-primary/20">
          {resource.title.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute bottom-0 left-0 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Pinned</p>
        <h3 className="text-base font-bold text-white leading-snug line-clamp-2">{resource.title}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {resource.fromLibrary ? "From library" : `Added by ${resource.addedByName ?? "Unknown"}`}
        </p>
      </div>
    </button>
  );
}

function ResourceCard({ resource, onClick }: { resource: Resource; onClick: () => void }) {
  const imgSrc = resource.customImageUrl ?? resource.imageUrl;
  return (
    <button
      onClick={onClick}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:bg-secondary/50 transition-all cursor-pointer text-left w-full"
    >
      {imgSrc ? (
        <div className="aspect-video overflow-hidden relative">
          <img
            src={imgSrc}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      ) : (
        <div className="aspect-video bg-secondary flex items-center justify-center text-4xl font-black text-primary/20">
          {resource.title.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start gap-1.5 mb-1">
          {resource.pinned && <Pin className="h-3 w-3 text-primary/60 shrink-0 mt-0.5" />}
          <h4 className="font-bold text-sm leading-snug line-clamp-2">{resource.title}</h4>
        </div>
        <p className="text-xs text-muted-foreground">
          {resource.fromLibrary ? "From library" : `By ${resource.addedByName ?? "Unknown"}`}
        </p>
      </div>
    </button>
  );
}

export function Resources() {
  const { activeGroup, myRole } = useGroup();
  const [resources, setResources] = useState<Resource[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const navigate = useNavigate();
  const isAdmin = myRole === "admin";

  useEffect(() => {
    if (!activeGroup) return;
    const unsub = subscribeToResources(activeGroup.id, setResources);
    return unsub;
  }, [activeGroup]);

  if (!activeGroup) return null;

  const pinned = resources.filter((r) => r.pinned).sort((a, b) => a.pinnedOrder - b.pinnedOrder);
  const unpinned = resources.filter((r) => !r.pinned);

  return (
    <div className="px-4 py-4 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary">Resources</h2>
        {isAdmin && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setLibraryOpen(true)}>
              <Library className="h-4 w-4 mr-1" /> Library
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </div>
        )}
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Library className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No resources yet.</p>
          {isAdmin && (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add first resource
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Pinned section */}
          {pinned.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <Pin className="h-3 w-3" />
                Pinned Resources
              </div>
              <div className="grid grid-cols-1 gap-4">
                {pinned.map((r) => (
                  <PinnedCard key={r.id} resource={r} onClick={() => navigate(`/resources/${r.id}`)} />
                ))}
              </div>
            </section>
          )}

          {/* All resources grid */}
          {unpinned.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                All Resources
              </div>
              <div className="grid grid-cols-2 gap-4">
                {unpinned.map((r) => (
                  <ResourceCard key={r.id} resource={r} onClick={() => navigate(`/resources/${r.id}`)} />
                ))}
              </div>
            </section>
          )}
        </>
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
