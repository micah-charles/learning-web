export const SOUND_CUES = {
  READY_TO_SPEAK: "ready_to_speak",
  CORRECT: "correct",
  RETRY: "retry",
  INCOMPLETE_KEEP_GOING: "keep_going",
};

let audioContext = null;

export function isSoundCueSupported() {
  return typeof window !== "undefined" && Boolean(window.AudioContext || window.webkitAudioContext);
}

function getAudioContext() {
  if (!isSoundCueSupported()) return null;
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

export function primeSoundCues() {
  const context = getAudioContext();
  if (context?.state === "suspended") context.resume().catch(() => {});
}

function playTone(context, { frequency, start, duration, gain = 0.045 }) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  gainNode.gain.setValueAtTime(0.0001, start);
  gainNode.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function playSoundCue(type, { enabled = true } = {}) {
  if (!enabled) return;
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended") context.resume().catch(() => {});
  const now = context.currentTime + 0.01;

  if (type === SOUND_CUES.CORRECT) {
    playTone(context, { frequency: 660, start: now, duration: 0.08, gain: 0.05 });
    playTone(context, { frequency: 880, start: now + 0.09, duration: 0.11, gain: 0.05 });
    return;
  }

  if (type === SOUND_CUES.RETRY) {
    playTone(context, { frequency: 330, start: now, duration: 0.12, gain: 0.035 });
    return;
  }

  if (type === SOUND_CUES.INCOMPLETE_KEEP_GOING) {
    playTone(context, { frequency: 520, start: now, duration: 0.07, gain: 0.025 });
    return;
  }

  playTone(context, { frequency: 880, start: now, duration: 0.09, gain: 0.04 });
}
