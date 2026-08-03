import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const words = read("learning-data/chinese-input/canonical/canonical_words.json").words;
const characters = read("learning-data/chinese-input/canonical/canonical_characters.json").characters;
const graph = read("learning-data/chinese-input/generated-curriculum/preview/word_unlock_graph.json");
const characterIds = new Set(characters.map((row) => `u${row.character.codePointAt(0).toString(16).toLowerCase()}`));
const formCounts = new Map();
for (const row of words) formCounts.set(row.word, (formCounts.get(row.word) || 0) + 1);
const duplicateForms = [...formCounts.entries()].filter(([, count]) => count > 1).map(([word]) => word);
const missingCharacters = graph.words.flatMap((word) => (word.characterPrerequisites || []).filter((id) => !characterIds.has(id)).map((id) => `${word.wordId}:${id}`));
const invalidPrerequisites = graph.words.filter((word) => !word.lessonId || !(word.characterPrerequisites || []).length).map((word) => word.wordId);
const mappedIds = new Set(graph.words.map((word) => word.text));
const excluded = words.filter((word) => !mappedIds.has(word.word));
const report = [
  "# Chinese Input word unlock QA",
  "",
  `- Canonical words: ${words.length}`,
  `- Dependency graph words: ${graph.words.length}`,
  `- Discoverable through curriculum graph: ${graph.words.length}`,
  `- Canonical words not placed in lesson capacity: ${excluded.length}`,
  `- Learner definition status: ${[...new Set(words.map((word) => word.learner_definition_status))].join(", ") || "none"}`,
  `- Duplicate forms: ${duplicateForms.length}`,
  `- Missing character references: ${missingCharacters.length}`,
  `- Invalid prerequisite records: ${invalidPrerequisites.length}`,
  "",
  "All canonical words are unlock-eligible for dependency evaluation. Learner-facing meaning and pronunciation remain review-status gated.",
  "",
  missingCharacters.length || invalidPrerequisites.length ? "Status: FAIL" : "Status: PASS",
  "",
].join("\n");
writeFileSync(resolve(root, "learning-data/chinese-input/canonical/word_unlock_qa_report.md"), report);
console.log(report);
if (missingCharacters.length || invalidPrerequisites.length) process.exitCode = 1;
