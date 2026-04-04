import React, { useState, useEffect } from 'react';
import { Play, TrendingUp, BookOpen, ChevronRight, UserCheck, ShieldCheck, Zap, Target, MessageSquare } from 'lucide-react';
import { FeedbackReport } from './FeedbackReport';

export function Profile({ appState, setAppState }) {
  const [sessions, setSessions] = useState([]);
  const [selectedHistoricalSession, setSelectedHistoricalSession] = useState(null);
  
  useEffect(() => {
    const rawData = JSON.parse(localStorage.getItem('groundwork_sessions') || '[]');
    setSessions(rawData);
  }, []);

  const handleStartPractice = () => {
    setAppState(prev => ({ ...prev, phase: 'onboarding' }));
  };

  // Render a historical report if one is selected
  if (selectedHistoricalSession) {
    return (
      <FeedbackReport 
        appState={{ 
          ...appState, 
          userProfile: { scenario: selectedHistoricalSession.scenario },
          persona: null,
          conversationHistory: selectedHistoricalSession.history || [] 
        }} 
        setAppState={() => setSelectedHistoricalSession(null)} 
        readOnlyReport={selectedHistoricalSession.fullReport} 
      />
    );
  }

  // ─── ZERO STATE: First-time user welcome ───────────────────────────────────
  if (sessions.length === 0) {
    return (
      <div style={{ background: '#0F0F0F', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* hero */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px 180px', textAlign: 'center' }}>
          <div className="animate-in">
            {/* Brand mark */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '18px',
              background: 'linear-gradient(135deg, #1A1A1A, #222)',
              border: '1px solid #2A2A2A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 32px',
              boxShadow: '0 8px 40px rgba(200,184,154,0.08)',
            }}>
              <Zap size={28} color="#C8B89A" />
            </div>

            <h1 style={{ fontSize: '38px', fontWeight: '300', color: '#F0EDE8', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
              Your most important conversation<br />
              <span style={{ color: '#C8B89A' }}>should never be your first practice.</span>
            </h1>

            <p style={{ color: '#807870', fontSize: '16px', lineHeight: '1.7', maxWidth: '500px', margin: '0 auto 56px' }}>
              Practice high-stakes career moments like salary negotiations and team conflicts in a safe space. Walk into the real room with calm confidence and a plan that actually lands.
            </p>

            {/* How it works */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '640px', margin: '0 auto 64px', textAlign: 'left' }}>
              {[
                { icon: <Target size={18} color="#C8B89A" />, label: 'Pick a scenario', sub: 'Choose the conversation you need to master' },
                { icon: <MessageSquare size={18} color="#C8B89A" />, label: 'Simulate it live', sub: 'Speak or type with a realistic AI persona' },
                { icon: <TrendingUp size={18} color="#C8B89A" />, label: 'Get your markers', sub: 'See what landed, what hesitated, one fix' },
              ].map((step, i) => (
                <div key={i} style={{ background: '#111', border: '1px solid #1E1E1E', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ marginBottom: '10px' }}>{step.icon}</div>
                  <div style={{ fontSize: '13px', color: '#F0EDE8', fontWeight: '500', marginBottom: '6px' }}>{step.label}</div>
                  <div style={{ fontSize: '12px', color: '#605850', lineHeight: '1.5' }}>{step.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed bottom CTA — thumb-reach zone */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '24px',
          background: 'linear-gradient(to top, #0F0F0F 70%, transparent)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
        }}>
          <button
            id="start-practice-btn"
            onClick={handleStartPractice}
            style={{
              width: '100%', maxWidth: '420px',
              background: '#C8B89A', color: '#0F0F0F', border: 'none', borderRadius: '14px',
              padding: '18px 24px', fontSize: '16px', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              boxShadow: '0 8px 32px rgba(200,184,154,0.25)',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#D8C8AA'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#C8B89A'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Play size={20} fill="currentColor" /> Start Your First Practice
          </button>
          <p style={{ fontSize: '12px', color: '#605850', margin: 0 }}>2 questions · &lt;30 seconds to start</p>
        </div>
      </div>
    );
  }

  // ─── RETURNING USER: Progress dashboard ───────────────────────────────────
  return (
    <div style={{ background: '#0F0F0F', minHeight: '100vh', padding: '40px 24px 140px' }}>
      <div className="animate-in" style={{ maxWidth: '840px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#605850', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              Your Performance
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '300', color: '#F0EDE8', margin: 0 }}>Progress Engine</h1>
          </div>
        </div>

        {/* META-COACHING */}
        <div style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #111 100%)', padding: '32px', borderRadius: '20px', border: '1px solid #222', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.03 }}>
            <TrendingUp size={160} color="#C8B89A" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C8B89A', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', fontWeight: '600' }}>
            <UserCheck size={14} /> High-Level Marker Analysis
          </div>
          <div style={{ maxWidth: '600px', fontSize: '16px', color: '#F0EDE8', lineHeight: '1.6', fontWeight: '300' }}>
            {sessions.length < 3 
              ? `Continue practicing to unlock cumulative trend analysis. We are currently tracking your rhetorical markers across ${sessions.length} session(s).`
              : `You've completed ${sessions.length} high-stakes simulations. Your ability to anchor conversations in data has improved, though hesitation markers remain a focal point for your next ${sessions[sessions.length-1].difficulty} difficulty session.`
            }
          </div>
        </div>

        {/* KEY TRACKS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '48px' }}>
          <div style={{ background: '#1A1A1A', padding: '24px', borderRadius: '16px', border: '1px solid #1E1E1E' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A09890', fontSize: '11px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <TrendingUp size={14} color="#C8B89A" /> Total Simulations
            </div>
            <div style={{ fontSize: '32px', fontWeight: '300', color: '#F0EDE8' }}>{sessions.length}</div>
          </div>
          <div style={{ background: '#1A1A1A', padding: '24px', borderRadius: '16px', border: '1px solid #1E1E1E' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A09890', fontSize: '11px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <ShieldCheck size={14} color="#4E9B6F" /> Last Intensity
            </div>
            <div style={{ fontSize: '32px', fontWeight: '300', color: '#F0EDE8' }}>{sessions[sessions.length-1].difficulty}</div>
          </div>
        </div>

        {/* ANALYTICAL HISTORY */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#605850', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Analytical History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sessions.slice().reverse().map((s) => (
              <div 
                key={s.id} 
                onClick={() => setSelectedHistoricalSession(s)}
                style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', 
                  padding: '24px', borderRadius: '16px', border: '1px solid #1E1E1E', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#C8B89A'; e.currentTarget.style.background = '#161616'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = '#1E1E1E'; e.currentTarget.style.background = '#111'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '10px', background: '#0F0F0F', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #222'
                  }}>
                    <BookOpen size={18} color="#C8B89A" />
                  </div>
                  <div>
                    <div style={{ color: '#F0EDE8', fontSize: '15px', fontWeight: '500', marginBottom: '4px' }}>{s.scenario}</div>
                    <div style={{ color: '#605850', fontSize: '12px' }}>{new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {s.turns} turns</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', color: s.difficulty === 'Hard' ? '#C86060' : s.difficulty === 'Medium' ? '#C89A4E' : '#4E9B6F', fontWeight: '500' }}>{s.difficulty}</div>
                    <div style={{ fontSize: '10px', color: '#605850', textTransform: 'uppercase' }}>Difficulty</div>
                  </div>
                  <ChevronRight size={18} color="#222" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA — thumb-reach zone for returning users too */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '20px 24px',
        background: 'linear-gradient(to top, #0F0F0F 60%, transparent)',
        display: 'flex', justifyContent: 'center',
      }}>
        <button
          id="start-practice-btn-returning"
          onClick={handleStartPractice}
          style={{
            background: '#C8B89A', color: '#0F0F0F', border: 'none', borderRadius: '14px',
            padding: '16px 40px', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px',
            boxShadow: '0 4px 24px rgba(200,184,154,0.2)',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#D8C8AA'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#C8B89A'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Play size={18} fill="currentColor" /> Start Practice
        </button>
      </div>
    </div>
  );
}

export default Profile;
