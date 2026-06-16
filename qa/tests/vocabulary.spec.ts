import { test, expect } from "@playwright/test";
import { loadManifest, loadRevisionPack, normaliseVocabRecords } from "../fixtures/pack-loader";
import { loadQaBehaviourConfig } from "../fixtures/behaviour-config";
import { collectConsoleErrors, expectNoConsoleErrors, goToTab, openHome, selectOptionByTestId } from "../fixtures/ui-helpers";

test("@data-sample vocabulary mode loads cards and keeps the audio affordance available", async ({ page }) => {
  const config = await loadQaBehaviourConfig();
  const manifest = await loadManifest();
  const corePack = await loadRevisionPack(manifest, "core");
  const records = normaliseVocabRecords(corePack);

  expect(records.length).toBeGreaterThan(0);

  const errors = collectConsoleErrors(page);
  await openHome(page);
  await goToTab(page, "vocab");
  await selectOptionByTestId(page, "vocab-pack-select", "core");

  const searchTerm = records[0].source.slice(0, Math.max(3, Math.min(8, records[0].source.length)));
  await page.getByPlaceholder("Search words...").fill(searchTerm);

  await expect(page.getByTestId("vocab-card").first()).toBeVisible();

  if ((config.vocabulary as any)?.requireAudioButton) {
    await expect(page.getByTestId("vocab-audio-button").first()).toBeVisible();
  }

  await expectNoConsoleErrors(errors);
});
