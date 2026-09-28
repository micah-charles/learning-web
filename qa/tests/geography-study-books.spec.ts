import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../../data/generated/manifest.json", import.meta.url), "utf8"));
const aqaGuides = manifest.studyBooks.filter((guide: { subject: string; curriculum: string; studyBookKind: string }) =>
  guide.subject === "geography" && guide.curriculum === "aqa-gcse-8035" && guide.studyBookKind === "topic-guide",
);
const englandGuides = manifest.studyBooks.filter((guide: { subject: string; curriculum: string; studyBookKind: string }) =>
  guide.subject === "geography" && ["ks3-england", "aqa-gcse-8035"].includes(guide.curriculum) && guide.studyBookKind === "topic-guide",
);

test("Geography Study Books switch curriculum, separate past papers and open chapters", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/study-books/geography/");
  await expect(page.getByRole("heading", { name: "Geography Study Books" })).toBeVisible();

  const tabs = page.getByTestId("geography-curriculum-tabs");
  await expect(tabs.getByRole("tab", { name: /US Middle School/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("panel-us-middle-school")).toBeVisible();

  await tabs.getByRole("tab", { name: /England KS3/ }).click();
  await expect(tabs.getByRole("tab", { name: /England KS3/ })).toHaveAttribute("aria-selected", "true");
  const ks3Panel = page.getByTestId("panel-ks3-england");
  await expect(ks3Panel).toBeVisible();
  await expect(ks3Panel).toContainText("Geographical skills and fieldwork");
  const placesLink = ks3Panel.getByRole("listitem").filter({ hasText: "World locations and connected places" }).getByRole("link", { name: "Open Study Book" });
  await expect(placesLink).toHaveAttribute("href", "/revision/studybook/geography/england-ks3-geo-places/");
  await placesLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("1. World locations and connected places");
  const articleWords = await page.locator("#sb-content").innerText().then((text) => text.trim().split(/\s+/).length);
  expect(articleWords).toBeGreaterThan(9_000);
  await expect(page.locator("#sb-content")).toContainText("Ganga plain");
  await page.goto("/study-books/geography/");

  await tabs.getByRole("tab", { name: /England KS3/ }).click();
  const refreshedKs3Panel = page.getByTestId("panel-ks3-england");
  const ukLink = refreshedKs3Panel.getByRole("listitem").filter({ hasText: "The geography of the United Kingdom" }).getByRole("link", { name: "Open Study Book" });
  await ukLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("2. The geography of the United Kingdom");
  const ukWords = await page.locator("#sb-content").innerText().then((text) => text.trim().split(/\s+/).length);
  expect(ukWords).toBeGreaterThanOrEqual(5_000);
  expect(ukWords).toBeLessThanOrEqual(7_000);
  await expect(page.locator("#sb-content")).toContainText("Eryri");

  await page.goto("/study-books/geography/");
  await page.getByTestId("geography-curriculum-tabs").getByRole("tab", { name: /England KS3/ }).click();
  const rocksLink = page.getByTestId("panel-ks3-england").getByRole("listitem").filter({ hasText: "Geological time, rocks, weathering and soils" }).getByRole("link", { name: "Open Study Book" });
  await rocksLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("3. Geological time, rocks, weathering and soils");
  const rocksWords = await page.locator("#sb-content").innerText().then((text) => text.trim().split(/\s+/).length);
  expect(rocksWords).toBeGreaterThanOrEqual(8_000);
  expect(rocksWords).toBeLessThanOrEqual(10_000);
  await expect(page.locator("#sb-content")).toContainText("rock cycle");
  await page.goto("/study-books/geography/");

  await page.getByTestId("geography-curriculum-tabs").getByRole("tab", { name: /England KS3/ }).click();
  const weatherLink = page.getByTestId("panel-ks3-england").getByRole("listitem").filter({ hasText: "Weather, climate and climate change" }).getByRole("link", { name: "Open Study Book" });
  await weatherLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("5. Weather, climate and climate change");
  const weatherWords = await page.locator("#sb-content").innerText().then((text) => text.trim().split(/\s+/).length);
  expect(weatherWords).toBeGreaterThanOrEqual(9_000);
  expect(weatherWords).toBeLessThanOrEqual(11_000);
  await expect(page.locator("#sb-content")).toContainText("climate normal");
  await page.goto("/study-books/geography/");

  await page.getByTestId("geography-curriculum-tabs").getByRole("tab", { name: /England KS3/ }).click();
  const glaciationLink = page.getByTestId("panel-ks3-england").getByRole("listitem").filter({ hasText: "Glaciation and changing landscapes" }).getByRole("link", { name: "Open Study Book" });
  await glaciationLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("6. Glaciation and changing landscapes");
  const glaciationWords = await page.locator("#sb-content").innerText().then((text) => text.trim().split(/\s+/).length);
  expect(glaciationWords).toBeGreaterThanOrEqual(8_000);
  expect(glaciationWords).toBeLessThanOrEqual(10_000);
  await expect(page.locator("#sb-content")).toContainText("outwash");
  await expect(page.locator("#image-england-ks3-geo-glaciation")).toHaveCount(1);
  await page.goto("/study-books/geography/");

  await page.getByTestId("geography-curriculum-tabs").getByRole("tab", { name: /England KS3/ }).click();
  const hydrologyLink = page.getByTestId("panel-ks3-england").getByRole("listitem").filter({ hasText: "Hydrology, the water cycle and water resources" }).getByRole("link", { name: "Open Study Book" });
  await hydrologyLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("7. Hydrology, the water cycle and water resources");
  const hydrologyWords = await page.locator("#sb-content").innerText().then((text) => text.trim().split(/\s+/).length);
  expect(hydrologyWords).toBeGreaterThanOrEqual(8_000);
  expect(hydrologyWords).toBeLessThanOrEqual(10_000);
  await expect(page.locator("#sb-content")).toContainText("chalk aquifer");
  await expect(page.locator("#image-england-ks3-geo-hydrology")).toHaveCount(1);
  await page.goto("/study-books/geography/");

  await page.getByTestId("geography-curriculum-tabs").getByRole("tab", { name: /England KS3/ }).click();
  const riversLink = page.getByTestId("panel-ks3-england").getByRole("listitem").filter({ hasText: "Rivers and river landscapes" }).getByRole("link", { name: "Open Study Book" });
  await riversLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("8. Rivers and river landscapes");
  const riversWords = await page.locator("#sb-content").innerText().then((text) => text.trim().split(/\s+/).length);
  expect(riversWords).toBeGreaterThanOrEqual(8_000);
  expect(riversWords).toBeLessThanOrEqual(10_000);
  await expect(page.locator("#sb-content")).toContainText("River Eden");
  await expect(page.locator("#image-england-ks3-geo-rivers")).toHaveCount(1);
  await page.goto("/study-books/geography/");

  await page.getByTestId("geography-curriculum-tabs").getByRole("tab", { name: /England KS3/ }).click();
  const coastsLink = page.getByTestId("panel-ks3-england").getByRole("listitem").filter({ hasText: "Coasts and coastal change" }).getByRole("link", { name: "Open Study Book" });
  await coastsLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("9. Coasts and coastal change");
  const coastsWords = await page.locator("#sb-content").innerText().then((text) => text.trim().split(/\s+/).length);
  expect(coastsWords).toBeGreaterThanOrEqual(8_000);
  expect(coastsWords).toBeLessThanOrEqual(10_000);
  await expect(page.locator("#sb-content")).toContainText("Spurn Point");
  await expect(page.locator("#image-england-ks3-geo-coasts")).toHaveCount(1);
  await page.goto("/study-books/geography/");

  await page.getByTestId("geography-curriculum-tabs").getByRole("tab", { name: /England KS3/ }).click();
  const ecosystemsLink = page.getByTestId("panel-ks3-england").getByRole("listitem").filter({ hasText: "Ecosystems, biomes and interdependence" }).getByRole("link", { name: "Open Study Book" });
  await ecosystemsLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("10. Ecosystems, biomes and interdependence");
  const ecosystemsWords = await page.locator("#sb-content").innerText().then((text) => text.trim().split(/\s+/).length);
  expect(ecosystemsWords).toBeGreaterThanOrEqual(8_000);
  expect(ecosystemsWords).toBeLessThanOrEqual(10_000);
  await expect(page.locator("#sb-content")).toContainText("Epping Forest");
  await expect(page.locator("#image-england-ks3-geo-ecosystems")).toHaveCount(1);
  await page.goto("/study-books/geography/");

  await page.getByTestId("geography-curriculum-tabs").getByRole("tab", { name: /England KS3/ }).click();
  const populationLink = page.getByTestId("panel-ks3-england").getByRole("listitem").filter({ hasText: "Population, migration and urbanisation" }).getByRole("link", { name: "Open Study Book" });
  await populationLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("11. Population, migration and urbanisation");
  const populationWords = await page.locator("#sb-content").innerText().then((text) => text.trim().split(/\s+/).length);
  expect(populationWords).toBeGreaterThanOrEqual(9_000);
  expect(populationWords).toBeLessThanOrEqual(11_000);
  await expect(page.locator("#sb-content")).toContainText("World Urbanization Prospects 2025");
  await expect(page.locator("#sb-content")).toContainText("England and Wales");
  await expect(page.locator("#image-england-ks3-geo-population")).toHaveCount(1);
  await page.goto("/study-books/geography/");

  await page.getByTestId("geography-curriculum-tabs").getByRole("tab", { name: /England KS3/ }).click();
  const settlementsLink = page.getByTestId("panel-ks3-england").getByRole("listitem").filter({ hasText: "Settlements, land use and urban change" }).getByRole("link", { name: "Open Study Book" });
  await settlementsLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("12. Settlements, land use and urban change");
  const settlementsWords = await page.locator("#sb-content").innerText().then((text) => text.trim().split(/\s+/).length);
  expect(settlementsWords).toBeGreaterThanOrEqual(8_000);
  expect(settlementsWords).toBeLessThanOrEqual(10_000);
  await expect(page.locator("#sb-content")).toContainText("Bishop Auckland");
  await expect(page.locator("#image-england-ks3-geo-settlements")).toHaveCount(1);
  await page.goto("/study-books/geography/");

  await page.getByTestId("geography-curriculum-tabs").getByRole("tab", { name: /England KS3/ }).click();
  const developmentLink = page.getByTestId("panel-ks3-england").getByRole("listitem").filter({ hasText: "International development and globalisation" }).getByRole("link", { name: "Open Study Book" });
  await developmentLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("13. International development and globalisation");
  const developmentWords = await page.locator("#sb-content").innerText().then((text) => text.trim().split(/\s+/).length);
  expect(developmentWords).toBeGreaterThanOrEqual(9_000);
  expect(developmentWords).toBeLessThanOrEqual(11_000);
  await expect(page.locator("#sb-content")).toContainText("Viet Nam");
  await expect(page.locator("#sb-content")).toContainText("Ghana");
  await expect(page.locator("#image-england-ks3-geo-development")).toHaveCount(1);
  await page.goto("/study-books/geography/");

  await page.getByTestId("geography-curriculum-tabs").getByRole("tab", { name: /England KS3/ }).click();
  const economyLink = page.getByTestId("panel-ks3-england").getByRole("listitem").filter({ hasText: "Economic activity, trade and natural resources" }).getByRole("link", { name: "Open Study Book" });
  await economyLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("14. Economic activity, trade and natural resources");
  const economyWords = await page.locator("#sb-content").innerText().then((text) => text.trim().split(/\s+/).length);
  expect(economyWords).toBeGreaterThanOrEqual(9_000);
  expect(economyWords).toBeLessThanOrEqual(11_000);
  await expect(page.locator("#sb-content")).toContainText("UK Food Security Report 2024");
  await expect(page.locator("#image-england-ks3-geo-economic-activity")).toHaveCount(1);
  await page.goto("/study-books/geography/");

  await page.getByTestId("geography-curriculum-tabs").getByRole("tab", { name: /England KS3/ }).click();
  const skillsLink = page.getByTestId("panel-ks3-england").getByRole("listitem").filter({ hasText: "Geographical skills and fieldwork" }).getByRole("link", { name: "Open Study Book" });
  await skillsLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("15. Geographical skills and fieldwork");
  const skillsWords = await page.locator("#sb-content").innerText().then((text) => text.trim().split(/\s+/).length);
  expect(skillsWords).toBeGreaterThanOrEqual(9_000);
  expect(skillsWords).toBeLessThanOrEqual(11_000);
  await expect(page.locator("#sb-content")).toContainText("National Grid");
  await expect(page.locator("#sb-content")).toContainText("Self-check answers");
  await expect(page.locator("#image-england-ks3-geo-skills")).toHaveCount(1);
  await page.goto("/study-books/geography/");

  await tabs.getByRole("tab", { name: /AQA GCSE Geography 8035/ }).click();
  const aqaPanel = page.getByTestId("panel-aqa-gcse-8035");
  await expect(aqaPanel).toBeVisible();
  await expect(aqaPanel).toContainText("Hot deserts — school option");
  await expect(aqaPanel).toContainText("Choose either hot deserts or cold environments");
  await expect(page.getByTestId("geography-past-paper-group")).toContainText("GCSE past-paper notes");

  const naturalHazardsLink = aqaPanel.getByRole("listitem").filter({ hasText: "1. Natural hazards and risk" }).getByRole("link", { name: "Open Study Book" });
  await naturalHazardsLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("1. Natural hazards and risk");
  const hazardWords = await page.locator("#sb-content").innerText().then((text) => text.trim().split(/\s+/).length);
  expect(hazardWords).toBeGreaterThanOrEqual(6_000);
  expect(hazardWords).toBeLessThanOrEqual(8_000);
  await expect(page.locator("#sb-content")).toContainText("exposure, vulnerability and capacity");
  await expect(page.locator("#image-aqa-8035-natural-hazards")).toHaveCount(1);
  await page.goto("/study-books/geography/");
  await page.getByTestId("geography-curriculum-tabs").getByRole("tab", { name: /AQA GCSE Geography 8035/ }).click();

  const tectonicLink = aqaPanel.getByRole("listitem").filter({ hasText: "2. Tectonic hazards" }).getByRole("link", { name: "Open Study Book" });
  await tectonicLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("2. Tectonic hazards");
  const tectonicWords = await page.locator("#sb-content").innerText().then((text) => text.trim().split(/\s+/).length);
  expect(tectonicWords).toBeGreaterThanOrEqual(11_000);
  expect(tectonicWords).toBeLessThanOrEqual(14_000);
  await expect(page.locator("#sb-content")).toContainText("Great East Japan earthquake");
  await expect(page.locator("#sb-content")).toContainText("Nepal earthquake");
  await expect(page.locator("#image-aqa-8035-tectonic-hazards")).toHaveCount(1);
  await page.goto("/study-books/geography/");
  await page.getByTestId("geography-curriculum-tabs").getByRole("tab", { name: /AQA GCSE Geography 8035/ }).click();

  const aqaWeatherLink = aqaPanel.getByRole("listitem").filter({ hasText: "3. Weather hazards" }).getByRole("link", { name: "Open Study Book" });
  await aqaWeatherLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("3. Weather hazards");
  const aqaWeatherWords = await page.locator("#sb-content").innerText().then((text) => text.trim().split(/\s+/).length);
  expect(aqaWeatherWords).toBeGreaterThanOrEqual(10_000);
  expect(aqaWeatherWords).toBeLessThanOrEqual(13_000);
  await expect(page.locator("#sb-content")).toContainText("Typhoon Haiyan");
  await expect(page.locator("#sb-content")).toContainText("Storm Babet");
  await expect(page.locator("#sb-content")).toContainText("State of the UK Climate 2025");
  await expect(page.locator("#image-aqa-8035-weather-hazards")).toHaveCount(1);
  await page.goto("/study-books/geography/");
  await page.getByTestId("geography-curriculum-tabs").getByRole("tab", { name: /AQA GCSE Geography 8035/ }).click();

  const articleLink = aqaPanel.getByRole("listitem").filter({ hasText: "4. Climate change" }).getByRole("link", { name: "Open Study Book" });
  await expect(articleLink).toHaveAttribute("href", "/revision/studybook/geography/aqa-8035-climate-change/");
  await articleLink.click();
  await expect(page.locator(".sb-page-title")).toHaveText("4. Climate change");
  await expect(page.getByRole("heading", { name: "How the geography works" })).toBeVisible();
  const layout = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(consoleErrors).toEqual([]);
});

test("all England KS3 and AQA GCSE Geography guides render with their embedded images", async ({ page }) => {
  expect(aqaGuides).toHaveLength(21);
  expect(englandGuides).toHaveLength(36);

  for (const guide of englandGuides) {
    const routeSlug = guide.id.replaceAll("_", "-");
    const response = await page.goto(`/revision/studybook/geography/${routeSlug}/`);
    expect(response?.ok(), `${guide.id} article route should resolve`).toBeTruthy();

    await expect(page.locator(".sb-page-title"), `${guide.id} should show an article title`).toBeVisible();
    const content = await page.locator("#sb-content").innerText();
    expect(content).toContain("Required knowledge");
    expect(content).toContain("Key vocabulary");
    expect(content).toContain("Self-check");
    expect(content).toContain("Revision points");

    const renderedWordCount = content.trim().split(/\s+/).length;
    expect(renderedWordCount, `${guide.id} should remain a substantial guide`).toBeGreaterThan(guide.targetWordCount.min - 500);
    expect(renderedWordCount, `${guide.id} should stay within its planned maximum`).toBeLessThanOrEqual(guide.targetWordCount.max);

    if (guide.required === "option") {
      expect(content).toContain("Optional school choice");
    } else if (guide.required === "enrichment") {
      expect(content).toContain("Enrichment guide");
    } else {
      expect(content).toContain("Required core content");
    }

    const anchor = `image-${guide.id.replaceAll("_", "-")}`;
    await expect(page.locator(`#${anchor}`), `${guide.id} image anchor should resolve`).toHaveCount(1);
    const image = page.locator("#sb-content img");
    await expect(image, `${guide.id} should render one image`).toHaveCount(1);
    await expect(image, `${guide.id} image should have alternative text`).toHaveAttribute("alt", /.+/);
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0), {
      message: `${guide.id} embedded image should load successfully`,
    }).toBe(true);
  }
});
