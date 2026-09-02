const CACHE_NAME = 'musician-gym-v4'

const coreAssets = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './piano.base64.js'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(coreAssets))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('musician-gym-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone()
          void caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
          return response
        })
        .catch(async () => {
          return (await caches.match(request)) || caches.match('./')
        })
    )
    return
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached

      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone()
          void caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
        }
        return response
      })
    })
  )
})
