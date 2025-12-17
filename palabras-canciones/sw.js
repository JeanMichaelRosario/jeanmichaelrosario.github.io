const CACHE_NAME = "palabras-canciones-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./words.js",
  "./app.js",
  "./manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(ASSETS);
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))));
      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request, { ignoreSearch: true });
      if (cached) return cached;

      try {
        const fresh = await fetch(event.request);
        if (fresh && fresh.ok) cache.put(event.request, fresh.clone());
        return fresh;
      } catch {
        return (await cache.match("./index.html")) || Response.error();
      }
    })()
  );
});
