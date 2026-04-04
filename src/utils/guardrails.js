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

// Helper to check for whole-word matches only (to avoid "nda" triggering in "standardizing")
function hasWholeWordMatch(text, keywords) {
  const pattern = keywords.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`\\b(${pattern})\\b`, 'i');
  return regex.test(text);
}

export function checkDistress(text) {
  // Phrases are safer with includes, but we'll use word boundaries for the starts/ends
  return hasWholeWordMatch(text, DISTRESS_SIGNALS);
}

export function checkSensitiveTopics(text) {
  return hasWholeWordMatch(text, SENSITIVE_TOPICS);
}

export function checkProfanity(text) {
  return hasWholeWordMatch(text, PROFANITY);
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
