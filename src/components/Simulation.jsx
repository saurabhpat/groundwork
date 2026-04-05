import React, { useState, useRef, useEffect } from 'react';
import { useConversation } from '../hooks/useConversation';
import { useWhisperInput } from '../hooks/useWhisperInput';
import { checkDistress, checkSensitiveTopics, checkLength } from '../utils/guardrails';
import { Mic, Square, Navigation2, Activity, X, Loader2, Gauge, Info, AlertTriangle, ShieldCheck } from 'lucide-react';

function Simulation({ appState, setAppState }) {
  const { persona, userProfile, conversationHistory } = appState;
  const [inputText, setInputText] = useState('');
  const [turnCount, setTurnCount] = useState(appState.turnCount || 0);
  const [pauseReason, setPauseReason] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitType, setExitType] = useState('dashboard'); // 'dashboard' | 'feedback'
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const textareaRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);



  const { 
    history, isLoading, errorObj, setErrorObj, sendUserMessage, 
    healthScore, coachingAside, isPaused, setIsPaused, isCompleted 
  } = useConversation({
    persona, userProfile, initialHistory: conversationHistory
  });



  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading, inputText]);

  useEffect(() => {
    if (isCompleted) handleEndSession(true);
  }, [isCompleted]);

  // Sync health and sensitive topics to pause reason
  useEffect(() => {
    if (isPaused && healthScore < 50) {
      setPauseReason('Session stability has dropped. Take a moment to reground.');
    }
  }, [isPaused, healthScore]);

  const onTranscript = (text) => setInputText(prev => prev.trim() ? prev + ' ' + text : text);
  const { isRecording, isTranscribing, error: micError, startRecording, stopRecording } = useWhisperInput(onTranscript);

  const handleSend = () => {
    if (isRecording) stopRecording();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading || isPaused) return;

    // CLIENT-SIDE GUARDRAILS
    if (checkSensitiveTopics(trimmed)) {
      setPauseReason('You mentioned a high-compliance topic. Groundwork recommends involving HR or legal counsel.');
      setIsPaused(true);
      return;
    }
    if (checkDistress(trimmed)) {
      setPauseReason('Let’s take a breath. The simulation is getting a bit heated/stuck.');
      setIsPaused(true);
      return;
    }
    if (!checkLength(trimmed)) return;

    setInputText('');
    sendUserMessage(trimmed);
    setTurnCount(prev => prev + 1);
  };

  const handleEndSession = (isAutoEnd = false) => {
    setAppState(prev => ({
      ...prev,
      conversationHistory: history,
      turnCount: isAutoEnd ? prev.turnCount + 1 : prev.turnCount,
      phase: 'feedback',
    }));
  };

  return (
    <div style={{ height: '100%', display: 'flex', background: '#090909', color: '#F0EDE8' }}>
      
      {/* ── LEFT: CHAT AREA (75%) ── */}
      <section style={{ flex: 3, display: 'flex', flexDirection: 'column', borderRight: '1px solid #1A1A1A' }}>
        
        {/* Header */}
        <header style={{ height: '72px', borderBottom: '1px solid #1A1A1A', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: persona?.avatarColor || '#333', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>{persona?.avatarInitial}</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>{persona?.name}</div>
              <div style={{ fontSize: '10px', color: '#808080', textTransform: 'uppercase' }}>{persona?.role}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

            <button onClick={() => { setExitType('dashboard'); setShowExitConfirm(true); }} style={{ background: 'none', border: 'none', color: '#808080', cursor: 'pointer' }}><X size={20} /></button>
          </div>
        </header>

        {/* Messages */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '40px 0' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {history.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: msg.role === 'model' ? 'flex-start' : 'flex-end', animation: 'fadeIn 0.4s' }}>
                <span style={{ fontSize: '11px', color: '#808080', textTransform: 'uppercase' }}>{msg.role === 'model' ? persona?.name : 'You'}</span>
                <div style={{ 
                  fontSize: msg.role === 'model' ? '20px' : '15px', 
                  color: msg.role === 'model' ? '#F0EDE8' : '#D1C8B8',
                  lineHeight: '1.5',
                  maxWidth: '520px',
                  fontWeight: msg.role === 'model' ? '300' : '400',
                  padding: msg.role === 'model' ? '0' : '12px 18px',
                  background: msg.role === 'model' ? 'transparent' : '#111',
                  borderRadius: '16px 16px 4px 16px',
                  border: msg.role === 'model' ? 'none' : '1px solid #1A1A1A'
                }}>
                  {msg.role === 'model' ? `"${msg.content}"` : msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </main>

        {/* Input */}
        <footer style={{ padding: '24px', background: '#0D0D0D', borderTop: '1px solid #1A1A1A' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea 
                ref={textareaRef}
                value={inputText} 
                onChange={e => setInputText(e.target.value)} 
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isPaused ? "Simulation Paused" : "What is your next move?"}
                disabled={isPaused || isLoading}
                rows={1}
                style={{ 
                  width: '100%', background: '#0D0D0D', 
                  border: '1px solid #1A1A1A', 
                  padding: '14px 20px', borderRadius: '16px', color: '#F0EDE8', outline: 'none',
                  transition: 'all 0.2s', resize: 'none', overflowY: 'auto',
                  minHeight: '46px', lineHeight: '1.5', fontFamily: 'inherit'
                }}
              />
            </div>
            <button 
              onClick={handleSend}
              disabled={isPaused || !inputText.trim() || isLoading}
              style={{ background: inputText.trim() && !isLoading ? '#C8B89A' : '#1A1A1A', color: inputText.trim() && !isLoading ? '#090909' : '#444', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              Send <Navigation2 size={16} />
            </button>
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isPaused || isLoading}
              style={{ background: isRecording ? '#C86060' : '#1A1A1A', color: isRecording ? '#FFF' : '#C8B89A', border: 'none', padding: '0 16px', borderRadius: '10px', cursor: 'pointer' }}
            >
              {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={20} />}
            </button>
          </div>
        </footer>
      </section>

      {/* ── MOBILE: COACH TOGGLE FAB ── */}
      {isMobile && !isPaused && (
        <button 
          onClick={() => setIsCoachOpen(true)}
          style={{ position: 'fixed', right: '16px', bottom: '100px', width: '56px', height: '56px', borderRadius: '28px', background: '#C8B89A', color: '#090909', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 100, cursor: 'pointer' }}
        >
          <Info size={24} />
        </button>
      )}

      {/* ── RIGHT: COACH CONSOLE (Drawer on mobile) ── */}
      <aside style={{ 
        flex: isMobile ? 'none' : 1, 
        background: '#0D0D0D', 
        padding: '32px 24px', 
        display: isMobile && !isCoachOpen ? 'none' : 'flex', 
        flexDirection: 'column', gap: '40px',
        position: isMobile ? 'fixed' : 'relative',
        inset: isMobile ? '0 0 0 0' : 'auto',
        zIndex: isMobile ? 120 : 1,
        borderLeft: isMobile ? 'none' : '1px solid #1A1A1A',
        animation: isMobile ? 'slideUp 0.3s ease-out' : 'none'
      }}>
        {isMobile && (
          <button 
            onClick={() => setIsCoachOpen(false)}
            style={{ alignSelf: 'flex-end', background: 'transparent', border: 'none', color: '#808080', cursor: 'pointer', marginBottom: '-20px' }}
          >
            <X size={24} />
          </button>
        )}
        
        {/* Health Watchdog */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gauge size={14} color="#C8B89A" />
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#808080' }}>Session Stability</span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: healthScore < 60 ? '#C86060' : '#4E9B6F' }}>{healthScore}%</span>
          </div>
          <div style={{ height: '4px', background: '#1A1A1A', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${healthScore}%`, background: healthScore < 60 ? '#C86060' : '#4E9B6F', transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} />
          </div>
          {healthScore < 70 && (
            <p style={{ fontSize: '11px', color: '#C86060', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={12} /> Stance shift detected. Reground your delivery.
            </p>
          )}
        </section>

        {/* Live Coaching Panel */}
        <section style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <Info size={14} color="#C8B89A" />
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#808080' }}>Tactical Guidance</span>
          </div>
          <div style={{ color: '#C8B89A', fontSize: '15px', lineHeight: '1.6', fontStyle: 'italic', background: 'rgba(200,184,154,0.04)', padding: '24px', borderRadius: '16px', borderLeft: '3px solid #C8B89A' }}>
            {isLoading ? (
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Loader2 size={14} className="spin" /> <span>Observing your approach...</span>
               </div>
            ) : (coachingAside || "The counterpart has opened. Focus on articulating your value clearly.")}
          </div>
        </section>

        {/* Calibration Stance */}
        <section style={{ borderTop: '1px solid #1A1A1A', paddingTop: '32px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#808080', marginBottom: '16px' }}>Current Stance</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#808080' }}>Authority Dynamic</span>
              <span style={{ color: '#F0EDE8' }}>{userProfile.powerDynamic}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#808080' }}>Stress</span>
              <span style={{ color: userProfile.stressLevel > 80 ? '#C86060' : '#F0EDE8' }}>{userProfile.stressLevel > 80 ? 'Critical' : 'Balanced'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#707070' }}>Counterpart</span>
              <span style={{ color: userProfile.counterpartDisposition === 'Hostile' ? '#C86060' : '#4E9B6F' }}>{userProfile.counterpartDisposition}</span>
            </div>
          </div>
        </section>

        <button onClick={() => { setExitType('feedback'); setShowExitConfirm(true); }} style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid #1A1A1A', color: '#808080', borderRadius: '12px', fontSize: '12px', cursor: 'pointer', marginTop: 'auto' }}>End Practice Ready</button>
      </aside>

      {/* ── STRATEGIC PAUSE OVERLAY ── */}
      {isPaused && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ maxWidth: '480px', background: '#111', border: '1px solid #1A1A1A', borderRadius: '28px', padding: '48px', textAlign: 'center' }}>
            <ShieldCheck size={56} color="#C8B89A" style={{ margin: '0 auto 28px' }} />
            <h2 style={{ fontSize: '26px', fontWeight: '300', marginBottom: '16px' }}>Strategic Pause</h2>
            <p style={{ color: '#808080', fontSize: '15px', lineHeight: '1.6', marginBottom: '40px' }}>
              {pauseReason || "The simulation has been paused to maintain a focused learning environment. Our guardrails detected a shift in session stability or high-compliance topics."}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => { setIsPaused(false); setPauseReason(null); }} style={{ width: '100%', padding: '18px', background: '#C8B89A', color: '#000', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>Resume Simulation</button>
              <button onClick={() => handleEndSession()} style={{ width: '100%', padding: '16px', background: 'transparent', color: '#808080', border: '1px solid #1A1A1A', borderRadius: '14px', cursor: 'pointer' }}>View Early Debrief</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EXIT CONFIRMATION OVERLAY ── */}
      {showExitConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
          <div style={{ maxWidth: '420px', background: '#111', border: '1px solid #1A1A1A', borderRadius: '28px', padding: '40px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(200,184,154,0.08)', border: '1px solid rgba(200,184,154,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <AlertTriangle size={24} color={exitType === 'dashboard' ? '#C86060' : '#C8B89A'} />
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: '300', marginBottom: '12px', color: '#F0EDE8' }}>
              {exitType === 'dashboard' ? 'Discard Progress?' : 'Finish Session?'}
            </h2>
            
            <p style={{ color: '#808080', fontSize: '14px', lineHeight: '1.6', marginBottom: '32px' }}>
              {exitType === 'dashboard' 
                ? "Exiting now will end this practice. Your current history and feedback for this run will not be saved."
                : "Are you ready to stop practicing and move to your final feedback report?"
              }
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => { 
                  if (exitType === 'dashboard') setAppState(prev => ({ ...prev, phase: 'profile' }));
                  else handleEndSession();
                }} 
                style={{ width: '100%', padding: '16px', background: exitType === 'dashboard' ? '#C86060' : '#C8B89A', color: exitType === 'dashboard' ? '#FFF' : '#000', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
              >
                {exitType === 'dashboard' ? 'Continue and Exit' : 'Submit for Feedback'}
              </button>
              <button 
                onClick={() => setShowExitConfirm(false)} 
                style={{ width: '100%', padding: '16px', background: 'transparent', color: '#808080', border: '1px solid #1A1A1A', borderRadius: '14px', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .spin { animation: spin 1.2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default Simulation;
