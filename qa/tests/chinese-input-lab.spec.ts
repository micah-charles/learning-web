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
const canonicalDataset = JSON.parse(readFileSync(new URL("../../learning-data/chinese-input/canonical/canonical_characters.json", import.meta.url), "utf8"));
const canonicalByGlyph = new Map(canonicalDataset.characters.map((character) => [character.character, character]));

function codeForGlyph(glyph: string, method: "cangjie" | "quick") {
  return characterByGlyph.get(glyph)?.[method]?.preferredCode
    || canonicalByGlyph.get(glyph)?.[method]
    || "";
}

async function openLab(page: Page) {
  await seedEverythingMode(page);
  await page.goto("/chinese-input", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("chinese-input-page")).toBeVisible();
}

async function installSpeechSynthesisMock(page: Page) {
  await page.addInitScript(() => {
    class MockSpeechSynthesisUtterance {
      text: string;
      lang = "";
      rate = 1;
      voice: unknown = null;

      constructor(text: string) {
        this.text = text;
      }
    }
    const voices = [
      { name: "Mock Cantonese", lang: "zh-HK" },
      { name: "Mock Taiwan Mandarin", lang: "zh-TW" },
    ];
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: MockSpeechSynthesisUtterance,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        speaking: false,
        pending: false,
        getVoices: () => voices,
        speak: (utterance: MockSpeechSynthesisUtterance) => {
          (window as any).__chineseInputSpoken.push({ text: utterance.text, lang: utterance.lang });
        },
        cancel: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
    (window as any).__chineseInputSpoken = [];
  });
}

async function answerCurrentQuestion(page: Page) {
  const glyph = (await page.locator(".cil-question-character").innerText()).trim();
  const methodText = await page.locator(".cil-lesson-header .lw-eyebrow").innerText();
  const method = methodText.includes("Quick") ? "quick" : "cangjie";
  const code = codeForGlyph(glyph, method);
  if (!code) throw new Error(`No ${method} code for visible character ${glyph}`);
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
  const inactiveKeys = page.locator("[data-key-state='inactive']");
  const activeKeys = page.locator("[data-key-state='learned']");
  await expect(inactiveKeys.first()).toHaveCSS("background-color", "rgb(215, 220, 218)");
  await expect(activeKeys.first()).toHaveCSS("background-color", "rgb(223, 242, 234)");
  expect(await inactiveKeys.count() + await activeKeys.count()).toBe(26);
  await expect(page.locator("[data-key-state='expected']")).toHaveCount(0);
  await expect(page.getByTestId("chinese-input-question-type")).toHaveText("Root recognition");

  const firstGlyph = (await page.locator(".cil-question-character").innerText()).trim();
  const expectedKey = codeForGlyph(firstGlyph, "cangjie");
  if (!expectedKey) throw new Error(`No expected key for ${firstGlyph}`);
  const hintToggle = page.getByTestId("chinese-input-hint-toggle");
  await expect(hintToggle).toHaveText("Hint: Off");
  await expect(hintToggle).toHaveAttribute("aria-pressed", "false");
  await hintToggle.click();
  await expect(hintToggle).toHaveText("Hint: On");
  await expect(page.getByTestId(`chinese-input-key-${expectedKey}`)).toHaveAttribute("data-key-state", "expected");
  await expect(page.getByTestId(`chinese-input-key-${expectedKey}`)).toHaveCSS("background-color", "rgb(255, 224, 138)");
  await hintToggle.click();
  await expect(page.locator("[data-key-state='expected']")).toHaveCount(0);
  await page.keyboard.press(expectedKey);
  await expect(page.getByTestId("chinese-input-feedback")).toHaveText(`Correct: ${firstGlyph} is mapped to ${expectedKey}.`);
  await expect(page.getByRole("heading", { name: "Canonical input sequence" })).toHaveCount(0);
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("chinese-input-feedback")).toHaveCount(0);
  await expect(page.locator(".cil-lesson-progress")).toHaveAttribute("aria-label", /Question 2 of \d+/);
  await expect(page.getByTestId("chinese-input-question-type")).toHaveText("Guided typing");

  const secondGlyph = (await page.locator(".cil-question-character").innerText()).trim();
  const pointerCode = codeForGlyph(secondGlyph, "cangjie");
  if (!pointerCode) throw new Error(`No pointer code for ${secondGlyph}`);
  for (const key of pointerCode) await page.getByTestId(`chinese-input-key-${key}`).click();
  await expect(page.getByTestId("chinese-input-feedback")).toContainText("Correct");
  await expect(page.getByTestId("chinese-input-submit")).toHaveCount(0);
  await expectNoConsoleErrors(errors);
});

