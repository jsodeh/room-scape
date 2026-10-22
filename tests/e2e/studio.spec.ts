import { test, expect, Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const photoPath = join(process.cwd(), "public/images/studio-room.png");
const photo = readFileSync(photoPath);
const clientSource = readFileSync(
  join(process.cwd(), "src/integrations/supabase/client.ts"),
  "utf8",
);
const backend = new URL(
  clientSource.match(/const SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/)![1],
);
const user = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "studio-test@example.test",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: { provider: "email" },
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
};
const expires = Math.floor(Date.now() / 1000) + 36000;
const accessToken = [
  Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url",
  ),
  Buffer.from(
    JSON.stringify({
      sub: user.id,
      aud: "authenticated",
      role: "authenticated",
      exp: expires,
    }),
  ).toString("base64url"),
  "test-only-signature",
].join(".");
const session = {
  access_token: accessToken,
  refresh_token: "test-only-refresh-token",
  token_type: "bearer",
  expires_at: expires,
  expires_in: 36000,
  user,
};
const fixtureProject = (
  id = "room-1",
  title = "Oak apartment",
  status = "completed",
) => ({
  id,
  user_id: user.id,
  title,
  status,
  instructions: "Warm modern living room with natural oak and linen.",
  original_images: ["/images/studio-room.png"],
  staged_images:
    status === "completed" ? ["/images/studio-room.png?design=1"] : [],
  furniture_ids: [],
  created_at: "2026-01-01T12:00:00Z",
  error_message: null,
});

