/* Talumi — Service Worker
   Strategie: Netz zuerst, Cache als Rückfall.

   Grund: Das Spiel soll sich mit jedem Upload weiterentwickeln. Cache-first
   würde alte Fassungen festhalten, bis der Cache-Name wechselt. So bekommt
   das Handy immer die neueste Datei, funktioniert aber auch ohne Empfang.

   Beim Ausrollen einer neuen Fassung nur VERSION hochzählen. */

const VERSION = "v155";
const CACHE = "talumi-" + VERSION;
const ASSETS = [
  "./index.html",
  /* v154: ausgeliefert werden die gebauten Dateien (bauen.js); alle
     Sprachen, damit ein Sprachwechsel auch ohne Netz klappt. */
  "./spiel.min.js",
  "./sprachen-en.js",
  "./sprachen-de.js",
  "./sprachen-es.js",
  "./sprachen-pt.js",
  "./sprachen-fr.js",
  "./sprachen-tr.js",
  "./sprachen-ru.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./icon-badge.png",
  "./about.html",
  "./impressum.html",
  "./datenschutz.html",
  "./nutzungsbedingungen.html",
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

/* ---- Push-Nachrichten (v110) -------------------------------------------
   Der Server schickt eine verschlüsselte Nutzlast (RFC 8291) an den
   Push-Dienst des Browsers; der Browser entschlüsselt sie und weckt diesen
   Worker. Der Text steht fertig darin (`titel`, `text`, in der Sprache des
   Geräts) — hier wird nur gezeigt, nicht übersetzt. `tag` = Art: Eine
   neuere Nachricht derselben Art ersetzt die alte in der Leiste, statt sich
   zu stapeln. Ein Tipp öffnet das Spiel und führt zum Ziel (`#push=…`),
   oder holt ein schon offenes Fenster nach vorn und sagt ihm das Ziel. */
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch(_){ try { d = { text: e.data.text() }; } catch(__){} }
  const titel = String(d.titel || (d.notification && d.notification.title) || "Talumi");
  const text  = String(d.text  || (d.notification && d.notification.body)  || "");
  const ziel  = String(d.ziel || "start").replace(/[^a-z]/g, "");
  e.waitUntil(self.registration.showNotification(titel, {
    body: text, lang: d.lang || undefined,
    icon: "./icon-192.png", badge: "./icon-badge.png",
    tag: String(d.art || "talumi"), renotify: false,
    data: { ziel, url: "./index.html#push=" + ziel }
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const d = (e.notification && e.notification.data) || {};
  const url = new URL(d.url || "./index.html", self.location.href).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(liste => {
    const offen = liste.find(c => "focus" in c);
    if (offen){
      try { offen.postMessage({ push: d.ziel || "start" }); } catch(_){}
      return offen.focus();
    }
    return self.clients.openWindow(url);
  }));
});

/* Der Push-Dienst hat das Abo ausgetauscht (selten; z. B. nach einem
   Browser-Update). Neu abonnieren mit demselben Serverschlüssel; den neuen
   Endpunkt meldet die Seite beim nächsten Öffnen von selbst
   (`Push.abgleichen` in spiel.js) — dieser Worker hat keinen
   Sitzungsschlüssel und soll auch keinen haben. */
self.addEventListener("pushsubscriptionchange", e => {
  const alt = e.oldSubscription;
  const key = alt && alt.options && alt.options.applicationServerKey;
  if (!key) return;
  e.waitUntil(self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }).catch(() => null));
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
