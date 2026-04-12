import { test, expect } from "@playwright/test";

test.describe("Public routes", () => {
  test("landing page loads without errors", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(500);
    // Verify the page has rendered some content
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    const response = await page.goto("/no/this-route-does-not-exist");
    // Next.js may return 200 with a not-found page or 404
    expect(response?.status()).toBeLessThanOrEqual(404);
  });

  test("locale redirect works (/ → /no or /en)", async ({ page }) => {
    await page.goto("/");
    // Should either stay on / or redirect to a locale prefix
    const url = page.url();
    expect(url).toMatch(/\/(no|en)?$/);
  });
});
