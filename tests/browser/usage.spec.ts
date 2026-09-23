import { test, expect } from "@playwright/test";

test("statistics stay off by default, send only bounded fields after opt-in, and stop on opt-out", async ({
  page,
}) => {
  const events: Record<string, unknown>[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/usage")
      events.push(request.postDataJSON());
  });
  await page.goto("/gridfinity-bin-generator/");
  const download = page.getByRole("button", {
    name: "Download STL",
    exact: true,
  });
  await expect(download).toBeEnabled({ timeout: 60000 });
  const setting = page.getByRole("checkbox", {
    name: "Help improve the tools with basic usage statistics",
  });
  await expect(setting).not.toBeChecked();
  await download.click();
  expect(events).toHaveLength(0);
  await setting.check();
  const generated = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/usage") &&
      r.request().postDataJSON().event === "generation",
  );
  await page.getByRole("button", { name: "Small", exact: true }).click();
  expect((await generated).status()).toBe(204);
  await expect(download).toBeEnabled({ timeout: 60000 });
  const downloaded = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/usage") &&
      r.request().postDataJSON().event === "download",
  );
  await download.click();
  expect((await downloaded).status()).toBe(204);
  expect(events.map((e) => e.event)).toEqual(["generation", "download"]);
  for (const event of events)
    expect(Object.keys(event).sort()).toEqual([
      "duration",
      "event",
      "outcome",
      "reason",
      "tool",
    ]);
  await setting.uncheck();
  await page.getByRole("button", { name: "Everyday", exact: true }).click();
  await expect(download).toBeEnabled({ timeout: 60000 });
  await download.click();
  expect(events).toHaveLength(2);
  await page.reload();
  await expect(setting).not.toBeChecked();
});

test("browser privacy signals override a saved opt-in", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("binfitlab-usage-opt-in", "yes");
    Object.defineProperty(navigator, "globalPrivacyControl", { value: true });
  });
  let requests = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/usage")) requests++;
  });
  await page.goto("/gridfinity-bin-generator/");
  const setting = page.getByRole("checkbox", {
    name: "Help improve the tools with basic usage statistics",
  });
  await expect(setting).toBeDisabled();
  await expect(setting).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Download STL", exact: true }),
  ).toBeEnabled({ timeout: 60000 });
  expect(requests).toBe(0);
});
