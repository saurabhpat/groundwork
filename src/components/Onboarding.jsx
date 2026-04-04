import React, { useEffect, useRef, useState } from 'react';
import { useOnboardingChat, ONBOARDING_STEPS } from '../hooks/useOnboardingChat';
import { generatePersona } from '../utils/personaEngine';
import { LayoutDashboard, ArrowRight, Check, AlertTriangle, Loader2, Pencil } from 'lucide-react';

const getGroqKey = () => localStorage.getItem('VITE_GROQ_API_KEY') || import.meta.env.VITE_GROQ_API_KEY;

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total, isComplete }) {
  return (
    <div style={{ display: 'flex', gap: '5px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: '2px', borderRadius: '2px',
          background: isComplete || i < current ? '#C8B89A' : i === current ? 'rgba(200,184,154,0.25)' : '#1E1E1E',
          transition: 'background 0.5s ease',
        }} />
      ))}
    </div>
  );
}

// ─── Completed step — clickable answer chip to edit ──────────────────────────
function CompletedStep({ question, answer, onEdit }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '15px', color: '#3A3A3A', fontWeight: '300', lineHeight: '1.5' }}>
        {question}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onEdit}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            background: hovered ? 'rgba(200,184,154,0.12)' : 'rgba(200,184,154,0.07)',
            border: `1px solid ${hovered ? 'rgba(200,184,154,0.35)' : 'rgba(200,184,154,0.18)'}`,
            borderRadius: '10px 10px 2px 10px',
            padding: '9px 14px',
            color: hovered ? '#C8B89A' : '#A09080',
            fontSize: '13px',
            maxWidth: '88%',
            lineHeight: '1.5',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px',
            textAlign: 'left',
            transition: 'all 0.15s ease',
            fontFamily: 'inherit',
          }}
        >
          <span style={{ flex: 1 }}>{answer}</span>
          {hovered && <Pencil size={11} color="#C8B89A" style={{ flexShrink: 0, opacity: 0.8 }} />}
        </button>
      </div>
    </div>
  );
}

// ─── Suggestion chip ──────────────────────────────────────────────────────────
function SuggestionChip({ label, isSelected, isMulti, onClick }) {
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
        background: isSelected ? 'rgba(200,184,154,0.09)' : hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        border: `1.5px solid ${isSelected ? '#C8B89A' : hovered ? '#383838' : '#242424'}`,
        borderRadius: '10px', cursor: 'pointer',
        color: isSelected ? '#F0EDE8' : hovered ? '#C8C4C0' : '#807870',
        fontSize: '14px', textAlign: 'left', lineHeight: '1.4',
        transition: 'all 0.15s ease', fontFamily: 'inherit',
      }}
    >
      <span>{label}</span>
      {isMulti ? (
        <div style={{
          width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
          border: `1.5px solid ${isSelected ? '#C8B89A' : '#383838'}`,
          background: isSelected ? 'rgba(200,184,154,0.18)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
        }}>
          {isSelected && <Check size={10} color="#C8B89A" strokeWidth={3} />}
        </div>
      ) : (
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
          background: isSelected ? '#C8B89A' : 'transparent',
          border: `1.5px solid ${isSelected ? '#C8B89A' : '#383838'}`, transition: 'all 0.15s',
        }} />
      )}
    </button>
  );
}

