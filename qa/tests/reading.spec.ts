import { test, expect } from "@playwright/test";
import { findPassageForTitle, findPassageQuestionByPrompt, resolveIncorrectAnswer } from "../fixtures/answer-resolver";
import { loadManifest, loadPassagePack, getPassageGroups, normalisePassageRecords } from "../fixtures/pack-loader";
import { loadQaBehaviourConfig } from "../fixtures/behaviour-config";
import { clickOptionByText, collectConsoleErrors, expectNoConsoleErrors, getSelectOptionValues, goToTab, openHome, selectOptionByTestId } from "../fixtures/ui-helpers";

function findGroupWithMcq(passagesByGroup: Array<{ groupId: string; passages: ReturnType<typeof normalisePassageRecords> }>) {
  return passagesByGroup.find(({ passages }) =>
    passages.some((passage) => passage.questions.some((question) => question.options.length > 1 && question.correctAnswer)),
  );
}

test("@data-sample reading mode resolves question answers from passage JSON", async ({ page }) => {
  const config = await loadQaBehaviourConfig();
  const manifest = await loadManifest();
  const groups = getPassageGroups(manifest, config);
  const errors = collectConsoleErrors(page);
  await openHome(page);
  await goToTab(page, "reading");
  await page.getByTestId("reading-subject-religion").click({ force: true });
  await page.getByTestId("reading-curriculum-gcse").click({ force: true });
  const visibleGroupIds = new Set(await getSelectOptionValues(page, "reading-group-select"));
  const visibleGroups = groups.filter((group) => visibleGroupIds.has(group.id));
  const passagesByGroup = await Promise.all(visibleGroups.slice(0, 10).map(async (group) => ({
    groupId: group.id,
    passages: normalisePassageRecords(await loadPassagePack(group)),
  })));
  const candidate = findGroupWithMcq(passagesByGroup);

  expect(candidate, "Expected a visible reading group with at least one multiple-choice passage question").toBeTruthy();
  await selectOptionByTestId(page, "reading-group-select", candidate!.groupId);
  await page.getByTestId("start-reading-button").click();

  await expect(page.getByTestId("reading-passage")).toBeVisible();
  const title = await page.locator(".lw-rws-title").first().innerText();
  const questionPrompt = await page.locator(".lw-rws-q-text").first().innerText();
  const passage = findPassageForTitle(title, candidate!.passages);
  expect(passage).toBeTruthy();
  const question = findPassageQuestionByPrompt(questionPrompt, passage!.questions);
  expect(question).toBeTruthy();

  const correctAnswer = question!.correctAnswer;
  const wrongAnswer = resolveIncorrectAnswer(question!);

  await clickOptionByText(page.getByTestId("reading-option"), wrongAnswer || correctAnswer);
  await page.getByTestId("reading-show-answers-button").click();

  const buttons = page.getByTestId("reading-option");
  await expect(buttons.filter({ hasText: correctAnswer }).first()).toHaveClass(/correct/);
  if (wrongAnswer) {
    await expect(buttons.filter({ hasText: wrongAnswer }).first()).toHaveClass(/wrong/);
  }

  if ((config.reading as any)?.requireEvidenceSupport && question!.sourceRef) {
    await expect(page.getByTestId("reading-evidence-button")).toBeVisible();
  }

  await expectNoConsoleErrors(errors);
});
