import React, { useState } from 'react';
import { 
  Plus, 
  Minus,
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Copy,
  TrendingUp,
  Gauge,
  Clock,
  Repeat,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { 
  formatTime, 
  getSpeedUnit,
  calculateCalories 
} from '../utils/storage';

// Composant pour éditer la durée
const DurationEditor = ({ duration, onChange }) => {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  const updateDuration = (newMinutes, newSeconds) => {
    const totalSeconds = Math.max(30, Math.min(7200, newMinutes * 60 + newSeconds));
    onChange(totalSeconds);
  };

  const addMinutes = (amount) => {
    updateDuration(minutes + amount, seconds);
  };

  const addSeconds = (amount) => {
    let newSeconds = seconds + amount;
    let newMinutes = minutes;
    
    if (newSeconds >= 60) {
      newMinutes += 1;
      newSeconds -= 60;
    } else if (newSeconds < 0) {
      if (newMinutes > 0) {
        newMinutes -= 1;
        newSeconds += 60;
      } else {
        newSeconds = 0;
      }
    }
    
    updateDuration(newMinutes, newSeconds);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Minutes */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <button
          type="button"
          onClick={() => addMinutes(1)}
          className="btn-icon"
          style={{ width: '32px', height: '28px', padding: 0 }}
        >
          <Plus size={14} />
        </button>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          background: 'var(--bg-card)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          minWidth: '60px',
          justifyContent: 'center'
        }}>
          <span style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            {minutes}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>min</span>
        </div>
        <button
          type="button"
          onClick={() => addMinutes(-1)}
          className="btn-icon"
          style={{ width: '32px', height: '28px', padding: 0 }}
          disabled={minutes <= 0 && seconds <= 30}
        >
          <Minus size={14} />
        </button>
      </div>

      <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>:</span>

      {/* Secondes */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <button
          type="button"
          onClick={() => addSeconds(30)}
          className="btn-icon"
          style={{ width: '32px', height: '28px', padding: 0 }}
        >
          <Plus size={14} />
        </button>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          background: 'var(--bg-card)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          minWidth: '60px',
          justifyContent: 'center'
        }}>
          <span style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            {seconds.toString().padStart(2, '0')}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>sec</span>
        </div>
        <button
          type="button"
          onClick={() => addSeconds(-30)}
          className="btn-icon"
          style={{ width: '32px', height: '28px', padding: 0 }}
          disabled={minutes <= 0 && seconds <= 30}
        >
          <Minus size={14} />
        </button>
      </div>
    </div>
  );
};

