import React from 'react';
import { Link } from 'react-router-dom';
import { Download, Gamepad2 } from 'lucide-react';
import './GameCard.css';

const GameCard = ({ game, session }) => {
  const needsLogin = game.dl && !session;
  
  const handleDownloadClick = (e) => {
    if (needsLogin) {
      e.preventDefault();
      // Emitting an event or utilizing context to show login modal would be placed here
      // For now, let's just alert (or redirect to login)
      window.dispatchEvent(new CustomEvent('showLoginModal'));
    }
  };

  return (
    <Link to={`/game/${game.id}`} className="game-card glass-panel">
      <div className="game-card-image">
        {game.img ? (
          <img src={game.img} alt={game.name} />
        ) : (
          <div className="game-card-placeholder">
            <Gamepad2 size={48} />
          </div>
        )}
      </div>
      
      <div className="game-card-content">
        <h3 className="game-card-title">{game.name}</h3>
        {game.desc && <p className="game-card-desc">{game.desc}</p>}
        
        {game.dl && (
          <div className="game-card-footer">
            <a 
              href={needsLogin ? '/login' : game.dl} 
              className="btn-download"
              onClick={handleDownloadClick}
              target={!needsLogin ? '_blank' : '_self'}
              rel="noopener noreferrer"
            >
              <Download size={16} />
              Télécharger
            </a>
          </div>
        )}
      </div>
    </Link>
  );
};

export default GameCard;