test("generated curriculum keeps root recognition separate from multi-key guided typing", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openLab(page);
  test.skip(
    !(await page.getByTestId("chinese-input-preview-warning").isVisible()),
    "Generated-preview curriculum only",
  );
  await page.getByRole("button", { name: "Lessons" }).click();
  await page.locator(".cil-lesson-card").first().getByRole("button", { name: /^Start|^Practise/ }).click();

  await expect(page.getByTestId("chinese-input-question-type")).toHaveText("Root recognition");
  const rootGlyph = (await page.getByTestId("chinese-input-root-glyph").innerText()).trim();
  const rootKey = canonicalByGlyph.get(rootGlyph)?.cangjie;
  if (!rootKey || rootKey.length !== 1) throw new Error(`No one-key canonical root mapping for ${rootGlyph}`);
  await page.getByTestId(`chinese-input-key-${rootKey}`).click();
  await expect(page.getByTestId("chinese-input-feedback")).toHaveText(`Correct: ${rootGlyph} is mapped to ${rootKey}.`);
  await expect(page.getByRole("heading", { name: "Canonical input sequence" })).toHaveCount(0);

  await page.getByTestId("chinese-input-next").click();
  await expect(page.getByTestId("chinese-input-question-type")).toHaveText("Guided typing");
  const characterGlyph = (await page.locator(".cil-question-character").innerText()).trim();
  const fullCode = canonicalByGlyph.get(characterGlyph)?.cangjie || "";
  if (fullCode.length < 2) throw new Error(`Expected a multi-key generated character, received ${characterGlyph} = ${fullCode}`);
  await page.getByTestId(`chinese-input-key-${fullCode[0]}`).click();
  await expect(page.getByTestId("chinese-input-buffer")).toHaveText(fullCode[0]);
  await expect(page.getByTestId("chinese-input-feedback")).toHaveCount(0);
  for (const key of fullCode.slice(1)) await page.getByTestId(`chinese-input-key-${key}`).click();
  await expect(page.getByTestId("chinese-input-feedback")).toContainText(`Correct: ${characterGlyph}`);
  await expect(page.getByRole("heading", { name: "Canonical input sequence" })).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("football pronounces each target and the goalkeeper saves the typed lesson character", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await installSpeechSynthesisMock(page);
  await openLab(page);
  test.skip(
    await page.getByTestId("chinese-input-preview-warning").isVisible(),
    "Legacy seed lesson and target contract only",
  );
  await page.getByRole("button", { name: "Lessons" }).click();
  await page.getByRole("button", { name: "Play football for Keyboard tour" }).click();

  const game = page.getByTestId("chinese-football-game");
  await expect(game).toBeVisible();
  expect(await game.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  const targets = game.locator(".cil-football-target");
  await expect(targets).toHaveCount(9);
  const occupiedTargets = targets.filter({ has: page.locator("strong") });
  await expect(occupiedTargets).toHaveCount(4);
  expect((await occupiedTargets.locator("strong").allInnerTexts()).map((value) => value.trim()).sort()).toEqual(
    ["日", "尸", "木", "火"].sort(),
  );

  const highlighted = game.locator(".cil-football-target.is-target strong");
  const targetGlyph = (await highlighted.innerText()).trim();
  const code = codeForGlyph(targetGlyph, "cangjie");
  if (!code) throw new Error(`No Keyboard tour code found for ${targetGlyph}`);
  await expect.poll(() => page.evaluate(() => (window as any).__chineseInputSpoken.at(-1))).toEqual({
    text: targetGlyph,
    lang: "zh-HK",
  });
  const spokenCount = await page.evaluate(() => (window as any).__chineseInputSpoken.length);
  await page.getByTestId("chinese-football-pronounce").click();
  await expect.poll(() => page.evaluate(() => (window as any).__chineseInputSpoken.length)).toBe(spokenCount + 1);
  await expect.poll(() => page.evaluate(() => (window as any).__chineseInputSpoken.at(-1))).toEqual({
    text: targetGlyph,
    lang: "zh-HK",
  });

  await expect(game.locator(".cil-football-stadium")).toHaveClass(/is-active/, { timeout: 2_000 });
  for (const key of code) await page.keyboard.press(key);
  const stadium = game.locator(".cil-football-stadium");
  await expect(stadium).toHaveClass(/is-result/);
  await expect(stadium).toHaveClass(/is-save/);
  await expect(stadium).toHaveAttribute("style", /--target-[xy]: \d+%/);
  await expect(page.getByTestId("chinese-football-feedback")).toContainText("SAVE!");

  const stored = await readStoredState(page);
  const event = stored.progress.chineseInputLab.attemptEvents.at(-1);
  expect(event.lessonId).toBe("cj-orientation-01");
  expect(event.correct).toBe(true);
  await expectNoConsoleErrors(errors);
});

test("repeated keys stay in the guided typing buffer and wrong order has specific feedback", async ({ page }) => {
  await page.addInitScript(() => {
    Date.now = () => 75_000;
  });
  await openLab(page);
  test.skip(
    await page.getByTestId("chinese-input-preview-warning").isVisible(),
    "Legacy seed repeated-key challenge contract only",
  );
  await page.getByRole("button", { name: "Lessons" }).click();
  const challenge = page.locator(".cil-lesson-card").filter({ hasText: "Cangjie typing challenge" });
  await challenge.getByRole("button", { name: /Start|Practise/ }).click();
  await page.getByTestId("chinese-input-key-D").click();
  await page.getByTestId("chinese-input-key-D").click();
  await expect(page.getByTestId("chinese-input-buffer")).toContainText("DD");

  if (await page.getByTestId("chinese-input-feedback").isVisible()) {
    await page.keyboard.press("Enter");
  } else {
    await page.getByRole("button", { name: "Clear" }).click();
  }
  const glyph = (await page.locator(".cil-question-character").innerText()).trim();
  const code = codeForGlyph(glyph, "cangjie");
  const reversed = Array.from(code).reverse();
  for (const key of reversed) await page.getByTestId(`chinese-input-key-${key}`).click();
  if (await page.getByTestId("chinese-input-submit").isVisible()) {
    await page.getByTestId("chinese-input-submit").click();
  }
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

test("Quick teaches the standard first-and-last code for 的 instead of the Rime X shortcut", async ({ page }) => {
  const errors = collectConsoleErrors(page);
  await openLab(page);
  test.skip(
    !(await page.getByTestId("chinese-input-preview-warning").isVisible()),
    "Generated-preview curriculum only",
  );
  expect(canonicalByGlyph.get("的")?.cangjie).toBe("HAPI");
  expect(canonicalByGlyph.get("的")?.quick).toBe("HI");

  await page.getByRole("button", { name: "Quick 速成" }).click();
  await page.getByRole("button", { name: "Lessons" }).click();
  const possessiveParticleLesson = page.locator(".cil-lesson-card").filter({ hasText: "Quick first/last-key practice 19" });
  await possessiveParticleLesson.getByRole("button", { name: /Start|Practise/ }).click();

  await expect(page.locator(".cil-question-character")).toHaveText("的");
  await page.getByTestId("chinese-input-hint-toggle").click();
  await expect(page.getByTestId("chinese-input-key-H")).toHaveAttribute("data-key-state", "expected");
  await page.getByTestId("chinese-input-key-H").click();
  await expect(page.getByTestId("chinese-input-buffer")).toHaveText("H");
  await expect(page.getByTestId("chinese-input-feedback")).toHaveCount(0);
  await expect(page.getByTestId("chinese-input-key-I")).toHaveAttribute("data-key-state", "expected");
  await page.getByTestId("chinese-input-key-I").click();
  await expect(page.getByTestId("chinese-input-feedback")).toContainText("Correct: 的 = H I.");
  await expectNoConsoleErrors(errors);
});

test("pronunciation locale and auto-pronounce preferences persist", async ({ page }) => {
  await installSpeechSynthesisMock(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate((storageKey) => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        prefs: {
          onboardingCompleted: true,
          learningMode: "everything",
          selectedInterests: ["everything"],
          selectedModules: [],
          selectedCurriculums: [],
          selectedSubjects: [],
          onboardingVersion: 1,
        },
        progress: {
          words: {},
          sessions: [],
          attemptEvents: [],
        },
      }),
    );
  }, STORAGE_KEY);
  await page.goto("/chinese-input", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("chinese-input-page")).toBeVisible();
  test.skip(
    await page.getByTestId("chinese-input-preview-warning").isVisible(),
    "Legacy seed pronunciation lesson contract only",
  );
  const localeSelect = page.getByTestId("chinese-input-pronunciation-locale");
  const autoPronounce = page.getByTestId("chinese-input-auto-pronounce");
  await expect(localeSelect).toHaveValue("zh-HK");
  await expect(autoPronounce).toBeChecked();

  await localeSelect.selectOption("zh-TW");
  await page.getByTestId("chinese-input-start-lesson").click();
  const glyph = (await page.locator(".cil-question-character").innerText()).trim();
  await expect.poll(() => page.evaluate(() => (window as any).__chineseInputSpoken.at(-1))).toEqual({
    text: glyph,
    lang: "zh-TW",
  });

  await page.getByRole("button", { name: "Exit lesson" }).click();
  await autoPronounce.uncheck();
  await page.evaluate(() => {
    (window as any).__chineseInputSpoken = [];
  });
  const keyboardTour = page.locator(".cil-lesson-card").filter({ hasText: "Keyboard tour" });
  await keyboardTour.getByRole("button", { name: /Start|Practise/ }).click();
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => (window as any).__chineseInputSpoken)).toEqual([]);

  await page.getByRole("button", { name: "Exit lesson" }).click();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(localeSelect).toHaveValue("zh-TW");
  await expect(autoPronounce).not.toBeChecked();
  const stored = await readStoredState(page);
  expect(stored.prefs.chineseInputLab.locale).toBe("zh-TW");
  expect(stored.prefs.chineseInputLab.autoPronounce).toBe(false);
});

