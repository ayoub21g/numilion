// ─── PARTICULES ──────────────────────────────────────────
(function spawnParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const colors = ['#e94560','#a855f7','#6c63ff','#3b82f6'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 6 + 3;
    p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${Math.random()*14+8}s;animation-delay:${Math.random()*10}s;`;
    container.appendChild(p);
  }
})();

// ─── RECHERCHE ───────────────────────────────────────────
function filterGames(query) {
  var q = query.toLowerCase();
  document.querySelectorAll('#custom-games-grid .game-card').forEach(function(card) {
    var h2 = card.querySelector('h2');
    var name = h2 ? h2.textContent.toLowerCase() : '';
    card.style.display = name.includes(q) ? '' : 'none';
  });
}
