// v2 upload
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, update, get, set, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import { User, Settings, Upload, Link, Key, AtSign } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [preview, setPreview] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('file');
  const [newUsername, setNewUsername] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    const s = localStorage.getItem('numilion_session');
    if (s) {
      const parsed = JSON.parse(s);
      setSession(parsed);
      setAvatarUrl(parsed.avatar || '');
      setPreview(parsed.avatar || null);
      setNewUsername(parsed.user || '');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  if (!session) return null;

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setAvatarUrl(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (newPass && newPass !== confirmPass) {
      setMessage('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPass && newPass.length < 4) {
      setMessage('Mot de passe trop court (min 4 caractères).');
      return;
    }

    setIsUpdating(true);
    try {
      const isAdmin = session.role === 'admin';
      const dbPath = isAdmin ? `admins/${session.user}` : `users/${session.user}`;
      const updates = {};

      if (avatarUrl.trim()) updates.avatar = avatarUrl.trim();
      if (newPass) updates.pass = newPass;

      // Changement de nom d'utilisateur
      if (newUsername.trim() && newUsername.trim() !== session.user) {
        const newName = newUsername.trim();
        // Vérifier que le nouveau nom n'est pas pris
        const checkRef = ref(db, `${isAdmin ? 'admins' : 'users'}/${newName}`);
        const snap = await get(checkRef);
        if (snap.exists()) {
          setMessage('Ce nom est déjà utilisé.');
          setIsUpdating(false);
          return;
        }
        // Lire les données actuelles
        const currentSnap = await get(ref(db, dbPath));
        const currentData = currentSnap.val() || {};
        // Créer nouveau nœud
        await set(ref(db, `${isAdmin ? 'admins' : 'users'}/${newName}`), {
          ...currentData,
          ...updates,
          user: newName,
        });
        // Supprimer l'ancien
        await remove(ref(db, dbPath));
        // Mettre à jour la session
        const newSession = { ...session, user: newName, avatar: updates.avatar || session.avatar };
        localStorage.setItem('numilion_session', JSON.stringify(newSession));
        setSession(newSession);
        setMessage('Profil mis à jour ! Reconnecte-toi.');
        setTimeout(() => {
          localStorage.removeItem('numilion_session');
          navigate('/login');
        }, 2000);
        return;
      }

      // Pas de changement de nom
      if (Object.keys(updates).length === 0) {
        setMessage('Aucune modification.');
        setIsUpdating(false);
        return;
      }

      await update(ref(db, dbPath), updates);
      const newSession = { ...session, avatar: updates.avatar || session.avatar };
      localStorage.setItem('numilion_session', JSON.stringify(newSession));
      setSession(newSession);
      setPreview(updates.avatar || preview);
      setNewPass('');
      setConfirmPass('');
      setMessage('Profil mis à jour !');
      setTimeout(() => setMessage(''), 3000);
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      setMessage('Erreur lors de la mise à jour.');
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="profile-container animate-fade-in">
      <div className="profile-header">
        <div className="profile-avatar-large">
          {preview ? <img src={preview} alt="Avatar" /> : <User size={64} />}
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

          <form onSubmit={handleSave} className="profile-form">
            {/* Nom d'utilisateur */}
            <div className="form-group">
              <label>Nom d'utilisateur</label>
              <div className="input-with-icon">
                <AtSign size={18} className="input-icon" />
                <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Nouveau pseudo" />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <div className="input-with-icon">
                <Key size={18} className="input-icon" />
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Laisser vide pour ne pas changer" />
              </div>
            </div>
            {newPass && (
              <div className="form-group">
                <label>Confirmer le mot de passe</label>
                <div className="input-with-icon">
                  <Key size={18} className="input-icon" />
                  <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Confirmer" />
                </div>
              </div>
            )}

            {/* Avatar */}
            <div className="form-group">
              <label>Avatar</label>
              <div className="avatar-tabs">
                <button type="button" className={`avatar-tab ${tab === 'file' ? 'active' : ''}`} onClick={() => setTab('file')}>
                  <Upload size={15} /> Fichier
                </button>
                <button type="button" className={`avatar-tab ${tab === 'url' ? 'active' : ''}`} onClick={() => setTab('url')}>
                  <Link size={15} /> URL
                </button>
              </div>
              {tab === 'file' ? (
                <>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" style={{ display: 'none' }} onChange={handleFile} />
                  <div className="file-drop" onClick={() => fileRef.current?.click()}>
                    {preview && avatarUrl.startsWith('data:')
                      ? <img src={preview} alt="preview" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
                      : <><Upload size={28} style={{ color: 'var(--text-muted)', marginBottom: 6 }} /><p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Clique pour choisir</p></>
                    }
                  </div>
                </>
              ) : (
                <input type="text" value={avatarUrl.startsWith('data:') ? '' : avatarUrl} onChange={e => { setAvatarUrl(e.target.value); setPreview(e.target.value); }} placeholder="https://..." />
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={isUpdating}>
              {isUpdating ? 'Mise à jour...' : 'Enregistrer'}
            </button>
            {message && <div className="profile-message" style={{color: message.includes('Erreur') || message.includes('pas') ? '#e94560' : '#2ecc71'}}>{message}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
