import {
  assetBytes,
  checked,
  db,
  ownedProject,
  ownedVersion,
  permittedAsset,
} from "./db.ts";
import { compileContext, normalizeContext } from "./context.ts";
import {
  deleteInteraction,
  generateImage,
  modelCatalog,
  ProviderFailure,
  recoverImage,
} from "./provider.ts";
import { sha256, stableId } from "./images.ts";
import { HttpError } from "../security.ts";

export async function processNextJob() {
  const deletion = checked(
    await db.from("design_provider_states").select("*").not(
      "delete_requested_at",
      "is",
      null,
    ).order("delete_requested_at").limit(1).maybeSingle(),
  );
  if (deletion) {
    try {
      await deleteInteraction(deletion.state.interactionId);
      checked(
        await db.from("design_provider_states").delete().eq(
          "version_id",
          deletion.version_id,
        ).eq("resume_allowed", false),
      );
    } catch {
      /* Retain the deletion request for the next scheduled attempt. */
    }
  }
  const job = checked(await db.rpc("design_claim_job", {}));
  if (!job) return { processed: false };
  let dispatched = false;
  try {
    const project = await ownedProject(job.user_id, job.project_id);
    const version = await ownedVersion(
      job.user_id,
      project.id,
      job.base_version_id,
    );
    const turn = checked(
      await db.from("design_turns").select("*").eq("id", job.turn_id).eq(
        "user_id",
        job.user_id,
      ).single(),
    );
    const context = normalizeContext(turn.context_snapshot);
    const compiled = await compileContext({
      api: turn.manifest?.requestAPI === "generateContent" ||
          turn.manifest?.requestAPI === "interactions"
        ? turn.manifest.requestAPI
        : undefined,
      context,
      projectId: project.id,
      branchId: job.branch_id,
      baseVersionId: version.id,
      originalAssetId: project.original_asset_id,
      baseAssetId: version.asset_id,
      userEdit: turn.user_edit,
      scope: turn.scope,
      operation: turn.operation,
      quality: job.quality,
      model: job.model,
      imageSize: job.image_size,
    });
    const images = [];
    for (const input of compiled.roles) {
      const ref = context.references.some((r) => r.assetId === input.assetId);
      const asset = await permittedAsset(
        job.user_id,
        project.id,
        input.assetId,
        ref,
      );
      const image = await assetBytes(asset);
      images.push({ ...image, label: input.label });
    }
    const previous = checked(
      await db.from("design_provider_states").select("*").eq(
        "version_id",
        version.id,
      ).eq("project_id", project.id).eq("user_id", job.user_id).maybeSingle(),
    );
    dispatched = true;
    let result;
    if (job.error_code === "recover_output" && job.provider_interaction_id) {
      result = {
        ...await recoverImage(job.provider_interaction_id),
        state: null,
      };
    } else {
      result = await generateImage({
        api: compiled.api,
        model: job.model,
        imageSize: job.image_size,
        prompt: compiled.prompt,
        images,
        fingerprint: compiled.fingerprint,
        previous: turn.scope === "branch" && previous?.resume_allowed
          ? previous.state
          : undefined,
        onInteraction: async (interactionId) => {
          checked(
            await db.from("design_jobs").update({
              provider_interaction_id: interactionId,
            }).eq("id", job.id).eq("claim_token", job.claim_token),
          );
        },
      });
    }
    checked(
      await db.from("design_jobs").update({ status: "saving" }).eq("id", job.id)
        .eq("claim_token", job.claim_token),
    );
    const outputs = [];
    for (const [index, image] of result.images.entries()) {
      const assetId = await stableId(`${job.id}:asset:${index}`),
        versionId = await stableId(`${job.id}:version:${index}`);
      const storagePath =
        `${job.user_id}/${job.project_id}/${job.id}/${index}.${image.extension}`;
      checked(
        await db.storage.from("design-results").upload(
          storagePath,
          image.bytes,
          { contentType: image.mimeType, upsert: true },
        ),
      );
      outputs.push({
        asset_id: assetId,
        version_id: versionId,
        storage_path: storagePath,
        mime_type: image.mimeType,
        width: image.width,
        height: image.height,
        byte_size: image.bytes.length,
        content_hash: await sha256(image.bytes),
        returned_model: result.model,
      });
    }
    const ids = checked(
      await db.rpc("design_finish_job", {
        p_job_id: job.id,
        p_claim: job.claim_token,
        p_outputs: outputs,
        p_next_context: compiled.nextContext,
        p_provider_state: result.state,
        p_resume: compiled.resumeAllowed,
      }),
    );
    return { processed: true, status: "succeeded", resultCount: ids.length };
  } catch (error) {
    const known = error instanceof ProviderFailure ||
      error instanceof HttpError;
    const uncertain = error instanceof ProviderFailure
      ? error.uncertain
      : dispatched && !(error instanceof HttpError && error.status < 500);
    const status = uncertain ? "needs_recovery" : "failed";
    checked(
      await db.from("design_jobs").update({
        status,
        error_code: error instanceof ProviderFailure
          ? error.code
          : error instanceof HttpError
          ? "invalid_context"
          : "worker_error",
        error_message: known
          ? error.message
          : uncertain
          ? "The provider may have finished. Recover the output before requesting another generation."
          : "This generation could not be prepared. Your saved versions are unchanged.",
        provider_error: error instanceof ProviderFailure
          ? error.diagnostics
          : null,
        updated_at: new Date().toISOString(),
      }).eq("id", job.id).eq("claim_token", job.claim_token).in("status", [
        "running",
        "saving",
        "needs_recovery",
      ]),
    );
    return { processed: true, status };
  }
}
export async function cacheCapabilities() {
  const models = await modelCatalog();
  const previous = checked(
    await db.from("design_capabilities").select("worker_ready").eq("id", true)
      .maybeSingle(),
  );
  checked(
    await db.from("design_capabilities").upsert({
      id: true,
      models,
      worker_ready: !!previous?.worker_ready,
      checked_at: new Date().toISOString(),
    }),
  );
  return models;
}
