import { supabase } from './supabase';

/**
 * supabaseProfile.js — CRUD for user_profiles table.
 *
 * Stores onboarding answers so they persist across sessions.
 */

/** Upsert (create or update) a user profile. */
export async function upsertProfile(userId, profile) {
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      who_are_you: profile.whoAreYou || null,
      practice_goal: profile.practiceGoal || null,
      actual_situation: profile.actualSituation || null,
      communication_fear: profile.communicationFear || null,
      relationship_context: profile.relationshipContext || null,
      experience_level: profile.experienceLevel || null,
      updated_at: new Date().toISOString(),
    })
    .select();
  if (error) {
    console.error('[SUPABASE] upsertProfile ERROR:', error.message, error.details);
    throw error;
  }
  if (!data || data.length === 0) {
     console.error('[SUPABASE] upsertProfile SILENT FAIL: 0 rows inserted. RLS might be blocking this.');
     throw new Error('RLS blocked upsert in user_profiles');
  }
  console.log('[SUPABASE] upsertProfile SUCCESS');
}

/** Get a user's profile. */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') { // PGRST116 = row not found
    console.error('getProfile error:', error);
  }
  return data || null;
}
