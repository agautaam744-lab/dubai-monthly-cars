// Basic Service Worker for PWA Installability
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Basic fetch handler (cache-first can be added later)
  event.respondWith(fetch(event.request));
});