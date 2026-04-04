const DISTRESS_SIGNALS = [
  "want to give up", "feel sick", "too anxious", "can't do this",
  "i give up", "this is too much", "i'm panicking", "i need to stop"
];

const SENSITIVE_TOPICS = [
  "harassment", "discrimination", "whistleblowing", "sue", "lawsuit",
  "legal action", "attorney", "lawyer", "severance", "nda", "contractual",
  "labor law"
];

const PROFANITY = [
  "fuck", "shit", "asshole", "bitch", "cunt", "faggot"
];

export function checkDistress(text) {
  return DISTRESS_SIGNALS.some(s => text.toLowerCase().includes(s));
}

export function checkSensitiveTopics(text) {
  return SENSITIVE_TOPICS.some(s => text.toLowerCase().includes(s));
}

export function checkProfanity(text) {
  return PROFANITY.some(s => text.toLowerCase().includes(s));
}

/**
 * Returns true if the text is long enough to be a real response.
 */
export function checkLength(text) {
  return text.trim().length >= 3;
}

export function isLimitReached(n) {
  return n >= 25; // Bumped limit for complex practice
}