async function mockBackend(
  page: Page,
  options: {
    signedIn?: boolean;
    projects?: ReturnType<typeof fixtureProject>[];
    failProjects?: boolean;
    failGeneration?: boolean;
  } = {},
) {
  const state = {
    projects: options.projects || [],
    generations: [] as Record<string, unknown>[],
    uploads: [] as string[],
    inserts: [] as Record<string, unknown>[],
    failProjects: !!options.failProjects,
  };
  if (options.signedIn)
    await page.addInitScript(
      ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
      {
        key: `sb-${backend.hostname.split(".")[0]}-auth-token`,
        value: session,
      },
    );
  await page.route("https://*.supabase.co/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const json = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    if (url.pathname === "/auth/v1/token") return json(session);
    if (url.pathname === "/auth/v1/user") return json(user);
    if (url.pathname === "/auth/v1/logout") return json({});
    if (url.pathname.startsWith("/storage/v1/object/public/"))
      return route.fulfill({ contentType: "image/png", body: photo });
    if (url.pathname.startsWith("/storage/v1/object/")) {
      state.uploads.push(url.pathname);
      return json({ Key: url.pathname.split("/object/")[1] });
    }
    if (url.pathname === "/rest/v1/staging_projects") {
      if (request.method() === "POST") {
        const body = request.postDataJSON();
        state.inserts.push(body);
        const project = {
          ...fixtureProject("created-room", "My new room", "pending"),
          ...body,
        };
        state.projects.push(project);
        return json(project, 201);
      }
      if (request.method() === "PATCH") return json([]);
      if (state.failProjects)
        return json({ message: "Fixture connection failure" }, 503);
      const id = url.searchParams.get("id")?.replace("eq.", "");
      return json(
        id
          ? state.projects.filter((project) => project.id === id)
          : state.projects,
      );
    }
    if (url.pathname === "/functions/v1/generate-staged-room") {
      const body = request.postDataJSON();
      state.generations.push(body);
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (options.failGeneration)
        return json({ error: "Fixture generation failure" }, 503);
      const index = state.projects.findIndex(
        (project) => project.id === body.projectId,
      );
      const project = {
        ...state.projects[index],
        status: "completed",
        staged_images: [
          `/images/studio-room.png?design=${state.generations.length}`,
        ],
      };
      state.projects[index] = project;
      return json({ success: true, project });
    }
    if (url.pathname.startsWith("/rest/v1/")) return json([]);
    return json({ message: "Unexpected fixture request" }, 404);
  });
  return state;
}
async function uploadRoom(page: Page) {
  await page
    .getByLabel("Upload room photo", { exact: true })
    .setInputFiles(photoPath);
  await expect(
    page.getByAltText("Your original room, ready for staging"),
  ).toBeVisible();
}
async function generateRoom(page: Page) {
  await uploadRoom(page);
  await page
    .getByRole("button", { name: "Generate design", exact: true })
    .first()
    .click();
  await expect(
    page.getByText("Your latest design", { exact: true }),
  ).toBeVisible();
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`${viewport.name}: studio, controls and theme fit the screen`, async ({
    page,
  }) => {
    await mockBackend(page);
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Good rooms. Great possibilities." }),
    ).toBeVisible();
    await expect(
      page.getByText("Inspiration preview", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Coastal", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Coastal", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    const palettes = page.getByRole("button", {
      name: "Coastal calm",
      exact: true,
    });
    await palettes.click();
    const bounds = await palettes.boundingBox();
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.locator("html")).toHaveClass("dark");
    expect(
      await page
        .locator("aside")
        .evaluate((element) => getComputedStyle(element).backgroundColor),
    ).not.toBe("rgb(255, 255, 255)");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("invalid or oversized photos show feedback without uploading", async ({
  page,
}) => {
  const backend = await mockBackend(page);
  await page.goto("/");
  await page.getByLabel("Upload room photo", { exact: true }).setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  });
  await expect(
    page.getByText("Choose a JPG, PNG or WebP room photo.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Upload room photo", { exact: true }).setInputFiles({
    name: "large.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(11 * 1024 * 1024),
  });
  await expect(
    page.getByText("Choose a photo smaller than 10 MB.", { exact: true }),
  ).toBeVisible();
  expect(backend.uploads).toHaveLength(0);
});

test("room and preferences survive sign-in without submitting a generation", async ({
  page,
}) => {
  const backend = await mockBackend(page);
  await page.goto("/");
  await page
    .getByRole("combobox", { name: "Room type", exact: true })
    .selectOption("Bedroom");
  await page.getByRole("button", { name: "Coastal", exact: true }).click();
  await uploadRoom(page);
  await page
    .getByRole("button", { name: "Sign in to generate", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/auth\?next=/);
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("fixture-password-only");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/:4173\/$/);
  await expect(
    page.getByAltText("Your original room, ready for staging"),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Room type", exact: true }),
  ).toHaveValue("Bedroom");
  await expect(
    page.getByRole("button", { name: "Coastal", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(backend.generations).toHaveLength(0);
});

test("generation uploads one normalised room and sends the selected design brief", async ({
  page,
}) => {
  const backend = await mockBackend(page, { signedIn: true });
  await page.goto("/");
  await page
    .getByRole("combobox", { name: "Room type", exact: true })
    .selectOption("Bedroom");
  await page.getByRole("button", { name: "Coastal", exact: true }).click();
  await page.getByRole("button", { name: "Terracotta", exact: true }).click();
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await page.getByText("The finer details", { exact: true }).click();
  await page
    .getByLabel("Anything else in mind?")
    .fill("Add a reading chair near the window.");
  await uploadRoom(page);
  await page
    .getByRole("button", { name: "Generate design", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "A new perspective is taking shape." }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("button", { name: "Creating your design…", exact: true })
      .first(),
  ).toBeDisabled();
  await expect(
    page.getByText("Your latest design", { exact: true }),
  ).toBeVisible();
  expect(backend.uploads).toHaveLength(1);
  expect(backend.uploads[0]).toMatch(/\.jpg$/);
  expect(backend.inserts).toHaveLength(1);
  expect(backend.inserts[0].original_images).toHaveLength(1);
  const brief = backend.generations[0].instructions as string;
  expect(brief).toContain("bedroom");
  expect(brief).toContain("coastal");
  expect(brief).toContain("terracotta");
  expect(brief).toContain("density: light");
  expect(brief).toContain("reading chair");
  expect(brief).toContain("Preserve the existing");
});

test("failed generation preserves the photo and displays a retryable error", async ({
  page,
}) => {
  await mockBackend(page, { signedIn: true, failGeneration: true });
  await page.goto("/");
  await uploadRoom(page);
  await page
    .getByRole("button", { name: "Generate design", exact: true })
    .first()
    .click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "We could not create this design." }),
  ).toBeVisible();
  await expect(
    page.getByAltText("Your original room, ready for staging"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Generate design", exact: true }).first(),
  ).toBeEnabled();
});

test("comparison is keyboard accessible; fullscreen zoom, refinement and download work", async ({
  page,
}) => {
  const backend = await mockBackend(page, { signedIn: true });
  await page.goto("/");
  await generateRoom(page);
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  const slider = page.getByRole("slider", {
    name: "Before and after comparison",
  });
  await slider.focus();
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue("51");
  await page.getByRole("button", { name: "Expand", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(dialog.getByText("125%", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download design", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("roomscape-design-1.png");
  await page.getByRole("button", { name: "Refine", exact: true }).click();
  await page
    .getByLabel("What would you like to change?")
    .fill("Use a lighter sofa.");
  await page
    .getByRole("button", { name: "Apply changes", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Version 2", exact: true }),
  ).toBeVisible();
  expect(backend.generations).toHaveLength(2);
});

test("projects load from the backend, filter, search and open the correct room", async ({
  page,
}) => {
  await mockBackend(page, {
    signedIn: true,
    projects: [
      fixtureProject(),
      fixtureProject("room-2", "Willow bedroom", "processing"),
      fixtureProject("room-3", "Garden office", "failed"),
    ],
  });
  await page.goto("/projects");
  await expect(
    page.getByRole("heading", { name: "Oak apartment", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "In progress", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Willow bedroom", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Oak apartment", exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: /All rooms/ }).click();
  await page
    .getByRole("searchbox", { name: "Search projects" })
    .fill("Oak apartment");
  await expect(
    page.getByRole("heading", { name: "Willow bedroom", exact: true }),
  ).not.toBeVisible();
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", { name: "Oak apartment", exact: true }),
    })
    .click();
  await expect(page).toHaveURL(/\/projects\/room-1$/);
  await expect(
    page.getByRole("heading", { name: "Oak apartment", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Your latest design", { exact: true }),
  ).toBeVisible();
});

test("project request failures show an error rather than a false empty collection", async ({
  page,
}) => {
  const backend = await mockBackend(page, {
    signedIn: true,
    failProjects: true,
  });
  await page.goto("/projects");
  await expect(page.getByRole("alert")).toContainText(
    "Your projects couldn't be loaded.",
  );
  backend.failProjects = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Every great space starts with an idea.",
    }),
  ).toBeVisible();
});

test("missing projects and signed-out project routes resolve without a loading loop", async ({
  page,
}) => {
  await mockBackend(page, { signedIn: true });
  await page.goto("/projects/missing-room");
  await expect(
    page.getByRole("heading", { name: "We couldn't find this room." }),
  ).toBeVisible();
  await page.goto("/profile?tab=projects");
  await expect(page).toHaveURL(/\/projects$/);
});

test("signed-out projects guide users through sign-in and preserve the destination", async ({
  page,
}) => {
  await mockBackend(page);
  await page.goto("/projects");
  await page.getByRole("link", { name: "Sign in to view projects" }).click();
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("fixture-password-only");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(
    page.getByRole("heading", {
      name: "Every great space starts with an idea.",
    }),
  ).toBeVisible();
});
