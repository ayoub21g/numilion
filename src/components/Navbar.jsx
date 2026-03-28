import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, LogIn, Bell, User, Settings, Shield } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('numilion_session');
    if (s) {
      try {
        setSession(JSON.parse(s));
      } catch (e) {
        console.error("Invalid session");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('numilion_session');
    setSession(null);
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <img src="/standard-2.gif" alt="Numilion Logo" className="navbar-logo" />
          <span className="brand-font text-gradient" style={{ fontWeight: 800, fontSize: '1.4rem' }}>Numilion</span>
        </Link>
        
        <div className="navbar-actions">
          <button className="btn-ghost request-btn">
            <Gamepad2 size={18} />
            Demander un jeu
          </button>
          
          {session ? (
            <div className="user-section">
              <button className="icon-btn">
                <Bell size={20} />
              </button>
              
              <div className="profile-menu-container" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <button className="avatar-btn">
                  {session.avatar ? (
                    <img src={session.avatar} alt="Avatar" />
                  ) : (
                    <User size={20} />
                  )}
                </button>
                
                {dropdownOpen && (
                  <div className="dropdown-menu glass-panel">
                    <div className="dropdown-header">
                      <span className="dropdown-name">{session.user}</span>
                      <span className="dropdown-role">{session.role === 'admin' ? 'Administrateur' : 'Membre'}</span>
                    </div>
                    <div className="dropdown-links">
                      {session.role === 'admin' && (
                        <Link to="/admin" className="dropdown-item">
                          <Shield size={16} /> Panel Admin
                        </Link>
                      )}
                      <Link to="/profile" className="dropdown-item">
                        <Settings size={16} /> Mon Profil
                      </Link>
                      <button onClick={handleLogout} className="dropdown-item text-danger" style={{width: '100%', textAlign: 'left'}}>
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn-primary">
              <LogIn size={18} />
              Connexion
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
