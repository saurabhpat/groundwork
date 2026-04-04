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

// Models in order of fallback
const PROVIDERS = [
  { id: 'groq', model: 'llama-3.3-70b-versatile' }
];

function cleanJson(raw) {
  let clean = raw.trim();
  if (clean.startsWith("```json")) clean = clean.replace(/^```json\s*/, '');
  else if (clean.startsWith("```")) clean = clean.replace(/^```\w*\s*/, '');
  if (clean.endsWith("```")) clean = clean.replace(/```\s*$/, '');
  return clean.trim();
}

/**
 * Unified call to Groq
 */
export async function robustGenerate({ systemInstruction, contents, thermal = 0.7 }) {
  let lastError = null;
  const key = getGroqKey();

  if (!key) {
    throw new Error('Groq API Key is missing. Please configure it in settings.');
  }

  for (const { id, model } of PROVIDERS) {
    try {
      const endpoint = "https://api.groq.com/openai/v1/chat/completions";
      
      const payload = {
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
        console.warn(`Groq error (${res.status}): ${errBody}`);
        lastError = `Groq (${res.status}): ${errBody}`;
        continue; 
      }

      const data = await res.json();
      const rawContent = data.choices?.[0]?.message?.content;

      if (!rawContent) {
        lastError = "Groq returned empty response";
        continue;
      }

      const stripped = cleanJson(rawContent);
      
      try {
        return JSON.parse(stripped);
      } catch (parseErr) {
        throw new Error(`Groq malformed JSON: ${parseErr.message}`);
      }

    } catch (err) {
      lastError = err.message;
      if (model === PROVIDERS[PROVIDERS.length - 1].model) throw err;
      console.warn(`Groq failed: ${err.message}. Retrying next...`);
    }
  }

  throw new Error(`AI Generation failed. Last error: ${lastError}`);
}

