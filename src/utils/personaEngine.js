import { robustGenerate } from './aiClient';

/**
 * Persona generator — accepts both legacy profiles and the new rich onboarding profile.
 * The richer the profile, the more precisely calibrated the counterpart persona.
 */
export async function generatePersona(apiKey, userProfile) {
  // Build a rich context block when the new onboarding fields are present
  const richContext = userProfile.relationshipContext
    ? `
RELATIONSHIP: The user needs to speak with their ${userProfile.relationshipContext}.
COMMUNICATION FEAR: ${userProfile.communicationFear}
EXPERIENCE LEVEL: ${userProfile.experienceLevel === 'never' ? 'This is their first time attempting this conversation.' : userProfile.experienceLevel === 'tried_failed' ? 'They have tried this before and it went badly.' : 'They do this regularly but it consistently costs them emotionally or professionally.'}
PRE-SELECTED SCENARIO: ${userProfile.scenario || 'auto-detect from goal'}
`
    : '';

  const situationBlock = userProfile.actualSituation
    ? `
THE USER'S EXACT SITUATION (THIS IS THE MOST IMPORTANT INPUT):
"${userProfile.actualSituation}"

You MUST build the entire persona around this specific situation. The opening line MUST directly reference the concrete details described above — specific actions, behaviors, or events the user mentioned. Do NOT use generic conflict dialogue.`
    : '';

  // Calibration parameters from CoachingBrief (if available)
  const dispositionMap = {
    'Receptive': { allowed: ['Receptive', 'Empathetic'], toneGuide: 'The persona is open to hearing the user out, even if they have their own perspective. They do NOT escalate, bully, or dismiss. They may push back gently but stay constructive.' },
    'Neutral': { allowed: ['Skeptical', 'Distracted', 'Receptive'], toneGuide: 'The persona is neither aggressive nor accommodating. They listen but need convincing. They do NOT escalate to hostility.' },
    'Defensive': { allowed: ['Defensive', 'Skeptical', 'Bureaucratic'], toneGuide: 'The persona protects their position and pushes back, but does NOT cross into bullying or personal attacks.' },
    'Hostile': { allowed: ['Hostile', 'Dismissive', 'Defensive'], toneGuide: 'The persona is adversarial and confrontational. They challenge aggressively.' },
  };

  const userDisposition = userProfile.counterpartDisposition || 'Neutral';
  const dispConfig = dispositionMap[userDisposition] || dispositionMap['Neutral'];
  const userStress = userProfile.stressLevel || 50;

  const calibrationBlock = `
CALIBRATION SETTINGS (THE USER CHOSE THESE — YOU MUST RESPECT THEM):
- Counterpart Disposition: ${userDisposition}
- Allowed Personality Types: ${dispConfig.allowed.join(' or ')} (pick ONE from this list ONLY)
- Stress Level: ${userStress}/100
- Tone Guide: ${dispConfig.toneGuide}

CRITICAL: The "personality" field MUST be one of [${dispConfig.allowed.join(', ')}].
The opening line tone MUST match the disposition. If the user chose "Receptive", the opening should be firm but not aggressive. If "Hostile", it can be confrontational.`;

  const promptText = `Act as an expert career coach and simulation designer.
The user is: "${userProfile.whoAreYou || userProfile.role}"
Their primary challenge: "${userProfile.practiceGoal || userProfile.goal}"
${richContext}
${situationBlock}
${calibrationBlock}

Your task:
1. Use the PRE-SELECTED SCENARIO if provided. Otherwise, select the closest match from these 8 archetypes:
   Salary Negotiation | Asking for a Promotion | Giving Difficult Feedback | Conflict with a Peer | Disagreeing with a Manager | Delivering Bad News | Client Negotiation | Setting a Boundary

2. Generate a vivid, realistic professional counterpart persona. The persona's personality MUST match the CALIBRATION SETTINGS above — specifically, the "personality" field must be one of the allowed types.

3. CRITICAL — OPENING LINE RULES:
   - The opening line MUST be grounded in the user's EXACT situation described above.
   - Reference the specific behaviors, events, or dynamics the user described.
   - The tone of the opening MUST match the chosen disposition (${userDisposition}).
   - Example: If disposition is "Receptive" and the user said "my colleague never communicates their schedule", the persona might say: "Hey, I heard you wanted to talk about how we coordinate. I'm open to figuring something out — what's on your mind?"
   - If disposition is "Hostile", the same situation might produce: "Look, I don't need to check in with you every time I step away. I've got my own priorities."
   - NEVER use generic lines unrelated to the user's situation.
   - No pleasantries — drop into the moment using the user's real context.

Return exactly this JSON structure (raw JSON, NO markdown):
{
  "scenarioSelected": "<one of the 8 scenario names>",
  "name": "<plausible full name>",
  "gender": "<male or female — assign based on name>",
  "role": "<job title of counterparty, grounded in the user's industry/context>",
  "avatarInitial": "<1 letter>",
  "avatarColor": "<hex code like #C86060>",
  "personality": "<MUST be one of: ${dispConfig.allowed.join(', ')}>",
  "personalityDescription": "<2 sentences describing how this personality manifests. MUST align with ${userDisposition} disposition.>",
  "backstory": "<3 sentences of context including the power dynamic, what they want, and what they're protecting. Reference the user's specific situation.>",
  "conversationType": "<the scenario selected>",
  "openingLine": "<their exact first spoken sentence that DIRECTLY references the user's specific situation. Tone MUST match ${userDisposition} disposition.>"
}`;

  const contents = [{ role: "user", parts: [{ text: promptText }] }];

  try {
    const data = await robustGenerate({
      contents,
      thermal: 0.75
    });
    
    return data;
  } catch (err) {
    console.error("AI Generation Critical Failure:", err);
    throw new Error(`The AI Engine is currently unavailable. Error details: ${err.message}`);
  }
}
