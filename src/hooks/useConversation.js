import { useState, useEffect, useRef } from 'react';
import { robustGenerate } from '../utils/aiClient';

export function useConversation({ persona, userProfile, initialHistory }) {
  const [history, setHistory] = useState(initialHistory || []);
  const [isLoading, setIsLoading] = useState(false);
  const [errorObj, setErrorObj] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // NLP-Tech: Session Health tracking (starts at 100)
  const [healthScore, setHealthScore] = useState(100);
  const [coachingAside, setCoachingAside] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  // Use a ref to prevent double-execution in React strict mode
  const initialized = useRef(false);

  // Calibration context from user profile
  const { powerDynamic, stressLevel, counterpartDisposition, practicePhase } = userProfile || {};

  const getSystemPrompt = () => {
    const richContext = userProfile?.relationshipContext ? `RELATIONSHIP DYNAMIC: The user is speaking with their ${userProfile.relationshipContext}.\nSPECIFIC FEAR: ${userProfile.communicationFear}` : '';

    const calibrationPrompt = `
SIMULATION CALIBRATION:
- Power Dynamic: ${powerDynamic || 'Equal'} (How much authority you have over the user)
- Stress Level: ${stressLevel || 50}/100 (Influences your aggression and impatience)
- Your Disposition: ${counterpartDisposition || 'Neutral'} (Receptive, Neutral, Defensive, or Hostile)
`;

    const phase = practicePhase || 1;
    const phaseContext = phase === 1
      ? `PHASE: 1 (Build Framework). Always give constructive guidance in your coaching aside. Help the user structure their thoughts.`
      : phase === 2
      ? `PHASE: 2 (Tone Focus). Focus coaching on their delivery and confidence. React authentically to their tone.`
      : `PHASE: 3 (Full Simulation). Minimal coaching. React pure realistically. Only intervene if there's a serious safety/health issue.`;

    const guardrailsPrompt = `
GROUNDWORK GUARDRAILS:
1. NON-NEGOTIABLE: No legal/medical advice. No therapy. Stay in character.
2. SENSITIVE TOPICS: If the user mentions harassment, discrimination, or legal action, set "trigger_pause" to true and return a message advising HR involvement.
3. HEALTH SYSTEM: Deduct health_delta if:
   - User is hostile/profane (-20)
   - You (AI) become overly aggressive (-25)
   - User is looping/repeating arguments (-15)
   - User expresses extreme panic/shaking (-40)
`;

    return `You are ${persona?.name}, ${persona?.role}.
PERSONALITY: ${persona?.personality}. ${persona?.personalityDescription}
YOUR BACKSTORY: ${persona?.backstory}
THE USER: ${userProfile?.whoAreYou}. GOAL: ${userProfile?.practiceGoal}
${calibrationPrompt}${richContext}${phaseContext}${guardrailsPrompt}

YOU MUST REPLY WITH A JSON OBJECT ONLY:
{
  "reply": "Persona dialogue (1-3 sentences)",
  "coaching_aside": "Professional coach feedback and next-step guidance",
  "health_delta": number (points to subtract from 100, usually 0 or negative),
  "trigger_pause": boolean (true if health < 50 or sensitive topic detected),
  "conversation_ended": boolean
}`;
  };

  useEffect(() => {
    if (!persona || initialized.current) return;
    initialized.current = true;

    const startSim = async () => {
      if (initialHistory && initialHistory.length > 0) return;
      setIsLoading(true);
      try {
        const data = await robustGenerate({
          systemInstruction: getSystemPrompt(),
          contents: [{ role: "user", parts: [{ text: "Start the conversation by giving me your exact opening line: " + persona?.openingLine }] }],
          thermal: 0.85
        });
        
        setHistory([{ role: "model", content: data.reply, coaching_aside: data.coaching_aside }]);
        setCoachingAside(data.coaching_aside);
      } catch (err) {
        setErrorObj(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    startSim();
  }, [persona, userProfile, initialHistory]);

  const sendUserMessage = async (text) => {
    setIsLoading(true);
    const newHistory = [...history, { role: "user", content: text }];
    setHistory(newHistory);

    try {
      const contents = newHistory.map(msg => ({
        role: msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.role === "model" ? JSON.stringify({reply: msg.content, coaching_aside: msg.coaching_aside}) : msg.content }]
      }));

      const data = await robustGenerate({
        systemInstruction: getSystemPrompt(),
        contents,
        thermal: 0.85
      });
      
      const newHealth = Math.max(0, healthScore + (data.health_delta || 0));
      setHealthScore(newHealth);
      setCoachingAside(data.coaching_aside);

      if (data.trigger_pause || newHealth < 50) {
        setIsPaused(true);
      }

      setHistory(prev => [...prev, { role: "model", content: data.reply, coaching_aside: data.coaching_aside }]);
      if (data.conversation_ended) setIsCompleted(true);
      
    } catch (err) {
      setErrorObj(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { history, isLoading, errorObj, setErrorObj, sendUserMessage, healthScore, coachingAside, isPaused, setIsPaused, isCompleted };
}
