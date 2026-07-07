import React, { useState, useEffect } from 'react';
import { robustGenerate } from '../utils/aiClient';
import { generatePersona } from '../utils/personaEngine';
import { getScenarioSessionCount } from '../utils/supabaseSession';
import { ArrowRight, Loader2, X, Check, Lock, ChevronRight, LayoutDashboard, Zap, Activity, UserCircle } from 'lucide-react';

// ─── Phase auto-advancement thresholds ───────────────────────────────────────
function computePracticePhase(sessionCount) {
  if (sessionCount < 2) return 1;
  if (sessionCount < 4) return 2;
  return 3;
}

// Session count is now fetched from Supabase inside the component

const COACHING_BRIEF_SYSTEM = `You are a professional communication coach for Groundwork.
Generate scenario-specific pre-practice coaching content to help a user prepare for a difficult conversation.

Return ONLY this JSON:
{
  "failure_patterns": ["string", "string", "string"],
  "success_signals": ["string", "string", "string"],
  "key_principle": "short principle"
}`;

const PHASES = [
  { number: 1, label: 'Build the Framework', description: 'Coaching hints active during simulation.', guidanceBadge: 'Hints: On', duration: '~10 min' },
  { number: 2, label: 'Tone & Confidence', description: 'Focus on how it lands. Realistic reactions.', guidanceBadge: 'Hints: Reduced', duration: '~10 min' },
  { number: 3, label: 'Full Simulation', description: 'Pure realism. No hints. Just you.', guidanceBadge: 'Hints: Off', duration: '~10 min' },
];

