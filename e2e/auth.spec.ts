import { expect, test } from "@playwright/test";

test("shows the signed-out menu and keeps courses public", async ({ page }) => {
  const sessionResponse = await page.request.get("/api/auth/session");
  expect(sessionResponse.ok()).toBeTruthy();

  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Sign in with GitHub" }),
  ).toBeVisible();

  const response = await page.goto("/courses");
  expect(response?.ok()).toBeTruthy();
});