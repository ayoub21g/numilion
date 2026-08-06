import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import { ArrowLeft, Download, ShieldAlert, AlertTriangle, Monitor, Cpu, HardDrive, MemoryStick, AppWindow, Film, Zap, Laptop } from 'lucide-react';
import './Game.css';

const YT_KEY = 'AIzaSyBil82PzQVZctvV5mgolWNxvknExLrJeYI';

function getSpecs(name, desc) {
  const t = (name + ' ' + (desc || '')).toLowerCase();
  const isLight = /minecraft|terraria|stardew|among|roblox|2d|pixel|indie/.test(t);
  const isHeavy = /gta|cyberpunk|witcher|battlefield|call of duty|cod|warzone|elden|hogwarts|star wars|assassin|far cry|red dead/.test(t);
  const isMid   = /fortnite|valorant|apex|overwatch|league|csgo|cs2|pubg/.test(t);
  if (isLight) return { cpu:['Dual-core 2.0 GHz','Intel i3 / Ryzen 3'], gpu:['Intel HD 4000','GTX 1050 / RX 560'], ram:['4 Go','8 Go'], storage:['5 Go HDD','10 Go SSD'], os:['Windows 7 64-bit','Windows 10 64-bit'] };
  if (isHeavy) return { cpu:['Intel i5-8600K / Ryzen 5 3600','Intel i7-10700K / Ryzen 7 5800X'], gpu:['GTX 1060 6Go / RX 580','RTX 3070 / RX 6700 XT'], ram:['8 Go DDR4','16 Go DDR4'], storage:['70 Go HDD','100 Go NVMe SSD'], os:['Windows 10 64-bit','Windows 11 64-bit'] };
  if (isMid)   return { cpu:['Intel i3-9100 / Ryzen 3 3300X','Intel i5-10400 / Ryzen 5 5600'], gpu:['GTX 1050 Ti / RX 570','GTX 1660 Super / RX 5600 XT'], ram:['8 Go DDR4','16 Go DDR4'], storage:['30 Go HDD','50 Go SSD'], os:['Windows 10 64-bit','Windows 10 64-bit'] };
  return { cpu:['Intel i3-8100 / Ryzen 3 2200G','Intel i5-9600K / Ryzen 5 3600'], gpu:['GTX 1050 Ti / RX 570','GTX 1660 / RX 5500 XT'], ram:['8 Go DDR4','12 Go DDR4'], storage:['30 Go HDD','50 Go SSD'], os:['Windows 8.1 64-bit','Windows 10 64-bit'] };
}

