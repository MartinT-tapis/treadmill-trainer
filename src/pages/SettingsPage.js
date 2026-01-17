import React, { useState, useEffect } from 'react';
import { 
  Moon, 
  Sun,
  Volume2, 
  VolumeX,
  Smartphone,
  Gauge,
  Info,
  User,
  Scale,
  Ruler,
  Mic,
  MicOff,
  Languages,
  LogOut,
  Mail,
  Timer
} from 'lucide-react';
import { 
  playBeep,
  vibrate,
  getAvailableVoices,
  speak
} from '../utils/storage';

const SettingsPage = ({ settings, setSettings, user, onLogout }) => {
  const [availableVoices, setAvailableVoices] = useState([]);
  
  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = getAvailableVoices(settings.voiceLanguage);
      setAvailableVoices(voices);
    };
    
    loadVoices();
    
    // Voices might load asynchronously
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [settings.voiceLanguage]);
  
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSetting('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleUnit = () => {
    updateSetting('unit', settings.unit === 'kmh' ? 'mph' : 'kmh');
  };

  const toggleSound = () => {
    const newValue = !settings.soundEnabled;
    updateSetting('soundEnabled', newValue);
    if (newValue) {
      playBeep(800, 150, 0.3);
    }
  };

  const toggleVibration = () => {
    const newValue = !settings.vibrationEnabled;
    updateSetting('vibrationEnabled', newValue);
    if (newValue) {
      vibrate([100, 50, 100]);
    }
  };

  return (
    <div className="fade-in">
      <div className="header">
        <h1 className="header-title">Paramètres</h1>
      </div>

      {/* User Profile */}
      <div className="settings-section">
        <h3 className="settings-title">Profil</h3>
        
        <div className="settings-row">
          <div className="settings-row-label">
            <User size={20} />
            <span>Sexe</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn ${settings.userSex === 'male' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => updateSetting('userSex', 'male')}
              style={{ padding: '8px 16px', fontSize: '0.875rem' }}
            >
              Homme
            </button>
            <button 
              className={`btn ${settings.userSex === 'female' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => updateSetting('userSex', 'female')}
              style={{ padding: '8px 16px', fontSize: '0.875rem' }}
            >
              Femme
            </button>
          </div>
        </div>
        
        <div className="settings-row">
          <div className="settings-row-label">
            <Scale size={20} />
            <span>Poids (kg)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => updateSetting('userWeight', Math.max(30, (settings.userWeight || 70) - 1))}
              style={{ width: '40px', height: '40px', padding: 0, fontSize: '1.25rem' }}
            >
              -
            </button>
            <div style={{
              minWidth: '60px',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '1.25rem',
              fontWeight: '600'
            }}>
              {settings.userWeight || 70}
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => updateSetting('userWeight', Math.min(250, (settings.userWeight || 70) + 1))}
              style={{ width: '40px', height: '40px', padding: 0, fontSize: '1.25rem' }}
            >
              +
            </button>
          </div>
        </div>
        
        <div className="settings-row">
          <div className="settings-row-label">
            <Ruler size={20} />
            <span>Taille (cm)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => updateSetting('userHeight', Math.max(100, (settings.userHeight || 170) - 1))}
              style={{ width: '40px', height: '40px', padding: 0, fontSize: '1.25rem' }}
            >
              -
            </button>
            <div style={{
              minWidth: '60px',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '1.25rem',
              fontWeight: '600'
            }}>
              {settings.userHeight || 170}
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => updateSetting('userHeight', Math.min(250, (settings.userHeight || 170) + 1))}
              style={{ width: '40px', height: '40px', padding: 0, fontSize: '1.25rem' }}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="settings-section">
        <h3 className="settings-title">Apparence</h3>
        
        <div className="settings-row">
          <div className="settings-row-label">
            {settings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            <span>Thème {settings.theme === 'dark' ? 'sombre' : 'clair'}</span>
          </div>
          <div 
            className={`toggle ${settings.theme === 'dark' ? 'active' : ''}`}
            onClick={toggleTheme}
          >
            <div className="toggle-knob" />
          </div>
        </div>
      </div>

      {/* Units */}
      <div className="settings-section">
        <h3 className="settings-title">Unités</h3>
        
        <div className="settings-row">
          <div className="settings-row-label">
            <Gauge size={20} />
            <span>Vitesse en {settings.unit === 'kmh' ? 'km/h' : 'mph'}</span>
          </div>
          <button 
            className="btn btn-secondary"
            onClick={toggleUnit}
            style={{ padding: '8px 16px', fontSize: '0.875rem' }}
          >
            {settings.unit === 'kmh' ? 'km/h → mph' : 'mph → km/h'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="settings-section">
        <h3 className="settings-title">Notifications</h3>
        
        <div className="settings-row">
          <div className="settings-row-label">
            {settings.soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            <span>Sons</span>
          </div>
          <div 
            className={`toggle ${settings.soundEnabled ? 'active' : ''}`}
            onClick={toggleSound}
          >
            <div className="toggle-knob" />
          </div>
        </div>
        
        <div className="settings-row">
          <div className="settings-row-label">
            <Smartphone size={20} />
            <span>Vibrations</span>
          </div>
          <div 
            className={`toggle ${settings.vibrationEnabled ? 'active' : ''}`}
            onClick={toggleVibration}
          >
            <div className="toggle-knob" />
          </div>
        </div>
      </div>

      {/* Voice */}
      <div className="settings-section">
        <h3 className="settings-title">Voix</h3>
        
        <div className="settings-row">
          <div className="settings-row-label">
            {settings.voiceEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            <span>Annonces vocales</span>
          </div>
          <div 
            className={`toggle ${settings.voiceEnabled ? 'active' : ''}`}
            onClick={() => updateSetting('voiceEnabled', !settings.voiceEnabled)}
          >
            <div className="toggle-knob" />
          </div>
        </div>
        
        <div className="settings-row">
          <div className="settings-row-label">
            <Languages size={20} />
            <span>Langue</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn ${settings.voiceLanguage === 'fr' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => updateSetting('voiceLanguage', 'fr')}
              style={{ padding: '8px 16px', fontSize: '0.875rem' }}
            >
              Français
            </button>
            <button 
              className={`btn ${settings.voiceLanguage === 'en' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => updateSetting('voiceLanguage', 'en')}
              style={{ padding: '8px 16px', fontSize: '0.875rem' }}
            >
              English
            </button>
          </div>
        </div>
        
        {settings.voiceEnabled && availableVoices.length > 0 && (
          <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
            <div className="settings-row-label">
              <span>Sélection de la voix</span>
            </div>
            <select
              className="form-input"
              value={settings.voiceName || ''}
              onChange={(e) => updateSetting('voiceName', e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Voix par défaut (féminine)</option>
              {availableVoices.map((voice, index) => (
                <option key={index} value={voice.name}>
                  {voice.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {settings.voiceEnabled && (
          <div className="settings-row">
            <div className="settings-row-label">
              <Timer size={20} />
              <span>Annoncer le temps restant</span>
            </div>
            <div 
              className={`toggle ${settings.voiceAnnounceTime ? 'active' : ''}`}
              onClick={() => updateSetting('voiceAnnounceTime', !settings.voiceAnnounceTime)}
            >
              <div className="toggle-knob" />
            </div>
          </div>
        )}
        
        {settings.voiceEnabled && (
          <button
            className="btn btn-secondary"
            onClick={() => speak(
              settings.voiceLanguage === 'fr' 
                ? "Bonjour! Je serai votre coach aujourd'hui." 
                : "Hello! I will be your coach today.",
              settings
            )}
            style={{ width: '100%', marginTop: '8px' }}
          >
            🔊 Tester la voix
          </button>
        )}
      </div>

      {/* Account */}
      <div className="settings-section">
        <h3 className="settings-title">Compte</h3>
        
        <div className="settings-row">
          <div className="settings-row-label">
            <Mail size={20} />
            <span>{user?.email || 'Non connecté'}</span>
          </div>
        </div>
        
        <button 
          className="btn btn-secondary"
          onClick={onLogout}
          style={{ 
            width: '100%', 
            marginTop: '8px',
            color: 'var(--accent-danger)',
            borderColor: 'var(--accent-danger)'
          }}
        >
          <LogOut size={18} style={{ marginRight: '8px' }} />
          Se déconnecter
        </button>
      </div>

      {/* Speed Guide */}
      <div className="settings-section">
        <h3 className="settings-title">📊 Guide des vitesses</h3>
        
        <div className="card" style={{ padding: '20px' }}>
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '0.9rem',
            marginBottom: '16px',
            lineHeight: '1.5'
          }}>
            Référence rapide pour les conversions de vitesse sur tapis roulant :
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            marginBottom: '16px',
            fontSize: '0.85rem'
          }}>
            <div style={{ fontWeight: '600', color: 'var(--text-muted)', padding: '8px 0', borderBottom: '1px solid var(--bg-tertiary)' }}>km/h</div>
            <div style={{ fontWeight: '600', color: 'var(--text-muted)', padding: '8px 0', borderBottom: '1px solid var(--bg-tertiary)' }}>mph</div>
            <div style={{ fontWeight: '600', color: 'var(--text-muted)', padding: '8px 0', borderBottom: '1px solid var(--bg-tertiary)' }}>Allure</div>
            
            <div style={{ padding: '8px 0', fontFamily: 'var(--font-mono)' }}>4.0</div>
            <div style={{ padding: '8px 0', fontFamily: 'var(--font-mono)' }}>2.5</div>
            <div style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Marche lente</div>
            
            <div style={{ padding: '8px 0', fontFamily: 'var(--font-mono)' }}>5.5</div>
            <div style={{ padding: '8px 0', fontFamily: 'var(--font-mono)' }}>3.4</div>
            <div style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Marche rapide</div>
            
            <div style={{ padding: '8px 0', fontFamily: 'var(--font-mono)' }}>7.0</div>
            <div style={{ padding: '8px 0', fontFamily: 'var(--font-mono)' }}>4.3</div>
            <div style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Jogging</div>
            
            <div style={{ padding: '8px 0', fontFamily: 'var(--font-mono)' }}>9.0</div>
            <div style={{ padding: '8px 0', fontFamily: 'var(--font-mono)' }}>5.6</div>
            <div style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Course</div>
            
            <div style={{ padding: '8px 0', fontFamily: 'var(--font-mono)' }}>12.0</div>
            <div style={{ padding: '8px 0', fontFamily: 'var(--font-mono)' }}>7.5</div>
            <div style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Course rapide</div>
            
            <div style={{ padding: '8px 0', fontFamily: 'var(--font-mono)' }}>15.0</div>
            <div style={{ padding: '8px 0', fontFamily: 'var(--font-mono)' }}>9.3</div>
            <div style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>Sprint</div>
          </div>
          
          <div style={{ 
            background: 'var(--bg-tertiary)', 
            padding: '12px 16px', 
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem'
          }}>
            <strong style={{ color: 'var(--accent-primary)' }}>💡 Astuce :</strong>
            <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
              1 km/h ≈ 0.62 mph
            </span>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="settings-section">
        <h3 className="settings-title">À propos</h3>
        
        <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '16px',
            filter: 'drop-shadow(0 0 20px rgba(0, 255, 136, 0.3))'
          }}>
            🏃‍♂️
          </div>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700',
            marginBottom: '8px',
            background: 'var(--gradient-energy)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Treadmill Trainer
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Version 1.0.0
          </p>
          <p style={{ 
            color: 'var(--text-muted)', 
            fontSize: '0.875rem',
            lineHeight: '1.6'
          }}>
            Application d'entraînement par intervalles sur tapis roulant.
            Créez vos programmes personnalisés et suivez vos progrès !
          </p>
          
          <div style={{ 
            marginTop: '24px',
            padding: '16px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            <Info size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Pour installer l'app sur votre téléphone, utilisez "Ajouter à l'écran d'accueil" 
            dans le menu de votre navigateur.
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3 className="card-title">💡 Conseils</h3>
        </div>
        <ul style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '0.875rem',
          lineHeight: '1.8',
          paddingLeft: '20px'
        }}>
          <li>Commencez toujours par un échauffement de 5 minutes</li>
          <li>Variez inclinaison et vitesse pour plus d'efficacité</li>
          <li>Hydratez-vous régulièrement pendant l'entraînement</li>
          <li>Terminez par une période de récupération</li>
          <li>Augmentez progressivement l'intensité semaine après semaine</li>
        </ul>
      </div>
    </div>
  );
};

export default SettingsPage;
