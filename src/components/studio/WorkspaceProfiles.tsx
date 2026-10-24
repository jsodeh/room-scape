import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { designRequest } from "@/services/designService";
import type { DesignBranch, StyleProfile } from "@/types/design";
export default function WorkspaceProfiles({
  userId,
  projectId,
  branch,
  onRefresh,
  disabled,
}: {
  userId: string;
  projectId: string;
  branch: DesignBranch;
  onRefresh: () => Promise<unknown>;
  disabled: boolean;
}) {
  const profiles = useQuery({
    queryKey: ["design-profiles", userId],
    queryFn: () => designRequest<{ profiles: StyleProfile[] }>("profiles"),
  });
  const [open, setOpen] = useState(false),
    [name, setName] = useState(""),
    [guidance, setGuidance] = useState(""),
    [profileId, setProfileId] = useState(""),
    [selected, setSelected] = useState(""),
    [include, setInclude] = useState(false),
    [busy, setBusy] = useState(false);
  const version = profiles.data?.profiles
    .flatMap((p) => p.versions)
    .find((v) => v.id === selected);
  async function save() {
    setBusy(true);
    try {
      await designRequest("save-profile", {
        projectId,
        branchId: branch.id,
        profileId: profileId || undefined,
        name,
        guidance,
        includeReferences: include,
      });
      await profiles.refetch();
      setOpen(false);
      setInclude(false);
      toast.success("Style saved as a new profile version.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function apply() {
    setBusy(true);
    try {
      await designRequest("apply-profile", {
        projectId,
        branchId: branch.id,
        contextRevision: branch.context_revision,
        profileVersionId: selected,
        includeReferences: include,
      });
      await onRefresh();
      setSelected("");
      setInclude(false);
      toast.success("Style applied. Room notes and geometry retained.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Saved styles</h3>
        <Button
          size="sm"
          variant="ghost"
          disabled={disabled}
          onClick={() => {
            setOpen(true);
            setName("");
            setGuidance("");
            setProfileId("");
            setInclude(false);
          }}
        >
          <BookmarkPlus size={14} />
          Save style
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Reuse a chosen style across rooms. Room instructions and editing history
        stay with this project.
      </p>
      {profiles.isError && (
        <p role="alert" className="text-xs">
          Saved styles could not be loaded.{" "}
          <button className="underline" onClick={() => void profiles.refetch()}>
            Retry
          </button>
        </p>
      )}
      <select
        aria-label="Saved style version"
        className="workspace-input"
        value={selected}
        disabled={disabled || busy}
        onChange={(e) => {
          setSelected(e.target.value);
          setInclude(false);
        }}
      >
        <option value="">Choose a saved style…</option>
        {profiles.data?.profiles.map((p) => (
          <optgroup key={p.id} label={p.name}>
            {p.versions.map((v) => (
              <option key={v.id} value={v.id}>
                {p.name} · version {v.version}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {version && (
        <div className="space-y-3 text-xs">
          <p>
            {version.context.brief.style} · {version.context.brief.palette} ·{" "}
            {version.context.brief.density}
          </p>
          <p className="text-muted-foreground">
            {version.context.brief.notes || "No additional style guidance."}
          </p>
          {version.context.references.length > 0 && (
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={include}
                onChange={(e) => setInclude(e.target.checked)}
              />
              Replace this direction’s references with the{" "}
              {version.context.references.length} saved style references.
            </label>
          )}
          <Button
            size="sm"
            className="w-full"
            disabled={disabled || busy}
            onClick={() => void apply()}
          >
            Apply selected version
          </Button>
        </div>
      )}
      {branch.context.profileVersionId && (
        <p className="text-[11px] text-muted-foreground">
          This direction uses a pinned style version. Updating the saved style
          will not change this room.
        </p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Save a reusable style</DialogTitle>
          <DialogDescription>
            Save style, palette and furnishing density from the saved brief. Add
            only guidance you want to reuse in other rooms.
          </DialogDescription>
          <label className="space-y-2 text-sm">
            Save to
            <select
              className="workspace-input"
              value={profileId}
              onChange={(e) => {
                setProfileId(e.target.value);
                const p = profiles.data?.profiles.find(
                  (p) => p.id === e.target.value,
                );
                if (p) setName(p.name);
              }}
            >
              <option value="">New style profile</option>
              {profiles.data?.profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (new version)
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            Style name
            <input
              className="workspace-input"
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm">
            Reusable guidance
            <textarea
              className="workspace-input min-h-24"
              value={guidance}
              maxLength={2000}
              onChange={(e) => setGuidance(e.target.value)}
              placeholder="e.g. Soft natural textures and understated oak details."
            />
          </label>
          <label className="flex gap-2 text-xs">
            <input
              type="checkbox"
              checked={include}
              onChange={(e) => setInclude(e.target.checked)}
            />
            Include saved reference photographs, excluding layout references.
          </label>
          <Button disabled={busy || !name.trim()} onClick={() => void save()}>
            {busy ? "Saving…" : "Save style version"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
