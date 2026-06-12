import assert from "node:assert/strict";

const { resolveStudyBookSource } = await import("../src/features/tutor/studyBookSources.js");
const { resolveStudyBookAnchor, MISSING_ANCHOR_NOTICE } = await import("../src/react/context/studyBookAnchorState.js");
const { buildStudyBookResults, generateStudyBookResponse } = await import("../src/features/tutor/tutorEngine.js");
const { extractTOC } = await import("../src/study-book.js");

{
  const manifest = {
    packs: [
      {
        id: "history_pack",
        contentMdPath: "data/Packs/ks3/history/history_pack/study_notes.md",
        unifiedPath: "data/Packs/ks3/history/history_pack/pack_unified.json",
      },
      {
        id: "geo_pack",
        displayName: "Water and Food Security Study Pack",
        contentMdPath: "data/Packs/us-middle-school/geography/geo_pack/study_notes.md",
        extraMdFiles: [
          { path: "data/Packs/us-middle-school/geography/geo_pack/scenario_card_b.md", title: "Scenario Card B" },
        ],
        unifiedPath: "data/Packs/us-middle-school/geography/geo_pack/pack_unified.json",
      },
    ],
  };

  const resolved = resolveStudyBookSource(manifest, {
    packId: "geo_pack_scenario_card_b",
    sourcePath: "data/Packs/us-middle-school/geography/geo_pack/scenario_card_b.md",
    packPath: "data/Packs/us-middle-school/geography/geo_pack/pack_unified.json",
  });

  assert.ok(resolved, "Study book source should resolve");
  assert.equal(resolved.dataset.id, "geo_pack", "Should resolve to the correct dataset, not the previously open one");
  assert.equal(resolved.mdPath, "data/Packs/us-middle-school/geography/geo_pack/scenario_card_b.md", "Should preserve the exact study note file path");
}

{
  const rawMarkdown = [
    "# Water and Food Security Study Pack",
    "",
    "## Essential Question",
    "",
    "#### Scenario Card B: Coastal City",
    "",
    "A coastal city has grown quickly.",
  ].join("\n");
  const toc = extractTOC(rawMarkdown);

  const found = resolveStudyBookAnchor(rawMarkdown, toc, "scenario-card-b-coastal-city");
  assert.equal(found.anchorFound, true, "Anchor resolution should recognise deeper heading anchors");
  assert.equal(found.anchor, "scenario-card-b-coastal-city", "Should keep the requested anchor when it exists");

  const missing = resolveStudyBookAnchor(rawMarkdown, toc, "missing-heading");
  assert.equal(missing.anchorFound, false, "Missing anchors should be reported");
  assert.equal(missing.anchor, "water-and-food-security-study-pack", "Missing anchor should fall back to the top of the correct study book");
  assert.equal(missing.notice, MISSING_ANCHOR_NOTICE, "Missing anchor should trigger the learner-facing fallback notice");
}

{
  const snippets = [
    {
      source: "studybook",
      text: "A coastal city has grown quickly.",
      score: 0.98,
      metadata: {
        chunkId: "geo_pack|scenario-card-b|4|12",
        packId: "geo_pack",
        displayName: "Water and Food Security Study Pack",
        subject: "geography",
        curriculum: "us-middle-school",
        heading: "Scenario Card B: Coastal City",
        anchor: "scenario-card-b-coastal-city",
        sourcePath: "data/Packs/us-middle-school/geography/geo_pack/scenario_card_b.md",
        packPath: "data/Packs/us-middle-school/geography/geo_pack/pack_unified.json",
        snippet: "A coastal city has grown quickly.",
      },
    },
    {
      source: "studybook",
      text: "Coastal communities can build sea walls.",
      score: 0.84,
      metadata: {
        chunkId: "geo_pack|coastal-management|4|13",
        packId: "geo_pack",
        displayName: "Water and Food Security Study Pack",
        subject: "geography",
        curriculum: "us-middle-school",
        heading: "Coastal management",
        anchor: "coastal-management",
        sourcePath: "data/Packs/us-middle-school/geography/geo_pack/study_notes.md",
        packPath: "data/Packs/us-middle-school/geography/geo_pack/pack_unified.json",
        snippet: "Coastal communities can build sea walls.",
      },
    },
    {
      source: "studybook",
      text: "Flood risk grows when rain is heavy.",
      score: 0.73,
      metadata: {
        chunkId: "geo_pack|flood-risk|4|14",
        packId: "geo_pack",
        displayName: "Water and Food Security Study Pack",
        subject: "geography",
        curriculum: "us-middle-school",
        heading: "Flood risk",
        anchor: "flood-risk",
        sourcePath: "data/Packs/us-middle-school/geography/geo_pack/study_notes.md",
        packPath: "data/Packs/us-middle-school/geography/geo_pack/pack_unified.json",
        snippet: "Flood risk grows when rain is heavy.",
      },
    },
    {
      source: "studybook",
      text: "This fourth result should be trimmed.",
      score: 0.4,
      metadata: {
        chunkId: "trim-me",
        packId: "geo_pack",
        displayName: "Water and Food Security Study Pack",
        subject: "geography",
        curriculum: "us-middle-school",
        heading: "Trim me",
        anchor: "trim-me",
        sourcePath: "data/Packs/us-middle-school/geography/geo_pack/study_notes.md",
        packPath: "data/Packs/us-middle-school/geography/geo_pack/pack_unified.json",
        snippet: "This fourth result should be trimmed.",
      },
    },
  ];

  const results = buildStudyBookResults(snippets);
  assert.equal(results.length, 3, "Tutor should surface the top three study note choices for disambiguation");
  assert.equal(results[0].chunkId, "geo_pack|scenario-card-b|4|12", "Stable chunk IDs should be preserved");
  assert.equal(results[0].sourcePath, "data/Packs/us-middle-school/geography/geo_pack/scenario_card_b.md", "Source path should survive to the tutor UI metadata");

  const response = generateStudyBookResponse(results);
  assert.match(response, /Found this in your Study Books:/, "Tutor study book response should use the guided study-note framing");
  assert.match(response, /Scenario Card B: Coastal City/, "Tutor study book response should lead with the strongest heading");
}

console.log("All tutor study book integration tests passed!");
