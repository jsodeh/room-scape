import { EMPTY_CONTEXT } from "../../supabase/functions/_shared/design/contracts.ts";
import {
  decodeImage,
  sha256,
} from "../../supabase/functions/_shared/design/images.ts";
Deno.env.set("SUPABASE_URL", "https://fkptdunoizrlkqwdmcyi.supabase.co");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-only-service-key");
Deno.env.set("GEMINI_API_KEY", "test-only-key");
const { processNextJob } = await import(
  "../../supabase/functions/_shared/design/worker.ts"
);
const assert = (value: unknown) => {
  if (!value) throw new Error("Assertion failed");
};
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=";
const image = decodeImage(png);
const originalFetch = globalThis.fetch;
Deno.test("storage failure after inference preserves the provider ID and requires recovery", async () => {
  const job = {
    id: "job",
    user_id: "user",
    project_id: "project",
    branch_id: "branch",
    base_version_id: "version",
    turn_id: "turn",
    claim_token: "claim",
    model: "gemini-3-pro-image",
    quality: "quality",
    image_size: "2K",
  };
  const patches: { status?: string; provider_interaction_id?: string }[] = [];
  const hash = await sha256(image.bytes);
  let generations = 0;
  globalThis.fetch = async (input, init) => {
    const req = new Request(input, init),
      url = new URL(req.url),
      path = url.pathname;
    if (path === "/rest/v1/rpc/design_claim_job") return Response.json(job);
    if (path === "/rest/v1/design_provider_states") return Response.json(null);
    if (path === "/rest/v1/staging_projects") {
      return Response.json({
        id: "project",
        user_id: "user",
        original_asset_id: "asset",
      });
    }
    if (path === "/rest/v1/design_versions") {
      return Response.json({
        id: "version",
        project_id: "project",
        user_id: "user",
        asset_id: "asset",
        state: "accepted",
      });
    }
    if (path === "/rest/v1/design_turns") {
      return Response.json({
        user_edit: "Add an oak table.",
        operation: "generate",
        scope: "branch",
        context_snapshot: EMPTY_CONTEXT,
      });
    }
    if (path === "/rest/v1/design_assets") {
      return Response.json({
        id: "asset",
        project_id: "project",
        user_id: "user",
        bucket: "room-images",
        storage_path: "user/test.png",
        mime_type: "image/png",
        byte_size: image.bytes.length,
        content_hash: hash,
      });
    }
    if (path === "/rest/v1/design_jobs") {
      patches.push(await req.json());
      return new Response(null, { status: 204 });
    }
    if (path.startsWith("/storage/v1/object/") && req.method === "GET") {
      return new Response(image.bytes.slice().buffer, {
        headers: { "content-type": "image/png" },
      });
    }
    if (path.startsWith("/storage/v1/object/") && req.method === "POST") {
      return Response.json({
        statusCode: "500",
        error: "Storage unavailable",
        message: "Storage unavailable",
      }, { status: 500 });
    }
    if (url.hostname === "generativelanguage.googleapis.com") {
      generations++;
      return Response.json({
        id: "saved-provider-result",
        status: "completed",
        model: job.model,
        output_image: { data: png, mime_type: "image/png" },
      });
    }
    throw new Error("Unexpected network request: " + path);
  };
  try {
    const result = await processNextJob();
    assert(result.status === "needs_recovery");
    assert(generations === 1);
    assert(
      patches.some((p) =>
        p.provider_interaction_id === "saved-provider-result"
      ),
    );
    assert(patches.at(-1)?.status === "needs_recovery");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
