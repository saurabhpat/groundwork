import React, { useEffect, useRef, useState } from 'react';
import { useOnboardingChat, ONBOARDING_STEPS } from '../hooks/useOnboardingChat';
import { useWhisperInput } from '../hooks/useWhisperInput';
import { LayoutDashboard, ArrowRight, Check, AlertTriangle, Loader2, Pencil, Mic, Square } from 'lucide-react';

const getGroqKey = () =>
  sessionStorage.getItem('GROQ_API_KEY') || import.meta.env.VITE_GROQ_API_KEY;

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total, isComplete }) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: '3px', borderRadius: '3px',
          background: isComplete || i < current ? '#1D4ED8' : i === current ? 'rgba(29,78,216,0.3)' : '#E5E7EB',
          transition: 'background 0.5s ease',
        }} />
      ))}
    </div>
  );
}

// ─── Completed step chip ───────────────────────────────────────────────────────
function CompletedStep({ question, answer, onEdit }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '15px', color: '#6B7280', fontWeight: '300', lineHeight: '1.5' }}>
        {question}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onEdit}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            background: hovered ? 'rgba(29,78,216,0.12)' : 'rgba(29,78,216,0.06)',
            border: `1px solid ${hovered ? 'rgba(29,78,216,0.35)' : 'rgba(29,78,216,0.15)'}`,
            borderRadius: '10px 10px 2px 10px',
            padding: '9px 14px',
            color: hovered ? '#1D4ED8' : '#6B7280',
            fontSize: '13px',
            maxWidth: '90%',
            lineHeight: '1.5',
            cursor: 'pointer',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            textAlign: 'left',
            transition: 'all 0.15s ease',
            fontFamily: 'inherit',
          }}
        >
          <span style={{ flex: 1 }}>{answer}</span>
          {hovered && <Pencil size={11} color="#1D4ED8" style={{ flexShrink: 0, opacity: 0.8, marginTop: '2px' }} />}
        </button>
      </div>
    </div>
  );
}

// ─── Suggestion chip ──────────────────────────────────────────────────────────
function SuggestionChip({ label, isSelected, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', padding: '13px 16px',
        background: isSelected ? 'rgba(29,78,216,0.08)' : hovered ? 'rgba(0,0,0,0.02)' : 'transparent',
        border: `1.5px solid ${isSelected ? '#1D4ED8' : hovered ? '#9CA3AF' : '#E5E7EB'}`,
        borderRadius: '10px', cursor: 'pointer',
        color: isSelected ? '#111827' : hovered ? '#111827' : '#6B7280',
        fontSize: '14px', textAlign: 'left', lineHeight: '1.4',
        transition: 'all 0.15s ease', fontFamily: 'inherit',
      }}
    >
      <span>{label}</span>
      <div style={{
        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
        background: isSelected ? '#1D4ED8' : 'transparent',
        border: `1.5px solid ${isSelected ? '#1D4ED8' : '#E5E7EB'}`, transition: 'all 0.15s',
      }} />
    </button>
  );
}

