import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { migrateChineseInputCurriculumProgress } from "../../../src/features/chinese-input/domain/curriculum-migration.js";
import {
  createFootballSessionPlan,
  createGoalTargets,
} from "../../../src/features/chinese-input/domain/football-game.js";
import { shouldAutoSubmitAnswer } from "../../../src/features/chinese-input/domain/answer-evaluator.js";
import { generateSessionPlan } from "../../../src/features/chinese-input/domain/question-generator.js";
import { educationalCangjieCodes } from "../canonical/code-policy.mjs";
import {
  configuredChineseCurriculumSource,
  loadGeneratedChineseInputDataset,
  validateGeneratedCurriculumBundle,
} from "../../../src/features/chinese-input/data/generated-curriculum-adapter.js";
import { CHINESE_INPUT_STATIC_COPY_TARGETS } from "../../../vite.config.js";

const projectRoot = resolve(import.meta.dirname, "../../..");
const generator = resolve(import.meta.dirname, "generate.mjs");

test("all builds default to generated preview and reject removed legacy overrides", () => {
  assert.equal(configuredChineseCurriculumSource({ PROD: true }), "generated-preview");
  assert.equal(configuredChineseCurriculumSource({ PROD: false }), "generated-preview");
  assert.equal(
    configuredChineseCurriculumSource({ PROD: true, VITE_CHINESE_CURRICULUM_SOURCE: "legacy" }),
    "generated-preview",
  );
  assert.equal(
    configuredChineseCurriculumSource({ PROD: true, VITE_CHINESE_CURRICULUM_SOURCE: "unsupported" }),
    "generated-preview",
  );
});

test("production copy targets preserve the runtime Chinese data URLs", () => {
  assert.deepEqual(CHINESE_INPUT_STATIC_COPY_TARGETS, [
    {
      src: "learning-data/chinese-input/generated-curriculum",
      dest: ".",
    },
    {
      src: "learning-data/chinese-input/canonical",
      dest: ".",
    },
  ]);
});

test("educational code policy rejects Rime X-prefixed shortcuts when a standard code exists", () => {
  assert.deepEqual(educationalCangjieCodes(["X", "HAPI"]), ["HAPI"]);
  assert.deepEqual(educationalCangjieCodes(["XYHMB", "YHMBC"]), ["YHMBC"]);
  assert.deepEqual(educationalCangjieCodes(["X"]), ["X"]);
});

