import { test, expect } from "@playwright/test";
import { collectConsoleErrors, expectNoConsoleErrors, getVisibleByTestId, goToTab, openHome } from "../fixtures/ui-helpers";

test("home page loads the app shell without critical console errors", async ({ page }) => {
  const errors = collectConsoleErrors(page);

  await openHome(page);

  await expect(getVisibleByTestId(page, "nav-home")).toBeVisible();
  await expect(page.getByText(/Quick start/i)).toBeVisible();

  await goToTab(page, "quiz");
  await expect(page.getByTestId("quiz-dataset-select")).toBeVisible();

  await expectNoConsoleErrors(errors);
});
