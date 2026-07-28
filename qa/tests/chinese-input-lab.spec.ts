import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  STORAGE_KEY,
  collectConsoleErrors,
  expectNoConsoleErrors,
  readStoredState,
  seedEverythingMode,
} from "../fixtures/ui-helpers";

const seedDataset = JSON.parse(readFileSync(new URL("../../src/features/chinese-input/data/seed-dataset.json", import.meta.url), "utf8"));
const characterByGlyph = new Map(seedDataset.characters.map((character) => [character.char, character]));

async function openLab(page: Page) {
  await seedEverythingMode(page);
  await page.goto("/chinese-input", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("chinese-input-page")).toBeVisible();
}

async function answerCurrentQuestion(page: Page) {
  const glyph = (await page.locator(".cil-question-character").innerText()).trim();
  const character = characterByGlyph.get(glyph);
  if (!character) throw new Error(`No seed record for visible character ${glyph}`);
  const methodText = await page.locator(".cil-lesson-header .lw-eyebrow").innerText();
  const method = methodText.includes("Quick") ? "quick" : "cangjie";
  const code = character[method].preferredCode;
  for (const key of Array.from(code)) {
    await page.getByTestId(`chinese-input-key-${key}`).click();
  }
  if (await page.getByTestId("chinese-input-submit").isVisible()) {
    await page.getByTestId("chinese-input-submit").click();
  }
  await expect(page.getByTestId("chinese-input-feedback")).toBeVisible();
}

test("direct route is discoverable and first lesson supports physical and pointer input", async ({ page }, testInfo) => {
  const errors = collectConsoleErrors(page);
  await openLab(page);

  await expect(page.getByTestId("nav-chinese-input").first()).toBeAttached();
  await expect(page.getByRole("heading", { name: "Chinese Input Lab" })).toBeVisible();
  await page.getByRole("button", { name: "Root Explorer" }).click();
  await page.keyboard.press("B");
  await expect(page.getByRole("heading", { name: "B · Moon" })).toBeVisible();
  await page.getByRole("button", { name: "Chinese Input dashboard" }).click();
  const mobileProject = testInfo.project.name.includes("mobile");
  await page.screenshot({
    path: `artifacts/chinese-input-lab-${mobileProject ? "mobile" : "desktop"}.png`,
    fullPage: !mobileProject,
  });
  await page.getByTestId("chinese-input-start-lesson").click();
  await expect(page.getByTestId("chinese-input-lesson-player")).toBeVisible();
  await expect(page.locator("[data-key-state='inactive']")).toHaveCount(22);

  const firstGlyph = (await page.locator(".cil-question-character").innerText()).trim();
  const expectedKey = characterByGlyph.get(firstGlyph)?.cangjie.preferredCode;
  if (!expectedKey) throw new Error(`No expected key for ${firstGlyph}`);
  await page.keyboard.press(expectedKey);
  await expect(page.getByTestId("chinese-input-feedback")).toContainText("Correct");
  await page.getByTestId("chinese-input-next").click();

  const secondGlyph = (await page.locator(".cil-question-character").innerText()).trim();
  const pointerKey = characterByGlyph.get(secondGlyph)?.cangjie.preferredCode;
  if (!pointerKey) throw new Error(`No pointer key for ${secondGlyph}`);
  await page.getByTestId(`chinese-input-key-${pointerKey}`).click();
  await page.getByTestId("chinese-input-submit").click();
  await expect(page.getByTestId("chinese-input-feedback")).toContainText("Correct");
  await expectNoConsoleErrors(errors);
});

test("repeated keys stay in the guided typing buffer and wrong order has specific feedback", async ({ page }) => {
  await openLab(page);
  await page.getByRole("button", { name: "Lessons" }).click();
  const challenge = page.locator(".cil-lesson-card").filter({ hasText: "Cangjie typing challenge" });
  await challenge.getByRole("button", { name: /Start|Practise/ }).click();
  await page.getByTestId("chinese-input-key-D").click();
  await page.getByTestId("chinese-input-key-D").click();
  await expect(page.getByTestId("chinese-input-buffer")).toContainText("DD");

  await page.getByRole("button", { name: "Clear" }).click();
  const glyph = (await page.locator(".cil-question-character").innerText()).trim();
  const code = characterByGlyph.get(glyph)?.cangjie.preferredCode || "";
  const reversed = Array.from(code).reverse();
  for (const key of reversed) await page.getByTestId(`chinese-input-key-${key}`).click();
  await page.getByTestId("chinese-input-submit").click();
  const feedback = page.getByTestId("chinese-input-feedback");
  await expect(feedback).toBeVisible();
  if (code.length > 1 && reversed.join("") !== code) {
    await expect(feedback).toContainText("wrong order");
  }
});

