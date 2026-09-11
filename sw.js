/* Talumi — Service Worker
   Strategie: Netz zuerst, Cache als Rückfall.

   Grund: Das Spiel soll sich mit jedem Upload weiterentwickeln. Cache-first
   würde alte Fassungen festhalten, bis der Cache-Name wechselt. So bekommt
   das Handy immer die neueste Datei, funktioniert aber auch ohne Empfang.

   Beim Ausrollen einer neuen Fassung nur VERSION hochzählen. */

const VERSION = "v42";
const CACHE = "talumi-" + VERSION;
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./about.html",
  "./impressum.html",
  "./datenschutz.html",
  "./share-1200x630.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});
