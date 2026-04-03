import React, { useState, useRef, useEffect } from 'react';
import { useConversation } from '../hooks/useConversation';
import { useWhisperInput } from '../hooks/useWhisperInput';
import { checkDistress, checkLength } from '../utils/guardrails';
import { Mic, Square, Navigation2, Activity, X, Loader2 } from 'lucide-react';

function Simulation({ appState, setAppState }) {
  const { persona, userProfile, conversationHistory } = appState;
  const [inputText, setInputText] = useState('');
  const [turnCount, setTurnCount] = useState(appState.turnCount || 0);
  const [showDistress, setShowDistress] = useState(false);
  const [showLengthError, setShowLengthError] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const { history, isLoading, errorObj, setErrorObj, sendUserMessage, attentionLevel, isCompleted } = useConversation({
    persona, userProfile, initialHistory: conversationHistory
  });

  const chatEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading, inputText]);

  // Auto-end when AI signals conversation is complete
  useEffect(() => {
    if (isCompleted) {
      handleEndSession(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleted]);

  // Called by Whisper hook when transcription is ready
  const onTranscript = (text) => {
    setInputText(prev => {
      // Append to existing text if already has content (useful if user records twice)
      if (prev.trim()) return prev + ' ' + text;
      return text;
    });
  };

  const {
    isRecording,
    isTranscribing,
    isBusy,
    error: micError,
    setError: setMicError,
    startRecording,
    stopRecording,
  } = useWhisperInput(onTranscript);

  // Cleanup mic error after a few seconds
  useEffect(() => {
    if (micError) {
      const t = setTimeout(() => setMicError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [micError, setMicError]);

  const handleSend = () => {
    if (isRecording) stopRecording();

    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    if (checkDistress(trimmed)) setShowDistress(true);
    if (!checkLength(trimmed)) { setShowLengthError(true); return; }
    setShowLengthError(false);

    setInputText('');
    sendUserMessage(trimmed);
    setTurnCount(prev => prev + 1);
  };

  const handleEndSession = (isAutoEnd = false) => {
    if (isRecording) stopRecording();
    setAppState(prev => ({
      ...prev,
      conversationHistory: history,
      turnCount: isAutoEnd ? prev.turnCount + 1 : prev.turnCount,
      phase: 'feedback',
    }));
  };

  // ------- Mic button state machine -------
  // State: idle → recording → transcribing → idle
  const getMicState = () => {
    if (isTranscribing) return 'transcribing';
    if (isRecording)    return 'recording';
    return 'idle';
  };
  const micState = getMicState();

  const micLabel = {
    idle:         'Hold to speak',
    recording:    'Recording… click to stop',
    transcribing: 'Transcribing…',
  }[micState];

  const micButtonStyle = {
    idle: {
      background: '#1E1E1E', color: '#C8B89A',
      border: '1px solid #3A3A3A', cursor: 'pointer',
      boxShadow: 'none', animation: 'none',
    },
    recording: {
      background: '#C86060', color: '#FFF',
      border: '2px solid #FF8080', cursor: 'pointer',
      boxShadow: '0 0 0 6px rgba(200,96,96,0.18)',
      animation: 'mic-pulse 1.5s infinite',
    },
    transcribing: {
      background: '#1E1E1E', color: '#C8B89A',
      border: '1px solid #3A3A3A', cursor: 'not-allowed',
      boxShadow: 'none', animation: 'none',
    },
  }[micState];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0F0F0F' }}>

      {/* ── HEADER ── */}
      <header style={{
        height: '72px', flexShrink: 0,
        background: 'rgba(15,15,15,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1E1E1E',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: persona?.avatarColor || '#333',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: '500',
          }}>
            {persona?.avatarInitial}
          </div>
          <div>
            <div style={{ fontSize: '15px', color: '#F0EDE8', fontWeight: '500' }}>{persona?.name}</div>
            <div style={{ fontSize: '12px', color: '#605850', marginTop: '2px' }}>{persona?.role}</div>
          </div>

          <div style={{
            marginLeft: '24px', paddingLeft: '24px', borderLeft: '1px solid #2A2A2A',
            display: 'flex', flexDirection: 'column', gap: '2px',
          }}>
            <div style={{ fontSize: '10px', color: '#605850', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Scenario</div>
            <div style={{ fontSize: '14px', color: '#C8B89A', fontWeight: '400' }}>{userProfile.scenario || persona?.conversationType}</div>
          </div>

          {/* Attention meter */}
          <div style={{ marginLeft: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#1A1A1A', borderRadius: '8px', border: '1px solid #2A2A2A' }}>
            <Activity size={14} color={attentionLevel > 60 ? '#4E9B6F' : attentionLevel > 30 ? '#C8B89A' : '#C86060'} />
            <div style={{ width: '48px', height: '4px', background: '#2A2A2A', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${attentionLevel || 0}%`,
                background: attentionLevel > 60 ? '#4E9B6F' : attentionLevel > 30 ? '#C8B89A' : '#C86060',
                transition: 'all 0.5s ease',
              }} />
            </div>
            <span style={{ fontSize: '11px', color: '#605850' }}>ATTN</span>
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '12px', color: '#605850', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Turn {turnCount}
          </div>

          {showEndConfirm ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: '#605850', fontSize: '13px' }}>End session?</span>
              <button onClick={() => handleEndSession()} style={{
                background: 'transparent', border: '1px solid #C86060', color: '#C86060',
                borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer',
              }}>Yes</button>
              <button onClick={() => setShowEndConfirm(false)} style={{
                background: 'transparent', border: '1px solid #3A3A3A', color: '#A09890',
                borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer',
              }}>No</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                title="Discard session and exit"
                onClick={() => setAppState(prev => ({ ...prev, phase: 'profile' }))}
                style={{
                  background: 'transparent', border: '1px solid #2A2A2A', color: '#A09890',
                  borderRadius: '8px', padding: '8px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseOver={e => { e.currentTarget.style.color = '#F0EDE8'; e.currentTarget.style.borderColor = '#3A3A3A'; }}
                onMouseOut={e => { e.currentTarget.style.color = '#A09890'; e.currentTarget.style.borderColor = '#2A2A2A'; }}
              >
                <X size={16} />
              </button>
              <button
                onClick={() => setShowEndConfirm(true)}
                style={{
                  background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#C8B89A',
                  borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px',
                }}
              >
                Get Feedback
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── CHAT AREA ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '40px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, maxWidth: '800px', width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {history.length === 0 && !isLoading && (
            <div style={{ textAlign: 'center', color: '#605850', marginTop: '40px', fontSize: '15px' }}>
              Initializing practice environment…
            </div>
          )}

          {history.map((msg, idx) => {
            const isPersona = msg.role === 'model';
            return isPersona ? (
              <div key={idx} className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '11px', color: '#605850', textTransform: 'uppercase', letterSpacing: '0.06em', marginLeft: '4px' }}>
                  {persona?.name}
                </div>
                <div style={{ fontSize: '22px', color: '#F0EDE8', lineHeight: '1.5', fontWeight: '300', maxWidth: '680px' }}>
                  "{msg.content}"
                </div>
              </div>
            ) : (
              <div key={idx} className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', alignSelf: 'flex-end' }}>
                <div style={{ fontSize: '11px', color: '#A09890', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '4px' }}>
                  You
                </div>
                <div style={{
                  fontSize: '15px', color: '#E0DCD5', lineHeight: '1.5',
                  maxWidth: '500px', background: '#1A1A1A',
                  padding: '12px 20px', borderRadius: '16px 16px 4px 16px',
                  border: '1px solid #2A2A2A',
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })}

          {/* AI typing indicator */}
          {isLoading && (
            <div className="animate-in" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <div style={{
                background: 'rgba(26,26,26,0.5)', border: '1px solid #242424',
                borderRadius: '20px', padding: '12px 24px', display: 'flex', gap: '6px', alignItems: 'center',
              }}>
                <span className="dot" style={{ width: '6px', height: '6px' }} />
                <span className="dot" style={{ width: '6px', height: '6px' }} />
                <span className="dot" style={{ width: '6px', height: '6px' }} />
              </div>
            </div>
          )}

          {/* ── TRANSCRIPT PANEL ── */}
          {(inputText || isRecording || isTranscribing) && (
            <div style={{
              marginTop: 'auto',
              background: '#131313',
              border: `1px solid ${isRecording ? '#C86060' : isTranscribing ? '#C8B89A44' : '#2A2A2A'}`,
              borderRadius: '16px', padding: '20px 24px',
              transition: 'border-color 0.4s',
            }}>

              {/* Status row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isRecording ? '20px' : '14px' }}>
                {isRecording && (
                  <>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C86060', flexShrink: 0, animation: 'mic-pulse 1.5s infinite' }} />
                    <span style={{ fontSize: '11px', color: '#C86060', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>Recording</span>
                    <span style={{ fontSize: '11px', color: '#3A3A3A', marginLeft: 'auto' }}>Click stop when done</span>
                  </>
                )}
                {isTranscribing && (
                  <>
                    <Loader2 size={14} color="#C8B89A" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: '#C8B89A', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>Transcribing with Whisper…</span>
                  </>
                )}
                {!isRecording && !isTranscribing && inputText && (
                  <>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4E9B6F', flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: '#4E9B6F', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>Transcript Ready</span>
                    <span style={{ fontSize: '11px', color: '#3A3A3A', marginLeft: 'auto' }}>Edit or press Enter to send</span>
                  </>
                )}
              </div>

              {/* Body */}
              {isRecording && (
                // Animated waveform bars — no text, no noise
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '36px' }}>
                  {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.45, 0.75, 1, 0.5, 0.65].map((h, i) => (
                    <div key={i} style={{
                      flex: 1, background: '#C86060', borderRadius: '3px',
                      height: `${h * 100}%`, opacity: 0.6,
                      animation: `wave ${0.8 + i * 0.1}s ease-in-out ${i * 0.07}s infinite alternate`,
                    }} />
                  ))}
                </div>
              )}

              {isTranscribing && (
                <div style={{ fontSize: '15px', color: '#3A3A3A', fontStyle: 'italic', lineHeight: '1.5' }}>
                  Processing audio with Whisper…
                </div>
              )}

              {!isRecording && !isTranscribing && inputText && (
                <div style={{ fontSize: '18px', color: '#F0EDE8', lineHeight: '1.65' }}>
                  {inputText}
                </div>
              )}
            </div>
          )}

          <style>{`
            @keyframes wave {
              from { transform: scaleY(0.3); }
              to   { transform: scaleY(1); }
            }
          `}</style>

          <div ref={chatEndRef} />
        </div>
      </main>

      {/* ── ERROR BANNERS ── */}
      <div style={{ position: 'fixed', bottom: '160px', left: 0, right: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
        {(errorObj || micError) && (
          <div style={{
            pointerEvents: 'auto',
            background: '#1A1A1A', border: '1px solid #C86060', color: '#C86060',
            borderRadius: '10px', padding: '12px 20px', fontSize: '13px',
            maxWidth: '500px', display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <span>{micError || errorObj?.message || errorObj}</span>
            <button
              onClick={() => { setErrorObj(null); setMicError(null); }}
              style={{ background: 'none', border: 'none', color: '#C86060', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
            >×</button>
          </div>
        )}
        {showLengthError && (
          <div style={{ pointerEvents: 'auto', background: '#1A1A1A', border: '1px solid #C89A4E', color: '#C89A4E', borderRadius: '10px', padding: '12px 20px', fontSize: '13px' }}>
            Please say a full sentence before sending.
          </div>
        )}
      </div>

      {/* ── CONTROLS FOOTER ── */}
      <footer style={{
        background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid #1E1E1E', padding: '20px 24px',
        flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
      }}>

        {/* Text input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '640px' }}>
          <input
            autoFocus
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !isTranscribing) handleSend(); }}
            placeholder={isTranscribing ? 'Transcribing with Whisper…' : 'Type your response or use the mic below…'}
            disabled={isTranscribing || isRecording}
            style={{
              flex: 1, background: '#1A1A1A',
              border: `1px solid ${isTranscribing ? '#3A3A3A' : '#2A2A2A'}`,
              color: isTranscribing ? '#605850' : '#F0EDE8',
              padding: '12px 16px', borderRadius: '8px',
              outline: 'none', fontSize: '15px',
              transition: 'all 0.2s',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading || isTranscribing || isRecording}
            style={{
              background: inputText.trim() && !isLoading && !isBusy ? '#C8B89A' : '#1A1A1A',
              color: inputText.trim() && !isLoading && !isBusy ? '#0F0F0F' : '#605850',
              border: 'none',
              cursor: inputText.trim() && !isLoading && !isBusy ? 'pointer' : 'not-allowed',
              padding: '12px 20px', borderRadius: '8px',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500',
            }}
          >
            Send <Navigation2 size={16} />
          </button>
        </div>

        {/* Mic row */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '640px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: '#1E1E1E' }} />

          {/* Mic button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={micState === 'recording' ? stopRecording : micState === 'idle' ? startRecording : undefined}
              disabled={isLoading || isTranscribing}
              style={{
                width: '56px', height: '56px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.25s', ...micButtonStyle,
              }}
              onMouseOver={e => { if (micState === 'idle') { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = '#2A2A2A'; } }}
              onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; if (micState === 'idle') e.currentTarget.style.background = '#1E1E1E'; }}
            >
              {isTranscribing
                ? <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                : isRecording
                ? <Square size={20} fill="currentColor" />
                : <Mic size={22} />}
            </button>

            {/* Status label under mic */}
            <span style={{
              fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase',
              color: isRecording ? '#C86060' : isTranscribing ? '#C8B89A' : '#3A3A3A',
              transition: 'color 0.3s',
            }}>
              {micLabel}
            </span>
          </div>

          <div style={{ flex: 1, height: '1px', background: '#1E1E1E' }} />
        </div>
      </footer>

      {/* Spinner keyframe — injected inline via a style tag */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default Simulation;
