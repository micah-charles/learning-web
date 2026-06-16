import { test, expect } from "@playwright/test";
import { loadManifest, getPassageGroups, getRevisionPacks, getSentenceBuilderPacks } from "../fixtures/pack-loader";
import { loadQaBehaviourConfig, isFullDataRun } from "../fixtures/behaviour-config";
import { sampleItems } from "../fixtures/test-sampler";
import { collectConsoleErrors, expectNoConsoleErrors, getSelectOptionValues, goToTab, openHome, selectOptionByTestId } from "../fixtures/ui-helpers";

test("@data-sample manifest-backed pack selections stay loadable in the UI", async ({ page }) => {
  const config = await loadQaBehaviourConfig();
  const manifest = await loadManifest();
  const fullData = isFullDataRun(config);
  const revisionPacks = sampleItems(getRevisionPacks(manifest, config), config.sampleSizePerCategory, fullData, (pack) => pack.id);
  const passageGroups = sampleItems(getPassageGroups(manifest, config), config.sampleSizePerCategory, fullData, (pack) => pack.id);
  const builderPacks = sampleItems(getSentenceBuilderPacks(manifest, config), config.sampleSizePerCategory, fullData, (pack) => pack.id);

  expect(revisionPacks.length).toBeGreaterThan(0);
  expect(passageGroups.length).toBeGreaterThan(0);
  expect(builderPacks.length).toBeGreaterThan(0);

  const errors = collectConsoleErrors(page);
  await openHome(page);

  await goToTab(page, "quiz");
  const visibleRevisionIds = new Set(await getSelectOptionValues(page, "quiz-dataset-select"));
  const selectableRevisionPacks = revisionPacks.filter((pack) => visibleRevisionIds.has(pack.id)).slice(0, 3);
  expect(selectableRevisionPacks.length, "Expected at least one manifest-backed quiz dataset to be selectable").toBeGreaterThan(0);
  for (const pack of selectableRevisionPacks) {
    await selectOptionByTestId(page, "quiz-dataset-select", pack.id);
    await expect(page.getByTestId("quiz-dataset-select")).toHaveValue(pack.id);
  }

  await goToTab(page, "reading");
  const visiblePassageIds = new Set(await getSelectOptionValues(page, "reading-group-select"));
  const selectablePassageGroup = passageGroups.find((pack) => visiblePassageIds.has(pack.id));
  expect(selectablePassageGroup, "Expected at least one manifest-backed reading group to be selectable").toBeTruthy();
  await selectOptionByTestId(page, "reading-group-select", selectablePassageGroup!.id);
  await expect(page.getByTestId("reading-group-select")).toHaveValue(selectablePassageGroup!.id);

  await goToTab(page, "builder");
  const visibleBuilderIds = new Set(await getSelectOptionValues(page, "builder-pack-select"));
  const selectableBuilderPack = builderPacks.find((pack) => visibleBuilderIds.has(pack.id));
  expect(selectableBuilderPack, "Expected at least one manifest-backed builder pack to be selectable").toBeTruthy();
  await selectOptionByTestId(page, "builder-pack-select", selectableBuilderPack!.id);
  await expect(page.getByTestId("builder-pack-select")).toHaveValue(selectableBuilderPack!.id);

  await expectNoConsoleErrors(errors);
});
