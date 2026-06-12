/**
 * TutorPanel.jsx
 *
 * Chat panel for the FoxChild Tutor.
 * Slides up from the floating button, contains message history, input, and controls.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useTutor } from "./TutorProvider.jsx";
import { useStudyBook } from "../../react/context/StudyBookContext.jsx";

/**
 * Safe markdown formatting for tutor messages.
 * Applies **bold**, *italic*, > blockquotes, and line breaks.
 * Returns an array of React nodes (React handles escaping automatically).
 */
function formatMessage(text) {
  if (!text) return [];
  
  // Split by newlines to handle blockquotes and line breaks
  const lines = text.split("\n");
  const nodes = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle blockquotes
    if (line.startsWith("> ")) {
      const content = line.slice(2);
      const inlineNodes = parseInlineMarkdown(content);
      nodes.push(<blockquote key={`bq-${i}`}>{inlineNodes}</blockquote>);
    } else {
      const inlineNodes = parseInlineMarkdown(line);
      nodes.push(<div key={`line-${i}`}>{inlineNodes}</div>);
    }
    
    // Add line break between lines (except last)
    if (i < lines.length - 1) {
      nodes.push(<br key={`br-${i}`} />);
    }
  }
  
  return nodes;
}

/**
 * Parse inline markdown: **bold**, *italic*
 * Returns array of React nodes. React handles text escaping.
 */
function parseInlineMarkdown(text) {
  if (!text) return [];
  
  const nodes = [];
  let remaining = text;
  let keyCounter = 0;
  
  // Pattern to match **bold** or *italic* (non-greedy)
  const pattern = /(\*\*.+?\*\*|\*.+?\*)/g;
  let match;
  let lastIndex = 0;
  
  while ((match = pattern.exec(remaining)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      nodes.push(<span key={`text-${keyCounter++}`}>{remaining.slice(lastIndex, match.index)}</span>);
    }
    
    // The matched markdown
    const matched = match[1];
    if (matched.startsWith("**") && matched.endsWith("**")) {
      nodes.push(<strong key={`bold-${keyCounter++}`}>{matched.slice(2, -2)}</strong>);
    } else if (matched.startsWith("*") && matched.endsWith("*")) {
      nodes.push(<em key={`italic-${keyCounter++}`}>{matched.slice(1, -1)}</em>);
    }
    
    lastIndex = match.index + matched.length;
  }
  
  // Remaining text after last match
  if (lastIndex < remaining.length) {
    nodes.push(<span key={`text-${keyCounter++}`}>{remaining.slice(lastIndex)}</span>);
  }
  
  // If no markdown found, return the whole text
  if (nodes.length === 0) {
    return <span>{text}</span>;
  }
  
  return nodes;
}