test("adaptive review starts with a weak or due character", async ({ page }) => {
  await openLab(page);
  test.skip(
    await page.getByTestId("chinese-input-preview-warning").isVisible(),
    "Legacy seed adaptive-review setup contract only",
  );
  await page.getByRole("button", { name: "Lessons" }).click();
  const challenge = page.locator(".cil-lesson-card").filter({ hasText: "Cangjie typing challenge" });
  await challenge.getByRole("button", { name: /Start|Practise/ }).click();
  const glyph = (await page.locator(".cil-question-character").innerText()).trim();
  const expected = codeForGlyph(glyph, "cangjie");
  const wrongKey = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ").find((key) => key !== expected[0]) || "A";
  await page.getByTestId(`chinese-input-key-${wrongKey}`).click();
  if (await page.getByTestId("chinese-input-submit").isVisible()) {
    await page.getByTestId("chinese-input-submit").click();
  }
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
  await expect(page.getByTestId("chinese-input-dashboard")).toBeVisible();
  test.skip(
    await page.getByTestId("chinese-input-preview-warning").isVisible(),
    "Legacy seed completion and migration contract only",
  );
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
  const firstKey = page.locator("[data-key-state='learned']").first();
  await firstKey.focus();
  await expect(firstKey).toBeFocused();
});

