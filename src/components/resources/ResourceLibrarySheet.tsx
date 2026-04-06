import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { subscribeToLibraryResources, addResource, addLibraryResource, fetchOgImage } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import type { LibraryResource } from "@/types";
import { ImageIcon, Plus } from "lucide-react";

interface Props {
  groupId: string;
  open: boolean;
  onClose: () => void;
}

export function ResourceLibrarySheet({ groupId, open, onClose }: Props) {
  const { user, profile } = useAuth();
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [selected, setSelected] = useState<LibraryResource | null>(null);
  const [addLibraryOpen, setAddLibraryOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const isSuperAdmin = profile?.isSuperAdmin ?? false;

  useEffect(() => {
    if (!open) return;
    const unsub = subscribeToLibraryResources(setResources);
    return unsub;
  }, [open]);

  async function handleAddToGroup(r: LibraryResource) {
    if (!user) return;
    setAdding(true);
    await addResource(groupId, {
      title: r.title,
      url: r.url,
      imageUrl: r.imageUrl,
      customImageUrl: null,
      addedBy: null,
      addedByName: null,
      pinned: false,
      pinnedOrder: 0,
      fromLibrary: true,
      libraryResourceId: r.id,
    });
    setAdding(false);
    setSelected(null);
    onClose();
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <div className="flex items-center justify-between pr-6">
              <SheetTitle>Resource Library</SheetTitle>
              {isSuperAdmin && (
                <Button size="sm" onClick={() => setAddLibraryOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              )}
            </div>
          </SheetHeader>

          <LibraryResourceList resources={resources} onSelect={setSelected} />
        </SheetContent>
      </Sheet>

      {/* Resource detail + Add to Group */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="pr-4">{selected.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {(selected.category || selected.type) && (
                <div className="flex gap-2 flex-wrap">
                  {selected.category && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{selected.category}</span>
                  )}
                  {selected.type && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{selected.type}</span>
                  )}
                </div>
              )}
              {selected.author && (
                <p className="text-sm text-muted-foreground">by {selected.author}</p>
              )}
              {selected.description && (
                <p className="text-sm">{selected.description}</p>
              )}
              {selected.imageUrl && (
                <img src={selected.imageUrl} alt={selected.title} className="w-full h-36 object-cover rounded-lg" />
              )}
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline break-all block"
              >
                {selected.url}
              </a>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              <Button onClick={() => handleAddToGroup(selected)} disabled={adding}>
                {adding ? "Adding…" : "Add to Group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Super admin: add library resource */}
      {addLibraryOpen && (
        <AddLibraryResourceDialog
          open={addLibraryOpen}
          onClose={() => setAddLibraryOpen(false)}
          uid={user?.uid ?? ""}
        />
      )}
    </>
  );
}

function LibraryResourceList({
  resources,
  onSelect,
}: {
  resources: LibraryResource[];
  onSelect: (r: LibraryResource) => void;
}) {
  const categories = Array.from(new Set(resources.map((r) => r.category).filter(Boolean))) as string[];
  const uncategorized = resources.filter((r) => !r.category);

  if (resources.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No library resources yet.</p>;
  }

  function ResourceRow({ r }: { r: LibraryResource }) {
    return (
      <button
        onClick={() => onSelect(r)}
        className="w-full flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors text-left"
      >
        {r.imageUrl ? (
          <img src={r.imageUrl} alt={r.title} className="h-12 w-12 rounded-lg object-cover shrink-0 bg-muted" />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-muted shrink-0 flex items-center justify-center text-lg font-bold text-muted-foreground">
            {r.title.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-clamp-2">{r.title}</p>
          {r.author && <p className="text-xs text-muted-foreground truncate">{r.author}</p>}
          {r.type && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">{r.type}</span>}
        </div>
      </button>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="mt-4 space-y-2">
        {resources.map((r) => <ResourceRow key={r.id} r={r} />)}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {categories.map((cat) => (
        <div key={cat}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{cat}</p>
          <div className="space-y-2">
            {resources.filter((r) => r.category === cat).map((r) => <ResourceRow key={r.id} r={r} />)}
          </div>
        </div>
      ))}
      {uncategorized.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Other</p>
          <div className="space-y-2">
            {uncategorized.map((r) => <ResourceRow key={r.id} r={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function AddLibraryResourceDialog({
  open, onClose, uid,
}: { open: boolean; onClose: () => void; uid: string }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setImageFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    }
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const sRef = storageRef(storage, `library/${Date.now()}_${imageFile.name}`);
        const snap = await uploadBytes(sRef, imageFile);
        imageUrl = await getDownloadURL(snap.ref);
      } else if (url.trim()) {
        imageUrl = await fetchOgImage(url.trim());
      }
      await addLibraryResource({
        title: title.trim(),
        url: url.trim(),
        imageUrl,
        addedBy: uid,
        ...(category.trim() && { category: category.trim() }),
        ...(type.trim() && { type: type.trim() }),
        ...(author.trim() && { author: author.trim() }),
        ...(description.trim() && { description: description.trim() }),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to Library</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} type="url" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1" placeholder="e.g. Books" />
            </div>
            <div>
              <Label>Type</Label>
              <Input value={type} onChange={(e) => setType(e.target.value)} className="mt-1" placeholder="e.g. Video" />
            </div>
          </div>
          <div>
            <Label>Author / Source</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Brief notes about this resource…"
            />
          </div>
          <div>
            <Label>Image (optional)</Label>
            <div className="mt-1 flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} type="button">
                <ImageIcon className="h-4 w-4 mr-1" /> Upload
              </Button>
              {preview && <img src={preview} alt="preview" className="h-12 w-12 rounded-md object-cover border" />}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title.trim() || saving}>
            {saving ? "Saving…" : "Add to Library"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
