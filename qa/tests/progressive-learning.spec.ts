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

test("@data-sample progressive learning supports listen voice practice feedback and builder speak-on-tap help", async ({ page }) => {
  await page.addInitScript(() => {
    const bag = window as any;
    bag.__spokenUtterances = [];
    bag.__nextSpeechTranscript = "";
    bag.__nextSpeechConfidence = 0.96;

    class FakeUtterance {
      constructor(text) {
        this.text = text;
        this.lang = "";
        this.rate = 1;
        this.voice = null;
      }
    }

    class FakeSpeechRecognition {
      constructor() {
        this.continuous = false;
        this.interimResults = false;
        this.maxAlternatives = 1;
        this.lang = "en-GB";
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
      }

      start() {
        const bag = window as any;
        setTimeout(() => {
          this.onresult?.({
            results: [
              [
                {
                  transcript: bag.__nextSpeechTranscript,
                  confidence: bag.__nextSpeechConfidence,
                },
              ],
            ],
          });
          this.onend?.();
        }, 0);
      }

      stop() {
        this.onend?.();
      }
    }

    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: FakeUtterance,
      configurable: true,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        speaking: false,
        pending: false,
        cancel() {},
        speak(utterance) {
          const bag = window as any;
          bag.__spokenUtterances.push({ text: utterance.text, lang: utterance.lang });
        },
        getVoices() {
          return [];
        },
      },
    });
    Object.defineProperty(window, "SpeechRecognition", {
      value: FakeSpeechRecognition,
      configurable: true,
    });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      value: FakeSpeechRecognition,
      configurable: true,
    });
  });

  const { pack } = await findFirstProgressiveLesson();
  const builderRecords = (pack.sentenceBuilders || []).map((item: any, index: number) => ({
    id: item.sentenceId || `builder-${index + 1}`,
    prompt: String(item.translations?.en?.text || "").trim(),
    tiles: Array.isArray(item.translations?.de?.tiles) ? item.translations.de.tiles : String(item.translations?.de?.text || "").split(/\s+/).filter(Boolean),
  }));

  const errors = collectConsoleErrors(page);
  await openHome(page);
  await goToTab(page, "language");

  await page.getByTestId("progressive-voice-practice-toggle").check();
  await expect(page.getByTestId("progressive-listen-voice-practice-button")).toBeVisible();

  const targetText = (await page.locator(".pl-phrase-card.target .pl-phrase-text").first().innerText()).trim();
  await page.evaluate((text) => {
    const bag = window as any;
    bag.__nextSpeechTranscript = text;
    bag.__nextSpeechConfidence = 0.97;
  }, targetText);
  await page.getByTestId("progressive-listen-voice-practice-button").click();
  await expect(page.getByTestId("voice-feedback-panel")).toBeVisible();
  await expect(page.getByTestId("voice-feedback-accuracy")).toContainText("100%");
  await expect(page.getByTestId("progressive-listen-voice-practice-button")).toBeEnabled();
  await expect(page.getByTestId("progressive-listen-voice-practice-button")).toContainText("Speak again");

  await page.evaluate((text) => {
    const bag = window as any;
    bag.__nextSpeechTranscript = text;
    bag.__nextSpeechConfidence = 0.98;
  }, targetText);
  await page.getByTestId("progressive-listen-voice-practice-button").click();
  await expect(page.getByTestId("voice-feedback-accuracy")).toContainText("100%");
  await expect(page.getByTestId("progressive-listen-voice-practice-button")).toBeEnabled();

  await page.evaluate(() => {
    const bag = window as any;
    bag.__nextSpeechTranscript = "not the expected answer";
    bag.__nextSpeechConfidence = 0.96;
  });
  await page.getByTestId("progressive-listen-voice-practice-button").click();
  await expect(page.getByTestId("voice-feedback-panel")).toBeVisible();
  await expect(page.getByTestId("voice-feedback-panel")).not.toContainText(/attempts? remaining/i);
  await expect(page.getByTestId("voice-feedback-panel")).not.toContainText(/cancel/i);

  await page.getByTestId("progressive-next-step-button").click();
  if (await page.getByTestId("progressive-phase-listen").isVisible()) {
    await expect(page.getByTestId("progressive-listen-voice-practice-button")).toBeVisible();
    await expect(page.getByTestId("progressive-listen-voice-practice-button")).toBeEnabled();
    await expect(page.getByTestId("progressive-listen-voice-practice-button")).toContainText("Speak");
  }

  for (let guard = 0; guard < 20; guard += 1) {
    if (await page.getByTestId("progressive-phase-vocab").isVisible()) break;
    await page.getByTestId("progressive-next-step-button").click();
  }
  await expect(page.getByTestId("progressive-phase-vocab")).toBeVisible();

  for (let guard = 0; guard < (pack.vocabulary || []).length; guard += 1) {
    if (await page.getByTestId("progressive-phase-builder").isVisible()) break;
    const prompt = await page.locator(".question-prompt").first().innerText();
    const correct = getProgressiveVocabAnswer(pack, prompt);
    await clickOptionByText(page.getByTestId("progressive-vocab-option"), correct);
    await page.getByTestId("progressive-next-step-button").click();
  }
  await expect(page.getByTestId("progressive-phase-builder")).toBeVisible();

  const builderPrompt = await page.locator(".question-prompt").first().innerText();
  expect(findBuilderRecordForPrompt(builderPrompt, builderRecords)).toBeTruthy();

  await page.getByTestId("progressive-builder-speak-instead-toggle").check();
  await page.evaluate(() => {
    (window as any).__spokenUtterances = [];
  });

  const firstTile = page.getByTestId("progressive-builder-token").first();
  const firstTileText = (await firstTile.innerText()).trim();
  await firstTile.click();
  await expect(page.getByTestId("progressive-builder-answer-token")).toHaveCount(0);

  const spoken = await page.evaluate(() => {
    const bag = window as any;
    return bag.__spokenUtterances[bag.__spokenUtterances.length - 1] || null;
  });
  expect(spoken).toBeTruthy();
  expect(String(spoken.text || "").trim()).toBe(firstTileText);

  await expectNoConsoleErrors(errors);
});
