import { test, expect, type Page } from "@playwright/test";
import {
  collectConsoleErrors,
  expectNoConsoleErrors,
  readStoredState,
  seedEverythingMode,
} from "../fixtures/ui-helpers";

async function openKingdom(page: Page) {
  await seedEverythingMode(page);
  await page.goto("/chinese-input", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("chinese-input-dashboard")).toBeVisible();
}

async function openFlower(page: Page) {
  await page.getByRole("button", { name: "Open Floating Flower navigation" }).click();
  await expect(page.getByRole("menu", { name: "Chinese Input Kingdom actions" })).toBeVisible();
}

async function installSpeechSynthesisMock(page: Page) {
  await page.addInitScript(() => {
    class MockUtterance {
      text: string;
      lang = "";
      rate = 1;
      voice: unknown = null;
      constructor(text: string) { this.text = text; }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: MockUtterance });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [{ name: "Mock Cantonese", lang: "zh-HK" }],
        speak: (utterance: MockUtterance) => (window as any).__spoken.push({ text: utterance.text, lang: utterance.lang }),
        cancel: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
    (window as any).__spoken = [];
  });
}

test("Kingdom presents one advisory journey and preserves platform navigation", async ({ page }, testInfo) => {
  const errors = collectConsoleErrors(page);
  await openKingdom(page);

  await expect(page.getByRole("heading", { name: "Chinese Input Kingdom" })).toBeVisible();
  await expect(page.getByTestId("nav-chinese-input")).toBeAttached();
  await expect(page.getByTestId("chinese-input-today-journey")).toHaveCount(1);
  await expect(page.getByText("Ready", { exact: true })).toBeVisible();
  await expect(page.getByText("Always available")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Begin journey" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Open root workbench" })).toBeEnabled();

  const mobile = testInfo.project.name.includes("mobile");
  await page.screenshot({
    path: `artifacts/chinese-input-kingdom-${mobile ? "mobile" : "desktop"}.png`,
    fullPage: !mobile,
  });
  await expectNoConsoleErrors(errors);
});

test("Floating Flower supports pointer, F, Escape and all eight actions", async ({ page }) => {
  await openKingdom(page);
  await openFlower(page);
  for (const name of ["Continue", "Explore", "Review", "Football", "Collection", "Keyboard", "Progress", "Search"]) {
    await expect(page.getByRole("menuitem", { name })).toBeVisible();
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Close Floating Flower" })).toHaveCount(0);
  await page.keyboard.press("f");
  await expect(page.getByRole("button", { name: "Close Floating Flower" })).toBeVisible();
  await page.getByRole("menuitem", { name: "Explore" }).click();
  await expect(page.getByRole("dialog", { name: "Explore the Knowledge World" })).toBeVisible();
  await expect(page.getByRole("button", { name: /A key, Cangjie root 日/ })).toBeEnabled();
  await page.getByRole("button", { name: "Return to Kingdom" }).click();
  await expect(page.getByRole("dialog", { name: "Explore the Knowledge World" })).toHaveCount(0);
});

test("accessible list view exposes equivalent actions without the map", async ({ page }) => {
  await openKingdom(page);
  await page.getByRole("button", { name: "Show accessible action list" }).click();
  await expect(page.getByRole("navigation", { name: "Chinese Input Kingdom actions" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Football Challenge/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Show illustrated world" })).toBeVisible();
  const stored = await readStoredState(page);
  expect(stored.prefs.chineseInputLab.accessibleListView).toBe(true);
});

test("football challenge pools launch with pronunciation controls", async ({ page }) => {
  await installSpeechSynthesisMock(page);
  await openKingdom(page);
  await openFlower(page);
  await page.getByRole("menuitem", { name: "Football" }).click();
  const dialog = page.getByRole("dialog", { name: "Choose a Football Challenge" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button")).toHaveCount(10);
  await dialog.getByRole("button", { name: /Current Journey/ }).click();
  await expect(page.getByTestId("chinese-football-game")).toBeVisible();
  await expect(page.getByRole("button", { name: /Pronounce target/ })).toBeVisible();
  await page.getByRole("button", { name: /Pronounce target/ }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__spoken.length)).toBeGreaterThan(0);
  await expect(page.getByText("Current journey", { exact: true })).toBeVisible();
  await expect(page.getByText(/^Lesson \d/)).toHaveCount(0);
});

test("method, root and companion preferences persist without locking journeys", async ({ page }) => {
  await openKingdom(page);
  await page.getByRole("button", { name: "Quick" }).click();
  await page.getByRole("button", { name: "Open root workbench" }).click();
  await page.getByTestId("chinese-input-key-B").click();
  await page.getByRole("button", { name: "Return to Kingdom" }).click();
  await page.getByRole("button", { name: "Minimise companion advice" }).click();
  const stored = await readStoredState(page);
  expect(stored.prefs.chineseInputLab.method).toBe("quick");
  expect(stored.prefs.chineseInputLab.currentRootKey).toBe("B");
  expect(stored.prefs.chineseInputLab.companionMinimized).toBe(true);
  expect(stored.progress.chineseInputLab.discoveredNodes["root-b"].kind).toBe("root");
  await expect(page.getByRole("button", { name: "Quick" })).toHaveClass(/is-active/);
  await expect(page.getByRole("button", { name: "Show companion advice" })).toBeVisible();
  await expect(page.getByTestId("chinese-input-start-lesson")).toBeEnabled();
});

test("Kingdom has no horizontal overflow at supported breakpoints", async ({ page }, testInfo) => {
  await openKingdom(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `${testInfo.project.name} horizontal overflow`).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Open Floating Flower navigation" }).click();
  const flowerBox = await page.getByTestId("chinese-input-flower").boundingBox();
  expect(flowerBox).not.toBeNull();
  expect(flowerBox!.x).toBeGreaterThanOrEqual(0);
  expect(flowerBox!.x + flowerBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
});
