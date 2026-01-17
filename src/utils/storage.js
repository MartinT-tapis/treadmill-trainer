// ===== Local Storage Utilities =====

const STORAGE_KEYS = {
  PROGRAMS: 'treadmill_programs',
  SETTINGS: 'treadmill_settings',
  HISTORY: 'treadmill_history',
};

// Default programs
export const getDefaultPrograms = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `program_${i + 1}`,
    name: i === 0 ? 'Programme 1' : `Programme ${i + 1}`,
    intervals: i === 0 ? [
      { id: 1, name: 'Échauffement', duration: 300, incline: 1, speed: 4 },
      { id: 2, name: 'Marche rapide', duration: 300, incline: 2, speed: 5.5 },
      { id: 3, name: 'Course légère', duration: 300, incline: 1, speed: 7 },
      { id: 4, name: 'Récupération', duration: 180, incline: 0, speed: 4 },
      { id: 5, name: 'Sprint final', duration: 120, incline: 3, speed: 9 },
    ] : [],
    repeatCount: 1,
  }));
};

// Default settings
export const getDefaultSettings = () => ({
  theme: 'dark',
  unit: 'kmh', // 'kmh' or 'mph'
  soundEnabled: true,
  vibrationEnabled: true,
  // Voice settings
  voiceEnabled: true,
  voiceLanguage: 'fr', // 'fr' or 'en'
  voiceName: '', // Will be set to first available female voice
  voiceAnnounceTime: true, // Announce remaining time during intervals
  // User profile for calorie calculation
  userSex: 'male', // 'male' or 'female'
  userWeight: 70, // kg
  userHeight: 170, // cm
});

// Programs
export const loadPrograms = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRAMS);
    return data ? JSON.parse(data) : getDefaultPrograms();
  } catch (e) {
    console.error('Error loading programs:', e);
    return getDefaultPrograms();
  }
};

export const savePrograms = (programs) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(programs));
  } catch (e) {
    console.error('Error saving programs:', e);
  }
};

// Settings
export const loadSettings = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...getDefaultSettings(), ...JSON.parse(data) } : getDefaultSettings();
  } catch (e) {
    console.error('Error loading settings:', e);
    return getDefaultSettings();
  }
};

export const saveSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
};

// History
export const loadHistory = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error loading history:', e);
    return [];
  }
};

export const saveHistory = (history) => {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error('Error saving history:', e);
  }
};

export const addWorkoutToHistory = (workout) => {
  const history = loadHistory();
  history.unshift({
    id: Date.now(),
    date: new Date().toISOString(),
    ...workout,
  });
  // Keep only last 365 days
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const filteredHistory = history.filter(w => new Date(w.date) > oneYearAgo);
  saveHistory(filteredHistory);
  return filteredHistory;
};

// ===== Formatting Utilities =====

