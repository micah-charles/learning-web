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
import Seo from "./components/Seo.jsx";
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
import ChineseInputPage from "../features/chinese-input/ChineseInputPage.jsx";
import OnboardingPage   from "./pages/OnboardingPage.jsx";
import { useProgress } from "./context/ProgressContext.jsx";
import { listUploadedPacks } from "@/admin-storage.js";
import {
  getAllowedTabsFromPrefs,
  getEverythingPrefs,
  isEverythingMode,
  isLikelyExistingUser,
} from "./utils/personalisation.js";
import { metadataForTab, pathForTab, resolveAppRoute } from "./utils/appRoutes.js";
import { getChineseInputLabAvailability } from "../config/chineseInputLabConfig.js";

// Tabs that have active sessions — re-clicking asks the user to confirm reload.
const SESSION_TABS = new Set(["quiz", "reading", "speak-shadow", "builder", "language", "crossword", "smart-test", "chinese-input"]);
const CHINESE_INPUT_AVAILABILITY = getChineseInputLabAvailability();

function getCurrentRoute() {
  if (typeof window === "undefined") return { tab: "home", notFound: false, canonicalPath: "/" };
  const route = resolveAppRoute(window.location);
  if (route.tab === "chinese-input" && !CHINESE_INPUT_AVAILABILITY.routeEnabled) {
    return { ...route, tab: "not-found", notFound: true };
  }
  return route;
}

function NotFoundPage({ onNavigateHome }) {
  return (
    <section className="lw-page lw-card" data-testid="not-found-page">
      <p className="lw-eyebrow">Page not found</p>
      <h1>That learning page is not here.</h1>
      <p className="lw-subtitle">Go back to FoxChild@Learn home and choose a learning mode.</p>
      <button className="lw-btn lw-btn-primary" type="button" onClick={onNavigateHome}>
        Go back to FoxChild@Learn home
      </button>
    </section>
  );
}

