/**
 * djApp Service Worker v1.7.5
 * Fix: escludi blob: e audio da intercettazione SW
 */

const APP_VERSION = 'djapp-v1.7.5'
const CACHE_NAME = `${APP_VERSION}`

const PRECACHE_URLS = ['./', './index.html']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  if (url.protocol === 'blob:') return

  if (
    event.request.destination === 'audio' ||
    /\.(mp3|wav|aac|m4a|flac|ogg|aiff)$/i.test(url.pathname)
  ) return

  if (!url.protocol.startsWith('http')) return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((r) => { caches.open(CACHE_NAME).then((c) => c.put(event.request, r.clone())); return r })
        .catch(() => caches.match('./index.html'))
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((r) => {
        if (!r || r.status !== 200 || r.type === 'opaque') return r
        caches.open(CACHE_NAME).then((c) => c.put(event.request, r.clone()))
        return r
      })
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