export const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatTimeShort = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h${remainingMins > 0 ? remainingMins + 'm' : ''}`;
  }
  return secs > 0 ? `${mins}m${secs}s` : `${mins}m`;
};

export const parseTimeInput = (value) => {
  // Parse MM:SS or HH:MM:SS format
  const parts = value.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
};

export const formatTimeInput = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const convertSpeed = (speed, fromUnit, toUnit) => {
  if (fromUnit === toUnit) return speed;
  if (fromUnit === 'kmh' && toUnit === 'mph') {
    return Math.round(speed * 0.621371 * 10) / 10;
  }
  if (fromUnit === 'mph' && toUnit === 'kmh') {
    return Math.round(speed * 1.60934 * 10) / 10;
  }
  return speed;
};

export const getSpeedUnit = (unit) => unit === 'kmh' ? 'km/h' : 'mph';

// ===== Calorie Calculation =====
// Rough estimate based on MET values
export const calculateCalories = (intervals, weight = 70, sex = 'male') => {
  let totalCalories = 0;
  
  intervals.forEach(interval => {
    const durationHours = interval.duration / 3600;
    const speed = interval.speed;
    const incline = interval.incline;
    
    // Base MET for walking/running
    let met = 1;
    if (speed < 5) {
      met = 2.5 + (speed * 0.3); // Walking
    } else if (speed < 8) {
      met = 6 + ((speed - 5) * 1.5); // Jogging
    } else {
      met = 10 + ((speed - 8) * 1); // Running
    }
    
    // Add incline factor (roughly 0.5 MET per % incline)
    met += incline * 0.5;
    
    // Calories = MET × weight (kg) × duration (hours)
    let calories = met * weight * durationHours;
    
    // Adjust for sex (women typically burn ~10% fewer calories)
    if (sex === 'female') {
      calories *= 0.9;
    }
    
    totalCalories += calories;
  });
  
  return Math.round(totalCalories);
};

// ===== Date Utilities =====

export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  const options = format === 'short' 
    ? { day: 'numeric', month: 'short' }
    : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  return d.toLocaleDateString('fr-FR', options);
};

export const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();
};

export const getWeekDays = () => ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export const getMonthName = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};

export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

// ===== Sound Utilities =====

export const playBeep = (frequency = 800, duration = 200, volume = 0.5) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gainNode.gain.value = volume;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (e) {
    console.error('Error playing sound:', e);
  }
};

export const playIntervalChange = () => {
  playBeep(600, 150);
  setTimeout(() => playBeep(800, 150), 200);
  setTimeout(() => playBeep(1000, 200), 400);
};

export const playWorkoutComplete = () => {
  playBeep(800, 200);
  setTimeout(() => playBeep(1000, 200), 250);
  setTimeout(() => playBeep(1200, 300), 500);
  setTimeout(() => playBeep(1000, 200), 850);
  setTimeout(() => playBeep(1200, 400), 1100);
};

export const playCountdown = () => {
  playBeep(600, 100, 0.3);
};

// ===== Vibration Utilities =====

export const vibrate = (pattern = [200]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

export const vibrateIntervalChange = () => {
  vibrate([100, 50, 100, 50, 200]);
};

export const vibrateWorkoutComplete = () => {
  vibrate([200, 100, 200, 100, 400]);
};

// ===== Voice Synthesis Utilities =====

// Get available voices filtered by language
export const getAvailableVoices = (language = 'fr') => {
  if (!('speechSynthesis' in window)) return [];
  
  const voices = window.speechSynthesis.getVoices();
  const langCode = language === 'fr' ? 'fr' : 'en';
  
  return voices.filter(voice => voice.lang.startsWith(langCode));
};

// Get preferred female voice for language
export const getPreferredVoice = (language = 'fr', voiceName = '') => {
  const voices = getAvailableVoices(language);
  
  // If a specific voice is selected, try to find it
  if (voiceName) {
    const selectedVoice = voices.find(v => v.name === voiceName);
    if (selectedVoice) return selectedVoice;
  }
  
  // Prefer female voices (usually have "female", "femme", or common female names)
  const femaleKeywords = ['female', 'femme', 'amelie', 'marie', 'julie', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona', 'veena', 'zira', 'hazel', 'susan', 'alice'];
  
  const femaleVoice = voices.find(voice => 
    femaleKeywords.some(keyword => voice.name.toLowerCase().includes(keyword))
  );
  
  if (femaleVoice) return femaleVoice;
  
  // Return first available voice for the language
  return voices[0] || null;
};

// Speak text
export const speak = (text, settings = {}) => {
  if (!('speechSynthesis' in window)) return;
  if (!settings.voiceEnabled) return;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getPreferredVoice(settings.voiceLanguage, settings.voiceName);
  
  if (voice) {
    utterance.voice = voice;
  }
  
  utterance.lang = settings.voiceLanguage === 'fr' ? 'fr-FR' : 'en-US';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  window.speechSynthesis.speak(utterance);
};

// Voice messages
export const getVoiceMessages = (language = 'fr') => {
  if (language === 'fr') {
    return {
      countdown: (n) => n.toString(),
      changeIn: 'Changement dans',
      speed: 'Vitesse',
      incline: 'Inclinaison',
      percent: 'pourcent',
      start: "C'est parti!",
      pause: 'Pause',
      resume: 'On reprend!',
      complete: 'Bravo! Entraînement terminé!',
      interval: (name) => name,
      minutesRemaining: (n) => n === 1 ? '1 minute restante' : `${n} minutes restantes`,
      secondsRemaining: (n) => `${n} secondes restantes`,
    };
  }
  return {
    countdown: (n) => n.toString(),
    changeIn: 'Change in',
    speed: 'Speed',
    incline: 'Incline',
    percent: 'percent',
    start: "Let's go!",
    pause: 'Paused',
    resume: "Let's continue!",
    complete: 'Great job! Workout complete!',
    interval: (name) => name,
    minutesRemaining: (n) => n === 1 ? '1 minute remaining' : `${n} minutes remaining`,
    secondsRemaining: (n) => `${n} seconds remaining`,
  };
};

// Announce countdown
export const announceCountdown = (seconds, settings) => {
  const messages = getVoiceMessages(settings.voiceLanguage);
  if (seconds === 5) {
    speak(`${messages.changeIn} 5`, settings);
  } else if (seconds <= 4 && seconds >= 1) {
    speak(messages.countdown(seconds), settings);
  }
};

// Announce time remaining (called at specific intervals)
export const announceTimeRemaining = (seconds, settings) => {
  if (!settings.voiceAnnounceTime) return;
  
  const messages = getVoiceMessages(settings.voiceLanguage);
  
  // Announce at 5, 4, 3, 2, 1 minutes and 30 seconds
  if (seconds === 300) { // 5 minutes
    speak(messages.minutesRemaining(5), settings);
  } else if (seconds === 240) { // 4 minutes
    speak(messages.minutesRemaining(4), settings);
  } else if (seconds === 180) { // 3 minutes
    speak(messages.minutesRemaining(3), settings);
  } else if (seconds === 120) { // 2 minutes
    speak(messages.minutesRemaining(2), settings);
  } else if (seconds === 60) { // 1 minute
    speak(messages.minutesRemaining(1), settings);
  } else if (seconds === 30) { // 30 seconds
    speak(messages.secondsRemaining(30), settings);
  }
};

// Announce interval change
export const announceIntervalChange = (interval, settings) => {
  const messages = getVoiceMessages(settings.voiceLanguage);
  
  const text = `${messages.interval(interval.name)}. ${messages.speed} ${interval.speed}. ${messages.incline} ${interval.incline} ${messages.percent}.`;
  
  // Small delay to let countdown finish
  setTimeout(() => speak(text, settings), 300);
};

// Announce workout start
export const announceWorkoutStart = (interval, settings) => {
  const messages = getVoiceMessages(settings.voiceLanguage);
  const text = `${messages.start} ${messages.interval(interval.name)}. ${messages.speed} ${interval.speed}. ${messages.incline} ${interval.incline} ${messages.percent}.`;
  speak(text, settings);
};

// Announce pause/resume
export const announcePause = (settings) => {
  const messages = getVoiceMessages(settings.voiceLanguage);
  speak(messages.pause, settings);
};

export const announceResume = (settings) => {
  const messages = getVoiceMessages(settings.voiceLanguage);
  speak(messages.resume, settings);
};

// Announce workout complete
export const announceWorkoutComplete = (settings) => {
  const messages = getVoiceMessages(settings.voiceLanguage);
  speak(messages.complete, settings);
};
