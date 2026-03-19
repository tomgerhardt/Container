import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addResource, fetchOgImage } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { ImageIcon } from "lucide-react";

interface Props {
  groupId: string;
  open: boolean;
  onClose: () => void;
}

export function AddResourceDialog({ groupId, open, onClose }: Props) {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setCustomImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setCustomImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setCustomImagePreview(null);
    }
  }

  async function handleSave() {
    if (!user || !title.trim()) return;
    setSaving(true);
    try {
      let ogImageUrl: string | null = null;
      let customImageUrl: string | null = null;

      // Fetch OG image
      if (url.trim()) {
        ogImageUrl = await fetchOgImage(url.trim());
      }

      // Upload custom image if provided
      if (customImage) {
        const storageRef = ref(storage, `groups/${groupId}/resources/${Date.now()}_${customImage.name}`);
        const snap = await uploadBytes(storageRef, customImage);
        customImageUrl = await getDownloadURL(snap.ref);
      }

      await addResource(groupId, {
        title: title.trim(),
        url: url.trim(),
        imageUrl: ogImageUrl,
        customImageUrl,
        addedBy: user.uid,
        addedByName: profile?.displayName ?? user.displayName ?? "Unknown",
        pinned: false,
        pinnedOrder: 0,
        fromLibrary: false,
        libraryResourceId: null,
      });

      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource name"
              className="mt-1"
            />
          </div>
          <div>
            <Label>URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              type="url"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Preview image will be fetched automatically.</p>
          </div>
          <div>
            <Label>Custom Image (optional override)</Label>
            <div className="mt-1 flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} type="button">
                <ImageIcon className="h-4 w-4 mr-1" /> Upload
              </Button>
              {customImagePreview && (
                <img src={customImagePreview} alt="preview" className="h-12 w-12 rounded-md object-cover border" />
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!title.trim() || saving}>
            {saving ? "Saving…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
