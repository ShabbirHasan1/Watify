import { expect, test } from "@playwright/test";

// TKT-0040: minimal happy-path. Visits the public hero and asserts
// the brand + headline copy + Sign in CTA are visible. Auth +
// dashboard flows are deferred to a follow-on spec that needs a
// seeded test DB.

test("public hero renders brand + CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Watify" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  // Headline second line (gradient text) -- check substring rather
  // than exact role to keep this independent of the CSS treatment.
  await expect(page.getByText("friend watchlists")).toBeVisible();
});
