import { test, expect, Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { EMPTY_CONTEXT } from "../../src/types/design";
const photo = readFileSync("public/images/studio-room.png");
const uid = "00000000-0000-4000-8000-000000000001";
const ids = Array.from(
  { length: 9 },
  (_, i) => `10000000-0000-4000-8000-00000000000${i}`,
);
const user = {
  id: uid,
  email: "workspace@example.test",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
};
const exp = Math.floor(Date.now() / 1000) + 36000;
const token = [
  Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url"),
  Buffer.from(
    JSON.stringify({
      sub: uid,
      exp,
      aud: "authenticated",
      role: "authenticated",
    }),
  ).toString("base64url"),
  "test-only-signature",
].join(".");
const session = {
  user,
  access_token: token,
  refresh_token: "test-only-refresh",
  token_type: "bearer",
  expires_at: exp,
  expires_in: 36000,
};
async function backend(page: Page) {
  const context = structuredClone(EMPTY_CONTEXT);
  context.brief.notes = "Keep the family painting.";
  const root = {
    id: ids[2],
    branch_id: ids[1],
    asset_id: ids[3],
    parent_version_id: null,
    context_snapshot: context,
    label: "Original room",
    state: "accepted",
    model: null,
  };
  const state = {
    project: {
      id: ids[0],
      title: "Oak apartment",
      active_branch_id: ids[1],
      original_asset_id: ids[3],
    },
    branches: [
      {
        id: ids[1],
        name: "Main design",
        head_version_id: ids[4],
        context,
        context_revision: 0,
      },
    ],
    versions: [
      root,
      {
        ...root,
        id: ids[4],
        parent_version_id: ids[2],
        asset_id: ids[5],
        label: "Saved design",
        context_snapshot: { ...context, decisions: ["Use an oak table."] },
        state: "candidate",
        model: "gemini-3-pro-image",
      },
    ],
    assets: [
      { id: ids[3], url: "/images/studio-room.png", mime_type: "image/png" },
      {
        id: ids[5],
        url: "/images/studio-room.png?render=1",
        mime_type: "image/png",
      },
    ],
    analyses: [],
    jobs: [],
    turns: [],
  };
  const calls: {
    action: string;
    input?: { baseVersionId: string; scope: string };
    context?: typeof context;
    versionId?: string;
    profileVersionId?: string;
    includeReferences?: boolean;
  }[] = [];
  await page.addInitScript(
    (value) =>
      localStorage.setItem(
        "sb-fkptdunoizrlkqwdmcyi-auth-token",
        JSON.stringify(value),
      ),
    session,
  );
  await page.route("https://*.supabase.co/**", async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname;
    const json = (value: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(value),
      });
    if (path === "/auth/v1/user") return json(user);
    if (path === "/auth/v1/token") return json(session);
    if (path.startsWith("/storage/v1/object/public/"))
      return route.fulfill({ contentType: "image/png", body: photo });
    if (path.startsWith("/storage/v1/object/")) return json({ Key: path });
    if (path === "/functions/v1/design-api") {
      const body = req.postDataJSON();
      calls.push(body);
      if (body.action === "capabilities")
        return json({
          workerReady: true,
          models: ["quality", "next", "fast"].map((preset) => ({
            preset,
            available: true,
            model: "fixture",
          })),
        });
      if (body.action === "list")
        return json({
          projects: [
            { id: ids[0], title: state.project.title },
            { id: ids[8], title: "Another room" },
          ],
        });
      if (body.action === "history") {
        if (body.projectId === ids[8])
          return json({
            ...state,
            project: { ...state.project, id: ids[8], title: "Another room" },
            branches: [{ ...state.branches[0], context: EMPTY_CONTEXT }],
          });
        return json(state);
      }
      if (body.action === "profiles")
        return json({
          profiles: [
            {
              id: "profile",
              name: "Quiet retreat",
              latest_version_id: "style-v2",
              versions: [1, 2].map((version) => ({
                id: `style-v${version}`,
                version,
                context: {
                  ...EMPTY_CONTEXT,
                  brief: {
                    ...EMPTY_CONTEXT.brief,
                    style: "Quiet modern",
                    notes: "Oak and linen.",
                  },
                  references: [
                    {
                      assetId: ids[6],
                      role: "style",
                      scope: "branch",
                      priority: "primary",
                      accepted: {},
                    },
                  ],
                },
              })),
            },
          ],
        });
      if (body.action === "apply-profile") {
        const branch = state.branches[0];
        branch.context = {
          ...branch.context,
          brief: { ...branch.context.brief, style: "Quiet modern" },
          profileVersionId: body.profileVersionId,
          profileGuidance: "Oak and linen.",
        };
        branch.context_revision++;
        return json({ branch });
      }
      if (body.action === "context") {
        const branch = state.branches.find((b) => b.id === body.branchId)!;
        branch.context = body.context;
        branch.context_revision++;
        return json({ branch });
      }
      if (body.action === "register-reference") {
        const asset = { id: ids[6], url: body.url, mime_type: "image/jpeg" };
        state.assets.push(asset);
        return json({ asset });
      }
      if (body.action === "analyze") {
        const analysis = {
          id: ids[7],
          asset_id: ids[6],
          role: body.role,
          observations: {
            style: ["Quiet modern"],
            mood: ["Calm"],
            materials: [],
            colours: ["Sage green"],
          },
          uncertainty: ["Texture may be linen."],
        };
        state.analyses.push(analysis);
        return json({ analysis });
      }
      if (body.action === "fork") {
        const version = state.versions.find((v) => v.id === body.versionId)!;
        const branch = {
          id: ids[7],
          name: body.name,
          head_version_id: version.id,
          context: version.context_snapshot,
          context_revision: 0,
        };
        state.branches.push(branch);
        return json({ branch });
      }
      if (body.action === "submit") return json({ job: { id: "job" } });
      return json({});
    }
    return json([]);
  });
  return { state, calls };
}
test("refinement submits the selected current render and remembers the correct scope", async ({
  page,
}) => {
  const mock = await backend(page);
  await page.goto(`/?project=${ids[0]}`);
  await page
    .getByRole("textbox", { name: "Next edit" })
    .fill("Replace only the sofa.");
  await page
    .getByRole("combobox", { name: "Edit duration" })
    .selectOption("turn");
  await page
    .getByRole("button", { name: "Generate design", exact: true })
    .click();
  await expect
    .poll(
      () => mock.calls.find((c) => c.action === "submit")?.input.baseVersionId,
    )
    .toBe(ids[4]);
  expect(mock.calls.find((c) => c.action === "submit")?.input.scope).toBe(
    "turn",
  );
});
test("analysing a reference preserves notes and requires explicit acceptance", async ({
  page,
}) => {
  const mock = await backend(page);
  await page.goto(`/?project=${ids[0]}`);
  await page
    .getByLabel("Add reference photograph", { exact: true })
    .setInputFiles("public/images/studio-room.png");
  await page.getByRole("button", { name: "Analyse this purpose" }).click();
  await expect(page.getByLabel("Room instructions")).toHaveValue(
    "Keep the family painting.",
  );
  await expect(
    page.getByRole("checkbox", { name: "Quiet modern" }),
  ).not.toBeChecked();
  await page.getByRole("checkbox", { name: "Quiet modern" }).check();
  await page.getByRole("button", { name: "Save design brief" }).click();
  await expect
    .poll(
      () =>
        mock.calls.find((c) => c.action === "context")?.context.references[0]
          .accepted.style,
    )
    .toEqual(["Quiet modern"]);
  await page.getByRole("button", { name: "Remove reference 1" }).click();
  await page.getByRole("button", { name: "Save design brief" }).click();
  await expect
    .poll(
      () =>
        mock.calls.filter((c) => c.action === "context").at(-1)?.context
          .references.length,
    )
    .toBe(0);
});
test("an older version must be forked and uses its own saved context", async ({
  page,
}) => {
  const mock = await backend(page);
  await page.goto(`/?project=${ids[0]}`);
  await page.getByRole("button", { name: "View Original room" }).click();
  await expect(
    page.getByRole("button", { name: "Generate design", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Explore from this version" }).click();
  await page.getByLabel("Direction name").fill("From the original");
  await page
    .getByRole("button", { name: "Create direction", exact: true })
    .click();
  await expect
    .poll(() => mock.calls.find((c) => c.action === "fork")?.versionId)
    .toBe(ids[2]);
  await expect(
    page.getByRole("combobox", { name: "Design direction" }),
  ).toHaveValue(ids[7]);
  await page.getByLabel("Next edit").fill("Add a blue rug.");
  await page
    .getByRole("button", { name: "Generate design", exact: true })
    .click();
  await expect
    .poll(
      () => mock.calls.find((c) => c.action === "submit")?.input.baseVersionId,
    )
    .toBe(ids[2]);
});
test("changing projects resets the draft and refresh restores the saved brief", async ({
  page,
}) => {
  await backend(page);
  await page.goto(`/?project=${ids[0]}`);
  await page.getByLabel("Room instructions").fill("Unsaved private draft");
  await page
    .getByRole("combobox", { name: "Current project" })
    .selectOption(ids[8]);
  await expect(page.getByLabel("Room instructions")).toHaveValue("");
  await page
    .getByRole("combobox", { name: "Current project" })
    .selectOption(ids[0]);
  await expect(page.getByLabel("Room instructions")).toHaveValue(
    "Keep the family painting.",
  );
  await page.reload();
  await expect(page.getByLabel("Room instructions")).toHaveValue(
    "Keep the family painting.",
  );
});
test("mobile workspace fits the viewport and supports version selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await backend(page);
  await page.goto(`/?project=${ids[0]}`);
  await expect(
    page.getByRole("button", { name: "View Saved design" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("saved style reuse pins the selected version and requires opt-in reference replacement", async ({
  page,
}) => {
  const mock = await backend(page);
  await page.goto(`/?project=${ids[0]}`);
  await page
    .getByRole("combobox", { name: "Saved style version" })
    .selectOption("style-v1");
  await expect(
    page.getByRole("checkbox", { name: /Replace this direction/ }),
  ).not.toBeChecked();
  await page.getByRole("button", { name: "Apply selected version" }).click();
  await expect
    .poll(
      () =>
        mock.calls.find((c) => c.action === "apply-profile")?.profileVersionId,
    )
    .toBe("style-v1");
  expect(
    mock.calls.find((c) => c.action === "apply-profile")?.includeReferences,
  ).toBe(false);
  await expect(page.getByLabel("Room instructions")).toHaveValue(
    "Keep the family painting.",
  );
  await expect(
    page.getByRole("textbox", { name: "Style", exact: true }),
  ).toHaveValue("Quiet modern");
});
