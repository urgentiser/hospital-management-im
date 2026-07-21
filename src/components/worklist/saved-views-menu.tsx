import { useState } from "react";
import { toast } from "sonner";
import { Bookmark, ChevronDown, Plus, Pencil, Trash2, X, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import type { SavedView, WorklistConfig } from "./types";
import { useWorklistViewStore } from "@/lib/worklist-view-store";

type Props = {
  config: WorklistConfig;
  currentFilters: Record<string, unknown>;
  onApply: (view: SavedView) => void;
  onReset: () => void;
};

/**
 * Saved-views control. Combines shared config-defined views with the user's
 * personal views (persisted in `useWorklistViewStore`). Personal views can be
 * created from the current filter set, renamed and deleted.
 */
export function SavedViewsMenu({ config, currentFilters, onApply, onReset }: Props) {
  const personalMap = useWorklistViewStore((s) => s.personalViews);
  const personal = personalMap[config.moduleKey] ?? EMPTY_VIEWS;
  const saveView = useWorklistViewStore((s) => s.saveView);
  const renameView = useWorklistViewStore((s) => s.renameView);
  const deleteView = useWorklistViewStore((s) => s.deleteView);

  const [saveOpen, setSaveOpen] = useState(false);
  const [renameOf, setRenameOf] = useState<SavedView | null>(null);
  const [label, setLabel] = useState("");

  const shared = config.savedViews ?? [];
  const filterCount = Object.values(currentFilters).filter(
    (v) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0),
  ).length;

  const handleSave = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const key = `personal-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
    saveView(config.moduleKey, {
      key,
      label: trimmed,
      filters: currentFilters as SavedView["filters"],
    });
    toast.success(`Saved view: ${trimmed}`);
    setSaveOpen(false);
    setLabel("");
  };

  const handleRename = () => {
    if (!renameOf) return;
    const trimmed = label.trim();
    if (!trimmed) return;
    renameView(config.moduleKey, renameOf.key, trimmed);
    toast.success("View renamed");
    setRenameOf(null);
    setLabel("");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Bookmark className="h-3.5 w-3.5" /> Views <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          {shared.length > 0 && (
            <>
              <DropdownMenuLabel className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Shared views
              </DropdownMenuLabel>
              {shared.map((v) => (
                <DropdownMenuItem key={v.key} onSelect={() => onApply(v)}>
                  <div className="min-w-0">
                    <div className="text-sm">{v.label}</div>
                    {v.description && (
                      <div className="text-[11px] text-muted-foreground">{v.description}</div>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuLabel className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" /> My views
          </DropdownMenuLabel>
          {personal.length === 0 && (
            <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
              None yet. Apply filters and save the current view.
            </div>
          )}
          {personal.map((v) => (
            <div key={v.key} className="flex items-center gap-1 px-1 py-0.5">
              <button
                className="min-w-0 flex-1 rounded-sm px-1.5 py-1 text-left text-sm hover:bg-accent"
                onClick={() => onApply(v)}
              >
                {v.label}
              </button>
              <Button
                variant="ghost" size="sm" className="h-6 w-6 p-0"
                aria-label={`Rename ${v.label}`}
                onClick={() => { setRenameOf(v); setLabel(v.label); }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive"
                aria-label={`Delete ${v.label}`}
                onClick={() => { deleteView(config.moduleKey, v.key); toast.success("View removed"); }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); setSaveOpen(true); setLabel(""); }}
            disabled={filterCount === 0}
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            {filterCount === 0 ? "Save view (apply filters first)" : `Save current view (${filterCount})`}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onReset}>
            <X className="mr-2 h-3.5 w-3.5" /> Reset filters
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save personal view</DialogTitle>
            <DialogDescription>
              Captures your current search and {filterCount} filter{filterCount === 1 ? "" : "s"}.
              Personal views are private to you on this device.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="view-label">Name</Label>
            <Input
              id="view-label"
              autoFocus
              value={label}
              placeholder="e.g. My caseload · Ward 3"
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!label.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameOf} onOpenChange={(o) => !o && setRenameOf(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename view</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rename-label">Name</Label>
            <Input
              id="rename-label"
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOf(null)}>Cancel</Button>
            <Button onClick={handleRename} disabled={!label.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
