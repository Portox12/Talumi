/* Talumi — Service Worker
   Strategie: Netz zuerst, Cache als Rückfall.

   Grund: Das Spiel soll sich mit jedem Upload weiterentwickeln. Cache-first
   würde alte Fassungen festhalten, bis der Cache-Name wechselt. So bekommt
   das Handy immer die neueste Datei, funktioniert aber auch ohne Empfang.

   Beim Ausrollen einer neuen Fassung nur VERSION hochzählen. */

const VERSION = "v97";
const CACHE = "talumi-" + VERSION;
const ASSETS = [
  "./index.html",
  "./sprachen.js",
  "./spiel.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./about.html",
  "./impressum.html",
  "./datenschutz.html",
  "./share-1200x630.png",
  "./lora-latein.woff",
  "./lora-kyrillisch.woff"
];

/* Die Musikdateien stehen bewusst NICHT in dieser Liste. Zusammen sind sie
   24 MB; sie beim Installieren vorzuladen hieße, jedem Besucher 24 MB
   aufzubürden, bevor er einen Ton gehört hat. Sie werden geladen, wenn sie
   gebraucht werden, und landen im gewöhnlichen Zwischenspeicher des
   Browsers. */

/* Jede Datei einzeln ablegen, Fehler je Datei abfangen.
   addAll() ist alles-oder-nichts: Fehlt eine einzige Datei auf dem Server,
   schlägt die gesamte Installation fehl — dann gibt es keinen Offlinebetrieb
   und keine Installationsaufforderung, ohne jede sichtbare Meldung. Genau das
   war der Fall, als about.html und datenschutz.html im Repo fehlten. */
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
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
