// DMC service worker: app-shell offline cache.
//
// Privacy rule: only PUBLIC pages and static assets are cached. Authenticated
// pages (/dashboard, /bookings, /payments, /admin, ...) are always served from
// the network so account data is never written to the shared cache.
const CACHE = 'dmc-v2'
const CORE = ['/', '/cars', '/how-it-works', '/manifest.json', '/icon-192.png']
const PUBLIC_PATHS = new Set(['/', '/cars', '/how-it-works', '/login'])

function isCacheable(request) {
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return false
  if (url.pathname.startsWith('/api/')) return false
  if (url.href.includes('supabase')) return false
  if (request.mode === 'navigate') {
    return PUBLIC_PATHS.has(url.pathname)
  }
  // Static assets (JS/CSS/images/fonts) are safe to cache.
  return (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !isCacheable(request)) return
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
