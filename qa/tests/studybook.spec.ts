import { test, expect } from "@playwright/test";
import { loadManifest, getStudyBookPacks, findStudyBookPackWithImages } from "../fixtures/pack-loader";
import { loadQaBehaviourConfig } from "../fixtures/behaviour-config";
import { collectConsoleErrors, expectNoConsoleErrors, getSelectOptionValues, goToTab, openHome, selectOptionByTestId } from "../fixtures/ui-helpers";

test("@data-sample study book opens for the selected pack and can switch packs", async ({ page }) => {
  const config = await loadQaBehaviourConfig();
  const manifest = await loadManifest();
  const packs = getStudyBookPacks(manifest, config);
  expect(packs.length).toBeGreaterThan(1);

  const errors = collectConsoleErrors(page);
  await openHome(page);
  await goToTab(page, "quiz");
  await page.getByTestId("quiz-subject-religion").click({ force: true });
  await page.getByTestId("quiz-curriculum-gcse").click({ force: true });
  const visibleQuizIds = new Set(await getSelectOptionValues(page, "quiz-dataset-select"));
  const selectableStudyPacks = packs.filter((pack) => visibleQuizIds.has(pack.id)).slice(0, 2);
  expect(selectableStudyPacks.length, "Expected at least two visible quiz datasets with Study Book content").toBeGreaterThan(1);

  await selectOptionByTestId(page, "quiz-dataset-select", selectableStudyPacks[0].id);
  await page.getByTestId("studybook-open-button").click({ force: true });
  await expect(page.getByTestId("studybook-drawer")).toHaveAttribute("data-open", "true");
  await expect(page.getByTestId("studybook-drawer")).toHaveAttribute("data-dataset-id", selectableStudyPacks[0].id);
  await page.locator(".sb-scrim").click({ force: true });
  await expect(page.getByTestId("studybook-drawer")).toHaveAttribute("data-open", "false");

  await selectOptionByTestId(page, "quiz-dataset-select", selectableStudyPacks[1].id);
  await page.getByTestId("studybook-open-button").click({ force: true });
  await expect(page.getByTestId("studybook-drawer")).toHaveAttribute("data-dataset-id", selectableStudyPacks[1].id);
  await page.locator(".sb-scrim").click({ force: true });
  await expect(page.getByTestId("studybook-drawer")).toHaveAttribute("data-open", "false");

  if ((config.studyBook as any)?.shouldSupportImages) {
    const packWithImages = await findStudyBookPackWithImages(selectableStudyPacks);
    if (packWithImages && visibleQuizIds.has(packWithImages.id)) {
      await selectOptionByTestId(page, "quiz-dataset-select", packWithImages.id);
      await page.getByTestId("studybook-open-button").click({ force: true });
      await expect(page.getByTestId("studybook-content")).toBeVisible();
    }
  }

  await expectNoConsoleErrors(errors);
});
