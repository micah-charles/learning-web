import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { loadProgressiveCatalog } from "../fixtures/pack-loader";
import { clickOptionByText, collectConsoleErrors, expectNoConsoleErrors, goToTab, openHome } from "../fixtures/ui-helpers";

function getProgressiveVocabAnswer(pack: any, prompt: string, targetLang = "de"): string {
  const match = (pack.vocabulary || []).find((item: any) => (item.translations?.en?.text || "").trim() === prompt.trim());
  const translation = match?.translations?.[targetLang];
  const article = String(translation?.article || "").trim();
  const text = String(translation?.text || "").trim();
  return [article, text].filter(Boolean).join(" ").trim();
}

function loadStage2PackForLanguage(catalog: any, stage2LessonIndex = 0, targetLang = "de"): { lesson: any; pack: any } {
  const catalogPack = catalog.packs.find((p: any) => p.id === "beta1");
  if (!catalogPack) throw new Error("beta1 pack not found in catalog");
  const stage2 = catalogPack.stages.find((s: any) => s.id === "stage2");
  if (!stage2) throw new Error("stage2 not found in catalog");
  const lesson = stage2.lessons[stage2LessonIndex];
  if (!lesson) throw new Error(`Lesson index ${stage2LessonIndex} not found in Stage 2`);
  const packPath = path.join(process.cwd(), lesson.path.replace(/^\.\//, ""));
  const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));
  return { lesson, pack };
}

async function selectStage2Lesson(page: Page, lessonId: string) {
  await page.getByTestId("progressive-pack-select").selectOption("beta1");
  await page.getByTestId("progressive-stage-select").selectOption("stage2");
  await page.getByTestId("progressive-lesson-select").selectOption(lessonId);
}

test("@data-sample Stage 2 German lesson reaches arcade with data-driven vocab and builder answers", async ({ page }) => {
  const catalog = await loadProgressiveCatalog();
  const { lesson, pack } = loadStage2PackForLanguage(catalog, 0, "de");

  const errors = collectConsoleErrors(page);
  await openHome(page);
  await goToTab(page, "language");
  await selectStage2Lesson(page, lesson.id);
  await page.getByTestId("progressive-language-select").selectOption("de");

  for (let guard = 0; guard < 20; guard += 1) {
    if (await page.getByTestId("progressive-phase-vocab").isVisible()) break;
    await page.getByTestId("progressive-next-step-button").click();
  }
  await expect(page.getByTestId("progressive-phase-vocab")).toBeVisible();

  for (let guard = 0; guard < (pack.vocabulary || []).length; guard += 1) {
    if (await page.getByTestId("progressive-phase-builder").isVisible()) break;
    const options = page.getByTestId("progressive-vocab-option");
    await expect(options).toHaveCount(4);
    const prompt = await page.locator(".question-prompt").first().innerText();
    const correct = getProgressiveVocabAnswer(pack, prompt, "de");
    expect(correct).toBeTruthy();
    await clickOptionByText(options, correct);
    await page.getByTestId("progressive-next-step-button").click();
  }
  await expect(page.getByTestId("progressive-phase-builder")).toBeVisible();

  const builderRecords = (pack.sentenceBuilders || []).map((item: any) => ({
    prompt: String(item.translations?.en?.text || "").trim(),
    tiles: Array.isArray(item.translations?.de?.tiles) ? item.translations.de.tiles : String(item.translations?.de?.text || "").split(/\s+/).filter(Boolean),
  }));

  for (let guard = 0; guard < builderRecords.length; guard += 1) {
    if (await page.getByTestId("progressive-phase-arcade").isVisible()) break;
    const prompt = await page.locator(".question-prompt").first().innerText();
    const record = builderRecords.find((r) => prompt.includes(r.prompt.substring(0, 20)));
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

test("@data-sample Stage 2 Spanish lesson resolves Chinese and French translations correctly", async ({ page }) => {
  const catalog = await loadProgressiveCatalog();
  const { lesson, pack } = loadStage2PackForLanguage(catalog, 1, "es");

  const errors = collectConsoleErrors(page);
  await openHome(page);
  await goToTab(page, "language");
  await selectStage2Lesson(page, lesson.id);

  await page.getByTestId("progressive-language-select").selectOption("es");
  await expect(page.getByTestId("progressive-phase-listen")).toBeVisible();

  for (let guard = 0; guard < 20; guard += 1) {
    if (await page.getByTestId("progressive-phase-vocab").isVisible()) break;
    await page.getByTestId("progressive-next-step-button").click();
  }
  await expect(page.getByTestId("progressive-phase-vocab")).toBeVisible();

  for (let guard = 0; guard < (pack.vocabulary || []).length; guard += 1) {
    if (await page.getByTestId("progressive-phase-builder").isVisible()) break;
    const options = page.getByTestId("progressive-vocab-option");
    await expect(options).toHaveCount(4);
    const prompt = await page.locator(".question-prompt").first().innerText();
    const correct = getProgressiveVocabAnswer(pack, prompt, "es");
    expect(correct).toBeTruthy();
    await clickOptionByText(options, correct);
    await page.getByTestId("progressive-next-step-button").click();
  }
  await expect(page.getByTestId("progressive-phase-builder")).toBeVisible();
  await expectNoConsoleErrors(errors);
});
