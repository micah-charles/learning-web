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
  await expect(page.getByTestId("chinese-input-dashboard")).toBeVisible({ timeout: 30_000 });
}

async function openFlower(page: Page) {
  await page.getByRole("button", { name: /Open learning world destinations/ }).click();
  await expect(page.getByRole("menu", { name: "Learning world destinations" })).toBeVisible();
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

test("adventure home is Director-led, game-like, and uses the full generated world", async ({ page }, testInfo) => {
  const errors = collectConsoleErrors(page);
  await openKingdom(page);

  await expect(page.getByTestId("nav-chinese-input")).toBeAttached();
  await expect(page.getByTestId("chinese-input-today-journey")).toHaveCount(1);
  await expect(page.getByRole("button", { name: /Start Adventure/ })).toBeEnabled();
  await expect(page.getByTestId("chinese-input-preview-warning")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Knowledge World/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /Arena/ })).toBeEnabled();

  const mobile = testInfo.project.name.includes("mobile");
  await page.screenshot({
    path: `artifacts/chinese-input-runtime-${mobile ? "mobile" : "desktop"}.png`,
    fullPage: !mobile,
  });
  await expectNoConsoleErrors(errors);
});

test("lesson type, runtime checkpoint, and keyboard hint states are explicit", async ({ page }) => {
  await openKingdom(page);
  await page.getByRole("button", { name: /Start Adventure/ }).click();
  await expect(page.getByTestId("chinese-input-lesson-player")).toBeVisible();
  await expect(page.getByTestId("chinese-input-question-type")).toHaveText(/Root recognition|Guided typing/);

  const stored = await readStoredState(page);
  expect(stored.progress.learningRuntime.worlds["foxchild.chinese-input"].checkpoint).toBeTruthy();
  await expect(page.locator('[data-key-state="inactive"]')).not.toHaveCount(0);
  await expect(page.locator('[data-key-state="learned"]')).not.toHaveCount(0);
  await expect(page.locator('[data-key-state="expected"]')).toHaveCount(0);

  await page.getByTestId("chinese-input-hint-toggle").click();
  await expect(page.locator('[data-key-state="expected"]')).toHaveCount(1);
  await page.getByTestId("chinese-input-hint-toggle").click();
  await expect(page.locator('[data-key-state="expected"]')).toHaveCount(0);
});

test("incorrect ordered code feedback includes the complete correct answer", async ({ page }) => {
  await openKingdom(page);
  await page.getByRole("button", { name: /Start Adventure/ }).click();
  await expect(page.getByTestId("chinese-input-lesson-player")).toBeVisible();
  await page.getByTestId("chinese-input-hint-toggle").click();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const questionType = await page.getByTestId("chinese-input-question-type").innerText();
    if (questionType.includes("Guided typing")) {
      const expectedKeyId = await page.locator('[data-key-state="expected"]').getAttribute("data-testid");
      const wrongKeyId = await page.locator('button[data-key-state]:not(:disabled)').evaluateAll((buttons, expectedId) => buttons.find((button) => button.getAttribute("data-testid") !== expectedId)?.getAttribute("data-testid") || "", expectedKeyId);
      await expect(wrongKeyId).not.toBe("");
      await page.getByTestId(wrongKeyId).click();
      await page.getByTestId("chinese-input-submit").click();
      await expect(page.getByTestId("chinese-input-feedback")).toContainText("Correct answer:");
      return;
    }
    const expected = page.locator('[data-key-state="expected"]');
    await expect(expected).toHaveCount(1);
    const expectedKey = await expected.getAttribute("data-testid");
    await page.getByTestId(String(expectedKey)).click();
    const feedback = page.getByTestId("chinese-input-feedback");
    if (await feedback.isVisible()) {
      const text = await feedback.innerText();
      if (text.includes("Correct answer:")) break;
      await page.getByTestId("chinese-input-next").click();
    }
  }
  throw new Error("Did not encounter a guided typing question");
});

