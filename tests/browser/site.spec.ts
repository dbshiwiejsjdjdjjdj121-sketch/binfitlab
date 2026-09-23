import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { unzipSync, strFromU8 } from "fflate";
import { inspectStl } from "../../src/core/mesh";
const paths = [
  "/",
  "/gridfinity-bin-generator/",
  "/gridfinity-baseplate-generator/",
  "/gridfinity-drawer-planner/",
  "/gridfinity-dimensions/",
  "/guides/print-and-fit-test/",
  "/compatibility/",
  "/about/",
  "/privacy/",
];
test("all nine pages are static, have unique metadata, and match the release indexing policy", async ({
  request,
}) => {
  const titles = new Set<string>();
  for (const path of paths) {
    const r = await request.get(path);
    expect(r.status()).toBe(200);
    const html = await r.text();
    expect(html).toContain(
      process.env.PUBLIC_RELEASE_TEST === "true"
        ? "index,follow"
        : "noindex,nofollow",
    );
    expect(html).toContain(`href="https://binfitlab.com${path}"`);
    expect(html).toContain("application/ld+json");
    expect(html).toMatch(/<h1/);
    const title = html.match(/<title[^>]*>(.*?)<\/title>/)?.[1];
    expect(title).toBeTruthy();
    expect(titles.has(title!)).toBe(false);
    titles.add(title!);
  }
  const robots = await (await request.get("/robots.txt")).text();
  const sitemap = await (await request.get("/sitemap.xml")).text();
  if (process.env.PUBLIC_RELEASE_TEST === "true") {
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Sitemap: https://binfitlab.com/sitemap.xml");
    for (const path of paths)
      expect(sitemap).toContain(`<loc>https://binfitlab.com${path}</loc>`);
    expect((sitemap.match(/<loc>/g) || []).length).toBe(9);
  } else {
    expect(robots).toContain("Disallow: /");
    expect(sitemap).not.toContain("<loc>");
  }
  expect((await request.get("/nonexistent/")).status()).toBe(404);
});
test("browser generates a checked STL; parameter changes invalidate old exports", async ({
  page,
}) => {
  const errors: string[] = [];
  const engineRequests = new Set<string>();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/engine/")) engineRequests.add(url.href);
  });
  await page.goto("/gridfinity-bin-generator/");
  const downloadButton = page.getByRole("button", {
    name: "Download STL",
    exact: true,
  });
  await expect(downloadButton).toBeEnabled({ timeout: 60000 });
  await expect(page.locator(".dimension-strip")).toContainText("83.5");
  await expect(page.locator(".dimension-strip")).toContainText("24.55");
  const downloadEvent = page.waitForEvent("download");
  await downloadButton.click();
  const file = await downloadEvent;
  const report = inspectStl(readFileSync((await file.path())!));
  expect(report.valid).toBe(true);
  expect(report.size[1]).toBeCloseTo(125.5, 2);
  const engineUrls = [...engineRequests].map((url) => new URL(url));
  expect(engineUrls.some((url) => url.pathname.endsWith("openscad.js"))).toBe(
    true,
  );
  expect(engineUrls.some((url) => url.pathname.endsWith("openscad.wasm"))).toBe(
    true,
  );
  expect(
    engineUrls.every((url) => url.pathname.startsWith("/engine/revisions/")),
  ).toBe(true);
  expect(
    new Set(engineUrls.map((url) => url.pathname.split("/")[3])).size,
  ).toBe(1);
  await page
    .getByRole("spinbutton", { name: "Width · X", exact: true })
    .fill("1");
  await expect(
    page.getByRole("button", { name: /Download STL|STL ready/ }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Download STL", exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  await expect(page.locator(".dimension-strip")).toContainText("41.5");
  await page
    .getByRole("spinbutton", { name: "Width · X", exact: true })
    .fill("0");
  await expect(
    page.getByRole("button", { name: "Download STL", exact: true }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
test("large baseplate ZIP is deduplicated and includes assembly and measured reports", async ({
  page,
}) => {
  await page.goto("/gridfinity-baseplate-generator/");
  await expect(
    page.getByRole("button", { name: "Download P1 STL" }),
  ).toBeEnabled({ timeout: 60000 });
  await expect(page.getByRole("button", { name: /Preview tile/ })).toHaveCount(
    4,
  );
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download all tiles + guide" })
    .click();
  const d = await downloaded,
    files = unzipSync(readFileSync((await d.path())!));
  expect(files["assembly.svg"]).toBeDefined();
  expect(files["print-guide.html"]).toBeDefined();
  const manifest = JSON.parse(strFromU8(files["manifest.json"]));
  expect(manifest.tiles).toHaveLength(4);
  expect(manifest.models).toHaveLength(4);
  for (const m of manifest.models) {
    expect(inspectStl(files[m.file]).valid).toBe(true);
    expect(m.report.size[0]).toBeLessThanOrEqual(210.01);
  }
});
test("drawer layout persists, supports undo, blocks overlap, imports safely and exports a complete kit", async ({
  page,
}) => {
  await page.goto("/gridfinity-drawer-planner/");
  await page.getByRole("button", { name: /Select bin 1,/ }).click();
  await page.getByRole("spinbutton", { name: "Grid position X" }).fill("2");
  await expect(page.getByRole("alert")).toContainText("overlap");
  await expect(
    page.getByRole("button", { name: "Export print kit" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Undo layout change" }).click();
  await expect(
    page.getByRole("button", { name: "Export print kit" }),
  ).toBeEnabled();
  await page
    .getByRole("textbox", { name: "Project name" })
    .fill("Workshop test");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Project name" })).toHaveValue(
    "Workshop test",
  );
  const fileEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export print kit" }).click();
  const file = await fileEvent,
    files = unzipSync(readFileSync((await file.path())!));
  expect(files["project.gridfit.json"]).toBeDefined();
  const manifest = JSON.parse(strFromU8(files["manifest.json"]));
  expect(manifest.bins).toHaveLength(3);
  expect(manifest.heightCheck).toMatch(/Not checked/);
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"schemaVersion":9}'),
  });
  await expect(
    page.getByRole("status").filter({ hasText: "Could not import" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Project name" })).toHaveValue(
    "Workshop test",
  );
});
test("tool works at mobile width and site never sends models off-origin", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const offOrigin: string[] = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:3000") &&
      !r.url().startsWith("data:")
    )
      offOrigin.push(r.url());
  });
  await page.goto("/gridfinity-bin-generator/");
  await expect(
    page.getByRole("button", { name: "Download STL", exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "artifacts/mobile-bin.png", fullPage: true });
  expect(offOrigin).toEqual([]);
});
test("capture desktop views and verify no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const [path, name] of [
    ["/", "home"],
    ["/gridfinity-bin-generator/", "bin"],
    ["/gridfinity-drawer-planner/", "drawer"],
  ]) {
    await page.goto(path);
    if (name === "bin")
      await expect(
        page.getByRole("button", { name: "Download STL", exact: true }),
      ).toBeEnabled({ timeout: 60000 });
    if (name === "drawer")
      await expect(
        page.getByRole("button", { name: /Select bin 1,/ }),
      ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `artifacts/${name}.png`, fullPage: true });
  }
});
