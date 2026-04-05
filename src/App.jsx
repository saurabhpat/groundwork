import React, { useState, useEffect } from 'react';
import Landing from './components/Landing'; // New entry point
import Onboarding from './components/Onboarding';
import Simulation from './components/Simulation';
import FeedbackReport from './components/FeedbackReport';
import Profile from './components/Profile';
import { CoachingBrief } from './components/CoachingBrief';
import BrandHeader from './components/BrandHeader';
import { ApiKeyModal } from './components/ApiKeyModal';

function App() {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [appState, setAppState] = useState({
    phase: "landing", // New default phase
    userProfile: {
      whoAreYou: "",
      practiceGoal: "",
      scenario: "",
      actualSituation: "", // Captured in step 6
      practicePhase: 1,
      // Calibration Parameters
      powerDynamic: "Equal",
      stressLevel: 50,
      counterpartDisposition: "Neutral",
    },
    persona: null,
    conversationHistory: [],
    turnCount: 0,
    feedbackResult: null,
    feedbackRating: null,
    feedbackReason: "",
  });

  const goHome = () => {
    const sessions = JSON.parse(localStorage.getItem('groundwork_sessions') || '[]');
    if (sessions.length > 0) {
      setAppState(prev => ({ ...prev, phase: 'profile' }));
    } else {
      setAppState(prev => ({ ...prev, phase: 'landing' }));
    }
  };

  // Check initial state - always start on landing as per feedback
  useEffect(() => {
    // We already set phase to 'landing' in the initial state
  }, []);

  // For the demo, ensure Groq key exists
  useEffect(() => {
    const groq = localStorage.getItem('VITE_GROQ_API_KEY') || import.meta.env.VITE_GROQ_API_KEY;
    if (!groq) {
      setShowKeyModal(true);
    }
  }, []);

  // Global Navigation Guard: If phase is 'profile' but no sessions exist, redirect to 'landing'
  useEffect(() => {
    if (appState.phase === 'profile') {
      const sessions = JSON.parse(localStorage.getItem('groundwork_sessions') || '[]');
      if (sessions.length === 0) {
        setAppState(prev => ({ ...prev, phase: 'landing' }));
      }
    }
  }, [appState.phase]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <BrandHeader onClick={goHome} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {appState.phase === 'landing' && (
          <div key="landing" className="animate-in">
            <Landing appState={appState} setAppState={setAppState} />
          </div>
        )}
        {appState.phase === 'profile' && (
          <div key="profile" className="animate-in">
            <Profile appState={appState} setAppState={setAppState} />
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
    </div>
  );
}

export default App;
