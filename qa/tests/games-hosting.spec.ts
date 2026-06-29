import { test, expect } from "@playwright/test";

test("Rail Adventure game page loads", async ({ page }) => {
  const response = await page.goto("/games/rail-adventure/index.html");
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("#game-container")).toBeVisible();
});

test("Rail Adventure manifest is valid", async ({ request }) => {
  const response = await request.get("/games/rail-adventure/manifest.json");
  expect(response.status()).toBe(200);
  const manifest = await response.json();
  expect(manifest.gameId).toBe("rail-adventure");
  expect(Array.isArray(manifest.scenes)).toBe(true);
  expect(manifest.scenes.length).toBeGreaterThan(0);
});

test("Rail Adventure scene files are reachable", async ({ request }) => {
  const manifestResponse = await request.get("/games/rail-adventure/manifest.json");
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json();
  for (const scene of manifest.scenes) {
    const response = await request.get(`/games/rail-adventure/${scene.file}`);
    expect(response.status(), scene.file).toBe(200);
  }
});

test("Rail Adventure JS and Astrocade launcher are reachable", async ({ request }) => {
  const mainResponse = await request.get("/games/rail-adventure/main.js");
  expect(mainResponse.status()).toBe(200);
  const launcherResponse = await request.get("/games/rail-adventure/astrocade-launcher.html");
  expect(launcherResponse.status()).toBe(200);
});

test("Standalone games gallery loads without replacing arcade", async ({ page }) => {
  const gamesResponse = await page.goto("/games/index.html");
  expect(gamesResponse?.status()).toBeLessThan(400);
  await expect(page.getByRole("heading", { name: /FoxChild Games/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Rail Adventure/i })).toBeVisible();

  const arcadeResponse = await page.goto("/arcade");
  expect(arcadeResponse?.status()).toBeLessThan(400);
  await expect(page.getByRole("heading", { name: /FoxChild Arcade/i })).toBeVisible();
});
