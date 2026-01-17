import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  SkipBack, 
  Repeat,
  TrendingUp,
  Gauge,
  ChevronDown,
  Flame,
  Clock
} from 'lucide-react';
import { formatTime, getSpeedUnit, calculateCalories } from '../utils/storage';

const HomePage = ({ 
  programs, 
  settings, 
  timer,
  selectedProgramId,
  setSelectedProgramId 
}) => {
  const [showProgramSelector, setShowProgramSelector] = useState(false);
  
  const selectedProgram = programs.find(p => p.id === selectedProgramId) || programs[0];
  const hasIntervals = selectedProgram?.intervals?.length > 0;
  
  const {
    isRunning,
    isPaused,
    isComplete,
    currentInterval,
    currentIntervalIndex,
    currentRepeat,
    timeRemaining,
    totalTimeRemaining,
    totalProgress,
    startWorkout,
    togglePause,
    stopWorkout,
    skipInterval,
    previousInterval,
    currentProgram,
    calculateTotalTime,
  } = timer;

  const handleStartWorkout = () => {
    if (hasIntervals) {
      startWorkout(selectedProgram);
    }
  };

  const displayProgram = isRunning ? currentProgram : selectedProgram;
  const displayIntervals = displayProgram?.intervals || [];
  const totalTime = displayProgram ? calculateTotalTime(displayProgram) : 0;
  const estimatedCalories = displayIntervals.length > 0 
    ? calculateCalories(displayIntervals, settings.userWeight || 70, settings.userSex || 'male') * (displayProgram?.repeatCount || 1)
    : 0;

  return (
    <div className="fade-in">
      {/* Program Selector */}
      {!isRunning && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div 
            className="select-wrapper"
            onClick={() => setShowProgramSelector(!showProgramSelector)}
          >
            <div className="select" style={{ cursor: 'pointer' }}>
              {selectedProgram?.name || 'Sélectionner un programme'}
            </div>
            <ChevronDown className="select-arrow" size={20} />
          </div>
          
          {showProgramSelector && (
            <div style={{ marginTop: '12px' }}>
              {programs.filter(p => p.intervals.length > 0).map(program => (
                <div
                  key={program.id}
                  className={`program-card ${program.id === selectedProgramId ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedProgramId(program.id);
                    setShowProgramSelector(false);
                  }}
                >
                  <div className="program-header">
                    <span className="program-name">{program.name}</span>
                    {program.repeatCount > 1 && (
                      <span className="program-badge">{program.repeatCount}x</span>
                    )}
                  </div>
                  <div className="program-stats">
                    <span><Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      {formatTime(calculateTotalTime(program))}
                    </span>
                    <span>{program.intervals.length} intervalles</span>
                  </div>
                </div>
              ))}
              {programs.filter(p => p.intervals.length > 0).length === 0 && (
                <div className="empty-state" style={{ padding: '20px' }}>
                  <p>Aucun programme configuré</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
                    Allez dans Setup pour créer votre premier programme
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Timer Display */}
      <div className="card">
        <div className="timer-display">
          {isRunning && currentInterval ? (
            <>
              <div className="timer-title">{currentInterval.name}</div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '24px', 
                marginBottom: '24px',
                flexWrap: 'wrap'
              }}>
                {currentProgram?.repeatCount > 1 && (
                  <div style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Repeat size={20} />
                    {currentRepeat}/{currentProgram.repeatCount}
                  </div>
                )}
                <div style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <TrendingUp size={20} />
                  {currentInterval.incline}%
                </div>
                <div style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Gauge size={20} />
                  {currentInterval.speed} {getSpeedUnit(settings.unit)}
                </div>
              </div>
              <div className="timer-time">
                {formatTime(timeRemaining)}
              </div>
              <div className="timer-total">
                Total restant: {formatTime(totalTimeRemaining)}
              </div>
            </>
          ) : isComplete ? (
            <>
              <div className="timer-title" style={{ color: 'var(--accent-primary)' }}>
                🎉 Entraînement terminé !
              </div>
              <div className="timer-time" style={{ fontSize: '3rem', marginTop: '20px' }}>
                Bravo !
              </div>
            </>
          ) : (
            <>
              <div className="timer-title">
                {hasIntervals ? selectedProgram?.name : 'Aucun programme'}
              </div>
              <div className="timer-subtitle">
                {hasIntervals 
                  ? `${displayIntervals.length} intervalle${displayIntervals.length > 1 ? 's' : ''}`
                  : 'Configurez un programme dans Setup'
                }
              </div>
              <div className="timer-time" style={{ opacity: 0.3 }}>
                {hasIntervals ? formatTime(totalTime) : '--:--'}
              </div>
            </>
          )}
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${totalProgress}%` }}
              />
            </div>
            <div className="progress-segments">
              {displayIntervals.map((_, idx) => (
                <div 
                  key={idx}
                  className={`progress-segment ${
                    idx < currentIntervalIndex ? 'completed' : 
                    idx === currentIntervalIndex ? 'active' : ''
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {(isRunning || hasIntervals) && (
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-value">{displayIntervals.length}</div>
              <div className="stat-label">Intervalles</div>
            </div>
            <div className="stat-box">
              <div className="stat-value orange">
                <Flame size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                {estimatedCalories}
              </div>
              <div className="stat-label">Calories est.</div>
            </div>
            <div className="stat-box">
              <div className="stat-value blue">{formatTime(totalTime)}</div>
              <div className="stat-label">Durée totale</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="controls" style={{ flexDirection: 'column', gap: '12px' }}>
          {isRunning ? (
            <>
              <button 
                className="btn btn-primary" 
                onClick={togglePause}
                style={{ 
                  width: '100%', 
                  padding: '20px', 
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}
              >
                {isPaused ? <Play size={28} /> : <Pause size={28} />}
                {isPaused ? 'Reprendre' : 'Pause'}
              </button>
              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={previousInterval}
                  title="Intervalle précédent"
                  style={{ flex: 1, padding: '14px' }}
                >
                  <SkipBack size={20} />
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={skipInterval}
                  title="Intervalle suivant"
                  style={{ flex: 1, padding: '14px' }}
                >
                  <SkipForward size={20} />
                </button>
                <button 
                  className="btn" 
                  onClick={() => stopWorkout(true)}
                  title="Arrêter"
                  style={{ 
                    flex: 1, 
                    padding: '14px',
                    background: 'rgba(255, 71, 87, 0.2)', 
                    color: 'var(--accent-danger)',
                    border: '1px solid var(--accent-danger)'
                  }}
                >
                  <Square size={20} />
                </button>
              </div>
            </>
          ) : isComplete ? (
            <button 
              className="btn btn-primary" 
              onClick={() => stopWorkout(false)}
              style={{ width: '100%', padding: '20px', fontSize: '1.25rem' }}
            >
              Terminer
            </button>
          ) : (
            <button 
              className="btn btn-primary"
              onClick={handleStartWorkout}
              disabled={!hasIntervals}
              style={{ 
                width: '100%', 
                padding: '20px', 
                fontSize: '1.25rem',
                opacity: hasIntervals ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
            >
              <Play size={28} />
              Démarrer
            </button>
          )}
        </div>
      </div>

      {/* Interval List */}
      {(isRunning || hasIntervals) && (
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-header">
            <h3 className="card-title">Intervalles</h3>
          </div>
          <div className="interval-list">
            {displayIntervals.map((interval, idx) => (
              <div 
                key={interval.id || idx}
                className={`interval-item ${
                  isRunning && idx === currentIntervalIndex ? 'active' : ''
                } ${isRunning && idx < currentIntervalIndex ? 'completed' : ''}`}
              >
                <div className="interval-header">
                  <div className="interval-number">{idx + 1}</div>
                  <div className="interval-name">{interval.name}</div>
                  <div className="interval-duration">{formatTime(interval.duration)}</div>
                </div>
                <div className="interval-details">
                  <div className="interval-detail">
                    <TrendingUp size={14} />
                    {interval.incline}%
                  </div>
                  <div className="interval-detail">
                    <Gauge size={14} />
                    {interval.speed} {getSpeedUnit(settings.unit)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
