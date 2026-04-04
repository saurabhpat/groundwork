import React, { useState, useEffect } from 'react';
import { Target, AlertCircle, Zap, TrendingUp, Mic } from 'lucide-react';
import { robustGenerate } from '../utils/aiClient';

export function FeedbackReport({ appState, setAppState, readOnlyReport }) {
  const isHistoryView = !!readOnlyReport;
  const { persona, userProfile, conversationHistory } = appState;
  
  const [report, setReport] = useState(readOnlyReport || null);
  const [loading, setLoading] = useState(!readOnlyReport);
  const [errorObj, setErrorObj] = useState(null);
  const [reactionData, setReactionData] = useState({ rating: null, reason: "" });

  useEffect(() => {
    if (isHistoryView) return;
    
    let mounted = true;
    const fetchFeedback = async () => {
      if (conversationHistory.length === 0) {
        setLoading(false);
        return;
      }
      
      const formattedTranscript = conversationHistory.map((m, i) =>
        `TURN ${i + 1} | ${m.role === "model" ? persona.name.toUpperCase() : "USER"}: ${m.content}`
      ).join("\n\n");

      const systemInstruction = `You are a world-class executive communication coach.
Analyze the transcript and provide a marker-based feedback report.
Do NOT provide an overall score out of 100.
Focus on "What Landed", "Hesitation Markers", and "One Thing to Fix".
Identify the difficulty of the counterparty's stance based on their resistance and tone.
Provide exactly one core phrasing correction with impact labels for before and after.

Return ONLY valid JSON matching this schema:
{
  "difficulty": "Easy|Medium|Hard",
  "what_landed": {
    "percentage": 85,
    "observation": "description of what worked and why it resonated"
  },
  "hesitation_markers": {
    "count": 3,
    "observation": "description of speech disfluencies and their impact on authority",
    "impact_level": "Low|Medium|High" 
  },
  "one_thing_to_fix": {
    "headline": "sharp short instruction",
    "observation": "detailed explanation of the markdown or friction caused"
  },
  "phrasing_deep_dive": {
    "original": "exact user quote",
    "original_impact": "e.g., Low Authority • Speculative Tone",
    "improved": "better version",
    "improved_impact": "e.g., High Authority • Data-Driven Anchor"
  }
}`;
      
      const promptText = `Analyze this session:
USER ROLE: ${userProfile.whoAreYou}
USER GOAL: ${userProfile.practiceGoal}
SCENARIO: ${userProfile.scenario}
PERSONA: ${persona.name}, ${persona.role}

TRANSCRIPT:
${formattedTranscript}`;

      try {
        const data = await robustGenerate({
          systemInstruction,
          contents: [{ role: "user", parts: [{ text: promptText }] }],
          thermal: 0.2
        });
        
        if (mounted) {
          setReport(data);
          setLoading(false);
          
          const sessions = JSON.parse(localStorage.getItem('groundwork_sessions') || '[]');
          sessions.push({
            id: Date.now(),
            date: new Date().toISOString(),
            scenario: userProfile.scenario,
            difficulty: data.difficulty,
            turns: conversationHistory.length,
            fullReport: data,
            history: conversationHistory
          });
          localStorage.setItem('groundwork_sessions', JSON.stringify(sessions));

          // Increment phase session counter for this scenario
          const phaseData = JSON.parse(localStorage.getItem('groundwork_phases') || '{}');
          phaseData[userProfile.scenario] = (phaseData[userProfile.scenario] || 0) + 1;
          localStorage.setItem('groundwork_phases', JSON.stringify(phaseData));
        }
      } catch (err) {
        if (mounted) {
          setErrorObj(err.message);
          setLoading(false);
        }
      }
    };

    fetchFeedback();
    return () => { mounted = false; };
  }, [persona, userProfile, conversationHistory, isHistoryView]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F0F0F' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 24px' }}></div>
          <p style={{ color: '#C8B89A', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Analyzing Dynamics...</p>
        </div>
      </div>
    );
  }

  const handleReturnHome = () => {
    setAppState(prev => ({
      ...prev, phase: "profile", 
      userProfile: {whoAreYou: prev.userProfile.whoAreYou, practiceGoal: "", scenario: ""}, 
      turnCount: 0, conversationHistory: []
    }));
  };
  const handlePracticeAgain = () => setAppState(prev => ({ ...prev, phase: "onboarding", turnCount: 0, conversationHistory: [] }));



  return (
    <div style={{ background: '#0F0F0F', minHeight: '100vh', padding: '40px 24px 80px', color: '#F0EDE8' }}>
      <div className="animate-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* TOP HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A09890', fontSize: '13px' }}>
            <TrendingUp size={16} /> Difficulty: <span style={{ color: '#F0EDE8', fontWeight: '500' }}>{report.difficulty}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#444', letterSpacing: '0.1em' }}>SN-992-DELTA</div>
        </div>

        {/* TOP MARKER GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '64px' }}>
          {/* WHAT LANDED */}
          <div style={{ background: '#131313', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ color: '#4E9B6F', fontSize: '15px', fontWeight: '500' }}>What Landed</h3>
              <Target size={20} color="#4E9B6F" style={{ opacity: 0.5 }} />
            </div>
            <p style={{ fontSize: '13px', color: '#A09890', lineHeight: '1.6', marginBottom: '24px' }}>{report.what_landed.observation}</p>
            <div style={{ width: '100%', height: '4px', background: '#1A1A1A', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: `${report.what_landed.percentage}%`, height: '100%', background: '#4E9B6F' }} />
            </div>
            <div style={{ textAlign: 'right', fontSize: '10px', color: '#4E9B6F', marginTop: '8px' }}>{report.what_landed.percentage}%</div>
          </div>

          {/* HESITATION MARKERS */}
          <div style={{ background: '#131313', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ color: '#C8B89A', fontSize: '15px', fontWeight: '500' }}>Hesitation Markers</h3>
              <Mic size={20} color="#C8B89A" style={{ opacity: 0.5 }} />
            </div>
            <p style={{ fontSize: '13px', color: '#A09890', lineHeight: '1.6', marginBottom: '24px' }}>{report.hesitation_markers.observation}</p>
            <div style={{ width: '100%', height: '4px', background: '#1A1A1A', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: report.hesitation_markers.impact_level === 'High' ? '100%' : report.hesitation_markers.impact_level === 'Medium' ? '60%' : '30%', height: '100%', background: '#C8B89A' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '10px', color: '#C8B89A' }}>{report.hesitation_markers.count} detected</span>
              <span style={{ fontSize: '10px', color: '#605850', textTransform: 'uppercase' }}>{report.hesitation_markers.impact_level}</span>
            </div>
          </div>

          {/* ONE THING TO FIX */}
          <div style={{ background: '#131313', borderLeft: '4px solid #C86060', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ color: '#F0EDE8', fontSize: '15px', fontWeight: '500' }}>One Thing to Fix</h3>
              <AlertCircle size={20} color="#C86060" style={{ opacity: 0.5 }} />
            </div>
            <p style={{ fontSize: '14px', color: '#F0EDE8', fontWeight: '500', marginBottom: '8px' }}>{report.one_thing_to_fix.headline}</p>
            <p style={{ fontSize: '13px', color: '#A09890', lineHeight: '1.6', marginBottom: '20px' }}>{report.one_thing_to_fix.observation}</p>
          </div>
        </div>

        {/* SUGGESTED REPHRASING */}
        <div style={{ marginBottom: '64px' }}>
          <h4 style={{ fontSize: '11px', color: '#605850', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '24px' }}>Suggested Rephrasing</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
            <div style={{ background: '#0A0A0A', border: '1px solid #1A1A1A', borderRadius: '12px', padding: '32px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-10px', left: '20px', background: '#0F0F0F', padding: '0 8px', fontSize: '10px', color: '#444', textTransform: 'uppercase' }}>Your Response</div>
              <p style={{ fontSize: '16px', color: '#605850', fontStyle: 'italic', lineHeight: '1.6', marginBottom: '32px' }}>"{report.phrasing_deep_dive.original}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} color="#C86060" style={{ transform: 'rotate(180deg)' }} />
                </div>
                <div>
                   <div style={{ fontSize: '10px', color: '#605850', textTransform: 'uppercase' }}>Impact</div>
                   <div style={{ fontSize: '13px', color: '#E0DCD5' }}>{report.phrasing_deep_dive.original_impact}</div>
                </div>
              </div>
            </div>
            <div style={{ background: '#131313', border: '1px solid rgba(200,184,154,0.2)', borderRadius: '12px', padding: '32px', position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <div style={{ position: 'absolute', top: '-10px', left: '20px', background: '#0F0F0F', padding: '0 8px', fontSize: '10px', color: '#C8B89A', textTransform: 'uppercase' }}>Stronger Alternative</div>
              <p style={{ fontSize: '16px', color: '#F0EDE8', lineHeight: '1.6', marginBottom: '32px' }}>"{report.phrasing_deep_dive.improved}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(78,155,111,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={16} color="#4E9B6F" />
                </div>
                <div>
                   <div style={{ fontSize: '10px', color: '#4E9B6F', textTransform: 'uppercase' }}>Impact</div>
                   <div style={{ fontSize: '13px', color: '#F0EDE8' }}>{report.phrasing_deep_dive.improved_impact}</div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* BOTTOM NAV */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
           <button onClick={handleReturnHome} style={{ background: 'transparent', border: '1px solid #2A2A2A', color: '#A09890', padding: '12px 32px', borderRadius: '10px', cursor: 'pointer' }}>Dashboard Home</button>
           <button onClick={handlePracticeAgain} style={{ background: '#C8B89A', color: '#0F0F0F', border: 'none', padding: '12px 32px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Practice Again</button>
        </div>

      </div>
    </div>
  );
}

export default FeedbackReport;
