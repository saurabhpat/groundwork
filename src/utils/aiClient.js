const getGroqKey = () => localStorage.getItem('VITE_GROQ_API_KEY') || import.meta.env.VITE_GROQ_API_KEY;

/**
 * Transcribes an audio Blob using Groq's hosted Whisper large-v3 model.
 */
export async function transcribeAudio(audioBlob) {
  const apiKeyGroq = getGroqKey();
  if (!apiKeyGroq) {
    throw new Error('Groq API Key is not set. Please add it to your browser settings.');
  }

  const formData = new FormData();
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

// Models in order of fallback (Based on user limits)
const PROVIDERS = [
  { id: 'groq', model: 'llama-3.3-70b-versatile' },
  { id: 'groq', model: 'qwen/qwen3-32b' },
  { id: 'groq', model: 'llama-3.1-8b-instant' },
  { id: 'groq', model: 'groq/compound-mini' }
];

function cleanJson(raw) {
  let clean = raw.trim();
  if (clean.startsWith("```json")) clean = clean.replace(/^```json\s*/, '');
  else if (clean.startsWith("```")) clean = clean.replace(/^```\w*\s*/, '');
  if (clean.endsWith("```")) clean = clean.replace(/```\s*$/, '');
  return clean.trim();
}

/**
 * Unified call to Groq with Fallback chain
 */
export async function robustGenerate({ systemInstruction, contents, thermal = 0.7 }) {
  let lastError = null;
  const key = getGroqKey();

  if (!key) {
    throw new Error('Groq API Key is missing. Please configure it in settings.');
  }

  for (let i = 0; i < PROVIDERS.length; i++) {
    const { id, model } = PROVIDERS[i];
    try {
      const endpoint = "https://api.groq.com/openai/v1/chat/completions";
      
      const payload = {
        model,
        messages: [
          ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
          ...contents.map(c => ({ 
            role: c.role === 'model' || c.role === 'assistant' ? 'assistant' : 'user', 
            content: Array.isArray(c.parts) ? (c.parts[0].text || c.parts[0]) : (typeof c.content === 'string' ? c.content : JSON.stringify(c.content))
          }))
        ],
        temperature: thermal,
        response_format: { type: "json_object" }
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errBody = await res.text();
        let errorMsg = `Groq error (${res.status}): ${errBody}`;
        
        // Specially handle 429 Rate Limits
        if (res.status === 429) {
          try {
            const parsed = JSON.parse(errBody);
            const detail = parsed.error?.message || "Rate limit reached";
            errorMsg = `AI Capacity Alert (429): ${detail}. Automaticaly switching to backup model...`;
          } catch (e) {
            errorMsg = `AI Capacity Alert (429). Automaticaly switching to backup model...`;
          }
        }

        console.warn(`Attempt ${i+1} (${model}) failed: ${errorMsg}`);
        lastError = errorMsg;
        if (i < PROVIDERS.length - 1) continue; // Try next fallback
        throw new Error(errorMsg);
      }

      const data = await res.json();
      const rawContent = data.choices?.[0]?.message?.content;

      if (!rawContent) {
        lastError = "Groq returned empty response";
        if (i < PROVIDERS.length - 1) continue;
        throw new Error(lastError);
      }

      const stripped = cleanJson(rawContent);
      
      try {
        return JSON.parse(stripped);
      } catch (parseErr) {
        throw new Error(`Groq malformed JSON: ${parseErr.message}`);
      }

    } catch (err) {
      lastError = err.message;
      if (i === PROVIDERS.length - 1) throw new Error(`AI Generation failed after all fallbacks. Final error: ${lastError}`);
      console.warn(`${model} failed: ${err.message}. Retrying next...`);
    }
  }

  throw new Error(`AI Generation failed. Last error: ${lastError}`);
}
