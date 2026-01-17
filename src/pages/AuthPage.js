import React, { useState } from 'react';
import { Mail, Lock, User, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { signUp, signIn } from '../lib/supabase';

const AuthPage = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs' });
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { data, error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            setMessage({ type: 'error', text: 'Email ou mot de passe incorrect' });
          } else if (error.message.includes('Email not confirmed')) {
            setMessage({ type: 'error', text: 'Veuillez confirmer votre email avant de vous connecter' });
          } else {
            setMessage({ type: 'error', text: error.message });
          }
        } else if (data?.user) {
          onAuthSuccess(data.user);
        }
      } else {
        // Sign up
        const { data, error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            setMessage({ type: 'error', text: 'Cet email est déjà utilisé' });
          } else {
            setMessage({ type: 'error', text: error.message });
          }
        } else if (data?.user) {
          setMessage({ 
            type: 'success', 
            text: '✅ Compte créé ! Vérifiez votre email pour confirmer votre inscription.' 
          });
          // Clear form
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Une erreur est survenue' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🏃</div>
          <h1>Treadmill Trainer</h1>
          <p>Votre coach d'entraînement sur tapis</p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setMessage({ type: '', text: '' }); }}
          >
            Connexion
          </button>
          <button 
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setMessage({ type: '', text: '' }); }}
          >
            Inscription
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`auth-message ${message.type}`}>
            {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">
              <Mail size={14} style={{ marginRight: '6px' }} />
              Email
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={14} style={{ marginRight: '6px' }} />
              Mot de passe
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">
                <Lock size={14} style={{ marginRight: '6px' }} />
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader size={18} className="spin" />
                Chargement...
              </>
            ) : isLogin ? (
              <>
                <User size={18} />
                Se connecter
              </>
            ) : (
              <>
                <User size={18} />
                Créer un compte
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          {isLogin ? (
            <p>Pas encore de compte ? <button onClick={() => setIsLogin(false)}>Inscrivez-vous</button></p>
          ) : (
            <p>Déjà un compte ? <button onClick={() => setIsLogin(true)}>Connectez-vous</button></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
