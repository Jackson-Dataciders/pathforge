import { expect, test } from "@playwright/test";

test("switches color mode and persists a prebuilt color theme", async ({ page }) => {
  await page.goto("/");

  const backgroundColor = () =>
    page.locator("body").evaluate((body) => getComputedStyle(body).backgroundColor);
  const lightBackground = await backgroundColor();

  await page.getByRole("combobox", { name: "Color mode" }).selectOption("dark");
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await expect.poll(backgroundColor).not.toBe(lightBackground);

  await page.getByRole("combobox", { name: "Color theme" }).selectOption("forest");
  await expect(page.locator("html")).toHaveAttribute("data-color-theme", "forest");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-color-theme", "forest");
});