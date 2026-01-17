import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zshtwsnlayufjazcpnqt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzaHR3c25sYXl1ZmphemNwbnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MDI4NTAsImV4cCI6MjA4NDE3ODg1MH0.P7IBhhDjs7pQgvIu-QoJQBE6LA1wFua3BjzrAm9q0uQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =============================================
// AUTH FUNCTIONS
// =============================================

export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// =============================================
// PROFILE FUNCTIONS
// =============================================

export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

// =============================================
// PROGRAMS FUNCTIONS
// =============================================

export const getPrograms = async (userId) => {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true });
  return { data, error };
};

// Create default programs for a user (if they don't exist)
export const createDefaultPrograms = async (userId) => {
  const defaultPrograms = [];
  for (let i = 0; i < 10; i++) {
    defaultPrograms.push({
      user_id: userId,
      name: `Programme ${i + 1}`,
      position: i,
      repeat_count: 1,
      intervals: i === 0 ? [
        { id: 1, name: "Échauffement", duration: 300, incline: 1, speed: 4 },
        { id: 2, name: "Marche rapide", duration: 300, incline: 2, speed: 5.5 },
        { id: 3, name: "Course légère", duration: 300, incline: 1, speed: 7 },
        { id: 4, name: "Récupération", duration: 180, incline: 0, speed: 4 }
      ] : [],
    });
  }
  
  const { data, error } = await supabase
    .from('programs')
    .insert(defaultPrograms)
    .select();
  
  return { data, error };
};

export const updateProgram = async (programId, updates) => {
  const { data, error } = await supabase
    .from('programs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', programId)
    .select()
    .single();
  return { data, error };
};

// =============================================
// WORKOUT HISTORY FUNCTIONS
// =============================================

export const getWorkoutHistory = async (userId) => {
  const { data, error } = await supabase
    .from('workout_history')
    .select('*')
    .eq('user_id', userId)
    .order('workout_date', { ascending: false });
  return { data, error };
};

export const addWorkout = async (userId, workout) => {
  const { data, error } = await supabase
    .from('workout_history')
    .insert({
      user_id: userId,
      program_name: workout.programName,
      duration: workout.duration,
      calories: workout.calories,
      completed: workout.completed,
      workout_date: new Date().toISOString(),
    })
    .select()
    .single();
  return { data, error };
};

export const deleteWorkout = async (workoutId) => {
  const { error } = await supabase
    .from('workout_history')
    .delete()
    .eq('id', workoutId);
  return { error };
};
