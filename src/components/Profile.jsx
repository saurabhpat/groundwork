import React, { useState, useEffect } from 'react';
import { Play, TrendingUp, BookOpen, ChevronRight, UserCheck, ShieldCheck, Zap, Target, MessageSquare, Trash2 } from 'lucide-react';
import { FeedbackReport } from './FeedbackReport';
import { getUserSessions, deleteSession as deleteSupabaseSession, getAllTurns } from '../utils/supabaseSession';

export function Profile({ appState, setAppState, signOut }) {
  const [sessions, setSessions] = useState([]);
  const [selectedHistoricalSession, setSelectedHistoricalSession] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const userId = appState.user?.id;
    if (userId) {
      getUserSessions(userId).then(data => {
        setSessions(data.map(s => ({
          id: s.id,
          date: s.created_at || s.date,
          scenario: s.scenario,
          difficulty: s.full_report?.difficulty,
          turns: s.turns,
          duration: s.duration_seconds,
          fullReport: s.full_report,
          history: [], // will be loaded on demand from conversation_turns
        })));
      });
    }

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStartPractice = () => {
    setAppState(prev => ({ ...prev, phase: 'onboarding' }));
  };

  const handleDeleteSession = async (sessionId) => {
    await deleteSupabaseSession(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setDeleteConfirmId(null);
    if (sessions.length <= 1) {
      setAppState(prev => ({ ...prev, phase: 'landing' }));
    }
  };

  // Load turns from Supabase when a historical session is selected
  useEffect(() => {
    if (selectedHistoricalSession && selectedHistoricalSession.history.length === 0 && selectedHistoricalSession.id) {
      getAllTurns(selectedHistoricalSession.id).then(turns => {
        setSelectedHistoricalSession(prev => ({
          ...prev,
          history: turns.map(t => ({ role: t.role, content: t.content, coaching_aside: t.coaching_aside })),
        }));
      });
    }
  }, [selectedHistoricalSession?.id]);

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
      <div style={{ background: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* hero */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px 180px', textAlign: 'center' }}>
          <div className="animate-in">
            {/* Brand mark */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '18px',
              background: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
              border: '1px solid #E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 32px',
              boxShadow: '0 8px 40px rgba(29,78,216,0.1)',
            }}>
              <Zap size={28} color="#1D4ED8" />
            </div>

            <h1 style={{ fontSize: isMobile ? '32px' : '38px', fontWeight: '300', color: '#111827', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
              Your most important conversation<br />
              <span style={{ color: '#1D4ED8' }}>should never be your first practice.</span>
            </h1>

            <p style={{ color: '#6B7280', fontSize: isMobile ? '14px' : '16px', lineHeight: '1.7', maxWidth: '500px', margin: '0 auto 56px' }}>
              Practice high-stakes career moments like salary negotiations and team conflicts in a safe space. Walk into the real room with calm confidence and a plan that actually lands.
            </p>

            {/* How it works */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
              gap: '16px', maxWidth: '640px', margin: '0 auto 64px', textAlign: 'left' 
            }}>
              {[
                { icon: <Target size={18} color="#1D4ED8" />, label: 'Pick a scenario', sub: 'Choose the conversation you need to master' },
                { icon: <MessageSquare size={18} color="#1D4ED8" />, label: 'Simulate it live', sub: 'Speak or type with a realistic AI persona' },
                { icon: <TrendingUp size={18} color="#1D4ED8" />, label: 'Get your markers', sub: 'See what landed, what hesitated, one fix' },
              ].map((step, i) => (
                <div key={i} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ marginBottom: '10px' }}>{step.icon}</div>
                  <div style={{ fontSize: '13px', color: '#111827', fontWeight: '500', marginBottom: '6px' }}>{step.label}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: '1.5' }}>{step.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed bottom CTA — thumb-reach zone */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '24px',
          background: 'linear-gradient(to top, #FFFFFF 70%, transparent)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
        }}>
          <button
            id="start-practice-btn"
            onClick={handleStartPractice}
            style={{
              width: '100%', maxWidth: '420px',
              background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: '#FFFFFF', border: 'none', borderRadius: '14px',
              padding: '18px 24px', fontSize: '16px', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              boxShadow: '0 8px 32px rgba(29,78,216,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #1E40AF, #1D4ED8)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #1D4ED8, #2563EB)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Play size={20} fill="currentColor" /> Start Your First Practice
          </button>
          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>2 questions · &lt;30 seconds to start</p>
        </div>
      </div>
    );
  }

  // ─── RETURNING USER: Progress dashboard ───────────────────────────────────
  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', padding: '40px 24px 140px' }}>
      <div className="animate-in" style={{ maxWidth: '840px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '300', color: '#111827', margin: 0 }}>Your Performance Progress</h1>
          </div>
          <button
            onClick={signOut}
            style={{ background: 'none', border: '1px solid #E5E7EB', color: '#6B7280', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </div>

        {/* META-COACHING */}
        <div style={{ background: 'linear-gradient(135deg, rgba(29,78,216,0.08) 0%, #F9FAFB 100%)', padding: '32px', borderRadius: '20px', border: '1px solid rgba(29,78,216,0.2)', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.04 }}>
            <TrendingUp size={160} color="#1D4ED8" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1D4ED8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', fontWeight: '600' }}>
            <UserCheck size={14} /> How your sessions are going
          </div>
          <div style={{ maxWidth: '600px', fontSize: '16px', color: '#111827', lineHeight: '1.6', fontWeight: '300' }}>
            {sessions.length < 3 
              ? `Continue practicing to unlock cumulative trend analysis. We are currently tracking your rhetorical markers across ${sessions.length} session(s).`
              : `You've completed ${sessions.length} high-stakes simulations. Your ability to anchor conversations in data has improved, though hesitation markers remain a focal point for your next ${sessions[sessions.length-1].difficulty} difficulty session.`
            }
          </div>
        </div>

        {/* KEY TRACKS */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px', marginBottom: '40px' }}>
          <div style={{ background: '#F9FAFB', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '11px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <TrendingUp size={14} color="#1D4ED8" /> Total Simulations
            </div>
            <div style={{ fontSize: '32px', fontWeight: '300', color: '#111827' }}>{sessions.length}</div>
          </div>
          <div style={{ background: '#F9FAFB', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '11px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <ShieldCheck size={14} color="#10B981" /> Last Intensity
            </div>
            <div style={{ fontSize: '32px', fontWeight: '300', color: '#111827' }}>{sessions[sessions.length-1].difficulty}</div>
          </div>
        </div>

        {/* ANALYTICAL HISTORY */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#9CA3AF', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your practice history</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sessions.slice().reverse().map((s) => (
              <div key={s.id} style={{ position: 'relative' }}>
                <div 
                  onClick={() => { if (deleteConfirmId !== s.id) setSelectedHistoricalSession(s); }}
                  style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', 
                    padding: '24px', borderRadius: '16px', border: deleteConfirmId === s.id ? '1px solid #FECACA' : '1px solid #E5E7EB', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => { if (deleteConfirmId !== s.id) { e.currentTarget.style.borderColor = '#1D4ED8'; e.currentTarget.style.background = '#F3F4F6'; } }}
                  onMouseOut={e => { if (deleteConfirmId !== s.id) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = '#F9FAFB'; } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '10px', background: '#FFFFFF', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E5E7EB'
                    }}>
                      <BookOpen size={18} color="#1D4ED8" />
                    </div>
                    <div>
                      <div style={{ color: '#111827', fontSize: '15px', fontWeight: '500', marginBottom: '4px' }}>{s.scenario}</div>
                      <div style={{ color: '#6B7280', fontSize: '12px' }}>{new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {s.turns} turns{s.duration ? ` · ${Math.floor(s.duration / 60)}m ${s.duration % 60}s` : ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', color: s.difficulty === 'Hard' ? '#DC2626' : s.difficulty === 'Medium' ? '#1D4ED8' : '#059669', fontWeight: '500' }}>{s.difficulty}</div>
                      <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase' }}>Difficulty</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(deleteConfirmId === s.id ? null : s.id); }}
                      title="Delete session"
                      style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px', transition: 'color 0.2s' }}
                      onMouseOver={e => { e.currentTarget.style.color = '#EF4444'; }}
                      onMouseOut={e => { e.currentTarget.style.color = '#9CA3AF'; }}
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={18} color="#9CA3AF" />
                  </div>
                </div>

                {/* Inline delete confirmation */}
                {deleteConfirmId === s.id && (
                  <div style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderTop: 'none',
                    borderRadius: '0 0 16px 16px',
                    padding: '14px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    animation: 'fadeIn 0.2s ease-out',
                    marginTop: '-16px',
                  }}>
                    <span style={{ fontSize: '13px', color: '#991B1B' }}>Remove this session? This cannot be undone.</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        style={{ background: '#EF4444', color: '#FFF', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        style={{ background: 'transparent', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA — thumb-reach zone for returning users too */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '20px 24px',
        background: 'linear-gradient(to top, #FFFFFF 60%, transparent)',
        display: 'flex', justifyContent: 'center',
      }}>
        <button
          id="start-practice-btn-returning"
          onClick={handleStartPractice}
          style={{
            background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: '#FFFFFF', border: 'none', borderRadius: '14px',
            padding: '16px 40px', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px',
            boxShadow: '0 4px 24px rgba(29,78,216,0.3)',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #1E40AF, #1D4ED8)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #1D4ED8, #2563EB)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Play size={18} fill="currentColor" /> Start Practice
        </button>
      </div>
    </div>
  );
}

export default Profile;
