import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { HttpError } from "../security.ts";
import { inspectImage, sha256 } from "./images.ts";
export const db = createClient(
  Deno.env.get("SUPABASE_URL") || "http://invalid",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "unconfigured",
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => globalThis.fetch(input, init) },
  },
);
export function checked<T>(result: { data: T; error: unknown }): T {
  if (result.error) {
    const conflict = ["23505", "40001"].includes(
      (result.error as { code?: string }).code,
    );
    throw new HttpError(
      conflict ? 409 : 500,
      conflict
        ? "The editing base, brief or active job changed. Reload this branch or create a new direction."
        : "The design workspace could not be saved.",
    );
  }
  return result.data;
}
export async function ownedProject(userId: string, projectId: string) {
  const data = checked(
    await db.from("staging_projects").select("*").eq("id", projectId).eq(
      "user_id",
      userId,
    ).maybeSingle(),
  );
  if (!data) throw new HttpError(404, "Project not found.");
  return data;
}
export async function ownedBranch(
  userId: string,
  projectId: string,
  branchId: string,
) {
  const data = checked(
    await db.from("design_branches").select("*").eq("id", branchId).eq(
      "project_id",
      projectId,
    ).eq("user_id", userId).maybeSingle(),
  );
  if (!data) throw new HttpError(404, "Design direction not found.");
  return data;
}
export async function ownedVersion(
  userId: string,
  projectId: string,
  versionId: string,
) {
  const data = checked(
    await db.from("design_versions").select("*").eq("id", versionId).eq(
      "project_id",
      projectId,
    ).eq("user_id", userId).maybeSingle(),
  );
  if (!data || data.state === "rejected") {
    throw new HttpError(404, "The selected design is not available.");
  }
  return data;
}
export async function permittedAsset(
  userId: string,
  projectId: string,
  assetId: string,
  reference = false,
) {
  const asset = checked(
    await db.from("design_assets").select("*").eq("id", assetId).eq(
      "user_id",
      userId,
    ).is("deleted_at", null).maybeSingle(),
  );
  if (!asset) {
    throw new HttpError(404, "An attached image is no longer available.");
  }
  if (asset.project_id !== projectId) {
    const link = reference
      ? checked(
        await db.from("design_reference_links").select("asset_id").eq(
          "asset_id",
          assetId,
        ).eq("project_id", projectId).eq("user_id", userId).maybeSingle(),
      )
      : null;
    if (!link) {
      throw new HttpError(
        403,
        "This image is not attached to the current project.",
      );
    }
  }
  return asset;
}
export function assetURL(asset: { bucket: string; storage_path: string }) {
  return db.storage.from(asset.bucket).getPublicUrl(asset.storage_path).data
    .publicUrl;
}
export async function assetBytes(
  asset: {
    byte_size: number;
    bucket: string;
    storage_path: string;
    mime_type: string;
    content_hash: string;
  },
  max = 20 * 1024 * 1024,
) {
  if (asset.byte_size > max) {
    throw new HttpError(
      413,
      "This image is too large as an editing input. Use a smaller version.",
    );
  }
  const blob = checked(
    await db.storage.from(asset.bucket).download(asset.storage_path),
  );
  if (blob.size > max) {
    throw new HttpError(413, "This image exceeds the input limit.");
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const info = inspectImage(bytes);
  if (
    info.mimeType !== asset.mime_type ||
    await sha256(bytes) !== asset.content_hash
  ) {
    throw new HttpError(
      409,
      "An image changed after it was saved. Upload it as a new reference.",
    );
  }
  return { bytes, mimeType: info.mimeType };
}
