import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  ImagePlus,
  Leaf,
  Loader2,
  Plus,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { useStagingContext } from "@/context/StagingContext";
import { useStagingProcessor } from "@/hooks/useStagingProcessor";
import { uploadImage } from "@/services/fileStorageService";
import { prepareRoomImage } from "@/utils/prepareRoomImage";
import {
  buildDesignInstructions,
  DEFAULT_SETTINGS,
  PALETTES,
  ROOM_IMAGE,
  STYLES,
  StudioSettings,
} from "@/data/studio";
import ResultsDisplay from "@/components/ResultsDisplay";
import ReferenceImageUploader from "@/components/staging-instructions/ReferenceImageUploader";

const DRAFT_KEY = "roomscape-studio-preferences-v1";
function readPreferences(): StudioSettings {
  try {
    const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null");
    if (!saved || typeof saved !== "object") return DEFAULT_SETTINGS;
    return {
      room: [
        "Living room",
        "Bedroom",
        "Dining room",
        "Home office",
        "Kitchen",
        "Outdoor space",
      ].includes(saved.room)
        ? saved.room
        : DEFAULT_SETTINGS.room,
      style: STYLES.some((style) => style.id === saved.style)
        ? saved.style
        : DEFAULT_SETTINGS.style,
      palette: PALETTES.some((palette) => palette.id === saved.palette)
        ? saved.palette
        : DEFAULT_SETTINGS.palette,
      density: ["Light", "Balanced", "Full"].includes(saved.density)
        ? saved.density
        : DEFAULT_SETTINGS.density,
      preserve: typeof saved.preserve === "boolean" ? saved.preserve : true,
      notes: typeof saved.notes === "string" ? saved.notes.slice(0, 3000) : "",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function DesignStudio() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const state = useStagingContext();
  const [settings, setSettings] = useState<StudioSettings>(readPreferences);
  const [preparing, setPreparing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [referenceGuidance, setReferenceGuidance] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const fileRequest = useRef(0);
  const busy = preparing || uploading || state.isProcessing;
  const photo = state.originalImagePreviews[0];
  const style = STYLES.find((item) => item.id === settings.style) || STYLES[0];
  const palette =
    PALETTES.find((item) => item.id === settings.palette) || PALETTES[0];
  const instructions = [buildDesignInstructions(settings), referenceGuidance
    ? `Reference style guidance only; do not copy the reference room's architecture: ${referenceGuidance}` : ''].filter(Boolean).join('\n');
  useEffect(() => setReferenceGuidance(''), [photo]);
  const processor = useStagingProcessor({
    userId: user?.id,
    originalImageUrls: state.originalImageUrls,
    stagingInstructions: instructions,
    referenceImageUrl: state.referenceImageUrl,
    currentProjectId: state.currentProjectId,
    isProcessing: state.isProcessing,
    setCurrentProjectId: state.setCurrentProjectId,
    setStagedImageResults: state.setStagedImageResults,
    setIsProcessing: state.setIsProcessing,
    setIsComplete: state.setIsComplete,
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(settings));
    } catch {
      /* Storage may be disabled. The current design remains usable. */
    }
  }, [settings]);
  const update = <K extends keyof StudioSettings>(
    key: K,
    value: StudioSettings[K],
  ) => setSettings((previous) => ({ ...previous, [key]: value }));

  async function choosePhoto(files: FileList | null) {
    if (!files?.length || busy) return;
    if (files.length > 1) {
      toast.error(
        "Choose one room photo per design. You can create more rooms in Projects.",
      );
      return;
    }
    const request = ++fileRequest.current;
    setPreparing(true);
    try {
      const prepared = await prepareRoomImage(files[0]);
      if (request !== fileRequest.current) return;
      state.resetState();
      state.handleImagesSelected([prepared]);
      toast.success("Your room is ready. Choose a style to make it yours.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "We could not open this photo.",
      );
    } finally {
      if (request === fileRequest.current) setPreparing(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  function dropPhoto(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void choosePhoto(event.dataTransfer.files);
  }
  function newRoom() {
    if (busy) return;
    state.resetState();
    setSettings({ ...DEFAULT_SETTINGS });
    if (fileInput.current) fileInput.current.value = "";
  }
  async function generate() {
    if (busy) return;
    if (!photo) {
      fileInput.current?.click();
      return;
    }
    if (!user) {
      toast.info(
        "Sign in to save your room and create your design. Your photo will stay here.",
      );
      navigate("/auth?next=/");
      return;
    }
    let urls = state.originalImageUrls;
    if (!urls.length) {
      setUploading(true);
      try {
        const url = await uploadImage(state.uploadedImages[0]);
        if (!url) throw new Error("Upload failed");
        urls = [url];
        state.handleImageUrlsReady(urls);
      } catch {
        toast.error("Your photo could not be uploaded. Please try again.");
        return;
      } finally {
        setUploading(false);
      }
    }
    canvas.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    await processor.handleSubmit(urls);
  }
  const actionLabel = preparing
    ? "Preparing your photo…"
    : uploading
      ? "Uploading your room…"
      : state.isProcessing
        ? "Creating your design…"
        : !photo
          ? "Upload your room"
          : !user
            ? "Sign in to generate"
            : "Generate design";
  const generateButton = (
    <Button
      onClick={() => void generate()}
      disabled={busy}
      className="h-12 w-full rounded-xl text-sm shadow-sm"
    >
      {busy ? (
        <Loader2 className="animate-spin" />
      ) : photo ? (
        <Sparkles />
      ) : (
        <Upload />
      )}
      {actionLabel}
      {!busy && <ArrowRight className="ml-auto" />}
    </Button>
  );

  return (
    <>
      <div className="mb-8 flex items-end justify-between gap-5">
        <div>
          <p className="eyebrow mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />A new
            perspective starts here
          </p>
          <h1 className="editorial-title text-[37px] sm:text-[48px] lg:text-[53px]">
            Good rooms.{" "}
            <span className="italic text-primary">Great possibilities.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Bring your space to life. A photo, a little inspiration, and a room
            that feels like you.
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {photo && (
            <Button
              variant="outline"
              size="sm"
              onClick={newRoom}
              disabled={busy}
            >
              <Plus />
              New room
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => void generate()}
            disabled={busy}
            className="rounded-lg"
          >
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {actionLabel}
          </Button>
        </div>
      </div>
      <div className="mb-6 flex items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-5 text-xs sm:gap-7">
          <span className="flex items-center gap-2 font-semibold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {photo ? <Check size={12} /> : "1"}
            </span>
            Your room
          </span>
          <span
            className={`flex items-center gap-2 ${photo ? "text-foreground" : "text-muted-foreground"}`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border text-[10px]">
              2
            </span>
            Your style
          </span>
          <span className="hidden items-center gap-2 text-muted-foreground sm:flex">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border text-[10px]">
              3
            </span>
            Your new perspective
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowHelp((value) => !value)}
          aria-expanded={showHelp}
          aria-controls="studio-help"
          className="flex items-center gap-1.5 rounded text-xs text-muted-foreground"
        >
          <CircleHelp size={14} />
          <span className="hidden sm:inline">How it works</span>
        </button>
      </div>
      {showHelp && (
        <div
          id="studio-help"
          className="mb-6 rounded-xl border bg-accent p-5 text-sm leading-relaxed"
        >
          <strong>A room in three steps.</strong> Upload a JPG, PNG or WebP
          photo, choose your style and palette, then generate a design. One
          photo per design, up to 10 MB. Your preferences stay in this browser
          session; after a refresh, re-upload your photo. AI can reinterpret
          details, so review the result before using it.
        </div>
      )}
      {processor.hasErrors() && (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription>
            {processor.getFirstError()?.message}
          </AlertDescription>
        </Alert>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Upload room photo"
        className="hidden"
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          void choosePhoto(event.target.files)
        }
        disabled={busy}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[330px_minmax(0,1fr)] xl:gap-8">
        <aside
          className="studio-panel order-2 overflow-hidden lg:order-1"
          aria-label="Design settings"
        >
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal size={15} />
              Make it your own
            </h2>
            <span className="rounded bg-secondary px-2 py-1 text-[9px] font-medium tracking-wider text-muted-foreground">
              DESIGN BRIEF
            </span>
          </div>
          <div className="studio-divider">
            <label htmlFor="room-type" className="studio-label">
              <span>Room type</span>
              <span
                aria-hidden="true"
                className="font-normal text-muted-foreground"
              >
                01
              </span>
            </label>
            <select
              id="room-type"
              value={settings.room}
              disabled={busy}
              onChange={(event) => update("room", event.target.value)}
              className="studio-input"
            >
              {[
                "Living room",
                "Bedroom",
                "Dining room",
                "Home office",
                "Kitchen",
                "Outdoor space",
              ].map((room) => (
                <option key={room}>{room}</option>
              ))}
            </select>
          </div>
          <fieldset className="studio-divider" disabled={busy}>
            <legend className="sr-only">Design style</legend>
            <div className="studio-label">
              <span>Find your style</span>
              <span className="font-normal text-muted-foreground">02</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {STYLES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="style-card bg-secondary"
                  onClick={() => update("style", item.id)}
                  aria-pressed={settings.style === item.id}
                >
                  <div className="relative h-[65px] overflow-hidden">
                    <img
                      src={ROOM_IMAGE}
                      alt=""
                      className="h-full w-full object-cover"
                      style={{
                        objectPosition: item.position,
                        filter: item.tone,
                      }}
                    />
                    {settings.style === item.id && (
                      <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check size={10} />
                      </span>
                    )}
                  </div>
                  <span className="block truncate px-1 py-2 text-center text-[11px] font-medium">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Style inspiration. Your design uses your room photo.
            </p>
          </fieldset>
          <fieldset className="studio-divider" disabled={busy}>
            <legend className="sr-only">Colour palette</legend>
            <div className="studio-label">
              <span>Set the mood</span>
              <span className="font-normal text-muted-foreground">03</span>
            </div>
            <div className="flex justify-between gap-1">
              {PALETTES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={item.name}
                  title={item.name}
                  aria-pressed={settings.palette === item.id}
                  onClick={() => update("palette", item.id)}
                  className={`flex gap-0.5 rounded-full border-2 p-1 transition-colors ${settings.palette === item.id ? "border-primary" : "border-transparent hover:border-border"}`}
                >
                  {item.colors.map((color) => (
                    <span
                      key={color}
                      className="h-4 w-4 rounded-full border border-black/5"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </button>
              ))}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1 w-1 rounded-full bg-primary" />
              {palette.name}
            </p>
          </fieldset>
          <fieldset className="studio-divider" disabled={busy}>
            <legend className="sr-only">Furnishing density</legend>
            <div className="studio-label">
              <span>Room to breathe</span>
              <span className="text-[10px] font-normal text-muted-foreground">
                Furnishing density
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-secondary p-1">
              {["Light", "Balanced", "Full"].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={settings.density === value}
                  onClick={() => update("density", value)}
                  className={`rounded-md py-2 text-xs transition-colors ${settings.density === value ? "bg-card font-medium shadow-sm" : "text-muted-foreground"}`}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="px-5 py-4">
            <details>
              <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold">
                The finer details
                <ChevronDown size={14} />
              </summary>
              <div className="mt-4 space-y-4">
                <label className="flex items-start gap-2.5 text-xs leading-relaxed">
                  <input
                    type="checkbox"
                    checked={settings.preserve}
                    disabled={busy}
                    onChange={(event) =>
                      update("preserve", event.target.checked)
                    }
                    className="mt-0.5 accent-[hsl(var(--primary))]"
                  />
                  <span>
                    Ask AI to keep the existing architecture
                    <span className="mt-1 block text-[10px] text-muted-foreground">
                      A design preference; review the generated result.
                    </span>
                  </span>
                </label>
                <div>
                  <label
                    htmlFor="design-notes"
                    className="mb-2 block text-xs font-medium"
                  >
                    Anything else in mind?
                  </label>
                  <textarea
                    id="design-notes"
                    rows={4}
                    maxLength={3000}
                    value={settings.notes}
                    disabled={busy}
                    onChange={(event) => update("notes", event.target.value)}
                    placeholder="A reading nook by the window, a sofa for two…"
                    className="studio-input resize-y text-xs"
                  />
                </div>
                {user ? (
                  <ReferenceImageUploader
                    key={photo || "empty"}
                    disabled={busy}
                    onReferenceImageChange={state.handleReferenceImageChange}
                    onReferenceImageUpload={state.handleReferenceImageUpload}
                    onAnalysisInstructionsGenerated={setReferenceGuidance}
                  />
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Sign in to add a reference image and extract its style.
                  </p>
                )}
              </div>
            </details>
          </div>
          <div className="hidden border-t px-5 py-5 lg:block">
            {generateButton}
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
              <ShieldCheck size={12} />
              {photo
                ? "Your original photo stays unchanged."
                : "Start with one room photo. Make it yours."}
            </p>
          </div>
        </aside>
        <section
          ref={canvas}
          className="order-1 min-w-0 scroll-mt-24 lg:order-2"
          aria-label="Room canvas"
        >
          <div className="studio-panel overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-3.5 sm:px-5">
              <div className="flex min-w-0 items-center gap-2 text-xs font-medium">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${photo ? "bg-primary" : "bg-muted-foreground"}`}
                />
                <span className="truncate">
                  {photo
                    ? state.uploadedImages[0]?.name || "Your room"
                    : "A little inspiration to begin"}
                </span>
              </div>
              <button
                onClick={() => fileInput.current?.click()}
                disabled={busy}
                className="flex shrink-0 items-center gap-1.5 rounded p-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <ImagePlus size={14} />
                {photo ? "Change photo" : "Upload photo"}
              </button>
            </div>
            <div className="p-3 sm:p-4">
              {state.isComplete && state.stagedImageResults.length > 0 ? (
                <ResultsDisplay
                  originalImages={state.originalImageUrls}
                  stagedImages={state.stagedImageResults}
                  stagedImageHistory={state.stagedImageHistory}
                  onEdit={state.handleEdit}
                  isEditMode={state.isEditMode}
                  onReset={newRoom}
                />
              ) : (
                <div
                  className={`relative overflow-hidden rounded-xl border transition-colors ${dragging ? "ring-2 ring-primary ring-offset-4 ring-offset-card" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (!busy) setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={dropPhoto}
                >
                  <img
                    src={photo || ROOM_IMAGE}
                    alt={
                      photo
                        ? "Your original room, ready for staging"
                        : "Warm modern living room with natural textures, sculptural furniture and afternoon light"
                    }
                    className={`w-full ${photo ? "aspect-[4/3] object-contain bg-secondary" : "aspect-[4/3] object-cover sm:aspect-[16/11]"}`}
                  />
                  {!photo && (
                    <>
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                      <span className="absolute left-4 top-4 rounded-full border border-white/40 bg-white/90 px-3 py-1.5 text-[9px] font-medium uppercase tracking-[.15em] text-stone-700">
                        The inspiration room
                      </span>
                      <div className="absolute bottom-5 left-5 right-5 text-white sm:bottom-7 sm:left-7">
                        <p className="mb-2 text-[9px] uppercase tracking-[.25em] text-white/80">
                          Natural textures. Quiet character.
                        </p>
                        <p className="editorial-title text-[28px] sm:text-[38px]">
                          Imagine what home could be.
                        </p>
                        <p className="mt-2 text-[11px] text-white/80">
                          An example interior, ready to inspire your own.
                        </p>
                      </div>
                    </>
                  )}
                  {photo && !state.isProcessing && (
                    <span className="absolute bottom-3 left-3 rounded-md bg-card/95 px-3 py-1.5 text-[10px] font-medium">
                      <Check className="mr-1 inline h-3 w-3 text-primary" />
                      Original room · ready to design
                    </span>
                  )}
                  {(state.isProcessing || preparing) && (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/90 p-6 text-center backdrop-blur-sm"
                      role="status"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                        <Loader2 className="animate-spin text-primary" />
                      </span>
                      <h2 className="editorial-title text-3xl">
                        {preparing
                          ? "A little preparation…"
                          : "A new perspective is taking shape."}
                      </h2>
                      <p className="max-w-xs text-sm text-muted-foreground">
                        {preparing
                          ? "Getting your room photo ready."
                          : "AI is working with your room and design brief. This can take a few minutes."}
                      </p>
                      {state.currentProjectId && (
                        <Link
                          to={`/projects/${state.currentProjectId}`}
                          className="text-xs text-primary underline underline-offset-4"
                        >
                          View this room in Projects
                        </Link>
                      )}
                    </div>
                  )}
                  {dragging && !busy && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/90 text-primary-foreground">
                      <Upload className="mr-3" />
                      Drop your room photo here
                    </div>
                  )}
                </div>
              )}
              {state.isEditMode && (
                <form
                  className="mt-4 space-y-3 rounded-xl border bg-background p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void state.handleEditSubmit();
                  }}
                >
                  <label htmlFor="refinement" className="text-sm font-medium">
                    What would you like to change?
                  </label>
                  <textarea
                    id="refinement"
                    className="studio-input"
                    value={state.editInstructions}
                    onChange={(event) =>
                      state.handleEditInstructionsChange(event.target.value)
                    }
                    maxLength={3000}
                    placeholder="Try a lighter sofa, add a rug, soften the lighting…"
                    disabled={busy}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => state.setIsEditMode(false)}
                      disabled={busy}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={busy || !state.editInstructions.trim()}
                    >
                      {busy ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Sparkles />
                      )}
                      Apply changes
                    </Button>
                  </div>
                </form>
              )}
              {!state.isComplete && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-1 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="studio-chip">
                      {photo ? settings.room : "Living room"}
                    </span>
                    <span className="studio-chip">
                      {photo ? style.name : "Warm modern"}
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Leaf size={12} />
                    {photo
                      ? "Your space, your direction"
                      : "Inspiration preview"}
                  </span>
                </div>
              )}
            </div>
          </div>
          {!photo && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={busy}
              className="mt-4 flex w-full items-center gap-4 rounded-xl border border-dashed bg-card/60 p-4 text-left transition-colors hover:border-primary hover:bg-accent/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Upload size={18} strokeWidth={1.5} />
              </span>
              <span className="flex-1">
                <span className="block text-xs font-semibold">
                  Your room has a story. Let's give it a new chapter.
                </span>
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  Click to upload, or drop your photo on the canvas. JPG, PNG or
                  WebP · up to 10 MB.
                </span>
              </span>
              <ArrowRight size={16} className="shrink-0 text-primary" />
            </button>
          )}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t pt-5 sm:gap-6">
            {[
              ["01", "Bring your space", "One room photo is all you need."],
              ["02", "Find your feeling", "Set the style, colours and mood."],
              ["03", "Make it yours", "Compare, refine and save your design."],
            ].map(([number, title, description]) => (
              <div key={number}>
                <span className="text-[10px] text-primary">{number} /</span>
                <h3 className="mb-1 mt-2 text-xs font-semibold">{title}</h3>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="h-24 lg:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto max-w-lg">{generateButton}</div>
      </div>
    </>
  );
}
