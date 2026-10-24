import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Check,
  Download,
  Expand,
  GitBranch,
  ImagePlus,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import RoomComparison from "@/components/results-display/RoomComparison";
import WorkspaceReferences from "./WorkspaceReferences";
import WorkspaceProfiles from "./WorkspaceProfiles";
import {
  designRequest,
  downloadDesign,
  uploadDesignPhoto,
} from "@/services/designService";
import { EMPTY_CONTEXT } from "@/types/design";
import type {
  DesignBranch,
  DesignContext,
  DesignJob,
  ImageSize,
  ModelCapability,
  ProjectHistory,
  Quality,
} from "@/types/design";

const active = (job: DesignJob) =>
  ["queued", "running", "saving", "needs_recovery"].includes(job.status);
const modelLabels: Record<Quality, string> = {
  lite: "Lite · free-tier 1K",
  quality: "Pro · highest detail",
  next: "Nano Banana 2.1 · newest",
  fast: "Flash · faster iteration",
};
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "This action could not be completed.";
export default function DesignWorkspace() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <p role="status" className="py-24 text-center">
        Opening your studio…
      </p>
    );
  if (!user)
    return (
      <section className="grid items-center gap-10 py-8 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-5">A considered space, one edit at a time</p>
          <h1 className="editorial-title text-5xl sm:text-6xl">
            Your room.
            <br />
            <span className="text-primary">Every possibility.</span>
          </h1>
          <p className="my-6 max-w-md text-sm leading-7 text-muted-foreground">
            Build on your last design, explore a different direction, and bring
            your favourite references along. Every edit has a place in your
            room’s story.
          </p>
          <Button asChild size="lg">
            <Link to="/auth?next=/">
              Sign in to your studio <ArrowUpRight size={16} />
            </Link>
          </Button>
          <div className="mt-8 flex flex-wrap gap-5 text-xs text-muted-foreground">
            <span>Saved editing history</span>
            <span>Purposeful references</span>
            <span>Reusable styles</span>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-3xl bg-secondary">
          <img
            src="/images/studio-room.png"
            alt="A warm, thoughtfully furnished living room"
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="absolute bottom-5 left-5 right-5 rounded-xl bg-background/90 p-4 backdrop-blur">
            <p className="text-sm font-medium">A little more you.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start with a photograph. Shape the details as you go.
            </p>
          </div>
        </div>
      </section>
    );
  return <WorkspaceSession key={user.id} userId={user.id} />;
}
function WorkspaceSession({ userId }: { userId: string }) {
  const [params, setParams] = useSearchParams(),
    client = useQueryClient();
  const projectId = params.get("project") || "";
  const [creating, setCreating] = useState(false),
    [title, setTitle] = useState(""),
    [uploading, setUploading] = useState(false);
  const projects = useQuery({
    queryKey: ["design", userId, "projects"],
    queryFn: () =>
      designRequest<{ projects: { id: string; title: string }[] }>("list"),
  });
  const capabilities = useQuery({
    queryKey: ["design", userId, "capabilities"],
    queryFn: () =>
      designRequest<{ models: ModelCapability[]; workerReady: boolean }>(
        "capabilities",
      ),
    staleTime: 300000,
  });
  useEffect(
    () => () => {
      client.removeQueries({ queryKey: ["design", userId] });
      client.removeQueries({ queryKey: ["design-profiles", userId] });
    },
    [client, userId],
  );
  async function create(file: File) {
    setUploading(true);
    try {
      const id = crypto.randomUUID(),
        url = await uploadDesignPhoto(file, userId, id);
      await designRequest("create", {
        projectId: id,
        title: title.trim() || "My room",
        originalUrl: url,
        context: EMPTY_CONTEXT,
      });
      await projects.refetch();
      setParams({ project: id });
      setCreating(false);
      setTitle("");
    } catch (error) {
      toast.error(message(error));
    } finally {
      setUploading(false);
    }
  }
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Your design workspace</p>
          <h1 className="editorial-title text-4xl">
            Make room for possibility.
          </h1>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <select
            aria-label="Current project"
            className="workspace-input sm:!w-56"
            value={projectId}
            onChange={(e) =>
              setParams(e.target.value ? { project: e.target.value } : {})
            }
          >
            <option value="">Choose a room…</option>
            {projects.data?.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            className="shrink-0"
            onClick={() => setCreating(true)}
          >
            <Plus size={15} />
            New room
          </Button>
        </div>
      </div>
      {projects.isError && (
        <p role="alert">
          Your rooms could not be loaded.{" "}
          <button className="underline" onClick={() => void projects.refetch()}>
            Try again
          </button>
        </p>
      )}
      {capabilities.isError && (
        <p role="alert" className="rounded-xl border p-4 text-sm">
          Model availability could not be checked.{" "}
          <button
            className="underline"
            onClick={() => void capabilities.refetch()}
          >
            Check again
          </button>
        </p>
      )}
      {projectId ? (
        <ProjectWorkspace
          key={projectId}
          userId={userId}
          projectId={projectId}
          capabilities={capabilities.data}
        />
      ) : (
        <div className="studio-panel grid overflow-hidden md:grid-cols-2">
          <div className="p-8 sm:p-12">
            <p className="eyebrow mb-4">Begin with what’s there</p>
            <h2 className="editorial-title text-4xl">
              A fresh perspective
              <br />
              on your own space.
            </h2>
            <p className="my-5 max-w-sm text-sm leading-7 text-muted-foreground">
              Upload your room, set a direction, then refine the details. Your
              original photo and every saved version stay close at hand.
            </p>
            <Button onClick={() => setCreating(true)}>
              <ImagePlus size={16} />
              Start a room
            </Button>
          </div>
          <img
            src="/images/studio-room.png"
            className="h-full min-h-64 w-full object-cover"
            alt="Living room inspiration"
          />
        </div>
      )}
      <Dialog
        open={creating}
        onOpenChange={(value) => {
          if (!uploading) setCreating(value);
        }}
      >
        <DialogContent>
          <DialogTitle>A room to reimagine</DialogTitle>
          <DialogDescription>
            Upload a clear photograph of your space. Your original is saved
            before any generation starts.
          </DialogDescription>
          <label className="space-y-2 text-sm">
            Room name
            <input
              className="workspace-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              placeholder="e.g. The living room"
            />
          </label>
          <label
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center ${uploading ? "pointer-events-none opacity-50" : "hover:bg-secondary"}`}
          >
            <ImagePlus size={28} />
            <span>
              {uploading ? "Saving your room…" : "Choose a room photograph"}
            </span>
            <span className="text-xs text-muted-foreground">
              JPG, PNG or WebP · up to 10 MB
            </span>
            <input
              aria-label="Room photograph"
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void create(file);
              }}
            />
          </label>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function ProjectWorkspace({
  userId,
  projectId,
  capabilities,
}: {
  userId: string;
  projectId: string;
  capabilities?: { models: ModelCapability[]; workerReady: boolean };
}) {
  const history = useQuery({
    queryKey: ["design", userId, projectId],
    queryFn: () => designRequest<ProjectHistory>("history", { projectId }),
    refetchInterval: (query) =>
      query.state.data?.jobs.some((j) =>
        ["queued", "running", "saving"].includes(j.status),
      )
        ? 2500
        : false,
  });
  const [branchId, setBranchId] = useState("");
  const branch =
    history.data?.branches.find((b) => b.id === branchId) ||
    history.data?.branches.find(
      (b) => b.id === history.data.project.active_branch_id,
    ) ||
    history.data?.branches[0];
  if (history.isPending)
    return (
      <p role="status" className="flex justify-center gap-3 py-24">
        <Loader2 className="animate-spin" />
        Loading saved designs…
      </p>
    );
  if (history.isError || !history.data || !branch)
    return (
      <div role="alert" className="studio-panel p-10">
        <p>This room could not be opened. It may belong to another account.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => void history.refetch()}
        >
          Try again
        </Button>
      </div>
    );
  return (
    <Workbench
      key={branch.id}
      userId={userId}
      data={history.data}
      branch={branch}
      onBranch={setBranchId}
      refresh={() => history.refetch()}
      capabilities={capabilities}
    />
  );
}
function Workbench({
  userId,
  data,
  branch,
  onBranch,
  refresh,
  capabilities,
}: {
  userId: string;
  data: ProjectHistory;
  branch: DesignBranch;
  onBranch: (id: string) => void;
  refresh: () => Promise<unknown>;
  capabilities?: { models: ModelCapability[]; workerReady: boolean };
}) {
  const [draft, setDraft] = useState<DesignContext>(branch.context),
    [selectedId, setSelectedId] = useState(branch.head_version_id),
    [edit, setEdit] = useState(""),
    [scope, setScope] = useState<"branch" | "turn">("branch"),
    [quality, setQuality] = useState<Quality>("lite"),
    [size, setSize] = useState<ImageSize>("1K"),
    [pending, setPending] = useState(false),
    [expanded, setExpanded] = useState(false),
    [forkOpen, setForkOpen] = useState(false),
    [forkName, setForkName] = useState(""),
    [fresh, setFresh] = useState(false);
  const submission = useRef<{ signature: string; key: string }>();
  const [forgetOpen, setForgetOpen] = useState(false);
  const [referenceBusy, setReferenceBusy] = useState(false);
  useEffect(
    () => setDraft(branch.context),
    [branch.context, branch.context_revision],
  );
  useEffect(
    () => setSelectedId(branch.head_version_id),
    [branch.head_version_id],
  );
  const selected =
    data.versions.find((v) => v.id === selectedId) ||
    data.versions.find((v) => v.id === branch.head_version_id)!;
  const canvas = data.assets.find((a) => a.id === selected.asset_id),
    original = data.assets.find((a) => a.id === data.project.original_asset_id);
  const job = [...data.jobs]
    .reverse()
    .find((j) => j.branch_id === branch.id && active(j));
  const latestJob = [...data.jobs]
    .reverse()
    .find((j) => j.branch_id === branch.id);
  const dirty = JSON.stringify(draft) !== JSON.stringify(branch.context),
    busy = pending || !!job || referenceBusy,
    atHead = selected.id === branch.head_version_id;
  async function perform(action: () => Promise<void>) {
    setPending(true);
    try {
      await action();
    } catch (error) {
      toast.error(message(error));
    } finally {
      setPending(false);
    }
  }
  async function saveContext() {
    await designRequest("context", {
      projectId: data.project.id,
      branchId: branch.id,
      contextRevision: branch.context_revision,
      context: draft,
    });
    await refresh();
    toast.success("Design brief saved.");
  }
  async function generate() {
    const input = {
      projectId: data.project.id,
      branchId: branch.id,
      baseVersionId: selected.id,
      contextRevision: branch.context_revision,
      userEdit: edit.trim(),
      scope,
      quality,
      imageSize: size,
      operation: selected.parent_version_id ? "refine" : "generate",
    };
    const signature = JSON.stringify(input);
    if (submission.current?.signature !== signature)
      submission.current = { signature, key: crypto.randomUUID() };
    await designRequest("submit", {
      input: { ...input, idempotencyKey: submission.current.key },
    });
    await refresh();
    setEdit("");
    submission.current = undefined;
  }
  async function fork() {
    const result = await designRequest<{ branch: DesignBranch }>("fork", {
      projectId: data.project.id,
      versionId: selected.id,
      name: forkName.trim() || "A new direction",
      freshContext: fresh,
    });
    await refresh();
    onBranch(result.branch.id);
    setForkOpen(false);
  }
  const setBrief = (
    key: keyof DesignContext["brief"],
    value: string | boolean,
  ) => setDraft({ ...draft, brief: { ...draft.brief, [key]: value } });
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="order-2 space-y-5 xl:order-1">
        <div className="studio-panel p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-medium">Design direction</h2>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px]">
              Saved with this room
            </span>
          </div>
          <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
            <label className="workspace-label">
              Room type
              <select
                className="workspace-input"
                value={draft.brief.room}
                onChange={(e) => setBrief("room", e.target.value)}
              >
                {[
                  "Living room",
                  "Bedroom",
                  "Dining room",
                  "Home office",
                  "Kitchen",
                  "Outdoor space",
                  "Other",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="workspace-label">
              Style
              <input
                className="workspace-input"
                value={draft.brief.style}
                maxLength={120}
                onChange={(e) => setBrief("style", e.target.value)}
              />
            </label>
            <label className="workspace-label">
              Palette
              <input
                className="workspace-input"
                value={draft.brief.palette}
                maxLength={160}
                onChange={(e) => setBrief("palette", e.target.value)}
              />
            </label>
            <label className="workspace-label">
              Furnishing
              <select
                className="workspace-input"
                value={draft.brief.density}
                onChange={(e) => setBrief("density", e.target.value)}
              >
                {["Minimal", "Balanced", "Layered"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="workspace-label">
              Room instructions
              <textarea
                className="workspace-input min-h-24"
                value={draft.brief.notes}
                maxLength={10000}
                onChange={(e) => setBrief("notes", e.target.value)}
                placeholder="What should always stay true for this room?"
              />
            </label>
            <label className="flex items-start gap-2 text-xs leading-relaxed">
              <input
                type="checkbox"
                className="mt-1"
                checked={draft.brief.preserve}
                onChange={(e) => setBrief("preserve", e.target.checked)}
              />
              Preserve walls, openings and camera viewpoint
            </label>
            <div className="border-t pt-5">
              <WorkspaceReferences
                onBusy={setReferenceBusy}
                userId={userId}
                projectId={data.project.id}
                context={draft}
                assets={data.assets}
                analyses={data.analyses}
                onChange={setDraft}
                onRefresh={refresh}
              />
            </div>
            {draft.profileGuidance && (
              <div className="rounded-lg bg-secondary p-3 text-xs">
                <p className="mb-1 font-medium">Saved style guidance</p>
                <p className="text-muted-foreground">{draft.profileGuidance}</p>
                <button
                  className="mt-2 underline"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      profileVersionId: null,
                      profileGuidance: "",
                    })
                  }
                >
                  Detach saved style
                </button>
              </div>
            )}
            <Button
              className="w-full"
              variant={dirty ? "default" : "outline"}
              disabled={!dirty}
              onClick={() => void perform(saveContext)}
            >
              {dirty ? "Save design brief" : "Brief saved"}
              <Check size={14} />
            </Button>
            {dirty && (
              <p className="text-xs text-muted-foreground" role="status">
                Save your changes before generating or applying a saved style.
              </p>
            )}
          </fieldset>
        </div>
        <WorkspaceProfiles
          userId={userId}
          projectId={data.project.id}
          branch={branch}
          onRefresh={refresh}
          disabled={busy || dirty}
        />
      </aside>
      <section className="order-1 min-w-0 space-y-5 xl:order-2">
        <div className="studio-panel p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium">{data.project.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {selected.label}
                {selected.model
                  ? ` · ${selected.model} · ${selected.image_size}`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <GitBranch size={15} className="text-muted-foreground" />
              <select
                className="workspace-input !w-auto max-w-52"
                aria-label="Design direction"
                value={branch.id}
                disabled={pending}
                onChange={(e) => onBranch(e.target.value)}
              >
                {data.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {canvas?.url ? (
            <RoomComparison
              key={selected.id}
              staged={canvas.url}
              original={selected.parent_version_id ? original?.url : undefined}
              label={selected.label}
            />
          ) : (
            <p className="rounded-xl bg-secondary p-10 text-center text-sm">
              This image is no longer available.
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {selected.state === "rejected"
                ? "Rejected version · retained in history"
                : atHead
                  ? "Current editing canvas"
                  : "Viewing a saved version"}
            </p>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                disabled={!canvas?.url}
                onClick={() => setExpanded(true)}
              >
                <Expand size={14} />
                Expand
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!canvas?.url}
                onClick={() =>
                  void perform(() =>
                    downloadDesign(canvas.url, canvas.mime_type),
                  )
                }
              >
                <Download size={14} />
                Download
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {selected.parent_version_id && selected.state !== "rejected" && (
              <>
                <Button
                  size="sm"
                  variant={
                    selected.state === "accepted" ? "secondary" : "outline"
                  }
                  disabled={busy}
                  onClick={() =>
                    void perform(async () => {
                      await designRequest("version-state", {
                        projectId: data.project.id,
                        versionId: selected.id,
                        state: "accepted",
                      });
                      await refresh();
                    })
                  }
                >
                  <Check size={14} />
                  {selected.state === "accepted" ? "Kept" : "Keep version"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    void perform(async () => {
                      await designRequest("version-state", {
                        projectId: data.project.id,
                        versionId: selected.id,
                        state: "rejected",
                      });
                      await refresh();
                    })
                  }
                >
                  <X size={14} />
                  Reject
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={pending || selected.state === "rejected" || dirty}
              onClick={() => {
                setForkOpen(true);
                setForkName("");
                setFresh(false);
              }}
            >
              <GitBranch size={14} />
              Explore from this version
            </Button>
            {!atHead && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedId(branch.head_version_id)}
              >
                Return to latest
              </Button>
            )}
          </div>
        </div>
        <div className="studio-panel p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-medium">
              {selected.parent_version_id
                ? "What would you change?"
                : "Imagine the first design"}
            </h3>
            <Sparkles size={18} className="text-primary" />
          </div>
          {!atHead && (
            <p className="mb-3 rounded-lg bg-secondary p-3 text-xs">
              Start a new direction from this saved version to edit it. Each
              direction keeps its own context.
            </p>
          )}
          <textarea
            aria-label="Next edit"
            className="workspace-input min-h-24"
            placeholder={
              selected.parent_version_id
                ? "e.g. Keep everything else, but replace the sofa with a curved cream sofa."
                : "e.g. Create a calm, warm living room with an oak coffee table and soft linen seating."
            }
            value={edit}
            maxLength={6000}
            disabled={busy || !atHead}
            onChange={(e) => setEdit(e.target.value)}
          />
          <div className="my-4 flex flex-wrap gap-3">
            <label className="workspace-label flex-1">
              Editing context
              <select
                aria-label="Edit duration"
                className="workspace-input"
                disabled={busy}
                value={scope}
                onChange={(e) => setScope(e.target.value as "branch" | "turn")}
              >
                <option value="branch">Remember in this direction</option>
                <option value="turn">This edit only</option>
              </select>
            </label>
            <label className="workspace-label flex-1">
              Model
              <select
                aria-label="Generation model"
                className="workspace-input"
                disabled={busy}
                value={quality}
                onChange={(e) => {
                  const selected = e.target.value as Quality;
                  if (selected === "lite") setSize("1K");
                  else if (quality === "lite") setSize("2K");
                  setQuality(selected);
                }}
              >
                {(["lite", "quality", "next", "fast"] as Quality[]).map((q) => (
                  <option
                    key={q}
                    value={q}
                    disabled={
                      !capabilities?.models.find((m) => m.preset === q)
                        ?.available
                    }
                  >
                    {modelLabels[q]}
                  </option>
                ))}
              </select>
            </label>
            <label className="workspace-label w-20">
              Size
              <select
                aria-label="Image size"
                className="workspace-input"
                disabled={busy}
                value={size}
                onChange={(e) => setSize(e.target.value as ImageSize)}
              >
                {["1K", "2K", "4K"].map((v) => (
                  <option key={v} disabled={quality === "lite" && v !== "1K"}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <details className="mb-4 rounded-lg bg-secondary/50 p-3 text-xs">
            <summary className="cursor-pointer font-medium">
              Review applied influences
            </summary>
            <div className="mt-3 space-y-2 leading-relaxed text-muted-foreground">
              <p>
                {branch.context.brief.style} · {branch.context.brief.palette} ·{" "}
                {branch.context.brief.density}. Architecture{" "}
                {branch.context.brief.preserve ? "preserved" : "may change"}.
              </p>
              <p>
                {branch.context.brief.notes ||
                  "No additional room instructions."}
              </p>
              {branch.context.references.map((r, i) => (
                <p key={r.assetId}>
                  Photo {i + 1}: {r.role} only, {r.priority},{" "}
                  {r.scope === "turn" ? "next edit only" : "this direction"}.{" "}
                  {Object.values(r.accepted).flat().join("; ") ||
                    "Visual guidance only; no analysis suggestions selected."}
                </p>
              ))}
              {branch.context.profileGuidance && (
                <p>Saved style: {branch.context.profileGuidance}</p>
              )}
              <p>
                {branch.context.decisions?.length || 0} earlier instructions
                remembered in this direction. The current canvas keeps its
                visible changes when a reference is removed.
              </p>
            </div>
          </details>
          {scope === "turn" && (
            <p className="mb-3 text-xs text-muted-foreground">
              The image keeps visible changes. This instruction will not be
              carried into later editing context.
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xs text-[11px] leading-relaxed text-muted-foreground">
              {quality === "lite"
                ? "Lite uses Google’s free-tier quota at 1K and may be rate limited. Choose another model for higher resolution with appropriate Google API quota."
                : "2K is a good starting point. 4K takes longer and may cost more."}{" "}
              Your selected model is used without automatic substitution.
            </p>
            <Button
              disabled={
                busy ||
                dirty ||
                !atHead ||
                !edit.trim() ||
                !canvas?.url ||
                !capabilities?.workerReady ||
                !capabilities.models.find((m) => m.preset === quality)
                  ?.available
              }
              onClick={() => void perform(generate)}
            >
              <Sparkles size={15} />
              {pending ? "Saving request…" : "Generate design"}
            </Button>
          </div>
          {capabilities && !capabilities.workerReady && (
            <p role="status" className="mt-3 text-xs">
              Generation is being configured. Your saved designs and editing
              brief remain available.
            </p>
          )}
          {job && (
            <div
              role="status"
              className="mt-4 rounded-xl border bg-secondary/40 p-4"
            >
              <p className="flex items-center gap-2 text-sm">
                {job.status !== "needs_recovery" && (
                  <Loader2 size={15} className="animate-spin" />
                )}
                {job.status === "queued"
                  ? "Your design is queued."
                  : job.status === "saving"
                    ? "Saving your new version…"
                    : job.status === "needs_recovery"
                      ? "Generation needs your attention."
                      : "Creating your design… You can leave and return."}
              </p>
              {job.error_message && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {job.error_message}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {job.status === "needs_recovery" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      void perform(async () => {
                        await designRequest("recover", { jobId: job.id });
                        await refresh();
                      })
                    }
                  >
                    Recover saved result
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending || job.cancel_requested}
                  onClick={() =>
                    void perform(async () => {
                      await designRequest("cancel", { jobId: job.id });
                      await refresh();
                    })
                  }
                >
                  {job.cancel_requested
                    ? "Cancellation requested"
                    : job.status === "needs_recovery"
                      ? "End this job"
                      : "Cancel generation"}
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                A request already sent to the model can still finish and be
                charged. Recovery checks an existing result; it does not request
                another render.
              </p>
            </div>
          )}
          {!job && latestJob?.status === "failed" && (
            <div
              role="alert"
              className="mt-4 space-y-1 text-sm text-destructive"
            >
              <p className="text-xs font-medium">
                Last failed request · {modelLabels[latestJob.quality]} ·{" "}
                {latestJob.image_size}
              </p>
              <p>{latestJob.error_message}</p>
            </div>
          )}
        </div>
        <div className="studio-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium">Version history</h3>
            <span className="text-xs text-muted-foreground">
              {data.versions.length} saved
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {data.versions.map((v) => {
              const asset = data.assets.find((a) => a.id === v.asset_id);
              return (
                <button
                  key={v.id}
                  aria-label={`View ${v.label}`}
                  aria-pressed={selected.id === v.id}
                  className={`w-32 shrink-0 rounded-xl border p-1.5 text-left transition ${selected.id === v.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"} ${v.state === "rejected" ? "opacity-50" : ""}`}
                  onClick={() => setSelectedId(v.id)}
                >
                  {asset?.url && (
                    <img
                      src={asset.url}
                      alt=""
                      className="aspect-[4/3] w-full rounded-lg object-cover"
                    />
                  )}
                  <p className="mt-2 truncate px-1 text-xs">{v.label}</p>
                  <p className="mb-1 mt-1 px-1 text-[10px] text-muted-foreground">
                    {data.branches.find((b) => b.id === v.branch_id)?.name} ·{" "}
                    {v.state}
                  </p>
                </button>
              );
            })}
          </div>
          {(branch.context.decisions || []).length > 0 && (
            <details className="mt-4 border-t pt-3 text-xs">
              <summary className="cursor-pointer text-muted-foreground">
                Remembered instructions · {branch.context.decisions.length}
              </summary>
              <ol className="mt-3 list-decimal space-y-2 pl-5">
                {branch.context.decisions.map((instruction, i) => (
                  <li key={i} className="leading-relaxed">
                    {instruction}
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
          <p>
            Removing a reference starts fresh model context. Saved images retain
            their visible changes.
          </p>
          <button
            className="underline disabled:opacity-50"
            disabled={busy || dirty}
            onClick={() => setForgetOpen(true)}
          >
            Delete model conversations
          </button>
        </div>
      </section>
      <Dialog open={forgetOpen} onOpenChange={setForgetOpen}>
        <DialogContent>
          <DialogTitle>Delete stored model conversations?</DialogTitle>
          <DialogDescription>
            Stop reusing every model conversation for this room and request
            their deletion from Google. Saved images, versions, briefs and
            remembered instructions stay in Roomscape and can build a fresh
            conversation. This does not erase visual influences already present
            in an image. Provider deletion runs in the background and may take
            time.
          </DialogDescription>
          <Button
            disabled={pending}
            onClick={() =>
              void perform(async () => {
                await designRequest("forget-conversations", {
                  projectId: data.project.id,
                });
                await refresh();
                setForgetOpen(false);
                toast.success(
                  "Model reuse disabled. Conversation deletion requested.",
                );
              })
            }
          >
            Request conversation deletion
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-[95vw] p-4">
          <DialogTitle>{selected.label}</DialogTitle>
          <DialogDescription>{data.project.title}</DialogDescription>
          {canvas?.url && (
            <img
              src={canvas.url}
              alt={selected.label}
              className="max-h-[78vh] w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={forkOpen} onOpenChange={setForkOpen}>
        <DialogContent>
          <DialogTitle>A new direction</DialogTitle>
          <DialogDescription>
            Begin from “{selected.label}”. The selected version’s brief and
            references are copied into an independent direction.
          </DialogDescription>
          <label className="workspace-label">
            Direction name
            <input
              className="workspace-input"
              value={forkName}
              onChange={(e) => setForkName(e.target.value)}
              maxLength={100}
              placeholder="e.g. A softer palette"
            />
          </label>
          <label className="flex gap-2 text-xs leading-relaxed">
            <input
              type="checkbox"
              checked={fresh}
              onChange={(e) => setFresh(e.target.checked)}
            />
            Start fresh from this image, without carrying earlier edit
            instructions. Keep its brief and references.
          </label>
          <Button disabled={pending} onClick={() => void perform(fork)}>
            Create direction
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
