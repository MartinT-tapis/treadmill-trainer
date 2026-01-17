import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Flame,
  Clock,
  TrendingUp,
  Award,
  Trash2
} from 'lucide-react';
import { 
  formatTime, 
  formatDate, 
  isSameDay,
  getWeekDays,
  getMonthName,
  getDaysInMonth,
  getFirstDayOfMonth
} from '../utils/storage';

const StatsPage = ({ history, setHistory, onDeleteWorkout }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate calendar days
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    
    const days = [];
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: month - 1,
        year: month === 0 ? year - 1 : year,
        isOtherMonth: true,
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month,
        year,
        isOtherMonth: false,
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        month: month + 1,
        year: month === 11 ? year + 1 : year,
        isOtherMonth: true,
      });
    }
    
    return days;
  }, [year, month]);

  // Get workouts for a specific date
  const getWorkoutsForDate = (date) => {
    return history.filter(w => isSameDay(w.date, date));
  };

  // Check if date has workout
  const hasWorkout = (day, month, year) => {
    const date = new Date(year, month, day);
    return history.some(w => isSameDay(w.date, date));
  };

  // Check if date is today
  const isToday = (day, month, year) => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  // Select date
  const handleSelectDate = (day, month, year) => {
    const date = new Date(year, month, day);
    setSelectedDate(date);
  };

  // Delete workout
  const deleteWorkout = (workoutId) => {
    if (window.confirm('Supprimer cet entraînement ?')) {
      if (onDeleteWorkout) {
        onDeleteWorkout(workoutId);
      }
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    
    const thisWeekWorkouts = history.filter(w => new Date(w.date) >= thisWeekStart);
    const thisMonthWorkouts = history.filter(w => {
      const d = new Date(w.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    return {
      weekWorkouts: thisWeekWorkouts.length,
      weekDuration: thisWeekWorkouts.reduce((sum, w) => sum + w.duration, 0),
      weekCalories: thisWeekWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0),
      monthWorkouts: thisMonthWorkouts.length,
      monthDuration: thisMonthWorkouts.reduce((sum, w) => sum + w.duration, 0),
      monthCalories: thisMonthWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0),
      totalWorkouts: history.length,
      streak: calculateStreak(history),
    };
  }, [history, month, year]);

  // Calculate current streak
  function calculateStreak(workouts) {
    if (workouts.length === 0) return 0;
    
    const sortedDates = [...new Set(workouts.map(w => 
      new Date(w.date).toDateString()
    ))].sort((a, b) => new Date(b) - new Date(a));
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Check if there's a workout today or yesterday
    const today = currentDate.toDateString();
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (!sortedDates.includes(today) && !sortedDates.includes(yesterday.toDateString())) {
      return 0;
    }
    
    for (const dateStr of sortedDates) {
      const workoutDate = new Date(dateStr);
      const diff = Math.floor((currentDate - workoutDate) / (1000 * 60 * 60 * 24));
      
      if (diff <= 1) {
        streak++;
        currentDate = workoutDate;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // Selected date workouts
  const selectedWorkouts = selectedDate ? getWorkoutsForDate(selectedDate) : [];

  return (
    <div className="fade-in">
      <div className="header">
        <h1 className="header-title">Statistiques</h1>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-box">
          <div className="stat-value">{stats.streak}</div>
          <div className="stat-label">
            <Award size={12} style={{ marginRight: '4px' }} />
            Série
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-value orange">{stats.weekWorkouts}</div>
          <div className="stat-label">Cette semaine</div>
        </div>
        <div className="stat-box">
          <div className="stat-value blue">{stats.monthWorkouts}</div>
          <div className="stat-label">Ce mois</div>
        </div>
      </div>

      {/* Week Stats */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header">
          <h3 className="card-title">Cette semaine</h3>
        </div>
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-value">{stats.weekWorkouts}</div>
            <div className="stat-label">Séances</div>
          </div>
          <div className="stat-box">
            <div className="stat-value orange">
              <Flame size={16} />
              {stats.weekCalories}
            </div>
            <div className="stat-label">Calories</div>
          </div>
          <div className="stat-box">
            <div className="stat-value blue">
              <Clock size={16} />
              {formatTime(stats.weekDuration)}
            </div>
            <div className="stat-label">Durée</div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="calendar">
        <div className="calendar-header">
          <h3 className="calendar-title">{getMonthName(currentDate)}</h3>
          <div className="calendar-nav">
            <button className="calendar-nav-btn" onClick={prevMonth}>
              <ChevronLeft size={18} />
            </button>
            <button className="calendar-nav-btn" onClick={nextMonth}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="calendar-weekdays">
          {getWeekDays().map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>

        <div className="calendar-days">
          {calendarDays.map((d, idx) => (
            <button
              key={idx}
              className={`calendar-day ${
                d.isOtherMonth ? 'other-month' : ''
              } ${
                hasWorkout(d.day, d.month, d.year) ? 'has-workout' : ''
              } ${
                isToday(d.day, d.month, d.year) ? 'today' : ''
              } ${
                selectedDate && isSameDay(
                  new Date(d.year, d.month, d.day), 
                  selectedDate
                ) ? 'selected' : ''
              }`}
              onClick={() => handleSelectDate(d.day, d.month, d.year)}
              style={
                selectedDate && isSameDay(
                  new Date(d.year, d.month, d.day), 
                  selectedDate
                ) ? {
                  background: 'var(--accent-primary)',
                  color: '#0a0a0f',
                  fontWeight: '700'
                } : {}
              }
            >
              {d.day}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Date Workouts */}
      {selectedDate && (
        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-header">
            <h3 className="card-title">
              <Calendar size={18} style={{ marginRight: '8px' }} />
              {formatDate(selectedDate, 'long')}
            </h3>
          </div>
          
          {selectedWorkouts.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <p>Aucun entraînement ce jour</p>
            </div>
          ) : (
            <div>
              {selectedWorkouts.map(workout => (
                <div key={workout.id} className="history-item">
                  <div className="history-details" style={{ flex: 1 }}>
                    <div className="history-program">
                      {workout.programName}
                      {workout.completed && (
                        <span style={{ 
                          marginLeft: '8px',
                          fontSize: '0.75rem',
                          color: 'var(--accent-primary)'
                        }}>
                          ✓ Complété
                        </span>
                      )}
                    </div>
                    <div className="history-stats">
                      <span>
                        <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        {formatTime(workout.duration)}
                      </span>
                      {workout.calories > 0 && (
                        <span>
                          <Flame size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                          {workout.calories} kcal
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn-icon"
                    onClick={() => deleteWorkout(workout.id)}
                    style={{ color: 'var(--accent-danger)' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent History */}
      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header">
          <h3 className="card-title">Historique récent</h3>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {stats.totalWorkouts} total
          </span>
        </div>
        
        {history.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px' }}>
            <TrendingUp size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <p className="empty-state-title">Aucun entraînement</p>
            <p>Commencez votre premier entraînement !</p>
          </div>
        ) : (
          <div>
            {history.slice(0, 10).map(workout => {
              const date = new Date(workout.date);
              return (
                <div key={workout.id} className="history-item">
                  <div className="history-date">
                    <div className="history-day">{date.getDate()}</div>
                    <div className="history-month">
                      {date.toLocaleDateString('fr-FR', { month: 'short' })}
                    </div>
                  </div>
                  <div className="history-details">
                    <div className="history-program">
                      {workout.programName}
                      {workout.completed && (
                        <span style={{ 
                          marginLeft: '8px',
                          fontSize: '0.75rem',
                          color: 'var(--accent-primary)'
                        }}>
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="history-stats">
                      <span>
                        <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        {formatTime(workout.duration)}
                      </span>
                      {workout.calories > 0 && (
                        <span>
                          <Flame size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                          {workout.calories} kcal
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;
