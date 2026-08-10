import { test, expect, type Page } from "@playwright/test";
import { seedEverythingMode } from "../fixtures/ui-helpers";

const VIEWPORTS = [
  { name: "desktop-1920", width: 1920, height: 1080 },
  { name: "desktop-1600", width: 1600, height: 900 },
  { name: "laptop-1366", width: 1366, height: 768 },
  { name: "ipad-landscape", width: 1024, height: 768 },
  { name: "ipad-portrait", width: 768, height: 1024 },
  { name: "mobile-landscape", width: 844, height: 390 },
  { name: "mobile-portrait", width: 390, height: 844 },
] as const;

async function openLesson(page: Page, viewport: (typeof VIEWPORTS)[number]) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await seedEverythingMode(page);
  await page.goto("/chinese-input", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("chinese-input-dashboard")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /Start Adventure/ }).click();
  await expect(page.getByTestId("chinese-input-lesson-player")).toBeVisible({ timeout: 15_000 });
}

async function completeCurrentLesson(page: Page) {
  await page.getByTestId("chinese-input-hint-toggle").click();
  for (let question = 0; question < 30; question += 1) {
    for (let keypress = 0; keypress < 6 && !(await page.getByTestId("chinese-input-feedback").isVisible()); keypress += 1) {
      const expected = page.locator('[data-key-state="expected"]');
      await expect(expected).toHaveCount(1);
      await expected.click();
    }
    await expect(page.getByTestId("chinese-input-feedback")).toBeVisible();
    const nextButton = page.getByTestId("chinese-input-next");
    const isFinalQuestion = (await nextButton.innerText()).includes("Finish");
    await nextButton.click();
    if (isFinalQuestion) break;
  }
  await expect(page.getByTestId("chinese-input-session-summary")).toBeVisible();
}

test("lesson gameplay stays in one viewport at every supported size", async ({ page }, testInfo) => {
  for (const viewport of VIEWPORTS) {
    await openLesson(page, viewport);

    const layout = await page.evaluate(() => ({
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: {
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      },
      keyboard: document.querySelector<HTMLElement>('[data-testid="chinese-input-keyboard"]')?.getBoundingClientRect(),
      submit: document.querySelector<HTMLElement>('[data-testid="chinese-input-submit"]')?.getBoundingClientRect(),
      character: document.querySelector<HTMLElement>('.cil-question-character, .cil-root-glyph')?.getBoundingClientRect(),
      progress: document.querySelector<HTMLElement>('.cil-lesson-progress')?.getBoundingClientRect(),
      banner: document.querySelector<HTMLElement>('[data-testid="chinese-input-lesson-banner"]')?.getBoundingClientRect(),
    }));

    const withinViewport = (box: DOMRect | undefined) => {
      expect(box, `${viewport.name}: expected element bounds`).toBeTruthy();
      expect(box!.left, `${viewport.name}: element clips left`).toBeGreaterThanOrEqual(-1);
      expect(box!.right, `${viewport.name}: element clips right`).toBeLessThanOrEqual(layout.viewport.width + 1);
      expect(box!.top, `${viewport.name}: element clips top`).toBeGreaterThanOrEqual(-1);
      expect(box!.bottom, `${viewport.name}: element clips bottom`).toBeLessThanOrEqual(layout.viewport.height + 1);
    };

    expect(layout.document.scrollHeight, `${viewport.name}: vertical page scroll`).toBeLessThanOrEqual(layout.viewport.height + 1);
    expect(layout.document.scrollWidth, `${viewport.name}: horizontal page scroll`).toBeLessThanOrEqual(layout.viewport.width + 1);
    withinViewport(layout.keyboard);
    withinViewport(layout.submit);
    withinViewport(layout.character);
    withinViewport(layout.progress);
    withinViewport(layout.banner);

    await testInfo.attach(`chinese-input-one-screen-${viewport.name}.png`, {
      body: await page.screenshot({ fullPage: false }),
      contentType: "image/png",
    });
  }
});

test("lesson completion celebrates the knowledge gained and offers meaningful next steps", async ({ page }, testInfo) => {
  await openLesson(page, VIEWPORTS[2]);
  const firstLessonTitle = await page.getByTestId("chinese-input-lesson-banner").locator("h2").innerText();
  await completeCurrentLesson(page);
  await expect(page.getByTestId("chinese-input-knowledge-unlocked")).toBeVisible();
  await expect(page.getByText(/Knowledge unlocked!/)).toBeVisible();
  await expect(page.getByText(/Continue journey/)).toBeVisible();
  await expect(page.getByText(/Practice new characters/)).toBeVisible();
  await expect(page.getByText(/Return to Kingdom/)).toBeVisible();
  await expect(page.getByTestId("chinese-input-collection-progress")).toBeVisible();
  await testInfo.attach("chinese-input-lesson-completed.png", {
    body: await page.screenshot({ fullPage: false }),
    contentType: "image/png",
  });
  const completedLessonTitle = await page.getByTestId("chinese-input-lesson-player").count();
  expect(completedLessonTitle).toBe(0);
  await page.getByRole("button", { name: /Continue journey/ }).click();
  await expect(page.getByTestId("chinese-input-lesson-player")).toBeVisible();
  await expect(page.getByTestId("chinese-input-lesson-banner").locator("h2")).not.toHaveText(firstLessonTitle);
});

test("Practice new characters launches Goalkeeper directly with the lesson pool", async ({ page }) => {
  await openLesson(page, VIEWPORTS[2]);
  await completeCurrentLesson(page);
  await page.getByRole("button", { name: /Practice new characters/ }).click();
  await expect(page.getByTestId("chinese-football-game")).toBeVisible();
  await expect(page.getByText(/Current Journey/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Pronounce target" })).toBeVisible();
  await page.getByRole("button", { name: "Exit game to Kingdom" }).click();
  await expect(page.getByTestId("chinese-input-dashboard")).toBeVisible();
});
