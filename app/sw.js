/* global self, caches, fetch, URL, Response */
// Service worker of the web (PWA) build. Written by hand, no Workbox.
// vite.web.config.ts fills in the version and the file list at build time.
//
// - Install: download every file of this build, so the app opens offline right away.
// - Pages: network first (picks up a new version), cached index.html when offline.
// - Other files of this site: cache first (Vite file names contain a content hash).
//   ignoreVary: module scripts are requested with an Origin header, the precache without.
// - Other sites (config.json, Apps Script, Google sign-in): never touched.

const VERSION = '1.0.6-mwi0porh'
const CACHE = `srs-vocab-pro-${VERSION}`
const PRECACHE = [
  "./",
  "./assets/index-CZEPLAdl.js",
  "./assets/xlsx-DR4W_luh.js",
  "./assets/index-BuEGMlo4.css",
  "./manifest.webmanifest",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('srs-vocab-pro-') && key !== CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            void caches.open(CACHE).then((cache) => cache.put('./', copy))
          }
          return response
        })
        .catch(() =>
          caches
            .match('./', { cacheName: CACHE, ignoreVary: true })
            .then((cached) => cached || new Response('Offline', { status: 503 }))
        )
    )
    return
  }

  event.respondWith(
    caches.match(request, { cacheName: CACHE, ignoreVary: true }).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone()
            void caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        })
    )
  )
})