test("world home exposes one recommendation and Flower navigation", async ({ page }) => {
  await openLab(page);
  await expect(page.getByTestId("chinese-input-recommendation")).toBeVisible();
  await expect(page.getByTestId("chinese-input-start-lesson")).toBeVisible();
  await expect(page.getByTestId("chinese-input-knowledge-world")).toBeVisible();

  await page.getByRole("button", { name: "Open learning navigation" }).click();
  const menu = page.getByRole("menu", { name: "Learning actions" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Journey" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Arena" })).toBeVisible();

  await menu.getByRole("menuitem", { name: "Explore" }).click();
  await expect(page.getByRole("dialog", { name: /Explore the Knowledge World/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /Explore the Knowledge World/ })).toBeHidden();

  const flowerTrigger = page.getByRole("button", { name: "Open learning navigation" });
  await flowerTrigger.click();
  await page.keyboard.press("Escape");
  await expect(flowerTrigger).toBeFocused();
});

test("Flower can be dragged to a new viewport position", async ({ page }) => {
  await openLab(page);
  const flower = page.getByTestId("learning-flower");
  const centre = page.getByRole("button", { name: "Open learning navigation" });
  const before = await flower.boundingBox();
  expect(before).not.toBeNull();
  await centre.hover();
  await page.mouse.down();
  await page.mouse.move(180, 180, { steps: 4 });
  await page.mouse.up();
  const after = await flower.boundingBox();
  expect(after).not.toBeNull();
  expect(after!.x).not.toBeCloseTo(before!.x, 0);
  expect(after!.y).not.toBeCloseTo(before!.y, 0);
  await expect(centre).toHaveAttribute("aria-expanded", "false");
});

test("lesson pause exposes a resumable local checkpoint", async ({ page }) => {
  await openLab(page);
  await page.getByTestId("chinese-input-start-lesson").click();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByTestId("chinese-input-session-paused")).toBeVisible();
  const stored = await readStoredState(page);
  expect(stored.progress.chineseInputLab.activeSession.status).toBe("paused");
  await page.getByRole("button", { name: "Resume session" }).click();
  await expect(page.getByTestId("chinese-input-lesson-player")).toBeVisible();
});
