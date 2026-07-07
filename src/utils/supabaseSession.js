import { supabase } from './supabase';

/**
 * supabaseSession.js — CRUD for sessions and conversation turns.
 *
 * Tables:
 *   sessions           — one row per practice session
 *   conversation_turns  — one row per user/model message
 */

// ── Sessions ──────────────────────────────────────────────────────────────────

/** Create a new session row and return its UUID. */
export async function createSession(userId, scenario) {
  console.log('[SUPABASE] createSession called:', { userId, scenario });
  const { data, error } = await supabase
    .from('sessions')
    .insert({ user_id: userId, scenario })
    .select('id')
    .single();
  if (error) { console.error('[SUPABASE] createSession ERROR:', error.message, error.code); throw error; }
  console.log('[SUPABASE] createSession SUCCESS, id:', data.id);
  return data.id;
}

/** Update a session with final data (turns, duration, report). */
export async function finalizeSession(sessionId, { turns, durationSeconds, fullReport, userFeedback }) {
  const { error } = await supabase
    .from('sessions')
    .update({
      turns,
      duration_seconds: durationSeconds,
      full_report: fullReport,
      user_feedback: userFeedback || null,
    })
    .eq('id', sessionId);
  if (error) console.error('finalizeSession error:', error);
}

/** Get all sessions for the current user, newest first. */
export async function getUserSessions(userId) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getUserSessions error:', error); return []; }
  return data || [];
}

/** Delete a session (cascade deletes its turns via FK). */
export async function deleteSession(sessionId) {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);
  if (error) console.error('deleteSession error:', error);
}

/** Count sessions for a specific scenario (for phase advancement). */
export async function getScenarioSessionCount(userId, scenario) {
  const { count, error } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('scenario', scenario);
  if (error) { console.error('getScenarioSessionCount error:', error); return 0; }
  return count || 0;
}

// ── Conversation Turns ────────────────────────────────────────────────────────

/** Save a single conversation turn. */
export async function saveTurn(sessionId, userId, turnIndex, role, content, coachingAside) {
  console.log('[SUPABASE] saveTurn called:', { sessionId, userId, turnIndex, role, contentLen: content?.length });
  const { data, error } = await supabase
    .from('conversation_turns')
    .insert({
      session_id: sessionId,
      user_id: userId,
      turn_index: turnIndex,
      role,
      content,
      coaching_aside: coachingAside || null,
    })
    .select();
  
  if (error) {
    console.error('[SUPABASE] saveTurn ERROR:', error.message, error.details, error.hint, error.code);
    throw error;
  }
  
  // PostgREST can return success with 0 rows if RLS blocks the insert without a WITH CHECK violation
  if (!data || data.length === 0) {
     console.error('[SUPABASE] saveTurn SILENT FAIL: 0 rows inserted. RLS might be blocking this.');
     throw new Error('RLS blocked insert in conversation_turns');
  }
  console.log('[SUPABASE] saveTurn SUCCESS for turn', turnIndex);
}

/** Get the last N turns for a session, ordered by turn_index ascending. */
export async function getRecentTurns(sessionId, n = 10) {
  console.log('[SUPABASE] getRecentTurns called for session:', sessionId);
  // First get total count, then fetch the last N
  const { data, error } = await supabase
    .from('conversation_turns')
    .select('turn_index, role, content, coaching_aside')
    .eq('session_id', sessionId)
    .order('turn_index', { ascending: true });
  if (error) { 
    console.error('[SUPABASE] getRecentTurns ERROR:', error); 
    return []; 
  }
  console.log(`[SUPABASE] getRecentTurns fetched ${data?.length || 0} rows from DB.`);
  // Return only the last N
  return (data || []).slice(-n);
}

/** Get ALL turns for a session (for transcript viewer). */
export async function getAllTurns(sessionId) {
  const { data, error } = await supabase
    .from('conversation_turns')
    .select('turn_index, role, content, coaching_aside')
    .eq('session_id', sessionId)
    .order('turn_index', { ascending: true });
  if (error) { console.error('getAllTurns error:', error); return []; }
  return data || [];
}
