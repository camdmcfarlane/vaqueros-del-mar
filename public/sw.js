// AquaOps service worker
// Cache-first for app shell, pass-through for Supabase API
const CACHE = 'aquaops-v3'; // bump version to force update on all devices

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(['/']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache Supabase or non-http requests
  if (url.hostname.includes('supabase.co') || !url.protocol.startsWith('http')) return;

  if (request.mode === 'navigate') {
    // Stale-while-revalidate: serve cache instantly, update in background
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match('/').then(cached => {
          const networkFetch = fetch(request).then(res => {
            cache.put(request, res.clone());
            return res;
          }).catch(() => null);
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // Static assets: cache first, fill from network
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return res;
      });
    })
  );
});
