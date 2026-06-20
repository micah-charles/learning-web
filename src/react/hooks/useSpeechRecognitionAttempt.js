import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  abortListening,
  getSpeechRecognitionStatus,
  isSpeechRecognitionSupported,
  startListening,
  stopListening,
} from "../services/speechRecognitionService.js";

function makeAttemptId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `ss-attempt-${crypto.randomUUID()}`;
  return `ss-attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useSpeechRecognitionAttempt() {
  const supported = useMemo(() => isSpeechRecognitionSupported(), []);
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [lastError, setLastError] = useState("");
  const [microphoneBlocked, setMicrophoneBlocked] = useState(false);
  const activeAttemptRef = useRef("");

  const resetAttempt = useCallback(() => {
    setInterimTranscript("");
    setFinalTranscript("");
    setLastError("");
    setMicrophoneBlocked(false);
  }, []);

  const abortAttempt = useCallback(() => {
    abortListening();
    activeAttemptRef.current = "";
    setListening(false);
  }, []);

  const stopAttempt = useCallback(() => {
    stopListening();
    setListening(false);
  }, []);

  const startAttempt = useCallback(({
    languageCode,
    interimResults = true,
    continuous = false,
    maxAlternatives = 5,
    timeoutMs,
    onInterim,
    onFinal,
    onError,
    onEnd,
  } = {}) => {
    if (!supported) {
      setLastError("not-supported");
      onError?.("not-supported", { attemptId: "" });
      return "";
    }
    const attemptId = makeAttemptId();
    activeAttemptRef.current = attemptId;
    setInterimTranscript("");
    setFinalTranscript("");
    setLastError("");
    setMicrophoneBlocked(false);
    setListening(true);
    startListening({
      attemptId,
      languageCode,
      interimResults,
      continuous,
      maxAlternatives,
      timeoutMs,
      onInterim: (payload) => {
        if (activeAttemptRef.current !== payload.attemptId) return;
        setInterimTranscript(payload.interimTranscript || payload.transcript || "");
        onInterim?.(payload);
      },
      onFinal: (payload) => {
        if (activeAttemptRef.current !== payload.attemptId) return;
        setListening(false);
        setInterimTranscript("");
        setFinalTranscript(payload.finalTranscript || payload.transcript || "");
        onFinal?.(payload);
      },
      onError: (error, meta) => {
        if (meta?.attemptId && activeAttemptRef.current !== meta.attemptId) return;
        setListening(false);
        setLastError(error);
        if (error === "not-allowed") setMicrophoneBlocked(true);
        onError?.(error, meta);
      },
      onEnd: (meta) => {
        if (meta?.attemptId && activeAttemptRef.current !== meta.attemptId) return;
        setListening(false);
        onEnd?.(meta);
      },
    });
    return attemptId;
  }, [supported]);

  useEffect(() => () => {
    abortListening();
  }, []);

  return {
    supported,
    listening,
    interimTranscript,
    finalTranscript,
    lastError,
    microphoneBlocked,
    status: getSpeechRecognitionStatus(),
    startAttempt,
    stopAttempt,
    abortAttempt,
    resetAttempt,
  };
}
