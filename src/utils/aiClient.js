const apiKeyGemini = import.meta.env.VITE_GEMINI_API_KEY;
const apiKeyGroq = import.meta.env.VITE_GROQ_API_KEY;

/**
 * Transcribes an audio Blob using Groq's hosted Whisper large-v3 model.
 * No extra npm packages needed — uses native fetch + FormData.
 * 
 * @param {Blob} audioBlob - The recorded audio (webm/mp4/wav etc.)
 * @returns {Promise<string>} - The transcribed text
 */
export async function transcribeAudio(audioBlob) {
  if (!apiKeyGroq) {
    throw new Error('VITE_GROQ_API_KEY is not set. Please add it to your .env file.');
  }

  const formData = new FormData();
  // Groq requires a filename extension so it knows the format
  const extension = audioBlob.type.includes('mp4') ? 'mp4'
    : audioBlob.type.includes('ogg') ? 'ogg'
    : 'webm';
  formData.append('file', audioBlob, `recording.${extension}`);
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', 'en');
  formData.append('response_format', 'json');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKeyGroq}` },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq Whisper error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.text || '';
}

// Models in order of fallback (Groq is preferred for RPM/Speed, Gemini for reasoning)
const PROVIDERS = [
  { id: 'groq', model: 'llama-3.3-70b-versatile' },
  { id: 'gemini', model: 'gemini-2.0-flash' },
  { id: 'gemini', model: 'gemini-flash-latest' }
];

/**
 * Strips markdown and potentially malformed text to return clean JSON
 */
function cleanJson(raw) {
  let clean = raw.trim();
  if (clean.startsWith("```json")) clean = clean.replace(/^```json\s*/, '');
  else if (clean.startsWith("```")) clean = clean.replace(/^```\w*\s*/, '');
  if (clean.endsWith("```")) clean = clean.replace(/```\s*$/, '');
  return clean.trim();
}

/**
 * Unified, fallback-capable call to Groq or Gemini
 */
export async function robustGenerate({ systemInstruction, contents, thermal = 0.7 }) {
  let lastError = null;

  for (const { id, model } of PROVIDERS) {
    try {
      const isGroq = id === 'groq';
      const key = isGroq ? apiKeyGroq : apiKeyGemini;

      if (!key) continue; // Skip if key not found

      const endpoint = isGroq 
        ? "https://api.groq.com/openai/v1/chat/completions"
        : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      
      const payload = isGroq 
        ? {
            model,
            messages: [
              ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
              ...contents.map(c => ({ 
                role: c.role === 'model' ? 'assistant' : c.role, 
                content: Array.isArray(c.parts) ? c.parts[0].text : (typeof c.content === 'string' ? c.content : JSON.stringify(c.content))
              }))
            ],
            temperature: thermal,
            response_format: { type: "json_object" }
          }
        : {
            system_instruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
            contents,
            generationConfig: { 
              maxOutputTokens: 2000, 
              temperature: thermal,
              response_mime_type: "application/json" 
            }
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(isGroq ? { 'Authorization': `Bearer ${key}` } : {})
        },
        body: JSON.stringify(payload)
      });

      // Handle Quota (429) or Service Down (5xx) by falling back to next provider
      if (res.status === 429 || res.status >= 500) {
        console.warn(`${id.toUpperCase()} model ${model} failed (${res.status}). Downshifting...`);
        lastError = `${id.toUpperCase()} Error: ${res.status}`;
        continue; 
      }

      const data = await res.json();
      
      const rawContent = isGroq 
        ? data.choices[0].message.content
        : data.candidates[0].content.parts[0].text;

      const stripped = cleanJson(rawContent);
      
      try {
        return JSON.parse(stripped);
      } catch (parseErr) {
        throw new Error(`${id.toUpperCase()} malformed JSON: ${parseErr.message}`);
      }

    } catch (err) {
      lastError = err.message;
      if (model === PROVIDERS[PROVIDERS.length - 1].model) throw err;
      console.warn(`${id.toUpperCase()} failed: ${err.message}. Retrying next...`);
    }
  }

  throw new Error(`All AI Providers failed. Last error: ${lastError}`);
}
