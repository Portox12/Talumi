/* Pulsavi — Umzugsbrücke für die alte Adresse talumi.io (v160)

   Läuft als Cloudflare Worker auf den Routen  talumi.io/*  und
   www.talumi.io/*  (die DNS-Einträge von talumi.io bleiben „proxied", der
   Server api.talumi.io bleibt unberührt).

   Was passiert:
   - Ruft ein Browser eine Seite auf, bekommt er diese kleine Brückenseite.
     Sie liest den auf talumi.io gespeicherten Spielstand (Gastfortschritt,
     Anmeldung, Einstellungen — alle Schlüssel talumi.*), packt ihn als
     #umzug=… an die neue Adresse und springt nach pulsavi.io. Dort übernimmt
     index.html die Daten einmalig. So verliert niemand seinen Fortschritt
     durch die Umbenennung, und niemand muss sich neu anmelden.
   - Alle anderen Anfragen (Dateien, Bots ohne JavaScript, alte installierte
     App-Dateien) werden dauerhaft (301) auf dieselbe Adresse bei pulsavi.io
     umgeleitet — das ist auch das Signal an Suchmaschinen, dass die Seite
     umgezogen ist.

   Einrichten (Cloudflare → Workers & Pages → Create → Worker, Name
   „talumi-umzug", Inhalt dieser Datei; dann Settings → Domains & Routes →
   Route  talumi.io/*  und  www.talumi.io/*  auf Zone talumi.io). */

const NEU = "https://pulsavi.io";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const ziel = NEU + url.pathname + url.search;
    const accept = request.headers.get("accept") || "";
    const seite = request.method === "GET" && accept.indexOf("text/html") >= 0
      && (url.pathname === "/" || /\.html?$/.test(url.pathname));
    if (!seite) return Response.redirect(ziel, 301);
    return new Response(bruecke(ziel), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "link": '<' + NEU + url.pathname + '>; rel="canonical"'
      }
    });
  }
};

function bruecke(ziel){
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<link rel="canonical" href="${ziel}">
<meta http-equiv="refresh" content="6;url=${ziel}">
<title>Talumi is now Pulsavi</title>
<style>
  html,body{margin:0;height:100%;background:#0e0a07;color:#f0e4d0;font:600 18px/1.5 Georgia,serif}
  body{display:grid;place-items:center;text-align:center;padding:24px;box-sizing:border-box}
  a{display:inline-block;margin-top:22px;padding:12px 22px;border-radius:12px;background:#d8a75f;color:#0e0a07;font-weight:700;text-decoration:none}
</style>
</head>
<body>
<div>
  <p id="t">Talumi is now Pulsavi. Taking you there…</p>
  <a id="k" href="${ziel}">Play on pulsavi.io</a>
</div>
<script>
(function(){
  var de = /^de/i.test(navigator.language || "");
  if (de){
    document.getElementById("t").textContent = "Talumi heißt jetzt Pulsavi. Einen Moment…";
    document.getElementById("k").textContent = "Auf pulsavi.io spielen";
  }
  var ziel = ${JSON.stringify(ziel)}, d = {}, n = 0;
  try {
    for (var i = 0; i < localStorage.length; i++){
      var k = localStorage.key(i);
      if (/^talumi[._]/.test(k)){ d[k] = localStorage.getItem(k); n++; }
    }
  } catch (e) {}
  if (n){
    try {
      var b = new TextEncoder().encode(JSON.stringify(d)), s = "";
      for (var j = 0; j < b.length; j++) s += String.fromCharCode(b[j]);
      ziel += "#umzug=" + btoa(s).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
    } catch (e) {}
  }
  location.replace(ziel);
})();
</script>
</body>
</html>`;
}
