import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pin, Trash2, ExternalLink, ImageIcon } from "lucide-react";
import { useGroup } from "@/contexts/GroupContext";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToResources, updateResource, deleteResource } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import type { Resource } from "@/types";
import { format } from "date-fns";

export function ResourceDetail() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const navigate = useNavigate();
  const { activeGroup, myRole } = useGroup();
  const { user } = useAuth();
  const [resource, setResource] = useState<Resource | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isAdmin = myRole === "admin";
  const isOwner = resource?.addedBy === user?.uid;
  const canDelete = isAdmin || isOwner;

  useEffect(() => {
    if (!activeGroup) return;
    const unsub = subscribeToResources(activeGroup.id, (resources) => {
      setResource(resources.find((r) => r.id === resourceId) ?? null);
    });
    return unsub;
  }, [activeGroup, resourceId]);

  async function handleTogglePin() {
    if (!activeGroup || !resource) return;
    const newPinned = !resource.pinned;
    await updateResource(activeGroup.id, resource.id, {
      pinned: newPinned,
      pinnedOrder: newPinned ? Date.now() : 0,
    });
  }

  async function handleDelete() {
    if (!activeGroup || !resource) return;
    await deleteResource(activeGroup.id, resource.id);
    navigate(-1);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeGroup || !resource) return;
    setUploading(true);
    const sRef = storageRef(storage, `groups/${activeGroup.id}/resources/${Date.now()}_${file.name}`);
    const snap = await uploadBytes(sRef, file);
    const url = await getDownloadURL(snap.ref);
    await updateResource(activeGroup.id, resource.id, { customImageUrl: url });
    setUploading(false);
  }

  if (!resource) return (
    <div className="p-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      <p className="text-center text-muted-foreground mt-8">Resource not found.</p>
    </div>
  );

  const imgSrc = resource.customImageUrl ?? resource.imageUrl;
  const addedDate = resource.addedAt ? format(resource.addedAt.toDate(), "MMM d, yyyy") : "Unknown";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Image */}
      {imgSrc ? (
        <div className="relative">
          <img src={imgSrc} alt={resource.title} className="w-full h-52 object-cover" />
          {isAdmin && (
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-2 right-2 bg-black/60 text-white rounded-full p-2"
              disabled={uploading}
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : isAdmin ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full h-32 bg-muted flex items-center justify-center gap-2 text-muted-foreground text-sm"
          disabled={uploading}
        >
          <ImageIcon className="h-5 w-5" /> {uploading ? "Uploading…" : "Add Image"}
        </button>
      ) : null}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      <div className="px-4 py-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex gap-1">
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleTogglePin}
                className={resource.pinned ? "text-primary" : "text-muted-foreground"}
              >
                <Pin className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold">{resource.title}</h1>

        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-sm break-all"
          >
            {resource.url}
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          {resource.fromLibrary ? (
            <p>From the resource library</p>
          ) : (
            <p>Added by {resource.addedByName ?? "Unknown"}</p>
          )}
          <p>Added {addedDate}</p>
          {resource.pinned && <p className="text-primary font-medium">Pinned</p>}
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource?</AlertDialogTitle>
            <AlertDialogDescription>
              "{resource.title}" will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
