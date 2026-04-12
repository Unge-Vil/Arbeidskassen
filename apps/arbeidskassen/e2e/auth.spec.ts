import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("unauthenticated user on protected route is redirected to login", async ({
    page,
  }) => {
    await page.goto("/no/dashboard");
    // Should redirect to /login (with or without locale prefix)
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user on /select-tenant is redirected to login", async ({
    page,
  }) => {
    await page.goto("/no/select-tenant");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    // Verify page has email and password fields
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // Verify page has the Arbeidskassen branding
    await expect(page.getByText("Arbeidskassen")).toBeVisible();
  });

  test("login form shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "nonexistent@test.invalid");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    // Should show an error message
    await expect(page.getByText(/feil|error|invalid/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
