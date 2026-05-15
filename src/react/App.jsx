/**
 * App.jsx
 *
 * React root component — full port of the vanilla learning-web app.
 * Six tabs: Home, Vocabulary, Quiz, Reading, Builder, Review.
 *
 * Layout:
 *   1. <Hero>   — persistent watercolour banner with mascot + stats
 *   2. <NavBar> — sticky pill-tab navigation (warm cream background)
 *   3. <main>   — per-tab page content
 */
import { useState, useCallback } from "react";
import { ManifestProvider } from "./context/ManifestContext.jsx";
import { ProgressProvider } from "./context/ProgressContext.jsx";
import Hero from "./components/layout/Hero.jsx";
import HomePage from "./pages/HomePage.jsx";
import VocabPage from "./pages/VocabPage.jsx";
import QuizPage from "./pages/QuizPage.jsx";
import ReadingPage from "./pages/ReadingPage.jsx";
import BuilderPage from "./pages/BuilderPage.jsx";
import ReviewPage from "./pages/ReviewPage.jsx";

const TABS = [
  { id: "home",    label: "Home"       },
  { id: "vocab",   label: "Vocabulary" },
  { id: "quiz",    label: "Quiz"       },
  { id: "reading", label: "Reading"    },
  { id: "builder", label: "Builder"    },
  { id: "review",  label: "Review"     },
];

function NavBar({ active, onChange }) {
  return (
    <nav className="lw-nav-bar" aria-label="Main navigation">
      <div className="lw-nav-inner">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`lw-nav-pill${active === t.id ? " active" : ""}`}
            onClick={() => onChange(t.id)}
            type="button"
            aria-current={active === t.id ? "page" : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

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
    if (tab !== "quiz") setQuizCustomWords(null);
    setActiveTab(tab);
  }

  return (
    <div className="lw-app">
      {/* Persistent watercolour hero */}
      <Hero />

      {/* Sticky pill nav */}
      <NavBar active={activeTab} onChange={handleTabChange} />

      {/* Page content */}
      <main className="lw-main">
        {activeTab === "home"    && <HomePage    onNavigate={handleNavigate} />}
        {activeTab === "vocab"   && <VocabPage   />}
        {activeTab === "quiz"    && <QuizPage    initialCustomWords={quizCustomWords} />}
        {activeTab === "reading" && <ReadingPage />}
        {activeTab === "builder" && <BuilderPage />}
        {activeTab === "review"  && <ReviewPage  onNavigate={handleNavigate} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ManifestProvider>
      <ProgressProvider>
        <AppContent />
      </ProgressProvider>
    </ManifestProvider>
  );
}
