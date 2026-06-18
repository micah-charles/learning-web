/**
 * App.jsx
 *
 * React root component — full port of the vanilla learning-web app.
 * Eleven tabs matching the vanilla app:
 *   Home | Vocabulary | Quiz | Reading | Builder | Language ✨ |
 *   Crossword | Review | Progress | My Packs | About
 *
 * Layout:
 *   1. <Hero>   — persistent watercolour banner with mascot + stats
 *   2. <NavBar> — sticky pill-tab navigation (warm cream background)
 *   3. <main>   — per-tab page content
 */
import { useEffect, useMemo, useState, useCallback } from "react";
import { ManifestProvider } from "./context/ManifestContext.jsx";
import { ProgressProvider } from "./context/ProgressContext.jsx";
import { StudyBookProvider } from "./context/StudyBookContext.jsx";
import { TutorProvider } from "../features/tutor/TutorProvider.jsx";
import { StudyBookDrawer } from "./components/learning/StudyBookDrawer.jsx";
import { TutorWidget } from "../features/tutor/TutorWidget.jsx";
import Hero from "./components/layout/Hero.jsx";
import NavBar from "./components/layout/NavBar.jsx";
import HomePage      from "./pages/HomePage.jsx";
import VocabPage     from "./pages/VocabPage.jsx";
import QuizPage      from "./pages/QuizPage.jsx";
import ReadingPage   from "./pages/ReadingPage.jsx";
import SpeakShadowPage from "./pages/SpeakShadowPage.jsx";
import BuilderPage   from "./pages/BuilderPage.jsx";
import LanguagePage  from "./pages/LanguagePage.jsx";
import CrosswordPage from "./pages/CrosswordPage.jsx";
import ReviewPage    from "./pages/ReviewPage.jsx";
import ProgressPage  from "./pages/ProgressPage.jsx";
import MyPacksPage      from "./pages/MyPacksPage.jsx";
import AboutPage        from "./pages/AboutPage.jsx";
import AIPromptBuilder  from "./pages/AIPromptBuilder.jsx";
import ArcadeGamePage   from "./games/arcade/ArcadeGamePage.jsx";
import SmartTestPage    from "./pages/SmartTestPage.jsx";
import OnboardingPage   from "./pages/OnboardingPage.jsx";
import { useProgress } from "./context/ProgressContext.jsx";
import { listUploadedPacks } from "@/admin-storage.js";
import {
  getAllowedTabsFromPrefs,
  getEverythingPrefs,
  isEverythingMode,
  isLikelyExistingUser,
} from "./utils/personalisation.js";

// Tabs that have active sessions — re-clicking asks the user to confirm reload.
const SESSION_TABS = new Set(["quiz", "reading", "speak-shadow", "builder", "language", "crossword", "smart-test"]);

