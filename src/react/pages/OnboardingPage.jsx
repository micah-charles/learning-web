import { useMemo, useState } from "react";
import {
  ALL_MODULE_IDS,
  INTEREST_OPTIONS,
  getDefaultOnboardingPrefs,
  getEverythingPrefs,
  getRecommendedCurriculumsFromInterests,
  getRecommendedModulesFromInterests,
  getRecommendedSubjectsFromInterests,
  normaliseOnboardingPrefs,
} from "../utils/personalisation.js";

const MODULE_OPTIONS = [
  { id: "home", label: "Home", description: "A gentle overview and quick starts." },
  { id: "language", label: "Language Ladder", description: "Structured language practice." },
  { id: "quiz", label: "Quiz", description: "Fast recall and revision checks." },
  { id: "smart-test", label: "Smart Test", description: "Adaptive test-style practice." },
  { id: "arcade", label: "Arcade", description: "Mini games for revision." },
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

function toggleValue(values, value) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function mergeUnique(...groups) {
  return [...new Set(groups.flat().filter(Boolean))];
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
      <span className="lw-onboarding-option-state">
        {selected ? "Selected" : "Choose"}
      </span>
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

export default function OnboardingPage({
  initialPrefs,
  onComplete,
  onSkipEverything,
  editMode = false,
}) {
  const seed = { ...getDefaultOnboardingPrefs(), ...(initialPrefs || {}) };
  const [selectedInterests, setSelectedInterests] = useState(() => seed.selectedInterests || []);
  const [selectedModules, setSelectedModules] = useState(() => seed.selectedModules || []);
  const [selectedCurriculums, setSelectedCurriculums] = useState(() => seed.selectedCurriculums || []);
  const [selectedSubjects, setSelectedSubjects] = useState(() => seed.selectedSubjects || []);

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
    const next = getEverythingPrefs();
    if (onSkipEverything) onSkipEverything(next);
    else onComplete?.(next);
  }

  return (
    <main className="lw-page lw-onboarding" aria-labelledby="onboarding-title">
      <section className="lw-card lw-onboarding-hero">
        <p className="lw-onboarding-eyebrow">{editMode ? "Personalise your space" : "First visit setup"}</p>
        <h1 id="onboarding-title">Welcome to FoxChild Learning</h1>
        <p className="lw-onboarding-subtitle">
          Choose what you want to learn today. You can change this later.
        </p>
      </section>

      <section className="lw-card">
        <div className="lw-onboarding-section-head">
          <div>
            <h2 className="lw-section-title">What are you looking for?</h2>
            <p className="lw-subtitle">Pick one or more. We&apos;ll recommend a simpler set of tabs and packs.</p>
          </div>
          <button className="lw-btn lw-btn-ghost" type="button" onClick={saveEverything}>
            Show me everything
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
          <h2 className="lw-section-title">Recommended modules</h2>
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
          <button
            className="lw-btn lw-btn-primary"
            type="button"
            onClick={everythingSelected ? saveEverything : saveGuided}
          >
            {editMode ? "Save learning setup" : "Start learning"}
          </button>
        </div>
      </section>
    </main>
  );
}
