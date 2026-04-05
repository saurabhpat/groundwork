import React, { useState, useEffect } from 'react';
import { robustGenerate } from '../utils/aiClient';
import { ArrowRight, Loader2, X, Check, Lock, ChevronRight, LayoutDashboard, Zap, Activity, UserCircle } from 'lucide-react';

// ─── Phase auto-advancement thresholds ───────────────────────────────────────
function computePracticePhase(sessionCount) {
  if (sessionCount < 2) return 1;
  if (sessionCount < 4) return 2;
  return 3;
}

function getScenarioSessionCount(scenario) {
  const data = JSON.parse(localStorage.getItem('groundwork_phases') || '{}');
  return data[scenario] || 0;
}

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
  const sessionCount = getScenarioSessionCount(scenario);
  const practicePhase = computePracticePhase(sessionCount);

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calibration State
  const [powerDynamic, setPowerDynamic] = useState('Peer');
  const [stressLevel, setStressLevel] = useState(50);
  const [disposition, setDisposition] = useState('Neutral');

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

  const launchSimulation = (skipPhase = false) => {
    setAppState(prev => ({
      ...prev,
      userProfile: {
        ...prev.userProfile,
        practicePhase: skipPhase ? 3 : practicePhase,
        powerDynamic,
        stressLevel,
        counterpartDisposition: disposition,
      },
      phase: 'simulation',
    }));
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F0F0F' }}><div className="spinner" /></div>;

  return (
    <div style={{ background: '#0F0F0F', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#F0EDE8' }}>
      <header style={{ padding: '18px 24px', borderBottom: '1px solid #141414', display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => setAppState(prev => ({ ...prev, phase: 'profile' }))} style={{ background: 'none', border: 'none', color: '#808080', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', textTransform: 'uppercase' }}>
          <LayoutDashboard size={14} /> Dashboard
        </button>
        <span style={{ fontSize: '11px', color: '#808080', textTransform: 'uppercase' }}>Coaching Brief</span>
        <div style={{ width: '80px' }} />
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '40px 24px 100px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '44px' }}>
          
          <div className="animate-in">
            <h1 style={{ fontSize: '28px', fontWeight: '300', marginBottom: '8px' }}>Prepare for Impact.</h1>
            <p style={{ color: '#909090', fontSize: '15px' }}>Calibrate the simulation to match your real-world challenge.</p>
          </div>

          {/* CALIBRATION PANEL (Screenshot 2 Style) */}
          <section className="animate-in" style={{ background: '#131313', border: '1px solid #1E1E1E', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* POWER DYNAMIC */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Zap size={14} color="#C8B89A" />
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#909090' }}>Who has more authority in this conversation?</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: '#0A0A0A', padding: '4px', borderRadius: '10px' }}>
                {['Junior/Associate', 'Peer', 'Manager/Supervisor'].map(opt => (
                  <button key={opt} onClick={() => setPowerDynamic(opt)} style={{
                    padding: '10px', borderRadius: '8px', border: 'none', fontSize: '13px', cursor: 'pointer',
                    background: powerDynamic === opt ? '#1E1E1E' : 'transparent',
                    color: powerDynamic === opt ? '#C8B89A' : '#808080',
                    transition: '0.2s'
                  }}>{opt}</button>
                ))}
              </div>
            </div>

            {/* STRESS LEVEL */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={14} color="#C8B89A" />
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#909090' }}>Stress Level</span>
                </div>
                <span style={{ fontSize: '12px', color: '#C8B89A', fontWeight: '600' }}>{stressLevel > 80 ? 'Critical' : stressLevel > 50 ? 'High' : stressLevel > 20 ? 'Medium' : 'Low'}</span>
              </div>
              <input type="range" min="1" max="4" step="1" value={stressLevel === 100 ? 4 : stressLevel === 50 ? 2 : stressLevel === 10 ? 1 : 3} onChange={e => {
                const val = parseInt(e.target.value);
                setStressLevel(val === 4 ? 100 : val === 3 ? 80 : val === 2 ? 50 : 10);
              }} style={{
                width: '100%', accentColor: '#C8B89A', height: '4px', cursor: 'pointer'
              }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', marginTop: '8px', fontSize: '9px', color: '#707070', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span style={{ textAlign: 'left' }}>Low</span>
                <span style={{ textAlign: 'center', marginLeft: '-15%' }}>Medium</span>
                <span style={{ textAlign: 'center', marginLeft: '15%' }}>High</span>
                <span style={{ textAlign: 'right' }}>Critical</span>
              </div>
            </div>

            {/* DISPOSITION */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <UserCircle size={14} color="#C8B89A" />
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#909090' }}>how would you like your conversation counterpart to behave like?</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {['Receptive', 'Neutral', 'Defensive', 'Hostile'].map(opt => (
                  <button key={opt} onClick={() => setDisposition(opt)} style={{
                    padding: '12px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
                    background: disposition === opt ? 'rgba(200,184,154,0.06)' : '#0A0A0A',
                    border: `1px solid ${disposition === opt ? '#C8B89A' : '#1A1A1A'}`,
                    color: disposition === opt ? '#F0EDE8' : '#808080',
                    transition: '0.2s'
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: disposition === opt ? (opt === 'Hostile' ? '#C86060' : '#4E9B6F') : '#2A2A2A' }} />
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* PHASE CARDS */}
          <div className="animate-in">
             <div style={{ fontSize: '11px', color: '#808080', textTransform: 'uppercase', marginBottom: '16px' }}>Practice Structure</div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               {PHASES.map(p => (
                 <div key={p.number} style={{
                   padding: '16px', borderRadius: '12px', border: `1.5px solid ${p.number === practicePhase ? '#C8B89A' : '#1E1E1E'}`,
                   background: p.number === practicePhase ? 'rgba(200,184,154,0.04)' : 'transparent',
                   opacity: p.number > practicePhase ? 0.4 : 1
                 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: p.number === practicePhase ? '#F0EDE8' : '#808080' }}>Phase {p.number} — {p.label}</div>
                    <div style={{ fontSize: '12px', color: '#808080', marginTop: '4px' }}>{p.description}</div>
                 </div>
               ))}
             </div>
          </div>

          {/* CTAs */}
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={() => launchSimulation(false)} style={{
              width: '100%', padding: '18px', background: '#C8B89A', color: '#0F0F0F', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}>
              Start Phase {practicePhase} <ArrowRight size={17} />
            </button>
            <button onClick={() => launchSimulation(true)} style={{
              width: '100%', padding: '14px', background: 'transparent', color: '#808080', border: '1px solid #1E1E1E', borderRadius: '12px', fontSize: '13px', cursor: 'pointer'
            }}>Skip to Full Simulation</button>
          </div>

        </div>
      </main>
    </div>
  );
}

export default CoachingBrief;
