import { useState } from 'react';
import { robustGenerate } from '../utils/aiClient';
import { checkDistress } from '../utils/guardrails';

// ─── The 5 hardcoded onboarding steps ────────────────────────────────────────
export const ONBOARDING_STEPS = [
  {
    id: 'conversation_type',
    message: "What kind of conversation are you here to practice?",
    hint: "Pick the one that feels most familiar or urgent right now.",
    isMulti: false,
    suggestions: [
      "Asking for a raise or promotion",
      "Giving feedback to someone on my team",
      "Pushing back on my manager",
      "Resolving a conflict with a colleague",
      "Setting a boundary at work",
      "Negotiating with a client or stakeholder",
    ],
    placeholder: "Something else — describe it…",
  },
  {
    id: 'goal',
    message: "What does a good outcome look like for you?",
    hint: "What would make you feel like this conversation actually went well?",
    isMulti: false,
    suggestions: [
      "They agree to what I'm asking for",
      "I'm heard without it turning into a fight",
      "I walk away with a clear answer — yes or no",
      "The relationship stays intact after",
      "I finally say what I've been holding back",
    ],
    placeholder: "My own definition of winning this…",
  },
  {
    id: 'blockers',
    message: "What's gotten in the way before?",
    hint: "Select everything that rings true — you can pick more than one.",
    isMulti: true,
    suggestions: [
      "I freeze when they push back",
      "I don't know how to start the conversation",
      "I back down too quickly under pressure",
      "I say too much and lose my main point",
      "I keep avoiding it until it becomes urgent",
      "I'm afraid of damaging the relationship",
    ],
    placeholder: "Something else that holds me back…",
  },
  {
    id: 'confidence',
    message: "How are you feeling about this conversation right now?",
    hint: "Be honest — there's no wrong answer here.",
    isMulti: false,
    suggestions: [
      "Anxious — I've been putting it off",
      "Nervous, but I know I need to do this",
      "Somewhat ready, I just need a clear structure",
      "I've tried before and it didn't go well",
    ],
    placeholder: "It's more complicated than that…",
  },
  {
    id: 'outcome',
    message: "What would make this practice session feel worth it?",
    hint: null,
    isMulti: false,
    suggestions: [
      "A confident, clear way to open the conversation",
      "Knowing I can hold my ground when pushed back on",
      "Feeling less scared about how they'll react",
      "Exact phrases I can actually use in the moment",
      "More clarity on what I actually want from this",
    ],
    placeholder: "Something specific I'm hoping for…",
  },
];

// ─── Synthesis prompt — runs once after all 5 answers ────────────────────────
const SYNTHESIS_SYSTEM_PROMPT = `You are a scenario analyst for Groundwork, a professional conversation-coaching platform.
A user has just completed a 5-step onboarding. Based on their answers, synthesise their coaching profile.

RULES — STRICT:
- Do NOT invent any detail not supported by the user's answers.
- Do NOT add demographic assumptions or industry details they did not mention.
- Map their situation to EXACTLY ONE of these 8 archetypes:
  Salary Negotiation | Asking for a Promotion | Giving Difficult Feedback | Conflict with a Peer | Disagreeing with a Manager | Delivering Bad News | Client Negotiation | Setting a Boundary
- "experienceLevel" must be exactly one of: "never" | "tried_failed" | "regular_but_costly"
- "summary_message" must be 2–3 warm, empathetic sentences that reflect their specific answers back to them.
- Return ONLY valid JSON — no markdown, no extra text.

OUTPUT SCHEMA:
{
  "summary_message": "string",
  "whoAreYou": "string",
  "practiceGoal": "string",
  "scenario": "exactly one of the 8 archetypes",
  "relationshipContext": "string",
  "communicationFear": "string",
  "experienceLevel": "never | tried_failed | regular_but_costly"
}`;

export function useOnboardingChat() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]); // {stepId, question, answer, answerArray}
  const [selectedOptions, setSelectedOptions] = useState(new Set());
  const [customText, setCustomText] = useState('');
  const [phase, setPhase] = useState('onboarding'); // 'onboarding' | 'synthesizing' | 'complete'
  const [finalProfile, setFinalProfile] = useState(null);
  const [error, setError] = useState(null);
  const [isDistress, setIsDistress] = useState(false);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  // Toggle a chip (single vs multi-select)
  const toggleOption = (option) => {
    setError(null);
    if (step.isMulti) {
      setSelectedOptions(prev => {
        const next = new Set(prev);
        next.has(option) ? next.delete(option) : next.add(option);
        return next;
      });
    } else {
      setSelectedOptions(prev => {
        const next = new Set(prev);
        if (next.has(option)) { next.delete(option); } else { next.clear(); next.add(option); }
        return next;
      });
    }
  };

  // Compute current answer from chips + custom text
  const getCurrentAnswer = () => {
    const custom = customText.trim();
    const selected = [...selectedOptions];
    if (step.isMulti) {
      const all = [...selected, ...(custom ? [custom] : [])];
      return all.length > 0 ? all : null;
    } else {
      if (custom) return custom;
      if (selected.length > 0) return selected[0];
      return null;
    }
  };

  const canSubmit = getCurrentAnswer() !== null;

  // Submit the current step — advances or triggers synthesis on last step
  const submitCurrentStep = async () => {
    const answer = getCurrentAnswer();
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return;

    if (customText.trim() && checkDistress(customText.trim())) setIsDistress(true);

    const answerArray = Array.isArray(answer) ? answer : [answer];
    const answerDisplay = answerArray.join(' · ');

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

  /**
   * Go back to a specific step and restore the previously-given answer.
   * Clears all steps from `idx` onwards.
   */
  const goToStep = (idx) => {
    if (idx < 0 || idx >= ONBOARDING_STEPS.length) return;

    const priorEntry = completedSteps[idx]; // Answer previously given at this step

    setCompletedSteps(prev => prev.slice(0, idx));
    setCurrentStep(idx);
    setPhase('onboarding');
    setFinalProfile(null);
    setError(null);

    if (priorEntry && priorEntry.answerArray) {
      const stepDef = ONBOARDING_STEPS[idx];
      const arr = priorEntry.answerArray;
      // Split into suggestion-matched items vs custom text
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
    setCustomText,
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
    goToStep, // ← back-navigation
  };
}
