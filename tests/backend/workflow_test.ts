import {
  canonical,
  compileContext,
  normalizeContext,
} from "../../supabase/functions/_shared/design/context.ts";
import { EMPTY_CONTEXT } from "../../supabase/functions/_shared/design/contracts.ts";
import type { DesignContext } from "../../supabase/functions/_shared/design/contracts.ts";
import {
  deleteInteraction,
  extractImages,
  generateImage,
  ProviderFailure,
  recoverImage,
} from "../../supabase/functions/_shared/design/provider.ts";
import { decodeImage } from "../../supabase/functions/_shared/design/images.ts";
const ids = Array.from(
  { length: 8 },
  (_, i) => `00000000-0000-4000-8000-00000000000${i}`,
);
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=";
const assert = (value: unknown, text = "Assertion failed") => {
  if (!value) throw new Error(text);
};
const equal = (a: unknown, b: unknown) =>
  assert(
    canonical(a) === canonical(b),
    `Expected ${canonical(b)}, received ${canonical(a)}`,
  );
async function rejects(fn: () => unknown) {
  try {
    await fn();
  } catch {
    return;
  }
  throw new Error("Expected rejection");
}
const context = (): DesignContext => structuredClone(EMPTY_CONTEXT);
const compile = (c: DesignContext, extra = {}) =>
  compileContext({
    context: c,
    projectId: ids[0],
    branchId: ids[1],
    baseVersionId: ids[2],
    originalAssetId: ids[3],
    baseAssetId: ids[4],
    userEdit: "Use a cream sofa; keep the oak table.",
    scope: "branch",
    operation: "refine",
    quality: "quality",
    model: "gemini-3-pro-image",
    imageSize: "2K",
    ...extra,
  });
