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

          <div className="mt-4 space-y-2">
            {resources.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No library resources yet.</p>
            )}
            {resources.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
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
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.url}</p>
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Resource detail + Add to Group */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{selected.title}</DialogTitle>
            </DialogHeader>
            {selected.imageUrl && (
              <img src={selected.imageUrl} alt={selected.title} className="w-full h-40 object-cover rounded-lg" />
            )}
            <a
              href={selected.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline break-all"
            >
              {selected.url}
            </a>
            <p className="text-xs text-muted-foreground">Library resource</p>
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

function AddLibraryResourceDialog({
  open, onClose, uid,
}: { open: boolean; onClose: () => void; uid: string }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
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
      await addLibraryResource({ title: title.trim(), url: url.trim(), imageUrl, addedBy: uid });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
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
