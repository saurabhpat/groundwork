import { robustGenerate } from './aiClient';

/**
 * High-Tier persona generator with auto-model fallback.
 */
export async function generatePersona(apiKey, userProfile) {
  const promptText = `Act as an expert career coach and simulation designer.
The user is a "${userProfile.role}" and their goal is "${userProfile.goal}".
  
First, select the most relevant scenario archetype from these 8 options:
1. Salary Negotiation
2. Asking for a Promotion
3. Giving Difficult Feedback
4. Conflict with a Peer
5. Disagreeing with a Manager
6. Delivering Bad News
7. Client Negotiation
8. Setting a Boundary

Second, generate a vivid, realistic professional persona for them to practice against.

Return exactly this JSON structure (and absolutely NO markdown formatting, just raw JSON text starting with {):
{
  "scenarioSelected": "<one of the 8 scenario names>",
  "name": "<plausible full name>",
  "role": "<job title of counterparty>",
  "avatarInitial": "<1 letter>",
  "avatarColor": "<hex code like #C86060>",
  "personality": "<1 word personality like Defensive, Receptive, Distracted>",
  "personalityDescription": "<2 sentences on how they behave>",
  "backstory": "<3 sentences of relevant context including the power dynamic>",
  "conversationType": "<the scenario selected>",
  "openingLine": "<their exact spoken first sentence>"
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
