import React, { useState, useEffect, useCallback } from 'react';
import { 
  Home, 
  Settings, 
  BarChart3, 
  Sliders
} from 'lucide-react';

// Pages
import HomePage from './pages/HomePage';
import SetupPage from './pages/SetupPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';

// Hooks
import { useWorkoutTimer } from './hooks/useWorkoutTimer';

// Supabase
import { 
  supabase, 
  signOut, 
  getProfile, 
  updateProfile,
  getPrograms,
  createDefaultPrograms,
  updateProgram,
  getWorkoutHistory,
  addWorkout,
  deleteWorkout
} from './lib/supabase';

// Utils (for sounds, voice, etc.)
import { getDefaultSettings } from './utils/storage';

const PAGES = {
  HOME: 'home',
  SETUP: 'setup',
  STATS: 'stats',
  SETTINGS: 'settings',
};

function App() {
  // Auth State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App State
  const [currentPage, setCurrentPage] = useState(PAGES.HOME);
  const [programs, setPrograms] = useState([]);
  const [settings, setSettings] = useState(getDefaultSettings());
  const [history, setHistory] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        // Reset state on logout
        setPrograms([]);
        setSettings(getDefaultSettings());
        setHistory([]);
        setIsLoaded(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data when user logs in
  useEffect(() => {
    if (user && !isLoaded) {
      loadUserData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoaded]);

  // Load all user data from Supabase
  const loadUserData = async () => {
    try {
      // Load profile/settings
      const { data: profileData } = await getProfile(user.id);
      if (profileData) {
        const loadedSettings = {
          theme: profileData.theme || 'dark',
          unit: profileData.unit || 'kmh',
          soundEnabled: profileData.sound_enabled ?? true,
          vibrationEnabled: profileData.vibration_enabled ?? true,
          voiceEnabled: profileData.voice_enabled ?? true,
          voiceLanguage: profileData.voice_language || 'fr',
          voiceName: profileData.voice_name || '',
          voiceAnnounceTime: profileData.voice_announce_time ?? true,
          userSex: profileData.user_sex || 'male',
          userWeight: profileData.user_weight || 70,
          userHeight: profileData.user_height || 170,
        };
        setSettings(loadedSettings);
        document.documentElement.setAttribute('data-theme', loadedSettings.theme);
      }

      // Load programs
      let { data: programsData } = await getPrograms(user.id);
      
      // If user has no programs, create default ones
      if (!programsData || programsData.length === 0) {
        console.log('No programs found, creating defaults...');
        const { data: newPrograms } = await createDefaultPrograms(user.id);
        programsData = newPrograms;
      }
      
      if (programsData && programsData.length > 0) {
        const formattedPrograms = programsData.map(p => ({
          id: p.id,
          name: p.name,
          position: p.position,
          repeatCount: p.repeat_count || 1,
          intervals: p.intervals || [],
        }));
        setPrograms(formattedPrograms);
        
        // Set default selected program
        const firstWithIntervals = formattedPrograms.find(p => p.intervals.length > 0);
        setSelectedProgramId(firstWithIntervals?.id || formattedPrograms[0]?.id);
      }

      // Load history
      const { data: historyData } = await getWorkoutHistory(user.id);
      if (historyData) {
        const formattedHistory = historyData.map(h => ({
          id: h.id,
          programName: h.program_name,
          duration: h.duration,
          calories: h.calories,
          completed: h.completed,
          date: h.workout_date,
        }));
        setHistory(formattedHistory);
      }

      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsLoaded(true);
    }
  };

  // Save settings to Supabase
  const handleSettingsChange = async (newSettings) => {
    setSettings(newSettings);
    document.documentElement.setAttribute('data-theme', newSettings.theme);
    
    if (user) {
      await updateProfile(user.id, {
        theme: newSettings.theme,
        unit: newSettings.unit,
        sound_enabled: newSettings.soundEnabled,
        vibration_enabled: newSettings.vibrationEnabled,
        voice_enabled: newSettings.voiceEnabled,
        voice_language: newSettings.voiceLanguage,
        voice_name: newSettings.voiceName,
        voice_announce_time: newSettings.voiceAnnounceTime,
        user_sex: newSettings.userSex,
        user_weight: newSettings.userWeight,
        user_height: newSettings.userHeight,
      });
    }
  };

  // Save program to Supabase
  const handleProgramChange = async (updatedProgramsOrFn) => {
    // Support both direct value and callback function (like setState)
    let newPrograms;
    if (typeof updatedProgramsOrFn === 'function') {
      newPrograms = updatedProgramsOrFn(programs);
    } else {
      newPrograms = updatedProgramsOrFn;
    }
    
    // Save to Supabase FIRST (before updating local state)
    if (user && newPrograms) {
      // Find which programs changed by comparing with current
      for (let i = 0; i < newPrograms.length; i++) {
        const newProg = newPrograms[i];
        const oldProg = programs[i];
        
        // Only update if something changed
        if (!oldProg || 
            newProg.name !== oldProg.name || 
            newProg.repeatCount !== oldProg.repeatCount ||
            JSON.stringify(newProg.intervals) !== JSON.stringify(oldProg.intervals)) {
          
          console.log('Saving program:', newProg.name, 'ID:', newProg.id);
          const { data, error } = await updateProgram(newProg.id, {
            name: newProg.name,
            repeat_count: newProg.repeatCount,
            intervals: newProg.intervals,
          });
          if (error) {
            console.error('Supabase error:', error);
          } else {
            console.log('Saved successfully:', data);
          }
        }
      }
    }
    
    // Then update local state
    setPrograms(newPrograms);
  };

  // Add workout to history
  const handleAddWorkout = async (workout) => {
    if (user) {
      const { data } = await addWorkout(user.id, workout);
      if (data) {
        const newEntry = {
          id: data.id,
          programName: data.program_name,
          duration: data.duration,
          calories: data.calories,
          completed: data.completed,
          date: data.workout_date,
        };
        setHistory(prev => [newEntry, ...prev]);
      }
    }
  };

  // Delete workout from history
  const handleDeleteWorkout = async (workoutId) => {
    if (user) {
      await deleteWorkout(workoutId);
      setHistory(prev => prev.filter(h => h.id !== workoutId));
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (window.confirm('Voulez-vous vous déconnecter ?')) {
      await signOut();
    }
  };

  // Calculate total time for a program
  const calculateTotalTime = useCallback((program) => {
    if (!program || !program.intervals.length) return 0;
    const singleRunTime = program.intervals.reduce((sum, int) => sum + int.duration, 0);
    return singleRunTime * (program.repeatCount || 1);
  }, []);

  // Timer hook
  const timer = useWorkoutTimer(settings, handleAddWorkout);

  // Prevent navigation during workout
  const handlePageChange = (page) => {
    if (timer.isRunning && !timer.isPaused) {
      if (window.confirm('Un entraînement est en cours. Voulez-vous vraiment quitter ?')) {
        timer.stopWorkout(true);
        setCurrentPage(page);
      }
    } else {
      setCurrentPage(page);
    }
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="app" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🏃‍♂️</div>
          <div style={{ color: 'var(--text-secondary)' }}>Chargement...</div>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage onAuthSuccess={setUser} />;
  }

  // Data loading state
  if (!isLoaded) {
    return (
      <div className="app" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🏃‍♂️</div>
          <div style={{ color: 'var(--text-secondary)' }}>Synchronisation...</div>
        </div>
      </div>
    );
  }

  // Render page content
  const renderPage = () => {
    switch (currentPage) {
      case PAGES.HOME:
        return (
          <HomePage 
            programs={programs}
            settings={settings}
            timer={timer}
            selectedProgramId={selectedProgramId}
            setSelectedProgramId={setSelectedProgramId}
          />
        );
      case PAGES.SETUP:
        return (
          <SetupPage 
            programs={programs}
            setPrograms={handleProgramChange}
            settings={settings}
            calculateTotalTime={calculateTotalTime}
          />
        );
      case PAGES.STATS:
        return (
          <StatsPage 
            history={history}
            setHistory={setHistory}
            onDeleteWorkout={handleDeleteWorkout}
          />
        );
      case PAGES.SETTINGS:
        return (
          <SettingsPage 
            settings={settings}
            setSettings={handleSettingsChange}
            user={user}
            onLogout={handleLogout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
      {/* Main Content */}
      <main className="main-content">
        {renderPage()}
      </main>

      {/* Bottom Navigation */}
      <nav className="nav">
        <button 
          className={`nav-item ${currentPage === PAGES.HOME ? 'active' : ''}`}
          onClick={() => handlePageChange(PAGES.HOME)}
        >
          <Home />
          <span>Accueil</span>
        </button>
        <button 
          className={`nav-item ${currentPage === PAGES.SETUP ? 'active' : ''}`}
          onClick={() => handlePageChange(PAGES.SETUP)}
        >
          <Sliders />
          <span>Setup</span>
        </button>
        <button 
          className={`nav-item ${currentPage === PAGES.STATS ? 'active' : ''}`}
          onClick={() => handlePageChange(PAGES.STATS)}
        >
          <BarChart3 />
          <span>Stats</span>
        </button>
        <button 
          className={`nav-item ${currentPage === PAGES.SETTINGS ? 'active' : ''}`}
          onClick={() => handlePageChange(PAGES.SETTINGS)}
        >
          <Settings />
          <span>Réglages</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
