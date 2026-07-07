import React, { useState } from 'react';
import { Key, ShieldCheck, ExternalLink } from 'lucide-react';

export function ApiKeyModal({ onSave }) {
  const [groqKey, setGroqKey] = useState('');

  const handleSave = () => {
    if (groqKey) sessionStorage.setItem('GROQ_API_KEY', groqKey.trim());
    onSave();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '24px', backdropFilter: 'blur(12px)'
    }}>
      <div style={{
        background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '24px',
        maxWidth: '480px', width: '100%', padding: '40px'
      }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(29,78,216,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Key size={24} color="#1D4ED8" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '500', color: '#111827' }}>Engine Setup</h2>
            <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>Groundwork runs entirely in your browser.</p>
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Groq API Key
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '11px', color: '#1D4ED8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Get a key <ExternalLink size={10} />
              </a>
            </div>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && groqKey) handleSave(); }}
              placeholder="gsk_..."
              autoFocus
              style={{ width: '100%', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px 16px', color: '#111827', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '8px', lineHeight: '1.5' }}>
              Used for AI conversation (LLM) and voice transcription (STT).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', background: 'rgba(29,78,216,0.08)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(29,78,216,0.2)' }}>
            <ShieldCheck size={20} color="#1D4ED8" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: '1.5', margin: 0 }}>
              Your key is stored only in your browser's <strong>sessionStorage</strong> and persists for this tab session only. It is never sent to our servers or logged anywhere.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!groqKey.trim()}
          style={{
            width: '100%', background: groqKey.trim() ? 'linear-gradient(135deg, #1D4ED8, #2563EB)' : '#E5E7EB',
            color: groqKey.trim() ? '#FFFFFF' : '#9CA3AF',
            border: 'none', borderRadius: '12px', padding: '16px', fontSize: '16px', fontWeight: '600',
            cursor: groqKey.trim() ? 'pointer' : 'not-allowed', marginBottom: '12px',
            transition: 'all 0.2s',
            boxShadow: groqKey.trim() ? '0 4px 14px rgba(29,78,216,0.25)' : 'none'
          }}
        >
          Initialize Engine
        </button>

        <button
          onClick={() => {
            sessionStorage.removeItem('GROQ_API_KEY');
            window.location.reload();
          }}
          style={{
            width: '100%', background: 'transparent', color: '#6B7280', border: '1px solid #E5E7EB',
            borderRadius: '12px', padding: '12px', fontSize: '13px', cursor: 'pointer'
          }}
        >
          Clear Stored Key &amp; Refresh
        </button>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#9CA3AF', marginTop: '24px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Powered by Groq · Web Speech API · Whisper
        </p>
      </div>
    </div>
  );
}
