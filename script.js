// ─── PARTICULES ──────────────────────────────────────────
(function spawnParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const colors = ['#e94560','#a855f7','#6c63ff','#3b82f6'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 6 + 3;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${Math.random()*14+8}s;
      animation-delay:${Math.random()*10}s;
    `;
    container.appendChild(p);
  }
})();

// ─── JEUX CUSTOM (ajoutés via admin) ─────────────────────
function loadCustomGames() {
  const games = JSON.parse(localStorage.getItem('numilion_games') || '[]');
  const grid    = document.getElementById('custom-games-grid');
  const newGrid = document.getElementById('nouveautes-grid');

  const cardHTML = (g) => `
    <div class="game-card" onclick="window.open('${g.dl || '#'}', '_blank')">
      <div class="game-icon">
        ${g.img ? `<img src="${g.img}" alt="${g.name}" style="width:64px;height:64px;object-fit:cover;border-radius:8px" onerror="this.outerHTML='🎮'"/>` : '🎮'}
      </div>
      <h2>${g.name}</h2>
      <p>${g.desc || 'Clique pour jouer'}</p>
      <button>⬇️ Télécharger</button>
    </div>`;

  // Tous les jeux
  if (games.length) {
    grid.innerHTML = games.map(cardHTML).join('');
  }

  // Nouveautés = jeux ajoutés dans les 7 derniers jours
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = games.filter(g => g.id >= sevenDaysAgo);
  if (recent.length) {
    newGrid.innerHTML = recent.map(cardHTML).join('');
  }
}

document.addEventListener('DOMContentLoaded', loadCustomGames);
