/**
 * humanizer.js — Client-side intent classifier for user messages.
 *
 * Reads the user's transcribed text BEFORE it reaches the AI and classifies
 * the conversational intent so the system prompt can include semantic signals.
 *
 * Returns { signal, hint } where:
 *   signal: 'CLOSURE' | 'AGREEMENT' | 'REPEAT_LOOP' | 'SUBSTANTIVE'
 *   hint:   A short instruction string to append to the system prompt for this turn only.
 */

// ── Keyword / phrase banks ──────────────────────────────────────────────────────

const CLOSURE_PHRASES = [
  'okay', 'ok', 'alright', 'all right', 'thanks', 'thank you',
  'got it', 'understood', 'i hear you', 'i understand',
  "let's wrap up", "let's leave it", "let's end", "i think we're done",
  "that's all", "good talk", "fair enough", 'noted', 'sure',
  "i'll think about it", "let me think", "we can revisit",
  "sounds good", "sounds fair", "take care", 'bye', 'goodbye',
  "i appreciate it", "thanks for listening", "let's move on",
];

const AGREEMENT_PHRASES = [
  'that makes sense', 'fair point', 'i agree', "you're right",
  'you have a point', 'valid point', 'good point', 'i see your point',
  'i can see that', 'i understand where', "i hadn't thought of",
  'i concede', 'i accept', "that's reasonable", 'absolutely',
  'definitely', 'totally', 'exactly', 'precisely',
];

/**
 * Normalize text for comparison: lowercase, trim, remove punctuation.
 */
function normalize(text) {
  return (text || '').toLowerCase().replace(/[^\w\s']/g, '').trim();
}

/**
 * Simple word overlap ratio between two strings (Jaccard-like).
 * Used to detect if the user is repeating themselves.
 */
function wordOverlap(a, b) {
  const wordsA = new Set(normalize(a).split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(normalize(b).split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Check if the normalized text contains any phrase from the bank.
 */
function matchesAny(normalizedText, phrases) {
  return phrases.some(phrase => normalizedText.includes(phrase));
}

/**
 * Check if a message is very short (brief response, not a full argument).
 */
function isBrief(text) {
  const words = normalize(text).split(/\s+/).filter(Boolean);
  return words.length <= 8;
}

/**
 * Classify the user's message intent.
 *
 * @param {string} currentMessage - The user's latest transcribed text.
 * @param {Array} history - The full conversation history [{role, content}, ...].
 * @param {number} turnCount - How many user turns have occurred (including this one).
 * @returns {{ signal: string, hint: string }}
 */
export function classifyIntent(currentMessage, history, turnCount) {
  const norm = normalize(currentMessage);

  // 1. CLOSURE — user is trying to wrap up
  if (matchesAny(norm, CLOSURE_PHRASES) && isBrief(currentMessage)) {
    return {
      signal: 'CLOSURE',
      hint: `[HUMANIZER SIGNAL: The user just said "${currentMessage.trim()}" which is a CLOSURE signal. They are trying to end the conversation. You MUST wrap up gracefully in this reply. Give a natural closing line and set "conversation_ended" to true. Do NOT ask another question or introduce a new topic.]`,
    };
  }

  // 2. AGREEMENT — user is conceding or agreeing
  if (matchesAny(norm, AGREEMENT_PHRASES)) {
    const isAlsoShort = isBrief(currentMessage);
    return {
      signal: 'AGREEMENT',
      hint: isAlsoShort
        ? `[HUMANIZER SIGNAL: The user agreed/conceded with "${currentMessage.trim()}". This is a natural resolution point. Acknowledge their agreement warmly and conclude the conversation. Set "conversation_ended" to true.]`
        : `[HUMANIZER SIGNAL: The user is showing agreement/concession. Acknowledge this constructively. If the core issue has been discussed (${turnCount}+ turns so far), this is a good moment to wrap up naturally.]`,
    };
  }

  // 3. REPEAT_LOOP — user is saying the same thing again
  const previousUserMessages = history
    .filter(m => m.role === 'user')
    .map(m => m.content);

  if (previousUserMessages.length >= 2) {
    const lastTwo = previousUserMessages.slice(-2);
    for (const prev of lastTwo) {
      if (wordOverlap(currentMessage, prev) > 0.55) {
        return {
          signal: 'REPEAT_LOOP',
          hint: `[HUMANIZER SIGNAL: The user is repeating themselves (loop detected). The conversation is going in circles. Do NOT repeat your own previous points either. Instead, acknowledge the impasse and suggest a constructive next step or conclude. If ${turnCount} turns have passed, set "conversation_ended" to true.]`,
        };
      }
    }
  }

  // 4. SUBSTANTIVE — normal conversational turn
  return {
    signal: 'SUBSTANTIVE',
    hint: '', // No injection needed
  };
}

/**
 * Pre-scripted natural closing lines for when the humanizer short-circuits
 * the conversation (CLOSURE signal at 4+ turns).
 */
const CLOSING_LINES = [
  "Alright, I think we've covered the key points here. Let's leave it at that for now.",
  "Okay, fair enough. I appreciate you bringing this up — let's revisit if we need to.",
  "Got it. I hear you. Let's both take some time to think about this.",
  "Alright, let's wrap up. I think we've both said what we needed to say.",
  "Okay, I think that's a good stopping point. Thanks for the conversation.",
];

/**
 * Pick a random closing line for the persona.
 */
export function getClosingLine() {
  return CLOSING_LINES[Math.floor(Math.random() * CLOSING_LINES.length)];
}
