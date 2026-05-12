/**
 * App.jsx
 *
 * React root component — full port of the vanilla learning-web app.
 * Six tabs: Home, Vocabulary, Quiz, Reading, Builder, Review.
 *
 * LEGACY NOTE: The vanilla main.js app (index.html) continues to work
 * independently. This React app shares the same data/ files.
 */

import { useState, useCallback } from "react";
import { ManifestProvider } from "./context/ManifestContext.jsx";
import { ProgressProvider } from "./context/ProgressContext.jsx";
import HomePage from "./pages/HomePage.jsx";
import VocabPage from "./pages/VocabPage.jsx";
import QuizPage from "./pages/QuizPage.jsx";
import ReadingPage from "./pages/ReadingPage.jsx";
import BuilderPage from "./pages/BuilderPage.jsx";
import ReviewPage from "./pages/ReviewPage.jsx";

const TABS = [
  { id: "home",    label: "Home" },
  { id: "vocab",   label: "Vocabulary" },
  { id: "quiz",    label: "Quiz" },
  { id: "reading", label: "Reading" },
  { id: "builder", label: "Builder" },
  { id: "review",  label: "Review" },
];

function Nav({ active, onChange }) {
  return (
    <div className="lw-nav-pills" style={{ marginBottom: "20px", padding: "12px 16px 0", maxWidth: "860px", margin: "0 auto" }}>
      {TABS.map(t => (
        <button
          key={t.id}
          className={`lw-nav-pill ${active === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
          type="button"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState("home");
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
    <div>
      <Nav active={activeTab} onChange={handleTabChange} />

      {activeTab === "home"    && <HomePage    onNavigate={handleNavigate} />}
      {activeTab === "vocab"   && <VocabPage   />}
      {activeTab === "quiz"    && <QuizPage    initialCustomWords={quizCustomWords} />}
      {activeTab === "reading" && <ReadingPage />}
      {activeTab === "builder" && <BuilderPage />}
      {activeTab === "review"  && <ReviewPage  onNavigate={handleNavigate} />}
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
