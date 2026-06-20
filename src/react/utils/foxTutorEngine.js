import { TUTOR_STATES } from "./speakShadowConfig.js";

export const FOX_TUTOR_VISUAL_STATES = {
  IDLE: "idle",
  TALKING: "talking",
  LISTENING: "listening",
  THINKING: "thinking",
  ENCOURAGING: "encouraging",
  HAPPY: "happy",
  CELEBRATING: "celebrating",
};

const VISUAL_STATE_COPY = {
  [FOX_TUTOR_VISUAL_STATES.IDLE]: "Ready",
  [FOX_TUTOR_VISUAL_STATES.TALKING]: "Speaking",
  [FOX_TUTOR_VISUAL_STATES.LISTENING]: "Listening",
  [FOX_TUTOR_VISUAL_STATES.THINKING]: "Checking",
  [FOX_TUTOR_VISUAL_STATES.ENCOURAGING]: "Try Again",
  [FOX_TUTOR_VISUAL_STATES.HAPPY]: "Great Job",
  [FOX_TUTOR_VISUAL_STATES.CELEBRATING]: "Completed",
};

function normalizeMode(mode) {
  return mode === "challenge" ? "challenge" : "tutor";
}

function message(id, from, type, text, meta = {}) {
  return { id, from, type, text, meta };
}

function attemptTranscriptMessage(attempt) {
  if (!attempt?.transcript) return null;
  return message(
    "learner-last-transcript",
    "learner",
    "transcript",
    attempt.transcript,
    {
      score: attempt.overallScore ?? attempt.similarity ?? null,
      source: attempt.source || "speech_recognition",
    },
  );
}

function buildFeedbackText({ mode, attempt, tutorMessage }) {
  if (!attempt) return tutorMessage || (mode === "challenge" ? "Good try. Read it again slowly." : "Good try. Let’s read it a little more slowly.");
  if (attempt.passed) {
    if ((attempt.similarity || 0) >= 0.95) return "Excellent. That was clear and confident.";
    return mode === "challenge" ? "Good job. Keep going." : "Great reading. Let’s go to the next sentence.";
  }
  if (attempt.matchType === "equivalent") {
    return "That sounds close. The browser may have heard a similar word. Let’s try once more slowly.";
  }
  if ((attempt.confidenceScore ?? attempt.confidence) !== null && (attempt.confidenceScore ?? attempt.confidence) < 0.35) {
    return "I’m not sure I heard that clearly. Try once more slowly.";
  }
  if (attempt.missingTokens?.length) {
    return `Good try. Focus on this part: ${attempt.missingTokens.slice(0, 4).join(", ")}. Let’s try again slowly.`;
  }
  return tutorMessage || (mode === "challenge" ? "Good try. Read it again slowly." : "Good try. Let’s read it a little more slowly.");
}

export function getFoxTutorState(context = {}) {
  const tutorState = context.tutorState;
  let id = FOX_TUTOR_VISUAL_STATES.IDLE;
  if (tutorState === TUTOR_STATES.TUTOR_READING) id = FOX_TUTOR_VISUAL_STATES.TALKING;
  else if (
    tutorState === TUTOR_STATES.AUTO_LISTEN_PENDING
    || tutorState === TUTOR_STATES.WAITING_FOR_STUDENT
    || tutorState === TUTOR_STATES.STUDENT_SPEAKING
    || tutorState === TUTOR_STATES.PENDING_CONTINUATION
  ) id = FOX_TUTOR_VISUAL_STATES.LISTENING;
  else if (tutorState === TUTOR_STATES.CHECKING) id = FOX_TUTOR_VISUAL_STATES.THINKING;
  else if (tutorState === TUTOR_STATES.PASSED) id = FOX_TUTOR_VISUAL_STATES.HAPPY;
  else if (tutorState === TUTOR_STATES.COMPLETED) id = FOX_TUTOR_VISUAL_STATES.CELEBRATING;
  else if (tutorState === TUTOR_STATES.RETRY || tutorState === TUTOR_STATES.SILENCE_TIMEOUT) {
    id = FOX_TUTOR_VISUAL_STATES.ENCOURAGING;
  }

  return {
    id,
    className: id,
    label: VISUAL_STATE_COPY[id],
  };
}

export function getTutorStatusLabel(context = {}) {
  return getFoxTutorState(context).label;
}

export function getNextStepLabel(context = {}) {
  switch (context.tutorState) {
    case TUTOR_STATES.TUTOR_READING:
      return "Listen to Fox";
    case TUTOR_STATES.AUTO_LISTEN_PENDING:
    case TUTOR_STATES.WAITING_FOR_STUDENT:
    case TUTOR_STATES.STUDENT_SPEAKING:
    case TUTOR_STATES.PENDING_CONTINUATION:
      return "Your turn to speak";
    case TUTOR_STATES.CHECKING:
      return "Checking your reading";
    case TUTOR_STATES.RETRY:
    case TUTOR_STATES.SILENCE_TIMEOUT:
    case TUTOR_STATES.MANUAL_FALLBACK:
      return "Try again slowly";
    case TUTOR_STATES.PASSED:
      return "Moving to next sentence";
    case TUTOR_STATES.COMPLETED:
      return "Choose your next challenge";
    default:
      return normalizeMode(context.mode) === "challenge" ? "Your turn to speak" : "Listen to Fox";
  }
}

