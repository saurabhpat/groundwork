import React, { useState } from 'react';
import { generatePersona } from '../utils/personaEngine';
import { ArrowRight, Briefcase, Target, Layers, LayoutDashboard } from 'lucide-react';

const getGeminiKey = () => localStorage.getItem('VITE_GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;

export function Onboarding({ appState, setAppState }) {
  const [role, setRole] = useState('Junior Contributor / Associate');
  const [goal, setGoal] = useState('Ask for a promotion or raise');
  const [loading, setLoading] = useState(false);
  const [errorObj, setErrorObj] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const activeKey = getGeminiKey();
    if (!activeKey) {
      setErrorObj("Gemini API Key is missing. Please set it in the API Configuration modal (refresh if needed).");
      return;
    }
    
    setLoading(true);
    setErrorObj(null);
    try {
      const userProfile = { role, goal };
      const generatedPersona = await generatePersona(activeKey, userProfile);

      
      // Update app state smoothly to simulation phase
      setAppState(prev => ({
        ...prev,
        userProfile: { 
          whoAreYou: role,
          practiceGoal: goal,
          scenario: generatedPersona.scenarioSelected || generatedPersona.conversationType 
        },
        persona: generatedPersona,
        phase: 'simulation',
        turnCount: 0,
        conversationHistory: []
      }));
    } catch (err) {
      setErrorObj(`API Connection Failed: ${err.message}. Please check your connection and ensure your API key has access to the chosen models.`);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F0F0F' }}>
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div className="spinner" style={{ margin: '0 auto 24px' }}></div>
          <p style={{ color: '#F0EDE8', fontSize: '18px', fontWeight: '300' }}>
            Designing optimal scenario...
          </p>
          <p style={{ color: '#605850', fontSize: '13px', marginTop: '8px' }}>
             Generating counterpart based on your role + goal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0F0F0F', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '100px 24px 48px' }}>
      {/* GLOBAL DISMISS */}
      <div style={{ position: 'fixed', top: '80px', left: '24px', zIndex: 10 }}>
         <button title="Return to Profile Dashboard" onClick={() => setAppState(prev => ({...prev, phase: 'profile'}))} style={{
            background: 'transparent', border: 'none', color: '#605850', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'color 0.2s'
         }} onMouseOver={e=>e.currentTarget.style.color='#C8B89A'} onMouseOut={e=>e.currentTarget.style.color='#605850'}>
            <LayoutDashboard size={14} /> Dashboard
         </button>
      </div>

      <div className="animate-in" style={{ width: '100%', maxWidth: '480px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '50%', background: '#1A1A1A', border: '1px solid #2A2A2A',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
          }}>
            <Layers size={20} color="#C8B89A" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '300', color: '#F0EDE8', marginBottom: '12px' }}>
            Simulation Setup
          </h1>
          <p style={{ color: '#A09890', fontSize: '15px', lineHeight: '1.5' }}>
            Select your role context and primary objective. The AI architect will instantly structure the rest, mapping you to the exact scenario type.
          </p>
        </div>

        {errorObj && (
          <div style={{ background: '#251818', border: '1px solid #C86060', color: '#C86060', borderRadius: '8px', padding: '16px', marginBottom: '24px', fontSize: '13px' }}>
            {errorObj}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ background: '#1A1A1A', border: '1px solid #1E1E1E', borderRadius: '16px', padding: '32px' }}>
          
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A09890', fontSize: '13px', marginBottom: '12px', fontWeight: '500' }}>
              <Briefcase size={16} /> Current Role & Seniority
            </label>
            <div style={{ position: 'relative' }}>
              <select 
                value={role} onChange={e => setRole(e.target.value)}
                style={{
                  width: '100%', appearance: 'none', background: '#0F0F0F', border: '1px solid #2A2A2A',
                  color: '#F0EDE8', fontSize: '15px', padding: '16px', borderRadius: '8px', outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="Junior Contributor / Associate">Junior Contributor / Associate</option>
                <option value="Mid-level Specialist">Mid-level Specialist</option>
                <option value="Team Lead / Manager">Team Lead / Manager</option>
                <option value="Senior Director / Executive">Senior Director / Executive</option>
                <option value="Founder / CEO">Founder / CEO</option>
              </select>
              <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#605850' }}>▼</div>
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A09890', fontSize: '13px', marginBottom: '12px', fontWeight: '500' }}>
              <Target size={16} /> Primary Goal
            </label>
            <div style={{ position: 'relative' }}>
              <select 
                value={goal} onChange={e => setGoal(e.target.value)}
                style={{
                  width: '100%', appearance: 'none', background: '#0F0F0F', border: '1px solid #2A2A2A',
                  color: '#F0EDE8', fontSize: '15px', padding: '16px', borderRadius: '8px', outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="Ask for a promotion or raise">Ask for a promotion or raise</option>
                <option value="Give critical feedback or bad news">Give critical feedback or bad news</option>
                <option value="Express disagreement or pushback">Express disagreement or pushback</option>
                <option value="Negotiate a tough boundary">Negotiate a tough boundary</option>
                <option value="Navigate a team conflict">Navigate a team conflict</option>
                <option value="Realign client expectations">Realign client expectations</option>
              </select>
              <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#605850' }}>▼</div>
            </div>
          </div>

          <button 
            type="submit"
            style={{
              width: '100%', background: '#C8B89A', color: '#0F0F0F', border: 'none', borderRadius: '10px',
              padding: '16px', fontSize: '15px', fontWeight: '500', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s'
            }}
            onMouseOver={e=>e.currentTarget.style.background='#D8C8AA'}
            onMouseOut={e=>e.currentTarget.style.background='#C8B89A'}
          >
            Launch Scenario <ArrowRight size={18} />
          </button>
        </form>

      </div>
    </div>
  );
}

export default Onboarding;
