const CACHE_NAME = 'planeadoc-cache-v2'
const APP_SHELL = ['/', '/index.html', '/offline.html', '/favicon.svg', '/pwa-icon.svg', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const requestUrl = new URL(request.url)

  if (request.method !== 'GET') return
  if (requestUrl.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', responseClone))
          return response
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || caches.match('/offline.html'))),
    )
    return
  }

  if (!isCacheableAsset(request)) return

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse

      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) return networkResponse

          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          return networkResponse
        })
        .catch(() => caches.match(request))
    }),
  )
})

function isCacheableAsset(request) {
  return ['script', 'style', 'image', 'font', 'manifest'].includes(request.destination)
}
