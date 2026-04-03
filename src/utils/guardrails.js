const DISTRESS_SIGNALS = [
  "want to give up", "feel sick", "too anxious", "can't do this",
  "i give up", "this is too much", "i'm panicking", "i need to stop"
];

export function checkDistress(text) {
  return DISTRESS_SIGNALS.some(s => text.toLowerCase().includes(s));
}

/**
 * Returns true if the text is long enough to be a real response.
 * Blocks single characters / accidental taps, not long paragraphs.
 */
export function checkLength(text) {
  return text.trim().length >= 3;  // at least 3 characters = a real word
}

export function isLimitReached(n) {
  return n >= 15;
}
