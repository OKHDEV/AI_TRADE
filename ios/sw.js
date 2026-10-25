const CACHE_NAME = 'meritz-ai-v44-live';
const ASSETS_TO_CACHE = [
  './manifest.json',
  './apple-touch-icon.png',
  './app_icon_192.png',
  './app_icon_512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// NETWORK-FIRST for HTML / Documents: Always fetch fresh code from server!
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate' || e.request.destination === 'document' || e.request.url.includes('index.html')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
