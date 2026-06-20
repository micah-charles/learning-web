import { useEffect, useMemo, useRef, useState } from "react";
import { useManifest } from "../context/ManifestContext.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { LabeledSelect, LoadingText } from "../components/layout/Controls.jsx";
import { listPassageGroups, loadPassagePack } from "@/data.js";
import { isSpeechSynthesisSupported, speakText, stopSpeaking } from "@/utils.js";
import { useSpeechRecognitionAttempt } from "../hooks/useSpeechRecognitionAttempt.js";
import {
  CHINESE_VOICE_LOCALES,
  DEFAULT_CHINESE_VOICE_LOCALE,
  DEFAULT_SPEAK_SHADOW_SETTINGS,
  PHRASE_LENGTHS,
  PHRASE_STATUS,
  SPEAK_SHADOW_LANGUAGES,
  TUTOR_MESSAGES,
  TUTOR_STATES,
  getChineseVoiceLocale,
  getSpeakShadowLanguageByLocale,
  resolveSpeakShadowSpeech,
} from "../utils/speakShadowConfig.js";
import {
  createSpeakShadowSession,
  ensureSpeakShadowSession,
  getSpeakShadowTextLimit,
  normalizeTranscriptForDisplay,
} from "../utils/speakShadowSegmenter.js";
import { evaluateBufferedUtterance } from "../utils/speakShadowUtteranceBuffer.js";
import {
  buildTutorChatMessages,
  getFoxTutorState,
  getNextStepLabel,
  getTutorStatusLabel,
} from "../utils/foxTutorEngine.js";

const INITIAL_FORM = {
  title: "",
  text: "",
  language: "en",
  voiceLocale: DEFAULT_CHINESE_VOICE_LOCALE,
  phraseLength: "medium",
  passThreshold: 85,
  minConfidence: 60,
  tutorMode: true,
  autoAdvanceOnPass: true,
  autoReadNextPhrase: true,
  savedToBrowser: true,
};

