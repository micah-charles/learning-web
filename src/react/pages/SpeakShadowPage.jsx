import { useEffect, useMemo, useRef, useState } from "react";
import { useManifest } from "../context/ManifestContext.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { LabeledSelect, LoadingText } from "../components/layout/Controls.jsx";
import { listPassageGroups, loadPassagePack } from "@/data.js";
import { isSpeechSynthesisSupported, speakText, stopSpeaking } from "@/utils.js";
import {
  isSpeechRecognitionSupported,
  startListening,
  stopListening,
} from "../services/speechRecognitionService.js";
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
} from "../utils/speakShadowSegmenter.js";
import { scoreSpeakShadowAttempt } from "../utils/speakShadowScoring.js";

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

const FOX_TUTOR_STATE = {
  idle: { label: "Ready", face: "🦊", className: "idle" },
  talking: { label: "Speaking", face: "🦊", className: "talking" },
  listening: { label: "Listening", face: "🦊", className: "listening" },
  thinking: { label: "Checking", face: "🦊", className: "thinking" },
  happy: { label: "Passed", face: "🦊", className: "happy" },
  encouraging: { label: "Try again", face: "🦊", className: "encouraging" },
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
  return {
    ...DEFAULT_SPEAK_SHADOW_SETTINGS,
    phraseLength: form.phraseLength,
    minSimilarity: clampPercent(form.passThreshold, 85) / 100,
    minConfidence: clampPercent(form.minConfidence, 60) / 100,
    tutorMode: Boolean(form.tutorMode),
    autoAdvanceOnPass: Boolean(form.autoAdvanceOnPass),
    autoReadNextPhrase: Boolean(form.autoReadNextPhrase),
  };
}

