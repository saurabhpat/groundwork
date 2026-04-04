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

  const promptText = `Act as an expert career coach and simulation designer.
The user is: "${userProfile.whoAreYou || userProfile.role}"
Their primary challenge: "${userProfile.practiceGoal || userProfile.goal}"
${richContext}
Your task:
1. Use the PRE-SELECTED SCENARIO if provided. Otherwise, select the closest match from these 8 archetypes:
   Salary Negotiation | Asking for a Promotion | Giving Difficult Feedback | Conflict with a Peer | Disagreeing with a Manager | Delivering Bad News | Client Negotiation | Setting a Boundary

2. Generate a vivid, realistic professional counterpart persona that DIRECTLY reflects the relationship type and communication fear described above. The persona's personality should authentically represent the specific difficulty the user is here to practice.

3. The opening line must reflect the scenario's pressure point immediately. No pleasantries — drop into the moment.

Return exactly this JSON structure (raw JSON, NO markdown):
{
  "scenarioSelected": "<one of the 8 scenario names>",
  "name": "<plausible full name>",
  "role": "<job title of counterparty, grounded in the user's industry/context>",
  "avatarInitial": "<1 letter>",
  "avatarColor": "<hex code like #C86060>",
  "personality": "<1 word: Defensive, Skeptical, Dismissive, Receptive, Distracted, Hostile, Bureaucratic, or Empathetic>",
  "personalityDescription": "<2 sentences describing exactly how this personality manifests in conversation>",
  "backstory": "<3 sentences of context including the power dynamic, what they want, and what they're protecting>",
  "conversationType": "<the scenario selected>",
  "openingLine": "<their exact first spoken sentence that immediately creates the tension>"
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
