import { maxCodeLengthForMethod, normaliseCode } from "./code-normalisation.js";

function firstDifference(actual, expected) {
  const length = Math.max(actual.length, expected.length);
  for (let index = 0; index < length; index += 1) {
    if (actual[index] !== expected[index]) return index;
  }
  return -1;
}

function classifyError(input, expectedCodes, method) {
  if (!input) return "missing-key";
  if (input.length > maxCodeLengthForMethod(method)) return "extra-key";
  if (expectedCodes.some((code) => code.startsWith(input))) return "missing-key";
  if (expectedCodes.some((code) => input.startsWith(code))) return "extra-key";
  if (expectedCodes.some((code) => code.length === input.length && Array.from(code).sort().join("") === Array.from(input).sort().join(""))) {
    return "wrong-order";
  }
  return "wrong-key";
}

export function evaluateAnswer({
  input,
  expectedCodes,
  method = "cangjie",
  questionMethod = method,
  startedAt = 0,
  answeredAt = Date.now(),
}) {
  const normalisedInput = normaliseCode(input);
  const codes = [...new Set((expectedCodes || []).map(normaliseCode).filter(Boolean))];
  const matchedCode = codes.find((code) => code === normalisedInput) || "";
  const wrongMethod = questionMethod !== method;
  const preferredComparison = codes.reduce((best, code) => {
    const difference = firstDifference(normalisedInput, code);
    if (!best || difference > best.difference) return { code, difference };
    return best;
  }, null);
  return {
    correct: Boolean(matchedCode) && !wrongMethod,
    normalisedInput,
    matchedCode,
    expectedCodes: codes,
    errorType: wrongMethod ? "wrong-method" : matchedCode ? null : classifyError(normalisedInput, codes, method),
    firstWrongPosition: matchedCode ? -1 : Math.max(0, preferredComparison?.difference ?? 0),
    typedKeys: Array.from(normalisedInput),
    durationMs: startedAt ? Math.max(0, answeredAt - startedAt) : 0,
  };
}
