const CACHE_NAME = 'meritz-ai-v43';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './apple-touch-icon.png',
  './app_icon_192.png',
  './app_icon_512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
