import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import GameCard from '../components/GameCard';
import { Search, MonitorPlay, Gamepad2, ShieldAlert } from 'lucide-react';
import './Home.css';

const CATEGORIES = [
  { id: 'tous', label: 'Tous', icon: MonitorPlay },
  { id: 'action', label: 'Action', icon: Gamepad2 },
  { id: 'fps', label: 'FPS', icon: ShieldAlert }
  // To avoid clutter, we show a subset or a smooth scrollable list
];

const Home = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('tous');

  // Load session
  useEffect(() => {
    const s = localStorage.getItem('numilion_session');
    if (s) setSession(JSON.parse(s));
  }, []);

  // Fetch games from Firebase
  useEffect(() => {
    const gamesRef = ref(db, 'games');
    const unsubscribe = onValue(gamesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const gamesList = Object.values(data);
        setGames(gamesList);
      } else {
        setGames([]);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Filter games
  const filteredGames = games.filter(game => {
    const matchesSearch = game.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.desc?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Auto-category detection (simplified version of legacy logic)
    const detectCategory = (g) => {
      const txt = `${g.name} ${g.desc}`.toLowerCase();
      if (/fps|shooter|call of duty|valorant|csgo|battlefield/.test(txt)) return 'fps';
      if (/action/.test(txt)) return 'action';
      return 'action'; // fallback
    };
    
    const cat = game.category || detectCategory(game);
    const matchesCategory = activeCategory === 'tous' || cat === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="home-container animate-fade-in">
      
      {/* Hero Section with Cinematic Aura */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Découvrez une <span className="text-gradient">Bibliothèque Infinie</span>
          </h1>
          <p className="hero-subtitle">
            Téléchargez les meilleurs jeux gratuitement et plongez dans des univers extraordinaires.
          </p>
        </div>
        <div className="hero-aura"></div>
      </section>

      {/* Floating Dock for Search and Filters */}
      <section className="floating-dock glass-panel">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Rechercher un jeu..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="categories-wrapper">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button 
                key={cat.id}
                className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <Icon size={16} />
                {cat.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Games Grid */}
      <section className="games-section">
        <div className="section-header">
          <h2>
            <Gamepad2 size={24} className="icon-gradient" />
            Tous les jeux
          </h2>
          <div className="games-count">{filteredGames.length} jeux trouvés</div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement des jeux...</p>
          </div>
        ) : filteredGames.length > 0 ? (
          <div className="games-grid">
            {filteredGames.map(game => (
              <GameCard key={game.id} game={game} session={session} />
            ))}
          </div>
        ) : (
          <div className="empty-state glass-panel">
            <Gamepad2 size={48} className="empty-icon text-muted" />
            <h3>Aucun jeu trouvé</h3>
            <p>Essayez de modifier vos filtres ou votre recherche.</p>
          </div>
        )}
      </section>
      
    </div>
  );
};

export default Home;