function AppContent() {
  const { progress, updateProgress } = useProgress();
  const [activeTab, setActiveTab]         = useState("home");
  const [quizCustomWords, setQuizCustomWords] = useState(null);

  const prefs = progress?.prefs || {};
  const hasUploadedPacks = useMemo(() => listUploadedPacks().length > 0, []);
  const existingUser = isLikelyExistingUser(progress) || hasUploadedPacks;
  const onboardingCompleted = prefs.onboardingCompleted === true;
  const shouldDefaultExistingUserToEverything = existingUser && !onboardingCompleted;
  const shouldShowOnboarding = !onboardingCompleted && !existingUser;
  const allowedTabs = useMemo(
    () => shouldDefaultExistingUserToEverything ? null : onboardingCompleted ? getAllowedTabsFromPrefs(prefs) : null,
    [onboardingCompleted, prefs, shouldDefaultExistingUserToEverything],
  );

  const canAccessTab = useCallback((tab) => {
    if (!Array.isArray(allowedTabs) || isEverythingMode(prefs)) return true;
    return allowedTabs.includes(tab);
  }, [allowedTabs, prefs]);

  const handleNavigate = useCallback((tab, opts = {}) => {
    const targetTab = canAccessTab(tab) ? tab : "home";
    if (targetTab === "quiz" && opts.customWords) {
      setQuizCustomWords(opts.customWords);
    } else {
      setQuizCustomWords(null);
    }
    setActiveTab(targetTab);
  }, [canAccessTab]);

  const saveOnboarding = useCallback((nextPrefs) => {
    updateProgress((state) => {
      Object.assign(state.prefs, nextPrefs);
    });
    setActiveTab(nextPrefs.selectedInterests?.includes("overview") ? "about" : "home");
  }, [updateProgress]);

  const saveEverything = useCallback((nextPrefs = getEverythingPrefs()) => {
    updateProgress((state) => {
      Object.assign(state.prefs, nextPrefs);
    });
    setActiveTab("home");
  }, [updateProgress]);

  useEffect(() => {
    if (!shouldDefaultExistingUserToEverything) return;
    updateProgress((state) => {
      Object.assign(state.prefs, getEverythingPrefs());
    });
  }, [shouldDefaultExistingUserToEverything, updateProgress]);

  useEffect(() => {
    if (!Array.isArray(allowedTabs)) return;
    if (activeTab === "__reset__") return;
    if (!allowedTabs.includes(activeTab)) {
      setQuizCustomWords(null);
      setActiveTab("home");
    }
  }, [activeTab, allowedTabs]);

  function handleTabChange(tab) {
    if (!canAccessTab(tab)) {
      setActiveTab("home");
      return;
    }
    // Re-clicking the same session tab: ask whether to restart
    if (tab === activeTab && SESSION_TABS.has(tab)) {
      if (!window.confirm("Restart this session from the beginning?")) return;
      // Force remount by briefly clearing the tab
      setActiveTab("__reset__");
      requestAnimationFrame(() => setActiveTab(tab));
      return;
    }
    if (tab !== "quiz") setQuizCustomWords(null);
    setActiveTab(tab);
  }

  if (shouldShowOnboarding) {
    return (
      <OnboardingPage
        initialPrefs={prefs}
        onComplete={saveOnboarding}
        onSkipEverything={saveEverything}
      />
    );
  }

  return (
    <div className="lw-app">
      <Hero
        variant="standard"
        onNavigate={handleNavigate}
        showAiPrompt={!Array.isArray(allowedTabs) || allowedTabs.includes("ai-prompt")}
      />

      <NavBar active={activeTab} onChange={handleTabChange} allowedTabs={allowedTabs} />

      {/* Page content */}
      <main className="lw-main">
        {activeTab === "home"      && <HomePage      onNavigate={handleNavigate} onManageLearning={() => setActiveTab("learning-settings")} onShowEverything={saveEverything} />}
        {activeTab === "vocab"     && <VocabPage     />}
        {activeTab === "quiz"      && <QuizPage      initialCustomWords={quizCustomWords} />}
        {activeTab === "reading"   && <ReadingPage   />}
        {activeTab === "speak-shadow" && <SpeakShadowPage />}
        {activeTab === "builder"   && <BuilderPage   />}
        {activeTab === "language"  && <LanguagePage  />}
        {activeTab === "crossword" && <CrosswordPage />}
        {activeTab === "review"    && <ReviewPage    onNavigate={handleNavigate} />}
        {activeTab === "progress"  && <ProgressPage  />}
        {activeTab === "mypacks"   && <MyPacksPage   onNavigate={handleNavigate} />}
        {activeTab === "about"     && <AboutPage     onManageLearning={() => setActiveTab("learning-settings")} />}
        {activeTab === "ai-prompt" && <AIPromptBuilder onNavigate={handleNavigate} />}
        {activeTab === "arcade"     && <ArcadeGamePage />}
        {activeTab === "smart-test" && <SmartTestPage  />}
        {activeTab === "learning-settings" && (
          <OnboardingPage
            editMode
            initialPrefs={prefs}
            onComplete={saveOnboarding}
            onSkipEverything={saveEverything}
          />
        )}
      </main>

      {/* Study Book drawer — rendered once here so it persists across tab switches */}
      <StudyBookDrawer />

      {/* FoxChild Tutor widget — rendered once at App level */}
      <TutorWidget />
    </div>
  );
}

export default function App() {
  return (
    <ManifestProvider>
      <ProgressProvider>
        <StudyBookProvider>
          <TutorProvider>
            <AppContent />
          </TutorProvider>
        </StudyBookProvider>
      </ProgressProvider>
    </ManifestProvider>
  );
}
