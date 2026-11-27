// IUSWDMP Field Survey - offline support
const V = 'fs-v1';
const SHELL = ['./','./index.html','./leaflet.js','./leaflet.css','./drains_varanasi.geojson','./ncpe.jpg','./icon-192.png','./manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== 'fs-tiles').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
async function trim(name, max){ const c = await caches.open(name); const ks = await c.keys(); for (let i = 0; i < ks.length - max; i++) await c.delete(ks[i]); }
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.hostname.endsWith('tile.openstreetmap.org')) {          // map tiles: keep the ones already seen, for use without signal
    e.respondWith(caches.open('fs-tiles').then(async c => {
      const hit = await c.match(e.request); if (hit) return hit;
      const r = await fetch(e.request); if (r.ok) { c.put(e.request, r.clone()); trim('fs-tiles', 1500); } return r;
    }));
    return;
  }
  if (u.origin === location.origin) {                           // app files: newest when online, saved copy when offline
    e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); } return r; })
      .catch(() => caches.match(e.request, {ignoreSearch:true}).then(r => r || caches.match('./index.html'))));
  }
});
