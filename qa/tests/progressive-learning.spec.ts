import { test, expect } from "@playwright/test";
import { findBuilderRecordForPrompt } from "../fixtures/answer-resolver";
import { loadQaBehaviourConfig } from "../fixtures/behaviour-config";
import { findFirstProgressiveLesson } from "../fixtures/pack-loader";
import { clickOptionByText, collectConsoleErrors, expectNoConsoleErrors, goToTab, openHome } from "../fixtures/ui-helpers";

function getProgressiveVocabAnswer(pack: any, prompt: string, targetLang = "de"): string {
  const match = (pack.vocabulary || []).find((item: any) => (item.translations?.en?.text || "").trim() === prompt.trim());
  const translation = match?.translations?.[targetLang];
  const article = String(translation?.article || "").trim();
  const text = String(translation?.text || "").trim();
  return [article, text].filter(Boolean).join(" ").trim();
}

test("@data-sample progressive learning uses the configured step order and reaches arcade with data-driven answers", async ({ page }) => {
  const config = await loadQaBehaviourConfig();
  const { pack } = await findFirstProgressiveLesson();
  const expectedStepOrder = (config.progressiveLearning as any).expectedStepOrder as string[];
  const builderRecords = (pack.sentenceBuilders || []).map((item: any, index: number) => ({
    id: item.sentenceId || `builder-${index + 1}`,
    prompt: String(item.translations?.en?.text || "").trim(),
    answer: String(item.translations?.de?.text || "").trim(),
    tiles: Array.isArray(item.translations?.de?.tiles) ? item.translations.de.tiles : String(item.translations?.de?.text || "").split(/\s+/).filter(Boolean),
  }));

  const errors = collectConsoleErrors(page);
  await openHome(page);
  await goToTab(page, "language");

  await expect(page.getByTestId("lesson-step-listen")).toBeVisible();
  const renderedStepIds = await page
    .locator("[data-testid^='lesson-step-']")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-testid")?.replace("lesson-step-", "") || ""));
  expect(renderedStepIds).toEqual(expectedStepOrder);

  await expect(page.getByTestId("progressive-phase-listen")).toBeVisible();
  for (let guard = 0; guard < 20; guard += 1) {
    if (await page.getByTestId("progressive-phase-vocab").isVisible()) break;
    await page.getByTestId("progressive-next-step-button").click();
  }
  await expect(page.getByTestId("progressive-phase-vocab")).toBeVisible();

  for (let guard = 0; guard < (pack.vocabulary || []).length; guard += 1) {
    if (await page.getByTestId("progressive-phase-builder").isVisible()) break;
    const prompt = await page.locator(".question-prompt").first().innerText();
    const correct = getProgressiveVocabAnswer(pack, prompt);
    expect(correct).toBeTruthy();
    await clickOptionByText(page.getByTestId("progressive-vocab-option"), correct);
    await page.getByTestId("progressive-next-step-button").click();
  }
  await expect(page.getByTestId("progressive-phase-builder")).toBeVisible();

  for (let guard = 0; guard < builderRecords.length; guard += 1) {
    if (await page.getByTestId("progressive-phase-arcade").isVisible()) break;
    const prompt = await page.locator(".question-prompt").first().innerText();
    const record = findBuilderRecordForPrompt(prompt, builderRecords);
    expect(record).toBeTruthy();
    for (const token of record!.tiles) {
      await clickOptionByText(page.getByTestId("progressive-builder-token"), token);
    }
    await expect(page.getByTestId("progressive-builder-answer-token")).toHaveCount(record!.tiles.length);
    await page.waitForTimeout(100);
    await page.getByTestId("progressive-builder-check-button").click();
    await page.getByTestId("progressive-next-step-button").click();
  }

  await expect(page.getByTestId("progressive-phase-arcade")).toBeVisible();
  await expectNoConsoleErrors(errors);
});
