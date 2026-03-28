export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    // ── ADMIN LOGIN (sécurisé côté serveur) ──────────────
    if (url.searchParams.get('admin_login')) {
      try {
        const body = await request.json();
        const { user, pass } = body;
        if (!user || !pass) return json({ ok: false, error: 'Champs manquants' }, 400);

        // Lire depuis Firebase avec le secret (jamais exposé au client)
        const fbSecret = env.FIREBASE_SECRET;
        const fbUrl = `https://numilion-cdb30-default-rtdb.firebaseio.com/admins/${encodeURIComponent(user)}.json?auth=${fbSecret}`;
        const res = await fetch(fbUrl);
        const admin = await res.json();

        if (!admin || admin.pass !== pass) {
          return json({ ok: false, error: 'Identifiants incorrects' });
        }
        // Retourner les infos sans le mot de passe
        return json({ ok: true, user: admin.user, avatar: admin.avatar || null });
      } catch (e) {
        return json({ ok: false, error: e.message }, 500);
      }
    }

    // ── ADMIN UPDATE PROFILE ─────────────────────────────
    if (url.searchParams.get('admin_update')) {
      try {
        const body = await request.json();
        const { currentUser, newUser, newPass, avatar, currentPass } = body;
        if (!currentUser || !currentPass) return json({ ok: false, error: 'Non autorisé' }, 401);

        const fbSecret = env.FIREBASE_SECRET;

        // Vérifier le mot de passe actuel
        const checkRes = await fetch(`https://numilion-cdb30-default-rtdb.firebaseio.com/admins/${encodeURIComponent(currentUser)}.json?auth=${fbSecret}`);
        const existing = await checkRes.json();
        if (!existing || existing.pass !== currentPass) return json({ ok: false, error: 'Mot de passe actuel incorrect' });

        const updates = {};
        if (newPass) updates.pass = newPass;
        if (avatar) updates.avatar = avatar;

        const targetUser = newUser || currentUser;

        if (newUser && newUser !== currentUser) {
          // Créer nouveau nœud, supprimer l'ancien
          const merged = { ...existing, ...updates, user: newUser };
          await fetch(`https://numilion-cdb30-default-rtdb.firebaseio.com/admins/${encodeURIComponent(newUser)}.json?auth=${fbSecret}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(merged)
          });
          await fetch(`https://numilion-cdb30-default-rtdb.firebaseio.com/admins/${encodeURIComponent(currentUser)}.json?auth=${fbSecret}`, {
            method: 'DELETE'
          });
        } else if (Object.keys(updates).length > 0) {
          await fetch(`https://numilion-cdb30-default-rtdb.firebaseio.com/admins/${encodeURIComponent(currentUser)}.json?auth=${fbSecret}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates)
          });
        }

        return json({ ok: true, user: targetUser });
      } catch (e) {
        return json({ ok: false, error: e.message }, 500);
      }
    }

    // ── STEAM SEARCH ─────────────────────────────────────
    const steamSearch = url.searchParams.get('steam_search');
    if (steamSearch) {
      try {
        const searchRes = await fetch(
          'https://store.steampowered.com/api/storesearch/?term=' + encodeURIComponent(steamSearch) + '&l=french&cc=FR'
        );
        const searchData = await searchRes.json();

        if (!searchData.items || searchData.items.length === 0) {
          return json({ appid: null });
        }

        const game = searchData.items[0];
        const appid = game.id;
        const cover = 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + appid + '/library_600x900.jpg';

        let desc = '';
        try {
          const detailRes = await fetch(
            'https://store.steampowered.com/api/appdetails?appids=' + appid + '&l=french&cc=FR'
          );
          const detailData = await detailRes.json();
          const d = detailData[appid] && detailData[appid].data;
          if (d) {
            const keywords = [];
            if (d.genres) d.genres.slice(0, 3).forEach(g => keywords.push(g.description));
            if (d.categories) {
              const cats = d.categories.map(c => c.description).filter(c =>
                /solo|multi|co.op|coop|joueur|player/i.test(c)
              ).slice(0, 2);
              cats.forEach(c => keywords.push(c));
            }
            if (keywords.length > 0) {
              desc = keywords.slice(0, 5).join(', ');
            } else if (d.short_description) {
              desc = d.short_description.replace(/<[^>]+>/g, '').replace(/[™®]/g, '').trim().split(/\s+/).slice(0, 6).join(' ');
            }
          }
        } catch (e) {}

        return json({ appid, cover, desc });
      } catch (e) {
        return json({ appid: null, error: e.message });
      }
    }

    // ── LOCKR PROXY ──────────────────────────────────────
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        const res = await fetch('https://lockr.so/api/v1/lockers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 126a1814019ec3ee3fe553d37ff0fee9719cbaf0c92de495ba92f39eae98543'
          },
          body: JSON.stringify({ title: body.title, target: body.target })
        });
        const data = await res.json();
        return json(data);
      } catch (e) {
        return json({ error: e.message });
      }
    }

    return new Response('Numilion Worker', { headers: corsHeaders });
  }
};
