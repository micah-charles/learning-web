import { expect, type Locator, type Page } from "@playwright/test";

export const STORAGE_KEY = "learningGermanWeb.v1";
const TAB_READY_TEST_IDS: Record<string, string[]> = {
  language: ["lesson-step-listen", "progressive-phase-listen"],
  quiz: ["quiz-dataset-select", "quiz-session"],
  arcade: ["arcade-pack-select", "arcade-start-button"],
  vocab: ["vocab-pack-select", "vocab-card"],
  reading: ["reading-group-select", "reading-session"],
  builder: ["builder-pack-select", "builder-card"],
  "chinese-input": ["chinese-input-dashboard", "chinese-input-lesson-player"],
};

function baseEverythingState() {
  return {
    activeTab: "home",
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
      builderStats: {},
      passageStats: {},
      arcadeStats: {},
      voicePractice: {},
    },
  };
}

export async function seedEverythingMode(page: Page): Promise<void> {
  const state = baseEverythingState();
  await page.addInitScript(([storageKey, payload]) => {
    window.localStorage.setItem(storageKey as string, JSON.stringify(payload));
  }, [STORAGE_KEY, state]);
}

export async function clearAppStorage(page: Page): Promise<void> {
  await page.addInitScript((storageKey) => {
    window.localStorage.removeItem(storageKey as string);
  }, STORAGE_KEY);
}

export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });
  return errors;
}

export async function expectNoConsoleErrors(errors: string[], allowedPatterns: RegExp[] = []): Promise<void> {
  const unexpected = errors.filter((error) => !allowedPatterns.some((pattern) => pattern.test(error)));
  expect(unexpected, unexpected.join("\n")).toEqual([]);
}

async function clickFirstVisible(locator: Locator): Promise<boolean> {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible()) {
      await candidate.click();
      return true;
    }
  }
  return false;
}

async function isTabReady(page: Page, tabId: string): Promise<boolean> {
  const activeDirect = page.locator(`[data-testid="nav-${tabId}"][aria-current="page"]:visible`);
  if (await activeDirect.count()) return true;

  for (const testId of TAB_READY_TEST_IDS[tabId] || []) {
    const marker = page.locator(`[data-testid="${testId}"]:visible`);
    if (await marker.count()) {
      return true;
    }
  }

  return false;
}

async function clickTabAndWait(page: Page, locator: Locator, tabId: string): Promise<boolean> {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (!(await candidate.isVisible())) continue;
    await candidate.click();
    try {
      await expect.poll(() => isTabReady(page, tabId), {
        timeout: 3000,
        message: `Expected tab ${tabId} to render its page content`,
      }).toBe(true);
      return true;
    } catch (_error) {
      // Keep trying other visible nav instances before failing the flow.
    }
  }
  return false;
}

export async function openHome(page: Page, options: { seedEverything?: boolean } = {}): Promise<void> {
  if (options.seedEverything !== false) {
    await seedEverythingMode(page);
  }
  await page.goto("/", { waitUntil: "domcontentloaded" });
}

export async function goToTab(page: Page, tabId: string): Promise<void> {
  if (await isTabReady(page, tabId)) return;

  const primary = page.getByTestId(`nav-${tabId}`);
  if (await clickTabAndWait(page, primary, tabId)) return;

  const more = page.getByTestId("nav-more");
  if (await clickFirstVisible(more)) {
    const reopened = page.getByTestId(`nav-${tabId}`);
    if (await clickTabAndWait(page, reopened, tabId)) return;
  }

  throw new Error(`Could not find a visible nav button for tab ${tabId}`);
}

export function getVisibleByTestId(page: Page, testId: string): Locator {
  return page.locator(`[data-testid="${testId}"]:visible`);
}

export async function selectOptionByTestId(page: Page, testId: string, value: string): Promise<void> {
  const select = page.getByTestId(testId).first();
  await expect(select).toBeVisible();
  const available = await select.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  if (!available.includes(value)) {
    throw new Error(
      `Option "${value}" not found in select "${testId}". Available values: ${available.join(", ") || "(none)"}`,
    );
  }
  await select.selectOption(value);
}

export async function getSelectOptionValues(page: Page, testId: string): Promise<string[]> {
  const select = page.getByTestId(testId).first();
  await expect(select).toBeVisible();
  return select.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
}

export async function clickOptionByText(locator: Locator, exactText: string): Promise<void> {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if ((await candidate.innerText()).trim() === exactText.trim()) {
      await candidate.click();
      return;
    }
  }
  throw new Error(`Could not find option with text "${exactText}"`);
}

export async function readStoredState(page: Page): Promise<any> {
  return page.evaluate((storageKey) => {
    const raw = window.localStorage.getItem(storageKey as string);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);
}
