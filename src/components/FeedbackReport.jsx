import React, { useState, useEffect } from 'react';
import { Target, AlertCircle, Zap, TrendingUp, Mic, Check, MessageCircle, ChevronDown, ChevronUp, User } from 'lucide-react';
import { robustGenerate } from '../utils/aiClient';
import { finalizeSession, getUserSessions } from '../utils/supabaseSession';

// ─── Filler word detection ────────────────────────────────────────────────────
const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'right', 'so'];

function countFillerWords(conversationHistory) {
  const userMessages = conversationHistory
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ');

  const counts = {};
  let total = 0;

  FILLER_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = userMessages.match(regex) || [];
    if (matches.length > 0) {
      counts[word] = matches.length;
      total += matches.length;
    }
  });

  return { counts, total };
}

function FillerWordCard({ conversationHistory }) {
  const { counts, total } = countFillerWords(conversationHistory);
  const severity = total === 0 ? 'none' : total < 5 ? 'low' : total < 15 ? 'medium' : 'high';
  const color = severity === 'none' || severity === 'low' ? '#10B981' : severity === 'medium' ? '#1D4ED8' : '#EF4444';
  const label = severity === 'none' ? 'Clean' : severity === 'low' ? 'Low' : severity === 'medium' ? 'Moderate' : 'High';

  return (
    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '28px', marginBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h4 style={{ fontSize: '11px', color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Filler Word Analysis</h4>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Toastmasters-style speech pattern detection</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '28px', fontWeight: '300', color }}>{total}</div>
          <div style={{ fontSize: '10px', color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label} frequency</div>
        </div>
      </div>

      {total === 0 ? (
        <p style={{ fontSize: '13px', color: '#10B981', margin: 0 }}>No significant filler words detected. Clean, deliberate speech throughout.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([word, count]) => (
            <div key={word} style={{
              background: '#FFFFFF', border: `1px solid ${count > 5 ? color + '44' : '#E5E7EB'}`,
              borderRadius: '8px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span style={{ fontSize: '13px', color: '#111827', fontStyle: 'italic' }}>"{word}"</span>
              <span style={{ fontSize: '12px', color: count > 5 ? color : '#9CA3AF', fontWeight: '600' }}>×{count}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '16px', height: '4px', background: '#E5E7EB', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(total * 4, 100)}%`, background: color, transition: 'width 0.6s ease' }} />
      </div>
      <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '8px', marginBottom: 0 }}>Target: fewer than 5 filler words per session for high-authority presence.</p>
    </div>
  );
}

function CoachingInsightsCard({ conversationHistory }) {
  const insights = conversationHistory
    .filter(m => m.role === 'model' && m.coaching_aside)
    .map(m => m.coaching_aside)
    .filter(Boolean)
    .slice(0, 4);

  if (insights.length === 0) return null;

  return (
    <div style={{ marginBottom: '48px' }}>
      <h4 style={{ fontSize: '11px', color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageCircle size={13} /> Coaching Moments
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {insights.map((insight, i) => (
          <div key={i} style={{
            background: 'rgba(29, 78, 216, 0.04)',
            border: '1px solid rgba(29, 78, 216, 0.15)',
            borderLeft: '3px solid #1D4ED8',
            borderRadius: '0 12px 12px 0',
            padding: '16px 20px',
          }}>
            <p style={{ fontSize: '13px', color: '#111827', lineHeight: '1.6', margin: 0, fontStyle: 'italic' }}>
              {insight}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}



// ─── Transcript Viewer (× chat-style interleaved bubbles) ──────────────────────────

function TranscriptViewer({ conversationHistory, persona, isExpanded, onToggle }) {
  if (!conversationHistory || conversationHistory.length === 0) return null;

  // Compute a rough timestamp label per turn (relative: +10s per turn is fake but readable)
  const getLabel = (index, role) => {
    const mins = Math.floor((index * 30) / 60);
    const secs = (index * 30) % 60;
    const label = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return role === 'model' ? (persona?.name || 'Persona') : 'You';
  };

  return (
    <div style={{ marginBottom: '64px' }}>
      {/* Collapsible header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 20px 0',
        }}
      >
        <h4 style={{ fontSize: '11px', color: '#6B7280', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
          Full Conversation Transcript
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1D4ED8', fontSize: '12px', fontWeight: '500' }}>
          {isExpanded ? <><ChevronUp size={14} /> Collapse</> : <><ChevronDown size={14} /> View Transcript</>}
        </div>
      </button>

      {isExpanded && (
        <div style={{
          background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '16px',
          padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '20px',
        }}>
          {conversationHistory.map((msg, i) => {
            const isPersona = msg.role === 'model';
            const name = isPersona ? (persona?.name || 'Persona') : 'You';

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: isPersona ? 'row' : 'row-reverse',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: isPersona ? '#1D4ED8' : '#E5E7EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isPersona
                    ? <span style={{ color: '#fff', fontSize: '12px', fontWeight: '700' }}>{(persona?.name || 'P')[0]}</span>
                    : <User size={14} color="#6B7280" />}
                </div>

                {/* Bubble */}
                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isPersona ? 'flex-start' : 'flex-end', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: '500' }}>{name}</span>
                  <div style={{
                    background: isPersona ? '#FFFFFF' : 'rgba(29,78,216,0.08)',
                    border: `1px solid ${isPersona ? '#E5E7EB' : 'rgba(29,78,216,0.2)'}`,
                    borderRadius: isPersona ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: '#374151',
                    lineHeight: '1.6',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}>
                    {msg.content}
                  </div>
                  {msg.coaching_aside && (
                    <div style={{
                      fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic',
                      maxWidth: '90%', lineHeight: '1.4', marginTop: '2px',
                      paddingLeft: isPersona ? '4px' : '0',
                      paddingRight: isPersona ? '0' : '4px',
                      textAlign: isPersona ? 'left' : 'right',
                    }}>
                      🎯 Coach: {msg.coaching_aside}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


export function FeedbackReport({ appState, setAppState, readOnlyReport }) {
  const isHistoryView = !!readOnlyReport;
  const { persona, userProfile, conversationHistory } = appState;
  
  const [report, setReport] = useState(readOnlyReport || null);
  const [loading, setLoading] = useState(!readOnlyReport);
  const [errorObj, setErrorObj] = useState(null);
  const [reactionData, setReactionData] = useState({ rating: null, reason: "", customText: "", submitted: false });
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

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
          
          // Save to Supabase instead of localStorage
          const sessionId = appState.sessionId;
          const userId = appState.user?.id;
          if (sessionId && userId) {
            finalizeSession(sessionId, {
              turns: conversationHistory.length,
              durationSeconds: appState.durationSeconds || 0,
              fullReport: data,
              userFeedback: null,
            }).catch(e => console.warn('Failed to save session to Supabase:', e));
          }
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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 24px' }}></div>
          <p style={{ color: '#1D4ED8', fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Analyzing Dynamics...</p>
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
    <div style={{ background: '#FFFFFF', minHeight: '100vh', padding: '40px 24px 80px', color: '#111827' }}>
      <div className="animate-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* TOP HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '13px' }}>
            <TrendingUp size={16} /> Difficulty: <span style={{ color: '#111827', fontWeight: '500' }}>{report.difficulty}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF', letterSpacing: '0.1em' }}>PRECISION FEEDBACK ENGINE</div>
        </div>

        {/* TOP MARKER GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '64px' }}>
          {/* WHAT LANDED */}
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ color: '#10B981', fontSize: '15px', fontWeight: '500' }}>What Landed</h3>
              <Target size={20} color="#10B981" style={{ opacity: 0.5 }} />
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6', marginBottom: '24px' }}>{report.what_landed.observation}</p>
            <div style={{ width: '100%', height: '4px', background: '#E5E7EB', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: `${report.what_landed.percentage}%`, height: '100%', background: '#10B981' }} />
            </div>
            <div style={{ textAlign: 'right', fontSize: '10px', color: '#10B981', marginTop: '8px' }}>{report.what_landed.percentage}%</div>
          </div>

          {/* HESITATION MARKERS */}
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ color: '#1D4ED8', fontSize: '15px', fontWeight: '500' }}>Hesitation Markers</h3>
              <Mic size={20} color="#1D4ED8" style={{ opacity: 0.5 }} />
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6', marginBottom: '24px' }}>{report.hesitation_markers.observation}</p>
            <div style={{ width: '100%', height: '4px', background: '#E5E7EB', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: report.hesitation_markers.impact_level === 'High' ? '100%' : report.hesitation_markers.impact_level === 'Medium' ? '60%' : '30%', height: '100%', background: '#1D4ED8' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '10px', color: '#1D4ED8' }}>{report.hesitation_markers.count} detected</span>
              <span style={{ fontSize: '10px', color: '#6B7280', textTransform: 'uppercase' }}>{report.hesitation_markers.impact_level}</span>
            </div>
          </div>

          {/* ONE THING TO FIX */}
          <div style={{ background: '#F9FAFB', borderLeft: '4px solid #EF4444', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ color: '#111827', fontSize: '15px', fontWeight: '500' }}>One Thing to Fix</h3>
              <AlertCircle size={20} color="#EF4444" style={{ opacity: 0.5 }} />
            </div>
            <p style={{ fontSize: '14px', color: '#111827', fontWeight: '500', marginBottom: '8px' }}>{report.one_thing_to_fix.headline}</p>
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6', marginBottom: '20px' }}>{report.one_thing_to_fix.observation}</p>
          </div>
        </div>

        {/* FILLER WORD ANALYTICS */}
        <FillerWordCard conversationHistory={conversationHistory} />

        {/* COACHING INSIGHTS */}
        <CoachingInsightsCard conversationHistory={conversationHistory} />

        {/* FULL TRANSCRIPT VIEWER */}
        <TranscriptViewer
          conversationHistory={conversationHistory}
          persona={persona}
          isExpanded={transcriptExpanded}
          onToggle={() => setTranscriptExpanded(e => !e)}
        />


        {/* SUGGESTED REPHRASING */}
        <div style={{ marginBottom: '64px' }}>
          <h4 style={{ fontSize: '11px', color: '#6B7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '24px' }}>Suggested Rephrasing</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
            <div style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '32px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-10px', left: '20px', background: '#FFFFFF', padding: '0 8px', fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase' }}>Your Response</div>
              <p style={{ fontSize: '16px', color: '#6B7280', fontStyle: 'italic', lineHeight: '1.6', marginBottom: '32px' }}>"{report.phrasing_deep_dive.original}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} color="#EF4444" style={{ transform: 'rotate(180deg)' }} />
                </div>
                <div>
                   <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase' }}>Impact</div>
                   <div style={{ fontSize: '13px', color: '#111827' }}>{report.phrasing_deep_dive.original_impact}</div>
                </div>
              </div>
            </div>
            <div style={{ background: '#FFFFFF', border: '1px solid rgba(29,78,216,0.3)', borderRadius: '12px', padding: '32px', position: 'relative', boxShadow: '0 8px 32px rgba(29,78,216,0.1)' }}>
              <div style={{ position: 'absolute', top: '-10px', left: '20px', background: '#FFFFFF', padding: '0 8px', fontSize: '10px', color: '#1D4ED8', textTransform: 'uppercase' }}>Stronger Alternative</div>
              <p style={{ fontSize: '16px', color: '#111827', lineHeight: '1.6', marginBottom: '32px' }}>"{report.phrasing_deep_dive.improved}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={16} color="#10B981" />
                </div>
                <div>
                   <div style={{ fontSize: '10px', color: '#10B981', textTransform: 'uppercase' }}>Impact</div>
                   <div style={{ fontSize: '13px', color: '#111827' }}>{report.phrasing_deep_dive.improved_impact}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NPS FEEDBACK WIDGET */}
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '20px', padding: '40px', marginBottom: '64px', textAlign: 'center' }}>
          {!reactionData.rating ? (
            <>
              <h3 style={{ fontSize: '18px', fontWeight: '300', marginBottom: '24px' }}>How was this practice session for you?</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
                <button 
                  onClick={() => setReactionData(prev => ({ ...prev, rating: 'up', reason: '' }))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={28} color="#10B981" />
                  </div>
                  <div style={{ fontSize: '11px', color: '#10B981', marginTop: '12px', textTransform: 'uppercase' }}>Helpful</div>
                </button>
                <button 
                  onClick={() => setReactionData(prev => ({ ...prev, rating: 'down', reason: '' }))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertCircle size={28} color="#EF4444" />
                  </div>
                  <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '12px', textTransform: 'uppercase' }}>Not Quite</div>
                </button>
              </div>
            </>
          ) : (
            <div className="animate-in">
              <h3 style={{ fontSize: '18px', fontWeight: '300', marginBottom: '16px', color: reactionData.rating === 'up' ? '#10B981' : '#EF4444' }}>
                {reactionData.rating === 'up' ? 'Glad it helped! Which part worked best?' : 'Where did we miss the mark?'}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
                {(reactionData.rating === 'up' ? ['Onboarding', 'Simulation', 'Coaching Feedback', 'Scenario Specificity'] : ["It wasn't realistic", "Feedback wasn't relevant", "Scenario didn't match", "Other"]).map(opt => (
                  <button 
                    key={opt}
                    onClick={() => setReactionData(prev => ({ ...prev, reason: opt }))}
                    style={{ 
                      padding: '10px 20px', borderRadius: '30px', border: `1px solid ${reactionData.reason === opt ? '#1D4ED8' : '#E5E7EB'}`,
                      background: reactionData.reason === opt ? 'rgba(29,78,216,0.08)' : 'transparent',
                      color: reactionData.reason === opt ? '#1D4ED8' : '#6B7280',
                      cursor: 'pointer', fontSize: '13px'
                    }}
                  >{opt}</button>
                ))}
              </div>
              {reactionData.reason === 'Other' && (
                <textarea 
                  placeholder="Tell us more (max 300 words)..."
                  maxLength={1500}
                  value={reactionData.customText || ""}
                  onChange={e => setReactionData(prev => ({ ...prev, customText: e.target.value }))}
                  style={{ width: '100%', maxWidth: '400px', height: '100px', background: '#F3F4F6', border: '1px solid #E5E7EB', padding: '12px', color: '#111827', outline: 'none', marginBottom: '16px', fontSize: '14px' }}
                />
              )}
              {reactionData.reason && (
                <div style={{ marginTop: '24px' }}>
                  {!reactionData.submitted ? (
                    <button 
                      onClick={() => {
                        const sessionId = appState.sessionId;
                        if (sessionId) {
                          finalizeSession(sessionId, {
                            turns: conversationHistory.length,
                            durationSeconds: appState.durationSeconds || 0,
                            fullReport: report,
                            userFeedback: {
                              rating: reactionData.rating,
                              reason: reactionData.reason,
                              text: reactionData.customText || '',
                            },
                          }).catch(e => console.warn('Failed to save feedback:', e));
                        }
                        setReactionData(prev => ({ ...prev, submitted: true }));
                      }}
                      style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: '#FFF', border: 'none', padding: '12px 32px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,78,216,0.25)' }}
                    >
                      Submit Review
                    </button>
                  ) : (
                    <p style={{ color: '#1D4ED8', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Check size={18} /> Review Submitted. We'll use this to refine the coach.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM NAV */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
           <button onClick={handleReturnHome} style={{ background: 'transparent', border: '1px solid #E5E7EB', color: '#6B7280', padding: '12px 32px', borderRadius: '10px', cursor: 'pointer' }}>Dashboard Home</button>
           <button onClick={handlePracticeAgain} style={{ background: 'linear-gradient(135deg, #1D4ED8, #2563EB)', color: '#FFFFFF', border: 'none', padding: '12px 32px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 14px rgba(29,78,216,0.25)' }}>Practice Again</button>
        </div>

      </div>
    </div>
  );
}

export default FeedbackReport;
