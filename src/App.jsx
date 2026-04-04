import React, { useState, useEffect } from 'react';
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

    phase: "profile",
    userProfile: {
      whoAreYou: "",
      practiceGoal: "",
      scenario: "",
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

  // Check initial state - if no past sessions, go straight to onboarding
  useEffect(() => {
    const sessions = JSON.parse(localStorage.getItem('groundwork_sessions') || '[]');
    if (sessions.length === 0 && appState.phase === 'profile') {
      setAppState(prev => ({ ...prev, phase: 'onboarding' }));
    }
  }, []);

  // For the demo, let's force start on onboarding, but provide a way to see profile
  useEffect(() => {
    const groq = localStorage.getItem('VITE_GROQ_API_KEY') || import.meta.env.VITE_GROQ_API_KEY;
    if (!groq) {
      setShowKeyModal(true);
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <BrandHeader />
      <div style={{ flex: 1, overflow: 'auto' }}>
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
