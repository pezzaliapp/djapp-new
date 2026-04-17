/**
 * djApp Service Worker
 *
 * Strategia:
 * - Install: mette in cache tutti gli asset del build
 * - Fetch: Cache First (offline-first per gli asset statici)
 * - Update: controlla nuova versione ad ogni avvio,
 *   notifica l'utente e skippa il waiting automaticamente
 */

const APP_VERSION = 'djapp-v1.7.5'
const CACHE_NAME = `${APP_VERSION}`

// Asset da pre-cachare (vengono aggiornati ad ogni build)
const PRECACHE_URLS = [
  './',
  './index.html',
]

// ── Install ───────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log('[SW] Installing', CACHE_NAME)
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    }).then(() => {
      return self.skipWaiting()
    })
  )
})

// ── Activate ──────────────────────────────────────────

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating', CACHE_NAME)
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key)
            return caches.delete(key)
          })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// ── Fetch ─────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  // Solo richieste GET
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // ── ESCLUDI: blob: URL (file audio locali, objectURL)
  // Il SW NON deve mai intercettare blob: URL — Chrome li gestisce internamente
  if (url.protocol === 'blob:') return

  // ── ESCLUDI: richieste audio (per destination o estensione)
  // Lascia che Chrome gestisca direttamente l'audio senza passare dalla cache SW
  if (
    event.request.destination === 'audio' ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.wav') ||
    url.pathname.endsWith('.aac') ||
    url.pathname.endsWith('.m4a') ||
    url.pathname.endsWith('.flac') ||
    url.pathname.endsWith('.ogg') ||
    url.pathname.endsWith('.aiff')
  ) {
    return // Lascia gestire al browser nativamente
  }

  // ── ESCLUDI: chrome-extension e altre origini non-http
  if (!url.protocol.startsWith('http')) return

  // Per le richieste di navigazione (HTML): Network First
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
        .catch(() => caches.match('./index.html'))
    )
    return
  }

  // Per gli asset statici (JS, CSS): Cache First
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response
        }
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return response
      })
    })
  )
})

// ── Messaggio dal client ──────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
