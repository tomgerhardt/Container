import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToLibraryResources,
  addLibraryResource,
  updateLibraryResource,
  deleteLibraryResource,
} from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, Plus, Pencil, Trash2 } from "lucide-react";
import type { LibraryResource } from "@/types";

const CATEGORY_ORDER = ["Group Basics", "Books", "Practices", "Polarity & Embodiment"];

type FormData = {
  title: string;
  url: string;
  category: string;
  type: string;
  author: string;
  description: string;
};

const EMPTY_FORM: FormData = {
  title: "", url: "", category: "", type: "", author: "", description: "",
};

export function AdminLibrary() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [editTarget, setEditTarget] = useState<LibraryResource | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LibraryResource | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");

  const isSuperAdmin = profile?.isSuperAdmin ?? false;

  useEffect(() => {
    return subscribeToLibraryResources(setResources);
  }, []);

  // Redirect non-super-admins
  useEffect(() => {
    if (profile !== null && !isSuperAdmin) navigate("/home", { replace: true });
  }, [profile, isSuperAdmin, navigate]);

  const categories = [
    "All",
    ...CATEGORY_ORDER,
    ...Array.from(new Set(resources.map((r) => r.category).filter(Boolean)))
      .filter((c) => !CATEGORY_ORDER.includes(c as string)) as string[],
  ];

  const filtered = resources.filter((r) => {
    const matchesCat = filterCategory === "All" || r.category === filterCategory;
    const matchesSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.author ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const grouped = categories
    .filter((c) => c !== "All")
    .map((cat) => ({ cat, items: filtered.filter((r) => r.category === cat) }))
    .filter(({ items }) => items.length > 0);

  const uncategorized = filtered.filter((r) => !r.category);

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  }

  function openEdit(r: LibraryResource) {
    setEditTarget(r);
    setForm({
      title: r.title,
      url: r.url,
      category: r.category ?? "",
      type: r.type ?? "",
      author: r.author ?? "",
      description: r.description ?? "",
    });
    setSheetOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const data = {
        title: form.title.trim(),
        url: form.url.trim(),
        imageUrl: editTarget?.imageUrl ?? null,
        addedBy: editTarget?.addedBy ?? "admin",
        ...(form.category.trim() && { category: form.category.trim() }),
        ...(form.type.trim() && { type: form.type.trim() }),
        ...(form.author.trim() && { author: form.author.trim() }),
        ...(form.description.trim() && { description: form.description.trim() }),
      };
      if (editTarget) {
        await updateLibraryResource(editTarget.id, data);
      } else {
        await addLibraryResource(data);
      }
      setSheetOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLibraryResource(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function field(key: keyof FormData, label: string, opts?: { placeholder?: string; multiline?: boolean }) {
    return (
      <div>
        <Label>{label}</Label>
        {opts?.multiline ? (
          <textarea
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            placeholder={opts?.placeholder}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        ) : (
          <Input
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            placeholder={opts?.placeholder}
            className="mt-1"
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold flex-1">Library Resources</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by title or author…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3"
      />

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filterCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:bg-accent"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} resource{filtered.length !== 1 ? "s" : ""}
        {filterCategory !== "All" ? ` in ${filterCategory}` : ""}
      </p>

      {/* Grouped list */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No resources found.</p>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ cat, items }) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{cat}</p>
              <div className="space-y-1">
                {items.map((r) => <ResourceRow key={r.id} r={r} onEdit={openEdit} onDelete={setDeleteTarget} />)}
              </div>
            </div>
          ))}
          {uncategorized.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Uncategorized</p>
              <div className="space-y-1">
                {uncategorized.map((r) => <ResourceRow key={r.id} r={r} onEdit={openEdit} onDelete={setDeleteTarget} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit / Add Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(v) => !v && setSheetOpen(false)}>
        <SheetContent side="bottom" className="h-[92vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{editTarget ? "Edit Resource" : "Add Resource"}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {field("title", "Title *", { placeholder: "Resource title" })}
            {field("url", "URL", { placeholder: "https://…" })}
            <div className="grid grid-cols-2 gap-2">
              {field("category", "Category", { placeholder: "e.g. Books" })}
              {field("type", "Type", { placeholder: "e.g. Video" })}
            </div>
            {field("author", "Author / Source")}
            {field("description", "Description", {
              placeholder: "Brief notes about this resource…",
              multiline: true,
            })}
          </div>
          <SheetFooter className="mt-6 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={!form.title.trim() || saving}>
              {saving ? "Saving…" : editTarget ? "Save Changes" : "Add Resource"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete resource?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" will be permanently removed from the library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ResourceRow({
  r,
  onEdit,
  onDelete,
}: {
  r: LibraryResource;
  onEdit: (r: LibraryResource) => void;
  onDelete: (r: LibraryResource) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-card group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-1">{r.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {r.author && <span className="text-xs text-muted-foreground truncate">{r.author}</span>}
          {r.type && (
            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full shrink-0">
              {r.type}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(r)}
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground"
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(r)}
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
