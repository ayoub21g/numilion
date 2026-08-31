import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, set, update, remove, push } from 'firebase/database';
import { db } from '../lib/firebase';
import { Shield, Plus, Trash2, LayoutGrid, Users, Activity, Pencil, Check, X, Mail, UserX, Sparkles, Loader, ShieldCheck, ShieldOff, Wrench, ScrollText, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import './Admin.css';

const CATS = ['action','fps','rpg','aventure','sport','course','horreur','simulation','strategie','indie'];
const YT_KEY = 'AIzaSyBil82PzQVZctvV5mgolWNxvknExLrJeYI';
const WORKER = 'https://numilion.ayoubghe2010.workers.dev/';

async function autoFill(name) {
  // 1. Image + description via Steam Worker
  let img = '', desc = '', trailer = '';
  try {
    const r = await fetch(`${WORKER}?steam_search=${encodeURIComponent(name)}`);
    const d = await r.json();
    if (d.appid) {
      img = d.cover || '';
      desc = d.desc || '';
    }
  } catch {}

  // 2. Trailer via YouTube
  try {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&videoEmbeddable=true&q=${encodeURIComponent(name + ' official trailer')}&key=${YT_KEY}`);
    const d = await r.json();
    if (d.items && d.items[0]) trailer = d.items[0].id.videoId;
  } catch {}

  return { img, desc, trailer };
}

const Admin = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [visits, setVisits] = useState(0);
  const [online, setOnline] = useState(0);
  const [newGame, setNewGame] = useState({ name: '', img: '', desc: '', dl: '', category: 'action', trailer: '' });
  const [message, setMessage] = useState('');
  const [autoLoading, setAutoLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [activeTab, setActiveTab] = useState('games');
  const [rejectMsg, setRejectMsg] = useState({});
  const [steamToolsUrl, setSteamToolsUrl] = useState('');
  const [steamToolsMsg, setSteamToolsMsg] = useState('');
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const s = localStorage.getItem('numilion_session');
    if (!s) { navigate('/login'); return; }
    const parsed = JSON.parse(s);
    if (parsed.role !== 'admin') { navigate('/'); return; }
    setSession(parsed);

    const unsubs = [
      onValue(ref(db, 'games'), snap => setGames(snap.val() ? Object.values(snap.val()) : [])),
      onValue(ref(db, 'users'), snap => setUsers(snap.val() ? Object.values(snap.val()) : [])),
      onValue(ref(db, 'requests'), snap => {
        if (snap.val()) {
          const reqs = Object.entries(snap.val()).map(([key, val]) => ({ ...val, _key: key }));
          setRequests(reqs);
        } else {
          setRequests([]);
        }
      }),
      onValue(ref(db, 'stats/visits'), snap => setVisits(snap.val() || 0)),
      onValue(ref(db, 'online'), snap => setOnline(snap.size)),
      onValue(ref(db, 'steamtools/url'), snap => setSteamToolsUrl(snap.val() || '')),
      onValue(ref(db, 'logs'), snap => {
        if (snap.val()) {
          const list = Object.entries(snap.val())
            .map(([key, val]) => ({ ...val, _key: key }))
            .sort((a, b) => b.ts - a.ts);
          setLogs(list);
        } else {
          setLogs([]);
        }
      })
    ];
    return () => unsubs.forEach(u => u());
  }, [navigate]);

  if (!session) return null;

  // ── Helper : enregistre une action dans Firebase logs ──
  const writeLog = (type, details) => {
    push(ref(db, 'logs'), {
      type,
      details,
      admin: session.user,
      ts: Date.now(),
      date: new Date().toLocaleString('fr-FR')
    });
  };

  const handleAddGame = async (e) => {
    e.preventDefault();
    if (!newGame.name) return;
    const id = 'game_' + Date.now();
    try {
      await set(ref(db, `games/${id}`), { ...newGame, id });
      writeLog('game_add', `Jeu ajouté : "${newGame.name}" (${newGame.category})`);
      setMessage('Jeu ajouté !');
      setNewGame({ name: '', img: '', desc: '', dl: '', category: 'action', trailer: '' });
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('Erreur.'); }
  };

  const handleAutoFill = async () => {
    if (!newGame.name.trim()) return;
    setAutoLoading(true);
    try {
      const data = await autoFill(newGame.name);
      setNewGame(prev => ({
        ...prev,
        img: data.img || prev.img,
        desc: data.desc || prev.desc,
        trailer: data.trailer || prev.trailer,
      }));
    } finally {
      setAutoLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const game = games.find(g => g.id === id);
    if (window.confirm('Supprimer ce jeu ?')) {
      await remove(ref(db, `games/${id}`));
      writeLog('game_delete', `Jeu supprimé : "${game?.name || id}"`);
    }
  };

  const startEdit = (g) => {
    setEditingId(g.id);
    setEditData({ name: g.name, img: g.img||'', desc: g.desc||'', dl: g.dl||'', category: g.category||'action' });
  };

  const saveEdit = async (id) => {
    await update(ref(db, `games/${id}`), editData);
    writeLog('game_edit', `Jeu modifié : "${editData.name}"`);
    setEditingId(null);
  };

  const deleteUser = async (username) => {
    if (!username) return;
    if (window.confirm(`Supprimer l'utilisateur "${username}" ?`)) {
      await remove(ref(db, `users/${username}`));
      await remove(ref(db, `notifications/${username}`));
      writeLog('user_delete', `Utilisateur supprimé : "${username}"`);
    }
  };

  const toggleAdmin = async (u) => {
    const username = u.user;
    if (!username) return;
    const isAdmin = u.role === 'admin';
    const newRole = isAdmin ? 'user' : 'admin';
    const action = isAdmin ? 'retirer les droits admin de' : 'promouvoir en admin';
    if (!window.confirm(`Voulez-vous ${action} "${username}" ?`)) return;

    // Mettre à jour dans users/
    await update(ref(db, `users/${username}`), { role: newRole });

    // Si l'utilisateur est aussi dans admins/, mettre à jour là aussi
    const adminSnap = await import('firebase/database').then(({ get }) => get(ref(db, `admins/${username}`)));
    if (adminSnap.exists()) {
      await update(ref(db, `admins/${username}`), { role: newRole });
    }

    // Mettre à jour la session locale si c'est l'utilisateur connecté
    const s = localStorage.getItem('numilion_session');
    if (s) {
      const parsed = JSON.parse(s);
      if (parsed.user === username) {
        localStorage.setItem('numilion_session', JSON.stringify({ ...parsed, role: newRole }));
      }
    }
    writeLog('user_role', `Rôle changé : "${username}" → ${newRole}`);
  };

  const acceptRequest = async (req) => {
    await update(ref(db, `requests/${req._key}`), { status: 'accepted' });
    writeLog('request_accept', `Demande acceptée : "${req.name}" (par ${req.user})`);
    if (req.user && req.user !== 'Visiteur') {
      await push(ref(db, `notifications/${req.user}`), {
        type: 'accepte',
        game: req.name,
        comment: 'Votre demande a été acceptée !',
        date: new Date().toLocaleDateString('fr-FR'),
        read: false
      });
    }
  };

  const rejectRequest = async (req) => {
    const msg = rejectMsg[req._key] || '';
    await update(ref(db, `requests/${req._key}`), { status: 'rejected', rejectMsg: msg });
    writeLog('request_reject', `Demande refusée : "${req.name}" (par ${req.user})${msg ? ` — raison : ${msg}` : ''}`);
    if (req.user && req.user !== 'Visiteur') {
      await push(ref(db, `notifications/${req.user}`), {
        type: 'refus',
        game: req.name,
        comment: msg || 'Aucune raison fournie.',
        date: new Date().toLocaleDateString('fr-FR'),
        read: false
      });
    }
    setRejectMsg(prev => { const n = {...prev}; delete n[req._key]; return n; });
  };

  const deleteRequest = async (key) => {
    await remove(ref(db, `requests/${key}`));
  };

  const saveSteamTools = async (e) => {
    e.preventDefault();
    try {
      await set(ref(db, 'steamtools/url'), steamToolsUrl);
      writeLog('steamtools_update', `Lien SteamTools mis à jour : "${steamToolsUrl}"`);
      setSteamToolsMsg('Lien sauvegardé !');
      setTimeout(() => setSteamToolsMsg(''), 3000);
    } catch { setSteamToolsMsg('Erreur.'); }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const doneRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="admin-container animate-fade-in">
      <div className="admin-header">
        <Shield size={32} className="text-gradient" />
        <h1>Panel <span className="text-gradient">Admin</span></h1>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        <div className="stat-card glass-panel"><div className="stat-icon"><Activity size={24} className="text-danger"/></div><div className="stat-info"><span className="stat-value">{visits}</span><span className="stat-label">Visites</span></div></div>
        <div className="stat-card glass-panel"><div className="stat-icon" style={{color:'#2ecc71'}}><Users size={24}/></div><div className="stat-info"><span className="stat-value">{online}</span><span className="stat-label">En Ligne</span></div></div>
        <div className="stat-card glass-panel"><div className="stat-icon" style={{color:'#3498db'}}><Users size={24}/></div><div className="stat-info"><span className="stat-value">{users.length}</span><span className="stat-label">Membres</span></div></div>
        <div className="stat-card glass-panel"><div className="stat-icon" style={{color:'#f1c40f'}}><LayoutGrid size={24}/></div><div className="stat-info"><span className="stat-value">{games.length}</span><span className="stat-label">Jeux</span></div></div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {[['games','🕹️ Jeux'],['users','👥 Utilisateurs'],['requests','📬 Demandes'],['steamtools','🔧 SteamTools'],['logs','📋 Logs']].map(([k,l]) => (
          <button key={k} className={`admin-tab-btn ${activeTab===k?'active':''}`} onClick={() => setActiveTab(k)}>
            {l} {k==='requests' && pendingRequests.length > 0 && <span className="tab-badge">{pendingRequests.length}</span>}
          </button>
        ))}
      </div>

      {/* JEUX */}
      {activeTab === 'games' && (
        <div className="admin-content-grid">
          <div className="admin-section glass-panel">
            <div className="section-header"><Plus size={20} className="text-gradient"/><h2>Ajouter un jeu</h2></div>
            <form className="admin-form" onSubmit={handleAddGame}>
              <div className="form-group row">
                <div className="form-col">
                  <label>Nom</label>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <input type="text" value={newGame.name} onChange={e => setNewGame({...newGame, name: e.target.value})} required style={{flex:1,marginBottom:0}} />
                    <button type="button" className="btn-autofill" onClick={handleAutoFill} disabled={autoLoading} title="Auto-remplir image, description et trailer">
                      {autoLoading ? <Loader size={16} className="spin"/> : <Sparkles size={16}/>}
                      {autoLoading ? ' ...' : ' Auto'}
                    </button>
                  </div>
                </div>
                <div className="form-col"><label>Catégorie</label>
                  <select value={newGame.category} onChange={e => setNewGame({...newGame, category: e.target.value})}>
                    {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label>URL image</label><input type="text" value={newGame.img} onChange={e => setNewGame({...newGame, img: e.target.value})} /></div>
              <div className="form-group"><label>Description</label><textarea rows="3" value={newGame.desc} onChange={e => setNewGame({...newGame, desc: e.target.value})}></textarea></div>
              <div className="form-group"><label>Trailer YouTube (ID ou URL)</label><input type="text" value={newGame.trailer||''} onChange={e => setNewGame({...newGame, trailer: e.target.value})} placeholder="ex: dQw4w9WgXcQ" /></div>
              <div className="form-group"><label>Lien téléchargement</label><input type="text" value={newGame.dl} onChange={e => setNewGame({...newGame, dl: e.target.value})} /></div>
              <button type="submit" className="btn-primary" style={{marginTop:'10px'}}>Ajouter</button>
              {message && <div className="admin-message">{message}</div>}
            </form>
          </div>

          <div className="admin-section glass-panel">
            <div className="section-header"><LayoutGrid size={20} className="text-gradient"/><h2>Gérer les jeux ({games.length})</h2></div>
            <div className="admin-list-container">
              {games.length === 0 ? <p className="empty-msg">Aucun jeu.</p> : (
                <ul className="admin-list">
                  {games.map(g => (
                    <li key={g.id} className="admin-list-item" style={{flexDirection:'column',alignItems:'stretch',gap:0}}>
                      {editingId === g.id ? (
                        <div className="edit-form">
                          <div className="edit-row">
                            <input placeholder="Nom" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                            <select value={editData.category} onChange={e => setEditData({...editData, category: e.target.value})}>
                              {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                            </select>
                          </div>
                          <input placeholder="URL image" value={editData.img} onChange={e => setEditData({...editData, img: e.target.value})} />
                          <input placeholder="Description" value={editData.desc} onChange={e => setEditData({...editData, desc: e.target.value})} />
                          <input placeholder="Lien téléchargement" value={editData.dl} onChange={e => setEditData({...editData, dl: e.target.value})} />
                          <div className="edit-actions">
                            <button className="btn-save" onClick={() => saveEdit(g.id)}><Check size={16}/> Sauvegarder</button>
                            <button className="btn-cancel" onClick={() => setEditingId(null)}><X size={16}/> Annuler</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
                          <div className="item-info">
                            {g.img ? <img src={g.img} alt={g.name}/> : <div className="item-img-placeholder"><LayoutGrid size={16}/></div>}
                            <div><strong>{g.name}</strong><span className="item-cat">{g.category}</span></div>
                          </div>
                          <div style={{display:'flex',gap:8}}>
                            <button className="edit-btn" onClick={() => startEdit(g)}><Pencil size={16}/></button>
                            <button className="del-btn" onClick={() => handleDelete(g.id)}><Trash2 size={16}/></button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UTILISATEURS */}
      {activeTab === 'users' && (
        <div className="admin-section glass-panel" style={{maxWidth:'100%'}}>
          <div className="section-header"><Users size={20} className="text-gradient"/><h2>Utilisateurs ({users.length})</h2></div>
          <div className="admin-list-container">
            {users.length === 0 ? <p className="empty-msg">Aucun utilisateur.</p> : (
              <ul className="admin-list">
                {users.map(u => (
                  <li key={u.user} className="admin-list-item">
                    <div className="item-info">
                      {u.avatar ? <img src={u.avatar} alt={u.user} style={{width:40,height:40,borderRadius:'50%',objectFit:'cover'}}/> : <div className="item-img-placeholder" style={{borderRadius:'50%'}}><Users size={16}/></div>}
                      <div>
                        <strong>{u.user}</strong>
                        <span className="item-cat" style={{color: u.role === 'admin' ? '#a855f7' : 'var(--text-muted)'}}>
                          {u.role === 'admin' ? '👑 Admin' : '👤 User'}
                        </span>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button
                        className={u.role === 'admin' ? 'btn-unadmin' : 'btn-makeadmin'}
                        onClick={() => toggleAdmin(u)}
                        title={u.role === 'admin' ? 'Retirer admin' : 'Promouvoir admin'}
                      >
                        {u.role === 'admin' ? <ShieldOff size={16}/> : <ShieldCheck size={16}/>}
                      </button>
                      <button className="del-btn" onClick={() => deleteUser(u.user)} title="Supprimer"><UserX size={16}/></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* DEMANDES */}
      {activeTab === 'requests' && (
        <div className="admin-section glass-panel" style={{maxWidth:'100%'}}>
          <div className="section-header"><Mail size={20} className="text-gradient"/><h2>Demandes de jeux</h2></div>
          
          {pendingRequests.length > 0 && (
            <>
              <h3 style={{color:'#ffa000',fontSize:'0.85rem',textTransform:'uppercase',letterSpacing:'1px',marginBottom:12}}>⏳ En attente ({pendingRequests.length})</h3>
              <ul className="admin-list" style={{marginBottom:24}}>
                {pendingRequests.map(r => (
                  <li key={r.id} className="admin-list-item" style={{flexDirection:'column',alignItems:'stretch',gap:10}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div className="item-info">
                        {r.img ? <img src={r.img} alt={r.name} style={{width:48,height:48,borderRadius:10,objectFit:'cover'}}/> : <div className="item-img-placeholder"><LayoutGrid size={16}/></div>}
                        <div><strong>{r.name}</strong><span className="item-cat">Par {r.user} · {r.date}</span>{r.msg && <span className="item-cat" style={{color:'#aaa'}}>"{r.msg}"</span>}</div>
                      </div>
                      <button className="del-btn" onClick={() => deleteRequest(r._key)} title="Supprimer"><Trash2 size={14}/></button>
                    </div>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                      <button className="btn-save" style={{fontSize:'0.82rem',padding:'8px 16px'}} onClick={() => acceptRequest(r)}>
                        <Check size={14}/> Accepter
                      </button>
                      <input
                        placeholder="Raison du refus (optionnel)"
                        value={rejectMsg[r._key] || ''}
                        onChange={e => setRejectMsg(prev => ({...prev, [r._key]: e.target.value}))}
                        style={{flex:1,minWidth:180,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',padding:'8px 12px',borderRadius:10,color:'#fff',fontSize:'0.85rem',fontFamily:'inherit'}}
                      />
                      <button className="del-btn" style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:50}} onClick={() => rejectRequest(r)}>
                        <X size={14}/> Refuser
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {doneRequests.length > 0 && (
            <>
              <h3 style={{color:'#555',fontSize:'0.85rem',textTransform:'uppercase',letterSpacing:'1px',marginBottom:12}}>Traitées ({doneRequests.length})</h3>
              <ul className="admin-list">
                {doneRequests.map(r => (
                  <li key={r.id} className="admin-list-item">
                    <div className="item-info">
                      <div><strong>{r.name}</strong><span className="item-cat" style={{color: r.status==='accepted'?'#2ecc71':'#e94560'}}>{r.status==='accepted'?'✓ Accepté':'✗ Refusé'} · {r.user}</span></div>
                    </div>
                    <button className="del-btn" onClick={() => deleteRequest(r._key)}><Trash2 size={14}/></button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {requests.length === 0 && <p className="empty-msg">Aucune demande.</p>}
        </div>
      )}

      {/* STEAMTOOLS */}
      {activeTab === 'steamtools' && (
        <div className="admin-section glass-panel" style={{maxWidth:600}}>
          <div className="section-header"><Wrench size={20} className="text-gradient"/><h2>SteamTools</h2></div>
          <p style={{color:'var(--text-muted)',fontSize:'0.9rem',marginBottom:20}}>
            Mets ici le lien de téléchargement de SteamTools. Il apparaîtra comme bouton dans la navbar pour tous les visiteurs.
          </p>
          <form className="admin-form" onSubmit={saveSteamTools}>
            <div className="form-group">
              <label>Lien de téléchargement</label>
              <input
                type="text"
                value={steamToolsUrl}
                onChange={e => setSteamToolsUrl(e.target.value)}
                placeholder="https://github.com/.../SteamTools.zip"
              />
            </div>
            {steamToolsUrl && (
              <div style={{padding:'12px 16px',background:'rgba(23,107,185,0.1)',border:'1px solid rgba(23,107,185,0.3)',borderRadius:12,fontSize:'0.85rem',color:'#5bb8f5'}}>
                Aperçu : <a href={steamToolsUrl} target="_blank" rel="noopener noreferrer" style={{color:'#5bb8f5'}}>{steamToolsUrl}</a>
              </div>
            )}
            <button type="submit" className="btn-primary" style={{marginTop:10}}>Sauvegarder</button>
            {steamToolsMsg && <div className="admin-message">{steamToolsMsg}</div>}
          </form>
        </div>
      )}

      {/* LOGS */}
      {activeTab === 'logs' && (
        <LogsPanel logs={logs} session={session} db={db} />
      )}
    </div>
  );
};

// ── Logs Panel ──────────────────────────────────────────────────────────────
const LOG_ICONS = {
  game_add:         { icon: '➕', color: '#2ecc71', label: 'Jeu ajouté' },
  game_delete:      { icon: '🗑️', color: '#e94560', label: 'Jeu supprimé' },
  game_edit:        { icon: '✏️', color: '#f1c40f', label: 'Jeu modifié' },
  user_delete:      { icon: '👤🗑️', color: '#e94560', label: 'Utilisateur supprimé' },
  user_role:        { icon: '🛡️', color: '#a855f7', label: 'Rôle modifié' },
  request_accept:   { icon: '✅', color: '#2ecc71', label: 'Demande acceptée' },
  request_reject:   { icon: '❌', color: '#e94560', label: 'Demande refusée' },
  steamtools_update:{ icon: '🔧', color: '#3498db', label: 'SteamTools' },
};

const LOG_FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'game_add', label: 'Ajouts' },
  { id: 'game_delete', label: 'Suppressions jeux' },
  { id: 'game_edit', label: 'Éditions jeux' },
  { id: 'user_delete', label: 'Suppressions users' },
  { id: 'user_role', label: 'Rôles' },
  { id: 'request_accept', label: 'Acceptées' },
  { id: 'request_reject', label: 'Refusées' },
];

const LOGS_PER_PAGE = 20;

const LogsPanel = ({ logs, session, db }) => {
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = filter === 'all' ? logs : logs.filter(l => l.type === filter);
  const totalPages = Math.ceil(filtered.length / LOGS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * LOGS_PER_PAGE, page * LOGS_PER_PAGE);

  const handleFilterChange = (f) => { setFilter(f); setPage(1); };

  const clearLogs = async () => {
    if (window.confirm('Vider tous les logs ? Cette action est irréversible.')) {
      await remove(ref(db, 'logs'));
    }
  };

  return (
    <div className="admin-section glass-panel" style={{maxWidth:'100%'}}>
      <div className="section-header" style={{justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <ScrollText size={20} className="text-gradient"/>
          <h2>Logs d'activité <span style={{color:'var(--text-muted)',fontWeight:400,fontSize:'0.85rem'}}>({filtered.length})</span></h2>
        </div>
        <button className="del-btn" onClick={clearLogs} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,fontSize:'0.8rem'}}>
          <Trash2 size={14}/> Vider les logs
        </button>
      </div>

      {/* Filtres */}
      <div className="logs-filters">
        <Filter size={14} style={{color:'var(--text-muted)',flexShrink:0}}/>
        {LOG_FILTERS.map(f => (
          <button
            key={f.id}
            className={`log-filter-btn ${filter === f.id ? 'active' : ''}`}
            onClick={() => handleFilterChange(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {paginated.length === 0 ? (
        <p className="empty-msg">Aucun log pour cette catégorie.</p>
      ) : (
        <ul className="logs-list">
          {paginated.map(log => {
            const meta = LOG_ICONS[log.type] || { icon: '📌', color: '#aaa', label: log.type };
            return (
              <li key={log._key} className="log-item">
                <span className="log-icon" style={{color: meta.color}}>{meta.icon}</span>
                <div className="log-body">
                  <span className="log-label" style={{color: meta.color}}>{meta.label}</span>
                  <span className="log-details">{log.details}</span>
                </div>
                <div className="log-meta">
                  <span className="log-admin">👤 {log.admin}</span>
                  <span className="log-date">{log.date}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="logs-pagination">
          <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft size={16}/>
          </button>
          <span className="page-info">Page {page} / {totalPages}</span>
          <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight size={16}/>
          </button>
        </div>
      )}
    </div>
  );
};

export default Admin;