export function TutorPanel() {
  const {
    open,
    messages,
    isLoading,
    speechMode,
    semanticSearch,
    closePanel,
    sendMessage,
    clearChat,
    toggleSpeechMode,
    toggleSemanticSearch,
    stopSpeech,
    checkSpeaking,
    SpeechMode,
    setQuizSession,
    setReadingPassage,
    setDataset,
    dataset,
    findDatasetByPackId,
  } = useTutor();

  const { openBook } = useStudyBook();

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        closePanel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closePanel]);

  // Handle form submit
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue.trim());
      setInputValue("");
    }
  }, [inputValue, isLoading, sendMessage]);

  // Handle read aloud for a specific message
  const handleReadAloud = useCallback(async (text) => {
    await stopSpeech();
    // Speak the message text using browser TTS
    // Use the same speech lang logic as the tutor engine
    // For simplicity, default to en-GB; could be enhanced to detect language
    if ("speechSynthesis" in window && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-GB";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [stopSpeech]);

  // Handle show evidence - open Study Book at specific anchor
  const handleShowEvidence = useCallback((packId, anchor) => {
    // Find the dataset that contains this packId
    const targetDataset = findDatasetByPackId(packId);
    if (targetDataset) {
      openBook(targetDataset, { anchor });
    } else if (dataset?.id) {
      // Fallback to current dataset if pack not found
      openBook(dataset, { anchor });
    }
  }, [findDatasetByPackId, openBook, dataset]);

  if (!open) return null;

  return (
    <>
      {/* Scrim for mobile */}
      <div
        className="tutor-scrim"
        onClick={closePanel}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        className="tutor-panel"
        role="dialog"
        aria-label="FoxChild Tutor"
        aria-modal="true"
      >
        {/* Header */}
        <header className="tutor-panel__header">
          <h2 className="tutor-panel__title">FoxChild Tutor</h2>
          <div className="tutor-panel__header-actions">
            {/* Speech mode toggle */}
            <button
              className={`tutor-panel__speech-btn ${speechMode !== SpeechMode.NONE ? "active" : ""}`}
              type="button"
              aria-label={`Speech mode: ${speechMode}. Click to cycle.`}
              aria-pressed={speechMode !== SpeechMode.NONE}
              onClick={toggleSpeechMode}
              title={`Speech: ${speechMode === SpeechMode.NONE ? "Off" : speechMode === SpeechMode.TOGGLE ? "Per message" : "Always"}. Click to change.`}
            >
              {speechMode === SpeechMode.NONE ? "🔇" : speechMode === SpeechMode.TOGGLE ? "🔊" : "🔈"}
            </button>
            {/* Semantic search toggle */}
            <button
              className={`tutor-panel__semantic-btn ${semanticSearch ? "active" : ""}`}
              type="button"
              aria-label={`Smart search: ${semanticSearch ? "enabled" : "disabled"}. Click to toggle.`}
              aria-pressed={semanticSearch}
              onClick={toggleSemanticSearch}
              title={`Smart search (semantic/embedding search): ${semanticSearch ? "On" : "Off"}. Click to toggle.`}
            >
              {semanticSearch ? "🧠✨" : "🧠"}
            </button>
            {/* Clear chat */}
            {messages.length > 0 && (
              <button
                className="tutor-panel__clear-btn"
                type="button"
                aria-label="Clear chat history"
                onClick={clearChat}
                title="Clear chat"
              >
                🗑️
              </button>
            )}
            {/* Close */}
            <button
              className="tutor-panel__close-btn"
              type="button"
              aria-label="Close tutor panel"
              onClick={closePanel}
            >
              ✕
            </button>
          </div>
        </header>

        {/* Messages area */}
        <div className="tutor-panel__messages" role="log" aria-live="polite" aria-label="Chat messages">
          {messages.length === 0 && (
            <div className="tutor-panel__welcome">
              <p>👋 Hello! I'm your FoxChild Tutor.</p>
              <p>Ask me about:</p>
              <ul>
                <li>The current quiz question (hints first!)</li>
                <li>Vocabulary meanings and examples</li>
                <li>Reading passage comprehension</li>
                <li>Your Study Book notes</li>
                <li>Grammar help (cases, tenses, PEE structure)</li>
              </ul>
              <p className="tutor-panel__hint">I only know about your current pack and study book.</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`tutor-panel__message tutor-panel__message--${msg.role}`}
              role={msg.role === "tutor" ? "article" : undefined}
            >
              <div className="tutor-panel__message-bubble">
                <div className="tutor-panel__message-text">{formatMessage(msg.text)}</div>
                
                {/* Source attribution for studybook snippets (supports both old and new metadata shapes) */}
                {msg.role === "tutor" && msg.metadata && (msg.metadata.source === "studybook" || msg.metadata.studybook) && (
                  <div className="tutor-panel__source-badge">
                    <span>📖 {msg.metadata.studybook?.subject || msg.metadata.subject || "Study Book"}: {msg.metadata.studybook?.heading || msg.metadata.heading || msg.metadata.packId}</span>
                  </div>
                )}

                {/* Show Evidence button for studybook snippets with anchor */}
                {msg.role === "tutor" && msg.metadata && (msg.metadata.source === "studybook" || msg.metadata.studybook) && (msg.metadata.studybook?.anchor || msg.metadata.anchor) && (
                  <button
                    className="tutor-panel__evidence-btn"
                    type="button"
                    aria-label={`Show evidence in Study Book: ${msg.metadata.studybook?.heading || msg.metadata.heading || msg.metadata.packId}`}
                    onClick={() => handleShowEvidence(
                      msg.metadata.studybook?.packId || msg.metadata.packId,
                      msg.metadata.studybook?.anchor || msg.metadata.anchor
                    )}
                    title={`Open Study Book at "${msg.metadata.studybook?.heading || msg.metadata.heading || "section"}"`}
                  >
                    📖 Show evidence
                  </button>
                )}
                
                {msg.role === "tutor" && speechMode === SpeechMode.TOGGLE && (
                  <button
                    className="tutor-panel__read-aloud"
                    type="button"
                    aria-label="Read this message aloud"
                    onClick={() => handleReadAloud(msg.text)}
                    title="Read aloud"
                  >
                    🔊
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="tutor-panel__message tutor-panel__message--tutor tutor-panel__message--loading">
              <div className="tutor-panel__message-bubble">
                <span className="tutor-panel__typing-indicator">
                  <span></span><span></span><span></span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form className="tutor-panel__input-area" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="tutor-panel__input"
            placeholder="Ask about the quiz, vocabulary, reading, or notes..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            aria-label="Your question"
            autoComplete="off"
          />
          <button
            type="submit"
            className="tutor-panel__send-btn"
            disabled={!inputValue.trim() || isLoading}
            aria-label="Send message"
          >
            ➤
          </button>
        </form>
      </aside>
    </>
  );
}