test("guided preferences can hide discovery while the direct route remains available", async ({ page }) => {
  await page.addInitScript((storageKey) => {
    window.localStorage.setItem(storageKey, JSON.stringify({
      prefs: {
        onboardingCompleted: true,
        learningMode: "guided",
        selectedInterests: ["overview"],
        selectedModules: ["home", "quiz"],
        selectedCurriculums: [],
        selectedSubjects: [],
        onboardingVersion: 1,
      },
      progress: { words: {}, sessions: [], attemptEvents: [] },
    }));
  }, STORAGE_KEY);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("nav-chinese-input")).toHaveCount(0);
  await page.goto("/chinese-input", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("chinese-input-page")).toBeVisible();
});

test("Quick attempts are stored in method-specific mastery", async ({ page }) => {
  await openLab(page);
  await page.getByRole("button", { name: "Quick 速成" }).click();
  await page.getByTestId("chinese-input-start-lesson").click();
  await answerCurrentQuestion(page);
  const stored = await readStoredState(page);
  const event = stored.progress.chineseInputLab.attemptEvents.at(-1);
  expect(event.method).toBe("quick");
  const mastery = stored.progress.chineseInputLab.characters[event.characterId];
  expect(mastery.quick.attempts).toBe(1);
  expect(mastery.cangjie.attempts).toBeUndefined();
});

test("adaptive review starts with a weak or due character", async ({ page }) => {
  await openLab(page);
  await page.getByRole("button", { name: "Lessons" }).click();
  const challenge = page.locator(".cil-lesson-card").filter({ hasText: "Cangjie typing challenge" });
  await challenge.getByRole("button", { name: /Start|Practise/ }).click();
  const glyph = (await page.locator(".cil-question-character").innerText()).trim();
  const expected = characterByGlyph.get(glyph)?.cangjie.preferredCode || "";
  const wrongKey = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ").find((key) => key !== expected[0]) || "A";
  await page.getByTestId(`chinese-input-key-${wrongKey}`).click();
  await page.getByTestId("chinese-input-submit").click();
  await expect(page.getByTestId("chinese-input-feedback")).toBeVisible();
  await page.getByRole("button", { name: "Exit lesson" }).click();
  await page.getByRole("button", { name: "Chinese Input dashboard" }).click();
  await page.getByRole("button", { name: /^Review / }).click();
  await page.getByRole("button", { name: "Start adaptive review (1)" }).click();
  await expect(page.locator(".cil-question-character")).toHaveText(glyph);
});

test("completed lesson persists and old stored state migrates without resetting other progress", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate((storageKey) => {
    window.localStorage.setItem(storageKey, JSON.stringify({
      prefs: {
        onboardingCompleted: true,
        learningMode: "everything",
        selectedInterests: ["everything"],
        selectedModules: [],
        selectedCurriculums: [],
        selectedSubjects: [],
        onboardingVersion: 1,
      },
      progress: { words: {}, sessions: [], attemptEvents: [] },
    }));
  }, STORAGE_KEY);
  await page.goto("/chinese-input", { waitUntil: "domcontentloaded" });
  await page.getByTestId("chinese-input-start-lesson").click();
  for (let index = 0; index < 10; index += 1) {
    await answerCurrentQuestion(page);
    await page.getByTestId("chinese-input-next").click();
  }
  await expect(page.getByTestId("chinese-input-session-summary")).toBeVisible();
  let stored = await readStoredState(page);
  expect(stored.progress.chineseInputLab.sessions).toHaveLength(1);
  expect(stored.progress.chineseInputLab.attemptEvents).toHaveLength(10);

  await page.reload({ waitUntil: "domcontentloaded" });
  stored = await readStoredState(page);
  expect(stored.progress.chineseInputLab.lessons["cj-orientation-01"].status).toBe("completed");

  await page.evaluate((storageKey) => {
    window.localStorage.setItem(storageKey, JSON.stringify({
      prefs: { onboardingCompleted: true, learningMode: "everything", quiz: { datasetId: "kept-pack" } },
      progress: { words: { kept: { correct: 3 } } },
    }));
  }, STORAGE_KEY);
  await page.goto("/chinese-input", { waitUntil: "domcontentloaded" });
  const migrated = await readStoredState(page);
  expect(migrated.prefs.quiz.datasetId).toBe("kept-pack");
  expect(migrated.progress.words.kept.correct).toBe(3);
  expect(migrated.progress.chineseInputLab.schemaVersion).toBe(1);
});

test("mobile keyboard does not overflow and unknown query falls back safely", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile-only layout assertion");
  await openLab(page);
  await page.goto("/chinese-input?view=unknown&method=unknown", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("chinese-input-dashboard")).toBeVisible();
  await page.getByTestId("chinese-input-start-lesson").click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const firstKey = page.getByTestId("chinese-input-key-A");
  await firstKey.focus();
  await expect(firstKey).toBeFocused();
});
