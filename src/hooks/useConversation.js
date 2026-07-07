import { useState, useEffect, useRef, useCallback } from 'react';
import { robustGenerate } from '../utils/aiClient';
import { useTTS } from './useTTS';
import { classifyIntent, getClosingLine } from '../utils/humanizer';
import { saveTurn, getRecentTurns } from '../utils/supabaseSession';

/**
 * Maps persona gender → OpenAI TTS voice ID.
 * Male:   onyx (deep, authoritative) | echo (natural)
 * Female: nova (warm, professional)  | shimmer (expressive)
 */
function getVoiceForPersona(persona) {
  if (!persona) return 'onyx';
  const gender = (persona.gender || 'male').toLowerCase();
  if (gender === 'female') {
    // Slightly vary based on personality for character
    const warm = ['Receptive', 'Empathetic'];
    return warm.includes(persona.personality) ? 'shimmer' : 'nova';
  }
  const authoritative = ['Hostile', 'Defensive', 'Skeptical', 'Bureaucratic'];
  return authoritative.includes(persona.personality) ? 'onyx' : 'echo';
}

const HARD_TURN_CAP = 10;
const CLOSURE_SHORTCUT_MIN_TURNS = 4;

export function useConversation({ persona, userProfile, initialHistory, onMicTrigger, sessionId, userId }) {
  const [history, setHistory] = useState(initialHistory || []);
  const [isLoading, setIsLoading] = useState(false);
  const [errorObj, setErrorObj] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Session health tracking (starts at 100)
  const [healthScore, setHealthScore] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  // Turn counter (counts user messages, useState so it triggers re-renders)
  const [turnCount, setTurnCount] = useState(
    initialHistory ? initialHistory.filter(m => m.role === 'user').length : 0
  );
  const turnCountRef = useRef(turnCount); // Keep ref in sync for closure access

  // Keep sessionId and userId in refs so async closures always have the latest value
  const sessionIdRef = useRef(sessionId);
  const userIdRef = useRef(userId);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  // Prevent double-execution in React strict mode
  const initialized = useRef(false);

  // TTS hook
  const { speak, stopSpeaking, isSpeaking, isMuted, toggleMute } = useTTS();
  const personaVoice = getVoiceForPersona(persona);

  // ── System prompt builder ──────────────────────────────────────────────────
  const getSystemPrompt = (currentHistory) => {
    const { powerDynamic, stressLevel, counterpartDisposition, practicePhase } = userProfile || {};

    const richContext = userProfile?.relationshipContext
      ? `RELATIONSHIP DYNAMIC: The user is speaking with their ${userProfile.relationshipContext}.\nSPECIFIC FEAR: ${userProfile.communicationFear}`
      : '';

    // ELEVATED: actualSituation is now the PRIMARY context driver
    const actualContext = userProfile?.actualSituation
      ? `
THE USER'S EXACT SITUATION (ANCHOR ALL REPLIES TO THIS):
"${userProfile.actualSituation}"

CRITICAL RULE: Every reply you give MUST reference or relate to the specific details above.
Do NOT introduce unrelated topics, strategies, or arguments that the user never mentioned.
Stay in the world of THEIR described problem at all times.`
      : '';

    // DISPOSITION ENFORCEMENT — this overrides persona personality if they conflict
    const dispositionGuide = {
      'Receptive': `You are RECEPTIVE. This means:
- You are open to hearing the user's point of view
- You may have your own perspective but you do NOT escalate, bully, or become aggressive
- You push back gently when you disagree, but stay constructive
- You acknowledge valid points the user makes
- You do NOT spiral into hostility or personal attacks under any circumstances
- A realistic receptive person listens, considers, and responds thoughtfully`,
      'Neutral': `You are NEUTRAL. This means:
- You neither agree nor dismiss — you need to be convinced
- You ask clarifying questions and weigh both sides
- You do NOT escalate to hostility or become dismissive
- You maintain professional composure throughout`,
      'Defensive': `You are DEFENSIVE. This means:
- You protect your position and push back when challenged
- You may get tense but do NOT cross into bullying or personal attacks
- You are resistant to change but not unreasonable`,
      'Hostile': `You are HOSTILE. This means:
- You are adversarial and confrontational
- You challenge aggressively and dismiss easily
- You make the conversation difficult on purpose`,
    };

    const dispBlock = `
DISPOSITION ENFORCEMENT (THIS IS A HARD CONSTRAINT — NOT A SUGGESTION):
${dispositionGuide[counterpartDisposition] || dispositionGuide['Neutral']}

If your persona personality description conflicts with this disposition, the DISPOSITION WINS.
For example: if your personality says "confrontational" but the disposition is "Receptive", you MUST behave receptively.
`;

    const effectiveStress = (counterpartDisposition === 'Receptive' || counterpartDisposition === 'Neutral')
      ? Math.min(stressLevel || 50, 30)
      : (stressLevel || 50);

    const calibrationPrompt = `
SIMULATION CALIBRATION:
- Power Dynamic: ${powerDynamic || 'Equal'} (How much authority you have over the user)
- Stress Level: ${effectiveStress}/100 (Keep your intensity proportional to this number. 10 = very calm, 50 = moderate, 100 = high pressure)
- Disposition: ${counterpartDisposition || 'Neutral'} (See DISPOSITION ENFORCEMENT above — this is binding)

SOFT START: Begin the conversation at LOW intensity (30% of your maximum possible pressure). Build tension only gradually if the user consistently fails to make progress over multiple turns.
`;

    const phase = practicePhase || 1;
    const phaseContext = phase === 1
      ? `PHASE: 1 (Build Framework). Be challenging but give the user room to structure their thoughts.`
      : phase === 2
      ? `PHASE: 2 (Tone Focus). React authentically to their delivery and confidence.`
      : `PHASE: 3 (Full Simulation). React purely realistically. Minimal coaching.`;

    const guardrailsPrompt = `
GROUNDWORK GUARDRAILS:
1. NON-NEGOTIABLE: No legal/medical advice. No therapy. Stay in character.
2. SENSITIVE TOPICS: If the user mentions harassment, discrimination, or legal action, set "trigger_pause" to true and advise HR involvement.
3. HEALTH SYSTEM: Deduct health_delta if:
   - User is hostile/profane (-20)
   - You (AI) become overly aggressive (-25)
   - User is looping/repeating arguments (-15)
   - User expresses extreme panic/shaking (-40)
4. Keep replies concise — this is a VOICE conversation. 1-3 sentences max for "reply".
5. ANTI-SPIRAL: Do NOT keep escalating intensity turn after turn. Real conversations ebb and flow. If tension rises, it should also come back down naturally.
`;

    const conclusionPrompt = `
CONVERSATION PACING & NATURAL CONCLUSION:
- This conversation should reach a natural conclusion within 6-8 exchanges.
- Track the conversation arc: opening tension → discussion → either resolution or respectful impasse.
- After 6+ turns, if both sides have made their core points, begin wrapping up naturally.
- Set "conversation_ended" to true when:
  a) Both parties have stated their positions and reached a resolution or agreement, OR
  b) Both parties have stated their positions and reached a respectful impasse (agree to disagree), OR
  c) The conversation has naturally run its course (8+ turns of substantive exchange)
- When concluding, give a realistic closing line — not an abrupt cut-off. Example: "Alright, I hear you. Let me think about this and we can revisit next week."
- Do NOT artificially prolong the conversation by introducing new grievances or topics.
`;

    const userTurns = currentHistory.filter(m => m.role === 'user');
    const memoryPrompt = userTurns.length > 0
      ? `\nSESSION MEMORY (DO NOT REPEAT YOURSELF):
The user has already discussed the following in this session:
${userTurns.map((m, i) => `Turn ${i + 1}: "${m.content}"`).join('\n')}

CRITICAL: You MUST advance the conversation based on the history above. Do NOT ask a question you have already asked. Do NOT repeat the exact same objection.`
      : '';

    return `You are ${persona?.name}, ${persona?.role}.
PERSONALITY: ${persona?.personality}. ${persona?.personalityDescription}
YOUR BACKSTORY: ${persona?.backstory}
${actualContext}
THE USER: ${userProfile?.whoAreYou}. GOAL: ${userProfile?.practiceGoal}
${richContext}
${dispBlock}${calibrationPrompt}${phaseContext}${guardrailsPrompt}${conclusionPrompt}${memoryPrompt}

YOU MUST REPLY WITH A JSON OBJECT ONLY:
{
  "reply": "Persona dialogue (1-3 sentences, conversational and natural for speech. MUST relate to the user's specific situation. Tone MUST match ${counterpartDisposition || 'Neutral'} disposition.)",
  "coaching_aside": "Professional coach observation about this exchange",
  "health_delta": number (points to subtract from 100, usually 0 or negative),
  "trigger_pause": boolean (true if health < 50 or sensitive topic detected),
  "conversation_ended": boolean (true when conversation reaches natural conclusion per PACING rules above)
}`;
  };

  // ── Speak helper: auto-triggers mic via onMicTrigger callback ────────────
  const speakPersonaReply = useCallback((text) => {
    speak(text, personaVoice, () => {
      // onEnd: fire the mic trigger so user can respond
      onMicTrigger?.();
    });
  }, [speak, personaVoice, onMicTrigger]);

  // ── Initial persona opening ────────────────────────────────────────────────
  useEffect(() => {
    if (!persona || initialized.current) return;
    initialized.current = true;

    const startSim = async () => {
      if (initialHistory && initialHistory.length > 0) {
        // Resume: speak last model message to re-engage
        const lastModel = [...(initialHistory || [])].reverse().find(m => m.role === 'model');
        if (lastModel) speakPersonaReply(lastModel.content);
        return;
      }
      setIsLoading(true);
      try {
        const data = await robustGenerate({
          systemInstruction: getSystemPrompt([]),
          contents: [{ role: 'user', parts: [{ text: 'Start the conversation with your opening line: ' + persona?.openingLine }] }],
          thermal: 0.85,
        });
        setHistory([{ role: 'model', content: data.reply, coaching_aside: data.coaching_aside }]);
        speakPersonaReply(data.reply);
      } catch (err) {
        setErrorObj(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    startSim();
  }, [persona, userProfile]);

  // ── Send user message ──────────────────────────────────────────────────────
  const sendUserMessage = async (text) => {
    stopSpeaking(); // Stop persona if they're still talking
    setIsLoading(true);
    const currentTurn = turnCountRef.current + 1;
    turnCountRef.current = currentTurn;
    setTurnCount(currentTurn); // trigger re-render
    const newHistory = [...history, { role: 'user', content: text }];
    setHistory(newHistory);

    // Save user turn to Supabase (use refs for latest values in async closure)
    console.log('[GUARD] saveTurn user check:', { sessionId: sessionIdRef.current, userId: userIdRef.current, currentTurn });
    if (sessionIdRef.current && userIdRef.current) {
      try {
        await saveTurn(sessionIdRef.current, userIdRef.current, currentTurn * 2 - 1, 'user', text, null);
      } catch (e) {
        console.warn('saveTurn user catch:', e.message || e);
      }
    } else {
      console.warn('[GUARD] SKIPPED saveTurn user — sessionId or userId is null');
    }

    // ── Humanizer: classify user intent ────────────────────────────────────
    const { signal, hint } = classifyIntent(text, history, currentTurn);

    // ── Closure shortcut: skip AI call if user is clearly done ─────────────
    if (signal === 'CLOSURE' && currentTurn >= CLOSURE_SHORTCUT_MIN_TURNS) {
      const closingLine = getClosingLine();
      const modelMsg = {
        role: 'model',
        content: closingLine,
        coaching_aside: 'The user signalled they were done. Simulation concluded gracefully.',
      };
      setHistory(prev => [...prev, modelMsg]);
      speakPersonaReply(closingLine);
      // Small delay to let the closing line be spoken before completing
      setTimeout(() => setIsCompleted(true), 500);
      setIsLoading(false);
      return;
    }

    try {
      // ── Fetch Supabase context ──────────────────────────────────────────
      let supabaseContext = '';
      if (sessionIdRef.current) {
        try {
          const recentTurns = await getRecentTurns(sessionIdRef.current, 10);
          if (recentTurns.length > 0) {
            supabaseContext = '\nSESSION MEMORY (from database — authoritative):\n' +
              recentTurns.map(t => `Turn ${t.turn_index}: ${t.role === 'user' ? 'You' : persona?.name}: "${t.content}"`).join('\n') +
              '\nCRITICAL: Do NOT repeat any point already made above. Advance the conversation.';
          }
        } catch (e) { console.warn('Supabase context fetch failed:', e); }
      }

      // Send only the last 4 messages to the LLM to conserve tokens.
      // Full history is available via SESSION MEMORY (Supabase) and memoryPrompt in the system prompt.
      const recentMessages = newHistory.slice(-4);
      const contents = recentMessages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.role === 'model' ? JSON.stringify({ reply: msg.content, coaching_aside: msg.coaching_aside }) : msg.content }],
      }));

      // Build system prompt with humanizer hint appended
      const systemPrompt = getSystemPrompt(newHistory)
        + (hint ? `\n\n${hint}` : '')
        + supabaseContext
        + (currentTurn >= 6 ? `\n\n[TURN COUNT: ${currentTurn}. The conversation has been going for ${currentTurn} turns. Begin wrapping up naturally if core points have been exchanged.]` : '');

      const data = await robustGenerate({
        systemInstruction: systemPrompt,
        contents,
        thermal: 0.85,
      });

      // ── Hard cap enforcement ───────────────────────────────────────────
      if (currentTurn >= HARD_TURN_CAP && !data.conversation_ended) {
        data.conversation_ended = true;
        // Humanize the closing — don't let it feel abrupt
        if (data.reply && !data.reply.toLowerCase().includes('wrap') && !data.reply.toLowerCase().includes('leave it')) {
          data.reply += " Alright, I think we've both said what we needed to. Let's leave it here for now.";
        }
      }

      // ── Agreement signal at 5+ turns → force end ─────────────────────
      if (signal === 'AGREEMENT' && currentTurn >= 5 && !data.conversation_ended) {
        data.conversation_ended = true;
      }

      const newHealth = Math.max(0, healthScore + (data.health_delta || 0));
      setHealthScore(newHealth);

      if (data.trigger_pause || newHealth < 50) {
        setIsPaused(true);
      }

      const modelMsg = { role: 'model', content: data.reply, coaching_aside: data.coaching_aside };
      setHistory(prev => [...prev, modelMsg]);

      // Save model turn to Supabase
      console.log('[GUARD] saveTurn model check:', { sessionId: sessionIdRef.current, userId: userIdRef.current, currentTurn });
      if (sessionIdRef.current && userIdRef.current) {
        try {
          await saveTurn(sessionIdRef.current, userIdRef.current, currentTurn * 2, 'model', data.reply, data.coaching_aside);
        } catch (e) {
          console.warn('saveTurn model catch:', e.message || e);
        }
      } else {
        console.warn('[GUARD] SKIPPED saveTurn model — sessionId or userId is null');
      }

      if (data.conversation_ended) {
        setIsCompleted(true);
      } else if (!data.trigger_pause && newHealth >= 50) {
        // Only speak if not paused
        speakPersonaReply(data.reply);
      }
    } catch (err) {
      setErrorObj(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    history,
    isLoading,
    errorObj,
    setErrorObj,
    sendUserMessage,
    healthScore,
    isPaused,
    setIsPaused,
    isCompleted,
    isSpeaking,
    isMuted,
    toggleMute,
    stopSpeaking,
    personaVoice,
    turnCount,
  };
}
