import React, { useState, useEffect } from 'react';
import Landing from './components/Landing';
import Onboarding from './components/Onboarding';
import Simulation from './components/Simulation';
import FeedbackReport from './components/FeedbackReport';
import Profile from './components/Profile';
import { CoachingBrief } from './components/CoachingBrief';
import BrandHeader from './components/BrandHeader';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AuthScreen } from './components/AuthScreen';
import { useAuth } from './hooks/useAuth';
import { getUserSessions, finalizeSession } from './utils/supabaseSession';

function App() {
  const { user, loading: authLoading, signUp, signIn, signOut } = useAuth();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [appState, setAppState] = useState({
    phase: 'landing',
    user: null,
    userProfile: {
      whoAreYou: '', practiceGoal: '', scenario: '',
      actualSituation: '', practicePhase: 1,
      powerDynamic: 'Equal', stressLevel: 50,
      counterpartDisposition: 'Neutral',
    },
    persona: null,
    conversationHistory: [],
    turnCount: 0,
    feedbackResult: null,
    feedbackRating: null,
    feedbackReason: '',
  });

  // Sync user into appState
  useEffect(() => {
    setAppState(prev => ({ ...prev, user }));
  }, [user]);

  // After auth loads, check if user should go to profile
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      // Auto-merge localStorage sessions into Supabase
      const localSessions = JSON.parse(localStorage.getItem('groundwork_sessions') || '[]');
      if (localSessions.length > 0) {
        // Import silently then clear
        Promise.all(localSessions.map(s =>
          finalizeSession(s.id, {
            turns: s.turns || 0,
            durationSeconds: s.duration || 0,
            fullReport: s.fullReport || null,
            userFeedback: s.userFeedback || null,
          }).catch(() => {}) // ignore errors for individual imports
        )).then(() => {
          localStorage.removeItem('groundwork_sessions');
          localStorage.removeItem('groundwork_phases');
        });
      }
      // Check Supabase for sessions and route accordingly
      getUserSessions(user.id).then(sessions => {
        if (sessions.length > 0) {
          setAppState(prev => ({ ...prev, phase: 'profile' }));
        }
      });
    }
  }, [user, authLoading]);

  // Check Groq key from sessionStorage
  useEffect(() => {
    const groqKey = sessionStorage.getItem('GROQ_API_KEY') || import.meta.env.VITE_GROQ_API_KEY;
    if (!groqKey && user) {
      setShowKeyModal(true);
    }
  }, [user]);

  const goHome = () => {
    if (user) {
      setAppState(prev => ({ ...prev, phase: 'profile' }));
    } else {
      setAppState(prev => ({ ...prev, phase: 'landing' }));
    }
  };

  // Auth gate: if trying to access a gated phase without login, redirect
  useEffect(() => {
    if (!authLoading && !user) {
      const gatedPhases = ['onboarding', 'coaching', 'simulation', 'feedback', 'profile'];
      if (gatedPhases.includes(appState.phase)) {
        setAppState(prev => ({ ...prev, phase: 'landing' }));
        setShowAuth(true);
      }
    }
  }, [appState.phase, user, authLoading]);

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 24px' }}></div>
          <p style={{ color: '#1D4ED8', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <BrandHeader onClick={goHome} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {appState.phase === 'landing' && (
          <div key="landing" className="animate-in">
            <Landing appState={appState} setAppState={setAppState} setShowAuth={setShowAuth} user={user} signOut={signOut} />
          </div>
        )}
        {appState.phase === 'profile' && (
          <div key="profile" className="animate-in">
            <Profile appState={appState} setAppState={setAppState} signOut={signOut} />
          </div>
        )}
        {appState.phase === 'onboarding' && (
          <div key="onboarding" className="animate-in">
            <Onboarding appState={appState} setAppState={setAppState} />
          </div>
        )}
        {appState.phase === 'coaching' && (
          <div key="coaching" className="animate-in" style={{ height: '100%' }}>
            <CoachingBrief appState={appState} setAppState={setAppState} />
          </div>
        )}
        {appState.phase === 'simulation' && (
          <div key="simulation" className="animate-in" style={{ height: '100%' }}>
            <Simulation appState={appState} setAppState={setAppState} />
          </div>
        )}
        {appState.phase === 'feedback' && (
          <div key="feedback" className="animate-in">
            <FeedbackReport appState={appState} setAppState={setAppState} />
          </div>
        )}
      </div>
      {showKeyModal && <ApiKeyModal onSave={() => setShowKeyModal(false)} />}
      {showAuth && (
        <AuthScreen
          onSignIn={async (email, pw) => { await signIn(email, pw); setShowAuth(false); }}
          onSignUp={async (email, pw) => { await signUp(email, pw); setShowAuth(false); }}
          onClose={() => setShowAuth(false)}
        />
      )}
    </div>
  );
}

export default App;
