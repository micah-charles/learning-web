import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { clickOptionByText, collectConsoleErrors, expectNoConsoleErrors, goToTab, openHome } from "../fixtures/ui-helpers";

const MERGED_STAGE1_PACK_PATH = path.join(
  process.cwd(),
  "data/ProgressiveLanguagePacks/beta1/stage1/semantic_pack_l1_021_people/pack.json",
);
const mergedPack = JSON.parse(fs.readFileSync(MERGED_STAGE1_PACK_PATH, "utf8"));

function getProgressiveVocabAnswer(pack: any, prompt: string, targetLang = "de"): string {
  const match = (pack.vocabulary || []).find((item: any) => (item.translations?.en?.text || "").trim() === prompt.trim());
  const translation = match?.translations?.[targetLang];
  const article = String(translation?.article || "").trim();
  const text = String(translation?.text || "").trim();
  return [article, text].filter(Boolean).join(" ").trim();
}

test("@data-sample hides unsupported speech-only language ladder UI", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { value: undefined, configurable: true });
    Object.defineProperty(window, "SpeechRecognition", { value: undefined, configurable: true });
    Object.defineProperty(window, "webkitSpeechRecognition", { value: undefined, configurable: true });
  });

  const errors = collectConsoleErrors(page);
  await openHome(page);
  await goToTab(page, "language");

  await expect(page.getByTestId("lesson-step-listen")).toHaveCount(0);
  await expect(page.getByTestId("progressive-voice-practice-toggle")).toHaveCount(0);
  await expect(page.getByTestId("progressive-phase-vocab")).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("@data-sample merged Stage 1 Chinese lesson shows four vocab choices and segmented builder tiles", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openHome(page);
  await goToTab(page, "language");

  await page.getByTestId("progressive-pack-select").selectOption("beta1");
  await page.getByTestId("progressive-stage-select").selectOption("stage1");
  await page.getByTestId("progressive-lesson-select").selectOption("semantic_pack_l1_021_people");
  await page.getByTestId("progressive-language-select").selectOption("zh");

  for (let guard = 0; guard < 20; guard += 1) {
    if (await page.getByTestId("progressive-phase-vocab").isVisible()) break;
    await page.getByTestId("progressive-next-step-button").click();
  }
  await expect(page.getByTestId("progressive-phase-vocab")).toBeVisible();

  for (let guard = 0; guard < (mergedPack.vocabulary || []).length; guard += 1) {
    const options = page.getByTestId("progressive-vocab-option");
    await expect(options).toHaveCount(4);
    const prompt = await page.locator(".question-prompt").first().innerText();
    const correct = getProgressiveVocabAnswer(mergedPack, prompt, "zh");
    expect(correct).toBeTruthy();
    await clickOptionByText(options, correct);
    if (guard < (mergedPack.vocabulary || []).length - 1) {
      await page.getByTestId("progressive-next-step-button").click();
    }
  }

  await page.getByTestId("progressive-next-step-button").click();
  await expect(page.getByTestId("progressive-phase-builder")).toBeVisible();

  const expectedTiles = mergedPack.sentenceBuilders[0].translations.zh.tiles;
  const builderTiles = page.getByTestId("progressive-builder-token");
  await expect(builderTiles).toHaveCount(expectedTiles.length);
  expect(expectedTiles.length).toBeGreaterThan(1);
  await expectNoConsoleErrors(errors);
});