// ─── Active step ──────────────────────────────────────────────────────────────
function ActiveStep({ step, selectedOptions, customText, setCustomText, onToggle, onSubmit, canSubmit, isSynthesizing }) {
  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ fontSize: '22px', color: '#F0EDE8', fontWeight: '300', lineHeight: '1.55', marginBottom: step.hint ? '8px' : '0' }}>
          {step.message}
        </div>
        {step.hint && <div style={{ fontSize: '12px', color: '#505050', lineHeight: '1.5', letterSpacing: '0.01em' }}>{step.hint}</div>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {step.suggestions.map(s => (
          <SuggestionChip key={s} label={s} isSelected={selectedOptions.has(s)} isMulti={step.isMulti} onClick={() => onToggle(s)} />
        ))}
      </div>

      <input
        type="text" value={customText}
        onChange={e => setCustomText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && canSubmit && !isSynthesizing) onSubmit(); }}
        placeholder={step.placeholder}
        style={{
          width: '100%', background: 'transparent', border: '1px dashed #252525',
          borderRadius: '10px', padding: '12px 16px', color: '#F0EDE8', fontSize: '14px',
          outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s',
        }}
        onFocus={e => e.target.style.borderColor = '#3A3A3A'}
        onBlur={e => e.target.style.borderColor = '#252525'}
      />

      <button
        onClick={onSubmit} disabled={!canSubmit || isSynthesizing}
        style={{
          width: '100%', padding: '15px 20px',
          background: canSubmit && !isSynthesizing ? '#C8B89A' : '#181818',
          color: canSubmit && !isSynthesizing ? '#0F0F0F' : '#3A3A3A',
          border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
          cursor: canSubmit && !isSynthesizing ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
        }}
        onMouseOver={e => { if (canSubmit && !isSynthesizing) e.currentTarget.style.background = '#D8C8AA'; }}
        onMouseOut={e => { if (canSubmit && !isSynthesizing) e.currentTarget.style.background = '#C8B89A'; }}
      >
        {isSynthesizing
          ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Building your profile…</>
          : <>Continue <ArrowRight size={15} /></>}
      </button>
    </div>
  );
}

