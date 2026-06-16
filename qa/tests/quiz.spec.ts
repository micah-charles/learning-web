import { test, expect } from "@playwright/test";
import { findVocabRecordForPrompt, resolveIncorrectAnswer } from "../fixtures/answer-resolver";
import { loadManifest, loadRevisionPack, normaliseVocabRecords } from "../fixtures/pack-loader";
import { clickOptionByText, collectConsoleErrors, expectNoConsoleErrors, goToTab, openHome, selectOptionByTestId } from "../fixtures/ui-helpers";

async function currentQuizPrompt(page: any): Promise<string> {
  return page.locator(".lw-question-prompt").first().innerText();
}

async function visibleQuizOptions(page: any): Promise<string[]> {
  return page.getByTestId("quiz-option").allInnerTexts();
}

test("@data-sample quiz answers stay data-driven for correct and incorrect choices", async ({ page }) => {
  const manifest = await loadManifest();
  const corePack = await loadRevisionPack(manifest, "core");
  const records = normaliseVocabRecords(corePack);
  const errors = collectConsoleErrors(page);

  await openHome(page);
  await goToTab(page, "quiz");
  await selectOptionByTestId(page, "quiz-dataset-select", "core");
  await page.getByTestId("start-quiz-button").click();

  const promptOne = await currentQuizPrompt(page);
  const recordOne = findVocabRecordForPrompt(promptOne, records);
  expect(recordOne).toBeTruthy();
  await clickOptionByText(page.getByTestId("quiz-option"), recordOne!.target);
  await expect(page.getByTestId("feedback-correct")).toBeVisible();
  await page.getByTestId("next-question-button").click();

  const promptTwo = await currentQuizPrompt(page);
  const recordTwo = findVocabRecordForPrompt(promptTwo, records);
  expect(recordTwo).toBeTruthy();
  const options = await visibleQuizOptions(page);
  const wrongAnswer = resolveIncorrectAnswer({ options, target: recordTwo!.target });
  expect(wrongAnswer).toBeTruthy();
  await clickOptionByText(page.getByTestId("quiz-option"), wrongAnswer!);
  await expect(page.getByTestId("feedback-incorrect")).toBeVisible();

  await expectNoConsoleErrors(errors);
});
