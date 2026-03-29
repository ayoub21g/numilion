import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ref, get, set } from 'firebase/database';
import { db } from '../lib/firebase';
import { LogIn, UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get('redirect') || '/';

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);

    try {
      const userRef = ref(db, `users/${username}`);
      const snapshot = await get(userRef);

      if (isLogin) {
        if (!snapshot.exists()) {
          setError('Utilisateur introuvable.');
        } else {
          const userData = snapshot.val();
          if (userData.pass === password) {
            // Success
            localStorage.setItem('numilion_session', JSON.stringify({
              user: userData.user,
              avatar: userData.avatar || null,
              role: userData.role || 'user'
            }));
            window.location.href = redirect; // Force reload to update navbar state
          } else {
            setError('Mot de passe incorrect.');
          }
        }
      } else {
        // Register
        if (snapshot.exists()) {
          setError('Ce pseudo est déjà utilisé.');
        } else {
          const newUser = {
            user: username,
            pass: password,
            avatar: null,
            role: 'user',
            createdAt: new Date().toISOString()
          };
          await set(userRef, newUser);
          localStorage.setItem('numilion_session', JSON.stringify({
            user: newUser.user,
            avatar: newUser.avatar,
            role: newUser.role
          }));
          window.location.href = redirect;
        }
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="auth-icon-wrap">
            {isLogin ? <LogIn size={32} className="text-gradient" /> : <UserPlus size={32} className="text-gradient" />}
          </div>
          <h2>{isLogin ? 'Bon retour !' : 'Créer un compte'}</h2>
          <p>{isLogin ? 'Connecte-toi pour télécharger des jeux' : 'Rejoignez-nous en quelques secondes'}</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Pseudo</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Ton pseudo"
              required
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <div className="password-input-wrap">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required
              />
              <button 
                type="button" 
                className="pwd-toggle" 
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? <div className="spinner-small"></div> : (isLogin ? 'Se connecter' : "S'inscrire")}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Tu n'as pas de compte ?" : "Tu as déjà un compte ?"}
            <button className="text-gradient link-btn" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