function ytId(v) {
  if (!v) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
  const m = v.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function VideoSection({ gameName, trailer, gameplay }) {
  const [trailerId, setTrailerId] = useState(ytId(trailer));
  const [gameplayId, setGameplayId] = useState(ytId(gameplay));

  useEffect(() => {
    if (!trailerId) {
      fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&videoEmbeddable=true&q=${encodeURIComponent(gameName + ' official trailer')}&key=${YT_KEY}`)
        .then(r => r.json()).then(d => { if (d.items?.[0]) setTrailerId(d.items[0].id.videoId); }).catch(() => {});
    }
    if (!gameplayId) {
      fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&videoEmbeddable=true&q=${encodeURIComponent(gameName + ' gameplay PC')}&key=${YT_KEY}`)
        .then(r => r.json()).then(d => { if (d.items?.[0]) setGameplayId(d.items[0].id.videoId); }).catch(() => {});
    }
  }, [gameName]);

  return (
    <div className="game-videos-section">
      <h3 className="specs-title"><Film size={18}/> Vidéos</h3>
      <div className="videos-grid">
        <div>
          <div className="video-label">Bande annonce</div>
          <div className="video-wrap">
            {trailerId
              ? <iframe src={`https://www.youtube-nocookie.com/embed/${trailerId}?rel=0`} allowFullScreen loading="lazy" title="Trailer"/>
              : <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(gameName + ' trailer')}`} target="_blank" rel="noopener" className="video-yt-link">▶ Voir sur YouTube</a>}
          </div>
        </div>
        <div>
          <div className="video-label">Gameplay</div>
          <div className="video-wrap">
            {gameplayId
              ? <iframe src={`https://www.youtube-nocookie.com/embed/${gameplayId}?rel=0`} allowFullScreen loading="lazy" title="Gameplay"/>
              : <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(gameName + ' gameplay')}`} target="_blank" rel="noopener" className="video-yt-link">▶ Voir sur YouTube</a>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecsSection({ name, desc }) {
  const specs = getSpecs(name, desc);
  const items = [
    { icon: <Monitor size={20}/>, label: 'Processeur', min: specs.cpu[0], rec: specs.cpu[1] },
    { icon: <Cpu size={20}/>, label: 'Carte graphique', min: specs.gpu[0], rec: specs.gpu[1] },
    { icon: <MemoryStick size={20}/>, label: 'RAM', min: specs.ram[0], rec: specs.ram[1] },
    { icon: <HardDrive size={20}/>, label: 'Stockage', min: specs.storage[0], rec: specs.storage[1] },
    { icon: <AppWindow size={20}/>, label: 'Système', min: specs.os[0], rec: specs.os[1] },
  ];
  return (
    <div className="specs-section">
      <div className="specs-block">
        <h3 className="specs-title"><Laptop size={18}/> Composants minimaux</h3>
        <div className="specs-grid">
          {items.map(s => (
            <div key={s.label} className="spec-card">
              <div className="spec-icon">{s.icon}</div>
              <div className="spec-label">{s.label}</div>
              <div className="spec-value">{s.min}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="specs-block">
        <h3 className="specs-title"><Zap size={18}/> Composants recommandés</h3>
        <div className="specs-grid">
          {items.map(s => (
            <div key={s.label} className="spec-card">
              <div className="spec-icon">{s.icon}</div>
              <div className="spec-label">{s.label}</div>
              <div className="spec-value">{s.rec}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const Game = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const s = localStorage.getItem('numilion_session');
    if (s) setSession(JSON.parse(s));
  }, []);

  useEffect(() => {
    if (!id) return;
    const gameRef = ref(db, `games/${id}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      setGame(snapshot.val());
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div className="game-loading animate-fade-in">
        <div className="spinner"></div>
        <p>Chargement du jeu...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="game-not-found animate-fade-in glass-panel">
        <AlertTriangle size={48} className="text-danger" />
        <h2>Jeu introuvable</h2>
        <p>Ce jeu n'existe pas ou a été supprimé.</p>
        <button className="btn-ghost" onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
    );
  }

  const handleDownload = (e) => {
    if (!session) {
      e.preventDefault();
      // Emitting custom event if we want a global modal, or just redirect
      window.dispatchEvent(new CustomEvent('showLoginModal'));
      navigate('/login?redirect=/game/' + id);
    }
  };

  return (
    <div className="game-details-wrapper animate-fade-in">
      {/* Blurred Backdrop */}
      {game.img && (
        <div className="game-backdrop">
          <img src={game.img} alt="Background" />
        </div>
      )}

      <button className="back-btn btn-ghost" onClick={() => navigate('/')}>
        <ArrowLeft size={20} /> Retour
      </button>

      <div className="game-content-card glass-panel">
        <div className="game-layout">
          <div className="game-poster-container">
            {game.img ? (
              <img src={game.img} alt={game.name} className="game-poster" />
            ) : (
              <div className="game-poster-placeholder">
                <ShieldAlert size={64} />
              </div>
            )}
          </div>
          
          <div className="game-info">
            <h1 className="game-title text-gradient">{game.name}</h1>
            <div className="game-meta">
              <span className="game-category">{game.category || 'Action'}</span>
              <span className="game-size">{game.size || 'N/A'} GB</span>
            </div>
            
            <div className="game-description">
              <h3>À propos du jeu</h3>
              <p>{game.desc || "Aucune description disponible."}</p>
            </div>

            <div className="game-actions">
              {game.dl ? (
                <a 
                  href={game.dl} 
                  target={session ? "_blank" : "_self"} 
                  rel="noopener noreferrer" 
                  className="btn-primary dl-btn-large"
                  onClick={handleDownload}
                >
                  <Download size={24} />
                  <span>
                    <strong>Télécharger maintenant</strong>
                    <small>{session ? 'Fichier direct' : 'Connexion requise'}</small>
                  </span>
                </a>
              ) : (
                <div className="btn-ghost" style={{opacity: 0.5, cursor: 'not-allowed'}}>
                  Lien non disponible
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <VideoSection gameName={game.name} trailer={game.trailer} gameplay={game.gameplay} />
      <SpecsSection name={game.name} desc={game.desc} />
    </div>
  );
};

export default Game;
