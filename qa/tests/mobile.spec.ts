import { test, expect } from "@playwright/test";
import { collectConsoleErrors, expectNoConsoleErrors, getVisibleByTestId, goToTab, openHome } from "../fixtures/ui-helpers";

test("mobile layout keeps navigation usable and shows overlay arcade controls", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "This spec is only relevant for the mobile project");

  const errors = collectConsoleErrors(page);
  await openHome(page);
  await expect(getVisibleByTestId(page, "nav-home")).toBeVisible();

  await goToTab(page, "arcade");
  await expect(page.getByTestId("arcade-start-button")).toBeVisible();
  await page.getByTestId("arcade-start-button").click();
  await expect(page.getByTestId("arcade-dpad-overlay")).toBeVisible();

  await goToTab(page, "quiz");
  await expect(page.getByTestId("start-quiz-button")).toBeVisible();

  await expectNoConsoleErrors(errors);
});
