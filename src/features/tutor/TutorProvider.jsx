/**
 * TutorProvider.jsx
 *
 * React Context for FoxChild Tutor state management.
 * Provides chat state, preferences, and integration with existing providers.
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useManifest } from "../../react/context/ManifestContext.jsx";
import { useProgress } from "../../react/context/ProgressContext.jsx";
import { useStudyBook } from "../../react/context/StudyBookContext.jsx";
import "./tutor.css";
import { resolveStudyBookSource } from "./studyBookSources.js";
import {
  loadTutorPrefs, saveTutorPrefs, toggleTutorEnabled,
  cycleSpeechMode, getTutorPref, setTutorPref,
  toggleSemanticSearch, setSemanticSearch
} from "./tutorStorage.js";
import {
  generateTutorResponse, maybeSpeakResponse, ResponseType, resetHintProgress
} from "./tutorEngine.js";
import { speak, stop, isSpeaking, SpeechMode } from "./tutorSpeech.js";
import { loadVocabItems } from "@/data.js";

const TutorContext = createContext(null);

/**
 * Initial tutor state.
 */
const INITIAL_STATE = {
  open: false,
  messages: [],
  isLoading: false,
  hintGivenForCurrentQuestion: false,
  speechMode: SpeechMode.TOGGLE,
  semanticSearch: false,
  speechLang: "en-GB",
  enabled: true,
};

/**
 * TutorProvider — manages tutor panel state and integrates with Learning Web context.
 */