function getFoxTutorState(tutorState) {
  if (tutorState === TUTOR_STATES.TUTOR_READING) return FOX_TUTOR_STATE.talking;
  if (tutorState === TUTOR_STATES.WAITING_FOR_STUDENT || tutorState === TUTOR_STATES.STUDENT_SPEAKING) return FOX_TUTOR_STATE.listening;
  if (tutorState === TUTOR_STATES.CHECKING) return FOX_TUTOR_STATE.thinking;
  if (tutorState === TUTOR_STATES.PASSED || tutorState === TUTOR_STATES.COMPLETED) return FOX_TUTOR_STATE.happy;
  if (tutorState === TUTOR_STATES.RETRY) return FOX_TUTOR_STATE.encouraging;
  return FOX_TUTOR_STATE.idle;
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

function CompletionScreen({ session, onRestart, onWeakOnly, onNew }) {
  const summary = summarizeSession(session);
  return (
    <section className="lw-card ss-completion" data-testid="speak-shadow-complete">
      <span className="lw-chip green">Complete</span>
      <h2 className="lw-section-title">Excellent. You have finished the whole passage.</h2>
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
        <button className="lw-btn lw-btn-primary" type="button" onClick={onRestart}>Restart</button>
        {summary.weakPhrases.length > 0 && (
          <button className="lw-btn lw-btn-secondary" type="button" onClick={onWeakOnly}>
            Practise weak phrases
          </button>
        )}
        <button className="lw-btn lw-btn-ghost" type="button" onClick={onNew}>Start new</button>
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
  const [error, setError] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);
  const currentPhraseRef = useRef(null);
  const autoTimerRef = useRef(null);
  const formPrefsLoadedRef = useRef(false);

  const recognitionSupported = isSpeechRecognitionSupported();
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
  const progressPct = session?.phrases?.length
    ? Math.round((session.phrases.filter((phrase) => phrase.status === PHRASE_STATUS.PASSED).length / session.phrases.length) * 100)
    : 0;
  const foxTutor = getFoxTutorState(tutorState);
  const selectedPackage = passageGroups.find((item) => item.id === packageId);
  const selectedPackageLanguage = getSpeakShadowLanguageByLocale(
    selectedPackage?.sourceLanguageCode || selectedPackage?.speechLanguage || selectedPackage?.targetLanguageCode,
  ).id;

  useEffect(() => () => {
    stopSpeaking();
    stopListening();
    if (autoTimerRef.current) window.clearTimeout(autoTimerRef.current);
  }, []);

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
    if (currentPhraseRef.current) {
      currentPhraseRef.current.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
  }, [session?.currentPhraseId]);

  function commitSession(nextSession) {
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

  function beginTutorReading(targetSession = session, { message = TUTOR_MESSAGES.intro } = {}) {
    const phrase = getCurrentPhrase(targetSession);
    if (!phrase) return;
    if (!targetSession.settings?.tutorMode) {
      setTutorState(TUTOR_STATES.WAITING_FOR_STUDENT);
      setTutorMessage(TUTOR_MESSAGES.speak);
      return;
    }
    if (!synthesisSupported) {
      setTutorState(TUTOR_STATES.WAITING_FOR_STUDENT);
      setTutorMessage(TUTOR_MESSAGES.unsupportedTts);
      return;
    }
    stopSpeaking();
    setIsSpeaking(true);
    setTutorState(TUTOR_STATES.TUTOR_READING);
    setTutorMessage(message);
    speakText(phrase.text, targetSession.ttsLang || "en-GB", {
      rate: 0.9,
      onEnd: () => {
        setIsSpeaking(false);
        setTutorState(TUTOR_STATES.WAITING_FOR_STUDENT);
        setTutorMessage(TUTOR_MESSAGES.speak);
      },
      onError: () => {
        setIsSpeaking(false);
        setTutorState(TUTOR_STATES.WAITING_FOR_STUDENT);
      },
    });
  }

  function startSession(nextSession) {
    if (!nextSession.phrases.length) {
      setError("Add at least one sentence or phrase to practise.");
      return;
    }
    setError("");
    setLastAttempt(null);
    setManualTranscript("");
    clearAutoTimer();
    const speech = resolveSpeakShadowSpeech({ language: nextSession.language, voiceLocale: nextSession.voiceLocale });
    const withDefaults = {
      ...nextSession,
      language: speech.language,
      voiceLocale: speech.voiceLocale,
      ttsLang: nextSession.ttsLang || speech.ttsLang,
      recognitionLang: nextSession.recognitionLang || speech.recognitionLang,
      settings: { ...DEFAULT_SPEAK_SHADOW_SETTINGS, ...(nextSession.settings || {}) },
    };
    const normalized = markCurrentPhrase(withDefaults, withDefaults.currentPhraseId || withDefaults.phrases[0].id);
    commitSession(normalized);
    if (normalized.settings?.tutorMode) beginTutorReading(normalized);
    else {
      setTutorState(TUTOR_STATES.WAITING_FOR_STUDENT);
      setTutorMessage(TUTOR_MESSAGES.speak);
    }
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
        setTutorMessage(TUTOR_MESSAGES.completed);
        return;
      }
      const next = markCurrentPhrase(sourceSession, nextPhrase.id);
      setLastAttempt(null);
      setManualTranscript("");
      commitSession(next);
      if (next.settings?.tutorMode && next.settings?.autoReadNextPhrase) {
        beginTutorReading(next);
      } else {
        setTutorState(TUTOR_STATES.WAITING_FOR_STUDENT);
        setTutorMessage(TUTOR_MESSAGES.speak);
      }
    };

    if (delayMs > 0) {
      autoTimerRef.current = window.setTimeout(run, delayMs);
    } else {
      run();
    }
  }

  function handleScoredTranscript(transcript, confidence = null) {
    if (!session || !currentPhrase || !String(transcript || "").trim()) return;
    clearAutoTimer();
    setTutorState(TUTOR_STATES.CHECKING);
    const score = scoreSpeakShadowAttempt({
      expected: currentPhrase.text,
      transcript,
      confidence,
      language: session.language,
      settings: session.settings,
    });
    const attempt = {
      transcript,
      confidence: score.confidence,
      similarity: score.similarity,
      minSimilarity: session.settings?.minSimilarity ?? DEFAULT_SPEAK_SHADOW_SETTINGS.minSimilarity,
      minConfidence: session.settings?.minConfidence ?? DEFAULT_SPEAK_SHADOW_SETTINGS.minConfidence,
      passed: score.passed,
      missingTokens: score.missingTokens,
      extraTokens: score.extraTokens,
      createdAt: new Date().toISOString(),
    };
    setLastAttempt(attempt);

    const updated = {
      ...session,
      lastOpenedAt: new Date().toISOString(),
      phrases: session.phrases.map((phrase) => {
        if (phrase.id !== currentPhrase.id) return phrase;
        return {
          ...phrase,
          status: score.passed ? PHRASE_STATUS.PASSED : PHRASE_STATUS.RETRY,
          attempts: [...(phrase.attempts || []), attempt],
        };
      }),
    };
    commitSession(updated);

    if (score.passed) {
      setTutorState(TUTOR_STATES.PASSED);
      setTutorMessage(TUTOR_MESSAGES.passed);
      if (updated.settings?.autoAdvanceOnPass) {
        moveToNextPhraseFrom(updated, currentPhrase.id, { delayMs: 950 });
      }
      return;
    }

    setTutorState(TUTOR_STATES.RETRY);
    setTutorMessage(TUTOR_MESSAGES.retry);
    const currentWithAttempt = updated.phrases.find((phrase) => phrase.id === currentPhrase.id);
    const failedAttempts = (currentWithAttempt?.attempts || []).filter((attemptItem) => !attemptItem.passed).length;
    if (updated.settings?.tutorMode && failedAttempts <= (updated.settings.retryBeforeManualHelp || 2)) {
      autoTimerRef.current = window.setTimeout(() => {
        beginTutorReading(updated, { message: TUTOR_MESSAGES.retry });
      }, 850);
    }
  }

  function createFromPaste() {
    if (!form.text.trim()) {
      setError("Paste a short passage first.");
      return;
    }
    if (!textLimit.ok) {
      setError(`This text is ${textLimit.count} ${textLimit.unit}. Keep it within ${textLimit.limit} ${textLimit.unit} for the MVP.`);
      return;
    }
    const settings = settingsFromForm(form);
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

  async function createFromPackage() {
    if (!packageId) {
      setError("Choose a reading package first.");
      return;
    }
    try {
      const passages = await loadPassagePack(manifest, packageId);
      const group = passageGroups.find((item) => item.id === packageId);
      const text = passages.map((passage) => passage.sourceText || passage.targetText).filter(Boolean).join(" ");
      const language = getSpeakShadowLanguageByLocale(passages[0]?.speech_language || group?.sourceLanguageCode).id;
      const settings = settingsFromForm(form);
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
    beginTutorReading();
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
    stopListening();
    setIsSpeaking(false);
    commitPreferences({ chineseVoiceLocale: speech.voiceLocale });
    commitSession(updated);
    setTutorState(TUTOR_STATES.WAITING_FOR_STUDENT);
    setTutorMessage(`${getChineseVoiceLocale(speech.voiceLocale).label} voice selected. ${TUTOR_MESSAGES.speak}`);
  }

  function handleSpeakNow() {
    if (!session || !currentPhrase) return;
    if (!recognitionSupported) {
      setTutorState(TUTOR_STATES.WAITING_FOR_STUDENT);
      setTutorMessage(TUTOR_MESSAGES.unsupportedRecognition);
      return;
    }
    setTutorState(TUTOR_STATES.STUDENT_SPEAKING);
    setTutorMessage("Listening...");
    setLastAttempt(null);
    setManualTranscript("");
    startListening(
      session.recognitionLang || session.ttsLang || "en-GB",
      handleScoredTranscript,
      () => {
        setTutorState(TUTOR_STATES.RETRY);
        setTutorMessage("I could not hear that clearly. Try once more.");
      },
    );
  }

  function handleManualTranscriptSubmit() {
    handleScoredTranscript(manualTranscript, null);
  }

  function moveToPhrase(phraseId) {
    if (!session) return;
    clearAutoTimer();
    const next = markCurrentPhrase(session, phraseId);
    setLastAttempt(null);
    setManualTranscript("");
    commitSession(next);
    if (next.settings?.tutorMode && next.settings?.autoReadNextPhrase) beginTutorReading(next);
  }

  function handleNextPhrase() {
    if (!session || !currentPhrase) return;
    moveToNextPhraseFrom(session, currentPhrase.id);
  }

  function handleSkipPhrase() {
    if (!session || !currentPhrase) return;
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

  function restartSession(targetSession = session) {
    if (!targetSession) return;
    const restarted = {
      ...targetSession,
      currentPhraseId: targetSession.phrases[0]?.id || "",
      phrases: targetSession.phrases.map((phrase, index) => ({
        ...phrase,
        status: index === 0 ? PHRASE_STATUS.CURRENT : PHRASE_STATUS.NOT_STARTED,
        attempts: [],
      })),
    };
    startSession(restarted);
  }

  function practiseWeakPhrases() {
    if (!session) return;
    const weak = session.phrases.filter((phrase) => (phrase.attempts || []).some((attempt) => !attempt.passed));
    if (!weak.length) return;
    const now = new Date().toISOString();
    startSession({
      ...session,
      sessionId: `${session.sessionId}-weak-${Date.now()}`,
      title: `${session.title} - weak phrases`,
      createdAt: now,
      lastOpenedAt: now,
      currentPhraseId: weak[0].id,
      phrases: weak.map((phrase, index) => ({
        ...phrase,
        status: index === 0 ? PHRASE_STATUS.CURRENT : PHRASE_STATUS.NOT_STARTED,
        attempts: [],
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
            checked={form.tutorMode}
            onChange={(event) => updateForm({ tutorMode: event.target.checked })}
          />
          <span>Tutor mode</span>
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
          <span>Auto-read next phrase</span>
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
          onWeakOnly={practiseWeakPhrases}
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
              <h1>{session.title}</h1>
            </div>
            <button className="lw-btn lw-btn-ghost" type="button" onClick={() => setSession(null)}>
              Back to setup
            </button>
          </div>
          <div className="ss-progress" aria-label={`Speak and Shadow progress ${progressPct}%`}>
            <span style={{ width: `${progressPct}%` }} />
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

        <aside className="ss-tutor-panel" aria-label="Reading Tutor">
          <div className="ss-tutor-header">
            <span className="lw-chip blue">Reading Tutor</span>
            <strong>{tutorState.replace(/_/g, " ")}</strong>
          </div>
          <div className={`ss-fox-tutor ss-fox-${foxTutor.className}`}>
            <div className="ss-fox-avatar" aria-hidden="true">{foxTutor.face}</div>
            <div className="ss-fox-bubble">
              <span>{foxTutor.label}</span>
              <p>{tutorMessage}</p>
            </div>
          </div>
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
          <div className="ss-criteria-row">
            <span>Pass at {Math.round((session.settings?.minSimilarity ?? 0.85) * 100)}%</span>
            <span>Confidence {Math.round((session.settings?.minConfidence ?? 0.6) * 100)}%+</span>
          </div>
          <div className="ss-token-row" aria-label="Current phrase tokens">
            {currentPhrase.tokens.map((token, index) => (
              <span key={`${token}-${index}`}>{token}</span>
            ))}
          </div>
          <div className="lw-btn-group ss-action-row">
            <button className="lw-btn lw-btn-secondary" type="button" onClick={handleListenAgain} disabled={isSpeaking}>
              {isSpeaking ? "Reading..." : "Listen Again"}
            </button>
            <button
              className="lw-btn lw-btn-primary"
              type="button"
              onClick={handleSpeakNow}
              disabled={!recognitionSupported || tutorState === TUTOR_STATES.STUDENT_SPEAKING}
            >
              {tutorState === TUTOR_STATES.STUDENT_SPEAKING ? "Listening..." : "Speak Now"}
            </button>
            <button className="lw-btn lw-btn-ghost" type="button" onClick={() => { stopSpeaking(); stopListening(); setIsSpeaking(false); }}>
              Stop
            </button>
          </div>
          {!recognitionSupported && (
            <p className="ss-alert">{TUTOR_MESSAGES.unsupportedRecognition} Listen-only practice is still available.</p>
          )}
          <div className="ss-manual-transcript">
            <label className="ss-field">
              <span>Manual transcript fallback</span>
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
          {lastAttempt && (
            <div className="ss-result">
              <span>You said</span>
              <p>{lastAttempt.transcript}</p>
              <strong>Score: {Math.round(lastAttempt.similarity * 100)}% / Pass: {Math.round((lastAttempt.minSimilarity || 0.85) * 100)}%</strong>
              {lastAttempt.missingTokens?.length > 0 && (
                <small>Listen for: {lastAttempt.missingTokens.join(", ")}</small>
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
                Retry phrase
              </button>
            )}
            <button className="lw-btn lw-btn-ghost" type="button" onClick={handleSkipPhrase}>
              Skip
            </button>
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
            <div className="lw-btn-group">
              <button className="lw-btn lw-btn-primary" type="button" onClick={createFromPaste}>
                Create Practice
              </button>
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
            <button className="lw-btn lw-btn-primary" type="button" onClick={createFromPackage} disabled={!packageId}>
              Create from package
            </button>
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
