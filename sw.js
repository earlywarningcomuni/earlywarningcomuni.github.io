/* Service worker — Early warning dei Comuni (PWA installabile + offline).
   Strategia: network-first (dati sempre aggiornati), con fallback alla cache
   quando si è offline. La shell minima è pre-caricata all'installazione. */
const CORE = 'ewc-core-v3-territorio';
const RUNTIME = 'ewc-runtime-v3-territorio';
const CORE_ASSETS = [
  './',
  './index.html',
  './site.webmanifest',
  './logo_campana_mark.png',
  './logo_campana_crema.png',
  './favicon-16.png',
  './favicon-32.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './favicon-512.png',
  './territorio/territorio.css?v=20261117-territorio1',
  './territorio/territorio_core.js?v=20261117-territorio1',
  './territorio/territorio_ui.js?v=20261117-territorio1',
  './territorio/territorio_mappa.js?v=20261117-territorio1',
  './territorio/territorio_portale.js?v=20261117-territorio1',
  './territorio/indice.json',
  './territorio/confini_esterni_toscana.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CORE)
      .then((c) => c.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('ewc-') && k !== CORE && k !== RUNTIME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  const rete = fetch(req);
  e.waitUntil(rete.then((res) => {
    if (!res.ok) return;
    const copy = res.clone();
    return caches.open(RUNTIME).then((c) => c.put(req, copy));
  }).catch(() => {}));
  e.respondWith(rete.catch(async () => {
    const copia = await caches.match(req);
    if (copia) return copia;
    // La home è un ripiego per la navigazione, mai una risposta JSON o JS.
    if (req.mode === 'navigate') {
      const home = await caches.match('./index.html');
      if (home) return home;
    }
    return Response.error();
  }));
});
