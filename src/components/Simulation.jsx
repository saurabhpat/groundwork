import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useConversation } from '../hooks/useConversation';
import { useWhisperInput } from '../hooks/useWhisperInput';
import { checkDistress, checkSensitiveTopics, checkLength } from '../utils/guardrails';
import { createSession } from '../utils/supabaseSession';
import { Mic, Square, X, Loader2, AlertTriangle, ShieldCheck, Volume2, VolumeX, MessageSquare, ChevronDown, ChevronUp, Info, Clock, MessageCircle } from 'lucide-react';

// ─── Avatar Pulse Component ────────────────────────────────────────────────────
function PersonaAvatar({ persona, isSpeaking, isLoading }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer glow rings — animate when speaking */}
      {(isSpeaking || isLoading) && (
        <>
          <div className="avatar-ring avatar-ring-1" />
          <div className="avatar-ring avatar-ring-2" />
          <div className="avatar-ring avatar-ring-3" />
        </>
      )}
      {/* Main circle */}
      <div style={{
        width: '160px',
        height: '160px',
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${lighten(persona?.avatarColor || '#6B5F52')}, ${persona?.avatarColor || '#6B5F52'})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '56px',
        fontWeight: '700',
        color: 'rgba(255,255,255,0.95)',
        boxShadow: isSpeaking
          ? `0 0 40px ${persona?.avatarColor || '#1D4ED8'}55, 0 0 80px ${persona?.avatarColor || '#1D4ED8'}22`
          : '0 8px 40px rgba(0,0,0,0.12)',
        transition: 'box-shadow 0.4s ease',
        position: 'relative',
        zIndex: 2,
        userSelect: 'none',
        letterSpacing: '-2px',
      }}>
        {persona?.avatarInitial || '?'}
      </div>
    </div>
  );
}

