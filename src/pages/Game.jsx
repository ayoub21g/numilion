import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import { ArrowLeft, Download, ShieldAlert, AlertTriangle } from 'lucide-react';
import './Game.css';

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
    </div>
  );
};

export default Game;
