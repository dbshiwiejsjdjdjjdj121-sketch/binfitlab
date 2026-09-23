import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";

test("optional help and feedback show current settings without uploading a design", async ({
  page,
}) => {
  const offOrigin: string[] = [];
  page.on("request", (request) => {
    if (
      !request.url().startsWith("http://127.0.0.1:3000") &&
      !request.url().startsWith("data:")
    )
      offOrigin.push(request.url());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/gridfinity-bin-generator/");
  await expect(
    page.getByRole("button", { name: "Download STL", exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  for (const selector of [".quick-guide", ".export-checks", ".tool-feedback"])
    await expect(page.locator(selector)).not.toHaveAttribute("open", "");
  await page.getByText("New here? 3 quick steps", { exact: true }).click();
  await expect(page.locator(".quick-guide li")).toHaveCount(3);
  await page.locator(".export-checks summary").click();
  await expect(page.locator(".export-checks")).toContainText("83.50 × 125.50");
  await expect(page.locator(".export-checks")).toContainText(
    "Fits the entered bed",
  );
  await page
    .getByText("Report a problem or share a print", { exact: true })
    .click();
  await page.getByLabel("Feedback type").selectOption("Successful print");
  const mail = page.getByRole("link", { name: "Open email draft" });
  const href = decodeURIComponent((await mail.getAttribute("href"))!);
  expect(href).toContain("mailto:yiwangyuai@gmail.com?");
  expect(href).toContain("Successful print");
  expect(href).toContain('"nx":2');
  const saved = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save diagnostic file" }).click();
  const report = JSON.parse(
    readFileSync((await (await saved).path())!, "utf8"),
  );
  expect(report.context.mesh.valid).toBe(true);
  expect(report.context.settings.nx).toBe(2);
  expect(report.physicalValidation).toBe("pending");
  await page
    .getByRole("spinbutton", { name: "Width · X", exact: true })
    .fill("0");
  await expect(page.locator(".export-checks summary")).toHaveText(
    "Review settings before downloading",
  );
  const invalidSaved = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save diagnostic file" }).click();
  const invalid = JSON.parse(
    readFileSync((await (await invalidSaved).path())!, "utf8"),
  );
  expect(invalid.context.settings.nx).toBe(0);
  expect(invalid.context.mesh).toBeNull();
  expect(invalid.context.bedFits).toBeNull();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations.map((v) => v.id)).toEqual([]);
  expect(offOrigin).toEqual([]);
  await page.screenshot({
    path: "artifacts/support-mobile.png",
    fullPage: true,
  });
});

test("drawer export evidence is invalidated by edits and failed exports never claim success", async ({
  page,
}) => {
  await page.goto("/gridfinity-drawer-planner/");
  await expect(
    page.getByRole("button", { name: /Select bin 1,/ }),
  ).toBeVisible();
  await page.locator(".export-checks summary").click();
  await expect(page.locator(".export-checks")).toContainText(
    "Not checked — add your drawer's clear height",
  );
  await page
    .getByRole("spinbutton", { name: "Clear height (optional)" })
    .fill("60");
  const saved = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export print kit" }).click();
  await saved;
  await expect(page.locator(".export-checks summary")).toHaveText(
    /\d+ models checked/,
  );
  await expect(page.locator(".layout-metrics")).toContainText("30.45 mm spare");
  await page
    .getByText("Report a problem or share a print", { exact: true })
    .click();
  const diagnosticSaved = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save diagnostic file" }).click();
  const diagnostic = JSON.parse(
    readFileSync((await (await diagnosticSaved).path())!, "utf8"),
  );
  expect(diagnostic.context.exportChecks.modelCount).toBeGreaterThan(0);
  expect(diagnostic.context.project.name).toBe("Feedback layout");
  await page
    .getByRole("spinbutton", { name: "Clear height (optional)" })
    .fill("20");
  await expect(page.locator(".export-checks summary")).toHaveText(
    "Layout checked · models checked on export",
  );
  await expect(page.locator(".layout-metrics")).not.toContainText(
    "30.45 mm spare",
  );
  await page.getByRole("button", { name: "Export print kit" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "is taller than the drawer" }),
  ).toBeVisible({ timeout: 60000 });
  await expect(page.locator(".export-checks summary")).toHaveText(
    "Layout checked · models checked on export",
  );
  const invalidSaved = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save diagnostic file" }).click();
  expect(
    JSON.parse(readFileSync((await (await invalidSaved).path())!, "utf8"))
      .context.exportChecks,
  ).toBeNull();
});
