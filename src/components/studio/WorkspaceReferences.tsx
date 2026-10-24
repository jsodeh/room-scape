import { useEffect, useState } from "react";
import { ImagePlus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { designRequest, uploadDesignPhoto } from "@/services/designService";
import { ROLE_FIELDS, REFERENCE_ROLES } from "@/types/design";
import type {
  AssetAnalysis,
  DesignAsset,
  DesignContext,
  ReferenceBinding,
  ReferenceRole,
} from "@/types/design";

interface Props {
  userId: string;
  projectId: string;
  context: DesignContext;
  assets: DesignAsset[];
  analyses: AssetAnalysis[];
  onChange: (context: DesignContext) => void;
  onRefresh: () => Promise<unknown>;
  onBusy: (busy: boolean) => void;
}
export default function WorkspaceReferences({
  userId,
  projectId,
  context,
  assets,
  analyses,
  onChange,
  onRefresh,
  onBusy,
}: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    onBusy(!!busy);
  }, [busy, onBusy]);
  const change = (index: number, patch: Partial<ReferenceBinding>) =>
    onChange({
      ...context,
      references: context.references.map((ref, i) =>
        i === index ? { ...ref, ...patch } : ref,
      ),
    });
  async function attach(file: File) {
    setBusy("upload");
    try {
      const url = await uploadDesignPhoto(file, userId, projectId);
      const { asset } = await designRequest<{ asset: DesignAsset }>(
        "register-reference",
        { projectId, url },
      );
      await onRefresh();
      onChange({
        ...context,
        references: [
          ...context.references,
          {
            assetId: asset.id,
            role: "style",
            scope: "branch",
            priority: context.references.some(
              (r) => r.role === "style" && r.priority === "primary",
            )
              ? "supporting"
              : "primary",
            accepted: {},
          },
        ],
      });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(null);
    }
  }
  async function analyze(ref: ReferenceBinding) {
    setBusy(ref.assetId);
    try {
      await designRequest("analyze", {
        projectId,
        assetId: ref.assetId,
        role: ref.role,
      });
      await onRefresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">
          Reference photographs{" "}
          <span className="text-muted-foreground">
            {context.references.length}/3
          </span>
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Give each photo one purpose. Your room remains the editing canvas.
        </p>
      </div>
      {context.references.map((ref, index) => {
        const asset = assets.find((a) => a.id === ref.assetId);
        const analysis = [...analyses]
          .reverse()
          .find((a) => a.asset_id === ref.assetId && a.role === ref.role);
        return (
          <article
            key={ref.assetId}
            className="rounded-xl border bg-background p-3"
            aria-label={`Reference ${index + 1}`}
          >
            <div className="flex gap-3">
              {asset?.url && (
                <img
                  src={asset.url}
                  alt={`Reference ${index + 1}`}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1 space-y-2">
                <select
                  className="workspace-input"
                  aria-label={`Reference ${index + 1} purpose`}
                  value={ref.role}
                  onChange={(e) =>
                    change(index, {
                      role: e.target.value as ReferenceRole,
                      analysisId: undefined,
                      accepted: {},
                      priority: "supporting",
                    })
                  }
                >
                  {REFERENCE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)} only
                    </option>
                  ))}
                </select>
                <select
                  className="workspace-input"
                  aria-label={`Reference ${index + 1} duration`}
                  value={ref.scope}
                  onChange={(e) =>
                    change(index, {
                      scope: e.target.value as "branch" | "turn",
                    })
                  }
                >
                  <option value="branch">This direction</option>
                  <option value="turn">Next edit only</option>
                </select>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove reference ${index + 1}`}
                onClick={() =>
                  onChange({
                    ...context,
                    references: context.references.filter(
                      (_, i) => i !== index,
                    ),
                  })
                }
              >
                <X size={15} />
              </Button>
            </div>
            <label className="my-3 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={ref.priority === "primary"}
                onChange={(e) =>
                  change(index, {
                    priority: e.target.checked ? "primary" : "supporting",
                  })
                }
              />
              Primary for this purpose
            </label>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              disabled={!!busy}
              onClick={() => void analyze(ref)}
            >
              <Sparkles size={13} />
              {busy === ref.assetId
                ? "Analysing…"
                : analysis
                  ? "Refresh analysis"
                  : "Analyse this purpose"}
            </Button>
            {analysis && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium">Choose guidance to apply</p>
                {Object.entries(analysis.observations)
                  .filter(([key]) => ROLE_FIELDS[ref.role].includes(key))
                  .flatMap(([key, values]) =>
                    values.map((value) => (
                      <label
                        key={key + value}
                        className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={ref.accepted[key]?.includes(value) || false}
                          onChange={(e) =>
                            change(index, {
                              analysisId: analysis.id,
                              accepted: {
                                ...ref.accepted,
                                [key]: e.target.checked
                                  ? [...(ref.accepted[key] || []), value]
                                  : (ref.accepted[key] || []).filter(
                                      (v) => v !== value,
                                    ),
                              },
                            })
                          }
                        />
                        <span>{value}</span>
                      </label>
                    )),
                  )}
                {analysis.uncertainty.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Uncertain: {analysis.uncertainty.join(" ")}
                  </p>
                )}
              </div>
            )}
          </article>
        );
      })}
      {context.references.length < 3 && (
        <label
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-xs hover:bg-secondary ${busy ? "pointer-events-none opacity-50" : ""}`}
        >
          <ImagePlus size={16} />
          {busy === "upload"
            ? "Preparing photograph…"
            : "Add reference photograph"}
          <input
            aria-label="Add reference photograph"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={!!busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void attach(file);
            }}
          />
        </label>
      )}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Analysis is optional. Suggestions become guidance only when selected and
        saved. Changing a photo’s purpose clears its selected guidance.
      </p>
    </div>
  );
}
