import React, { useState, useEffect } from 'react';
import { Play, TrendingUp, ChevronRight, Zap, Target, MessageSquare, History } from 'lucide-react';

export function Landing({ appState, setAppState }) {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const rawData = JSON.parse(localStorage.getItem('groundwork_sessions') || '[]');
    setSessions(rawData);
  }, []);

  const handleStartPractice = () => {
    setAppState(prev => ({ ...prev, phase: 'onboarding' }));
  };

  const handleGoToHistory = () => {
    setAppState(prev => ({ ...prev, phase: 'profile' }));
  };

  return (
    <div style={{ background: '#0F0F0F', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: '#F0EDE8', overflow: 'hidden' }}>
      
      {/* ── HERO SECTION ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', position: 'relative' }}>
        
        {/* Animated Background Element (Subtle Blob) */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(200,184,154,0.05) 0%, transparent 70%)',
          zIndex: 0, pointerEvents: 'none'
        }} className="pulse-slow" />

        <div className="animate-in" style={{ zIndex: 1, maxWidth: '800px' }}>
          
          {/* Proposition */}
          <h1 style={{ fontSize: 'clamp(42px, 8vw, 64px)', fontWeight: '200', lineHeight: '1.1', marginBottom: '24px', letterSpacing: '-0.03em' }}>
            Talk to AI before talking <br />
            <span style={{ color: '#C8B89A', fontWeight: '400' }}>to the real person.</span>
          </h1>

          <p style={{ color: '#807870', fontSize: 'clamp(16px, 4vw, 20px)', lineHeight: '1.6', maxWidth: '580px', margin: '0 auto 64px', fontWeight: '300' }}>
            Groundwork is a safe space to simulate high-stakes career conversations—from salary negotiations to difficult feedback. Master your delivery in private, then walk into the real room with calm confidence.
          </p>

          {/* Core Animation Component (Simulated Conversation) */}
          <div style={{ position: 'relative', height: '140px', width: '100%', maxWidth: '400px', margin: '0 auto 80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
             {/* Model Bubble */}
             <div className="bubble-1" style={{ 
               alignSelf: 'flex-start', background: '#1A1A1A', padding: '12px 18px', borderRadius: '14px 14px 14px 0',
               border: '1px solid #252525', fontSize: '14px', color: '#888', maxWidth: '280px', textAlign: 'left'
             }}>
               "I hear what you're saying, but I'm not sure we have the budget for a raise right now."
             </div>
             {/* User Bubble */}
             <div className="bubble-2" style={{ 
               alignSelf: 'flex-end', background: 'rgba(200,184,154,0.1)', padding: '12px 18px', borderRadius: '14px 14px 0 14px',
               border: '1px solid rgba(200,184,154,0.3)', fontSize: '14px', color: '#C8B89A', maxWidth: '280px', textAlign: 'right'
             }}>
               "I understand. However, my performance data shows a 15% increase in efficiency..."
             </div>
          </div>

          {/* CTA Group */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={handleStartPractice}
              style={{
                background: '#C8B89A', color: '#0F0F0F', border: 'none', borderRadius: '16px',
                padding: '20px 48px', fontSize: '18px', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '12px',
                boxShadow: '0 12px 48px rgba(200,184,154,0.3)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="hover-lift"
            >
              Start Your First Practice <Play size={20} fill="currentColor" />
            </button>
            
            {sessions.length > 0 && (
              <button 
                onClick={handleGoToHistory}
                style={{ background: 'transparent', border: 'none', color: '#505050', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                className="hover-opacity"
              >
                <History size={16} /> View your practice history ({sessions.length})
              </button>
            )}
          </div>

        </div>
      </main>

      {/* ── FOOTER: VALUE PROPS ── */}
      <footer style={{ background: '#0A0A0A', borderTop: '1px solid #141414', padding: '48px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
           {[
             { icon: <Target size={20} color="#C8B89A" />, title: 'Realism by Default', desc: 'Models calibrated to react with authority, stress, or warmth.' },
             { icon: <MessageSquare size={20} color="#C8B89A" />, title: 'Voice & Text', desc: 'Switch seamlessly between talking and typing for realism.' },
             { icon: <TrendingUp size={20} color="#C8B89A" />, title: 'Progress Engine', desc: 'Every turn tracks rhetorical markers and delivery impact.' }
           ].map((prop, i) => (
             <div key={i} style={{ textAlign: 'left' }}>
               <div style={{ marginBottom: '16px' }}>{prop.icon}</div>
               <div style={{ fontSize: '15px', color: '#F0EDE8', fontWeight: '500', marginBottom: '8px' }}>{prop.title}</div>
               <div style={{ fontSize: '13px', color: '#505050', lineHeight: '1.6' }}>{prop.desc}</div>
             </div>
           ))}
        </div>
      </footer>

      {/* ── CUSTOM ANIMATIONS ── */}
      <style>{`
        .pulse-slow { animation: pulse 8s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); } }
        
        .bubble-1 { animation: slideInLeft 3s infinite; }
        .bubble-2 { animation: slideInRight 3s infinite; animation-delay: 1.5s; opacity: 0; }
        
        @keyframes slideInLeft { 0% { opacity: 0; transform: translateX(-20px); } 10%, 45% { opacity: 1; transform: translateX(0); } 55%, 100% { opacity: 0; } }
        @keyframes slideInRight { 0% { opacity: 0; transform: translateX(20px); } 10%, 45% { opacity: 1; transform: translateX(0); } 55%, 100% { opacity: 0; } }
        
        .hover-lift:hover { transform: translateY(-4px) scale(1.02); filter: brightness(1.1); }
        .hover-opacity:hover { color: #888; }
        
        .animate-in { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

export default Landing;
