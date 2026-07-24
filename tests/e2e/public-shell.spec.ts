import { expect, test } from "@playwright/test";

test("public shell is usable on mobile and offers signup and sign in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /one calm place/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /apply for homeowner access/i })).toHaveAttribute("href", "/signup");
  await expect(page.getByRole("link", { name: /already have access.*sign in/i })).toHaveAttribute("href", "/login");
});

test("homeowners can open a complete access application form", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: /apply for access/i }).click();

  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByRole("heading", { name: /apply for homeowner access/i })).toBeVisible();
  await expect(page.getByLabel("Full name")).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Phone number")).toBeVisible();
  await expect(page.getByLabel("Community")).toContainText("Bella Vista Apartments");
  await expect(page.getByLabel("Community")).toContainText("Kingswood Homes");
  await expect(page.getByLabel("Unit number")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit application" })).toBeVisible();
});
