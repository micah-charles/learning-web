import { test, expect } from "@playwright/test";

async function openHistoryStudyBook(page) {
  await page.goto("/");
  await page.getByRole("button", { name: /^Quiz$/ }).click();
  await page.getByRole("button", { name: /Geography/i }).click();
  const datasetSelect = page.locator("select").first();
  await expect(datasetSelect).toBeVisible();
  await datasetSelect.selectOption("usmsg_04_environment_and_global_issues_03_water_and_food_security");
  const studyBookButton = page.getByRole("button", { name: /Study Book/i }).first();
  await expect(studyBookButton).toBeVisible();
  await studyBookButton.click();
  const drawer = page.locator('.study-book-drawer[data-open="true"]');
  await expect(drawer).toBeVisible();
  return drawer;
}

test("Tutor panel shifts clear of the Study Book drawer on desktop", async ({ page }) => {
  const drawer = await openHistoryStudyBook(page);

  await page.locator(".tutor-fab").click();
  const tutorPanel = page.locator(".tutor-panel");
  await expect(tutorPanel).toBeVisible();

  const drawerBox = await drawer.boundingBox();
  const tutorBox = await tutorPanel.boundingBox();

  expect(drawerBox).not.toBeNull();
  expect(tutorBox).not.toBeNull();
  expect(tutorBox.x + tutorBox.width).toBeLessThanOrEqual(drawerBox.x - 8);
});

test("Tutor coastal results open the exact study note file and anchor", async ({ page }) => {
  const drawer = await openHistoryStudyBook(page);
  const initialFile = await drawer.getAttribute("data-active-file");

  await page.locator(".tutor-fab").click();
  await expect(page.locator(".tutor-panel")).toBeVisible();

  await page.getByLabel("Your question").fill("coastal");
  await page.getByRole("button", { name: "Send message" }).click();

  const sourceCards = page.locator(".tutor-panel__source-card");
  await expect(sourceCards.first()).toBeVisible({ timeout: 30000 });

  const openButton = sourceCards.first().locator(".tutor-panel__source-open-btn");
  const targetFile = await openButton.getAttribute("data-source-path");
  const targetAnchor = await openButton.getAttribute("data-source-anchor");

  await openButton.click();

  await expect(drawer).toHaveAttribute("data-active-file", targetFile || "", { timeout: 30000 });
  await expect(drawer).toHaveAttribute("data-current-anchor", targetAnchor || "", { timeout: 30000 });
  expect(await drawer.getAttribute("data-active-file")).not.toEqual(initialFile);
});

test("Tutor minimises instead of overlapping the Study Book drawer on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHistoryStudyBook(page);

  await page.locator(".tutor-fab").click();
  await expect(page.locator(".tutor-panel")).toBeHidden();
  await expect(page.locator(".tutor-fab")).toBeVisible();
});
