import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home';
import Game from './pages/Game';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Navbar from './components/Navbar';
import DynamicBackground from './components/DynamicBackground';

function DiscordPopup() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      background: '#5865F2',
      borderRadius: '16px',
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 8px 30px rgba(88,101,242,0.5)',
      animation: 'slideInUp 0.4s ease',
      maxWidth: '280px',
    }}>
      {/* Logo Discord */}
      <svg width="32" height="32" viewBox="0 0 71 55" fill="white" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}>
        <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a40.7 40.7 0 0 0-1.8 3.7 54.2 54.2 0 0 0-16.3 0A40.1 40.1 0 0 0 25.6.4 58.4 58.4 0 0 0 11 4.9C1.6 19.1-.9 33 .3 46.6a58.9 58.9 0 0 0 18 9.1 44.7 44.7 0 0 0 3.9-6.3 38.3 38.3 0 0 1-6.1-2.9l1.5-1.1a42 42 0 0 0 35.9 0l1.5 1.1a38.4 38.4 0 0 1-6.1 2.9 44.4 44.4 0 0 0 3.9 6.3 58.7 58.7 0 0 0 18-9.1C72 30.9 68.5 17.1 60.1 4.9ZM23.7 38.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 4-2.8 7.2-6.3 7.2Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.5 0 6.4 3.2 6.3 7.2 0 4-2.8 7.2-6.3 7.2Z"/>
      </svg>
      <div style={{flex:1}}>
        <div style={{color:'white',fontWeight:700,fontSize:'0.9rem',lineHeight:1.2}}>Rejoins notre Discord</div>
        <a
          href="https://discord.gg/e3PDj9CR4F"
          target="_blank"
          rel="noopener noreferrer"
          style={{color:'rgba(255,255,255,0.85)',fontSize:'0.78rem',textDecoration:'none',display:'block',marginTop:2}}
        >
          discord.gg/e3PDj9CR4F →
        </a>
      </div>
      {/* Bouton fermer */}
      <button
        onClick={() => setVisible(false)}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: '50%',
          width: '22px',
          height: '22px',
          cursor: 'pointer',
          color: 'white',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          lineHeight: 1,
        }}
        title="Fermer"
      >
        ✕
      </button>
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <Router>
      <DynamicBackground />
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game/:id" element={<Game />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
      <DiscordPopup />
    </Router>
  );
}

export default App;
