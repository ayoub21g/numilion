import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import GameCard from '../components/GameCard';
import { Search, MonitorPlay, Gamepad2, ShieldAlert, Sword, Map, Trophy, Zap, Skull, Building2, Brain, Palette, Wand2 } from 'lucide-react';
import './Home.css';

const CATEGORIES = [
  { id: 'tous',       label: 'Tous',        icon: MonitorPlay },
  { id: 'action',     label: 'Action',      icon: Sword },
  { id: 'fps',        label: 'FPS',         icon: ShieldAlert },
  { id: 'rpg',        label: 'RPG',         icon: Wand2 },
  { id: 'aventure',   label: 'Aventure',    icon: Map },
  { id: 'sport',      label: 'Sport',       icon: Trophy },
  { id: 'course',     label: 'Course',      icon: Zap },
  { id: 'horreur',    label: 'Horreur',     icon: Skull },
  { id: 'simulation', label: 'Simulation',  icon: Building2 },
  { id: 'strategie',  label: 'Stratégie',   icon: Brain },
  { id: 'indie',      label: 'Indie',       icon: Palette },
];

function autoCategory(name, desc) {
  const t = `${name} ${desc || ''}`.toLowerCase();
  if (/call of duty|cod |counter.strike|csgo|cs2|valorant|battlefield|warzone|apex|overwatch|rainbow six|titanfall|doom|far cry|borderlands|payday|pubg|fps|shooter/.test(t)) return 'fps';
  if (/resident evil|silent hill|outlast|amnesia|dead space|phasmophobia|little nightmares|dying light|dead by daylight|horror|horreur|scary/.test(t)) return 'horreur';
  if (/witcher|elden ring|skyrim|fallout|dragon age|mass effect|cyberpunk|persona|final fantasy|dragon ball|dark souls|sekiro|monster hunter|diablo|rpg|role playing/.test(t)) return 'rpg';
  if (/fifa|ea fc|nba 2k|efootball|madden|motogp|f1 \d|formula 1|basketball|football manager|sport/.test(t)) return 'sport';
  if (/forza|need for speed|nfs |gran turismo|assetto corsa|wreckfest|trackmania|racing|karting|the crew/.test(t)) return 'course';
  if (/farming simulator|euro truck|flight simulator|cities.skylines|planet coaster|prison architect|rimworld|stardew valley|simulator|tycoon/.test(t)) return 'simulation';
  if (/civilization|age of empires|starcraft|warcraft|total war|hearts of iron|crusader kings|stellaris|xcom|frostpunk|strateg/.test(t)) return 'strategie';
  if (/hollow knight|celeste|cuphead|undertale|hades|dead cells|binding of isaac|slay the spire|among us|fall guys|terraria|minecraft|roblox|indie|pixel/.test(t)) return 'indie';
  if (/zelda|uncharted|tomb raider|horizon|god of war|spider.man|batman arkham|red dead|grand theft auto|gta |assassin.s creed|adventure|aventure/.test(t)) return 'aventure';
  return 'action';
}

const Home = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('tous');
  const [currentPage, setCurrentPage] = useState(1);
  const GAMES_PER_PAGE = 20;

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
    
    // Auto-category detection
    const cat = game.category || autoCategory(game.name, game.desc);
    const matchesCategory = activeCategory === 'tous' || cat === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE);
  const paginatedGames = filteredGames.slice(
    (currentPage - 1) * GAMES_PER_PAGE,
    currentPage * GAMES_PER_PAGE
  );

  // Reset page when search or category changes
  const handleSearch = (val) => { setSearchQuery(val); setCurrentPage(1); };
  const handleCategory = (id) => { setActiveCategory(id); setCurrentPage(1); };

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
            onChange={(e) => handleSearch(e.target.value)}
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
                onClick={() => handleCategory(cat.id)}
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
          <div className="games-count">
            {filteredGames.length > GAMES_PER_PAGE
              ? `${(currentPage - 1) * GAMES_PER_PAGE + 1}–${Math.min(currentPage * GAMES_PER_PAGE, filteredGames.length)} sur ${filteredGames.length} jeux`
              : `${filteredGames.length} jeux trouvés`}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement des jeux...</p>
          </div>
        ) : filteredGames.length > 0 ? (
          <>
            <div className="games-grid">
              {paginatedGames.map(game => (
                <GameCard key={game.id} game={game} session={session} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Afficher : 1, ..., page-1, page, page+1, ..., dernière
                  const show =
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1;
                  if (!show) {
                    // Afficher "..." une seule fois entre les groupes
                    const prevShow =
                      page - 1 === 1 ||
                      page - 1 === totalPages ||
                      Math.abs(page - 1 - currentPage) <= 1;
                    if (!prevShow) return null;
                    return <span key={`dots-${page}`} className="page-dots">…</span>;
                  }
                  return (
                    <button
                      key={page}
                      className={`page-btn ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  className="page-btn"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  ›
                </button>
              </div>
            )}
          </>
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
