import { corsHeaders } from "../_shared/cors.ts";
import { analysisModelCatalog } from "../_shared/design/provider.ts";
import { sha256 } from "../_shared/design/images.ts";
import { cacheCapabilities, processNextJob } from "../_shared/design/worker.ts";
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

export async function authorizedWorker(req: Request) {
  const expected = Deno.env.get("ROOMSCAPE_WORKER_TOKEN");
  const supplied = req.headers.get("x-roomscape-worker-token");
  if (!expected || !supplied) return false;
  return (await sha256(expected)) === (await sha256(supplied));
}
export async function handleWorker(req: Request): Promise<Response> {
  if (req.method !== "POST" || !await authorizedWorker(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    if (body.operation === "models") {
      return Response.json({
        models: await cacheCapabilities(),
        analysisModels: await analysisModelCatalog(),
        sdk: "@google/genai@2.31.0",
      });
    }
    if (body.operation !== "work") {
      return Response.json({ error: "Unknown operation." }, { status: 400 });
    }
    const work = processNextJob();
    if (typeof EdgeRuntime !== "undefined") {
      EdgeRuntime.waitUntil(work);
      return Response.json({ accepted: true }, { status: 202 });
    }
    return Response.json(await work);
  } catch {
    return Response.json({
      error: "Worker configuration could not be verified.",
    }, { status: 503 });
  }
}
if (import.meta.main) Deno.serve(handleWorker);