function clampPercent(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function percentFromPreference(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clampPercent(numeric > 1 ? numeric : numeric * 100, fallback);
}

function settingsFromForm(form) {
  const mode = form.tutorMode ? "tutor" : "challenge";
  return {
    ...DEFAULT_SPEAK_SHADOW_SETTINGS,
    mode,
    phraseLength: form.phraseLength,
    minSimilarity: clampPercent(form.passThreshold, 85) / 100,
    minConfidence: clampPercent(form.minConfidence, 60) / 100,
    tutorMode: Boolean(form.tutorMode),
    guidedAutoListen: true,
    autoAdvanceOnPass: Boolean(form.autoAdvanceOnPass),
    autoReadNextPhrase: mode === "tutor" ? Boolean(form.autoReadNextPhrase) : false,
    autoListenDelayMs: mode === "tutor" ? 1000 : 800,
    speechSilenceTimeoutMs: 7000,
    maxAutoListenRetries: mode === "tutor" ? 2 : 1,
    maxFailedAttemptsBeforeHint: 2,
    autoAdvanceDelayMs: mode === "tutor" ? 1200 : 1000,
    partialUtteranceGraceMs: 2200,
    maxUtteranceChunks: 3,
    scorePartialImmediatelyIfPass: true,
    waitForContinuationIfTooShort: true,
    minCompletionRatioBeforeFail: 0.65,
  };
}

function speechSynthesisFallbacksForSession(session) {
  if (session?.language !== "zh") return [];
  if (session.voiceLocale === "zh-TW") return ["zh-TW", "zh-HK", "zh"];
  return ["zh-HK", "zh-TW", "zh"];
}

function getSessionMode(session) {
  return session?.settings?.mode || (session?.settings?.tutorMode ? "tutor" : "challenge");
}

function isTutorMode(session) {
  return getSessionMode(session) === "tutor";
}

function modeMessages(session) {
  return isTutorMode(session)
    ? {
      start: TUTOR_MESSAGES.intro,
      getReady: TUTOR_MESSAGES.getReady,
      listening: TUTOR_MESSAGES.listening,
      passed: TUTOR_MESSAGES.passed,
      excellent: TUTOR_MESSAGES.excellent,
      retry: TUTOR_MESSAGES.retry,
      slowDown: TUTOR_MESSAGES.slowDown,
      completed: TUTOR_MESSAGES.completed,
    }
    : {
      start: TUTOR_MESSAGES.challengeStart,
      getReady: TUTOR_MESSAGES.challengeStart,
      listening: TUTOR_MESSAGES.listening,
      passed: TUTOR_MESSAGES.challengePassed,
      excellent: TUTOR_MESSAGES.challengeExcellent,
      retry: TUTOR_MESSAGES.challengeRetry,
      slowDown: "Try once more slowly. You can use Listen Hint if you need help.",
      completed: TUTOR_MESSAGES.challengeCompleted,
    };
}

const AI_PACK_PROMPT = `You are generating a Read Aloud practice pack for the Learning Web platform.

Convert the following text into strict JSON only.

Requirements:
1. Detect or respect the given source language.
2. Split the text into natural read-aloud phrases.
3. Each phrase should normally contain 5-15 tokens.
4. Do not make phrases too long.
5. Preserve the original text exactly where possible.
6. Add tokens for each phrase.
7. Add translation into English if the source language is not English.
8. Add a short pronunciation tip only when useful.
9. Return JSON only. No markdown. No explanation.

Pack schema:

{
  "schemaVersion": 1,
  "packId": "read-aloud-generated",
  "title": "",
  "subject": "Language",
  "topic": "Read Aloud Practice",
  "sourceLanguage": "",
  "targetLanguage": "",
  "locale": "",
  "level": "mixed",
  "items": [
    {
      "id": "ra-001",
      "type": "readAloud",
      "sourceText": "",
      "targetText": "",
      "translation": "",
      "tokens": [],
      "ttsLang": "",
      "recognitionLang": "",
      "expectedAnswer": "",
      "acceptedAnswers": [],
      "voiceCriteria": {
        "minSimilarity": 0.85,
        "minConfidence": 0.6,
        "allowPunctuationMismatch": true,
        "allowCaseMismatch": true
      },
      "notes": {
        "meaning": "",
        "pronunciationTip": "",
        "grammarFocus": ""
      }
    }
  ]
}

Language:
{{LANGUAGE}}

Text:
{{PASTED_TEXT}}`;

function getCurrentPhrase(session) {
  return session?.phrases?.find((phrase) => phrase.id === session.currentPhraseId) || session?.phrases?.[0] || null;
}

function getPhraseClassName(phrase, currentPhraseId) {
  const status = phrase.id === currentPhraseId ? PHRASE_STATUS.CURRENT : phrase.status || PHRASE_STATUS.NOT_STARTED;
  return `ss-phrase ss-phrase-${status}`;
}

function markCurrentPhrase(session, currentPhraseId) {
  return {
    ...session,
    currentPhraseId,
    lastOpenedAt: new Date().toISOString(),
    phrases: session.phrases.map((phrase) => {
      if (phrase.id === currentPhraseId) return { ...phrase, status: PHRASE_STATUS.CURRENT };
      if (phrase.status === PHRASE_STATUS.CURRENT) return { ...phrase, status: PHRASE_STATUS.NOT_STARTED };
      return phrase;
    }),
  };
}

function upsertSavedSession(state, session) {
  if (!state.speakShadow) {
    state.speakShadow = { sessions: {}, preferences: {}, recentSessionIds: [], lastSessionId: "" };
  }
  if (!state.speakShadow.preferences) state.speakShadow.preferences = {};
  const saved = { ...session, savedToBrowser: true, lastOpenedAt: new Date().toISOString() };
  state.speakShadow.sessions[saved.sessionId] = saved;
  state.speakShadow.lastSessionId = saved.sessionId;
  state.speakShadow.recentSessionIds = [
    saved.sessionId,
    ...(state.speakShadow.recentSessionIds || []).filter((id) => id !== saved.sessionId),
  ].slice(0, 8);
}

function saveSpeakShadowPreferences(state, preferences) {
  if (!state.speakShadow) {
    state.speakShadow = { sessions: {}, preferences: {}, recentSessionIds: [], lastSessionId: "" };
  }
  state.speakShadow.preferences = {
    ...(state.speakShadow.preferences || {}),
    ...preferences,
  };
}

function preferencesFromProgress(progress) {
  return {
    chineseVoiceLocale: progress?.speakShadow?.preferences?.chineseVoiceLocale || DEFAULT_CHINESE_VOICE_LOCALE,
    passThreshold: percentFromPreference(progress?.speakShadow?.preferences?.passThreshold ?? 0.85, 85),
    minConfidence: percentFromPreference(progress?.speakShadow?.preferences?.minConfidence ?? 0.6, 60),
    tutorMode: progress?.speakShadow?.preferences?.tutorMode ?? true,
    autoAdvanceOnPass: progress?.speakShadow?.preferences?.autoAdvanceOnPass ?? true,
    autoReadNextPhrase: progress?.speakShadow?.preferences?.autoReadNextPhrase ?? true,
  };
}

function summarizeSession(session) {
  const attempts = session?.phrases?.flatMap((phrase) => phrase.attempts || []) || [];
  const completed = session?.phrases?.filter((phrase) => phrase.status === PHRASE_STATUS.PASSED).length || 0;
  const average = attempts.length
    ? Math.round((attempts.reduce((sum, attempt) => sum + (attempt.similarity || 0), 0) / attempts.length) * 100)
    : 0;
  const retries = attempts.filter((attempt) => !attempt.passed).length;
  const weakPhrases = (session?.phrases || [])
    .filter((phrase) => (phrase.attempts || []).some((attempt) => !attempt.passed))
    .slice(0, 5);
  return { attempts, completed, average, retries, weakPhrases };
}

function RecentSessions({ sessions, onResume, onStartNew }) {
  if (!sessions.length) return null;
  const latest = sessions[0];
  return (
    <section className="lw-card ss-resume-card" aria-label="Resume saved Speak and Shadow practice">
      <div>
        <span className="lw-chip blue">Saved practice</span>
        <h2 className="lw-section-title">Continue your last read-aloud practice?</h2>
        <p className="lw-subtitle">{latest.title || "Speak & Shadow practice"}</p>
      </div>
      <div className="lw-btn-group">
        <button className="lw-btn lw-btn-primary" type="button" onClick={() => onResume(latest)}>
          Continue
        </button>
        <button className="lw-btn lw-btn-ghost" type="button" onClick={onStartNew}>
          Start New
        </button>
      </div>
      {sessions.length > 1 && (
        <div className="ss-recent-list">
          {sessions.slice(1).map((session) => (
            <button key={session.sessionId} className="ss-recent-item" type="button" onClick={() => onResume(session)}>
              <span>{session.title}</span>
              <span>{new Date(session.lastOpenedAt || session.createdAt).toLocaleDateString()}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function CompletionScreen({ session, onRestart, onChallenge, onWeakOnly, onNew }) {
  const summary = summarizeSession(session);
  const mode = getSessionMode(session);
  const isTutor = mode === "tutor";
  return (
    <section className="lw-card ss-completion" data-testid="speak-shadow-complete">
      <span className="lw-chip green">Complete</span>
      <h2 className="lw-section-title">{isTutor ? "Great work! What would you like to do next?" : "Challenge completed"}</h2>
      <div className="ss-summary-grid">
        <div><span>Phrases completed</span><strong>{summary.completed} / {session.phrases.length}</strong></div>
        <div><span>Average score</span><strong>{summary.average}%</strong></div>
        <div><span>Retries</span><strong>{summary.retries}</strong></div>
      </div>
      {summary.weakPhrases.length > 0 && (
        <div className="ss-weak-list">
          <h3>Weak phrases</h3>
          {summary.weakPhrases.map((phrase) => <p key={phrase.id}>{phrase.text}</p>)}
        </div>
      )}
      <div className="lw-btn-group">
        <button className="lw-btn lw-btn-primary" type="button" onClick={onRestart}>
          {isTutor ? "Practise with Fox again" : "Try Challenge Again"}
        </button>
        {isTutor && (
          <button className="lw-btn lw-btn-secondary" type="button" onClick={onChallenge}>
            Try Challenge Mode
          </button>
        )}
        {summary.weakPhrases.length > 0 && (
          <button className="lw-btn lw-btn-secondary" type="button" onClick={onWeakOnly}>
            {isTutor ? "Review weak sentences" : "Practise weak sentences with Fox"}
          </button>
        )}
        <button className="lw-btn lw-btn-ghost" type="button" onClick={onNew}>Back to setup</button>
      </div>
    </section>
  );
}

export default function SpeakShadowPage() {
  const { manifest, loading: manifestLoading } = useManifest();
  const { progress, updateProgress } = useProgress();
  const [sourceMode, setSourceMode] = useState("paste");
  const [form, setForm] = useState(INITIAL_FORM);
  const [packageId, setPackageId] = useState("");
  const [session, setSession] = useState(null);
  const [tutorState, setTutorState] = useState(TUTOR_STATES.READY);
  const [tutorMessage, setTutorMessage] = useState(TUTOR_MESSAGES.intro);
  const [lastAttempt, setLastAttempt] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [manualTranscript, setManualTranscript] = useState("");
  const [manualFallbackOpen, setManualFallbackOpen] = useState(false);
  const [tutorPanelPosition, setTutorPanelPosition] = useState(null);
  const [tutorPanelMinimized, setTutorPanelMinimized] = useState(false);
  const [tutorChatCollapsed, setTutorChatCollapsed] = useState(false);
  const [error, setError] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);
  const sessionStateRef = useRef(null);
  const currentPhraseRef = useRef(null);
  const autoTimerRef = useRef(null);
  const listenTimerRef = useRef(null);
  const partialTimerRef = useRef(null);
  const speechTimerRef = useRef(null);
  const formPrefsLoadedRef = useRef(false);
  const activeRecognitionRef = useRef(null);
  const utteranceBufferRef = useRef(null);
  const tutorDragRef = useRef(null);
  const {
    supported: recognitionSupported,
    listening: recognitionListening,
    interimTranscript,
    lastError: recognitionLastError,
    microphoneBlocked,
    startAttempt,
    abortAttempt,
    resetAttempt,
  } = useSpeechRecognitionAttempt();
  const synthesisSupported = isSpeechSynthesisSupported();

  const savedSessions = useMemo(() => {
    const store = progress?.speakShadow;
    if (!store?.sessions) return [];
    return (store.recentSessionIds || [])
      .map((id) => store.sessions[id])
      .filter(Boolean);
  }, [progress?.speakShadow]);

  const passageGroups = useMemo(() => listPassageGroups(manifest || {}), [manifest]);
  const textLimit = useMemo(() => getSpeakShadowTextLimit(form.text, form.language), [form.text, form.language]);
  const currentPhrase = getCurrentPhrase(session);
  const completed = session?.phrases?.length
    ? session.phrases.every((phrase) => phrase.status === PHRASE_STATUS.PASSED || phrase.status === PHRASE_STATUS.SKIPPED)
    : false;
  const sessionMode = session ? getSessionMode(session) : (form.tutorMode ? "tutor" : "challenge");
  const progressPct = session?.phrases?.length
    ? Math.round((session.phrases.filter((phrase) => phrase.status === PHRASE_STATUS.PASSED).length / session.phrases.length) * 100)
    : 0;
  const tutorContext = {
    mode: sessionMode,
    tutorState,
    tutorMessage,
    currentPhrase,
    phraseIndex: session?.phrases?.findIndex((phrase) => phrase.id === session.currentPhraseId) ?? 0,
    totalPhrases: session?.phrases?.length || 0,
    lastAttempt,
    isSpeaking,
    recognitionListening,
    interimTranscript,
    browserSupportsRecognition: recognitionSupported,
    microphoneBlocked,
  };
  const foxTutor = getFoxTutorState(tutorContext);
  const tutorStatusLabel = getTutorStatusLabel(tutorContext);
  const tutorChatMessages = buildTutorChatMessages(tutorContext);
  const tutorNextStepLabel = getNextStepLabel(tutorContext);
  const shouldAutoOpenManualFallback = !recognitionSupported || microphoneBlocked || tutorState === TUTOR_STATES.MANUAL_FALLBACK;
  const manualFallbackPanelOpen = manualFallbackOpen || shouldAutoOpenManualFallback;
  const selectedPackage = passageGroups.find((item) => item.id === packageId);
  const selectedPackageLanguage = getSpeakShadowLanguageByLocale(
    selectedPackage?.sourceLanguageCode || selectedPackage?.speechLanguage || selectedPackage?.targetLanguageCode,
  ).id;

  useEffect(() => () => {
    stopSpeaking();
    abortAttempt();
    if (autoTimerRef.current) window.clearTimeout(autoTimerRef.current);
    if (listenTimerRef.current) window.clearTimeout(listenTimerRef.current);
    if (partialTimerRef.current) window.clearTimeout(partialTimerRef.current);
    if (speechTimerRef.current) window.clearTimeout(speechTimerRef.current);
  }, [abortAttempt]);

  useEffect(() => {
    if (formPrefsLoadedRef.current || !progress) return;
    const prefs = preferencesFromProgress(progress);
    setForm((current) => ({
      ...current,
      voiceLocale: prefs.chineseVoiceLocale,
      passThreshold: prefs.passThreshold,
      minConfidence: prefs.minConfidence,
      tutorMode: prefs.tutorMode,
      autoAdvanceOnPass: prefs.autoAdvanceOnPass,
      autoReadNextPhrase: prefs.autoReadNextPhrase,
    }));
    formPrefsLoadedRef.current = true;
  }, [progress]);

  useEffect(() => {
    sessionStateRef.current = session;
  }, [session]);

  useEffect(() => {
    if (currentPhraseRef.current) {
      currentPhraseRef.current.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
  }, [session?.currentPhraseId]);

  function commitSession(nextSession) {
    sessionStateRef.current = nextSession;
    setSession(nextSession);
    if (nextSession?.savedToBrowser) {
      updateProgress((state) => upsertSavedSession(state, nextSession));
    }
  }

  function commitPreferences(nextPreferences) {
    updateProgress((state) => saveSpeakShadowPreferences(state, nextPreferences));
  }

  function clearAutoTimer() {
    if (autoTimerRef.current) {
      window.clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }

  function clearListenTimer() {
    if (listenTimerRef.current) {
      window.clearTimeout(listenTimerRef.current);
      listenTimerRef.current = null;
    }
  }

  function clearPartialTimer() {
    if (partialTimerRef.current) {
      window.clearTimeout(partialTimerRef.current);
      partialTimerRef.current = null;
    }
  }

  function clearSpeechTimer() {
    if (speechTimerRef.current) {
      window.clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
  }

  function resetUtteranceBuffer() {
    clearPartialTimer();
    utteranceBufferRef.current = null;
  }

  function withModeSettings(targetSession) {
    const mode = getSessionMode(targetSession);
    return {
      ...DEFAULT_SPEAK_SHADOW_SETTINGS,
      mode,
      tutorMode: mode === "tutor",
      autoReadNextPhrase: mode === "tutor",
      ...(targetSession?.settings || {}),
    };
  }

  function incrementSilentCount(targetSession, phraseId) {
    if (!targetSession || !phraseId) return targetSession;
    const mode = getSessionMode(targetSession);
    return {
      ...targetSession,
      lastOpenedAt: new Date().toISOString(),
      phrases: targetSession.phrases.map((phrase) => {
        if (phrase.id !== phraseId) return phrase;
        const silentCounts = {
          ...(phrase.silentCounts || {}),
          [mode]: ((phrase.silentCounts || {})[mode] || 0) + 1,
        };
        return { ...phrase, silentCounts };
      }),
    };
  }

  function handleRecognitionFailure(reason = "no-result") {
    clearListenTimer();
    if (!utteranceBufferRef.current?.chunks?.length) clearAutoTimer();
    if (reason === "aborted") return;
    const activeSession = sessionStateRef.current || session;
    const activePhrase = getCurrentPhrase(activeSession);
    if (!activeSession || !activePhrase) {
      setTutorState(TUTOR_STATES.RETRY);
      setTutorMessage(TUTOR_MESSAGES.browserNeedsManual);
      return;
    }
    if (reason === "not-allowed") {
      setTutorState(TUTOR_STATES.MANUAL_FALLBACK);
      setTutorMessage("Microphone permission was blocked. Allow microphone access or use the manual transcript fallback.");
      return;
    }
    const pendingBuffer = utteranceBufferRef.current;
    if (
      pendingBuffer?.chunks?.length
      && pendingBuffer.sessionId === activeSession.sessionId
      && pendingBuffer.phraseId === activePhrase.id
      && (reason === "no-result" || reason === "timeout")
    ) {
      setTutorState(TUTOR_STATES.PENDING_CONTINUATION);
      setTutorMessage(TUTOR_MESSAGES.continueSentence);
      return;
    }
    const updated = incrementSilentCount(activeSession, activePhrase.id);
    const mode = getSessionMode(updated);
    const phrase = updated.phrases.find((item) => item.id === activePhrase.id);
    const count = (phrase?.silentCounts || {})[mode] || 0;
    const settings = withModeSettings(updated);
    commitSession(updated);
    if (count >= (settings.maxAutoListenRetries || 1)) {
      setTutorState(TUTOR_STATES.MANUAL_FALLBACK);
      setTutorMessage(TUTOR_MESSAGES.manualFallback);
      return;
    }
    setTutorState(TUTOR_STATES.SILENCE_TIMEOUT);
    setTutorMessage(TUTOR_MESSAGES.silent);
  }

  function stopAllAudio() {
    clearAutoTimer();
    clearListenTimer();
    clearSpeechTimer();
    resetUtteranceBuffer();
    stopSpeaking();
    abortAttempt();
    setIsSpeaking(false);
    if (
      tutorState === TUTOR_STATES.STUDENT_SPEAKING
      || tutorState === TUTOR_STATES.AUTO_LISTEN_PENDING
      || tutorState === TUTOR_STATES.PENDING_CONTINUATION
      || tutorState === TUTOR_STATES.TUTOR_READING
    ) {
      setTutorState(TUTOR_STATES.WAITING_FOR_STUDENT);
      setTutorMessage(isTutorMode(session) ? TUTOR_MESSAGES.speak : TUTOR_MESSAGES.browserNeedsManual);
    }
  }

  function startRecognitionForSession(targetSession = session, { continuation = false, message } = {}) {
    const phrase = getCurrentPhrase(targetSession);
    if (!targetSession || !phrase) return;
    if (!recognitionSupported) {
      setTutorState(TUTOR_STATES.MANUAL_FALLBACK);
      setTutorMessage(TUTOR_MESSAGES.unsupportedRecognition);
      return;
    }
    const settings = withModeSettings(targetSession);
    clearAutoTimer();
    clearListenTimer();
    if (!continuation) {
      resetUtteranceBuffer();
      resetAttempt();
    }
    setTutorState(continuation ? TUTOR_STATES.PENDING_CONTINUATION : TUTOR_STATES.STUDENT_SPEAKING);
    setTutorMessage(message || modeMessages(targetSession).listening);
    if (!continuation) {
      setLastAttempt(null);
      setManualTranscript("");
    }
    const attemptId = startAttempt({
      languageCode: targetSession.recognitionLang || targetSession.ttsLang || "en-GB",
      interimResults: true,
      continuous: false,
      maxAlternatives: 5,
      timeoutMs: settings.speechSilenceTimeoutMs || 7000,
      onFinal: (payload) => handleScoredTranscript(payload.transcript, payload.confidence, payload.alternatives, payload),
      onError: handleRecognitionFailure,
    });
    activeRecognitionRef.current = {
      attemptId,
      sessionId: targetSession.sessionId,
      phraseId: phrase.id,
      continuation,
    };
  }

  function scheduleAutoListen(targetSession = session, { message } = {}) {
    const phrase = getCurrentPhrase(targetSession);
    if (!targetSession || !phrase) return;
    const settings = withModeSettings(targetSession);
    if (!settings.guidedAutoListen) {
      setTutorState(TUTOR_STATES.WAITING_FOR_STUDENT);
      setTutorMessage(isTutorMode(targetSession) ? TUTOR_MESSAGES.speak : TUTOR_MESSAGES.browserNeedsManual);
      return;
    }
    clearAutoTimer();
    setTutorState(TUTOR_STATES.AUTO_LISTEN_PENDING);
    setTutorMessage(message || modeMessages(targetSession).getReady);
    autoTimerRef.current = window.setTimeout(() => {
      startRecognitionForSession(targetSession);
    }, settings.autoListenDelayMs || 1000);
  }

  function startChallengePhrase(targetSession = session, { message } = {}) {
    const phrase = getCurrentPhrase(targetSession);
    if (!targetSession || !phrase) return;
    setTutorState(TUTOR_STATES.AUTO_LISTEN_PENDING);
    setTutorMessage(message || TUTOR_MESSAGES.challengeStart);
    scheduleAutoListen(targetSession, { message: message || TUTOR_MESSAGES.challengeStart });
  }

  function beginTutorReading(targetSession = session, { message, forceRead = false, autoListenAfter = true } = {}) {
    const phrase = getCurrentPhrase(targetSession);
    if (!phrase) return;
    if (!isTutorMode(targetSession) && !forceRead) {
      startChallengePhrase(targetSession);
      return;
    }
    if (!synthesisSupported) {
      setTutorState(TUTOR_STATES.MANUAL_FALLBACK);
      setTutorMessage(TUTOR_MESSAGES.unsupportedTts);
      return;
    }
    stopSpeaking();
    abortAttempt();
    clearAutoTimer();
    clearListenTimer();
    resetUtteranceBuffer();
    clearSpeechTimer();
    setIsSpeaking(true);
    setTutorState(TUTOR_STATES.TUTOR_READING);
    setTutorMessage(message || modeMessages(targetSession).start);
    speechTimerRef.current = window.setTimeout(() => {
      setIsSpeaking(false);
      setTutorState(TUTOR_STATES.MANUAL_FALLBACK);
      setTutorMessage("I could not play that voice in this browser. Try the other Chinese voice, or continue with manual practice.");
    }, 20000);
    const didStart = speakText(phrase.text, targetSession.ttsLang || "en-GB", {
      rate: 0.9,
      languageFallbacks: speechSynthesisFallbacksForSession(targetSession),
      onStart: () => {
        setIsSpeaking(true);
        setTutorState(TUTOR_STATES.TUTOR_READING);
      },
      onEnd: () => {
        clearSpeechTimer();
        setIsSpeaking(false);
        if (autoListenAfter) {
          scheduleAutoListen(targetSession, { message: TUTOR_MESSAGES.getReady });
        } else {
          setTutorState(TUTOR_STATES.WAITING_FOR_STUDENT);
          setTutorMessage(isTutorMode(targetSession) ? TUTOR_MESSAGES.speak : TUTOR_MESSAGES.browserNeedsManual);
        }
      },
      onError: () => {
        clearSpeechTimer();
        setIsSpeaking(false);
        setTutorState(TUTOR_STATES.MANUAL_FALLBACK);
        setTutorMessage("I could not play that voice in this browser. Try the other Chinese voice, or use manual practice.");
      },
    });
    if (!didStart) {
      clearSpeechTimer();
      setIsSpeaking(false);
      setTutorState(TUTOR_STATES.MANUAL_FALLBACK);
      setTutorMessage(TUTOR_MESSAGES.unsupportedTts);
    }
  }

  function startSession(nextSession) {
    if (!nextSession.phrases.length) {
      setError("Add at least one sentence or phrase to practise.");
      return;
    }
    setError("");
    setLastAttempt(null);
    setManualTranscript("");
    resetAttempt();
    resetUtteranceBuffer();
    clearAutoTimer();
    const speech = resolveSpeakShadowSpeech({ language: nextSession.language, voiceLocale: nextSession.voiceLocale });
    const mode = nextSession.settings?.mode || (nextSession.settings?.tutorMode === false ? "challenge" : "tutor");
    const withDefaults = {
      ...nextSession,
      language: speech.language,
      voiceLocale: speech.voiceLocale,
      ttsLang: speech.language === "zh" ? speech.ttsLang : nextSession.ttsLang || speech.ttsLang,
      recognitionLang: speech.language === "zh" ? speech.recognitionLang : nextSession.recognitionLang || speech.recognitionLang,
      settings: {
        ...DEFAULT_SPEAK_SHADOW_SETTINGS,
        ...(nextSession.settings || {}),
        mode,
        tutorMode: mode === "tutor",
        autoReadNextPhrase: mode === "tutor" ? (nextSession.settings?.autoReadNextPhrase ?? true) : false,
      },
    };
    const normalized = markCurrentPhrase(withDefaults, withDefaults.currentPhraseId || withDefaults.phrases[0].id);
    commitSession(normalized);
    if (isTutorMode(normalized)) beginTutorReading(normalized);
    else startChallengePhrase(normalized);
  }

  function moveToNextPhraseFrom(sourceSession, phraseId, { delayMs = 0 } = {}) {
    clearAutoTimer();
    const run = () => {
      const index = sourceSession.phrases.findIndex((phrase) => phrase.id === phraseId);
      const nextPhrase = sourceSession.phrases[index + 1];
      if (!nextPhrase) {
        const done = {
          ...sourceSession,
          lastOpenedAt: new Date().toISOString(),
          phrases: sourceSession.phrases.map((phrase) => (
            phrase.id === phraseId ? { ...phrase, status: PHRASE_STATUS.PASSED } : phrase
          )),
        };
        commitSession(done);
        setTutorState(TUTOR_STATES.COMPLETED);
        setTutorMessage(modeMessages(done).completed);
        return;
      }
      const next = markCurrentPhrase(sourceSession, nextPhrase.id);
      setLastAttempt(null);
      setManualTranscript("");
      resetUtteranceBuffer();
      commitSession(next);
      if (isTutorMode(next) && next.settings?.autoReadNextPhrase) {
        beginTutorReading(next);
      } else if (!isTutorMode(next) && next.settings?.guidedAutoListen) {
        startChallengePhrase(next);
      } else {
        setTutorState(TUTOR_STATES.WAITING_FOR_STUDENT);
        setTutorMessage(isTutorMode(next) ? TUTOR_MESSAGES.speak : TUTOR_MESSAGES.browserNeedsManual);
      }
    };

    if (delayMs > 0) {
      autoTimerRef.current = window.setTimeout(run, delayMs);
    } else {
      run();
    }
  }

  function makeAttemptFromScore(score, activeSession) {
    const attempt = {
      transcript: normalizeTranscriptForDisplay(score.transcript, activeSession.language),
      confidence: score.confidence,
      similarity: score.similarity,
      overallScore: score.overallScore,
      requiredTokenScore: score.requiredTokenScore,
      orderScore: score.orderScore,
      confidenceScore: score.confidenceScore,
      minSimilarity: activeSession.settings?.minSimilarity ?? DEFAULT_SPEAK_SHADOW_SETTINGS.minSimilarity,
      minConfidence: activeSession.settings?.minConfidence ?? DEFAULT_SPEAK_SHADOW_SETTINGS.minConfidence,
      passed: score.passed,
      mode: getSessionMode(activeSession),
      matchType: score.matchType,
      source: score.source,
      feedbackLevel: score.feedbackLevel,
      missingTokens: score.missingTokens,
      extraTokens: score.extraTokens,
      hint: score.hint,
      nextAction: score.nextAction,
      createdAt: new Date().toISOString(),
    };
    return attempt;
  }

  function applyFinalScore(score, activeSession, activePhrase) {
    if (!score?.transcript) return;
    resetUtteranceBuffer();
    const attempt = makeAttemptFromScore(score, activeSession);
    setLastAttempt(attempt);

    const updated = {
      ...activeSession,
      lastOpenedAt: new Date().toISOString(),
      phrases: activeSession.phrases.map((phrase) => {
        if (phrase.id !== activePhrase.id) return phrase;
        return {
          ...phrase,
          status: score.passed ? PHRASE_STATUS.PASSED : PHRASE_STATUS.RETRY,
          attempts: [...(phrase.attempts || []), attempt],
        };
      }),
    };
    commitSession(updated);

    if (score.passed) {
      const messages = modeMessages(updated);
      setTutorState(TUTOR_STATES.PASSED);
      setTutorMessage(score.similarity >= 0.95 ? messages.excellent : messages.passed);
      if (updated.settings?.autoAdvanceOnPass) {
        moveToNextPhraseFrom(updated, activePhrase.id, {
          delayMs: updated.settings?.autoAdvanceDelayMs ?? DEFAULT_SPEAK_SHADOW_SETTINGS.autoAdvanceDelayMs,
        });
      }
      return;
    }

    setTutorState(TUTOR_STATES.RETRY);
    const messages = modeMessages(updated);
    const currentWithAttempt = updated.phrases.find((phrase) => phrase.id === activePhrase.id);
    const failedAttempts = (currentWithAttempt?.attempts || []).filter((attemptItem) => !attemptItem.passed).length;
    const maxBeforeHint = updated.settings?.maxFailedAttemptsBeforeHint || updated.settings?.retryBeforeManualHelp || 2;
    setTutorMessage(score.hint || (failedAttempts >= maxBeforeHint ? messages.slowDown : messages.retry));
    if (isTutorMode(updated) && failedAttempts <= (updated.settings.retryBeforeManualHelp || 2)) {
      autoTimerRef.current = window.setTimeout(() => {
        beginTutorReading(updated, { message: failedAttempts >= maxBeforeHint ? messages.slowDown : messages.retry });
      }, 850);
      return;
    }
    if (!isTutorMode(updated)) {
      if (failedAttempts <= (updated.settings?.maxAutoListenRetries || 1)) {
        autoTimerRef.current = window.setTimeout(() => {
          startChallengePhrase(updated, { message: messages.retry });
        }, 1000);
      } else {
        setTutorState(TUTOR_STATES.MANUAL_FALLBACK);
        setTutorMessage(messages.slowDown);
      }
    }
  }

  function finalizeBufferedUtterance(reason = "grace-timeout") {
    const buffer = utteranceBufferRef.current;
    if (!buffer?.chunks?.length) return;
    const activeSession = sessionStateRef.current || session;
    const activePhrase = getCurrentPhrase(activeSession);
    if (!activeSession || !activePhrase || buffer.sessionId !== activeSession.sessionId || buffer.phraseId !== activePhrase.id) return;
    abortAttempt();
    clearPartialTimer();
    setTutorState(TUTOR_STATES.CHECKING);
    const evaluation = evaluateBufferedUtterance({
      expected: activePhrase,
      chunks: buffer.chunks,
      confidence: buffer.confidence,
      alternatives: buffer.alternatives,
      language: activeSession.language,
      voiceLocale: activeSession.voiceLocale || activeSession.recognitionLang,
      settings: activeSession.settings,
      forceFinalize: true,
    });
    const finalScore = {
      ...evaluation.score,
      transcript: evaluation.combinedTranscript,
      nextAction: reason === "grace-timeout" ? "retry_after_pause" : evaluation.score.nextAction,
    };
    applyFinalScore(finalScore, activeSession, activePhrase);
  }

  function scheduleContinuationWait(activeSession, activePhrase, evaluation) {
    clearPartialTimer();
    setTutorState(TUTOR_STATES.PENDING_CONTINUATION);
    setTutorMessage(evaluation.chunkCount <= 1 ? TUTOR_MESSAGES.pendingContinuation : TUTOR_MESSAGES.continueSentence);
    partialTimerRef.current = window.setTimeout(() => {
      finalizeBufferedUtterance("grace-timeout");
    }, activeSession.settings?.partialUtteranceGraceMs ?? DEFAULT_SPEAK_SHADOW_SETTINGS.partialUtteranceGraceMs);
    startRecognitionForSession(activeSession, {
      continuation: true,
      message: TUTOR_MESSAGES.continueSentence,
    });
  }

  function handleScoredTranscript(transcript, confidence = null, alternatives = [], recognitionPayload = null) {
    const activeSession = sessionStateRef.current || session;
    const activePhrase = getCurrentPhrase(activeSession);
    if (!activeSession || !activePhrase || !String(transcript || "").trim()) return;
    const activeRecognition = activeRecognitionRef.current;
    if (
      recognitionPayload?.attemptId
      && activeRecognition
      && (
        recognitionPayload.attemptId !== activeRecognition.attemptId
        || activeRecognition.sessionId !== activeSession.sessionId
        || activeRecognition.phraseId !== activePhrase.id
      )
    ) {
      return;
    }
    clearListenTimer();
    clearPartialTimer();
    const isManual = Boolean(recognitionPayload?.manual);
    const existingBuffer = utteranceBufferRef.current;
    const chunks = isManual
      ? [transcript]
      : [
        ...((existingBuffer?.sessionId === activeSession.sessionId && existingBuffer?.phraseId === activePhrase.id)
          ? existingBuffer.chunks
          : []),
        transcript,
      ];
    const evaluation = evaluateBufferedUtterance({
      expected: activePhrase,
      chunks,
      confidence,
      alternatives,
      language: activeSession.language,
      voiceLocale: activeSession.voiceLocale || activeSession.recognitionLang,
      settings: activeSession.settings,
      forceFinalize: isManual,
    });
    utteranceBufferRef.current = {
      sessionId: activeSession.sessionId,
      phraseId: activePhrase.id,
      chunks,
      confidence: evaluation.score.confidence,
      alternatives,
    };
    if (evaluation.status === "pendingContinuation") {
      scheduleContinuationWait(activeSession, activePhrase, evaluation);
      return;
    }
    clearAutoTimer();
    setTutorState(TUTOR_STATES.CHECKING);
    applyFinalScore({
      ...evaluation.score,
      transcript: evaluation.combinedTranscript,
      source: isManual ? "manual_fallback" : evaluation.score.source,
    }, activeSession, activePhrase);
  }

  function handleMarkCurrentPhraseOk() {
    const activeSession = sessionStateRef.current || session;
    const activePhrase = getCurrentPhrase(activeSession);
    if (!activeSession || !activePhrase || !lastAttempt) return;
    clearAutoTimer();
    const acceptedAttempt = {
      ...lastAttempt,
      passed: true,
      acceptedManually: true,
      matchType: "manual",
      similarity: Math.max(lastAttempt.similarity || 0, activeSession.settings?.minSimilarity ?? DEFAULT_SPEAK_SHADOW_SETTINGS.minSimilarity),
      acceptedAt: new Date().toISOString(),
    };
    const updated = {
      ...activeSession,
      lastOpenedAt: new Date().toISOString(),
      phrases: activeSession.phrases.map((phrase) => {
        if (phrase.id !== activePhrase.id) return phrase;
        const attempts = [...(phrase.attempts || [])];
        const lastIndex = attempts.length - 1;
        if (lastIndex >= 0) attempts[lastIndex] = acceptedAttempt;
        else attempts.push(acceptedAttempt);
        return { ...phrase, status: PHRASE_STATUS.PASSED, attempts };
      }),
    };
    setLastAttempt(acceptedAttempt);
    commitSession(updated);
    setTutorState(TUTOR_STATES.PASSED);
    setTutorMessage("Marked OK. Let's go to the next sentence.");
    if (updated.settings?.autoAdvanceOnPass) {
      moveToNextPhraseFrom(updated, activePhrase.id, {
        delayMs: updated.settings?.autoAdvanceDelayMs ?? DEFAULT_SPEAK_SHADOW_SETTINGS.autoAdvanceDelayMs,
      });
    }
  }

  function settingsForMode(mode) {
    const tutorMode = mode === "tutor";
    return settingsFromForm({
      ...form,
      tutorMode,
      autoReadNextPhrase: tutorMode ? form.autoReadNextPhrase : false,
    });
  }

  function createFromPaste(mode = "tutor") {
    if (!form.text.trim()) {
      setError("Paste a short passage first.");
      return;
    }
    if (!textLimit.ok) {
      setError(`This text is ${textLimit.count} ${textLimit.unit}. Keep it within ${textLimit.limit} ${textLimit.unit} for the MVP.`);
      return;
    }
    const settings = settingsForMode(mode);
    commitPreferences({
      chineseVoiceLocale: form.voiceLocale,
      passThreshold: settings.minSimilarity,
      minConfidence: settings.minConfidence,
      tutorMode: settings.tutorMode,
      autoAdvanceOnPass: settings.autoAdvanceOnPass,
      autoReadNextPhrase: settings.autoReadNextPhrase,
    });
    startSession(createSpeakShadowSession({
      ...form,
      settings,
    }));
  }

  async function createFromPackage(mode = "tutor") {
    if (!packageId) {
      setError("Choose a reading package first.");
      return;
    }
    try {
      const passages = await loadPassagePack(manifest, packageId);
      const group = passageGroups.find((item) => item.id === packageId);
      const text = passages.map((passage) => passage.sourceText || passage.targetText).filter(Boolean).join(" ");
      const language = getSpeakShadowLanguageByLocale(passages[0]?.speech_language || group?.sourceLanguageCode).id;
      const settings = settingsForMode(mode);
      const voiceLocale = language === "zh" ? form.voiceLocale : "";
      commitPreferences({
        chineseVoiceLocale: form.voiceLocale,
        passThreshold: settings.minSimilarity,
        minConfidence: settings.minConfidence,
        tutorMode: settings.tutorMode,
        autoAdvanceOnPass: settings.autoAdvanceOnPass,
        autoReadNextPhrase: settings.autoReadNextPhrase,
      });
      startSession(createSpeakShadowSession({
        title: group?.displayName || "Reading package practice",
        text,
        language,
        voiceLocale,
        phraseLength: form.phraseLength,
        savedToBrowser: form.savedToBrowser,
        sourceType: "existing_package",
        sourcePackageId: packageId,
        settings,
      }));
    } catch (loadError) {
      setError(loadError.message || "Could not load that reading package.");
    }
  }

  async function importJsonFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      startSession(ensureSpeakShadowSession(parsed, { savedToBrowser: form.savedToBrowser }));
    } catch (parseError) {
      setError(parseError.message || "Could not import that JSON file.");
    } finally {
      event.target.value = "";
    }
  }

  function handleListenAgain() {
    beginTutorReading(session, {
      message: isTutorMode(session) ? TUTOR_MESSAGES.retry : TUTOR_MESSAGES.listenHint,
      forceRead: !isTutorMode(session),
      autoListenAfter: true,
    });
  }

  function handleSessionVoiceLocaleChange(localeId) {
    if (!session || session.language !== "zh") return;
    const speech = resolveSpeakShadowSpeech({ language: "zh", voiceLocale: localeId });
    const updated = {
      ...session,
      voiceLocale: speech.voiceLocale,
      ttsLang: speech.ttsLang,
      recognitionLang: speech.recognitionLang,
      lastOpenedAt: new Date().toISOString(),
    };
    stopSpeaking();
    stopAllAudio();
    commitPreferences({ chineseVoiceLocale: speech.voiceLocale });
    commitSession(updated);
    setTutorState(TUTOR_STATES.WAITING_FOR_STUDENT);
    setTutorMessage(`${getChineseVoiceLocale(speech.voiceLocale).label} voice selected. ${isTutorMode(updated) ? TUTOR_MESSAGES.speak : TUTOR_MESSAGES.challengeStart}`);
  }

  function handleSpeakNow() {
    if (!session || !currentPhrase) return;
    startRecognitionForSession(session);
  }

  function handleManualTranscriptSubmit() {
    handleScoredTranscript(manualTranscript, null, [], { manual: true });
  }

  function moveToPhrase(phraseId) {
    if (!session) return;
    clearAutoTimer();
    const next = markCurrentPhrase(session, phraseId);
    setLastAttempt(null);
    setManualTranscript("");
    resetUtteranceBuffer();
    commitSession(next);
    if (isTutorMode(next) && next.settings?.autoReadNextPhrase) beginTutorReading(next);
    else if (!isTutorMode(next) && next.settings?.guidedAutoListen) startChallengePhrase(next);
  }

  function handleNextPhrase() {
    if (!session || !currentPhrase) return;
    moveToNextPhraseFrom(session, currentPhrase.id);
  }

  function handleSkipPhrase() {
    if (!session || !currentPhrase) return;
    resetUtteranceBuffer();
    const updated = {
      ...session,
      phrases: session.phrases.map((phrase) => (
        phrase.id === currentPhrase.id ? { ...phrase, status: PHRASE_STATUS.SKIPPED } : phrase
      )),
    };
    commitSession(updated);
    const index = updated.phrases.findIndex((phrase) => phrase.id === currentPhrase.id);
    const nextPhrase = updated.phrases[index + 1];
    if (nextPhrase) moveToNextPhraseFrom(updated, currentPhrase.id);
  }

  function restartSession(targetSession = session, mode = getSessionMode(targetSession)) {
    if (!targetSession) return;
    resetUtteranceBuffer();
    const tutorMode = mode === "tutor";
    const restarted = {
      ...targetSession,
      currentPhraseId: targetSession.phrases[0]?.id || "",
      settings: {
        ...withModeSettings(targetSession),
        mode,
        tutorMode,
        autoReadNextPhrase: tutorMode ? targetSession.settings?.autoReadNextPhrase ?? true : false,
        maxAutoListenRetries: tutorMode ? 2 : 1,
        autoListenDelayMs: tutorMode ? 1000 : 800,
        autoAdvanceDelayMs: tutorMode ? 1200 : 1000,
      },
      phrases: targetSession.phrases.map((phrase, index) => ({
        ...phrase,
        status: index === 0 ? PHRASE_STATUS.CURRENT : PHRASE_STATUS.NOT_STARTED,
        attempts: [],
        silentCounts: {},
      })),
    };
    startSession(restarted);
  }

  function practiseWeakPhrases(mode = "tutor") {
    if (!session) return;
    resetUtteranceBuffer();
    const weak = session.phrases.filter((phrase) => (phrase.attempts || []).some((attempt) => !attempt.passed));
    if (!weak.length) return;
    const now = new Date().toISOString();
    const tutorMode = mode === "tutor";
    startSession({
      ...session,
      sessionId: `${session.sessionId}-weak-${Date.now()}`,
      title: `${session.title} - weak phrases`,
      createdAt: now,
      lastOpenedAt: now,
      currentPhraseId: weak[0].id,
      settings: {
        ...withModeSettings(session),
        mode,
        tutorMode,
        autoReadNextPhrase: tutorMode ? session.settings?.autoReadNextPhrase ?? true : false,
        maxAutoListenRetries: tutorMode ? 2 : 1,
        autoListenDelayMs: tutorMode ? 1000 : 800,
        autoAdvanceDelayMs: tutorMode ? 1200 : 1000,
      },
      phrases: weak.map((phrase, index) => ({
        ...phrase,
        status: index === 0 ? PHRASE_STATUS.CURRENT : PHRASE_STATUS.NOT_STARTED,
        attempts: [],
        silentCounts: {},
      })),
    });
  }

  function copyAiPackPrompt() {
    const languageLabel = SPEAK_SHADOW_LANGUAGES.find((language) => language.id === form.language)?.label || form.language;
    const prompt = AI_PACK_PROMPT
      .replace("{{LANGUAGE}}", languageLabel)
      .replace("{{PASTED_TEXT}}", form.text || "");
    navigator.clipboard?.writeText(prompt);
    setPromptCopied(true);
    window.setTimeout(() => setPromptCopied(false), 1600);
  }

  function updateForm(patch) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function handleFormLanguageChange(language) {
    updateForm({
      language,
      voiceLocale: language === "zh" ? form.voiceLocale || DEFAULT_CHINESE_VOICE_LOCALE : form.voiceLocale,
    });
  }

  function renderChineseVoiceSelector({ activeLanguage, value, onChange, compact = false }) {
    if (activeLanguage !== "zh") return null;
    return (
      <div className={`ss-voice-toggle${compact ? " is-compact" : ""}`} data-testid="speak-shadow-chinese-voice-toggle">
        <span>Chinese voice</span>
        <div role="group" aria-label="Chinese voice">
          {CHINESE_VOICE_LOCALES.map((locale) => (
            <button
              key={locale.id}
              className={value === locale.id ? "is-active" : ""}
              type="button"
              onClick={() => onChange(locale.id)}
            >
              <strong>{locale.label}</strong>
              <small>{locale.nativeLabel}</small>
            </button>
          ))}
        </div>
        {value === "zh-HK" && (
          <p className="ss-voice-warning">{TUTOR_MESSAGES.cantoneseSupportWarning}</p>
        )}
      </div>
    );
  }

  function renderModeStartActions({ onTutorStart, onChallengeStart, disabled = false }) {
    return (
      <div className="ss-mode-start" aria-label="Choose your practice mode">
        <h2>Choose your practice mode</h2>
        <div className="ss-mode-grid">
          <div className="ss-mode-card">
            <span className="lw-chip blue">Tutor Mode</span>
            <strong>Fox reads first. You listen and follow.</strong>
            <button className="lw-btn lw-btn-primary" type="button" onClick={onTutorStart} disabled={disabled}>
              Start with Fox Tutor
            </button>
          </div>
          <div className="ss-mode-card">
            <span className="lw-chip amber">Challenge Mode</span>
            <strong>Read by yourself and see your score.</strong>
            <button className="lw-btn lw-btn-secondary" type="button" onClick={onChallengeStart} disabled={disabled}>
              Start Challenge
            </button>
          </div>
        </div>
      </div>
    );
  }

  function getAttemptMatchLabel(attempt) {
    if (!attempt) return "";
    if (attempt.acceptedManually || attempt.matchType === "manual") return "Marked OK manually";
    if (attempt.matchType === "exact") return "Exact match";
    if (attempt.matchType === "normalized") return "Accepted after language normalisation";
    if (attempt.matchType === "alternative") return "Accepted from browser alternative";
    if (attempt.matchType === "equivalent") return "Accepted as near-equivalent";
    return "Similarity score";
  }

  function getChatMessageLabel(message) {
    if (message.from === "learner") return "You";
    if (message.from === "system") return "System";
    return "Fox";
  }

  function clampTutorPanelPosition(left, top) {
    if (typeof window === "undefined") return { left, top };
    const panelWidth = tutorPanelMinimized ? 260 : 390;
    const panelHeight = tutorPanelMinimized ? 92 : 520;
    const margin = 12;
    return {
      left: Math.min(Math.max(margin, left), Math.max(margin, window.innerWidth - panelWidth - margin)),
      top: Math.min(Math.max(margin, top), Math.max(margin, window.innerHeight - panelHeight - margin)),
    };
  }

  function handleTutorDragStart(event) {
    if (event.button !== 0) return;
    const panel = event.currentTarget.closest(".ss-tutor-panel");
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    tutorDragRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    setTutorPanelPosition({ left: rect.left, top: rect.top });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleTutorDragMove(event) {
    if (!tutorDragRef.current) return;
    const next = clampTutorPanelPosition(
      event.clientX - tutorDragRef.current.offsetX,
      event.clientY - tutorDragRef.current.offsetY,
    );
    setTutorPanelPosition(next);
  }

  function handleTutorDragEnd(event) {
    tutorDragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  function renderPracticeSettings(activeLanguage = form.language) {
    return (
      <div className="ss-settings-grid">
        {renderChineseVoiceSelector({
          activeLanguage,
          value: form.voiceLocale,
          onChange: (voiceLocale) => updateForm({ voiceLocale }),
        })}
        <label className="ss-field">
          <span>Pass threshold</span>
          <input
            type="number"
            min="60"
            max="100"
            step="1"
            value={form.passThreshold}
            onChange={(event) => updateForm({ passThreshold: clampPercent(event.target.value, 85) })}
            data-testid="speak-shadow-pass-threshold"
          />
        </label>
        <label className="ss-field">
          <span>Minimum confidence</span>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={form.minConfidence}
            onChange={(event) => updateForm({ minConfidence: clampPercent(event.target.value, 60) })}
          />
        </label>
        <label className="ss-checkbox">
          <input
            type="checkbox"
            checked={form.autoAdvanceOnPass}
            onChange={(event) => updateForm({ autoAdvanceOnPass: event.target.checked })}
          />
          <span>Auto-advance after pass</span>
        </label>
        <label className="ss-checkbox">
          <input
            type="checkbox"
            checked={form.autoReadNextPhrase}
            onChange={(event) => updateForm({ autoReadNextPhrase: event.target.checked })}
          />
          <span>Auto-read next phrase in Tutor Mode</span>
        </label>
      </div>
    );
  }

  if (manifestLoading) return <div className="lw-page"><LoadingText /></div>;

  if (completed && session) {
    return (
      <div className="lw-page ss-page">
        <CompletionScreen
          session={session}
          onRestart={() => restartSession(session)}
          onChallenge={() => restartSession(session, "challenge")}
          onWeakOnly={() => practiseWeakPhrases("tutor")}
          onNew={() => setSession(null)}
        />
      </div>
    );
  }

  if (session && currentPhrase) {
    return (
      <div className="lw-page ss-page ss-workspace" data-testid="speak-shadow-session">
        <section className="ss-article-panel" aria-label="Speak and Shadow article">
          <div className="ss-session-top">
            <div>
              <span className="lw-chip amber">Speak & Shadow Lab</span>
              <span className="lw-chip blue">{isTutorMode(session) ? "Tutor Mode" : "Challenge Mode"}</span>
              <h1>{session.title}</h1>
            </div>
            <button className="lw-btn lw-btn-ghost" type="button" onClick={() => setSession(null)}>
              Back to setup
            </button>
          </div>
          <div className="ss-progress" aria-label={`Speak and Shadow progress ${progressPct}%`}>
            <span style={{ width: `${progressPct}%` }} />
          </div>
          <div className="ss-current-top" aria-live="polite">
            <div>
              <span>Current sentence</span>
              <strong>{currentPhrase.text}</strong>
            </div>
            <small>{tutorNextStepLabel}</small>
          </div>
          <div className="ss-article">
            {session.phrases.map((phrase) => (
              <span
                key={phrase.id}
                ref={phrase.id === session.currentPhraseId ? currentPhraseRef : null}
                className={getPhraseClassName(phrase, session.currentPhraseId)}
              >
                {phrase.text}
              </span>
            ))}
          </div>
        </section>

        <aside
          className={`ss-tutor-panel ss-tutor-panel--${sessionMode}${tutorPanelMinimized ? " is-minimized" : ""}${tutorChatCollapsed ? " is-chat-collapsed" : ""}`}
          aria-label={isTutorMode(session) ? "Fox Tutor coach" : "Fox Challenge coach"}
          style={tutorPanelPosition ? { left: `${tutorPanelPosition.left}px`, top: `${tutorPanelPosition.top}px` } : undefined}
        >
          <div className="ss-tutor-header">
            <div
              className="ss-tutor-drag-handle"
              onPointerDown={handleTutorDragStart}
              onPointerMove={handleTutorDragMove}
              onPointerUp={handleTutorDragEnd}
              onPointerCancel={handleTutorDragEnd}
              title="Drag Fox Tutor"
            >
              <span className="lw-chip blue">{isTutorMode(session) ? "Fox Tutor" : "Fox Coach"}</span>
              <strong>{isTutorMode(session) ? "Tutor Mode" : "Challenge Mode"}</strong>
            </div>
            <div className="ss-tutor-controls">
              <span className="ss-tutor-status">{tutorStatusLabel}</span>
              <button
                className="ss-tutor-icon-btn"
                type="button"
                onClick={() => setTutorChatCollapsed((value) => !value)}
                aria-pressed={tutorChatCollapsed}
              >
                {tutorChatCollapsed ? "Show chat" : "Hide chat"}
              </button>
              <button
                className="ss-tutor-icon-btn"
                type="button"
                onClick={() => setTutorPanelMinimized((value) => !value)}
                aria-pressed={tutorPanelMinimized}
              >
                {tutorPanelMinimized ? "Open" : "Min"}
              </button>
            </div>
          </div>
          <div className={`ss-fox-tutor ss-fox-${foxTutor.className}`}>
            <div className="ss-fox-avatar" aria-hidden="true">
              <img src="/images/foxchild-fox.png" alt="" />
            </div>
            <div className="ss-fox-bubble">
              <span>{foxTutor.label}</span>
              <p>{tutorMessage}</p>
            </div>
          </div>
          {!tutorPanelMinimized && (
            <>
              <div className="ss-next-step-line" aria-live="polite">
                <span>Next step</span>
                <strong>{tutorNextStepLabel}</strong>
              </div>
              {!tutorChatCollapsed && (
                <div className="ss-tutor-chat" role="log" aria-live="polite" aria-label="Fox Tutor chat messages">
                  {tutorChatMessages.map((message) => (
                    <article key={message.id} className={`ss-chat-message ss-chat-message--${message.from} ss-chat-message--${message.type}`}>
                      <span>{getChatMessageLabel(message)}</span>
                      <p>{message.text}</p>
                      {message.type === "checking" && (
                        <span className="ss-chat-dots" aria-hidden="true"><i /><i /><i /></span>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
          <div className="ss-tutor-detail">
          {renderChineseVoiceSelector({
            activeLanguage: session.language,
            value: session.voiceLocale || DEFAULT_CHINESE_VOICE_LOCALE,
            onChange: handleSessionVoiceLocaleChange,
            compact: true,
          })}
          <div className="ss-current-phrase">
            <span>Current sentence</span>
            <strong>{currentPhrase.text}</strong>
          </div>
          <p className="ss-privacy-note">
            Speech recognition is handled by your browser. In Chrome or Edge, audio may be processed by the browser provider. Learning Web stores practice attempts locally in this browser.
          </p>
          <div className="ss-criteria-row">
            <span>Pass at {Math.round((session.settings?.minSimilarity ?? 0.85) * 100)}%</span>
            <span>Confidence {Math.round((session.settings?.minConfidence ?? 0.6) * 100)}%+</span>
            <span>{currentPhrase.difficulty || "medium"} phrase</span>
          </div>
          <div className="ss-token-row" aria-label="Current phrase tokens">
            {currentPhrase.tokens.map((token, index) => (
              <span key={`${token}-${index}`}>{token}</span>
            ))}
          </div>
          <div className="lw-btn-group ss-action-row">
            <button className="lw-btn lw-btn-secondary" type="button" onClick={handleListenAgain} disabled={isSpeaking}>
              {isSpeaking ? "Reading..." : (isTutorMode(session) ? "Listen Again" : "Listen Hint")}
            </button>
            <button
              className="lw-btn lw-btn-primary"
              type="button"
              onClick={handleSpeakNow}
              disabled={!recognitionSupported || recognitionListening || tutorState === TUTOR_STATES.STUDENT_SPEAKING}
            >
              {recognitionListening || tutorState === TUTOR_STATES.STUDENT_SPEAKING ? "Listening..." : "Speak Now"}
            </button>
            <button className="lw-btn lw-btn-ghost" type="button" onClick={stopAllAudio}>
              Stop
            </button>
          </div>
          {!recognitionSupported && (
            <p className="ss-alert">{TUTOR_MESSAGES.unsupportedRecognition} Listen-only practice is still available.</p>
          )}
          {microphoneBlocked && (
            <p className="ss-alert">Microphone permission is blocked. Allow microphone access in the browser, or use manual transcript fallback.</p>
          )}
          {recognitionLastError && recognitionLastError !== "aborted" && !microphoneBlocked && (
            <p className="ss-alert">Speech recognition issue: {recognitionLastError}. Chrome or Edge usually works best.</p>
          )}
          {interimTranscript && (
            <div className="ss-interim" aria-live="polite">
              <span>I heard so far</span>
              <p>{normalizeTranscriptForDisplay(interimTranscript, session.language)}</p>
            </div>
          )}
          <details
            className="ss-manual-transcript"
            open={manualFallbackPanelOpen}
            onToggle={(event) => setManualFallbackOpen(event.currentTarget.open)}
          >
            <summary>Voice not working?</summary>
            <div className="ss-manual-transcript-body">
              <p>Manual transcript fallback. Use this only if the microphone or browser speech recognition is not working.</p>
              <label className="ss-field">
                <span>What did the learner say?</span>
                <textarea
                  value={manualTranscript}
                  onChange={(event) => setManualTranscript(event.target.value)}
                  placeholder="Paste or type what the browser heard..."
                  rows={3}
                />
              </label>
              <button
                className="lw-btn lw-btn-secondary"
                type="button"
                onClick={handleManualTranscriptSubmit}
                disabled={!manualTranscript.trim()}
              >
                Check transcript
              </button>
            </div>
          </details>
          {lastAttempt && (
            <div className="ss-result">
              <span>Heard</span>
              <p>{lastAttempt.transcript}</p>
              <span>Expected</span>
              <p>{currentPhrase.text}</p>
              <strong>Overall: {Math.round((lastAttempt.overallScore ?? lastAttempt.similarity) * 100)}% / Pass: {Math.round((lastAttempt.minSimilarity || 0.85) * 100)}%</strong>
              <small>Similarity: {Math.round((lastAttempt.similarity || 0) * 100)}% · Required words: {Math.round((lastAttempt.requiredTokenScore ?? 0) * 100)}% · Order: {Math.round((lastAttempt.orderScore ?? 0) * 100)}%</small>
              {lastAttempt.confidence !== null && lastAttempt.confidence !== undefined && (
                <small>Confidence: {Math.round(lastAttempt.confidence * 100)}%</small>
              )}
              <small>Match type: {getAttemptMatchLabel(lastAttempt)}</small>
              {lastAttempt.hint && <small>{lastAttempt.hint}</small>}
              {lastAttempt.missingTokens?.length > 0 && (
                <small>Missing words: {lastAttempt.missingTokens.join(", ")}</small>
              )}
              {lastAttempt.extraTokens?.length > 0 && (
                <small>Extra words: {lastAttempt.extraTokens.join(", ")}</small>
              )}
              {!lastAttempt.passed && (
                <button className="lw-btn lw-btn-ghost ss-mark-ok-btn" type="button" onClick={handleMarkCurrentPhraseOk}>
                  Mark as OK
                </button>
              )}
            </div>
          )}
          <div className="lw-btn-group ss-next-row">
            {tutorState === TUTOR_STATES.PASSED && (
              <button className="lw-btn lw-btn-primary" type="button" onClick={handleNextPhrase}>
                Next phrase
              </button>
            )}
            {tutorState === TUTOR_STATES.RETRY && (
              <button className="lw-btn lw-btn-secondary" type="button" onClick={handleListenAgain}>
                {isTutorMode(session) ? "Retry phrase" : "Listen Hint"}
              </button>
            )}
            <button className="lw-btn lw-btn-ghost" type="button" onClick={handleSkipPhrase}>
              Skip
            </button>
          </div>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="lw-page ss-page">
      <RecentSessions
        sessions={savedSessions}
        onResume={(saved) => startSession(saved)}
        onStartNew={() => setSession(null)}
      />

      <section className="lw-card ss-entry-card">
        <span className="lw-chip blue">New module</span>
        <h1>Speak & Shadow Lab</h1>
        <p className="lw-subtitle">Practise reading aloud with a guided tutor</p>
        <p className="ss-privacy-note">
          For best speech recognition, use Chrome or Edge. Speech recognition is handled by your browser; Learning Web keeps your practice locally unless you export or share it.
        </p>

        <div className="ss-source-tabs" role="tablist" aria-label="Start from">
          {[
            ["package", "Existing Package"],
            ["paste", "Paste New Text"],
            ["import", "Import JSON Package"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={sourceMode === id ? "is-active" : ""}
              type="button"
              onClick={() => setSourceMode(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {sourceMode === "paste" && (
          <div className="ss-form-grid">
            <label className="ss-field">
              <span>Title</span>
              <input
                value={form.title}
                onChange={(event) => updateForm({ title: event.target.value })}
                placeholder="My reading practice"
              />
            </label>
            <label className="ss-field ss-textarea-field">
              <span>Text</span>
              <textarea
                value={form.text}
                onChange={(event) => updateForm({ text: event.target.value })}
                placeholder="Paste a short passage here..."
                rows={10}
              />
            </label>
            <LabeledSelect
              label="Language"
              value={form.language}
              onChange={handleFormLanguageChange}
              selectTestId="speak-shadow-language-select"
            >
              {SPEAK_SHADOW_LANGUAGES.map((language) => (
                <option key={language.id} value={language.id}>{language.label}</option>
              ))}
            </LabeledSelect>
            <LabeledSelect
              label="Phrase length"
              value={form.phraseLength}
              onChange={(value) => updateForm({ phraseLength: value })}
              selectTestId="speak-shadow-phrase-length-select"
            >
              {Object.entries(PHRASE_LENGTHS).map(([id, value]) => (
                <option key={id} value={id}>{value.label}</option>
              ))}
            </LabeledSelect>
            <label className="ss-checkbox">
              <input
                type="checkbox"
                checked={form.savedToBrowser}
                onChange={(event) => updateForm({ savedToBrowser: event.target.checked })}
              />
              <span>Save to browser profile</span>
            </label>
            {renderPracticeSettings(form.language)}
            {form.savedToBrowser && (
              <p className="ss-privacy-note">
                Saved practices are stored only in this browser. They are not uploaded to a server.
              </p>
            )}
            {!textLimit.ok && (
              <p className="ss-alert">This text is {textLimit.count} {textLimit.unit}. Keep it within {textLimit.limit} {textLimit.unit}.</p>
            )}
            {error && <p className="ss-alert">{error}</p>}
            {renderModeStartActions({
              onTutorStart: () => createFromPaste("tutor"),
              onChallengeStart: () => createFromPaste("challenge"),
              disabled: !form.text.trim() || !textLimit.ok,
            })}
            <div className="lw-btn-group">
              <button className="lw-btn lw-btn-secondary" type="button" onClick={copyAiPackPrompt}>
                {promptCopied ? "Prompt copied" : "Generate AI Pack Prompt"}
              </button>
              <button className="lw-btn lw-btn-ghost" type="button" onClick={() => { setForm(INITIAL_FORM); setError(""); }}>
                Reset
              </button>
            </div>
          </div>
        )}

        {sourceMode === "package" && (
          <div className="ss-form-grid">
            <p className="lw-subtitle">Choose a Reading pack and the lab will turn its passage text into phrase-by-phrase shadowing practice.</p>
            <LabeledSelect
              label="Reading package"
              value={packageId}
              onChange={setPackageId}
              selectTestId="speak-shadow-package-select"
            >
              <option value="">{passageGroups.length ? "Choose a package" : "No reading packages found"}</option>
              {passageGroups.map((group) => (
                <option key={group.id} value={group.id}>{group.displayName || group.id}</option>
              ))}
            </LabeledSelect>
            <LabeledSelect
              label="Phrase length"
              value={form.phraseLength}
              onChange={(value) => updateForm({ phraseLength: value })}
              selectTestId="speak-shadow-package-phrase-length-select"
            >
              {Object.entries(PHRASE_LENGTHS).map(([id, value]) => (
                <option key={id} value={id}>{value.label}</option>
              ))}
            </LabeledSelect>
            <label className="ss-checkbox">
              <input
                type="checkbox"
                checked={form.savedToBrowser}
                onChange={(event) => updateForm({ savedToBrowser: event.target.checked })}
              />
              <span>Save to browser profile</span>
            </label>
            {renderPracticeSettings(selectedPackageLanguage)}
            {error && <p className="ss-alert">{error}</p>}
            {renderModeStartActions({
              onTutorStart: () => createFromPackage("tutor"),
              onChallengeStart: () => createFromPackage("challenge"),
              disabled: !packageId,
            })}
          </div>
        )}

        {sourceMode === "import" && (
          <div className="ss-form-grid">
            <p className="lw-subtitle">Import a saved Speak & Shadow session or a simple readAloud JSON package.</p>
            <label className="ss-field">
              <span>JSON package</span>
              <input type="file" accept="application/json,.json" onChange={importJsonFile} />
            </label>
            <label className="ss-checkbox">
              <input
                type="checkbox"
                checked={form.savedToBrowser}
                onChange={(event) => updateForm({ savedToBrowser: event.target.checked })}
              />
              <span>Save to browser profile</span>
            </label>
            {error && <p className="ss-alert">{error}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
