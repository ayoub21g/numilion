import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, get, remove, runTransaction } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyD3MQOL_IdRNW7T8pNXQYTAHw4Cs2EiOZQ",
  authDomain: "numilion-cdb30.firebaseapp.com",
  databaseURL: "https://numilion-cdb30-default-rtdb.firebaseio.com",
  projectId: "numilion-cdb30",
  storageBucket: "numilion-cdb30.firebasestorage.app",
  messagingSenderId: "38594739742",
  appId: "1:38594739742:web:c622d37c554d8802afb80f"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Helper for visits (Ported from legacy)
export const trackVisitRealtime = (updateVisitsCb, updateOnlineCb) => {
  // Increments visits overall
  const visitsRef = ref(db, 'stats/visits');
  runTransaction(visitsRef, (currentData) => {
    return (currentData || 0) + 1;
  });

  const session = JSON.parse(localStorage.getItem('numilion_session') || 'null');
  let guestKey = localStorage.getItem('numilion_guest_key');
  if (!guestKey) {
    guestKey = 'guest_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('numilion_guest_key', guestKey);
  }
  const uid = session ? ('user_' + session.user) : guestKey;
  
  // Handled somewhat manually since onDisconnect is tricky with the modular SDK
  // We will just mark online and query it for now.
  const presenceRef = ref(db, 'online/' + uid);
  set(presenceRef, true);
  
  const onlineRef = ref(db, 'online');
  onValue(visitsRef, (snapshot) => {
    updateVisitsCb(snapshot.val() || 0);
  });
  
  onValue(onlineRef, (snapshot) => {
    updateOnlineCb(snapshot.size || 0);
  });
};