test("preview generation covers all canonical characters and adapts safely at runtime", async () => {
  const temp = mkdtempSync(resolve(tmpdir(), "foxchild-curriculum-test-"));
  const output = resolve(temp, "preview");
  try {
    const result = spawnSync(process.execPath, [generator, "--mode=preview", `--output=${output}`], {
      cwd: projectRoot,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    const manifest = JSON.parse(readFileSync(resolve(output, "curriculum_manifest.json")));
    const stages = JSON.parse(readFileSync(resolve(output, "stages.json")));
    const lessons = JSON.parse(readFileSync(resolve(output, "lessons.json")));
    const assessments = JSON.parse(readFileSync(resolve(output, "assessment_graph.json")));
    const games = JSON.parse(readFileSync(resolve(output, "game_graph.json")));
    const migration = JSON.parse(readFileSync(resolve(output, "learner_progress_migration.json")));
    const wordGraph = JSON.parse(readFileSync(resolve(output, "word_unlock_graph.json")));
    assert.equal(manifest.releaseStatus, "provisional-preview");
    assert.equal(manifest.productionEligible, false);
    assert.equal(manifest.counts.characters, 3000);
    assert.equal(manifest.counts.roots, 26);
    assert.equal(lessons.lessons.flatMap((lesson) => lesson.newCharacters).length, 3000);
    assert.equal(validateGeneratedCurriculumBundle({ manifest, stages, lessons, assessments, games, migration, wordGraph }, "generated-preview").valid, true);
    const canonicalRoot = resolve(projectRoot, "learning-data/chinese-input/canonical");
    const fetchImpl = async (path) => {
      try {
        const text = readFileSync(path);
        return new Response(text, { status: 200, headers: { "content-type": "application/json" } });
      } catch {
        return new Response("", { status: 404 });
      }
    };
    const adapted = await loadGeneratedChineseInputDataset({
      source: "generated-preview",
      basePath: temp,
      canonicalBasePath: canonicalRoot,
      fetchImpl,
    });
    assert.equal(adapted.dataset.characters.length, 3000);
    const possessiveParticle = adapted.dataset.characters.find((character) => character.char === "的");
    assert.equal(possessiveParticle.cangjie.preferredCode, "HAPI");
    assert.equal(possessiveParticle.quick.preferredCode, "HI");
    assert.deepEqual(possessiveParticle.cangjie.acceptedCodes, ["HAPI"]);
    assert.deepEqual(possessiveParticle.quick.acceptedCodes, ["HI"]);
    assert.ok(adapted.dataset.lessons.length > 500);
    assert.equal(adapted.warning, "");
    const lessonCounts = adapted.dataset.lessons.reduce((counts, lesson) => {
      counts[lesson.method] = (counts[lesson.method] || 0) + 1;
      const lessonPlan = generateSessionPlan({
        dataset: adapted.dataset,
        lesson,
        method: lesson.method,
        seed: 42,
        questionCount: lesson.passCriteria.minimumQuestions,
      });
      for (const question of lessonPlan.questions) {
        if (question.type === "root-recognition") {
          assert.equal(question.expectedCodes.length, 1, `${lesson.id} root question has multiple answers`);
          assert.equal(question.expectedCodes[0], question.rootKey, `${lesson.id} root answer differs from root key`);
          assert.equal(question.characterId, null, `${lesson.id} root question borrowed an unrelated character`);
          assert.equal(
            adapted.dataset.roots.find((root) => root.key === question.rootKey)?.primaryRoot,
            question.rootLabel,
            `${lesson.id} displays a character instead of the tested root`,
          );
        } else {
          const character = adapted.dataset.characters.find((candidate) => candidate.id === question.characterId);
          assert.deepEqual(
            question.expectedCodes,
            character[lesson.method].acceptedCodes,
            `${lesson.id} guided typing truncated an accepted character code`,
          );
          if (question.preferredCode.length > 1) {
            assert.equal(
              shouldAutoSubmitAnswer(question.preferredCode[0], question.expectedCodes),
              false,
              `${lesson.id} guided typing submitted ${character.char} after its first key`,
            );
          }
        }
      }
      const plan = createFootballSessionPlan({
        dataset: adapted.dataset,
        lesson,
        method: lesson.method,
        seed: 42,
        questionCount: 1,
      });
      const targets = createGoalTargets({
        dataset: adapted.dataset,
        lesson,
        method: lesson.method,
        question: plan.questions[0],
      });
      assert.ok(targets.length >= 1 && targets.length <= 9, `${lesson.id} produced ${targets.length} football targets`);
      assert.ok(
        targets.some((character) => character.id === plan.questions[0].characterId),
        `${lesson.id} omitted its football question target`,
      );
      assert.ok(
        targets.every((character) => lesson.characterIds.includes(character.id)),
        `${lesson.id} used a character outside its lesson pool`,
      );
      return counts;
    }, {});
    assert.deepEqual(lessonCounts, { cangjie: 530, quick: 30 });
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("production generation remains fail-closed", () => {
  const temp = mkdtempSync(resolve(tmpdir(), "foxchild-curriculum-production-test-"));
  try {
    const result = spawnSync(process.execPath, [generator, "--mode=production", `--output=${temp}`], {
      cwd: projectRoot,
      encoding: "utf8",
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /no approved and pinned Hong Kong corpus source/);
    assert.match(result.stderr, /0 approved included characters; 2500 required/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("entity migration preserves mastery when characters move lessons", () => {
  const state = {
    lessons: { "legacy-lesson-1": { status: "completed" } },
    characters: {
      u591a: { cangjie: { masteryScore: 92 } },
      u5c11: { cangjie: { masteryScore: 30 } },
    },
    roots: {},
    achievements: { firstLesson: { earnedAt: "2026-01-01" } },
    attemptEvents: [{ characterId: "u591a", correct: true }],
  };
  const migrated = migrateChineseInputCurriculumProgress(state, { migrationVersion: 1 }, [{
    lessonId: "cj-stage-02-lesson-099",
    newRoots: [],
    newCharacters: ["u591a", "u5c11"],
  }], "fixture-input-digest");
  assert.equal(migrated.characters.u591a.cangjie.masteryScore, 92);
  assert.equal(migrated.lessons["cj-stage-02-lesson-099"].status, "partial");
  assert.deepEqual(migrated.lessons["cj-stage-02-lesson-099"].masteredEntityIds, ["u591a"]);
  assert.ok(migrated.achievements.firstLesson);
  assert.equal(migrated.attemptEvents.length, 1);
  assert.equal(migrated.curriculumInputDigest, "fixture-input-digest");
});
