import { test, expect } from "@playwright/test";
import { clearAppStorage, openHome, readStoredState, seedEverythingMode } from "../fixtures/ui-helpers";

test("first-time users see onboarding and their selection persists", async ({ page }) => {
  await clearAppStorage(page);
  await openHome(page, { seedEverything: false });

  await expect(page.getByTestId("onboarding-page")).toBeVisible();

  await page.getByRole("button", { name: /A child \/ student/i }).click();
  await page.getByRole("button", { name: /School revision/i }).click();
  await expect(page.getByRole("heading", { name: /Which level fits best/i })).toBeVisible();
  await page.getByRole("button", { name: /\bKS3\b/i }).click();
  await page.getByTestId("onboarding-start-button").click();

  await expect(page.getByText(/Quick start/i)).toBeVisible();

  const storedState = await readStoredState(page);
  expect(storedState?.prefs?.onboardingCompleted).toBe(true);
  expect(storedState?.prefs?.learningMode).toBe("guided");
});

test("returning users do not see onboarding unnecessarily", async ({ page }) => {
  await seedEverythingMode(page);
  await openHome(page, { seedEverything: false });
  await expect(page.getByTestId("onboarding-page")).toHaveCount(0);
  await expect(page.getByText(/Quick start/i)).toBeVisible();
});