// ─── Active Step (chips + optional mic for context step) ──────────────────────
function ActiveStep({ step, selectedOptions, customText, setCustomText, onToggle, onSubmit, canSubmit, isSynthesizing }) {
  const textareaRef = useRef(null);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsSmallScreen(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 220)}px`;
    }
  }, [customText]);

  // Mic for voice context step
  const onVoiceTranscript = (text) => {
    setCustomText(prev => prev.trim() ? prev.trim() + ' ' + text : text);
  };
  const { isRecording, isTranscribing, error: micError, toggle: toggleMic } = useWhisperInput(onVoiceTranscript);

  const charLimit = step.isVoice ? 600 : 300;

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ fontSize: isSmallScreen ? '19px' : '22px', color: '#111827', fontWeight: '300', lineHeight: '1.55', marginBottom: step.hint ? '8px' : '0' }}>
          {step.message}
        </div>
        {step.hint && (
          <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: '1.6', letterSpacing: '0.01em' }}>{step.hint}</div>
        )}
      </div>

      {/* Chips (only for non-voice steps) */}
      {!step.isVoice && step.suggestions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {step.suggestions.map(s => (
            <SuggestionChip key={s} label={s} isSelected={selectedOptions.has(s)} onClick={() => onToggle(s)} />
          ))}
        </div>
      )}

      {/* Text area */}
      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && canSubmit && !isSynthesizing) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder={step.placeholder || 'Add context…'}
          rows={step.isVoice ? 5 : 2}
          style={{
            width: '100%', background: '#F3F4F6',
            border: `1px solid ${customText.length >= charLimit ? '#DC2626' : '#E5E7EB'}`,
            borderRadius: '16px', padding: step.isVoice ? '20px 20px 48px' : '16px 20px',
            color: '#111827', fontSize: '15px',
            outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'all 0.2s',
            resize: 'none', overflowY: 'auto',
            minHeight: step.isVoice ? '140px' : '80px', lineHeight: '1.6',
          }}
          onFocus={e => { if (customText.length < charLimit) e.target.style.borderColor = '#1D4ED8'; }}
          onBlur={e => { if (customText.length < charLimit) e.target.style.borderColor = '#E5E7EB'; }}
        />

        {/* Mic button inside textarea for voice step */}
        {step.isVoice && (
          <button
            onClick={toggleMic}
            disabled={isTranscribing}
            style={{
              position: 'absolute', bottom: '12px', right: '12px',
              width: '36px', height: '36px', borderRadius: '50%',
              background: isRecording ? '#DC2626' : '#F3F4F6',
              border: `1px solid ${isRecording ? '#DC2626' : '#E5E7EB'}`,
              color: isRecording ? '#FFF' : '#1D4ED8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: isRecording ? '0 0 0 4px rgba(220,38,38,0.2)' : 'none',
            }}
            title={isRecording ? 'Stop recording' : 'Speak your context'}
          >
            {isTranscribing
              ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : isRecording
              ? <Square size={14} fill="currentColor" />
              : <Mic size={14} />}
          </button>
        )}

        <div style={{
          position: 'absolute', right: step.isVoice ? '56px' : '16px', bottom: '-22px',
          fontSize: '10px', color: customText.length >= charLimit ? '#DC2626' : '#9CA3AF',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {customText.length}/{charLimit}
        </div>
      </div>

      {/* Mic error */}
      {micError && (
        <div style={{ fontSize: '12px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={12} /> {micError}
        </div>
      )}

      {/* Voice status */}
      {step.isVoice && (isRecording || isTranscribing) && (
        <div style={{ fontSize: '12px', color: isRecording ? '#DC2626' : '#9CA3AF', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
          {isRecording ? 'Listening… tap mic to stop' : 'Transcribing your voice…'}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!canSubmit || isSynthesizing}
        style={{
          width: '100%', padding: '15px 20px',
          background: canSubmit && !isSynthesizing ? 'linear-gradient(135deg, #1D4ED8, #2563EB)' : '#E5E7EB',
          color: canSubmit && !isSynthesizing ? '#FFFFFF' : '#9CA3AF',
          border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
          cursor: canSubmit && !isSynthesizing ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
          boxShadow: canSubmit && !isSynthesizing ? '0 4px 14px rgba(29,78,216,0.25)' : 'none',
        }}
        onMouseOver={e => { if (canSubmit && !isSynthesizing) e.currentTarget.style.background = 'linear-gradient(135deg, #1E40AF, #1D4ED8)'; }}
        onMouseOut={e => { if (canSubmit && !isSynthesizing) e.currentTarget.style.background = 'linear-gradient(135deg, #1D4ED8, #2563EB)'; }}
      >
        {isSynthesizing
          ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Building your profile…</>
          : <>{step.isVoice ? 'Build My Scenario' : 'Continue'} <ArrowRight size={15} /></>}
      </button>
    </div>
  );
}

function SynthesisLoader() {
  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', padding: '40px 0' }}>
      <div style={{ fontSize: '20px', color: '#6B7280', fontWeight: '300', textAlign: 'center' }}>Reading between the lines…</div>
      <div style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px 20px', display: 'inline-flex', gap: '5px', alignItems: 'center' }}>
        <span className="dot" style={{ width: '6px', height: '6px' }} />
        <span className="dot" style={{ width: '6px', height: '6px' }} />
        <span className="dot" style={{ width: '6px', height: '6px' }} />
      </div>
    </div>
  );
}

function FinalScreen({ finalProfile, onLaunch, isLoading, error }) {
  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ fontSize: '20px', color: '#111827', fontWeight: '300', lineHeight: '1.7' }}>
        {finalProfile.summary_message}
      </div>
      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '14px', overflow: 'hidden' }}>
        {[
          { label: 'Scenario', value: finalProfile.scenario },
          { label: 'Talking To', value: finalProfile.relationshipContext },
          { label: 'Your Context', value: finalProfile.actualSituation },
          { label: 'Core Fear', value: finalProfile.communicationFear },
          { label: 'What You Want', value: finalProfile.practiceGoal },
        ].map(({ label, value }, i, arr) => (
          <div key={label} style={{ padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid #E5E7EB' : 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{label}</div>
            <div style={{ fontSize: '14px', color: '#1D4ED8', lineHeight: '1.4' }}>{value}</div>
          </div>
        ))}
      </div>
      {error && <div style={{ background: '#FEF2F2', border: '1px solid #DC2626', borderRadius: '8px', padding: '12px 16px', color: '#DC2626', fontSize: '13px' }}>{error}</div>}
      <button
        onClick={onLaunch}
        disabled={isLoading}
        style={{
          width: '100%', padding: '17px', background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: '#FFFFFF',
          border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          transition: 'all 0.2s', opacity: isLoading ? 0.7 : 1,
          boxShadow: '0 8px 24px rgba(29,78,216,0.3)',
        }}
        onMouseOver={e => { if (!isLoading) { e.currentTarget.style.background = 'linear-gradient(135deg, #1E40AF, #1D4ED8)'; e.currentTarget.style.transform = 'scale(1.01)'; } }}
        onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #1D4ED8, #2563EB)'; e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {isLoading ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />Designing your scenario…</> : <>See My Practice Brief <ArrowRight size={17} /></>}
      </button>
      <p style={{ textAlign: 'center', fontSize: '12px', color: '#6B7280', lineHeight: '1.5', margin: 0 }}>
        We'll walk you through what to expect before starting. You can end any time.
      </p>
    </div>
  );
}

// ─── Root Onboarding component ────────────────────────────────────────────────
export function Onboarding({ appState, setAppState }) {
  const {
    currentStep, completedSteps, selectedOptions, customText, setCustomText,
    phase, finalProfile, error, setError, isDistress, dismissDistress,
    step, isLastStep, toggleOption, submitCurrentStep, canSubmit, goToStep,
  } = useOnboardingChat();

  const [launchLoading, setLaunchLoading] = useState(false);
  const [launchError, setLaunchError] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentStep, phase]);

  const handleLaunch = async () => {
    if (!finalProfile) return;
    const key = getGroqKey();
    if (!key) { setLaunchError('Groq API Key missing — please configure it in Settings.'); return; }
    // Don't generate persona here — defer to CoachingBrief where calibration is set
    setAppState(prev => ({
      ...prev,
      userProfile: {
        whoAreYou: finalProfile.whoAreYou,
        practiceGoal: finalProfile.practiceGoal,
        scenario: finalProfile.scenario,
        relationshipContext: finalProfile.relationshipContext,
        communicationFear: finalProfile.communicationFear,
        actualSituation: finalProfile.actualSituation,
        experienceLevel: finalProfile.experienceLevel,
        practicePhase: 1,
      },
      persona: null, // Persona generated in CoachingBrief after calibration
      phase: 'coaching',
      turnCount: 0,
      conversationHistory: [],
    }));
  };

  if (launchLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 28px' }} />
          <p style={{ color: '#111827', fontSize: '18px', fontWeight: '300' }}>Building your scenario…</p>
          <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '8px' }}>Designing your counterpart and opening moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#FFFFFF', height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Sticky header */}
      <div style={{
        padding: '18px 24px 14px', flexShrink: 0, borderBottom: '1px solid #E5E7EB',
        background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => setAppState(prev => ({ ...prev, phase: 'profile' }))}
          style={{ background: 'transparent', border: 'none', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '16px', transition: 'color 0.2s', padding: 0 }}
          onMouseOver={e => e.currentTarget.style.color = '#111827'}
          onMouseOut={e => e.currentTarget.style.color = '#6B7280'}
        >
          <LayoutDashboard size={13} /> Dashboard
        </button>
        <ProgressBar current={currentStep} total={ONBOARDING_STEPS.length} isComplete={phase === 'complete'} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Find your scenario</span>
          <span style={{ fontSize: '11px', color: '#6B7280' }}>
            {phase === 'complete' ? '✓ Done' : `${currentStep + 1} of ${ONBOARDING_STEPS.length}`}
          </span>
        </div>
      </div>

      {/* Scrollable body */}
      <main style={{ flex: 1, overflowY: 'auto', padding: window.innerWidth < 768 ? '24px 16px 60px' : '32px 24px 60px' }}>
        <div style={{ maxWidth: '540px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {completedSteps.map((s, idx) => (
            <CompletedStep key={idx} question={s.question} answer={s.answer} onEdit={() => goToStep(idx)} />
          ))}

          {phase === 'onboarding' && step && (
            <ActiveStep
              step={step}
              selectedOptions={selectedOptions}
              customText={customText}
              setCustomText={setCustomText}
              onToggle={toggleOption}
              onSubmit={submitCurrentStep}
              canSubmit={canSubmit}
              isSynthesizing={false}
            />
          )}

          {phase === 'synthesizing' && <SynthesisLoader />}

          {phase === 'complete' && finalProfile && (
            <FinalScreen finalProfile={finalProfile} onLaunch={handleLaunch} isLoading={launchLoading} error={launchError} />
          )}

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #DC2626', borderRadius: '8px', padding: '14px 16px', color: '#DC2626', fontSize: '13px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ flex: 1 }}>{error}</span>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '16px' }}>×</button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Distress toast */}
      {isDistress && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#FFFFFF', border: '1px solid #1D4ED8', borderRadius: '12px', padding: '14px 18px', maxWidth: '480px', width: 'calc(100% - 48px)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <AlertTriangle size={16} color="#1D4ED8" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#1D4ED8', lineHeight: '1.5', flex: 1 }}>It sounds like this topic is weighing on you. Take a breath — we'll go at your pace.</span>
          <button onClick={dismissDistress} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Onboarding;
