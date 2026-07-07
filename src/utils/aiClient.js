const getGroqKey = () => {
  const key = sessionStorage.getItem('GROQ_API_KEY') || import.meta.env.VITE_GROQ_API_KEY || '';
  // Strip any non-ASCII characters (e.g. zero-width spaces, invisible unicode) that crash fetch headers
  return key.replace(/[^\x20-\x7E]/g, '').trim();
};

const GROQ_BASE = 'https://api.groq.com/openai/v1';

// ─── LLM Providers (fallback chain) ───────────────────────────────────────────
const LLM_PROVIDERS = [
  { model: 'llama-3.3-70b-versatile' },
  { model: 'mixtral-8x7b-32768' },
  { model: 'gemma2-9b-it' },
];

// ─── STT: Transcribe audio via Groq ─────────────────────────────────────
/**
 * Transcribes an audio Blob using Groq's audio transcription endpoint.
 */
export async function transcribeAudio(audioBlob) {
  const apiKey = getGroqKey();
  if (!apiKey) {
    throw new Error('Groq API Key is not set. Please add it in Settings.');
  }

  const extension = audioBlob.type.includes('mp4') ? 'mp4'
    : audioBlob.type.includes('ogg') ? 'ogg'
    : 'webm';

  const formData = new FormData();
  formData.append('file', audioBlob, `audio.${extension}`);
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('response_format', 'json');
  formData.append('language', 'en');

  console.log(`Sending STT request to Groq. Format: ${extension}`);

  try {
    const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`STT failed with status ${res.status}: ${errText}`);
      throw new Error(`STT error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    console.log(`STT success with Groq`);
    return data.text || '';
  } catch (err) {
    console.warn(`STT threw error: ${err.message}`);
    throw err;
  }
}

// Text-to-Speech is now handled directly via browser Web Speech API in useTTS.js

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cleanJson(raw) {
  let clean = raw.trim();
  if (clean.startsWith('```json')) clean = clean.replace(/^```json\s*/, '');
  else if (clean.startsWith('```')) clean = clean.replace(/^```\w*\s*/, '');
  if (clean.endsWith('```')) clean = clean.replace(/```\s*$/, '');
  return clean.trim();
}

// ─── LLM: Robust generation with fallback chain ───────────────────────────────
/**
 * Unified LLM call to Groq with a multi-model fallback chain.
 * Returns parsed JSON object from model response.
 */
export async function robustGenerate({ systemInstruction, contents, thermal = 0.7 }) {
  let lastError = null;
  const key = getGroqKey();

  if (!key) {
    throw new Error('Groq API Key is missing. Please configure it in Settings.');
  }

  for (let i = 0; i < LLM_PROVIDERS.length; i++) {
    const { model } = LLM_PROVIDERS[i];
    try {
      const payload = {
        model,
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          ...contents.map(c => ({
            role: c.role === 'model' || c.role === 'assistant' ? 'assistant' : 'user',
            content: Array.isArray(c.parts)
              ? (c.parts[0].text || c.parts[0])
              : (typeof c.content === 'string' ? c.content : JSON.stringify(c.content)),
          })),
        ],
        temperature: thermal,
        response_format: { type: 'json_object' },
      };

      const res = await fetch(`${GROQ_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.text();
        let errorMsg = `Groq error (${res.status}): ${errBody}`;

        if (res.status === 429) {
          try {
            const parsed = JSON.parse(errBody);
            const detail = parsed.error?.message || 'Rate limit reached';
            errorMsg = `Credit/Rate limit (429): ${detail}. Switching to backup model…`;
          } catch {
            errorMsg = 'Credit/Rate limit (429). Switching to backup model…';
          }
        }

        console.warn(`Attempt ${i + 1} (${model}) failed: ${errorMsg}`);
        lastError = errorMsg;
        if (i < LLM_PROVIDERS.length - 1) continue;
        throw new Error(errorMsg);
      }

      const data = await res.json();
      const rawContent = data.choices?.[0]?.message?.content;

      if (!rawContent) {
        lastError = 'Groq returned empty response';
        if (i < LLM_PROVIDERS.length - 1) continue;
        throw new Error(lastError);
      }

      const stripped = cleanJson(rawContent);

      try {
        return JSON.parse(stripped);
      } catch (parseErr) {
        throw new Error(`Malformed JSON from model: ${parseErr.message}`);
      }
    } catch (err) {
      lastError = err.message;
      if (i === LLM_PROVIDERS.length - 1) {
        throw new Error(`AI Generation failed after all fallbacks. Final error: ${lastError}`);
      }
      console.warn(`${model} failed: ${err.message}. Trying next…`);
    }
  }

  throw new Error(`AI Generation failed. Last error: ${lastError}`);
}
