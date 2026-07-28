import { useMemo, useState } from "react";
import {
  INTEREST_OPTIONS,
  getDefaultOnboardingPrefs,
  getEverythingPrefs,
  getPresetPrefsFromWizard,
  getRecommendedCurriculumsFromInterests,
  getRecommendedModulesFromInterests,
  getRecommendedSubjectsFromInterests,
  getWizardNeedsLevel,
  getWizardRecommendationLabels,
  isEverythingMode,
  normaliseOnboardingPrefs,
} from "../utils/personalisation.js";
import { getChineseInputLabAvailability } from "../../config/chineseInputLabConfig.js";

const CHINESE_INPUT_DISCOVERABLE = getChineseInputLabAvailability().discoverable;

const MODULE_OPTIONS = [
  { id: "home", label: "Home", description: "A gentle overview and quick starts." },
  { id: "language", label: "Language Ladder", description: "Structured language practice." },
  { id: "speak-shadow", label: "Speak Lab", description: "Guided read-aloud and shadowing practice." },
  ...(CHINESE_INPUT_DISCOVERABLE ? [{ id: "chinese-input", label: "Chinese Input Lab", description: "Learn Cangjie and Quick Chinese typing." }] : []),
  { id: "quiz", label: "Quiz", description: "Fast recall and revision checks." },
  { id: "arcade", label: "Arcade", description: "Mini games for revision." },
  { id: "smart-test", label: "Smart Test", description: "Adaptive test-style practice." },
  { id: "vocab", label: "Vocabulary", description: "Browse words, terms and definitions." },
  { id: "reading", label: "Reading", description: "Comprehension passages and questions." },
  { id: "builder", label: "Builder", description: "Sentence and idea building." },
  { id: "crossword", label: "Crossword", description: "Puzzle-style vocabulary recall." },
  { id: "progress", label: "Progress", description: "See recent activity and mastery." },
  { id: "mypacks", label: "My Packs", description: "Upload your own JSON packs." },
  { id: "about", label: "About", description: "Understand the project and how it works." },
  { id: "ai-prompt", label: "AI Pack Creator", description: "Create prompts for new packs." },
];

const CURRICULUM_OPTIONS = [
  { id: "ks3", label: "KS3" },
  { id: "gcse", label: "GCSE" },
  { id: "us-middle-school", label: "US Middle School" },
];

const SUBJECT_OPTIONS = [
  { id: "language", label: "Languages" },
  { id: "history", label: "History" },
  { id: "geography", label: "Geography" },
  { id: "science", label: "Science" },
  { id: "literature", label: "Literature" },
  { id: "computing", label: "Computing" },
  { id: "religion", label: "Religious Studies" },
];

const LEARNER_OPTIONS = [
  { id: "student", title: "A child / student", description: "Keep the first route focused and easy to start." },
  { id: "parent", title: "A parent helping a child", description: "Prioritise clear practice and progress tracking." },
  { id: "teacher", title: "A teacher / tutor", description: "Surface class-friendly pack and quiz tools." },
  { id: "explorer", title: "I am exploring the website", description: "Give me a guided tour before I choose deeply." },
];

const GOAL_OPTIONS = [
  { id: "languages", title: "Learn a language", description: "Language Ladder, vocabulary, quiz and sentence practice." },
  { id: "school-revision", title: "School revision", description: "Quiz, reading, builder practice and progress." },
  { id: "reading", title: "Reading comprehension", description: "Passages with follow-up questions and study support." },
  { id: "games", title: "Play learning games", description: "Arcade, quiz challenges and builder games." },
  { id: "create-packs", title: "Create my own packs", description: "Upload your own packs or build an AI prompt." },
  { id: "explore", title: "Explore everything", description: "Show all tabs, packs and curricula." },
];

const LEVEL_OPTIONS = [
  { id: "ks3", title: "KS3", description: "UK Key Stage 3 practice." },
  { id: "gcse", title: "GCSE", description: "UK GCSE-style revision." },
  { id: "us-middle-school", title: "US Middle School", description: "US middle-school level practice." },
  { id: "unsure", title: "Not sure - recommend for me", description: "Start broad and narrow it later." },
];

function toggleValue(values, value) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function mergeUnique(...groups) {
  return [...new Set(groups.flat().filter(Boolean))];
}

function saveWithFallback(onComplete, onSkipEverything, prefs) {
  if (isEverythingMode(prefs)) {
    if (onSkipEverything) onSkipEverything(prefs);
    else onComplete?.(prefs);
    return;
  }
  onComplete?.(prefs);
}

