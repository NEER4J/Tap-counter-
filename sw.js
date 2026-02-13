const CACHE_NAME = 'taptrack-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  // If it's a navigation request (like opening a shortcut), return index.html
  // regardless of query parameters.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // Standard cache-first strategy for assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});