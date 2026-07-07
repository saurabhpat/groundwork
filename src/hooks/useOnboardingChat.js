import { useState } from 'react';
import { robustGenerate } from '../utils/aiClient';
import { checkDistress } from '../utils/guardrails';

// ─── Reduced to 3 steps as per V2 design ─────────────────────────────────────
export const ONBOARDING_STEPS = [
  {
    id: 'conversation_type',
    message: "What kind of conversation are you here to practice?",
    hint: "Pick the one that feels most urgent right now.",
    isMulti: false,
    isVoice: false,
    suggestions: [
      "Asking for a raise or promotion",
      "Giving feedback to someone on my team",
      "Pushing back on my manager",
      "Resolving a conflict with a colleague",
      "Setting a boundary at work",
      "Negotiating with a client or investor",
    ],
    placeholder: "Something else — describe it…",
  },
  {
    id: 'counterparty',
    message: "Who will you be speaking to?",
    hint: "This shapes the persona we build for you.",
    isMulti: false,
    isVoice: false,
    suggestions: [
      "My direct manager",
      "A senior leader or executive",
      "A peer / colleague at my level",
      "Someone I manage or mentor",
      "A client or external stakeholder",
      "An investor or board member",
    ],
    placeholder: "Someone else — describe who…",
  },
  {
    id: 'context_dump',
    message: "Tell us about the situation.",
    hint: "Speak freely or type — the more context you share, the sharper your practice session will be. What happened, what you fear, what outcome you want.",
    isMulti: false,
    isVoice: true, // ← enables mic button on this step
    suggestions: [],
    placeholder: "Describe your situation in your own words — or tap the mic to speak…",
  },
];

// ─── Synthesis prompt ─────────────────────────────────────────────────────────
const SYNTHESIS_SYSTEM_PROMPT = `You are a scenario analyst for Groundwork, a professional conversation-coaching platform.
A user has completed a short onboarding. Based on their 3 answers, synthesise their coaching profile.

RULES — STRICT:
- Do NOT invent any detail not supported by the user's answers.
- "actualSituation" must preserve the user's raw context from step 3 in full.
- Map their situation to EXACTLY ONE of these 8 archetypes:
  Salary Negotiation | Asking for a Promotion | Giving Difficult Feedback | Conflict with a Peer | Disagreeing with a Manager | Delivering Bad News | Client Negotiation | Setting a Boundary
- "experienceLevel" must be exactly one of: "never" | "tried_failed" | "regular_but_costly"
- "relationshipContext" should reflect the counterparty they chose in step 2.
- "summary_message" must be 2–3 warm, empathetic sentences that reflect their specific situation back to them.
- Return ONLY valid JSON — no markdown, no extra text.

OUTPUT SCHEMA:
{
  "summary_message": "string",
  "whoAreYou": "string (inferred from context — their role/title if mentioned, otherwise 'Professional')",
  "practiceGoal": "string",
  "scenario": "exactly one of the 8 archetypes",
  "relationshipContext": "string",
  "communicationFear": "string (their biggest fear about this conversation)",
  "actualSituation": "string (the user's full context from step 3)",
  "experienceLevel": "never | tried_failed | regular_but_costly"
}
`;

export function useOnboardingChat() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState(new Set());
  const [customText, setCustomText] = useState('');
  const [phase, setPhase] = useState('onboarding'); // 'onboarding' | 'synthesizing' | 'complete'
  const [finalProfile, setFinalProfile] = useState(null);
  const [error, setError] = useState(null);
  const [isDistress, setIsDistress] = useState(false);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  // Toggle a chip option (single select only for all V2 steps)
  const toggleOption = (option) => {
    setError(null);
    setSelectedOptions(prev => {
      const next = new Set(prev);
      if (next.has(option)) { next.delete(option); } else { next.clear(); next.add(option); }
      return next;
    });
  };

  // Compute answer from chips + freeform text
  const getCurrentAnswer = () => {
    const custom = customText.trim();
    const selected = [...selectedOptions];
    if (step.isVoice) {
      // Context dump step: only text/voice, no chips
      return custom || null;
    }
    if (custom) return custom;
    if (selected.length > 0) return selected[0];
    return null;
  };

  const canSubmit = getCurrentAnswer() !== null;

  const submitCurrentStep = async () => {
    const answer = getCurrentAnswer();
    if (!answer) return;

    if (customText.trim() && checkDistress(customText.trim())) setIsDistress(true);

    const answerDisplay = Array.isArray(answer) ? answer.join(' · ') : answer;
    const answerArray = Array.isArray(answer) ? answer : [answer];

    const newCompleted = [
      ...completedSteps,
      { stepId: step.id, question: step.message, answer: answerDisplay, answerArray },
    ];
    setCompletedSteps(newCompleted);

    if (isLastStep) {
      setPhase('synthesizing');
      const answersBlock = newCompleted
        .map((s, i) => `Step ${i + 1} — ${s.question}\nAnswer: "${s.answer}"`)
        .join('\n\n');
      try {
        const data = await robustGenerate({
          systemInstruction: SYNTHESIS_SYSTEM_PROMPT,
          contents: [{ role: 'user', parts: [{ text: answersBlock }] }],
          thermal: 0.3,
        });
        setFinalProfile(data);
        setPhase('complete');
      } catch (err) {
        setError(`Couldn't build your profile: ${err.message}`);
        setPhase('onboarding');
      }
    } else {
      setCurrentStep(prev => prev + 1);
      setSelectedOptions(new Set());
      setCustomText('');
    }
  };

  const goToStep = (idx) => {
    if (idx < 0 || idx >= ONBOARDING_STEPS.length) return;
    const priorEntry = completedSteps[idx];
    setCompletedSteps(prev => prev.slice(0, idx));
    setCurrentStep(idx);
    setPhase('onboarding');
    setFinalProfile(null);
    setError(null);
    if (priorEntry?.answerArray) {
      const stepDef = ONBOARDING_STEPS[idx];
      const arr = priorEntry.answerArray;
      const matchedSuggestions = arr.filter(a => stepDef.suggestions.includes(a));
      const customParts = arr.filter(a => !stepDef.suggestions.includes(a));
      setSelectedOptions(new Set(matchedSuggestions));
      setCustomText(customParts.length > 0 ? customParts.join(', ') : '');
    } else {
      setSelectedOptions(new Set());
      setCustomText('');
    }
  };

  return {
    currentStep,
    completedSteps,
    selectedOptions,
    customText,
    setCustomText: (val) => {
      if (typeof val === 'function') {
        setCustomText(prev => val(prev).slice(0, 600));
      } else {
        setCustomText(val.slice(0, 600));
      }
    }, // Larger limit for context dump
    phase,
    finalProfile,
    error,
    setError,
    isDistress,
    dismissDistress: () => setIsDistress(false),
    step,
    isLastStep,
    toggleOption,
    submitCurrentStep,
    canSubmit,
    goToStep,
  };
}
