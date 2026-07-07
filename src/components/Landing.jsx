import React, { useState, useEffect } from 'react';
import { Play, TrendingUp, Zap, Target, MessageSquare, History, Sparkles, Shield, Briefcase, ArrowRight, LogOut } from 'lucide-react';

export function Landing({ appState, setAppState, setShowAuth, user, signOut }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStartPractice = () => {
    if (user) {
      setAppState(prev => ({ ...prev, phase: 'onboarding' }));
    } else {
      setShowAuth(true);
    }
  };

  const handleGoToHistory = () => {
    setAppState(prev => ({ ...prev, phase: 'profile' }));
  };

  return (
    <div style={{ background: '#FFFFFF', color: '#111827', minHeight: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* ── USER BAR (top-right) ── */}
      {user && (
        <div style={{
          position: 'absolute', top: '16px', right: '24px', zIndex: 10,
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>{user.email}</span>
          <button
            onClick={signOut}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'transparent', border: '1px solid #E5E7EB', borderRadius: '8px',
              padding: '6px 12px', fontSize: '12px', color: '#6B7280', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      )}
      
      {/* ── HERO SECTION ── */}
      <main style={{ 
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        padding: isMobile ? '60px 24px' : '100px 24px', textAlign: 'center', position: 'relative' 
      }}>
        
        {/* Animated Background Element (Subtle Blob) */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: isMobile ? '300px' : '600px', height: isMobile ? '300px' : '600px', 
          background: 'radial-gradient(circle, rgba(29,78,216,0.06) 0%, transparent 70%)',
          zIndex: 0, pointerEvents: 'none'
        }} className="pulse-slow" />

        <div className="animate-in" style={{ zIndex: 1, maxWidth: '900px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(29,78,216,0.08)', border: '1px solid rgba(29,78,216,0.2)', padding: '8px 16px', borderRadius: '30px', marginBottom: '32px' }}>
            <Sparkles size={14} color="#1D4ED8" />
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Simulation-based career coaching</span>
          </div>

          <h1 style={{ 
            fontSize: isMobile ? '36px' : '64px', 
            fontWeight: '200', lineHeight: '1.1', marginBottom: '24px', letterSpacing: '-0.03em' 
          }}>
            Talk to AI before talking <br />
            <span style={{ color: '#1D4ED8', fontWeight: '400' }}>to the real person.</span>
          </h1>

          <p style={{ 
            color: '#6B7280', fontSize: isMobile ? '16px' : '20px', 
            lineHeight: '1.6', maxWidth: '580px', margin: '0 auto 56px', fontWeight: '300' 
          }}>
            Groundwork is a safe space to simulate high-stakes career conversations—from salary negotiations to difficult feedback. Master your delivery in private.
          </p>

          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', justifyContent: 'center', alignItems: 'center', marginBottom: '40px' }}>
            <button 
              onClick={handleStartPractice}
              style={{ width: isMobile ? '100%' : 'auto', padding: '18px 36px', background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: '#FFFFFF', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(29,78,216,0.25)' }}
            >
              {user ? 'Start Practice' : 'Get Started'} <Play size={18} fill="currentColor" />
            </button>
            {user && (
              <button 
                onClick={handleGoToHistory}
                style={{ width: isMobile ? '100%' : 'auto', padding: '18px 32px', background: 'transparent', color: '#111827', border: '1px solid #E5E7EB', borderRadius: '14px', fontSize: '16px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                View History
              </button>
            )}
          </div>
        </div>
      </main>

      {/* ── FOOTER: VALUE PROPS ── */}
      <footer style={{ background: '#F9FAFB', borderTop: '1px solid #E5E7EB', padding: isMobile ? '40px 24px' : '64px 24px' }}>
        <div style={{ 
          maxWidth: '1000px', margin: '0 auto', 
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
          gap: isMobile ? '32px' : '48px' 
        }}>
           {[
             { icon: <Target size={22} color="#1D4ED8" />, title: 'Realism by Default', desc: 'Models calibrated to react with authority, stress, or warmth.' },
             { icon: <MessageSquare size={22} color="#1D4ED8" />, title: 'Voice & Text', desc: 'Switch seamlessly between talking and typing for realism.' },
             { icon: <TrendingUp size={22} color="#1D4ED8" />, title: 'Progress Engine', desc: 'Every turn tracks rhetorical markers and delivery impact.' }
           ].map((prop, i) => (
             <div key={i} style={{ textAlign: isMobile ? 'center' : 'left' }}>
               <div style={{ marginBottom: '16px', display: isMobile ? 'flex' : 'block', justifyContent: 'center' }}>{prop.icon}</div>
               <div style={{ fontSize: '16px', color: '#111827', fontWeight: '500', marginBottom: '8px' }}>{prop.title}</div>
               <div style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>{prop.desc}</div>
             </div>
           ))}
        </div>
      </footer>

      <style>{`
        .pulse-slow { animation: pulse 8s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); } }
        .animate-in { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}
      </style>
    </div>
  );
}

export default Landing;