Deno.test("compiler separates canvas, architecture, project notes and role-specific photographs", async () => {
  const c = context();
  c.brief.notes = "Keep the family painting.";
  c.references = [{
    assetId: ids[5],
    role: "palette",
    priority: "primary",
    scope: "branch",
    accepted: { colours: ["Muted sage"] },
  }];
  const result = await compile(c);
  assert(
    result.roles[0].assetId === ids[4] && result.roles[1].assetId === ids[3],
  );
  assert(
    result.roles[2].label.includes("palette") &&
      result.prompt.includes("Muted sage"),
  );
  assert(result.prompt.includes(c.brief.notes));
  equal(c.brief.notes, "Keep the family painting.");
  await rejects(() =>
    compile({ ...c, references: [{ ...c.references[0], assetId: ids[4] }] })
  );
});
Deno.test("invalid role attributes, contradictory primaries and duplicate photographs fail before inference", async () => {
  const ref = {
    assetId: ids[5],
    role: "palette" as const,
    priority: "primary" as const,
    scope: "branch" as const,
    accepted: {},
  };
  await rejects(() =>
    normalizeContext({
      ...context(),
      references: [{ ...ref, accepted: { furniture: ["chair"] } }],
    })
  );
  await rejects(() =>
    normalizeContext({ ...context(), references: [ref, ref] })
  );
  await rejects(() =>
    normalizeContext({
      ...context(),
      references: [ref, { ...ref, assetId: ids[6] }],
    })
  );
});
Deno.test("specific materials override generic style materials", async () => {
  const c = context();
  c.references = [{
    assetId: ids[5],
    role: "style",
    priority: "primary",
    scope: "branch",
    accepted: { materials: ["steel"], style: ["modern"] },
  }, {
    assetId: ids[6],
    role: "materials",
    priority: "primary",
    scope: "branch",
    accepted: { materials: ["oak"] },
  }];
  const result = await compile(c);
  assert(!result.prompt.includes("steel") && result.prompt.includes("oak"));
});
Deno.test("one-off photographs and instructions expire without reusable provider history", async () => {
  const c = context();
  c.references = [{
    assetId: ids[5],
    role: "style",
    priority: "primary",
    scope: "turn",
    accepted: {},
  }];
  const result = await compile(c);
  assert(!result.resumeAllowed && result.nextContext.references.length === 0);
  const once = await compile(context(), { scope: "turn" });
  equal(once.nextContext.decisions, []);
  assert(!once.resumeAllowed);
});
Deno.test("portable branch instructions survive resets without resetting compatible ongoing turns", async () => {
  const first = await compile(context());
  equal(first.nextContext.decisions, ["Use a cream sofa; keep the oak table."]);
  const second = await compile(first.nextContext, { userEdit: "Add a rug." });
  equal(first.fingerprint, second.fingerprint);
  assert(second.prompt.includes("keep the oak table"));
  equal(second.nextContext.decisions?.length, 2);
  assert(
    (await compile({ ...first.nextContext, epoch: ids[7] })).fingerprint !==
      first.fingerprint,
  );
  assert(
    (await compile(context(), { branchId: ids[7] })).fingerprint !==
      first.fingerprint,
  );
});
Deno.test("actual MIME validation excludes thought images and rejects mismatched content", async () => {
  const result = extractImages({
    candidates: [{
      content: {
        parts: [{
          thought: true,
          inlineData: { data: "bad", mimeType: "image/png" },
        }, { inlineData: { data: png, mimeType: "image/png" } }],
      },
    }],
  });
  equal(result[0].extension, "png");
  equal(result[0].width, 1);
  await rejects(() => decodeImage(png, "image/jpeg"));
  await rejects(() =>
    extractImages({ output_image: { data: "bad", mime_type: "image/png" } })
  );
});
const originalFetch = globalThis.fetch;
Deno.test("blocked responses and quota errors fail without a substituted model", async () => {
  await rejects(() =>
    extractImages({ candidates: [{ finishReason: "SAFETY" }] })
  );
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({ error: { code: 429, message: "Quota exceeded" } }, {
      status: 429,
    });
  };
  try {
    try {
      await generateImage(args);
      throw new Error("Expected quota rejection");
    } catch (error) {
      assert(
        error instanceof ProviderFailure && error.code === "provider_quota" &&
          !error.uncertain,
      );
    }
    equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
Deno.test("recovery only retrieves an existing result; deletion is idempotent", async () => {
  const methods: string[] = [];
  globalThis.fetch = async (input, init) => {
    const req = new Request(input, init);
    methods.push(req.method);
    return req.method === "GET"
      ? response()
      : Response.json({ error: { message: "Not found" } }, { status: 404 });
  };
  try {
    assert((await recoverImage("existing-result")).images.length === 1);
    await deleteInteraction("existing-result");
    equal(methods, ["GET", "DELETE"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
Deno.env.set("GEMINI_API_KEY", "test-only-key");
const response = () =>
  Response.json({
    id: "interaction-new",
    status: "completed",
    model: "gemini-3-pro-image",
    output_image: { data: png, mime_type: "image/png" },
  });
const args = {
  model: "gemini-3-pro-image",
  imageSize: "2K" as const,
  prompt: "Edit only the sofa.",
  images: [{
    bytes: decodeImage(png).bytes,
    mimeType: "image/png",
    label: "EDIT_CANVAS",
  }],
  fingerprint: "context-one",
};
Deno.test("SDK emits response_format, ordered labels and a compatible previous interaction ID", async () => {
  const bodies: {
    previous_interaction_id?: string;
    response_format?: unknown;
    input: { text?: string; mime_type?: string }[];
  }[] = [];
  globalThis.fetch = async (url, init) => {
    const req = new Request(url, init);
    if (req.method === "GET") {
      return Response.json({ id: "old", status: "completed" });
    }
    bodies.push(await req.json());
    return response();
  };
  try {
    const result = await generateImage({
      ...args,
      previous: {
        interactionId: "old",
        fingerprint: args.fingerprint,
        model: args.model,
        turns: 1,
      },
    });
    equal(bodies[0].previous_interaction_id, "old");
    equal(bodies[0].response_format, {
      type: "image",
      image_size: "2K",
      mime_type: "image/jpeg",
      delivery: "inline",
    });
    assert(!("response_modalities" in bodies[0]));
    equal(bodies[0].input[1].text, "EDIT_CANVAS");
    equal(bodies[0].input[2].mime_type, "image/png");
    equal(result.state?.turns, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
Deno.test("expired history, changed context and turn limit create fresh interactions", async () => {
  for (const kind of ["expired", "changed", "limit"]) {
    let body: { previous_interaction_id?: string };
    globalThis.fetch = async (url, init) => {
      const req = new Request(url, init);
      if (req.method === "GET") {
        return Response.json({ error: { message: "expired" } }, {
          status: 404,
        });
      }
      body = await req.json();
      return response();
    };
    try {
      await generateImage({
        ...args,
        previous: {
          interactionId: "old",
          fingerprint: kind === "changed" ? "other" : args.fingerprint,
          model: args.model,
          turns: kind === "limit" ? 8 : 2,
        },
      });
      assert(!body.previous_interaction_id);
    } finally {
      globalThis.fetch = originalFetch;
    }
  }
});
Deno.test("uncertain provider failures are never automatically retried", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new TypeError("connection interrupted");
  };
  try {
    try {
      await generateImage(args);
      throw new Error("Expected failure");
    } catch (e) {
      assert(e instanceof ProviderFailure && e.uncertain);
    }
    equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
Deno.env.set("SUPABASE_URL", "https://fkptdunoizrlkqwdmcyi.supabase.co");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-only-service-key");
const { handleDesignAPI } = await import(
  "../../supabase/functions/design-api/index.ts"
);
Deno.test("anonymous requests and foreign projects cannot reach image providers", async () => {
  globalThis.fetch = async (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname === "/auth/v1/user") return Response.json({ id: ids[0] });
    if (url.pathname === "/rest/v1/staging_projects") {
      equal(url.searchParams.get("user_id"), `eq.${ids[0]}`);
      return Response.json(null);
    }
    throw new Error("Unexpected provider access");
  };
  try {
    equal(
      (await handleDesignAPI(
        new Request("https://example.test", { method: "POST", body: "{}" }),
      )).status,
      401,
    );
    equal(
      (await handleDesignAPI(
        new Request("https://example.test", {
          method: "POST",
          headers: { authorization: "Bearer test-session" },
          body: JSON.stringify({ action: "history", projectId: ids[1] }),
        }),
      )).status,
      404,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
