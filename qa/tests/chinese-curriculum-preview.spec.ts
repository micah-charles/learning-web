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
  await expect(page.getByRole("heading", { name: "Chinese Input Lab" })).toBeVisible();
  await expect(page.locator(".cil-standard-note")).toContainText("seed v1.3.0");

  await page.getByTestId("chinese-input-start-lesson").click();
  await expect(page.getByTestId("chinese-input-lesson-player")).toBeVisible();
  await expect(page.locator(".cil-question-character")).not.toHaveText("");
  await expectNoConsoleErrors(errors);
});
