import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  playIntervalChange, 
  playWorkoutComplete, 
  playCountdown,
  vibrateIntervalChange, 
  vibrateWorkoutComplete,
  calculateCalories,
  announceCountdown,
  announceIntervalChange,
  announceWorkoutStart,
  announcePause,
  announceResume,
  announceWorkoutComplete,
  announceTimeRemaining
} from '../utils/storage';

// Create silent audio to keep app alive in background
const createSilentAudio = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Set volume to almost zero (silent but keeps app active)
    gainNode.gain.value = 0.001;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 1;
    
    return { audioContext, oscillator };
  } catch (e) {
    console.log('Could not create background audio');
    return null;
  }
};

export const useWorkoutTimer = (settings, onAddWorkout) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentProgram, setCurrentProgram] = useState(null);
  const [currentIntervalIndex, setCurrentIntervalIndex] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const intervalRef = useRef(null);
  const lastCountdownRef = useRef(null);
  const onAddWorkoutRef = useRef(onAddWorkout);
  const justStartedIntervalRef = useRef(false); // Pour éviter d'annoncer le temps au début
  
  // Keep ref updated
  useEffect(() => {
    onAddWorkoutRef.current = onAddWorkout;
  }, [onAddWorkout]);
  const silentAudioRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Keep app alive in background
  const startBackgroundKeepAlive = useCallback(async () => {
    // Method 1: Silent audio (keeps browser active)
    if (!silentAudioRef.current) {
      silentAudioRef.current = createSilentAudio();
      if (silentAudioRef.current) {
        silentAudioRef.current.oscillator.start();
      }
    }
    
    // Method 2: Wake Lock (keeps screen on if supported)
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (e) {
      // Wake lock not supported or failed
    }
  }, []);

  const stopBackgroundKeepAlive = useCallback(() => {
    // Stop silent audio
    if (silentAudioRef.current) {
      try {
        silentAudioRef.current.oscillator.stop();
        silentAudioRef.current.audioContext.close();
      } catch (e) {}
      silentAudioRef.current = null;
    }
    
    // Release wake lock
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
      } catch (e) {}
      wakeLockRef.current = null;
    }
  }, []);

  // Start/stop background keep-alive based on workout state
  useEffect(() => {
    if (isRunning && !isPaused && !isComplete) {
      startBackgroundKeepAlive();
    } else if (!isRunning || isComplete) {
      stopBackgroundKeepAlive();
    }
    
    return () => stopBackgroundKeepAlive();
  }, [isRunning, isPaused, isComplete, startBackgroundKeepAlive, stopBackgroundKeepAlive]);

  // Calculate total time for current program (including repeats)
  const calculateTotalTime = useCallback((program) => {
    if (!program || !program.intervals.length) return 0;
    const singleRunTime = program.intervals.reduce((sum, int) => sum + int.duration, 0);
    return singleRunTime * (program.repeatCount || 1);
  }, []);

  // Calculate elapsed time
  const calculateElapsedTime = useCallback(() => {
    if (!currentProgram) return 0;
    const singleRunTime = currentProgram.intervals.reduce((sum, int) => sum + int.duration, 0);
    const completedRepeats = currentRepeat - 1;
    const completedIntervalsTime = currentProgram.intervals
      .slice(0, currentIntervalIndex)
      .reduce((sum, int) => sum + int.duration, 0);
    const currentIntervalElapsed = currentProgram.intervals[currentIntervalIndex]
      ? currentProgram.intervals[currentIntervalIndex].duration - timeRemaining
      : 0;
    
    return (completedRepeats * singleRunTime) + completedIntervalsTime + currentIntervalElapsed;
  }, [currentProgram, currentRepeat, currentIntervalIndex, timeRemaining]);

  // Start workout
  const startWorkout = useCallback((program) => {
    if (!program || !program.intervals.length) return;
    
    setCurrentProgram(program);
    setCurrentIntervalIndex(0);
    setCurrentRepeat(1);
    setTimeRemaining(program.intervals[0].duration);
    setTotalTimeRemaining(calculateTotalTime(program));
    setIsRunning(true);
    setIsPaused(false);
    setIsComplete(false);
    lastCountdownRef.current = null;
    justStartedIntervalRef.current = true; // Don't announce time at start
    
    // Announce workout start
    announceWorkoutStart(program.intervals[0], settings);
  }, [calculateTotalTime, settings]);

  // Pause/Resume
  const togglePause = useCallback(() => {
    if (isRunning) {
      setIsPaused(prev => {
        const newPaused = !prev;
        if (newPaused) {
          announcePause(settings);
        } else {
          announceResume(settings);
        }
        return newPaused;
      });
    }
  }, [isRunning, settings]);

  // Stop workout
  const stopWorkout = useCallback((saveToHistory = true) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (saveToHistory && currentProgram && isRunning) {
      const elapsedTime = calculateElapsedTime();
      if (elapsedTime > 60) { // Only save if more than 1 minute
        const completedIntervals = [
          ...currentProgram.intervals.slice(0, currentIntervalIndex),
          ...(timeRemaining < currentProgram.intervals[currentIntervalIndex]?.duration 
            ? [{
                ...currentProgram.intervals[currentIntervalIndex],
                duration: currentProgram.intervals[currentIntervalIndex].duration - timeRemaining
              }]
            : [])
        ];
        
        if (onAddWorkoutRef.current) {
          onAddWorkoutRef.current({
            programId: currentProgram.id,
            programName: currentProgram.name,
            duration: elapsedTime,
            calories: calculateCalories(completedIntervals, settings.userWeight || 70, settings.userSex || 'male'),
            completed: isComplete,
          });
        }
      }
    }
    
    setIsRunning(false);
    setIsPaused(false);
    setCurrentProgram(null);
    setCurrentIntervalIndex(0);
    setCurrentRepeat(1);
    setTimeRemaining(0);
    setTotalTimeRemaining(0);
    setIsComplete(false);
  }, [currentProgram, isRunning, isComplete, currentIntervalIndex, timeRemaining, calculateElapsedTime, settings.userWeight, settings.userSex]);

  // Skip to next interval
  const skipInterval = useCallback(() => {
    if (!currentProgram || !isRunning) return;
    
    const intervals = currentProgram.intervals;
    const repeatCount = currentProgram.repeatCount || 1;
    
    if (currentIntervalIndex < intervals.length - 1) {
      // Next interval in current repeat
      setCurrentIntervalIndex(prev => prev + 1);
      setTimeRemaining(intervals[currentIntervalIndex + 1].duration);
      
      if (settings.soundEnabled) playIntervalChange();
      if (settings.vibrationEnabled) vibrateIntervalChange();
    } else if (currentRepeat < repeatCount) {
      // Next repeat
      setCurrentRepeat(prev => prev + 1);
      setCurrentIntervalIndex(0);
      setTimeRemaining(intervals[0].duration);
      
      if (settings.soundEnabled) playIntervalChange();
      if (settings.vibrationEnabled) vibrateIntervalChange();
    } else {
      // Workout complete
      setIsComplete(true);
      if (settings.soundEnabled) playWorkoutComplete();
      if (settings.vibrationEnabled) vibrateWorkoutComplete();
    }
  }, [currentProgram, isRunning, currentIntervalIndex, currentRepeat, settings]);

  // Previous interval
  const previousInterval = useCallback(() => {
    if (!currentProgram || !isRunning) return;
    
    const intervals = currentProgram.intervals;
    
    if (currentIntervalIndex > 0) {
      setCurrentIntervalIndex(prev => prev - 1);
      setTimeRemaining(intervals[currentIntervalIndex - 1].duration);
    } else if (currentRepeat > 1) {
      setCurrentRepeat(prev => prev - 1);
      setCurrentIntervalIndex(intervals.length - 1);
      setTimeRemaining(intervals[intervals.length - 1].duration);
    }
  }, [currentProgram, isRunning, currentIntervalIndex, currentRepeat]);

  // Timer effect
  useEffect(() => {
    if (isRunning && !isPaused && !isComplete) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          // Announce time remaining at specific intervals (5, 4, 3, 2, 1 min and 30 sec)
          // But NOT at the very start of an interval
          if ([300, 240, 180, 120, 60, 30].includes(prev)) {
            if (justStartedIntervalRef.current) {
              // Skip this announcement, it's the start of the interval
              justStartedIntervalRef.current = false;
            } else {
              announceTimeRemaining(prev, settings);
            }
          }
          
          // Reset the flag after first second
          if (justStartedIntervalRef.current) {
            justStartedIntervalRef.current = false;
          }
          
          // Countdown beeps and voice at 5, 4, 3, 2, 1 seconds
          if (prev <= 6 && prev > 1) {
            if (lastCountdownRef.current !== prev) {
              lastCountdownRef.current = prev;
              if (prev <= 4 && settings.soundEnabled) {
                playCountdown();
              }
              // Voice countdown
              announceCountdown(prev - 1, settings);
            }
          }
          
          if (prev <= 1) {
            // Move to next interval
            const intervals = currentProgram.intervals;
            const repeatCount = currentProgram.repeatCount || 1;
            
            if (currentIntervalIndex < intervals.length - 1) {
              setCurrentIntervalIndex(i => i + 1);
              if (settings.soundEnabled) playIntervalChange();
              if (settings.vibrationEnabled) vibrateIntervalChange();
              // Announce new interval
              announceIntervalChange(intervals[currentIntervalIndex + 1], settings);
              lastCountdownRef.current = null;
              justStartedIntervalRef.current = true; // Don't announce time at start
              return intervals[currentIntervalIndex + 1].duration;
            } else if (currentRepeat < repeatCount) {
              setCurrentRepeat(r => r + 1);
              setCurrentIntervalIndex(0);
              if (settings.soundEnabled) playIntervalChange();
              if (settings.vibrationEnabled) vibrateIntervalChange();
              // Announce new interval
              announceIntervalChange(intervals[0], settings);
              lastCountdownRef.current = null;
              justStartedIntervalRef.current = true; // Don't announce time at start
              return intervals[0].duration;
            } else {
              // Workout complete
              setIsComplete(true);
              if (settings.soundEnabled) playWorkoutComplete();
              if (settings.vibrationEnabled) vibrateWorkoutComplete();
              // Announce completion
              announceWorkoutComplete(settings);
              
              // Save to history
              if (onAddWorkoutRef.current) {
                onAddWorkoutRef.current({
                  programId: currentProgram.id,
                  programName: currentProgram.name,
                  duration: calculateTotalTime(currentProgram),
                  calories: calculateCalories(currentProgram.intervals, settings.userWeight || 70, settings.userSex || 'male') * repeatCount,
                  completed: true,
                });
              }
              
              return 0;
            }
          }
          return prev - 1;
        });
        
        setTotalTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, isComplete, currentProgram, currentIntervalIndex, currentRepeat, settings, calculateTotalTime]);

  // Current interval data
  const currentInterval = currentProgram?.intervals[currentIntervalIndex] || null;
  
  // Progress calculations
  const intervalProgress = currentInterval 
    ? ((currentInterval.duration - timeRemaining) / currentInterval.duration) * 100 
    : 0;
  
  const totalProgress = currentProgram 
    ? ((calculateTotalTime(currentProgram) - totalTimeRemaining) / calculateTotalTime(currentProgram)) * 100 
    : 0;

  return {
    isRunning,
    isPaused,
    isComplete,
    currentProgram,
    currentInterval,
    currentIntervalIndex,
    currentRepeat,
    timeRemaining,
    totalTimeRemaining,
    intervalProgress,
    totalProgress,
    startWorkout,
    togglePause,
    stopWorkout,
    skipInterval,
    previousInterval,
    calculateTotalTime,
  };
};

export default useWorkoutTimer;
