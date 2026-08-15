/**
 * Cosmic APOD V3 Service Worker.
 * Caches application shell and handles offline fallbacks.
 */

const CACHE_NAME = 'cosmic-apod-shell-v3';
const API_CACHE_NAME = 'cosmic-apod-api-v3';
const MEDIA_CACHE_NAME = 'cosmic-apod-media-v3';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
  // Vite injects the hashed assets automatically in prod,
  // but caching '/' gives us the entry point.
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (![CACHE_NAME, API_CACHE_NAME, MEDIA_CACHE_NAME].includes(key)) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. API Requests: Network First, fallback to cache
  if (url.hostname === 'api.nasa.gov') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Don't cache 403 or 429
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 2. NASA Media (Images): Stale-While-Revalidate to save massive bandwidth
  if (url.hostname.includes('nasa.gov') && url.pathname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(MEDIA_CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        }).catch(() => null); // Fail silently if offline

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Local Assets & App Shell: Cache First, fallback to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      
      return fetch(event.request).then((response) => {
        // Cache dynamic vite assets lazily
        if (response.ok && url.hostname === self.location.hostname && !url.pathname.startsWith('/api')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // If HTML navigation fails offline, return root index.html to allow SPA routing to handle it
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('', { status: 404, statusText: 'Offline' });
      });
    })
  );
});