function AppContent() {
  const { progress, updateProgress } = useProgress();
  const [activeTab, setActiveTab]         = useState(() => getCurrentRoute().tab);
  const [routeNotFound, setRouteNotFound] = useState(() => getCurrentRoute().notFound);
  const [quizCustomWords, setQuizCustomWords] = useState(null);
  const [speakShadowResumeId, setSpeakShadowResumeId] = useState("");

  const prefs = progress?.prefs || {};
  const hasUploadedPacks = useMemo(() => listUploadedPacks().length > 0, []);
  const existingUser = isLikelyExistingUser(progress) || hasUploadedPacks;
  const onboardingCompleted = prefs.onboardingCompleted === true;
  const shouldDefaultExistingUserToEverything = existingUser && !onboardingCompleted;
  const shouldShowOnboarding = !onboardingCompleted && !existingUser && activeTab === "home";
  const allowedTabs = useMemo(
    () => shouldDefaultExistingUserToEverything ? null : onboardingCompleted ? getAllowedTabsFromPrefs(prefs) : null,
    [onboardingCompleted, prefs, shouldDefaultExistingUserToEverything],
  );

  const canAccessTab = useCallback((tab) => {
    if (tab === "not-found") return true;
    if (tab === "chinese-input" && CHINESE_INPUT_AVAILABILITY.routeEnabled) return true;
    if (!Array.isArray(allowedTabs) || isEverythingMode(prefs)) return true;
    return allowedTabs.includes(tab);
  }, [allowedTabs, prefs]);

  const setRouteTab = useCallback((tab, opts = {}) => {
    const { replace = false, customWords = null } = opts;
    if (tab === "quiz" && customWords) {
      setQuizCustomWords(customWords);
    } else if (tab !== "__reset__") {
      setQuizCustomWords(null);
    }
    setSpeakShadowResumeId(tab === "speak-shadow" && opts.resumeSessionId ? opts.resumeSessionId : "");
    setRouteNotFound(false);
    setActiveTab(tab);
    if (typeof window === "undefined" || tab === "__reset__") return;
    const nextPath = pathForTab(tab);
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentPath !== nextPath) {
      const method = replace ? "replaceState" : "pushState";
      window.history[method]({ tab }, "", nextPath);
    }
  }, []);

  const navigateToTab = useCallback((tab, opts = {}) => {
    const targetTab = opts.force || canAccessTab(tab) ? tab : "home";
    setRouteTab(targetTab, opts);
  }, [canAccessTab, setRouteTab]);

  const handleNavigate = useCallback((tab, opts = {}) => {
    navigateToTab(tab, opts);
  }, [navigateToTab]);

  const saveOnboarding = useCallback((nextPrefs) => {
    updateProgress((state) => {
      Object.assign(state.prefs, nextPrefs);
    });
    setRouteTab(nextPrefs.selectedInterests?.includes("overview") ? "about" : "home", { replace: true });
  }, [setRouteTab, updateProgress]);

  const saveEverything = useCallback((nextPrefs = getEverythingPrefs()) => {
    updateProgress((state) => {
      Object.assign(state.prefs, nextPrefs);
    });
    setRouteTab("home", { replace: true });
  }, [setRouteTab, updateProgress]);

  useEffect(() => {
    if (!shouldDefaultExistingUserToEverything) return;
    updateProgress((state) => {
      Object.assign(state.prefs, getEverythingPrefs());
    });
  }, [shouldDefaultExistingUserToEverything, updateProgress]);

  useEffect(() => {
    const applyRoute = () => {
      const route = getCurrentRoute();
      setQuizCustomWords(null);
      setActiveTab(route.tab);
      setRouteNotFound(route.notFound);
      if (route.replace && !route.notFound) {
        window.history.replaceState({ tab: route.tab }, "", `${route.canonicalPath}${window.location.search}`);
      }
    };
    applyRoute();
    window.addEventListener("popstate", applyRoute);
    return () => window.removeEventListener("popstate", applyRoute);
  }, []);

  useEffect(() => {
    if (!Array.isArray(allowedTabs)) return;
    if (activeTab === "__reset__") return;
    if (activeTab === "not-found") return;
    if (!canAccessTab(activeTab)) {
      navigateToTab("home", { replace: true, force: true });
    }
  }, [activeTab, allowedTabs, canAccessTab, navigateToTab]);

  function handleTabChange(tab) {
    if (!canAccessTab(tab)) {
      navigateToTab("home", { force: true });
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
    navigateToTab(tab);
  }

  const seoMetadata = routeNotFound
    ? {
      title: "Page Not Found | FoxChild@Learn",
      description: "This FoxChild@Learn page could not be found.",
      canonical: "https://www.foxchildidea.com/",
      image: "https://www.foxchildidea.com/og/default.png",
      noindex: true,
    }
    : metadataForTab(activeTab);
  const hideGlobalTutorWidget = activeTab === "language" || activeTab === "speak-shadow" || activeTab === "chinese-input";

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
      <Seo {...seoMetadata} />
      <Hero
        variant="standard"
        onNavigate={handleNavigate}
        showAiPrompt={!Array.isArray(allowedTabs) || allowedTabs.includes("ai-prompt")}
      />

      <NavBar active={activeTab} onChange={handleTabChange} allowedTabs={allowedTabs} />

      {/* Page content */}
      <main className="lw-main">
        {routeNotFound && <NotFoundPage onNavigateHome={() => navigateToTab("home", { replace: true, force: true })} />}
        {activeTab === "home"      && <HomePage      onNavigate={handleNavigate} onManageLearning={() => navigateToTab("learning-settings", { force: true })} onShowEverything={saveEverything} />}
        {activeTab === "vocab"     && <VocabPage     />}
        {activeTab === "quiz"      && <QuizPage      initialCustomWords={quizCustomWords} />}
        {activeTab === "reading"   && <ReadingPage   />}
        {activeTab === "speak-shadow" && (
          <SpeakShadowPage
            initialResumeId={speakShadowResumeId}
            onResumeConsumed={() => setSpeakShadowResumeId("")}
          />
        )}
        {activeTab === "builder"   && <BuilderPage   />}
        {activeTab === "language"  && <LanguagePage  />}
        {activeTab === "crossword" && <CrosswordPage />}
        {activeTab === "review"    && <ReviewPage    onNavigate={handleNavigate} />}
        {activeTab === "progress"  && <ProgressPage  />}
        {activeTab === "mypacks"   && <MyPacksPage   onNavigate={handleNavigate} />}
        {activeTab === "about"     && <AboutPage     onManageLearning={() => navigateToTab("learning-settings", { force: true })} />}
        {activeTab === "ai-prompt" && <AIPromptBuilder onNavigate={handleNavigate} />}
        {activeTab === "arcade"     && <ArcadeGamePage />}
        {activeTab === "smart-test" && <SmartTestPage  />}
        {activeTab === "chinese-input" && CHINESE_INPUT_AVAILABILITY.routeEnabled && <ChineseInputPage />}
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

      {/* FoxChild Tutor widget — hidden where the page has its own focused tutor UX */}
      {!hideGlobalTutorWidget && <TutorWidget />}
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
