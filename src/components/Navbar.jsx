import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, LogIn, Bell, User, Settings, Shield, X, Send, Check, Trash2 } from 'lucide-react';
import { ref, push, get, onValue, update, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [reqName, setReqName] = useState('');
  const [reqMsg, setReqMsg] = useState('');
  const [reqStatus, setReqStatus] = useState('');
  const notifRef = useRef(null);

  useEffect(() => {
    const s = localStorage.getItem('numilion_session');
    if (s) { try { setSession(JSON.parse(s)); } catch {} }
  }, []);

  useEffect(() => {
    if (!session) return;
    const dbRef = ref(db, `notifications/${session.user}`);
    const unsub = onValue(dbRef, snap => {
      if (snap.val()) {
        const list = Object.entries(snap.val()).map(([key, val]) => ({ ...val, _key: key }));
        setNotifs(list.reverse());
      } else {
        setNotifs([]);
      }
    });
    return () => unsub();
  }, [session]);

  // Fermer le panel notifs si clic dehors
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('numilion_session');
    setSession(null);
    setDropdownOpen(false);
    navigate('/');
  };

  const markAllRead = async () => {
    if (!session) return;
    for (const n of notifs.filter(n => !n.read)) {
      await update(ref(db, `notifications/${session.user}/${n._key}`), { read: true });
    }
  };

  const deleteNotif = async (key) => {
    if (!session) return;
    await remove(ref(db, `notifications/${session.user}/${key}`));
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!reqName.trim()) return;
    try {
      const sender = session ? session.user : 'Visiteur';
      await push(ref(db, 'requests'), {
        id: Date.now(),
        name: reqName,
        msg: reqMsg,
        user: sender,
        status: 'pending',
        date: new Date().toLocaleDateString('fr-FR')
      });

      // Notifier tous les admins
      const adminsSnap = await get(ref(db, 'admins'));
      if (adminsSnap.exists()) {
        const notifData = {
          type: 'demande',
          game: reqName,
          comment: `${sender} a demandé ce jeu.${reqMsg ? ' "' + reqMsg + '"' : ''}`,
          date: new Date().toLocaleDateString('fr-FR'),
          read: false
        };
        const promises = Object.keys(adminsSnap.val()).map(adminName =>
          push(ref(db, `notifications/${adminName}`), notifData)
        );
        await Promise.all(promises);
      }
      setReqStatus('success');
      setReqName('');
      setReqMsg('');
      setTimeout(() => { setShowModal(false); setReqStatus(''); }, 2000);
    } catch {
      setReqStatus('error');
    }
  };

  return (
    <>
      <nav className="navbar glass-panel">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            <img src="standard-2.gif" alt="Numilion Logo" className="navbar-logo" />
            <span className="brand-font text-gradient" style={{ fontWeight: 800, fontSize: '1.4rem' }}>Numilion</span>
          </Link>
          
          <div className="navbar-actions">
            <button className="btn-ghost request-btn" onClick={() => setShowModal(true)}>
              <Gamepad2 size={18} />
              Demander un jeu
            </button>
            
            {session ? (
              <div className="user-section">
                <div className="notif-container" ref={notifRef}>
                  <button className="icon-btn notif-btn" onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}>
                    <Bell size={20} />
                    {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                  </button>
                  {showNotifs && (
                    <div className="notif-panel glass-panel">
                      <div className="notif-panel-header">
                        <span>Notifications</span>
                        {notifs.length > 0 && <button className="notif-clear-all" onClick={async () => { for (const n of notifs) await deleteNotif(n._key); }}>Tout effacer</button>}
                      </div>
                      {notifs.length === 0 ? (
                        <p className="notif-empty">Aucune notification</p>
                      ) : (
                        <ul className="notif-list">
                          {notifs.map(n => (
                            <li key={n._key} className={`notif-item ${n.type === 'accepte' ? 'notif-accept' : n.type === 'demande' ? 'notif-request' : 'notif-reject'} ${n.read ? 'read' : ''}`}>
                              <div className="notif-icon">{n.type === 'accepte' ? <Check size={16}/> : n.type === 'demande' ? <Bell size={16}/> : <X size={16}/>}</div>
                              <div className="notif-content">
                                <strong>{n.game}</strong>
                                <span>{n.comment}</span>
                                <small>{n.date}</small>
                              </div>
                              <button className="notif-del" onClick={() => deleteNotif(n._key)}><Trash2 size={13}/></button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                <div className="profile-menu-container" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <button className="avatar-btn">
                    {session.avatar ? <img src={session.avatar} alt="Avatar" /> : <User size={20} />}
                  </button>
                  {dropdownOpen && (
                    <div className="dropdown-menu glass-panel">
                      <div className="dropdown-header">
                        <span className="dropdown-name">{session.user}</span>
                        <span className="dropdown-role">{session.role === 'admin' ? 'Administrateur' : 'Membre'}</span>
                      </div>
                      <div className="dropdown-links">
                        {session.role === 'admin' && <Link to="/admin" className="dropdown-item"><Shield size={16} /> Panel Admin</Link>}
                        <Link to="/profile" className="dropdown-item"><Settings size={16} /> Mon Profil</Link>
                        <button onClick={handleLogout} className="dropdown-item text-danger" style={{width:'100%',textAlign:'left'}}>Déconnexion</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn-primary"><LogIn size={18} />Connexion</Link>
            )}
          </div>
        </div>
      </nav>

      {/* Modal demande */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-gradient">🎮 Demander un jeu</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            {reqStatus === 'success' ? (
              <div style={{textAlign:'center',padding:'20px',color:'#2ecc71'}}>✅ Demande envoyée !</div>
            ) : (
              <form onSubmit={handleRequest} className="modal-form">
                <div className="form-group">
                  <label>Nom du jeu</label>
                  <input type="text" value={reqName} onChange={e => setReqName(e.target.value)} placeholder="Ex: GTA VI" required />
                </div>
                <div className="form-group">
                  <label>Message (optionnel)</label>
                  <textarea rows="3" value={reqMsg} onChange={e => setReqMsg(e.target.value)} placeholder="Pourquoi tu veux ce jeu ?"></textarea>
                </div>
                {reqStatus === 'error' && <p style={{color:'#e94560',fontSize:'0.85rem'}}>Erreur, réessaie.</p>}
                <button type="submit" className="btn-primary" style={{width:'100%'}}><Send size={16}/> Envoyer</button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
