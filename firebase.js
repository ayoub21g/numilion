// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD3MQOL_IdRNW7T8pNXQYTAHw4Cs2EiOZQ",
  authDomain: "numilion-cdb30.firebaseapp.com",
  databaseURL: "https://numilion-cdb30-default-rtdb.firebaseio.com",
  projectId: "numilion-cdb30",
  storageBucket: "numilion-cdb30.firebasestorage.app",
  messagingSenderId: "38594739742",
  appId: "1:38594739742:web:c622d37c554d8802afb80f"
};

// Init Firebase (compat SDK via CDN)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ── VISITES ──────────────────────────────────────────────
function trackVisit() {
  // Incrémenter visites totales
  db.ref('stats/visits').transaction(function(v) { return (v || 0) + 1; });

  // Présence en ligne
  var session = JSON.parse(localStorage.getItem('numilion_session') || 'null');
  var guestKey = localStorage.getItem('numilion_guest_key');
  if (!guestKey) {
    guestKey = 'guest_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('numilion_guest_key', guestKey);
  }
  var uid = session ? ('user_' + session.user) : guestKey;

  var presenceRef = db.ref('online/' + uid);
  presenceRef.set(true);
  presenceRef.onDisconnect().remove();

  // Écouter les stats en temps réel
  db.ref('stats/visits').on('value', function(snap) {
    var el = document.getElementById('count-visits');
    if (el) el.textContent = snap.val() || 0;
  });

  db.ref('online').on('value', function(snap) {
    var el = document.getElementById('count-online');
    if (el) el.textContent = snap.numChildren() || 0;
  });
}

// ── JEUX (lecture depuis Firebase) ───────────────────────
function loadGamesFromFirebase(callback) {
  db.ref('games').on('value', function(snap) {
    var games = [];
    snap.forEach(function(child) {
      var g = child.val();
      if (g && g.id) games.push(g);
    });
    callback(games);
  }, function(err) {
    console.error('Firebase read error:', err.message);
    callback([]);
  });
}

// ── JEUX (écriture depuis admin) ─────────────────────────
function saveGameToFirebase(game) {
  db.ref('games/' + game.id).set(game);
}

function deleteGameFromFirebase(id) {
  db.ref('games/' + id).remove();
}

function updateGameStatFirebase(id, field) {
  db.ref('games/' + id + '/' + field).transaction(function(v) { return (v || 0) + 1; });
}

// ── UTILISATEURS ─────────────────────────────────────────
function saveUserToFirebase(user) {
  db.ref('users/' + user.user).set({ user: user.user, pass: user.pass, avatar: user.avatar || null });
}

function getUserFromFirebase(username, callback) {
  db.ref('users/' + username).once('value', function(snap) {
    callback(snap.val());
  });
}

function countUsersFirebase(callback) {
  db.ref('users').once('value', function(snap) {
    callback(snap.numChildren());
  });
}

// ── ADMINS ───────────────────────────────────────────────
// Les admins sont gérés côté serveur via le Cloudflare Worker
// Les mots de passe ne sont jamais exposés côté client