function SynthesisLoader() {
  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ fontSize: '20px', color: '#605850', fontWeight: '300' }}>Reading between the lines…</div>
      <div style={{ background: 'rgba(26,26,26,0.5)', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '14px 20px', display: 'inline-flex', gap: '5px', alignItems: 'center' }}>
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
      <div style={{ fontSize: '20px', color: '#F0EDE8', fontWeight: '300', lineHeight: '1.7' }}>
        {finalProfile.summary_message}
      </div>
      <div style={{ background: '#111111', border: '1px solid #1E1E1E', borderRadius: '14px', overflow: 'hidden' }}>
        {[
          { label: 'Scenario', value: finalProfile.scenario },
          { label: 'Talking To', value: finalProfile.relationshipContext },
          { label: 'Specific Context', value: finalProfile.actualSituation },
          { label: 'Core Fear', value: finalProfile.communicationFear },
          { label: 'Experience', value: finalProfile.experienceLevel === 'never' ? 'First attempt' : finalProfile.experienceLevel === 'tried_failed' ? "Tried before — didn't go well" : 'Ongoing — but it costs you' },
          { label: 'What You Want', value: finalProfile.practiceGoal },
        ].map(({ label, value }, i, arr) => (
          <div key={label} style={{ padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid #1A1A1A' : 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '10px', color: '#383838', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{label}</div>
            <div style={{ fontSize: '14px', color: '#C8B89A', lineHeight: '1.4' }}>{value}</div>
          </div>
        ))}
      </div>
      {error && <div style={{ background: '#1A0F0F', border: '1px solid #C86060', borderRadius: '8px', padding: '12px 16px', color: '#C86060', fontSize: '13px' }}>{error}</div>}
      <button
        onClick={onLaunch} disabled={isLoading}
        style={{
          width: '100%', padding: '17px', background: '#C8B89A', color: '#0F0F0F',
          border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          transition: 'all 0.2s', opacity: isLoading ? 0.7 : 1,
        }}
        onMouseOver={e => { if (!isLoading) { e.currentTarget.style.background = '#D8C8AA'; e.currentTarget.style.transform = 'scale(1.01)'; } }}
        onMouseOut={e => { e.currentTarget.style.background = '#C8B89A'; e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {isLoading ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />Designing your scenario…</> : <>See My Practice Brief <ArrowRight size={17} /></>}
      </button>
      <p style={{ textAlign: 'center', fontSize: '12px', color: '#303030', lineHeight: '1.5', margin: 0 }}>
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

  // Generate persona → route to coaching brief
  const handleLaunch = async () => {
    if (!finalProfile) return;
    const key = getGroqKey();
    if (!key) { setLaunchError('Groq API Key missing — please configure it in settings.'); return; }
    setLaunchLoading(true);
    setLaunchError(null);
    try {
      const generatedPersona = await generatePersona(key, finalProfile);
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
          practicePhase: 1, // will be confirmed/updated by CoachingBrief
        },
        persona: generatedPersona,
        phase: 'coaching', // ← go to CoachingBrief, not simulation
        turnCount: 0,
        conversationHistory: [],
      }));
    } catch (err) {
      setLaunchError(`Failed to generate scenario: ${err.message}`);
      setLaunchLoading(false);
    }
  };

  if (launchLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F0F0F' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 28px' }} />
          <p style={{ color: '#F0EDE8', fontSize: '18px', fontWeight: '300' }}>Building your scenario…</p>
          <p style={{ color: '#505050', fontSize: '13px', marginTop: '8px' }}>Designing your counterpart and opening moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0F0F0F', height: '100%', display: 'flex', flexDirection: 'column' }}>

      <div style={{ padding: '18px 24px 14px', flexShrink: 0, borderBottom: '1px solid #141414', background: 'rgba(15,15,15,0.9)', backdropFilter: 'blur(8px)' }}>
        <button
          onClick={() => setAppState(prev => ({ ...prev, phase: 'profile' }))}
          style={{ background: 'transparent', border: 'none', color: '#404040', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '16px', transition: 'color 0.2s', padding: 0 }}
          onMouseOver={e => e.currentTarget.style.color = '#808080'}
          onMouseOut={e => e.currentTarget.style.color = '#404040'}
        >
          <LayoutDashboard size={13} /> Dashboard
        </button>
        <ProgressBar current={currentStep} total={ONBOARDING_STEPS.length} isComplete={phase === 'complete'} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <span style={{ fontSize: '11px', color: '#303030', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Find your scenario</span>
          <span style={{ fontSize: '11px', color: '#303030' }}>{phase === 'complete' ? '✓ Done' : `${currentStep + 1} of ${ONBOARDING_STEPS.length}`}</span>
        </div>
      </div>

      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 24px 48px' }}>
        <div style={{ maxWidth: '540px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '36px' }}>

          {/* Completed steps — each answer chip is clickable to edit */}
          {completedSteps.map((s, idx) => (
            <CompletedStep key={idx} question={s.question} answer={s.answer} onEdit={() => goToStep(idx)} />
          ))}

          {phase === 'onboarding' && step && (
            <ActiveStep step={step} selectedOptions={selectedOptions} customText={customText} setCustomText={setCustomText} onToggle={toggleOption} onSubmit={submitCurrentStep} canSubmit={canSubmit} isSynthesizing={false} />
          )}

          {phase === 'synthesizing' && <SynthesisLoader />}

          {phase === 'complete' && finalProfile && (
            <FinalScreen finalProfile={finalProfile} onLaunch={handleLaunch} isLoading={launchLoading} error={launchError} />
          )}

          {error && (
            <div style={{ background: '#1A0F0F', border: '1px solid #C86060', borderRadius: '8px', padding: '14px 16px', color: '#C86060', fontSize: '13px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ flex: 1 }}>{error}</span>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#C86060', cursor: 'pointer', fontSize: '16px' }}>×</button>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      {isDistress && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#1A1A1A', border: '1px solid #C89A4E', borderRadius: '12px', padding: '14px 18px', maxWidth: '480px', width: 'calc(100% - 48px)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 30, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
          <AlertTriangle size={16} color="#C89A4E" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#C89A4E', lineHeight: '1.5', flex: 1 }}>It sounds like this topic is weighing on you. Take a breath — we'll go at your pace.</span>
          <button onClick={dismissDistress} style={{ background: 'none', border: 'none', color: '#605850', cursor: 'pointer', fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Onboarding;
