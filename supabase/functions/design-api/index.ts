import { corsHeaders } from "../_shared/cors.ts";
import {
  HttpError,
  requireOwnedAsset,
  requireUser,
} from "../_shared/security.ts";
import {
  assetBytes,
  assetURL,
  checked,
  db,
  ownedBranch,
  ownedProject,
  ownedVersion,
  permittedAsset,
} from "../_shared/design/db.ts";
import {
  canonical,
  compileContext,
  ContextSchema,
  normalizeContext,
  parse,
  SubmitSchema,
  uuid,
} from "../_shared/design/context.ts";
import { EMPTY_CONTEXT, REFERENCE_ROLES } from "../_shared/design/contracts.ts";
import type {
  DesignContext,
  DesignProject,
  ReferenceRole,
} from "../_shared/design/contracts.ts";
import { inspectImage, sha256, stableId } from "../_shared/design/images.ts";
import { modelCatalog } from "../_shared/design/provider.ts";
import { analyzeReference } from "../_shared/design/analysis.ts";

const now = () => new Date().toISOString();
const id = (value: unknown) => parse(uuid, value);
const projectFields =
  "id,title,original_asset_id,active_branch_id,current_version_id,created_at";
const jobFields =
  "id,branch_id,turn_id,base_version_id,status,error_code,error_message,result_version_ids,cancel_requested,created_at,quality,image_size,model";
