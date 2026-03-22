export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '*';

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ── STEAM SEARCH ─────────────────────────────────────
    const steamSearch = url.searchParams.get('steam_search');
    if (steamSearch) {
      try {
        // 1. Chercher le jeu sur Steam
        const searchRes = await fetch(
          'https://store.steampowered.com/api/storesearch/?term=' + encodeURIComponent(steamSearch) + '&l=french&cc=FR'
        );
        const searchData = await searchRes.json();

        if (!searchData.items || searchData.items.length === 0) {
          return new Response(JSON.stringify({ appid: null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const game = searchData.items[0];
        const appid = game.id;
        const cover = 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + appid + '/library_600x900.jpg';

        // 2. Récupérer la description courte
        let desc = '';
        try {
          const detailRes = await fetch(
            'https://store.steampowered.com/api/appdetails?appids=' + appid + '&l=french&cc=FR'
          );
          const detailData = await detailRes.json();
          const d = detailData[appid] && detailData[appid].data;
          if (d && d.short_description) {
            desc = d.short_description.replace(/<[^>]+>/g, '').replace(/[™®]/g, '').trim().split(/\s+/).slice(0, 8).join(' ');
          }
        } catch (e) {}

        return new Response(JSON.stringify({ appid, cover, desc }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (e) {
        return new Response(JSON.stringify({ appid: null, error: e.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
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
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    return new Response('Numilion Worker', { headers: corsHeaders });
  }
};
