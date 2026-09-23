import { test, expect, webkit } from "@playwright/test";
test("twenty generation cycles and cancellation cannot expose a stale download", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/gridfinity-bin-generator/");
  const width = page.getByRole("spinbutton", {
    name: "Width · X",
    exact: true,
  });
  for (let i = 0; i < 20; i++) {
    await width.fill(String((i % 2) + 1));
    await expect(
      page.getByRole("button", { name: "Download STL", exact: true }),
    ).toBeEnabled({ timeout: 20000 });
    await expect(page.locator(".dimension-strip")).toContainText(
      i % 2 ? "83.5" : "41.5",
    );
  }
  await width.fill("8");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Download STL", exact: true }),
  ).toBeDisabled();
  await width.fill("1");
  await expect(
    page.getByRole("button", { name: "Download STL", exact: true }),
  ).toBeEnabled({ timeout: 20000 });
  await expect(page.locator(".dimension-strip")).toContainText("41.5");
  await expect(page.locator(".canvas-host canvas")).toBeVisible();
  expect(errors).toEqual([]);
});
test("drawer cells stay square; rotation and duplicate remain usable on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/gridfinity-drawer-planner/");
  const rect = await page.locator(".drawer-board").boundingBox();
  expect(rect).toBeTruthy();
  expect(rect!.width / 6).toBeCloseTo(rect!.height / 9, 0);
  await page.getByRole("button", { name: /Select bin 1,/ }).click();
  await page.getByRole("button", { name: "Rotate", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Select bin 1,/ }),
  ).toHaveAccessibleName(/3 by 2/);
  await page.getByRole("button", { name: "Undo layout change" }).click();
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Select bin 4,/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("WebKit can generate STL and render a model", async () => {
  test.skip(
    !!process.env.CI,
    "Local macOS WebKit smoke check; CI runs Chromium.",
  );
  const browser = await webkit.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:3000/gridfinity-bin-generator/");
    await expect(
      page.getByRole("button", { name: "Download STL", exact: true }),
    ).toBeEnabled({ timeout: 60000 });
    await expect(page.locator(".dimension-strip")).toContainText("83.5");
    await expect(page.locator(".canvas-host canvas")).toBeVisible();
    await page.screenshot({ path: "artifacts/webkit-bin.png", fullPage: true });
    expect(errors).toEqual([]);
  } finally {
    await browser.close();
  }
});