export function TutorProvider({ children }) {
  const { manifest, loading: manifestLoading } = useManifest();
  const { progress } = useProgress();
  const { html: studyBookHtml, open: studyBookOpen, openBook } = useStudyBook();

  const [state, setState] = useState(INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Refs for async context (quiz session, reading passage, vocab items)
  const quizSessionRef = useRef(null);
  const readingPassageRef = useRef(null);
  const readingTargetTextRef = useRef(null);
  const vocabItemsRef = useRef(null);
  const datasetRef = useRef(null);
  const quizSessionIdRef = useRef(null);
  const quizQuestionIdRef = useRef(null);

  // Load preferences on mount
  useEffect(() => {
    loadTutorPrefs().then(prefs => {
      setState(prev => ({
        ...prev,
        enabled: prefs.enabled,
        speechMode: prefs.speechMode,
        semanticSearch: prefs.semanticSearch,
        openOnLoad: prefs.openOnLoad,
      }));
      if (prefs.openOnLoad) {
        setState(prev => ({ ...prev, open: true }));
      }
    });
  }, []);

  useEffect(() => {
    if (!studyBookOpen || typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 960px)").matches) return;
    setState(prev => (prev.open ? { ...prev, open: false } : prev));
  }, [studyBookOpen]);

  // Expose methods to update external context refs
  const setQuizSession = useCallback((session) => {
    quizSessionRef.current = session;
    const currentQuestionId = session?.questions?.[session.index]?.id || null;
    const sessionId = session?.id || null;

    if (sessionId && sessionId !== quizSessionIdRef.current) {
      resetHintProgress();
      quizSessionIdRef.current = sessionId;
      quizQuestionIdRef.current = currentQuestionId;
      setState(prev => ({ ...prev, hintGivenForCurrentQuestion: false }));
      return;
    }

    if (currentQuestionId && currentQuestionId !== quizQuestionIdRef.current) {
      resetHintProgress(currentQuestionId);
      quizQuestionIdRef.current = currentQuestionId;
      setState(prev => ({ ...prev, hintGivenForCurrentQuestion: false }));
      return;
    }

    if (!currentQuestionId) {
      quizQuestionIdRef.current = null;
    }
  }, []);

  const setReadingPassage = useCallback((passage, targetText = null) => {
    readingPassageRef.current = passage;
    readingTargetTextRef.current = targetText;
  }, []);

  const setDataset = useCallback(async (dataset) => {
    datasetRef.current = dataset;
    if (dataset) {
      const lang = dataset.speechLanguage || dataset.sourceLanguageCode || "en-GB";
      setState(prev => ({ ...prev, speechLang: lang }));
    }
    if (dataset?.id && manifest) {
      try {
        const vocab = await loadVocabItems(manifest, dataset.id);
        vocabItemsRef.current = vocab;
      } catch (_error) {
        vocabItemsRef.current = null;
      }
    } else {
      vocabItemsRef.current = null;
    }
  }, [manifest]);

  const findStudyBookSource = useCallback((sourceMeta) => {
    return resolveStudyBookSource(manifest, sourceMeta);
  }, [manifest]);

  const openStudyBookSource = useCallback(async (sourceMeta) => {
    const resolved = findStudyBookSource(sourceMeta);
    if (!resolved?.dataset) {
      return { opened: false, anchorFound: false };
    }
    const result = await openBook(resolved.dataset, {
      anchor: sourceMeta?.anchor || null,
      mdPath: resolved.mdPath || sourceMeta?.sourcePath || null,
    });
    return { opened: true, ...(result || {}) };
  }, [findStudyBookSource, openBook]);

  // Core function: send a message to the tutor
  const sendMessage = useCallback(async (userText) => {
    const currentState = stateRef.current;
    if (currentState.isLoading || !userText.trim()) return;

    const trimmedText = userText.trim();

    // Add user message
    const userMessage = { role: "user", text: trimmedText, timestamp: Date.now() };
    setState(prev => ({ ...prev, messages: [...prev.messages, userMessage], isLoading: true }));

    try {
      // Generate tutor response
      const response = await generateTutorResponse({
        query: trimmedText,
        manifest,
        dataset: datasetRef.current,
        quizSession: quizSessionRef.current,
        readingPassage: readingPassageRef.current,
        readingTargetText: readingTargetTextRef.current,
        studyBookHtml: studyBookHtml || null,
        vocabItems: vocabItemsRef.current,
        hintGivenForCurrentQuestion: currentState.hintGivenForCurrentQuestion,
        speechMode: currentState.speechMode,
        semanticSearch: currentState.semanticSearch,
        speechLang: currentState.speechLang,
      });

      // Update hint flag if this was a quiz hint
      let newHintGiven = currentState.hintGivenForCurrentQuestion;
      if (response.metadata?.hintGiven) {
        newHintGiven = true;
      }

      // Add tutor message
      const tutorMessage = {
        role: "tutor",
        text: response.text,
        timestamp: Date.now(),
        type: response.type,
        metadata: response.metadata,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, tutorMessage],
        isLoading: false,
        hintGivenForCurrentQuestion: newHintGiven,
      }));

      // Speak if needed
      if (response.shouldSpeak) {
        await maybeSpeakResponse(response.text, currentState.speechLang, true);
      }
    } catch (error) {
      console.error("Tutor error:", error);
      const errorMessage = {
        role: "tutor",
        text: "Something went wrong. Please try again.",
        timestamp: Date.now(),
        type: ResponseType.REFUSAL,
      };
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false,
      }));
    }
  }, [manifest, studyBookHtml]);

  // Clear chat history
  const clearChat = useCallback(() => {
    setState(prev => ({ ...prev, messages: [], hintGivenForCurrentQuestion: false }));
  }, []);

  // Toggle panel open/closed
  const toggleOpen = useCallback(() => {
    setState(prev => ({ ...prev, open: !prev.open }));
  }, []);

  const openPanel = useCallback(() => setState(prev => ({ ...prev, open: true })), []);
  const closePanel = useCallback(() => setState(prev => ({ ...prev, open: false })), []);

  // Toggle speech mode
  const toggleSpeechMode = useCallback(async () => {
    const newMode = await cycleSpeechMode();
    setState(prev => ({ ...prev, speechMode: newMode }));
    return newMode;
  }, []);

  // Set speech mode directly
  const setSpeechMode = useCallback(async (mode) => {
    await setTutorPref("speechMode", mode);
    setState(prev => ({ ...prev, speechMode: mode }));
  }, []);

  // Toggle semantic search
  const toggleSemanticSearchHandler = useCallback(async () => {
    const newMode = await toggleSemanticSearch();
    setState(prev => ({ ...prev, semanticSearch: newMode }));
    return newMode;
  }, []);

  const setSemanticSearchHandler = useCallback(async (enabled) => {
    const newMode = await setSemanticSearch(enabled);
    setState(prev => ({ ...prev, semanticSearch: newMode }));
    return newMode;
  }, []);

  // Toggle tutor enabled
  const toggleEnabled = useCallback(async () => {
    const newEnabled = await toggleTutorEnabled();
    setState(prev => ({ ...prev, enabled: newEnabled }));
    return newEnabled;
  }, []);

  // Stop current speech
  const stopSpeech = useCallback(() => {
    stop();
  }, []);

  // Check if currently speaking
  const checkSpeaking = useCallback(() => isSpeaking(), []);

  const value = {
    ...state,
    sendMessage,
    clearChat,
    toggleOpen,
    openPanel,
    closePanel,
    toggleSpeechMode,
    setSpeechMode,
    toggleSemanticSearch: toggleSemanticSearchHandler,
    setSemanticSearch: setSemanticSearchHandler,
    toggleEnabled,
    stopSpeech,
    checkSpeaking,
    setQuizSession,
    setReadingPassage,
    setDataset,
    currentDataset: datasetRef.current,
    studyBookOpen,
    findStudyBookSource,
    openStudyBookSource,
    SpeechMode,
    ResponseType,
  };

  return <TutorContext.Provider value={value}>{children}</TutorContext.Provider>;
}

/**
 * Hook to access tutor context.
 */
export function useTutor() {
  const ctx = useContext(TutorContext);
  if (!ctx) {
    throw new Error("useTutor must be used within TutorProvider");
  }
  return ctx;
}