test("Chinese Input load and physical-key feedback stay within the interaction budget", async ({ page }, testInfo) => {
  await seedEverythingMode(page);
  await page.addInitScript(() => {
    (window as any).__chineseInputLongTasks = [];
    new PerformanceObserver((list) => {
      (window as any).__chineseInputLongTasks.push(...list.getEntries().map((entry) => ({
        startTime: Math.round(entry.startTime),
        duration: Math.round(entry.duration),
      })));
    }).observe({ type: "longtask", buffered: true });
    (window as any).__chineseInputLcp = 0;
    new PerformanceObserver((list) => {
      const entry = list.getEntries().at(-1);
      if (entry) (window as any).__chineseInputLcp = Math.round(entry.startTime);
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  const navigationStartedAt = Date.now();
  await page.goto("/chinese-input", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("chinese-input-dashboard")).toBeVisible({ timeout: 30_000 });
  const dashboardReadyMs = Date.now() - navigationStartedAt;
  const loadMetrics = await page.evaluate(() => ({
    longTasks: (window as any).__chineseInputLongTasks || [],
    lcp: (window as any).__chineseInputLcp || 0,
    resources: performance.getEntriesByType("resource").map((entry) => entry.name),
    worldImage: performance.getEntriesByType("resource")
      .filter((entry) => entry.name.includes("kingdom-world.webp"))
      .map((entry) => ({ startTime: Math.round(entry.startTime), duration: Math.round(entry.duration) }))[0] || null,
    dataResources: performance.getEntriesByType("resource")
      .filter((entry) => entry.name.endsWith(".json"))
      .map((entry) => ({ name: entry.name.split("/").at(-1), bytes: (entry as PerformanceResourceTiming).decodedBodySize })),
    heapUsedMb: (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
      ? Math.round((performance as Performance & { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize / 1024 / 1024)
      : null,
    preload: Boolean(document.head.querySelector('link[rel="preload"][href="/images/chinese-input/kingdom-world.webp"]')),
  }));
  expect(loadMetrics.preload).toBe(true);
  expect(loadMetrics.resources.some((url) => url.endsWith("assessment_graph.json"))).toBe(false);
  expect(loadMetrics.resources.some((url) => url.endsWith("game_graph.json"))).toBe(false);
  expect(loadMetrics.resources.filter((url) => url.endsWith("canonical_words.json"))).toHaveLength(1);
  expect(loadMetrics.resources.filter((url) => url.endsWith("canonical_characters.json"))).toHaveLength(1);
  expect(loadMetrics.worldImage?.startTime || Number.POSITIVE_INFINITY).toBeLessThan(750);
  expect(Math.max(0, ...loadMetrics.longTasks.map((task: { duration: number }) => task.duration))).toBeLessThan(1_000);
  expect(dashboardReadyMs).toBeLessThan(4_000);

  await page.getByRole("button", { name: /Start Adventure/ }).click();
  await expect(page.getByTestId("chinese-input-lesson-player")).toBeVisible();
  await page.getByTestId("chinese-input-hint-toggle").click();
  const responseTimes: number[] = [];
  for (let step = 0; step < 5; step += 1) {
    const expectedKey = page.locator('[data-key-state="expected"]');
    await expect(expectedKey).toHaveCount(1);
    const testId = await expectedKey.getAttribute("data-testid");
    const key = String(testId).replace("chinese-input-key-", "");
    const previousBuffer = await page.getByTestId("chinese-input-buffer").textContent();
    const startedAt = Date.now();
    await page.keyboard.press(key);
    await expect.poll(async () => (
      await page.locator(".cil-feedback").isVisible()
      || await page.getByTestId("chinese-input-buffer").textContent() !== previousBuffer
    )).toBe(true);
    responseTimes.push(Date.now() - startedAt);
    if (await page.locator(".cil-feedback").isVisible()) break;
  }
  await expect(page.locator(".cil-feedback")).toBeVisible();
  expect(Math.max(...responseTimes)).toBeLessThan(750);
  if (process.env.QA_LOG_PERFORMANCE === "true") {
    console.log(JSON.stringify({ dashboardReadyMs, responseTimes, lcp: loadMetrics.lcp, worldImage: loadMetrics.worldImage, longTasks: loadMetrics.longTasks, heapUsedMb: loadMetrics.heapUsedMb, dataResources: loadMetrics.dataResources }));
  }
  await testInfo.attach("chinese-input-performance.json", {
    body: Buffer.from(JSON.stringify({ dashboardReadyMs, responseTimes, longTasks: loadMetrics.longTasks }, null, 2)),
    contentType: "application/json",
  });
});

test("Floating Flower has six destinations, keyboard support, and draggable persisted position", async ({ page }, testInfo) => {
  await openKingdom(page);
  const flower = page.getByTestId("learning-flower");
  const initial = await flower.boundingBox();
  expect(initial).not.toBeNull();

  if (!testInfo.project.name.includes("mobile")) {
    await page.mouse.move(initial!.x + initial!.width / 2, initial!.y + initial!.height / 2);
    await page.mouse.down();
    await page.mouse.move(Math.max(120, initial!.x - 150), Math.max(160, initial!.y - 100), { steps: 8 });
    await page.mouse.up();
    await expect.poll(async () => (await flower.boundingBox())?.x).not.toBe(initial!.x);
    const stored = await readStoredState(page);
    expect(stored.prefs.chineseInputLab.flowerPosition).toBeTruthy();
  }

  await page.keyboard.press("f");
  for (const name of ["Journey", "Training", "Review", "Arena", "Explore", "Museum"]) {
    await expect(page.getByRole("menuitem", { name: new RegExp(name) })).toBeVisible();
  }
  await page.keyboard.press("Escape");
  await page.keyboard.press("f");
  await page.getByRole("menuitem", { name: /Explore/ }).click();
  await expect(page.getByRole("dialog", { name: "Knowledge World" })).toBeVisible();
  await expect(page.getByTestId("knowledge-node-root-a")).toBeEnabled();
  await page.getByTestId("knowledge-node-root-a").click();
  await expect(page.getByRole("region", { name: /Element Springs actions/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Continue Journey/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /Reading/ })).toBeDisabled();
});

test("Knowledge World supports region actions and a mixed custom adventure", async ({ page }) => {
  await openKingdom(page);
  await openFlower(page);
  await page.getByRole("menuitem", { name: /Explore/ }).click();
  await page.getByRole("button", { name: /Element Springs/ }).click();
  await page.getByRole("button", { name: /Stroke Highlands/ }).click();
  await expect(page.getByRole("button", { name: /Start Custom Adventure/ })).toBeEnabled();
  await page.getByRole("button", { name: /Start Custom Adventure/ }).click();
  await expect(page.getByTestId("chinese-input-lesson-player")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Custom Knowledge Adventure" })).toBeVisible();
});

test("Knowledge World related lessons launch the selected lesson", async ({ page }) => {
  await openKingdom(page);
  await openFlower(page);
  await page.getByRole("menuitem", { name: /Explore/ }).click();
  await page.getByTestId("knowledge-node-root-h").click();
  const panel = page.getByRole("region", { name: /Stroke Highlands actions/ });
  await expect(panel).toBeVisible();
  const relatedLesson = panel.locator(".flr-related-lesson").first();
  await expect(relatedLesson).toBeVisible();
  const lessonLabel = await relatedLesson.locator("b").innerText();
  await relatedLesson.click();
  await expect(page.getByTestId("chinese-input-lesson-player")).toBeVisible();
  await expect(page.getByTestId("chinese-input-lesson-banner").locator("h2")).toHaveText(lessonLabel);
});

test("Input Tools keeps Z outside root regions and character mastery", async ({ page }) => {
  await openKingdom(page);
  await openFlower(page);
  await page.getByRole("menuitem", { name: /Explore/ }).click();
  await expect(page.getByRole("region", { name: "Input Tools category" })).toBeVisible();
  await page.getByTestId("knowledge-node-root-z").click();
  const panel = page.getByRole("region", { name: /Input Tools actions/ });
  await expect(panel).toBeVisible();
  await expect(panel.getByText("0 related characters")).toBeVisible();
  await expect(panel.getByText("Input Tools: Z special key")).toBeVisible();
});

test("Word Collection exposes discovered canonical words and the four-part challenge", async ({ page }) => {
  await openKingdom(page);
  await page.addInitScript(() => {
    const key = "learningGermanWeb.v1";
    const state = JSON.parse(localStorage.getItem(key) || "{}");
    state.progress = state.progress || {};
    state.progress.chineseInputLab = state.progress.chineseInputLab || { words: {} };
    const lab = state.progress.chineseInputLab;
    lab.words = { ...(lab.words || {}), "word-fb8f01cb6d4b": { wordId: "word-fb8f01cb6d4b", state: "discovered", attempts: 0, correct: 0, hintCount: 0, meaningMastery: 0, readingMastery: 0, typingMastery: 0, contextMastery: 0 } };
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("chinese-input-dashboard")).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(1_000);
  await openFlower(page);
  await page.getByRole("menuitem", { name: /Museum/ }).click();
  await page.getByRole("button", { name: /Words/ }).click();
  await expect(page.getByTestId("chinese-input-word-collection")).toBeVisible();
  await expect(page.getByText("多少")).toBeVisible();
  await page.getByText("多少").first().click();
  await page.getByRole("button", { name: /Try word challenge/ }).click();
  await expect(page.getByTestId("chinese-input-word-challenge")).toBeVisible();
  await expect(page.getByText(/Meaning recognition/)).toBeVisible();
});

test("Word Challenge keeps prompt, answer cards, and feedback inside every target viewport", async ({ page }, testInfo) => {
  const viewports = [
    [1920, 1080], [1600, 900], [1366, 768], [1024, 768],
    [768, 1024], [844, 390], [390, 844],
  ] as const;
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await seedEverythingMode(page);
    await page.addInitScript(() => {
      const key = "learningGermanWeb.v1";
      const state = JSON.parse(localStorage.getItem(key) || "{}");
      state.progress = state.progress || {};
      state.progress.chineseInputLab = state.progress.chineseInputLab || { words: {} };
      state.progress.chineseInputLab.words = { ...(state.progress.chineseInputLab.words || {}), "word-fb8f01cb6d4b": { wordId: "word-fb8f01cb6d4b", state: "discovered", attempts: 0, correct: 0, hintCount: 0, meaningMastery: 0, readingMastery: 0, typingMastery: 0, contextMastery: 0 } };
      localStorage.setItem(key, JSON.stringify(state));
    });
    await page.goto("/chinese-input", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("chinese-input-dashboard")).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /Open learning world destinations/ }).click();
    await page.getByRole("menuitem", { name: /Museum/ }).click();
    await page.getByRole("button", { name: /Words/ }).click();
    await page.getByText("多少").first().click();
    await page.getByRole("button", { name: /Try word challenge/ }).click();
    const challenge = page.getByTestId("chinese-input-word-challenge");
    await expect(challenge).toBeVisible();
    await expect(challenge.locator(".cik-word-option")).toHaveCount(4);
    const geometry = await page.evaluate(() => {
      const shell = document.querySelector<HTMLElement>(".flr-session-shell");
      const challenge = document.querySelector<HTMLElement>("[data-testid=chinese-input-word-challenge]");
      const options = [...document.querySelectorAll<HTMLElement>(".cik-word-option")].map((element) => element.getBoundingClientRect());
      return { shell: shell?.getBoundingClientRect(), challenge: challenge?.getBoundingClientRect(), options, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight };
    });
    expect(geometry.scrollWidth).toBeLessThanOrEqual(width + 1);
    expect(geometry.scrollHeight).toBeLessThanOrEqual(height + 1);
    expect(geometry.challenge?.bottom || 0).toBeLessThanOrEqual(height + 1);
    expect(geometry.options.every((box) => box.width >= 40 && box.height >= 40 && box.right <= width + 1 && box.bottom <= height + 1)).toBe(true);
    await challenge.locator(".cik-word-option").first().click();
    await expect(challenge.locator("[role=status]")).toBeVisible();
    await expect(challenge.getByRole("button", { name: /Next/ })).toBeVisible();
    await testInfo.attach(`word-challenge-${width}x${height}.png`, { body: await page.screenshot({ fullPage: false }), contentType: "image/png" });
  }
});

test("all six world destinations render their distinct game environments", async ({ page }) => {
  await openKingdom(page);
  const destinations = [
    ["Journey", "Adventure Path"],
    ["Training", "Root Training Grounds"],
    ["Review", "Review Library"],
    ["Arena", "FoxChild Arena"],
    ["Explore", "Knowledge World"],
    ["Museum", "Collection Museum"],
  ];
  for (const [petal, dialog] of destinations) {
    await openFlower(page);
    await page.getByRole("menuitem", { name: new RegExp(petal) }).click();
    await expect(page.getByRole("dialog", { name: dialog })).toBeVisible();
    await page.locator(".flr-close").click();
  }
});

test("football challenge pools launch with target-zone pronunciation controls", async ({ page }) => {
  await installSpeechSynthesisMock(page);
  await openKingdom(page);
  await openFlower(page);
  await page.getByRole("menuitem", { name: /Arena/ }).click();
  const dialog = page.getByRole("dialog", { name: "FoxChild Arena" });
  await dialog.getByRole("button", { name: /Advanced practice/ }).click();
  await expect(dialog.getByRole("button", { name: /Current Journey/ })).toBeVisible();
  await dialog.getByRole("button", { name: /Current Journey/ }).click();
  await expect(page.getByTestId("chinese-football-game")).toBeVisible();
  await expect(page.getByRole("button", { name: /Pronounce target/ })).toBeVisible();
  await page.getByRole("button", { name: /Pronounce target/ }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__spoken.length)).toBeGreaterThan(0);
  await expect(page.locator(".cil-football-target")).toHaveCount(9);
});

test("method, root, companion, motion, and audio preferences persist", async ({ page }) => {
  await openKingdom(page);
  await page.getByRole("button", { name: /Quick/ }).click();
  await openFlower(page);
  await page.getByRole("menuitem", { name: /Training/ }).click();
  await page.getByTestId("chinese-input-key-B").click();
  await page.locator(".flr-close").click();
  await page.getByRole("button", { name: "Minimise companion guidance" }).click();
  await page.getByRole("button", { name: "Open world settings" }).click();
  await page.getByLabel("Reduce animation").check();
  await page.getByLabel("World sound effects").uncheck();
  const stored = await readStoredState(page);
  expect(stored.prefs.chineseInputLab.method).toBe("quick");
  expect(stored.prefs.chineseInputLab.currentRootKey).toBe("B");
  expect(stored.prefs.chineseInputLab.companionMinimized).toBe(true);
  expect(stored.prefs.chineseInputLab.reducedMotion).toBe(true);
  expect(stored.prefs.chineseInputLab.soundEnabled).toBe(false);
  expect(stored.progress.chineseInputLab.discoveredNodes["root-b"].kind).toBe("root");
});

test("Kingdom and immersive overlays have no horizontal overflow", async ({ page }, testInfo) => {
  await openKingdom(page);
  let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `${testInfo.project.name} home overflow`).toBeLessThanOrEqual(1);
  await openFlower(page);
  await page.getByRole("menuitem", { name: /Explore/ }).click();
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `${testInfo.project.name} overlay overflow`).toBeLessThanOrEqual(1);
  const flowerBox = await page.getByTestId("learning-flower").boundingBox();
  expect(flowerBox).not.toBeNull();
  expect(flowerBox!.x).toBeGreaterThanOrEqual(0);
  expect(flowerBox!.x + flowerBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
});
