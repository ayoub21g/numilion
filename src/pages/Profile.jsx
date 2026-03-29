import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, update } from 'firebase/database';
import { db } from '../lib/firebase';
import { User, Settings, Image as ImageIcon } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const s = localStorage.getItem('numilion_session');
    if (s) {
      const parsed = JSON.parse(s);
      setSession(parsed);
      setAvatarUrl(parsed.avatar || '');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  if (!session) return null;

  const handleUpdateAvatar = async (e) => {
    e.preventDefault();
    if (!avatarUrl.trim()) return;
    
    setIsUpdating(true);
    try {
      const userRef = ref(db, `users/${session.user}`);
      await update(userRef, { avatar: avatarUrl });
      
      const newSession = { ...session, avatar: avatarUrl };
      localStorage.setItem('numilion_session', JSON.stringify(newSession));
      setSession(newSession);
      
      setMessage('Avatar mis à jour avec succès !');
      setTimeout(() => setMessage(''), 3000);
      
      // Trigger navbar reload organically if needed, but local state might not sync across components without context.
      // Re-fetching or forcing reload is easiest here given the legacy constraint.
      window.dispatchEvent(new Event('storage')); 
    } catch (err) {
      console.error(err);
      setMessage('Erreur lors de la mise à jour.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="profile-container animate-fade-in">
      <div className="profile-header">
        <div className="profile-avatar-large">
          {session.avatar ? (
            <img src={session.avatar} alt="Avatar" />
          ) : (
            <User size={64} />
          )}
        </div>
        <div className="profile-header-info">
          <h1>{session.user}</h1>
          <span className="profile-role badge">{session.role === 'admin' ? 'Administrateur' : 'Membre'}</span>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card glass-panel">
          <div className="card-header">
            <Settings size={20} className="text-gradient" />
            <h3>Paramètres du compte</h3>
          </div>
          
          <form onSubmit={handleUpdateAvatar} className="profile-form">
            <div className="form-group">
              <label>Changer l'avatar (URL de l'image)</label>
              <div className="input-with-icon">
                <ImageIcon size={18} className="input-icon" />
                <input 
                  type="text" 
                  value={avatarUrl} 
                  onChange={(e) => setAvatarUrl(e.target.value)} 
                  placeholder="https://..."
                />
              </div>
            </div>
            
            <button type="submit" className="btn-primary" disabled={isUpdating}>
              {isUpdating ? 'Mise à jour...' : 'Enregistrer'}
            </button>
            
            {message && <div className="profile-message">{message}</div>}
          </form>
        </div>

        {/* Can easily add an "Activity" or "Favorites" card here later */}
      </div>
    </div>
  );
};

export default Profile;