export function getFoxTutorMessage(context = {}) {
  const mode = normalizeMode(context.mode);
  const state = context.tutorState;
  if (state === TUTOR_STATES.TUTOR_READING) return "Listen carefully. I’m reading this sentence first.";
  if (state === TUTOR_STATES.AUTO_LISTEN_PENDING) {
    return mode === "challenge"
      ? "Read this sentence by yourself. I’ll listen and score it."
      : "Now it’s your turn. Read the sentence aloud.";
  }
  if (state === TUTOR_STATES.STUDENT_SPEAKING) return "I’m listening. Read the sentence aloud.";
  if (state === TUTOR_STATES.PENDING_CONTINUATION) return "Keep going. I heard the first part.";
  if (state === TUTOR_STATES.CHECKING) return "Let me check that...";
  if (state === TUTOR_STATES.PASSED || state === TUTOR_STATES.RETRY) {
    return buildFeedbackText({ mode, attempt: context.lastAttempt, tutorMessage: context.tutorMessage });
  }
  if (state === TUTOR_STATES.SILENCE_TIMEOUT) return "I didn’t hear anything yet. Take your time. Press Speak Now when you are ready.";
  if (state === TUTOR_STATES.MANUAL_FALLBACK) return context.tutorMessage || "Your browser needs a moment. Try Listen Again, then press Speak Now.";
  if (state === TUTOR_STATES.COMPLETED) return mode === "challenge"
    ? "Challenge completed! Look at your score and choose what to practise next."
    : "Amazing work! You finished the whole passage with me. What would you like to do next?";
  return mode === "challenge"
    ? "This is Challenge Mode. I won’t read first. You read each sentence yourself."
    : "Hi! I’m your Fox reading coach. I’ll read first, then you repeat after me.";
}

export function buildTutorChatMessages(context = {}) {
  const mode = normalizeMode(context.mode);
  const state = context.tutorState;
  const messages = [];
  messages.push(message(
    "fox-mode-intro",
    "fox",
    "intro",
    mode === "challenge"
      ? "Challenge Mode: I won’t read first. You read each sentence by yourself."
      : "Tutor Mode: I’ll read one sentence first. Listen, then repeat after me.",
    { mode },
  ));

  if (state === TUTOR_STATES.TUTOR_READING) {
    messages.push(message("fox-reading-instruction", "fox", "instruction", getFoxTutorMessage(context)));
    messages.push(message("system-fox-reading", "system", "speaking", "Fox is reading...", { phraseId: context.currentPhrase?.id }));
  } else if (state === TUTOR_STATES.AUTO_LISTEN_PENDING) {
    messages.push(message("fox-turn-instruction", "fox", "instruction", getFoxTutorMessage(context)));
    messages.push(message("system-mic-ready", "system", "listening", "Getting the microphone ready..."));
  } else if (state === TUTOR_STATES.STUDENT_SPEAKING) {
    messages.push(message("fox-listening-instruction", "fox", "instruction", getFoxTutorMessage(context)));
    messages.push(message("system-listening", "system", "listening", "Listening..."));
  } else if (state === TUTOR_STATES.PENDING_CONTINUATION) {
    messages.push(message("fox-continuation", "fox", "instruction", getFoxTutorMessage(context)));
    messages.push(message("system-listening-more", "system", "listening", "Still listening..."));
  } else if (state === TUTOR_STATES.CHECKING) {
    const heard = attemptTranscriptMessage(context.lastAttempt);
    if (heard) messages.push(heard);
    messages.push(message("fox-checking", "fox", "checking", getFoxTutorMessage(context)));
    messages.push(message("system-checking", "system", "checking", "Checking your reading..."));
  } else if (state === TUTOR_STATES.PASSED || state === TUTOR_STATES.RETRY) {
    const heard = attemptTranscriptMessage(context.lastAttempt);
    if (heard) messages.push(heard);
    messages.push(message(
      `fox-feedback-${state}`,
      "fox",
      "feedback",
      getFoxTutorMessage(context),
      {
        score: context.lastAttempt?.overallScore ?? context.lastAttempt?.similarity ?? null,
        missingTokens: context.lastAttempt?.missingTokens || [],
        matchType: context.lastAttempt?.matchType || "",
      },
    ));
  } else if (state === TUTOR_STATES.SILENCE_TIMEOUT || state === TUTOR_STATES.MANUAL_FALLBACK) {
    messages.push(message(`fox-${state}`, "fox", "warning", getFoxTutorMessage(context)));
  } else if (state === TUTOR_STATES.COMPLETED) {
    messages.push(message("fox-completion", "fox", "completion", getFoxTutorMessage(context)));
  } else {
    messages.push(message("fox-ready", "fox", "instruction", getFoxTutorMessage(context)));
  }

  const nextStep = getNextStepLabel(context);
  messages.push(message("system-next-step", "system", "next_step", `Next step: ${nextStep}`));
  return messages.slice(-6);
}

export function buildTutorChatMessage(context = {}) {
  return buildTutorChatMessages(context).at(-2) || message("fox-ready", "fox", "instruction", getFoxTutorMessage(context));
}

export function getTutorActionPlan(context = {}) {
  const mode = normalizeMode(context.mode);
  const nextStep = getNextStepLabel(context);
  return {
    mode,
    nextStep,
    shouldReadFirst: mode === "tutor",
    shouldListenNow: nextStep === "Your turn to speak",
    shouldRetry: nextStep === "Try again slowly",
  };
}
