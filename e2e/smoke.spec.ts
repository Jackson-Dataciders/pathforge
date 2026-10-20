import { expect, test } from "@playwright/test";

test("home page links to courses", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Pathforge" })).toBeVisible();
  await page.getByRole("link", { name: "Courses" }).click();
  await expect(page).toHaveURL(/\/courses$/);
});
