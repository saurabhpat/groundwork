import React, { useState } from 'react';
import { Key, ShieldCheck, Cpu } from 'lucide-react';

export function ApiKeyModal({ onSave }) {
  const [groqKey, setGroqKey] = useState('');

  const handleSave = () => {
    if (groqKey) localStorage.setItem('VITE_GROQ_API_KEY', groqKey);
    onSave();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '24px', backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '24px',
        maxWidth: '480px', width: '100%', padding: '40px'
      }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Key size={24} color="#C8B89A" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '500', color: '#F0EDE8' }}>API Configuration</h2>
            <p style={{ fontSize: '14px', color: '#605850', marginTop: '4px' }}>Groundwork runs locally in your browser.</p>
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
           <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#605850', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Groq API Key (Whisper & LLM)</label>
              <input 
                type="password" 
                value={groqKey} 
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_..."
                style={{ width: '100%', background: '#1A1A1A', border: '1px solid #222', borderRadius: '12px', padding: '14px 16px', color: '#F0EDE8', fontSize: '14px', outline: 'none' }}
              />
           </div>

           <div style={{ display: 'flex', gap: '12px', background: 'rgba(200,184,154,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(200,184,154,0.1)' }}>
              <ShieldCheck size={20} color="#C8B89A" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '12px', color: '#807870', lineHeight: '1.5' }}>
                Your keys are stored only in your browser's <strong>localStorage</strong>. They are never sent to our servers or saved on GitHub.
              </p>
           </div>
        </div>


        <button 
          onClick={handleSave}
          style={{ 
            width: '100%', background: '#C8B89A', color: '#0F0F0F', border: 'none', 
            borderRadius: '12px', padding: '16px', fontSize: '16px', fontWeight: '600', cursor: 'pointer',
            marginBottom: '12px'
          }}
        >
          Initialize Engine
        </button>

        <button 
          onClick={() => {
            localStorage.removeItem('VITE_GROQ_API_KEY');
            localStorage.removeItem('VITE_GEMINI_API_KEY');
            window.location.reload();
          }}
          style={{ 
            width: '100%', background: 'transparent', color: '#605850', border: '1px solid #222', 
            borderRadius: '12px', padding: '12px', fontSize: '13px', cursor: 'pointer'
          }}
        >
          Clear Stored Keys & Refresh
        </button>


        <p style={{ textAlign: 'center', fontSize: '11px', color: '#333', marginTop: '24px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Powered by Groq Llama 3 & Gemini 2
        </p>
      </div>
    </div>
  );
}
