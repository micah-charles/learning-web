/**
 * TutorPanel.jsx
 *
 * Chat panel for the FoxChild Tutor.
 * Slides up from the floating button, contains message history, input, and controls.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useTutor } from "./TutorProvider.jsx";

export function TutorPanel() {
  const {
    open,
    messages,
    isLoading,
    speechMode,
    closePanel,
    sendMessage,
    clearChat,
    toggleSpeechMode,
    stopSpeech,
    checkSpeaking,
    SpeechMode,
    setQuizSession,
    setReadingPassage,
    setDataset,
  } = useTutor();

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
    // This will be handled by the tutor engine's speak function
    // For manual read-aloud, we need to trigger it
    // The tutor engine already handles auto-speak
  }, [stopSpeech]);

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
                <div className="tutor-panel__message-text" dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                {msg.role === "tutor" && speechMode === SpeechMode.TOGGLE && (
                  <button
                    className="tutor-panel__read-aloud"
                    type="button"
                    aria-label="Read this message aloud"
                    onClick={() => stopSpeech()} // The tutor engine handles speech
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

/**
 * Simple markdown formatting for tutor messages.
 * Supports **bold**, *italic*, and > blockquotes.
 */
function formatMessage(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^>\s*(.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/\n/g, "<br>");
}