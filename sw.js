/* Service worker — Early warning dei Comuni (PWA installabile + offline).
   Strategia: network-first (dati sempre aggiornati), con fallback alla cache
   quando si è offline. La shell minima è pre-caricata all'installazione. */
const CORE = 'ewc-core-v2';
const RUNTIME = 'ewc-runtime-v2';
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
  './favicon-512.png'
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
        keys.filter((k) => k !== CORE && k !== RUNTIME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(RUNTIME).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
