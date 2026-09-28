/* Tinta Blu · service worker
   Guarda la "cáscara" de la app para que abra rápido y muestre algo sin conexión.
   Nunca guarda datos de Supabase: esos siempre van directo a la red. */
const CACHE = "tinta-blu-v2";
const BASE = ["/", "/privacidad", "/terminos", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // Supabase, fuentes y librerías: directo a la red
  if (req.mode === "navigate") {                             // páginas: primero la red, así siempre está actualizada
    e.respondWith(
      fetch(req)
        .then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put(url.pathname, copia)); return r; })
        .catch(() => caches.match(url.pathname).then(r => r || caches.match("/")))
    );
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
