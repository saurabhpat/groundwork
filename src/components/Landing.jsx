import React, { useState, useEffect } from 'react';
import { Play, TrendingUp, Zap, Target, MessageSquare, History, Sparkles, Shield, Briefcase, ArrowRight } from 'lucide-react';

export function Landing({ appState, setAppState }) {
  const [sessions, setSessions] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const rawData = JSON.parse(localStorage.getItem('groundwork_sessions') || '[]');
    setSessions(rawData);
    
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStartPractice = () => {
    setAppState(prev => ({ ...prev, phase: 'onboarding' }));
  };

  const handleGoToHistory = () => {
    setAppState(prev => ({ ...prev, phase: 'profile' }));
  };

  return (
    <div style={{ background: '#0F0F0F', color: '#F0EDE8', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── HERO SECTION ── */}
      <main style={{ 
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        padding: isMobile ? '60px 24px' : '100px 24px', textAlign: 'center', position: 'relative' 
      }}>
        
        {/* Animated Background Element (Subtle Blob) */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: isMobile ? '300px' : '600px', height: isMobile ? '300px' : '600px', 
          background: 'radial-gradient(circle, rgba(200,184,154,0.03) 0%, transparent 70%)',
          zIndex: 0, pointerEvents: 'none'
        }} className="pulse-slow" />

        <div className="animate-in" style={{ zIndex: 1, maxWidth: '900px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(200,184,154,0.05)', border: '1px solid rgba(200,184,154,0.15)', padding: '8px 16px', borderRadius: '30px', marginBottom: '32px' }}>
            <Sparkles size={14} color="#C8B89A" />
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#C8B89A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Simulation-based career coaching</span>
          </div>

          <h1 style={{ 
            fontSize: isMobile ? '36px' : '64px', 
            fontWeight: '200', lineHeight: '1.1', marginBottom: '24px', letterSpacing: '-0.03em' 
          }}>
            Talk to AI before talking <br />
            <span style={{ color: '#C8B89A', fontWeight: '400' }}>to the real person.</span>
          </h1>

          <p style={{ 
            color: '#807870', fontSize: isMobile ? '16px' : '20px', 
            lineHeight: '1.6', maxWidth: '580px', margin: '0 auto 56px', fontWeight: '300' 
          }}>
            Groundwork is a safe space to simulate high-stakes career conversations—from salary negotiations to difficult feedback. Master your delivery in private.
          </p>

          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', justifyContent: 'center', alignItems: 'center', marginBottom: '40px' }}>
            <button 
              onClick={handleStartPractice}
              style={{ width: isMobile ? '100%' : 'auto', padding: '18px 36px', background: '#C8B89A', color: '#0F0F0F', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s', boxShadow: '0 8px 32px rgba(200,184,154,0.2)' }}
            >
              Start Free Simulation <Play size={18} fill="currentColor" />
            </button>
            {sessions.length > 0 && (
              <button 
                onClick={handleGoToHistory}
                style={{ width: isMobile ? '100%' : 'auto', padding: '18px 32px', background: 'transparent', color: '#F0EDE8', border: '1px solid #2A2A2A', borderRadius: '14px', fontSize: '16px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                View History ({sessions.length})
              </button>
            )}
          </div>
        </div>
      </main>

      {/* ── FOOTER: VALUE PROPS ── */}
      <footer style={{ background: '#0A0A0A', borderTop: '1px solid #141414', padding: isMobile ? '40px 24px' : '64px 24px' }}>
        <div style={{ 
          maxWidth: '1000px', margin: '0 auto', 
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
          gap: isMobile ? '32px' : '48px' 
        }}>
           {[
             { icon: <Target size={22} color="#C8B89A" />, title: 'Realism by Default', desc: 'Models calibrated to react with authority, stress, or warmth.' },
             { icon: <MessageSquare size={22} color="#C8B89A" />, title: 'Voice & Text', desc: 'Switch seamlessly between talking and typing for realism.' },
             { icon: <TrendingUp size={22} color="#C8B89A" />, title: 'Progress Engine', desc: 'Every turn tracks rhetorical markers and delivery impact.' }
           ].map((prop, i) => (
             <div key={i} style={{ textAlign: isMobile ? 'center' : 'left' }}>
               <div style={{ marginBottom: '16px', display: isMobile ? 'flex' : 'block', justifyContent: 'center' }}>{prop.icon}</div>
               <div style={{ fontSize: '16px', color: '#F0EDE8', fontWeight: '500', marginBottom: '8px' }}>{prop.title}</div>
               <div style={{ fontSize: '14px', color: '#505050', lineHeight: '1.6' }}>{prop.desc}</div>
             </div>
           ))}
        </div>
      </footer>

      <style>{`
        .pulse-slow { animation: pulse 8s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); } }
        .animate-in { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

export default Landing;
