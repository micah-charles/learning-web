import { test, expect } from "@playwright/test";
import { findBuilderRecordForPrompt, normalizeText, resolveSentenceOrder } from "../fixtures/answer-resolver";
import { loadManifest, loadSentenceBuilderPack, getSentenceBuilderPacks, normaliseBuilderRecords } from "../fixtures/pack-loader";
import { loadQaBehaviourConfig } from "../fixtures/behaviour-config";
import { clickOptionByText, collectConsoleErrors, expectNoConsoleErrors, getSelectOptionValues, goToTab, openHome, selectOptionByTestId } from "../fixtures/ui-helpers";

async function clickSentenceTokens(page: any, tokens: string[], testId = "sentence-word-token") {
  for (const token of tokens) {
    await clickOptionByText(page.getByTestId(testId), token);
  }
}

async function revealSentenceByHints(page: any, tokens: string[]) {
  for (let index = 0; index < tokens.length; index += 1) {
    await page.getByTestId("sentence-hint-button").click();
    await expect(page.getByTestId("sentence-builder-answer-token")).toHaveCount(index + 1);
    await expect.poll(
      async () => normalizeText(await page.getByTestId("sentence-builder-answer-token").nth(index).innerText()),
      { message: `Expected hinted token ${index + 1} to match "${tokens[index]}"` },
    ).toBe(normalizeText(tokens[index]));
  }
}

test("@data-sample standalone builder answers stay data-driven across sampled rounds", async ({ page }) => {
  const config = await loadQaBehaviourConfig();
  const manifest = await loadManifest();
  const expectedRounds = Number((config.sentenceBuilder as any)?.expectedRounds || 1);

  const errors = collectConsoleErrors(page);
  await openHome(page);
  await goToTab(page, "builder");
  const visibleBuilderIds = new Set(await getSelectOptionValues(page, "builder-pack-select"));
  const packEntry = getSentenceBuilderPacks(manifest, config).find((pack) => visibleBuilderIds.has(pack.id));
  expect(packEntry, "Expected at least one visible builder pack backed by the manifest").toBeTruthy();
  const records = normaliseBuilderRecords(await loadSentenceBuilderPack(packEntry!));
  expect(records.length).toBeGreaterThan(0);
  await selectOptionByTestId(page, "builder-pack-select", packEntry!.id);

  for (let round = 0; round < Math.min(expectedRounds, records.length); round += 1) {
    const prompt = await page.locator("[data-testid='builder-card'] p").first().innerText();
    const record = findBuilderRecordForPrompt(prompt, records);
    expect(record).toBeTruthy();
    const answerTokens = resolveSentenceOrder(record!);
    await revealSentenceByHints(page, answerTokens);
    await page.waitForTimeout(100);
    await page.getByTestId("sentence-submit-button").click();
    await expect(page.getByTestId("feedback-correct")).toBeVisible();
    if (round < Math.min(expectedRounds, records.length) - 1) {
      await page.getByTestId("builder-next-button").click();
    }
  }

  await expectNoConsoleErrors(errors);
});

test("@data-sample standalone builder shows incorrect feedback for wrong order", async ({ page }) => {
  const config = await loadQaBehaviourConfig();
  const manifest = await loadManifest();
  const errors = collectConsoleErrors(page);

  await openHome(page);
  await goToTab(page, "builder");
  const visibleBuilderIds = new Set(await getSelectOptionValues(page, "builder-pack-select"));
  const packEntry = getSentenceBuilderPacks(manifest, config).find((pack) => visibleBuilderIds.has(pack.id));
  expect(packEntry, "Expected at least one visible builder pack backed by the manifest").toBeTruthy();
  const records = normaliseBuilderRecords(await loadSentenceBuilderPack(packEntry!));
  await selectOptionByTestId(page, "builder-pack-select", packEntry!.id);

  const prompt = await page.locator("[data-testid='builder-card'] p").first().innerText();
  const record = findBuilderRecordForPrompt(prompt, records);
  expect(record).toBeTruthy();
  const correctTokens = resolveSentenceOrder(record!);
  test.skip(correctTokens.length < 2, "Need at least two tokens to test a wrong order");

  const wrongOrder = [correctTokens[correctTokens.length - 1], ...correctTokens.slice(0, correctTokens.length - 1)];
  await clickSentenceTokens(page, wrongOrder);
  await page.getByTestId("sentence-submit-button").click();
  await expect(page.getByTestId("feedback-incorrect")).toBeVisible();

  await expectNoConsoleErrors(errors);
});