type LegacyProject = DesignProject & {
  workflow_version: number;
  original_images: string[];
  staged_images: string[];
  instructions: string;
};
interface ActionBody {
  action?: string;
  projectId?: unknown;
  branchId?: unknown;
  versionId?: unknown;
  jobId?: unknown;
  assetId?: unknown;
  context?: DesignContext;
  contextRevision?: number;
  input?: unknown;
  originalUrl?: string;
  url?: string;
  title?: string;
  name?: string;
  state?: string;
  role?: ReferenceRole;
  profileId?: unknown;
  profileVersionId?: unknown;
  includeReferences?: boolean;
  guidance?: string;
  freshContext?: boolean;
}
async function register(
  userId: string,
  projectId: string,
  url: string,
  kind = "reference",
) {
  const target = requireOwnedAsset(url, userId);
  const match = decodeURIComponent(target.pathname).match(
    /^\/storage\/v1\/object\/public\/(room-images|design-results)\/(.+)$/,
  );
  if (!match) {
    throw new HttpError(400, "Upload the image to your project storage first.");
  }
  const [, bucket, path] = match;
  const existing = checked(
    await db.from("design_assets").select("*").eq("bucket", bucket).eq(
      "storage_path",
      path,
    ).maybeSingle(),
  );
  if (existing) {
    if (
      existing.user_id !== userId || existing.project_id !== projectId ||
      existing.deleted_at
    ) throw new HttpError(403, "Use an image attached to this project.");
    return existing;
  }
  const blob = checked(await db.storage.from(bucket).download(path));
  if (blob.size > (kind === "generated" ? 50 : 4) * 1024 * 1024) {
    throw new HttpError(413, "Choose a smaller image.");
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const info = inspectImage(bytes);
  const asset = {
    id: await stableId(userId + ":" + bucket + ":" + path),
    user_id: userId,
    project_id: projectId,
    kind,
    bucket,
    storage_path: path,
    mime_type: info.mimeType,
    width: info.width,
    height: info.height,
    byte_size: bytes.length,
    content_hash: await sha256(bytes),
    deleted_at: null,
    created_at: now(),
  };
  return asset;
}
async function validateReferences(
  userId: string,
  projectId: string,
  context: DesignContext,
) {
  for (const ref of context.references) {
    const asset = await permittedAsset(userId, projectId, ref.assetId, true);
    if (ref.analysisId) {
      const analysis = checked(
        await db.from("design_analyses").select("id").eq("id", ref.analysisId)
          .eq("user_id", userId).eq("asset_id", asset.id).eq("role", ref.role)
          .maybeSingle(),
      );
      if (!analysis) {
        throw new HttpError(
          400,
          "The selected analysis does not match its photograph and purpose.",
        );
      }
    }
  }
  if (context.profileVersionId) {
    const profile = checked(
      await db.from("style_profile_versions").select("id").eq(
        "id",
        context.profileVersionId,
      ).eq("user_id", userId).maybeSingle(),
    );
    if (!profile) throw new HttpError(404, "Style profile version not found.");
  }
}
async function initialize(
  userId: string,
  project: LegacyProject,
  context: DesignContext,
) {
  if (project.workflow_version === 2) {
    return await importLegacy(userId, project);
  }
  if (!project.original_images?.[0]) {
    throw new HttpError(
      409,
      "This legacy project has no original image to resume.",
    );
  }
  const asset = await register(
    userId,
    project.id,
    project.original_images[0],
    "original",
  );
  const branchId = crypto.randomUUID(), versionId = crypto.randomUUID();
  context = { ...context, epoch: crypto.randomUUID() };
  const branch = {
    id: branchId,
    user_id: userId,
    project_id: project.id,
    name: "Main design",
    head_version_id: null,
    forked_from_version_id: null,
    context,
    context_revision: 0,
    created_at: now(),
  };
  const version = {
    id: versionId,
    user_id: userId,
    project_id: project.id,
    branch_id: branchId,
    parent_version_id: null,
    asset_id: asset.id,
    turn_id: null,
    context_snapshot: context,
    label: "Original room",
    state: "accepted",
    model: null,
    image_size: null,
    created_at: now(),
  };
  project = checked(
    await db.rpc("design_initialize_project", {
      p_project: project.id,
      p_user: userId,
      p_asset: asset,
      p_branch: branch,
      p_version: version,
    }),
  );
  return await importLegacy(userId, project);
}
async function importLegacy(userId: string, project: LegacyProject) {
  if (
    project.staged_images?.[0] &&
    project.staged_images[0] !== project.original_images?.[0]
  ) {
    const root = checked(
      await db.from("design_versions").select("*").eq(
        "id",
        project.current_version_id,
      ).single(),
    );
    if (root.parent_version_id) return project;
    const latest = await register(
      userId,
      project.id,
      project.staged_images[0],
      "generated",
    );
    const importedId = await stableId(
      project.id + ":imported:" + latest.storage_path,
    );
    checked(
      await db.rpc("design_import_legacy", {
        p_user: userId,
        p_project: project.id,
        p_asset: latest,
        p_version: {
          ...root,
          id: importedId,
          asset_id: latest.id,
          parent_version_id: root.id,
          label: "Imported saved design",
        },
      }),
    );
  }
  return project;
}
async function history(userId: string, projectId: string) {
  let project = await ownedProject(userId, projectId);
  project = await initialize(userId, project, {
    ...EMPTY_CONTEXT,
    brief: { ...EMPTY_CONTEXT.brief, notes: project.instructions || "" },
  });
  const names = [
    "design_branches",
    "design_versions",
    "design_turns",
    "design_assets",
  ];
  const rows = await Promise.all(
    names.map((table) =>
      db.from(table).select("*").eq("project_id", projectId).eq(
        "user_id",
        userId,
      ).order("created_at")
    ),
  );
  const [branches, versions, turns, ownAssets] = rows.map(checked);
  const links = checked(
    await db.from("design_reference_links").select("asset_id").eq(
      "project_id",
      projectId,
    ).eq("user_id", userId),
  );
  const linked = links.length
    ? checked(
      await db.from("design_assets").select("*").in(
        "id",
        links.map((x) => x.asset_id),
      ).eq("user_id", userId),
    )
    : [];
  const assets = [
    ...new Map([...ownAssets, ...linked].map((a) => [a.id, a])).values(),
  ].map((a) => ({ ...a, url: a.deleted_at ? "" : assetURL(a) }));
  const analyses = assets.length
    ? checked(
      await db.from("design_analyses").select("*").in(
        "asset_id",
        assets.map((a) => a.id),
      ).eq("user_id", userId),
    )
    : [];
  const jobs = checked(
    await db.from("design_jobs").select(jobFields).eq("project_id", projectId)
      .eq("user_id", userId).order("created_at"),
  );
  const fresh = await ownedProject(userId, projectId);
  return {
    project: Object.fromEntries(
      projectFields.split(",").map((k) => [k, fresh[k]]),
    ),
    branches,
    versions,
    turns,
    assets,
    analyses,
    jobs,
  };
}
async function capabilities() {
  let cache = checked(
    await db.from("design_capabilities").select("*").eq("id", true)
      .maybeSingle(),
  );
  if (!cache || Date.now() - new Date(cache.checked_at).getTime() > 3600000) {
    const models = await modelCatalog();
    checked(
      await db.from("design_capabilities").upsert({
        id: true,
        models,
        worker_ready: !!cache?.worker_ready,
        checked_at: now(),
      }),
    );
    cache = { ...cache, models };
  }
  return {
    models: cache.models,
    workerReady: !!cache.worker_ready,
    sdk: "@google/genai@2.31.0",
  };
}
async function dispatch(userId: string, body: ActionBody): Promise<unknown> {
  switch (body.action) {
    case "capabilities":
      return await capabilities();
    case "list":
      return {
        projects: checked(
          await db.from("staging_projects").select(
            "id,title,status,created_at,workflow_version",
          ).eq("user_id", userId).order("created_at", { ascending: false }),
        ),
      };
    case "history":
      return await history(userId, id(body.projectId));
    case "create": {
      const projectId = id(body.projectId);
      const context = normalizeContext(body.context);
      if (context.references.length || context.profileVersionId) {
        throw new HttpError(
          400,
          "Attach references or profiles after creating the room.",
        );
      }
      requireOwnedAsset(body.originalUrl, userId);
      let project = checked(
        await db.from("staging_projects").select("*").eq("id", projectId).eq(
          "user_id",
          userId,
        ).maybeSingle(),
      );
      if (!project) {
        project = checked(
          await db.from("staging_projects").insert({
            id: projectId,
            user_id: userId,
            title: String(body.title || "Untitled room").slice(0, 160),
            original_images: [body.originalUrl],
            staged_images: [],
            instructions: context.brief.notes,
            status: "pending",
          }).select().single(),
        );
      }
      await initialize(userId, project, context);
      return await history(userId, projectId);
    }
    case "register-reference": {
      const projectId = id(body.projectId);
      await ownedProject(userId, projectId);
      const asset = await register(userId, projectId, body.url);
      checked(
        await db.from("design_assets").upsert(asset, {
          onConflict: "bucket,storage_path",
          ignoreDuplicates: true,
        }),
      );
      return { asset: { ...asset, url: assetURL(asset) } };
    }
    case "context": {
      const projectId = id(body.projectId);
      const branch = await ownedBranch(userId, projectId, id(body.branchId));
      const context = normalizeContext({
        ...body.context,
        epoch: crypto.randomUUID(),
      });
      await validateReferences(userId, projectId, context);
      const updated = checked(
        await db.from("design_branches").update({
          context,
          context_revision: branch.context_revision + 1,
        }).eq("id", branch.id).eq("context_revision", body.contextRevision)
          .select().maybeSingle(),
      );
      if (!updated) {
        throw new HttpError(
          409,
          "This brief changed in another tab. Reload before saving.",
        );
      }
      return { branch: updated };
    }
    case "fork": {
      const projectId = id(body.projectId);
      const version = await ownedVersion(userId, projectId, id(body.versionId));
      const context = normalizeContext({
        ...version.context_snapshot,
        epoch: crypto.randomUUID(),
      });
      if (body.freshContext) context.decisions = [];
      const allowed = [];
      for (const ref of context.references) {
        try {
          await permittedAsset(userId, projectId, ref.assetId, true);
          allowed.push(ref);
        } catch (error) {
          if (
            !(error instanceof HttpError) || ![403, 404].includes(error.status)
          ) throw error;
        }
      }
      context.references = allowed;
      const branch = checked(
        await db.from("design_branches").insert({
          user_id: userId,
          project_id: projectId,
          name: String(body.name || "New direction").slice(0, 100),
          head_version_id: version.id,
          forked_from_version_id: version.id,
          context,
        }).select().single(),
      );
      return { branch };
    }
    case "submit": {
      const input = parse(SubmitSchema, body.input);
      const requestHash = await sha256(canonical(input));
      const existingJob = checked(
        await db.from("design_jobs").select("*").eq("user_id", userId).eq(
          "idempotency_key",
          input.idempotencyKey,
        ).maybeSingle(),
      );
      if (existingJob) {
        if (existingJob.request_hash !== requestHash) {
          throw new HttpError(
            409,
            "This action identifier was already used for a different edit.",
          );
        }
        return {
          job: Object.fromEntries(
            jobFields.split(",").map((k) => [k, existingJob[k]]),
          ),
        };
      }
      const project = await ownedProject(userId, input.projectId);
      const branch = await ownedBranch(userId, input.projectId, input.branchId);
      const version = await ownedVersion(
        userId,
        input.projectId,
        input.baseVersionId,
      );
      const context = normalizeContext(branch.context);
      await validateReferences(userId, project.id, context);
      const caps = await capabilities();
      if (!caps.workerReady) {
        throw new HttpError(503, "The generation worker is not ready yet.");
      }
      const model = caps.models.find((m) =>
        m.preset === input.quality && m.available
      )?.model;
      if (!model) {
        throw new HttpError(
          503,
          "The selected model is unavailable to this project. Choose another quality mode.",
        );
      }
      const compiled = await compileContext({
        context,
        projectId: project.id,
        branchId: branch.id,
        baseVersionId: version.id,
        originalAssetId: project.original_asset_id,
        baseAssetId: version.asset_id,
        userEdit: input.userEdit,
        scope: input.scope,
        operation: input.operation,
        quality: input.quality,
        model,
        imageSize: input.imageSize,
      });
      const turnId = crypto.randomUUID(),
        jobId = crypto.randomUUID(),
        stamp = now();
      const turn = {
        id: turnId,
        user_id: userId,
        project_id: project.id,
        branch_id: branch.id,
        base_version_id: version.id,
        user_edit: input.userEdit,
        scope: input.scope,
        operation: input.operation,
        context_snapshot: context,
        manifest: compiled.manifest,
        created_at: stamp,
      };
      const job = {
        id: jobId,
        user_id: userId,
        project_id: project.id,
        branch_id: branch.id,
        turn_id: turnId,
        base_version_id: version.id,
        context_revision: input.contextRevision,
        idempotency_key: input.idempotencyKey,
        request_hash: requestHash,
        status: "queued",
        quality: input.quality,
        model,
        image_size: input.imageSize,
        error_code: null,
        error_message: null,
        result_version_ids: [],
        cancel_requested: false,
        claim_token: null,
        lease_expires_at: null,
        provider_interaction_id: null,
        created_at: stamp,
        updated_at: stamp,
      };
      const saved = checked(
        await db.rpc("design_submit_turn", { p_job: job, p_turn: turn }),
      );
      // Durable queue first. Cron is a fallback if this immediate wake-up fails.
      await db.rpc("design_dispatch_worker", { p_operation: "work" });
      return {
        job: Object.fromEntries(jobFields.split(",").map((k) => [k, saved[k]])),
      };
    }
    case "job": {
      const job = checked(
        await db.from("design_jobs").select(jobFields).eq("id", id(body.jobId))
          .eq("user_id", userId).maybeSingle(),
      );
      if (!job) throw new HttpError(404, "Generation not found.");
      return { job };
    }
    case "cancel": {
      const jobId = id(body.jobId);
      const job = checked(
        await db.from("design_jobs").select("id,status").eq("id", jobId).eq(
          "user_id",
          userId,
        ).maybeSingle(),
      );
      if (!job) throw new HttpError(404, "Generation not found.");
      checked(
        await db.rpc("design_cancel_job", { p_job: jobId, p_user: userId }),
      );
      return {
        cancelled: true,
        note:
          "A dispatched request may still finish and be charged. No automatic retry is made.",
      };
    }
    case "recover": {
      const jobId = id(body.jobId);
      const job = checked(
        await db.from("design_jobs").select("id,status,provider_interaction_id")
          .eq("id", jobId).eq("user_id", userId).maybeSingle(),
      );
      if (!job || job.status !== "needs_recovery") {
        throw new HttpError(409, "This job is not awaiting recovery.");
      }
      if (!job.provider_interaction_id) {
        throw new HttpError(
          409,
          "No provider result identifier was received. End this job before explicitly requesting another generation.",
        );
      }
      checked(
        await db.from("design_jobs").update({
          status: "queued",
          error_code: "recover_output",
          error_message: null,
        }).eq("id", jobId).eq("status", "needs_recovery"),
      );
      await db.rpc("design_dispatch_worker", { p_operation: "work" });
      return { recoveryQueued: true };
    }
    case "version-state": {
      const projectId = id(body.projectId),
        version = await ownedVersion(userId, projectId, id(body.versionId));
      if (!["accepted", "rejected"].includes(body.state)) {
        throw new HttpError(400, "Choose keep or reject.");
      }
      checked(
        await db.rpc("design_set_version_state", {
          p_version: version.id,
          p_user: userId,
          p_state: body.state,
        }),
      );
      return { saved: true };
    }
    case "forget-conversations": {
      const projectId = id(body.projectId);
      await ownedProject(userId, projectId);
      const count = checked(
        await db.rpc("design_forget_provider_history", {
          p_project: projectId,
          p_user: userId,
        }),
      );
      await db.rpc("design_dispatch_worker", { p_operation: "work" });
      return {
        deletionQueued: count,
        note:
          "Model conversations will no longer be reused. Provider deletion is queued; saved photographs and instructions remain in this project.",
      };
    }
    case "analyze": {
      const projectId = id(body.projectId);
      await ownedProject(userId, projectId);
      if (!REFERENCE_ROLES.includes(body.role)) {
        throw new HttpError(400, "Choose a reference purpose.");
      }
      const asset = await permittedAsset(
        userId,
        projectId,
        id(body.assetId),
        true,
      );
      const model = Deno.env.get("GEMINI_ANALYSIS_MODEL") || "gemini-2.5-flash";
      const cached = checked(
        await db.from("design_analyses").select("*").eq("asset_id", asset.id)
          .eq("role", body.role).eq("model", model).eq("schema_version", 1).eq(
            "content_hash",
            asset.content_hash,
          ).maybeSingle(),
      );
      if (cached) return { analysis: cached };
      const source = await assetBytes(asset, 4 * 1024 * 1024);
      const result = await analyzeReference(
        source.bytes,
        source.mimeType,
        body.role as ReferenceRole,
      );
      const analysis = checked(
        await db.from("design_analyses").insert({
          user_id: userId,
          asset_id: asset.id,
          role: body.role,
          model,
          schema_version: 1,
          content_hash: asset.content_hash,
          observations: result.observations,
          uncertainty: result.uncertainty,
        }).select().single(),
      );
      return { analysis };
    }
    case "profiles": {
      const profiles = checked(
        await db.from("style_profiles").select("*").eq("user_id", userId).order(
          "created_at",
          { ascending: false },
        ),
      );
      const versions = checked(
        await db.from("style_profile_versions").select("*").eq(
          "user_id",
          userId,
        ).order("version"),
      );
      return {
        profiles: profiles.map((p) => ({
          ...p,
          versions: versions.filter((v) => v.profile_id === p.id),
        })),
      };
    }
    case "save-profile": {
      const projectId = id(body.projectId),
        branch = await ownedBranch(userId, projectId, id(body.branchId));
      const source = normalizeContext(branch.context);
      await validateReferences(userId, projectId, source);
      const profileId = body.profileId
          ? id(body.profileId)
          : crypto.randomUUID(),
        versionId = crypto.randomUUID();
      const guidance = String(body.guidance || "").slice(0, 2000);
      const context: DesignContext = {
        brief: {
          ...source.brief,
          room: "Any room",
          notes: guidance,
          preserve: true,
        },
        profileVersionId: null,
        profileGuidance: "",
        references: body.includeReferences
          ? source.references.filter((r) => r.role !== "layout").map((r) => ({
            ...r,
            scope: "branch",
          }))
          : [],
      };
      checked(
        await db.rpc("design_save_profile", {
          p_user: userId,
          p_id: profileId,
          p_version: versionId,
          p_name: String(body.name || "My style").slice(0, 100),
          p_context: context,
        }),
      );
      return { profileId, versionId };
    }
    case "apply-profile": {
      const projectId = id(body.projectId),
        branch = await ownedBranch(userId, projectId, id(body.branchId));
      const profile = checked(
        await db.from("style_profile_versions").select("*").eq(
          "id",
          id(body.profileVersionId),
        ).eq("user_id", userId).maybeSingle(),
      );
      if (!profile) {
        throw new HttpError(404, "Style profile version not found.");
      }
      const current = normalizeContext(branch.context),
        source = normalizeContext(profile.context);
      const references = body.includeReferences
        ? source.references
        : current.references;
      for (const ref of body.includeReferences ? source.references : []) {
        const asset = checked(
          await db.from("design_assets").select("id").eq("id", ref.assetId).eq(
            "user_id",
            userId,
          ).is("deleted_at", null).maybeSingle(),
        );
        if (!asset) {
          throw new HttpError(
            409,
            "A saved profile reference is no longer available.",
          );
        }
        checked(
          await db.from("design_reference_links").upsert({
            project_id: projectId,
            user_id: userId,
            asset_id: ref.assetId,
            source_profile_version_id: profile.id,
          }),
        );
      }
      const context = normalizeContext({
        ...current,
        epoch: crypto.randomUUID(),
        brief: {
          ...current.brief,
          style: source.brief.style,
          palette: source.brief.palette,
          density: source.brief.density,
        },
        profileGuidance: source.brief.notes,
        profileVersionId: profile.id,
        references,
      });
      const updated = checked(
        await db.from("design_branches").update({
          context,
          context_revision: branch.context_revision + 1,
        }).eq("id", branch.id).eq("context_revision", body.contextRevision)
          .select().maybeSingle(),
      );
      if (!updated) {
        throw new HttpError(
          409,
          "This brief changed in another tab. Reload before applying the profile.",
        );
      }
      return { branch: updated };
    }
    default:
      throw new HttpError(400, "Unknown workspace operation.");
  }
}
export async function handleDesignAPI(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    if (req.method !== "POST") throw new HttpError(405, "Use POST.");
    const user = await requireUser(req);
    if (Number(req.headers.get("content-length")) > 60000) {
      throw new HttpError(413, "The design request is too large.");
    }
    let body;
    try {
      const raw = await req.text();
      if (new TextEncoder().encode(raw).length > 60000) {
        throw new HttpError(413, "The design request is too large.");
      }
      body = JSON.parse(raw);
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(400, "Invalid request.");
    }
    if (!body || typeof body !== "object") {
      throw new HttpError(400, "Invalid request.");
    }
    return Response.json(await dispatch(user.id, body), {
      headers: corsHeaders,
    });
  } catch (error) {
    if (!(error instanceof HttpError)) {
      console.error(
        "Workspace operation failed:",
        error instanceof Error ? error.name : "database/provider",
      );
    }
    return Response.json({
      error: error instanceof HttpError
        ? error.message
        : "The design operation could not be completed. Your saved designs are still available.",
    }, {
      status: error instanceof HttpError ? error.status : 500,
      headers: corsHeaders,
    });
  }
}
if (import.meta.main) Deno.serve(handleDesignAPI);
