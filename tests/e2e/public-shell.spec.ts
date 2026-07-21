import { expect, test } from "@playwright/test";

test("public shell is usable on mobile and links to sign in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /one calm place/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /continue to sign in/i })).toHaveAttribute("href", "/login");
});