const SetupPage = ({ programs, setPrograms, settings, calculateTotalTime }) => {
  const [expandedProgram, setExpandedProgram] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [tempName, setTempName] = useState('');

  // Update program
  const updateProgram = (programId, updates) => {
    setPrograms(prev => prev.map(p => 
      p.id === programId ? { ...p, ...updates } : p
    ));
  };

  // Add interval to program
  const addInterval = (programId) => {
    setPrograms(prev => prev.map(p => {
      if (p.id === programId && p.intervals.length < 10) {
        const newInterval = {
          id: Date.now(),
          name: `Intervalle ${p.intervals.length + 1}`,
          duration: 300, // 5 minutes default
          incline: 1,
          speed: 5,
        };
        return { ...p, intervals: [...p.intervals, newInterval] };
      }
      return p;
    }));
  };

  // Update interval
  const updateInterval = (programId, intervalId, updates) => {
    setPrograms(prev => prev.map(p => {
      if (p.id === programId) {
        return {
          ...p,
          intervals: p.intervals.map(i => 
            i.id === intervalId ? { ...i, ...updates } : i
          ),
        };
      }
      return p;
    }));
  };

  // Delete interval
  const deleteInterval = (programId, intervalId) => {
    setPrograms(prev => prev.map(p => {
      if (p.id === programId) {
        return {
          ...p,
          intervals: p.intervals.filter(i => i.id !== intervalId),
        };
      }
      return p;
    }));
  };

  // Duplicate interval
  const duplicateInterval = (programId, interval) => {
    setPrograms(prev => prev.map(p => {
      if (p.id === programId && p.intervals.length < 10) {
        const newInterval = {
          ...interval,
          id: Date.now(),
          name: `${interval.name} (copie)`,
        };
        return { ...p, intervals: [...p.intervals, newInterval] };
      }
      return p;
    }));
  };

  // Move interval up/down
  const moveInterval = (programId, intervalIndex, direction) => {
    setPrograms(prev => prev.map(p => {
      if (p.id === programId) {
        const newIntervals = [...p.intervals];
        const newIndex = intervalIndex + direction;
        if (newIndex >= 0 && newIndex < newIntervals.length) {
          [newIntervals[intervalIndex], newIntervals[newIndex]] = 
          [newIntervals[newIndex], newIntervals[intervalIndex]];
        }
        return { ...p, intervals: newIntervals };
      }
      return p;
    }));
  };

  // Start editing program name
  const startEditingName = (programId, currentName) => {
    setEditingName(programId);
    setTempName(currentName);
  };

  // Save program name
  const saveEditingName = (programId) => {
    if (tempName.trim()) {
      updateProgram(programId, { name: tempName.trim() });
    }
    setEditingName(null);
    setTempName('');
  };

  // Cancel editing
  const cancelEditingName = () => {
    setEditingName(null);
    setTempName('');
  };

  // Clear program
  const clearProgram = (programId) => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer ce programme ?')) {
      updateProgram(programId, { intervals: [], repeatCount: 1 });
    }
  };

  return (
    <div className="fade-in">
      <div className="header">
        <h1 className="header-title">Configuration</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {programs.map((program, index) => {
          const isExpanded = expandedProgram === program.id;
          const totalTime = calculateTotalTime(program);
          const hasIntervals = program.intervals.length > 0;
          const calories = hasIntervals 
            ? calculateCalories(program.intervals, settings.userWeight || 70, settings.userSex || 'male') * (program.repeatCount || 1)
            : 0;

          return (
            <div key={program.id} className="card">
              {/* Program Header */}
              <div 
                className="card-header" 
                style={{ cursor: 'pointer', marginBottom: isExpanded ? '16px' : '0' }}
                onClick={() => setExpandedProgram(isExpanded ? null : program.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <span style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.875rem',
                    minWidth: '24px'
                  }}>
                    #{index + 1}
                  </span>
                  
                  {editingName === program.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}
                         onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        className="form-input"
                        value={tempName}
                        onChange={e => setTempName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEditingName(program.id);
                          if (e.key === 'Escape') cancelEditingName();
                        }}
                        autoFocus
                        style={{ padding: '8px 12px' }}
                      />
                      <button 
                        className="btn-icon" 
                        onClick={() => saveEditingName(program.id)}
                        style={{ width: '36px', height: '36px', color: 'var(--accent-primary)' }}
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={cancelEditingName}
                        style={{ width: '36px', height: '36px' }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="card-title" style={{ flex: 1 }}>
                        {program.name}
                      </span>
                      <button
                        className="btn-icon"
                        onClick={e => {
                          e.stopPropagation();
                          startEditingName(program.id, program.name);
                        }}
                        style={{ width: '32px', height: '32px' }}
                      >
                        <Edit2 size={14} />
                      </button>
                    </>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {hasIntervals && (
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Clock size={14} />
                      {formatTime(totalTime)}
                    </span>
                  )}
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="slide-up">
                  {/* Program Settings */}
                  <div className="form-row" style={{ marginBottom: '20px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">
                        <Repeat size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                        Répétitions
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => updateProgram(program.id, { 
                            repeatCount: Math.max(1, (program.repeatCount || 1) - 1)
                          })}
                          style={{ width: '36px', height: '36px', padding: 0, fontSize: '1.25rem' }}
                          disabled={(program.repeatCount || 1) <= 1}
                        >
                          -
                        </button>
                        <div style={{
                          minWidth: '40px',
                          textAlign: 'center',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '1.25rem',
                          fontWeight: '600'
                        }}>
                          {program.repeatCount || 1}
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => updateProgram(program.id, { 
                            repeatCount: Math.min(10, (program.repeatCount || 1) + 1)
                          })}
                          style={{ width: '36px', height: '36px', padding: 0, fontSize: '1.25rem' }}
                          disabled={(program.repeatCount || 1) >= 10}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Calories estimées</label>
                      <div className="form-input" style={{ 
                        background: 'var(--bg-card)', 
                        color: 'var(--accent-secondary)',
                        fontWeight: '600'
                      }}>
                        🔥 {calories} kcal
                      </div>
                    </div>
                  </div>

                  {/* Intervals */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <span className="form-label" style={{ margin: 0 }}>
                        Intervalles ({program.intervals.length}/10)
                      </span>
                      {program.intervals.length > 0 && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => clearProgram(program.id)}
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          <Trash2 size={14} />
                          Effacer tout
                        </button>
                      )}
                    </div>

                    {program.intervals.length === 0 ? (
                      <div className="empty-state" style={{ padding: '30px' }}>
                        <p>Aucun intervalle</p>
                        <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>
                          Ajoutez votre premier intervalle
                        </p>
                      </div>
                    ) : (
                      <div className="interval-list">
                        {program.intervals.map((interval, idx) => (
                          <div key={interval.id} className="interval-item">
                            {/* Interval Header */}
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              marginBottom: '12px'
                            }}>
                              <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                gap: '2px'
                              }}>
                                <button
                                  className="btn-icon"
                                  onClick={() => moveInterval(program.id, idx, -1)}
                                  disabled={idx === 0}
                                  style={{ 
                                    width: '24px', 
                                    height: '20px', 
                                    opacity: idx === 0 ? 0.3 : 1 
                                  }}
                                >
                                  <ChevronUp size={14} />
                                </button>
                                <button
                                  className="btn-icon"
                                  onClick={() => moveInterval(program.id, idx, 1)}
                                  disabled={idx === program.intervals.length - 1}
                                  style={{ 
                                    width: '24px', 
                                    height: '20px',
                                    opacity: idx === program.intervals.length - 1 ? 0.3 : 1
                                  }}
                                >
                                  <ChevronDown size={14} />
                                </button>
                              </div>
                              
                              <div className="interval-number">{idx + 1}</div>
                              
                              <input
                                type="text"
                                className="form-input"
                                value={interval.name}
                                onChange={e => updateInterval(program.id, interval.id, { name: e.target.value })}
                                placeholder="Nom de l'intervalle"
                                style={{ flex: 1, padding: '8px 12px' }}
                              />
                              
                              <button
                                className="btn-icon"
                                onClick={() => duplicateInterval(program.id, interval)}
                                disabled={program.intervals.length >= 10}
                                title="Dupliquer"
                                style={{ width: '36px', height: '36px' }}
                              >
                                <Copy size={16} />
                              </button>
                              
                              <button
                                className="btn-icon"
                                onClick={() => deleteInterval(program.id, interval.id)}
                                title="Supprimer"
                                style={{ 
                                  width: '36px', 
                                  height: '36px',
                                  color: 'var(--accent-danger)'
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            {/* Interval Settings */}
                            <div style={{ marginBottom: '16px' }}>
                              <label className="form-label" style={{ marginBottom: '12px', display: 'block' }}>
                                <Clock size={12} style={{ marginRight: '4px' }} />
                                Durée
                              </label>
                              <DurationEditor
                                duration={interval.duration}
                                onChange={(newDuration) => updateInterval(program.id, interval.id, { duration: newDuration })}
                              />
                            </div>
                            <div className="form-row">
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">
                                  <TrendingUp size={12} style={{ marginRight: '4px' }} />
                                  Inclinaison %
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => updateInterval(program.id, interval.id, { 
                                      incline: Math.max(0, (interval.incline || 0) - 0.5)
                                    })}
                                    style={{ width: '36px', height: '36px', padding: 0, fontSize: '1.25rem' }}
                                  >
                                    -
                                  </button>
                                  <div style={{
                                    minWidth: '50px',
                                    textAlign: 'center',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '1.1rem',
                                    fontWeight: '600'
                                  }}>
                                    {interval.incline}
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => updateInterval(program.id, interval.id, { 
                                      incline: Math.min(15, (interval.incline || 0) + 0.5)
                                    })}
                                    style={{ width: '36px', height: '36px', padding: 0, fontSize: '1.25rem' }}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label">
                                  <Gauge size={12} style={{ marginRight: '4px' }} />
                                  Vitesse {getSpeedUnit(settings.unit)}
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => updateInterval(program.id, interval.id, { 
                                      speed: Math.max(0.5, (interval.speed || 0.5) - 0.5)
                                    })}
                                    style={{ width: '36px', height: '36px', padding: 0, fontSize: '1.25rem' }}
                                  >
                                    -
                                  </button>
                                  <div style={{
                                    minWidth: '50px',
                                    textAlign: 'center',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '1.1rem',
                                    fontWeight: '600'
                                  }}>
                                    {interval.speed}
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => updateInterval(program.id, interval.id, { 
                                      speed: Math.min(20, (interval.speed || 0.5) + 0.5)
                                    })}
                                    style={{ width: '36px', height: '36px', padding: 0, fontSize: '1.25rem' }}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Interval Button */}
                  {program.intervals.length < 10 && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => addInterval(program.id)}
                      style={{ width: '100%' }}
                    >
                      <Plus size={18} />
                      Ajouter un intervalle
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SetupPage;
