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
  PHRASE_LENGTHS,
  PHRASE_STATUS,
  SPEAK_SHADOW_LANGUAGES,
  TUTOR_MESSAGES,
  TUTOR_STATES,
  getSpeakShadowLanguageByLocale,
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
  phraseLength: "medium",
  savedToBrowser: true,
};

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
    state.speakShadow = { sessions: {}, recentSessionIds: [], lastSessionId: "" };
  }
  const saved = { ...session, savedToBrowser: true, lastOpenedAt: new Date().toISOString() };
  state.speakShadow.sessions[saved.sessionId] = saved;
  state.speakShadow.lastSessionId = saved.sessionId;
  state.speakShadow.recentSessionIds = [
    saved.sessionId,
    ...(state.speakShadow.recentSessionIds || []).filter((id) => id !== saved.sessionId),
  ].slice(0, 8);
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
  const [error, setError] = useState("");
  const [promptCopied, setPromptCopied] = useState(false);
  const currentPhraseRef = useRef(null);

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

  useEffect(() => () => {
    stopSpeaking();
    stopListening();
  }, []);

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

  function beginTutorReading(targetSession = session) {
    const phrase = getCurrentPhrase(targetSession);
    if (!phrase) return;
    if (!synthesisSupported) {
      setTutorState(TUTOR_STATES.WAITING_FOR_STUDENT);
      setTutorMessage(TUTOR_MESSAGES.unsupportedTts);
      return;
    }
    stopSpeaking();
    setIsSpeaking(true);
    setTutorState(TUTOR_STATES.TUTOR_READING);
    setTutorMessage(TUTOR_MESSAGES.intro);
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
    const normalized = markCurrentPhrase(nextSession, nextSession.currentPhraseId || nextSession.phrases[0].id);
    commitSession(normalized);
    beginTutorReading(normalized);
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
    startSession(createSpeakShadowSession(form));
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
      startSession(createSpeakShadowSession({
        title: group?.displayName || "Reading package practice",
        text,
        language,
        phraseLength: form.phraseLength,
        savedToBrowser: form.savedToBrowser,
        sourceType: "existing_package",
        sourcePackageId: packageId,
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
    startListening(
      session.recognitionLang || session.ttsLang || "en-GB",
      (transcript, confidence) => {
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
        } else {
          setTutorState(TUTOR_STATES.RETRY);
          setTutorMessage(TUTOR_MESSAGES.retry);
        }
      },
      () => {
        setTutorState(TUTOR_STATES.RETRY);
        setTutorMessage("I could not hear that clearly. Try once more.");
      },
    );
  }

  function moveToPhrase(phraseId) {
    if (!session) return;
    const next = markCurrentPhrase(session, phraseId);
    setLastAttempt(null);
    commitSession(next);
    if (next.settings?.autoPlayTutor) beginTutorReading(next);
  }

  function handleNextPhrase() {
    if (!session || !currentPhrase) return;
    const index = session.phrases.findIndex((phrase) => phrase.id === currentPhrase.id);
    const nextPhrase = session.phrases[index + 1];
    if (!nextPhrase) {
      const done = {
        ...session,
        lastOpenedAt: new Date().toISOString(),
        phrases: session.phrases.map((phrase) => (
          phrase.id === currentPhrase.id ? { ...phrase, status: PHRASE_STATUS.PASSED } : phrase
        )),
      };
      commitSession(done);
      setTutorState(TUTOR_STATES.COMPLETED);
      setTutorMessage(TUTOR_MESSAGES.completed);
      return;
    }
    moveToPhrase(nextPhrase.id);
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
    if (nextPhrase) moveToPhrase(nextPhrase.id);
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
          <p className="ss-tutor-message">{tutorMessage}</p>
          <div className="ss-current-phrase">
            <span>Current sentence</span>
            <strong>{currentPhrase.text}</strong>
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
          {lastAttempt && (
            <div className="ss-result">
              <span>You said</span>
              <p>{lastAttempt.transcript}</p>
              <strong>Score: {Math.round(lastAttempt.similarity * 100)}%</strong>
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
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="My reading practice"
              />
            </label>
            <label className="ss-field ss-textarea-field">
              <span>Text</span>
              <textarea
                value={form.text}
                onChange={(event) => setForm({ ...form, text: event.target.value })}
                placeholder="Paste a short passage here..."
                rows={10}
              />
            </label>
            <LabeledSelect
              label="Language"
              value={form.language}
              onChange={(value) => setForm({ ...form, language: value })}
              selectTestId="speak-shadow-language-select"
            >
              {SPEAK_SHADOW_LANGUAGES.map((language) => (
                <option key={language.id} value={language.id}>{language.label}</option>
              ))}
            </LabeledSelect>
            <LabeledSelect
              label="Phrase length"
              value={form.phraseLength}
              onChange={(value) => setForm({ ...form, phraseLength: value })}
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
                onChange={(event) => setForm({ ...form, savedToBrowser: event.target.checked })}
              />
              <span>Save to browser profile</span>
            </label>
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
              onChange={(value) => setForm({ ...form, phraseLength: value })}
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
                onChange={(event) => setForm({ ...form, savedToBrowser: event.target.checked })}
              />
              <span>Save to browser profile</span>
            </label>
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
                onChange={(event) => setForm({ ...form, savedToBrowser: event.target.checked })}
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