function lighten(hex) {
  // Simple hex lightener for gradient
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.min(r + 60, 255)}, ${Math.min(g + 60, 255)}, ${Math.min(b + 60, 255)})`;
  } catch {
    return '#9A8E80';
  }
}

// ─── Waveform bars (simple CSS animation while speaking) ──────────────────────
function VoiceWaveform({ active }) {
  if (!active) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
      {[1, 2, 3, 4, 5, 4, 3].map((h, i) => (
        <div
          key={i}
          className="wave-bar"
          style={{
            width: '3px',
            borderRadius: '2px',
            background: '#1D4ED8',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Context Chip Component ────────────────────────────────────────────────────
function ContextChip({ scenario, situation, isExpanded, onToggle }) {
  return (
    <div style={{ width: '100%', marginBottom: '12px', animation: 'fadeIn 0.4s ease-out' }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#F3F4F6',
          border: '1px solid #E5E7EB',
          borderRadius: isExpanded ? '12px 12px 0 0' : '12px',
          padding: '8px 14px',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          transition: 'all 0.2s ease',
        }}
      >
        <Info size={14} color="#1D4ED8" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '12px', fontWeight: '500', color: '#374151', flex: 1, letterSpacing: '0.02em' }}>
          {scenario || 'Your Scenario'}
        </span>
        {isExpanded
          ? <ChevronUp size={14} color="#6B7280" />
          : <ChevronDown size={14} color="#6B7280" />}
      </button>
      {isExpanded && situation && (
        <div style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          padding: '12px 14px',
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: '1.6', margin: 0 }}>
            {situation}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Mic Button Component ──────────────────────────────────────────────────────
function MicButton({ isRecording, isTranscribing, isSpeaking, isLoading, isPaused, onClick }) {
  const disabled = isPaused || isLoading || isSpeaking || isTranscribing;
  const active = isRecording;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        border: 'none',
        background: active
          ? '#EF4444'
          : disabled
           ? '#E5E7EB'
           : 'linear-gradient(135deg, #1D4ED8, #2563EB)',
        color: disabled ? '#9CA3AF' : '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: active
          ? '0 0 0 8px rgba(239,68,68,0.2), 0 8px 32px rgba(239,68,68,0.4)'
          : disabled
          ? 'none'
           : '0 8px 32px rgba(29,78,216,0.25)',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        transform: active ? 'scale(1.08)' : 'scale(1)',
      }}
      title={active ? 'Click to stop recording' : 'Click to speak'}
    >
      {isTranscribing
        ? <Loader2 size={28} className="spin" />
        : active
        ? <Square size={28} fill="currentColor" />
        : <Mic size={28} />}
    </button>
  );
}

// ─── Main Simulation Component ─────────────────────────────────────────────────
function Simulation({ appState, setAppState }) {
  const { persona, userProfile, conversationHistory } = appState;
  const userId = appState.user?.id;

  // Supabase session ID — useState so the value change triggers re-render
  // which passes the real ID to useConversation (useRef would not re-render)
  const [sessionId, setSessionId] = useState(null);

  // Create Supabase session row on mount
  useEffect(() => {
    if (userId && persona && !sessionId) {
      console.log('[SIMULATION] Creating Supabase session...', { userId, persona: persona?.name });
      createSession(userId, persona?.conversationType || persona?.scenarioSelected || 'Unknown')
        .then(id => {
          console.log('[SIMULATION] Session created, setting state:', id);
          setSessionId(id);
        })
        .catch(e => console.warn('[SIMULATION] Failed to create Supabase session:', e));
    } else {
      console.log('[SIMULATION] createSession guard:', { userId: !!userId, persona: !!persona, sessionId });
    }
  }, [userId, persona]);

  // Text-fallback mode
  const [textMode, setTextMode] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isContextExpanded, setIsContextExpanded] = useState(false);
  const textareaRef = useRef(null);

  // Overlays
  const [pauseReason, setPauseReason] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitType, setExitType] = useState('feedback');

  // Transcript for subtitles
  const [personaSubtitle, setPersonaSubtitle] = useState('');
  const [userSubtitle, setUserSubtitle] = useState('');

  // Auto-mic trigger from conversation hook
  const [pendingMicTrigger, setPendingMicTrigger] = useState(false);

  const onMicTrigger = useCallback(() => {
    setPendingMicTrigger(true);
  }, []);

  // Elapsed timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // Start timer on mount
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const {
    history, isLoading, errorObj, setErrorObj, sendUserMessage,
    healthScore, isPaused, setIsPaused, isCompleted,
    isSpeaking, isMuted, toggleMute, stopSpeaking, turnCount,
  } = useConversation({ persona, userProfile, initialHistory: conversationHistory, onMicTrigger, sessionId, userId });

  // Use turnCount directly from hook (state-driven, re-renders properly)
  const displayTurnCount = turnCount;

  // Format elapsed time as MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Update persona subtitle when history changes
  useEffect(() => {
    const lastModel = [...history].reverse().find(m => m.role === 'model');
    if (lastModel) setPersonaSubtitle(lastModel.content);
  }, [history]);

  // Auto-complete trigger
  useEffect(() => {
    if (isCompleted) {
      clearInterval(timerRef.current); // Stop timer
      handleEndSession(true);
    }
  }, [isCompleted]);

  // Health watchdog
  useEffect(() => {
    if (isPaused && healthScore < 50) {
      setPauseReason('Session stability has dropped. Take a moment to reground.');
    }
  }, [isPaused, healthScore]);

  // Auto-mic: trigger recording when persona finishes speaking
  const onTranscript = useCallback((text) => {
    setUserSubtitle(text);
    setInputText(text);
    // Auto-send in voice mode
    if (!textMode) {
      sendAndClear(text);
    }
  }, [textMode]);

  const { isRecording, isTranscribing, error: micError, startRecording, stopRecording, toggle: toggleMic } = useWhisperInput(onTranscript);

  // Fire auto-mic when pendingMicTrigger is set and we're in voice mode
  useEffect(() => {
    if (pendingMicTrigger && !textMode && !isPaused && !isLoading) {
      setPendingMicTrigger(false);
      // Small delay to feel natural
      const t = setTimeout(() => {
        startRecording();
      }, 400);
      return () => clearTimeout(t);
    }
  }, [pendingMicTrigger, textMode, isPaused, isLoading]);

  const sendAndClear = (text) => {
    const trimmed = (text || inputText).trim();
    if (!trimmed || isLoading || isPaused) return;

    if (checkSensitiveTopics(trimmed)) {
      setPauseReason('You mentioned a high-compliance topic. Groundwork recommends involving HR or legal counsel.');
      setIsPaused(true);
      return;
    }
    if (checkDistress(trimmed)) {
      setPauseReason("Let's take a breath. The simulation is getting heated.");
      setIsPaused(true);
      return;
    }
    if (!checkLength(trimmed)) return;

    setInputText('');
    setUserSubtitle(trimmed);
    sendUserMessage(trimmed);
  };

  const handleEndSession = (isAutoEnd = false) => {
    stopSpeaking();
    clearInterval(timerRef.current); // Stop timer
    setAppState(prev => ({
      ...prev,
      conversationHistory: history,
      turnCount: isAutoEnd ? prev.turnCount + 1 : prev.turnCount,
      durationSeconds: elapsedSeconds,
      sessionId,
      phase: 'feedback',
    }));
  };

  // Text area auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  // Status label beneath mic button
  const getMicStatusLabel = () => {
    if (isPaused) return 'Simulation paused';
    if (isSpeaking) return `${persona?.name?.split(' ')[0]} is speaking…`;
    if (isLoading) return 'Thinking…';
    if (isTranscribing) return 'Transcribing…';
    if (isRecording) return 'Listening… tap to send';
    return 'Tap to speak';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F9FAFB', color: '#111827', position: 'relative' }}>

      {/* ── Top Bar ── */}
      <header style={{ position: 'relative', zIndex: 10, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Health badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', borderRadius: '20px', padding: '5px 12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: healthScore < 60 ? '#EF4444' : '#10B981' }} />
            <span style={{ fontSize: '11px', color: healthScore < 60 ? '#EF4444' : '#10B981', fontWeight: '600' }}>{healthScore}%</span>
          </div>
          {/* Timer badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#FFFFFF', borderRadius: '20px', padding: '5px 12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <Clock size={12} color="#6B7280" />
            <span style={{ fontSize: '11px', color: '#374151', fontWeight: '500', fontVariantNumeric: 'tabular-nums' }}>{formatTime(elapsedSeconds)}</span>
          </div>
          {/* Turn counter badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#FFFFFF', borderRadius: '20px', padding: '5px 12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <MessageCircle size={12} color="#6B7280" />
            <span style={{ fontSize: '11px', color: '#374151', fontWeight: '500' }}>{displayTurnCount} {displayTurnCount === 1 ? 'turn' : 'turns'}</span>
          </div>
          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute persona' : 'Mute persona'}
            style={{ background: 'none', border: 'none', color: isMuted ? '#9CA3AF' : '#1D4ED8', cursor: 'pointer', padding: '4px' }}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          {/* Text mode toggle */}
          <button
            onClick={() => setTextMode(t => !t)}
            title={textMode ? 'Switch to voice mode' : 'Switch to text mode'}
            style={{ background: 'none', border: 'none', color: textMode ? '#1D4ED8' : '#9CA3AF', cursor: 'pointer', padding: '4px' }}
          >
            <MessageSquare size={18} />
          </button>
          <button
            onClick={() => { setExitType('abandon'); setShowExitConfirm(true); }}
            title="Exit without saving"
            style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* ── Main Split-Panel Area ── */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>

        {/* ── Left Panel: Avatar & Persona Info ── */}
        <div style={{
          flex: '0 0 320px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '40px 24px',
          borderRight: '1px solid #E5E7EB',
        }}>
          <PersonaAvatar persona={persona} isSpeaking={isSpeaking} isLoading={isLoading} />

          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{persona?.name}</div>
            <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>{persona?.role}</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6B7280', marginBottom: '6px' }}>
              {persona?.conversationType || persona?.scenarioSelected}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <VoiceWaveform active={isSpeaking} />
            </div>
          </div>
        </div>

        {/* ── Right Panel: Transcripts ── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          gap: '20px',
          padding: '40px 48px 40px 24px',
          minWidth: 0,
        }}>

          {/* Context chip */}
          <ContextChip
            scenario={persona?.conversationType || persona?.scenarioSelected}
            situation={userProfile?.actualSituation}
            isExpanded={isContextExpanded}
            onToggle={() => setIsContextExpanded(e => !e)}
          />

          {/* Persona's latest reply */}
          <div style={{
            width: '100%',
            animation: 'fadeIn 0.4s ease-out',
          }}>
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '14px' }}>
                <Loader2 size={14} className="spin" style={{ color: '#1D4ED8' }} />
                <span>Thinking…</span>
              </div>
            ) : personaSubtitle ? (
              <p style={{
                fontSize: '17px',
                fontWeight: '300',
                color: '#374151',
                lineHeight: '1.7',
                margin: 0,
                fontStyle: 'italic',
              }}>
                &ldquo;{personaSubtitle}&rdquo;
              </p>
            ) : null}
          </div>

          {/* User's latest response */}
          {userSubtitle && (
            <div style={{
              width: '100%',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              padding: '16px 24px',
              animation: 'fadeIn 0.4s ease-out',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: 0 }}>
                <span style={{ fontWeight: '600', color: '#6B7280', marginRight: '6px' }}>You:</span>
                <span style={{ color: '#1D4ED8' }}>{userSubtitle}</span>
              </p>
            </div>
          )}

          {/* Error banner */}
          {(micError || errorObj) && (
            <div style={{ width: '100%', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <AlertTriangle size={14} color="#DC2626" />
              <span style={{ fontSize: '12px', color: '#DC2626', flex: 1 }}>{micError || errorObj}</span>
              <button onClick={() => setErrorObj(null)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}>×</button>
            </div>
          )}
        </div>

      </main>

      {/* ── Bottom Controls ── */}
      <footer style={{ padding: '0 24px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>

        {/* Text mode input */}
        {textMode && (
          <div style={{ maxWidth: '560px', width: '100%', display: 'flex', gap: '10px', animation: 'fadeIn 0.3s' }}>
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendAndClear(inputText);
                }
              }}
              placeholder={isPaused ? 'Simulation paused…' : 'Type your response…'}
              disabled={isPaused || isLoading || isSpeaking}
              rows={1}
              style={{
                flex: 1,
                background: '#F3F4F6',
                border: '1px solid #E5E7EB',
                borderRadius: '14px',
                padding: '14px 18px',
                color: '#111827',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: '1.5',
              }}
            />
            <button
              onClick={() => sendAndClear(inputText)}
              disabled={!inputText.trim() || isLoading || isPaused || isSpeaking}
              style={{
                padding: '0 20px',
                background: inputText.trim() && !isLoading ? 'linear-gradient(135deg, #1D4ED8, #2563EB)' : '#E5E7EB',
                color: inputText.trim() && !isLoading ? '#FFFFFF' : '#9CA3AF',
                border: 'none',
                borderRadius: '14px',
                fontWeight: '700',
                cursor: pointer => (inputText.trim() && !isLoading ? 'pointer' : 'not-allowed'),
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
            >
              Send
            </button>
          </div>
        )}

        {/* Mic button */}
        {!textMode && (
          <MicButton
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            isSpeaking={isSpeaking}
            isLoading={isLoading}
            isPaused={isPaused}
            onClick={toggleMic}
          />
        )}

        {/* Status label */}
        <div style={{ fontSize: '12px', color: '#6B7280', letterSpacing: '0.04em', textAlign: 'center', minHeight: '18px' }}>
          {getMicStatusLabel()}
        </div>

        {/* End session link */}
        <button
          onClick={() => { setExitType('feedback'); setShowExitConfirm(true); }}
          style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <ChevronDown size={12} /> End Practice
        </button>
      </footer>

      {/* ── Strategic Pause Overlay ── */}
      {isPaused && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ maxWidth: '480px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '28px', padding: '48px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
            <ShieldCheck size={56} color="#1D4ED8" style={{ margin: '0 auto 28px' }} />
            <h2 style={{ fontSize: '26px', fontWeight: '300', marginBottom: '16px', color: '#111827' }}>Strategic Pause</h2>
            <p style={{ color: '#6B7280', fontSize: '15px', lineHeight: '1.6', marginBottom: '40px' }}>
              {pauseReason || 'The simulation has been paused to maintain a focused learning environment.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => { setIsPaused(false); setPauseReason(null); }} style={{ width: '100%', padding: '18px', background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: '#FFF', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.25)' }}>
                Resume Simulation
              </button>
              <button onClick={() => handleEndSession()} style={{ width: '100%', padding: '16px', background: 'transparent', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: '14px', cursor: 'pointer' }}>
                View Early Debrief
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Exit Confirmation Overlay ── */}
      {showExitConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
          <div style={{ maxWidth: '420px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '28px', padding: '40px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(29,78,216,0.08)', border: '1px solid rgba(29,78,216,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <AlertTriangle size={24} color={exitType === 'dashboard' ? '#EF4444' : '#1D4ED8'} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '300', marginBottom: '12px', color: '#111827' }}>
              {exitType === 'abandon' ? 'Exit Practice?' : 'Finish Session?'}
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.6', marginBottom: '32px' }}>
              {exitType === 'abandon'
                ? 'This session will not be saved. Your progress will be lost.'
                : 'Ready to stop and see your full feedback report?'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => {
                  if (exitType === 'abandon') {
                    stopSpeaking();
                    setAppState(prev => ({ ...prev, phase: 'profile' }));
                  } else {
                    handleEndSession();
                  }
                }}
                style={{ width: '100%', padding: '16px', background: exitType === 'abandon' ? '#EF4444' : 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: '#FFF', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: exitType === 'abandon' ? 'none' : '0 4px 14px rgba(29,78,216,0.25)' }}
              >
                {exitType === 'abandon' ? 'Exit Without Saving' : 'Submit for Feedback'}
              </button>
              <button onClick={() => setShowExitConfirm(false)} style={{ width: '100%', padding: '16px', background: 'transparent', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: '14px', fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeIn 0.4s ease-out; }
        .spin { animation: spin 1.2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Avatar pulse rings */
        .avatar-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(29, 78, 216, 0.25);
          animation: ringPulse 2s ease-out infinite;
          z-index: 1;
        }
        .avatar-ring-1 { width: 200px; height: 200px; animation-delay: 0s; }
        .avatar-ring-2 { width: 250px; height: 250px; animation-delay: 0.5s; }
        .avatar-ring-3 { width: 300px; height: 300px; animation-delay: 1s; }
        @keyframes ringPulse {
          0%   { opacity: 0.6; transform: scale(0.95); }
          50%  { opacity: 0.3; }
          100% { opacity: 0; transform: scale(1.05); }
        }

        /* Voice waveform bars */
        .wave-bar {
          animation: waveBounce 0.8s ease-in-out infinite alternate;
        }
        @keyframes waveBounce {
          0%   { height: 4px; }
          100% { height: 22px; }
        }
      `}</style>
    </div>
  );
}

export default Simulation;
