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
import { useState, useCallback } from "react";
import { ManifestProvider } from "./context/ManifestContext.jsx";
import { ProgressProvider } from "./context/ProgressContext.jsx";
import { StudyBookProvider } from "./context/StudyBookContext.jsx";
import { StudyBookDrawer } from "./components/learning/StudyBookDrawer.jsx";
import Hero from "./components/layout/Hero.jsx";
import NavBar from "./components/layout/NavBar.jsx";
import HomePage      from "./pages/HomePage.jsx";
import VocabPage     from "./pages/VocabPage.jsx";
import QuizPage      from "./pages/QuizPage.jsx";
import ReadingPage   from "./pages/ReadingPage.jsx";
import BuilderPage   from "./pages/BuilderPage.jsx";
import LanguagePage  from "./pages/LanguagePage.jsx";
import CrosswordPage from "./pages/CrosswordPage.jsx";
import ReviewPage    from "./pages/ReviewPage.jsx";
import ProgressPage  from "./pages/ProgressPage.jsx";
import MyPacksPage   from "./pages/MyPacksPage.jsx";
import AboutPage     from "./pages/AboutPage.jsx";

// Tabs that have active sessions — re-clicking asks the user to confirm reload.
const SESSION_TABS = new Set(["quiz", "reading", "builder", "language", "crossword"]);

function AppContent() {
  const [activeTab, setActiveTab]         = useState("home");
  const [quizCustomWords, setQuizCustomWords] = useState(null);

  const handleNavigate = useCallback((tab, opts = {}) => {
    if (tab === "quiz" && opts.customWords) {
      setQuizCustomWords(opts.customWords);
    } else {
      setQuizCustomWords(null);
    }
    setActiveTab(tab);
  }, []);

  function handleTabChange(tab) {
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

  return (
    <div className="lw-app">
      <Hero variant="standard" />

      <NavBar active={activeTab} onChange={handleTabChange} />

      {/* Page content */}
      <main className="lw-main">
        {activeTab === "home"      && <HomePage      onNavigate={handleNavigate} />}
        {activeTab === "vocab"     && <VocabPage     />}
        {activeTab === "quiz"      && <QuizPage      initialCustomWords={quizCustomWords} />}
        {activeTab === "reading"   && <ReadingPage   />}
        {activeTab === "builder"   && <BuilderPage   />}
        {activeTab === "language"  && <LanguagePage  />}
        {activeTab === "crossword" && <CrosswordPage />}
        {activeTab === "review"    && <ReviewPage    onNavigate={handleNavigate} />}
        {activeTab === "progress"  && <ProgressPage  />}
        {activeTab === "mypacks"   && <MyPacksPage   />}
        {activeTab === "about"     && <AboutPage     />}
      </main>

      {/* Study Book drawer — rendered once here so it persists across tab switches */}
      <StudyBookDrawer />
    </div>
  );
}

export default function App() {
  return (
    <ManifestProvider>
      <ProgressProvider>
        <StudyBookProvider>
          <AppContent />
        </StudyBookProvider>
      </ProgressProvider>
    </ManifestProvider>
  );
}
