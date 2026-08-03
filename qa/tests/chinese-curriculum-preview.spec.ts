import { test, expect } from "@playwright/test";
import {
  collectConsoleErrors,
  expectNoConsoleErrors,
  seedEverythingMode,
} from "../fixtures/ui-helpers";

test("generated preview is explicitly labelled and starts a validated lesson", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await seedEverythingMode(page);
  await page.goto("/chinese-input", { waitUntil: "domcontentloaded" });

  await expect(page.getByTestId("chinese-input-preview-warning")).toContainText("not production-approved");
  await expect(page.getByRole("heading", { name: "Chinese Input Kingdom" })).toBeVisible();
  await expect(page.locator(".cik-standard-note")).toContainText("3,000 characters");
  await expect(page.locator(".cik-standard-note")).toContainText("560 lessons");

  await page.getByTestId("chinese-input-start-lesson").click();
  await expect(page.getByTestId("chinese-input-lesson-player")).toBeVisible();
  await expect(page.locator(".cil-question-character")).not.toHaveText("");
  await expectNoConsoleErrors(errors);
});