function WizardChoice({ selected, title, description, onClick }) {
  return (
    <button
      type="button"
      className={`lw-onboarding-choice-card${selected ? " is-selected" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="lw-onboarding-option-title">{title}</span>
      <span className="lw-onboarding-option-copy">{description}</span>
      <span className="lw-onboarding-option-state">{selected ? "Selected" : "Choose"}</span>
    </button>
  );
}

function OptionButton({ selected, title, description, onClick, tone = "" }) {
  return (
    <button
      type="button"
      className={`lw-onboarding-option${selected ? " lw-onboarding-option--selected" : ""}${tone ? ` ${tone}` : ""}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="lw-onboarding-option-title">{title}</span>
      <span className="lw-onboarding-option-copy">{description}</span>
      <span className="lw-onboarding-option-state">{selected ? "Selected" : "Choose"}</span>
    </button>
  );
}

function SmallToggle({ id, label, selected, onToggle }) {
  return (
    <button
      type="button"
      className={`lw-chip-toggle${selected ? " is-selected" : ""}`}
      onClick={() => onToggle(id)}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}

function AdvancedSettings({
  selectedInterests,
  selectedModules,
  selectedCurriculums,
  selectedSubjects,
  setSelectedInterests,
  setSelectedModules,
  setSelectedCurriculums,
  setSelectedSubjects,
  onComplete,
  onSkipEverything,
  onBackToWizard,
}) {
  const recommended = useMemo(() => {
    const modules = getRecommendedModulesFromInterests(selectedInterests);
    const curriculums = getRecommendedCurriculumsFromInterests(selectedInterests);
    const subjects = getRecommendedSubjectsFromInterests(selectedInterests);
    return { modules, curriculums, subjects };
  }, [selectedInterests]);

  const effectiveModules = selectedModules.length ? selectedModules : recommended.modules;
  const effectiveCurriculums = selectedCurriculums.length ? selectedCurriculums : recommended.curriculums;
  const effectiveSubjects = selectedSubjects.length ? selectedSubjects : recommended.subjects;
  const everythingSelected = selectedInterests.includes("everything");

  function selectInterest(id) {
    if (id === "everything") {
      setSelectedInterests(["everything"]);
      setSelectedModules([]);
      setSelectedCurriculums([]);
      setSelectedSubjects([]);
      return;
    }

    const nextInterests = toggleValue(selectedInterests.filter((item) => item !== "everything"), id);
    setSelectedInterests(nextInterests);
    setSelectedModules((current) => mergeUnique(current, getRecommendedModulesFromInterests(nextInterests)));
    setSelectedCurriculums((current) => mergeUnique(current, getRecommendedCurriculumsFromInterests(nextInterests)));
    setSelectedSubjects((current) => mergeUnique(current, getRecommendedSubjectsFromInterests(nextInterests)));
  }

  function saveGuided() {
    const interests = selectedInterests.filter((item) => item !== "everything");
    const next = normaliseOnboardingPrefs({
      selectedInterests: interests.length ? interests : ["overview"],
      selectedModules: effectiveModules.length ? effectiveModules : ["home", "about", "quiz", "reading", "arcade"],
      selectedCurriculums: effectiveCurriculums,
      selectedSubjects: effectiveSubjects,
    });
    onComplete?.(next);
  }

  function saveEverything() {
    saveWithFallback(onComplete, onSkipEverything, getEverythingPrefs());
  }

  return (
    <>
      <section className="lw-card">
        <div className="lw-onboarding-section-head">
          <div>
            <h2 className="lw-section-title">Advanced settings</h2>
            <p className="lw-subtitle">Fine-tune exactly which interests, tabs, curricula and subjects are visible.</p>
          </div>
          <button className="lw-btn lw-btn-ghost" type="button" onClick={onBackToWizard}>
            Back to simple setup
          </button>
        </div>

        <div className="lw-onboarding-grid">
          {INTEREST_OPTIONS.map((option) => (
            <OptionButton
              key={option.id}
              title={option.title}
              description={option.description}
              selected={selectedInterests.includes(option.id)}
              tone={option.everything ? "lw-onboarding-option--everything" : ""}
              onClick={() => selectInterest(option.id)}
            />
          ))}
        </div>
      </section>

      {!everythingSelected && (
        <section className="lw-card">
          <h2 className="lw-section-title">Modules and filters</h2>
          <p className="lw-subtitle">
            These are based on your choices. Add or remove anything you want before saving.
          </p>
          <div className="lw-onboarding-module-grid">
            {MODULE_OPTIONS.map((module) => (
              <OptionButton
                key={module.id}
                title={module.label}
                description={module.description}
                selected={effectiveModules.includes(module.id)}
                onClick={() => setSelectedModules((current) => toggleValue(effectiveModules.length ? effectiveModules : current, module.id))}
              />
            ))}
          </div>

          <div className="lw-onboarding-filter-row">
            <div>
              <h3 className="lw-field-heading">Curriculum focus</h3>
              <div className="lw-chip-toggle-row">
                {CURRICULUM_OPTIONS.map((item) => (
                  <SmallToggle
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    selected={effectiveCurriculums.includes(item.id)}
                    onToggle={(id) => setSelectedCurriculums((current) => toggleValue(effectiveCurriculums.length ? effectiveCurriculums : current, id))}
                  />
                ))}
              </div>
            </div>
            <div>
              <h3 className="lw-field-heading">Subject focus</h3>
              <div className="lw-chip-toggle-row">
                {SUBJECT_OPTIONS.map((item) => (
                  <SmallToggle
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    selected={effectiveSubjects.includes(item.id)}
                    onToggle={(id) => setSelectedSubjects((current) => toggleValue(effectiveSubjects.length ? effectiveSubjects : current, id))}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="lw-card lw-onboarding-actions">
        <div>
          <h2 className="lw-section-title">{everythingSelected ? "Ready for the full app?" : "Ready to start?"}</h2>
          <p className="lw-subtitle">
            {everythingSelected
              ? "Everything mode keeps all tabs, subjects and curricula visible."
              : "Guided mode keeps the app calmer while leaving Home, Progress, My Packs and About available."}
          </p>
        </div>
        <div className="lw-btn-group">
          <button className="lw-btn lw-btn-secondary" type="button" onClick={saveEverything}>
            Show everything
          </button>
          <button className="lw-btn lw-btn-primary" type="button" onClick={everythingSelected ? saveEverything : saveGuided}>
            Save learning setup
          </button>
        </div>
      </section>
    </>
  );
}

export default function OnboardingPage({
  initialPrefs,
  onComplete,
  onSkipEverything,
  editMode = false,
}) {
  const seed = { ...getDefaultOnboardingPrefs(), ...(initialPrefs || {}) };
  const [step, setStep] = useState("learner");
  const [learnerType, setLearnerType] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [level, setLevel] = useState("unsure");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState(() => seed.selectedInterests || []);
  const [selectedModules, setSelectedModules] = useState(() => seed.selectedModules || []);
  const [selectedCurriculums, setSelectedCurriculums] = useState(() => seed.selectedCurriculums || []);
  const [selectedSubjects, setSelectedSubjects] = useState(() => seed.selectedSubjects || []);

  const wizardPrefs = useMemo(
    () => getPresetPrefsFromWizard({ learnerType, primaryGoal, level }),
    [learnerType, primaryGoal, level],
  );
  const recommendationLabels = useMemo(() => getWizardRecommendationLabels(wizardPrefs), [wizardPrefs]);
  const needsLevel = getWizardNeedsLevel(primaryGoal);

  function saveEverything() {
    saveWithFallback(onComplete, onSkipEverything, getEverythingPrefs());
  }

  function chooseLearner(id) {
    setLearnerType(id);
    setStep("goal");
  }

  function chooseGoal(id) {
    setPrimaryGoal(id);
    setStep(getWizardNeedsLevel(id) ? "level" : "summary");
  }

  function chooseLevel(id) {
    setLevel(id);
    setStep("summary");
  }

  function customiseMore() {
    setSelectedInterests(wizardPrefs.selectedInterests || []);
    setSelectedModules(wizardPrefs.selectedModules || []);
    setSelectedCurriculums(wizardPrefs.selectedCurriculums || []);
    setSelectedSubjects(wizardPrefs.selectedSubjects || []);
    setAdvancedMode(true);
  }

  function startLearning() {
    saveWithFallback(onComplete, onSkipEverything, wizardPrefs);
  }

  return (
    <div className="lw-page lw-onboarding" data-testid="onboarding-page" aria-labelledby="onboarding-title">
      <section className="lw-card lw-onboarding-hero">
        <p className="lw-onboarding-eyebrow">{editMode ? "Personalise your space" : "First visit setup"}</p>
        <h1 id="onboarding-title">Welcome to FoxChild Learning</h1>
        <p className="lw-onboarding-subtitle">
          Choose what you want to learn today. You can change this later.
        </p>
      </section>

      {advancedMode ? (
        <AdvancedSettings
          selectedInterests={selectedInterests}
          selectedModules={selectedModules}
          selectedCurriculums={selectedCurriculums}
          selectedSubjects={selectedSubjects}
          setSelectedInterests={setSelectedInterests}
          setSelectedModules={setSelectedModules}
          setSelectedCurriculums={setSelectedCurriculums}
          setSelectedSubjects={setSelectedSubjects}
          onComplete={onComplete}
          onSkipEverything={onSkipEverything}
          onBackToWizard={() => setAdvancedMode(false)}
        />
      ) : (
        <>
          <section className="lw-card lw-onboarding-summary">
            <div className="lw-onboarding-section-head">
              <div>
                <div className="lw-onboarding-stepper" aria-label="Setup progress">
                  <span className={step === "learner" ? "is-current" : ""}>1. Learner</span>
                  <span className={step === "goal" ? "is-current" : ""}>2. Goal</span>
                  <span className={step === "level" ? "is-current" : ""}>3. Level</span>
                  <span className={step === "summary" ? "is-current" : ""}>4. Start</span>
                </div>
              </div>
              <div className="lw-btn-group">
                {editMode && (
                  <button className="lw-btn lw-btn-ghost" data-testid="onboarding-advanced-button" type="button" onClick={() => setAdvancedMode(true)}>
                    Advanced settings
                  </button>
                )}
                <button className="lw-btn lw-btn-secondary" data-testid="onboarding-show-everything-button" type="button" onClick={saveEverything}>
                  Show everything
                </button>
              </div>
            </div>
          </section>

          {step === "learner" && (
            <section className="lw-card">
              <h2 className="lw-section-title">Who is learning?</h2>
              <p className="lw-subtitle">Who are you setting this up for?</p>
              <div className="lw-onboarding-choice-grid">
                {LEARNER_OPTIONS.map((option) => (
                  <WizardChoice
                    key={option.id}
                    title={option.title}
                    description={option.description}
                    selected={learnerType === option.id}
                    onClick={() => chooseLearner(option.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {step === "goal" && (
            <section className="lw-card">
              <h2 className="lw-section-title">What do you want to do first?</h2>
              <p className="lw-subtitle">Pick the first thing you want FoxChild to make easy.</p>
              <div className="lw-onboarding-choice-grid">
                {GOAL_OPTIONS.map((option) => (
                  <WizardChoice
                    key={option.id}
                    title={option.title}
                    description={option.description}
                    selected={primaryGoal === option.id}
                    onClick={() => chooseGoal(option.id)}
                  />
                ))}
              </div>
              <div className="lw-onboarding-actions">
                <button className="lw-btn lw-btn-ghost" type="button" onClick={() => setStep("learner")}>
                  Back
                </button>
              </div>
            </section>
          )}

          {step === "level" && needsLevel && (
            <section className="lw-card">
              <h2 className="lw-section-title">Which level fits best?</h2>
              <p className="lw-subtitle">Choose the closest level. You can change this later.</p>
              <div className="lw-onboarding-choice-grid">
                {LEVEL_OPTIONS.map((option) => (
                  <WizardChoice
                    key={option.id}
                    title={option.title}
                    description={option.description}
                    selected={level === option.id}
                    onClick={() => chooseLevel(option.id)}
                  />
                ))}
              </div>
              <div className="lw-onboarding-actions">
                <button className="lw-btn lw-btn-ghost" type="button" onClick={() => setStep("goal")}>
                  Back
                </button>
              </div>
            </section>
          )}

          {step === "summary" && (
            <section className="lw-card lw-onboarding-summary">
              <p className="lw-onboarding-eyebrow">Recommended setup</p>
              <h2 className="lw-section-title">
                {isEverythingMode(wizardPrefs) ? "Everything mode is ready." : "We recommend starting with:"}
              </h2>
              <div className="lw-learning-summary-row">
                {recommendationLabels.map((label) => (
                  <span key={label} className="lw-chip blue">{label}</span>
                ))}
              </div>
              <p className="lw-subtitle">
                {isEverythingMode(wizardPrefs)
                  ? "You will see all tabs, all packs and all curricula."
                  : "This keeps the app calmer at first. You can change this later from Manage Learning."}
              </p>
              <div className="lw-btn-group">
                <button
                  className="lw-btn lw-btn-ghost"
                  type="button"
                  onClick={() => setStep(needsLevel ? "level" : "goal")}
                >
                  Back
                </button>
                <button className="lw-btn lw-btn-primary" data-testid="onboarding-start-button" type="button" onClick={startLearning}>
                  Start learning
                </button>
                <button className="lw-btn lw-btn-secondary" data-testid="onboarding-customise-button" type="button" onClick={customiseMore}>
                  Customise more
                </button>
                <button className="lw-btn lw-btn-secondary" data-testid="onboarding-show-everything-button" type="button" onClick={saveEverything}>
                  Show everything instead
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
