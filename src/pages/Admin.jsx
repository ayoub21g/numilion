import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, set, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import { Shield, Plus, Trash2, LayoutGrid, Users, Activity } from 'lucide-react';
import './Admin.css';

const Admin = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  
  const [games, setGames] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [visits, setVisits] = useState(0);
  const [online, setOnline] = useState(0);

  // Form state
  const [newGame, setNewGame] = useState({ name: '', img: '', desc: '', dl: '', category: 'action' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const s = localStorage.getItem('numilion_session');
    if (!s) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(s);
    if (parsed.role !== 'admin') {
      navigate('/');
      return;
    }
    setSession(parsed);

    // Fetch Analytics & Data
    const gamesRef = ref(db, 'games');
    const usersRef = ref(db, 'users');
    const statsRef = ref(db, 'stats/visits');
    const onlineRef = ref(db, 'online');

    const unsubs = [
      onValue(gamesRef, (snap) => setGames(snap.val() ? Object.values(snap.val()) : [])),
      onValue(usersRef, (snap) => setUsersCount(snap.size)),
      onValue(statsRef, (snap) => setVisits(snap.val() || 0)),
      onValue(onlineRef, (snap) => setOnline(snap.size))
    ];

    return () => unsubs.forEach(unsub => unsub());
  }, [navigate]);

  if (!session) return null;

  const handleAddGame = async (e) => {
    e.preventDefault();
    if (!newGame.name) return;

    const id = 'game_' + Date.now();
    const gameToSave = { ...newGame, id };

    try {
      await set(ref(db, `games/${id}`), gameToSave);
      setMessage('Jeu ajouté avec succès !');
      setNewGame({ name: '', img: '', desc: '', dl: '', category: 'action' });
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Erreur lors de l\'ajout.');
    }
  };

  const handleDeleteGame = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce jeu ?')) {
      try {
        await remove(ref(db, `games/${id}`));
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="admin-container animate-fade-in">
      <div className="admin-header">
        <Shield size={32} className="text-gradient" />
        <h1>Panel <span className="text-gradient">Admin</span></h1>
      </div>

      <div className="admin-stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon"><Activity size={24} className="text-danger" /></div>
          <div className="stat-info">
            <span className="stat-value">{visits}</span>
            <span className="stat-label">Visites Totales</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{color: '#2ecc71'}}><Users size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{online}</span>
            <span className="stat-label">En Ligne</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{color: '#3498db'}}><Users size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{usersCount}</span>
            <span className="stat-label">Membres Inscrits</span>
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{color: '#f1c40f'}}><LayoutGrid size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{games.length}</span>
            <span className="stat-label">Jeux Disponibles</span>
          </div>
        </div>
      </div>

      <div className="admin-content-grid">
        {/* Ajouter un jeu */}
        <div className="admin-section glass-panel">
          <div className="section-header">
            <Plus size={20} className="text-gradient" />
            <h2>Ajouter un jeu</h2>
          </div>
          <form className="admin-form" onSubmit={handleAddGame}>
            <div className="form-group row">
              <div className="form-col">
                <label>Nom du jeu</label>
                <input type="text" value={newGame.name} onChange={e => setNewGame({...newGame, name: e.target.value})} required />
              </div>
              <div className="form-col">
                <label>Catégorie</label>
                <select value={newGame.category} onChange={e => setNewGame({...newGame, category: e.target.value})}>
                  <option value="action">Action</option>
                  <option value="fps">FPS</option>
                  <option value="rpg">RPG</option>
                  <option value="aventure">Aventure</option>
                  <option value="sport">Sport</option>
                  <option value="course">Course</option>
                  <option value="horreur">Horreur</option>
                  <option value="simulation">Simulation</option>
                  <option value="strategie">Stratégie</option>
                  <option value="indie">Indie</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>URL de l'image (Affiche/Poster)</label>
              <input type="text" value={newGame.img} onChange={e => setNewGame({...newGame, img: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Description courte</label>
              <textarea rows="3" value={newGame.desc} onChange={e => setNewGame({...newGame, desc: e.target.value})}></textarea>
            </div>

            <div className="form-group">
              <label>Lien de téléchargement</label>
              <input type="text" value={newGame.dl} onChange={e => setNewGame({...newGame, dl: e.target.value})} />
            </div>

            <button type="submit" className="btn-primary" style={{marginTop: '10px'}}>Ajouter le jeu</button>
            {message && <div className="admin-message">{message}</div>}
          </form>
        </div>

        {/* Liste des jeux */}
        <div className="admin-section glass-panel">
          <div className="section-header">
            <LayoutGrid size={20} className="text-gradient" />
            <h2>Gérer les jeux</h2>
          </div>
          <div className="admin-list-container">
            {games.length === 0 ? (
              <p className="empty-msg">Aucun jeu à afficher.</p>
            ) : (
              <ul className="admin-list">
                {games.map(g => (
                  <li key={g.id} className="admin-list-item">
                    <div className="item-info">
                      {g.img ? <img src={g.img} alt={g.name} /> : <div className="item-img-placeholder"><LayoutGrid size={16}/></div>}
                      <div>
                        <strong>{g.name}</strong>
                        <span className="item-cat">{g.category}</span>
                      </div>
                    </div>
                    <button className="del-btn" onClick={() => handleDeleteGame(g.id)} title="Supprimer">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