export function CoachingBrief({ appState, setAppState }) {
  const { userProfile } = appState;
  const scenario = userProfile.scenario;
  const userId = appState.user?.id;

  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    if (userId && scenario) {
      getScenarioSessionCount(userId, scenario).then(count => setSessionCount(count));
    }
  }, [userId, scenario]);

  const practicePhase = computePracticePhase(sessionCount);

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [launchLoading, setLaunchLoading] = useState(false);
  const [launchError, setLaunchError] = useState(null);

  // Calibration State
  const [powerDynamic, setPowerDynamic] = useState('Peer');
  const [stressLevel, setStressLevel] = useState(30);
  const [disposition, setDisposition] = useState('Receptive');

  useEffect(() => {
    generateBrief();
  }, [scenario]);

  const generateBrief = async () => {
    setLoading(true);
    setError(null);
    try {
      const userContext = `SCENARIO: ${scenario}\nGOAL: ${userProfile.practiceGoal}\nFEAR: ${userProfile.communicationFear}`;
      const data = await robustGenerate({
        systemInstruction: COACHING_BRIEF_SYSTEM,
        contents: [{ role: 'user', parts: [{ text: userContext }] }],
        thermal: 0.2,
      });
      setContent(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getGroqKey = () => sessionStorage.getItem('GROQ_API_KEY') || import.meta.env.VITE_GROQ_API_KEY;

  const launchSimulation = async (skipPhase = false) => {
    const key = getGroqKey();
    if (!key) { setLaunchError('Groq API Key missing.'); return; }

    setLaunchLoading(true);
    setLaunchError(null);

    // Build profile WITH calibration settings so persona respects them
    const calibratedProfile = {
      ...appState.userProfile,
      practicePhase: skipPhase ? 3 : practicePhase,
      powerDynamic,
      stressLevel,
      counterpartDisposition: disposition,
    };

    try {
      const generatedPersona = await generatePersona(key, calibratedProfile);
      setAppState(prev => ({
        ...prev,
        userProfile: calibratedProfile,
        persona: generatedPersona,
        phase: 'simulation',
      }));
    } catch (err) {
      setLaunchError(`Failed to generate scenario: ${err.message}`);
      setLaunchLoading(false);
    }
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}><div className="spinner" /></div>;

  if (launchLoading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 28px' }} />
        <p style={{ color: '#111827', fontSize: '18px', fontWeight: '300' }}>Building your scenario…</p>
        <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '8px' }}>Designing your counterpart and opening moment.</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#111827' }}>
      <header style={{ padding: '18px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => setAppState(prev => ({ ...prev, phase: 'profile' }))} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', textTransform: 'uppercase' }}>
          <LayoutDashboard size={14} /> Dashboard
        </button>
        <span style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Coaching Brief</span>
        <div style={{ width: '80px' }} />
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '40px 24px 100px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '44px' }}>
          
          <div className="animate-in">
            <h1 style={{ fontSize: '28px', fontWeight: '300', marginBottom: '8px' }}>Prepare for Impact.</h1>
            <p style={{ color: '#6B7280', fontSize: '15px' }}>Calibrate the simulation to match your real-world challenge.</p>
          </div>

          {/* CALIBRATION PANEL (Screenshot 2 Style) */}
          <section className="animate-in" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* POWER DYNAMIC */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Zap size={14} color="#1D4ED8" />
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280' }}>Who has more authority in this conversation?</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: '#F3F4F6', padding: '4px', borderRadius: '10px' }}>
                {['Junior/Associate', 'Peer', 'Manager/Supervisor'].map(opt => (
                  <button key={opt} onClick={() => setPowerDynamic(opt)} style={{
                    padding: '10px', borderRadius: '8px', border: 'none', fontSize: '13px', cursor: 'pointer',
                    background: powerDynamic === opt ? '#FFFFFF' : 'transparent',
                    color: powerDynamic === opt ? '#1D4ED8' : '#6B7280',
                    transition: '0.2s'
                  }}>{opt}</button>
                ))}
              </div>
            </div>

            {/* STRESS LEVEL */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={14} color="#1D4ED8" />
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280' }}>Stress Level</span>
                </div>
                <span style={{ fontSize: '12px', color: '#1D4ED8', fontWeight: '600' }}>{stressLevel > 80 ? 'Critical' : stressLevel > 50 ? 'High' : stressLevel > 20 ? 'Medium' : 'Low'}</span>
              </div>
              <input type="range" min="1" max="4" step="1" value={stressLevel === 100 ? 4 : stressLevel === 50 ? 2 : stressLevel === 10 ? 1 : 3} onChange={e => {
                const val = parseInt(e.target.value);
                setStressLevel(val === 4 ? 100 : val === 3 ? 80 : val === 2 ? 50 : 10);
              }} style={{
                width: '100%', accentColor: '#1D4ED8', height: '4px', cursor: 'pointer'
              }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', marginTop: '8px', fontSize: '9px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span style={{ textAlign: 'left' }}>Low</span>
                <span style={{ textAlign: 'center', marginLeft: '-15%' }}>Medium</span>
                <span style={{ textAlign: 'center', marginLeft: '15%' }}>High</span>
                <span style={{ textAlign: 'right' }}>Critical</span>
              </div>
            </div>

            {/* DISPOSITION */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <UserCircle size={14} color="#1D4ED8" />
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280' }}>how would you like your conversation counterpart to behave like?</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {['Receptive', 'Neutral', 'Defensive', 'Hostile'].map(opt => (
                  <button key={opt} onClick={() => setDisposition(opt)} style={{
                    padding: '12px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
                    background: disposition === opt ? 'rgba(29,78,216,0.06)' : '#F3F4F6',
                    border: `1px solid ${disposition === opt ? '#1D4ED8' : '#E5E7EB'}`,
                    color: disposition === opt ? '#111827' : '#6B7280',
                    transition: '0.2s'
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: disposition === opt ? (opt === 'Hostile' ? '#EF4444' : '#10B981') : '#E5E7EB' }} />
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* PHASE CARDS */}
          <div className="animate-in">
             <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', marginBottom: '16px' }}>Practice Structure</div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               {PHASES.map(p => (
                 <div key={p.number} style={{
                    padding: '16px', borderRadius: '12px', border: `1.5px solid ${p.number === practicePhase ? '#1D4ED8' : '#E5E7EB'}`,
                    background: p.number === practicePhase ? 'rgba(29, 78, 216, 0.06)' : 'transparent',
                   opacity: p.number > practicePhase ? 0.4 : 1
                 }}>
                     <div style={{ fontSize: '14px', fontWeight: '500', color: p.number === practicePhase ? '#111827' : '#6B7280' }}>Phase {p.number} — {p.label}</div>
                     <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>{p.description}</div>
                 </div>
               ))}
             </div>
          </div>

          {/* CTAs */}
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={() => launchSimulation(false)} style={{
              width: '100%', padding: '18px', background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 14px rgba(29,78,216,0.25)'
            }}>
              Start Phase {practicePhase} <ArrowRight size={17} />
            </button>
            {launchError && <div style={{ background: '#FEF2F2', border: '1px solid #DC2626', borderRadius: '8px', padding: '12px 16px', color: '#DC2626', fontSize: '13px' }}>{launchError}</div>}
            <button onClick={() => launchSimulation(true)} style={{
              width: '100%', padding: '14px', background: 'transparent', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '13px', cursor: 'pointer'
            }}>Skip to Full Simulation</button>
          </div>

        </div>
      </main>
    </div>
  );
}

export default CoachingBrief;
