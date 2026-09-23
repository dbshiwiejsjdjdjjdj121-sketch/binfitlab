import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const path of [
  "/",
  "/gridfinity-bin-generator/",
  "/gridfinity-drawer-planner/",
  "/privacy/",
]) {
  test(`accessible labels, structure and contrast: ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    if (path.includes("bin-generator"))
      await expect(
        page.getByRole("button", { name: "Download STL", exact: true }),
      ).toBeEnabled({ timeout: 60000 });
    if (path.includes("drawer-planner"))
      await expect(
        page.getByRole("button", { name: /Select bin 1,/ }),
      ).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  });
}
