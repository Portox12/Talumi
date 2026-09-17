/* =====================================================================
   Talumi — Spiel
   Braucht sprachen.js, das vorher geladen sein muss.
   ===================================================================== */

"use strict";
/* =====================================================================
   TALUMI
   1) Integrity   2) Profile/Skins   3) World   4) Render   5) Loop
   6) Screens     7) Net (Stub)
   ===================================================================== */

/* Adresse des Spielservers — die EINE Stelle, an der sie steht.
   Leer bedeutet: aus der Seitenadresse ableiten, wie beim Entwickeln auf dem
   eigenen Rechner. Steht hier ein Rechnername, gilt er für beides — die
   Konto-Anfragen (https://…) und die Spielverbindung (wss://…).

   Warum überhaupt nötig: Das Spiel liegt auf GitHub Pages, der Server nicht.
   Ohne diesen Eintrag suchte der Client den Server unter der Adresse der
   Spielseite und fand dort nichts — GitHub Pages liefert nur Dateien aus und
   kann weder Konten führen noch eine Spielverbindung halten.

   Zum Ausprobieren einer anderen Adresse: ?server=wss://… und ?api=https://… */
const SERVER_HOST = "api.talumi.io";

const cvs = document.getElementById("sky");
const ctx = cvs.getContext("2d");
let DPR = 1, VW = 0, VH = 0, FIT = 1;

/* Sichtfeld-Parität: Auf jedem Gerät soll gleich viel Spielfeld zu sehen
   sein. Bezug ist ein Desktopfenster von rund 1440 × 810, verglichen über
   das geometrische Mittel — damit hängt die Fläche nicht am Seitenverhältnis. */
const REF_VIEW = Math.sqrt(1440 * 810);

const isTouch = matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
if (isTouch) document.body.classList.add("touch");

/* Einstellungen. Sitzungsweit, aber bewusst als eigenes Objekt gebaut —
   sobald es Konten gibt, wandert genau dieses Objekt auf den Server.
   Steht hier oben, weil resize() gleich darunter schon lowPower liest. */
/* Bildqualität zur Laufzeit (Schritt 100). `ECO` 0 = alles, 1 = Sparstufe:
   Bildschärfe 1,25, kein Ranglühen, keine Lufthülle, weniger Sterne — die
   Materialien der Designs bleiben. Der Bildratenwächter senkt und hebt die
   Stufe je nach gemessener Rate; **gespeichert wird nichts**. Bis v79 setzte
   er stattdessen die Einstellung „Sparmodus" auf Dauer in den Speicher — ein
   schlechter Start auf einem guten Telefon, und die Designs waren für immer
   flache Scheiben (Thomas: „die neuen Designs verschwinden dauernd"). */
let ECO = 0;
let MENUE_VOLL = false;   // der Körper im Menü wird immer in voller Qualität gezeichnet

const Settings = {
  volume:0.7, shake:true, sens:62, lefty:false,
  teams:"classic", labels:"all", lowPower:false, hudEdge:8, hints:true,
  theme:"earth",
  /* Bildrate links unten einblenden (Schritt 115) — zum Nachsehen am Handy. */
  fps:false,
  /* Fassung der gespeicherten Einstellungen. 2 = seit Schritt 100: ein vom
     alten Wächter gesetzter Sparmodus wird einmal zurückgenommen. */
  fassung:2,
  /* Musik getrennt von den Spielgeräuschen: Wer die Töne braucht, um Gefahr
     zu hören, will deshalb noch lange keine Musik — und umgekehrt. */
  music:0
};

/* Einstellungen überdauern das Neuladen.

   Bis Schritt 71 taten sie das nicht: Lautstärke, Thema, Namensanzeige — alles
   war nach dem Neuladen wieder auf Vorgabe. Solange nur Kleinigkeiten
   betroffen waren, fiel es kaum auf. Mit der Musik, die standardmäßig läuft,
   wird daraus ein echtes Ärgernis: Wer sie abschaltet, hätte sie beim nächsten
   Besuch wieder an.

   Im `localStorage`, nicht in einem Cookie — es geht um eine vom Nutzer selbst
   gewählte Einstellung, die das Gerät nicht verlässt. Jeder Zugriff steht in
   `try`/`catch`: In privaten Fenstern wirft der Speicher, und daran darf das
   Spiel nicht scheitern. Gelesene Werte werden geprüft, nie blind übernommen —
   im Speicher steht, was ein Nutzer hineinschreibt. */
const EINST_SCHLUESSEL = "talumi.einstellungen";

function einstellungenLaden(){
  let roh = null;
  try { roh = JSON.parse(localStorage.getItem(EINST_SCHLUESSEL) || "null"); } catch(_){ return; }
  if (!roh || typeof roh !== "object") return;
  for (const k of Object.keys(Settings)){
    const v = roh[k];
    if (v === undefined || v === null) continue;
    if (typeof v !== typeof Settings[k]) continue;      // Art muss stimmen
    if (typeof v === "number" && !Number.isFinite(v)) continue;
    Settings[k] = v;
  }
  /* Bis Fassung 1 schrieb der Bildratenwächter `lowPower:true` in den
     Speicher — meist nach einem holprigen Rundenstart, nicht nach echter
     Not. Einmal zurücknehmen; wer den Sparmodus wirklich will, schaltet ihn
     in den Einstellungen wieder ein, und ab dann bleibt er. */
  if (!(roh.fassung >= 2)){ Settings.lowPower = false; Settings.fassung = 2; einstellungenSichern(); }
  /* Zahlen in vernünftige Grenzen zwingen, auch wenn die Art stimmt. */
  Settings.volume = Math.min(1, Math.max(0, Settings.volume));
  Settings.music  = Math.min(1, Math.max(0, Settings.music));
  Settings.sens   = Math.min(140, Math.max(20, Settings.sens));
  Settings.hudEdge = Math.min(64, Math.max(0, Settings.hudEdge));
  if (!THEMES[Settings.theme]) Settings.theme = "earth";
}

function einstellungenSichern(){
  try { localStorage.setItem(EINST_SCHLUESSEL, JSON.stringify(Settings)); } catch(_){}
}

/* =====================================================================
   EINWILLIGUNG — die einzige Tür für fremde Skripte
   =====================================================================

   Thomas hat am 14.09.2026 entschieden, Werbung und Cookies aufzunehmen „wie
   bei Agar, auch auf talumi.io". Damit fällt die alte Regel „keine
   Fremdbibliotheken, keine CDNs" — aber **nicht** ihr Kern: Das Urteil des
   LG München I (3 O 17493/20) betrifft fremde Inhalte, die **ohne
   Zustimmung** geladen werden. Mit Zustimmung ist es zulässig, ohne nicht.

   Deshalb dieser Bau: `skriptLaden()` ist die **einzige** Stelle im ganzen
   Client, die ein fremdes Skript einhängt, und sie lädt nichts, bevor für den
   Zweck zugestimmt wurde. Wer künftig ein Werbenetz einbaut, ruft sie auf —
   ein `<script src>` von Hand in `index.html` wäre der Fehler, gegen den das
   hier gebaut ist.

   Drei Dinge sind bewusst so und nicht anders:

   1. **„Alle ablehnen" hat dasselbe Gewicht wie „Alle annehmen"** — gleiche
      Größe, gleiche Farbe, gleiche Stelle, ein Klick. Ein Ablehnen, das
      schwerer zu finden ist als ein Annehmen, gilt in Deutschland als
      unwirksam; dann wäre die ganze Einwilligung nichts wert.
   2. **Das Spiel ist ohne Entscheidung voll spielbar.** Der Kasten blockiert
      nichts. Eine Zustimmung, die Bedingung fürs Spielen wäre, ist keine
      freiwillige und damit keine.
   3. **Vorgabe ist Nein.** Ohne gespeicherte Zustimmung lädt nichts Fremdes.
      Vorangekreuzte Kästchen sind unzulässig (EuGH, Planet49).

   Die Entscheidung liegt in einem **Cookie**, nicht im localStorage: Sie muss
   auch gelten, wenn jemand über `www.` kommt, und ein Einwilligungs-Cookie
   ist selbst „unbedingt erforderlich" — es braucht also keine Zustimmung für
   sich. `FASSUNG` hochzählen, sobald sich die Zwecke ändern; dann wird neu
   gefragt, was bei geänderten Zwecken auch verlangt ist.

   NOCH NICHT ERLEDIGT (steht auch in CLAUDE.md):
   - Vor dem ersten echten Werbeskript ein **Anwalt**. War Teil der
     Entscheidung; Rechtstexte sind nicht die Arbeit einer KI.
   - Die Sätze „no ads / no cookies / no tracking" sind seit Schritt 95 auf
     Thomas' Anweisung aus allen Texten entfernt (index.html, about.html,
     datenschutz.html, sprachen.js `fair1`).
   - Die Datenschutzerklärung braucht Abschnitte zu Werbenetz und Messung.
   Solange nichts eingetragen ist, hat dieser Bau schlicht nichts zu tun und
   zeigt auch keinen Kasten. */
/* Schalter für den ganzen Bau. Auf `true` erst, wenn ein Werbenetz eingetragen
   ist **und** die Rechtstexte stehen. Solange er `false` ist, zeigt Talumi
   keinen Einwilligungskasten und lädt nichts Fremdes — der Stand von heute. */
const WERBUNG_AKTIV = false;

/* Musik ist gebaut, aber abgeschaltet (Schritt 87).
   Thomas hat drei Eigenbau-Fassungen gehört und verworfen, danach sechs
   fertige Stücke ausgewählt und dann entschieden: Musik ganz aus dem Spiel,
   aber aufgehoben. Dieser Schalter ist die ganze Entscheidung.

   Auf "true" gestellt braucht es zusätzlich die sechs Dateien
   musik-*.ogg und musik-*.mp3 neben index.html. Sie liegen im Arbeitsordner,
   aber bewusst nicht im öffentlichen Repo — 24 MB, die niemand hört, solange
   dieser Schalter aus ist. Woher sie stammen, steht in MUSIK-QUELLEN.md.

   Die Spielgeräusche sind davon nicht betroffen. Der Warnton ist ein
   Spielhinweis, kein Schmuck. */
const MUSIK_AKTIV = false;

const Einwilligung = {
  KEKS: "talumi_einwilligung",
  FASSUNG: 1,
  TAGE: 182,                          // ein halbes Jahr, dann neu fragen
  ZWECKE: ["werbung", "messung"],     // „nötig" wird nie gefragt
  stand: null,
  wartende: [],
  geladen: new Set(),

  /* --- Cookie lesen und schreiben. Beides in try/catch: In manchen
     Fenstern wirft der Zugriff, und daran darf das Spiel nicht scheitern. */
  keksLesen(){
    try {
      const t = ("; " + document.cookie).split("; " + this.KEKS + "=")[1];
      if (!t) return null;
      const roh = JSON.parse(decodeURIComponent(t.split(";")[0]));
      if (!roh || roh.f !== this.FASSUNG) return null;   // Zwecke geändert
      return { werbung: !!roh.w, messung: !!roh.m, zeit: +roh.t || 0 };
    } catch(_){ return null; }
  },
  keksSchreiben(stand){
    try {
      const wert = encodeURIComponent(JSON.stringify({
        f: this.FASSUNG, w: !!stand.werbung, m: !!stand.messung, t: Date.now()
      }));
      const ab = new Date(Date.now() + this.TAGE*864e5).toUTCString();
      const sicher = location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${this.KEKS}=${wert}; Expires=${ab}; Path=/; SameSite=Lax${sicher}`;
    } catch(_){}
  },

  erlaubt(zweck){ return !!(this.stand && this.stand[zweck]); },
  gefragt(){ return !!this.stand; },

  /* --- Die einzige Tür ------------------------------------------------
     Lädt ein fremdes Skript, sobald (und nur wenn) für den Zweck zugestimmt
     wurde. Wird vorher aufgerufen, wartet der Auftrag; wird abgelehnt, kommt
     er nie zum Zug. Mehrfachaufrufe für dieselbe Adresse laden einmal. */
  skriptLaden(zweck, url, eigenschaften){
    return new Promise((fertig, daneben) => {
      const tun = () => {
        if (this.geladen.has(url)) return fertig(true);
        this.geladen.add(url);
        const s = document.createElement("script");
        s.src = url; s.async = true;
        for (const k in (eigenschaften || {})) s.setAttribute(k, eigenschaften[k]);
        s.onload = () => fertig(true);
        s.onerror = () => { this.geladen.delete(url); daneben(new Error("Skript nicht geladen: " + url)); };
        document.head.appendChild(s);
      };
      this.beiZustimmung(zweck, tun);
    });
  },

  /* Etwas tun, sobald für den Zweck zugestimmt ist — jetzt oder später. */
  beiZustimmung(zweck, fn){
    if (this.erlaubt(zweck)) { try { fn(); } catch(_){} return; }
    if (this.gefragt()) return;                    // abgelehnt: nie ausführen
    this.wartende.push({ zweck, fn });
  },
  wartendeLoesen(){
    const offen = this.wartende;
    this.wartende = [];
    for (const w of offen) if (this.erlaubt(w.zweck)) { try { w.fn(); } catch(_){} }
  },

  /* --- Kasten ---------------------------------------------------------- */
  zeigen(){
    const bar = $("cookieBar");
    if (!bar) return;
    const w = $("ckWerbung"), m = $("ckMessung");
    if (w) w.checked = this.erlaubt("werbung");     // nie vorangekreuzt, wenn nie gefragt
    if (m) m.checked = this.erlaubt("messung");
    $("cookieFein").hidden = true;
    $("ckSpeichern").hidden = true;
    $("ckFein").hidden = false;
    bar.hidden = false;
    this.platzMessen();
  },
  /* Der Kasten liegt fest am unteren Rand und läge damit über dem, was dort
     steht — auf einem Telefon im Querformat genau über dem Startknopf.
     Deshalb bekommt der Schleier unten genau die Höhe des Kastens als
     zusätzlichen Rand. Gemessen und nicht geschätzt: Die Höhe hängt an der
     Sprache, an der Schriftgröße des Geräts und daran, ob die
     Feineinstellung offen ist. */
  platzMessen(){
    /* Absichtlich `getElementById` statt der Abkürzung `$`: Diese Methode
       läuft schon beim ersten `resize()`, und das steht im Skript vor der
       Zeile, die `$` anlegt. Mit `$` warf der ganze Client dort einen Fehler
       und blieb schwarz — einmal passiert, nie wieder. */
    const bar = document.getElementById("cookieBar");
    const wurzel = document.documentElement;
    if (!bar || bar.hidden){
      document.body.classList.remove("keks");
      wurzel.style.setProperty("--keks-hoehe", "0px");
      return;
    }
    document.body.classList.add("keks");
    wurzel.style.setProperty("--keks-hoehe",
      Math.ceil(bar.getBoundingClientRect().height) + "px");
  },
  verbergen(){ const b = $("cookieBar"); if (b) b.hidden = true; this.platzMessen(); },

  setzen(werbung, messung){
    this.stand = { werbung: !!werbung, messung: !!messung, zeit: Date.now() };
    this.keksSchreiben(this.stand);
    this.verbergen();
    this.wartendeLoesen();
  },

  /* Aus den Einstellungen erreichbar. Eine Einwilligung muss so leicht zu
     widerrufen sein, wie sie zu erteilen war. */
  widerrufen(){
    this.stand = null;
    try {
      document.cookie = this.KEKS + "=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/";
    } catch(_){}
    /* Schon geladene Skripte lassen sich nicht zurückholen — ein Neuladen
       ist der einzige ehrliche Weg, und der Kasten sagt das auch. */
    this.zeigen();
  },

  start(){
    this.stand = this.keksLesen();
    const bar = $("cookieBar");
    if (!bar) return;
    /* Solange kein Werbenetz eingetragen ist, gibt es nichts zu erlauben —
       dann bleibt der Kasten weg. Ein Banner ohne Zweck ist Lärm. */
    if (!WERBUNG_AKTIV){ this.verbergen(); return; }
    if (this.gefragt()){ this.verbergen(); this.wartendeLoesen(); return; }
    this.zeigen();
  }
};

function resize(){
  /* Schärfe gegen Füllrate. Handys haben meist die dreifache Pixeldichte;
     jeder Punkt davon kostet Rechenzeit und Wärme. Vorher wurde auf kleinen
     Schirmen hart auf 1,25 gedeckelt — sparsam, aber Schrift und Ränder
     wirkten dort weich und ausgefranst.
     Jetzt ist scharf der Normalfall (bis zur doppelten Dichte, darüber sieht
     man nichts mehr), und wer Akku oder Wärme sparen will, schaltet in den
     Einstellungen den Sparmodus ein. */
  /* Schritt 100: Auf Tippgeräten reicht die anderthalbfache Dichte — der
     Unterschied zu 2 ist am Handy nicht zu sehen, kostet aber 78 % mehr
     Bildpunkte, und genau die Füllrate war der Engpass (Profil: 61 % der
     Zeit im Rastern, 4 % im Spielcode). Die Sparstufe (`ECO`) senkt weiter. */
  const cap = Settings.lowPower ? 1.25 : ECO ? 1.25 : (isTouch ? 1.5 : 2);
  DPR = Math.min(devicePixelRatio || 1, cap);
  VW = innerWidth; VH = innerHeight;
  cvs.width = Math.round(VW*DPR); cvs.height = Math.round(VH*DPR);
  FIT = Math.sqrt(VW*VH) / REF_VIEW;
  checkOrientation();
  Einwilligung.platzMessen();   // Drehen ändert die Höhe des Kastens
}
addEventListener("resize", resize);
addEventListener("orientationchange", () => setTimeout(resize, 120));

let portrait = false;
/* `portrait` hält die Spielschleife an und zeigt den Drehhinweis. Hochkant
   spielbar war es nur in v84/v85 (Schritt 103) — Thomas hat das
   zurückgenommen. */
function checkOrientation(){
  portrait = isTouch && VH > VW;
  document.body.classList.toggle("portrait", portrait);
  anmeldungLage();
}
resize();

const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const rnd = (a,b) => a + Math.random()*(b-a);
const avg = a => a.reduce((s,x)=>s+x,0)/(a.length||1);
const sd  = a => { const m = avg(a); return Math.sqrt(avg(a.map(x=>(x-m)*(x-m)))); };
const $ = id => document.getElementById(id);
/* =====================================================================
   6c) PORTAL — Anbindung an Poki, CrazyGames und Co.
   Beide Portale erwarten dieselben vier Signale: Ladebeginn, Ladeende,
   Spielbeginn, Spielende. Sie schalten Werbung ausschließlich zwischen
   gameplayStop und gameplayStart, nie mitten im Spiel — vorausgesetzt, das
   Spiel meldet sich korrekt. Genau das leistet dieses Modul.

   Anbinden heißt später: das SDK-Skript des Portals in den <head>, und in den
   vier Methoden unten den jeweiligen Aufruf ergänzen. Sonst ändert sich nichts.

   Das SDK ist der einzige zulässige Fremdinhalt im Projekt. Es liegt auf der
   Portalseite selbst — die Entscheidung aus Schritt 1 gegen externe Fonts und
   CDNs bleibt für die eigene Adresse unberührt.

   Werberegel als Code, nicht als Vorsatz: MIN_BREAK ist der Mindestabstand
   zwischen zwei Unterbrechungen. Werbung nach jedem Tod ist im Genre der
   häufigste Beschwerdegrund — das darf hier technisch nicht passieren
   können. */
/* Welches Portal? (Schritt 95)
   1. `<meta name="talumi-portal" content="poki|crazygames">` — setzt
      `portal-paket.js` beim Bauen des Pakets für das jeweilige Portal.
   2. Rückfall über den Hostnamen, falls ein Portal die Dateien anders
      ausliefert als erwartet.
   Auf talumi.io ergibt beides "" — dort lädt **nichts** Fremdes.

   Warum das SDK hier ohne `Einwilligung.skriptLaden()` geladen wird: Auf dem
   Portal ist das Portal selbst Anbieter der Seite. Poki und CrazyGames holen
   die Einwilligung ihrer Besucher selbst ein und schreiben vor, dass ihr SDK
   geladen wird; ein zweiter Einwilligungskasten des Spiels ist dort sogar
   unerwünscht. Auf der eigenen Adresse gilt der Einwilligungs-Gate
   unverändert. */
const PORTAL_NAME = (() => {
  try {
    const m = document.querySelector('meta[name="talumi-portal"]');
    const c = m && String(m.getAttribute("content") || "").toLowerCase();
    if (c === "poki" || c === "crazygames") return c;
    const h = location.hostname;
    if (/(^|\.)poki-gdn\.com$|(^|\.)poki\.com$|(^|\.)poki\.io$/.test(h)) return "poki";
    if (/(^|\.)crazygames\.[a-z.]+$|(^|\.)1001juegos\.com$/.test(h)) return "crazygames";
  } catch(_){}
  return "";
})();

const Portal = {
  name: PORTAL_NAME,
  sdk: null,            // bereit, sobald das SDK initialisiert ist
  ready:false, lastBreak:0, deaths:0, sinceAd:0, imSpiel:false,
  started: performance.now()/1000,

  /* Werberegeln als Code, nicht als Vorsatz.
     Vier Bedingungen müssen ALLE erfüllt sein, bevor eine Unterbrechung kommt:

     MIN_DEATHS   Tode seit der letzten Werbung
     MIN_BREAK    Sekunden seit der letzten Werbung
     GRACE_DEATHS die ersten Tode einer Sitzung bleiben frei
     GRACE_TIME   die ersten Sekunden einer Sitzung bleiben frei

     Unterbrechungen kommen ausschließlich zwischen zwei Runden, nie im Spiel.

     Schritt 95: Thomas will Geld verdienen, Bewertungen sollen trotzdem gut
     bleiben. Die Werte sind deshalb gelockert, liegen aber weiter klar unter
     Agar.io (dort fast jeder Tod): höchstens alle drei Minuten, frühestens
     nach drei Minuten und zwei Toden, dann jeder zweite Tod. CrazyGames
     erzwingt die drei Minuten ohnehin selbst (`adCooldown`). */
  MIN_BREAK:180, MIN_DEATHS:2, GRACE_DEATHS:2, GRACE_TIME:180,

  /* --- SDK laden --------------------------------------------------------
     Scheitert irgendetwas (Werbeblocker, Netz), läuft das Spiel ohne
     Portalfunktionen weiter — nie ein schwarzer Bildschirm. */
  init(){
    if (!this.name || this._init) return;
    this._init = true;
    try { document.documentElement.classList.add("portal", "portal-" + this.name); } catch(_){}
    const url = this.name === "poki"
      ? "https://game-cdn.poki.com/scripts/v2/poki-sdk.js"
      : "https://sdk.crazygames.com/crazygames-sdk-v3.js";
    const s = document.createElement("script");
    s.src = url; s.async = true;
    s.onload = async () => {
      try {
        if (this.name === "poki"){
          await window.PokiSDK.init().catch(() => {});
          this.sdk = window.PokiSDK;
        } else {
          const C = window.CrazyGames && window.CrazyGames.SDK;
          await C.init();
          if (C.environment === "disabled") return;
          this.sdk = C;
        }
        if (this.ready) this._loadingStop();
        else this._loadingStart();
        if (this.imSpiel) this._gameplayStart();
      } catch(_){ this.sdk = null; }
    };
    s.onerror = () => { this.sdk = null; };
    document.head.appendChild(s);
  },

  _ruf(fn){ if (!this.sdk) return; try { fn(this.sdk); } catch(_){} },
  _loadingStart(){ this._ruf(S => { if (this.name === "crazygames") S.game.loadingStart(); }); },
  _loadingStop(){ this._ruf(S => this.name === "poki" ? S.gameLoadingFinished() : S.game.loadingStop()); },
  _gameplayStart(){ this._ruf(S => this.name === "poki" ? S.gameplayStart() : S.game.gameplayStart()); },
  _gameplayStop(){ this._ruf(S => this.name === "poki" ? S.gameplayStop() : S.game.gameplayStop()); },

  loadingStart(){ this.init(); this._loadingStart(); },
  loadingStop(){ this.ready = true; this._loadingStop(); },
  gameplayStart(){ if (this.imSpiel) return; this.imSpiel = true; this._gameplayStart(); },
  gameplayStop(){ if (!this.imSpiel) return; this.imSpiel = false; this._gameplayStop(); },

  countDeath(){ this.deaths++; this.sinceAd++; },

  mayBreak(){
    if (!this.ready || !this.sdk) return false;
    const now = performance.now()/1000;
    if (this.deaths < this.GRACE_DEATHS) return false;
    if (now - this.started < this.GRACE_TIME) return false;
    if (this.sinceAd < this.MIN_DEATHS) return false;
    if (now - this.lastBreak < this.MIN_BREAK) return false;
    return true;
  },

  /* Ton weg, solange eine Anzeige läuft — Vorgabe beider Portale. */
  stumm(an){
    try {
      if (!Sound.ctx) return;
      if (an) Sound.ctx.suspend(); else Sound.ctx.resume();
    } catch(_){}
  },

  /* Eine Anzeige zeigen und danach genau einmal weiter. Startet die Anzeige
     nicht binnen fünf Sekunden, geht es ohne sie weiter: Der Spieler wartet
     nie auf ein Werbenetz, das nicht antwortet. Ist sie einmal gestartet,
     meldet das SDK ihr Ende verlässlich selbst. */
  _anzeige(art, fertig){
    let erledigt = false, gestartet = false;
    const ende = ok => { if (erledigt) return; erledigt = true; this.stumm(false); fertig(!!ok); };
    const start = () => { gestartet = true; this.stumm(true); };
    setTimeout(() => { if (!gestartet) ende(false); }, 5000);
    try {
      if (this.name === "poki"){
        const p = art === "rewarded"
          ? this.sdk.rewardedBreak({ size:"medium", onStart: start })
          : this.sdk.commercialBreak(start);
        Promise.resolve(p).then(ok => ende(art === "rewarded" ? ok : true), () => ende(false));
      } else {
        this.sdk.ad.requestAd(art === "rewarded" ? "rewarded" : "midgame", {
          adStarted: start,
          adFinished: () => ende(true),
          adError: () => ende(false)
        });
      }
    } catch(_){ ende(false); }
  },

  /* Ruft weiter, egal ob Werbung lief. */
  breakBefore(next){
    if (!this.mayBreak()) return next();
    this.lastBreak = performance.now()/1000;
    this.sinceAd = 0;
    this.gameplayStop();
    this._anzeige("midgame", () => next());
  },

  /* Freiwillige Belohnungswerbung. Ohne SDK unsichtbar, damit kein Knopf
     steht, der nichts tut. Belohnt wird **nur** bei `ok` — Portalvorgabe. */
  rewardAvailable(){ return !!this.sdk; },
  offerReward(onDone){
    if (!this.sdk) return onDone(false);
    /* Eine Belohnungsanzeige zählt als Unterbrechung: Direkt danach soll
       nicht auch noch eine Pflichtanzeige kommen. */
    this.lastBreak = performance.now()/1000;
    this.sinceAd = 0;
    this._anzeige("rewarded", onDone);
  }
};

/* =====================================================================
   SPRACHE
   Erkennung aus den Browsereinstellungen, überschreibbar. navigator.languages
   ist die Wunschliste des Nutzers in Reihenfolge — die erste, die wir können,
   gewinnt. Regionalkürzel werden abgeschnitten: pt-BR und pt-PT bekommen
   beide Portugiesisch.
   Fällt ein Schlüssel in einer Sprache aus, greift Englisch als Rückfall,
   damit nie ein roher Schlüssel im Bild steht.
   ===================================================================== */

let lang = "en";
function pickLang(){
  const want = (navigator.languages && navigator.languages.length)
    ? navigator.languages : [navigator.language || "en"];
  for (const w of want){
    const base = String(w).toLowerCase().split("-")[0];
    if (LANGS[base]) return base;
  }
  return "en";
}
function t(key){
  let s = (LANGS[lang] && LANGS[lang][key]) || LANGS.en[key] || key;
  for (let i=1;i<arguments.length;i++) s = s.split("{"+(i-1)+"}").join(arguments[i]);
  return s;
}
function applyLang(){
  try { document.documentElement.lang = lang; } catch(_){}
  const nodes = document.querySelectorAll ? document.querySelectorAll("[data-i18n]") : [];
  for (const el of nodes) el.textContent = t(el.dataset.i18n);
  // Knöpfe, die nur ein Zeichen zeigen (Zahnrad): Name für Vorleser und Maus
  const nms = document.querySelectorAll ? document.querySelectorAll("[data-i18n-name]") : [];
  for (const el of nms) { const n = t(el.dataset.i18nName); el.setAttribute("aria-label", n); el.title = n; }
  // Platzhalter in Eingabefeldern brauchen eine eigene Runde
  const phs = document.querySelectorAll ? document.querySelectorAll("[data-i18n-ph]") : [];
  for (const el of phs) el.placeholder = t(el.dataset.i18nPh);
  const ctrl = $("controls");
  if (ctrl) ctrl.innerHTML = (isTouch ? t("ctrltouch") : t("ctrlmouse")) +
    "<br>" + t("earned") + ` · <a href="#" id="hilfeLink" style="color:var(--brass)">${esc(t("hilfe"))}</a>`;
  buildModes(); buildStrip(); buildGrid(); paintPurse(); paintIntegrity();
  buildRecords(); buildBoost();
  // Die Sprachknöpfe im Startbildschirm werden einmal gebaut, bevor die
  // Browsersprache feststeht. Ohne dieses Nachzeichnen bleibt dort Englisch
  // angehakt, während der Rest der Seite längst deutsch ist.
  const lp = $("langPick");
  if (lp && lp.draw) lp.draw();
  const lb = $("langBtn");
  if (lb){ lb.textContent = lang.toUpperCase(); lb.setAttribute("aria-label", t("language") + ": " + (LANGNAMES[lang] || lang)); }
  if ($("friendList")) buildFriends();
  if ($("setList") && !$("setVeil").hidden) buildSettings();
}

/* Zwei Paletten in Erdtönen. Die Farben stehen an einer Stelle, weil sie
   sowohl in CSS als auch auf der Zeichenfläche gebraucht werden — vorher waren
   sie über beides verstreut hartkodiert.
   „Erde" ist die dunkle: gebrannter Boden, Messing, Leinen.
   „Sand" ist die helle: heller Sand, dunkle Ocker, tiefbraune Schrift. */
const THEMES = {
  earth: {
    ink:"#0e0a07", ink2:"#1a120c", plate:"#1e150e", line:"#3c2c1d",
    brass:"#d8a75f", paper:"#f0e4d0", paper2:"#a8927a", ember:"#e07a3c", onBrass:"#1a120c",
    us:"#a9e7cf", them:"#ff9a72", good:"#8fc98f",
    dust:{h:[196,232], s:[18,40], l:[58,78]}, shatter:"#8fe3ff",
    star:"#e8d9bd", border:"#2b1f15", label:"rgba(14,10,7,.78)",
    pulsar:"rgb(44,30,18)", pulsarEdge:"rgba(216,167,95,.7)",
    pulsarCore:"rgba(216,167,95,.2)", zone:"rgba(120,44,18,.34)",
    zoneEdge:"224,122,60", rival:{rock:"#8a7659", dark:"#4a3c2a", hot:"#e07a3c", air:"#d8c4a0"}
  },
  sand: {
    ink:"#e9dcc4", ink2:"#dccdb0", plate:"#f4ebdc", line:"#c2aa86",
    brass:"#8a5a24", paper:"#2c2117", paper2:"#6b5842", ember:"#b8501f", onBrass:"#f7f0e2",
    us:"#1f6b4f", them:"#a8391a", good:"#2f6b33",
    dust:{h:[24,44], s:[24,46], l:[30,46]}, shatter:"#1f6b7a",
    star:"#a68e68", border:"#c9b590", label:"rgba(250,244,232,.85)",
    pulsar:"rgb(120,96,64)", pulsarEdge:"rgba(70,48,24,.8)",
    pulsarCore:"rgba(70,48,24,.22)", zone:"rgba(176,74,36,.30)",
    zoneEdge:"152,58,24", rival:{rock:"#9c8a6c", dark:"#6b5b40", hot:"#b8501f", air:"#7a6440"}
  }
};
const TH = () => THEMES[Settings.theme] || THEMES.earth;

function applyTheme(){
  const th = TH(), r = document.documentElement;
  if (!r || !r.style) return;
  r.style.setProperty("--ink", th.ink);
  r.style.setProperty("--ink-2", th.ink2);
  r.style.setProperty("--plate", th.plate);
  r.style.setProperty("--line", th.line);
  r.style.setProperty("--brass", th.brass);
  r.style.setProperty("--paper", th.paper);
  r.style.setProperty("--paper-2", th.paper2);
  r.style.setProperty("--ember", th.ember);
  r.style.setProperty("--on-brass", th.onBrass);
  r.style.setProperty("--us", th.us);
  r.style.setProperty("--them", th.them);
  r.style.setProperty("--good", th.good);
  const meta = document.querySelector && document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", th.ink);
}

/* =====================================================================
   1) INTEGRITY — Botschutz (Client-Heuristik, Entscheidung gehört auf den Server)
   ===================================================================== */
const Integrity = {
  score:100, samples:[], gaps:[], untrusted:0, aimHits:0, aimTries:0,
  /* Bucket großzügig: Menschen hämmern die Abwurftaste. Ein Bot mit 60
     Aktionen pro Sekunde fällt trotzdem sofort durch. */
  tokens:10, cap:10, refill:4,
  lastRefill:performance.now(), reason:"i_ok", locked:false,

  pointer(e,x,y){
    const t = performance.now();
    if (e && e.isTrusted === false) this.untrusted++;
    const last = this.samples[this.samples.length-1];
    if (last) this.gaps.push(t-last.t);
    this.samples.push({t,x,y});
    if (this.samples.length > 140) this.samples.shift();
    if (this.gaps.length > 140) this.gaps.shift();
  },
  mayAct(){
    const now = performance.now();
    this.tokens = Math.min(this.cap, this.tokens + (now-this.lastRefill)/1000*this.refill);
    this.lastRefill = now;
    if (this.tokens < 1){ this.hit(6,"i_fast"); return false; }
    this.tokens -= 1; return true;
  },
  hit(p,why){ this.score = Math.max(0, this.score-p); this.reason = why; },

  audit(){
    let clean = true;
    if (navigator.webdriver){ this.hit(40,"i_auto"); clean = false; }
    if (this.untrusted > 0){
      this.hit(25+this.untrusted,"i_synth");
      this.untrusted = 0; clean = false;
    }
    const p = this.samples;
    if (p.length > 40){
      const v = [];
      for (let i=1;i<p.length;i++){
        const dt = Math.max(1, p[i].t-p[i-1].t);
        v.push(Math.hypot(p[i].x-p[i-1].x, p[i].y-p[i-1].y)/dt);
      }
      const mv = avg(v);
      if (mv > .02 && sd(v)/mv < .16){ this.hit(9,"i_speed"); clean = false; }
      const turns = [];
      for (let i=2;i<p.length;i++){
        const a1 = Math.atan2(p[i-1].y-p[i-2].y, p[i-1].x-p[i-2].x);
        const a2 = Math.atan2(p[i].y-p[i-1].y, p[i].x-p[i-1].x);
        let d = a2-a1;
        while (d> Math.PI) d -= 2*Math.PI;
        while (d<-Math.PI) d += 2*Math.PI;
        turns.push(Math.abs(d));
      }
      if (mv > .05 && avg(turns) < .012){ this.hit(9,"i_straight"); clean = false; }
      if (this.gaps.length > 40 && avg(this.gaps) < 40 && sd(this.gaps) < 1.2){
        this.hit(12,"i_timing"); clean = false;
      }
    }
    if (this.aimTries > 22){
      if (this.aimHits/this.aimTries > .94){ this.hit(11,"i_aim"); clean = false; }
      this.aimHits = 0; this.aimTries = 0;
    }
    if (clean && this.score < 100){
      this.score = Math.min(100, this.score+4);
      if (this.score > 70) this.reason = "i_ok";
    }
    paintIntegrity();
    if (this.score <= 30 && !this.locked && Game.running) demandCheck();
  },
  reset(){
    this.score = 100; this.samples.length = 0; this.gaps.length = 0;
    this.untrusted = 0; this.aimHits = 0; this.aimTries = 0;
    this.reason = "i_ok"; paintIntegrity();
  }
};
function paintIntegrity(){
  /* Bei voller Punktzahl sagt die Tafel nichts aus und nimmt nur Platz weg —
     auf einem Handy im Querformat ist das die knappste Ressource. */
  const plate = $("intPlate");
  if (plate) plate.hidden = Integrity.score >= 100 && !Integrity.locked;
  const b = $("intBar");
  b.style.width = Integrity.score + "%";
  b.style.background = Integrity.score>70 ? TH().good : Integrity.score>40 ? TH().brass : TH().ember;
  $("intText").textContent = t(Integrity.reason);
}
setInterval(()=>Integrity.audit(), 1500);

function h32(s){
  let h = 0x811c9dc5;
  for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h,0x01000193); }
  return h>>>0;
}
function entryProof(seed,bits,done){
  const target = 0xffffffff>>>bits;
  let n = 0;
  (function step(){
    const stop = n+60000;
    while (n<stop){ if (h32(seed+":"+n) <= target) return done(n); n++; }
    $("powText").textContent = t("powrun");
    setTimeout(step,0);
  })();
}

let trace = [];
function demandCheck(){
  Integrity.locked = true; trace = [];
  $("seed").style.left = "14px"; $("seed").style.top = "69px";
  $("testVeil").hidden = false;
}
(function(){
  const area = $("testArea"), seed = $("seed"), well = $("well");
  let dragging = false;
  seed.addEventListener("pointerdown", e => { dragging = true; seed.setPointerCapture(e.pointerId); trace = []; });
  area.addEventListener("pointermove", e => {
    if (!dragging || e.isTrusted === false) return;
    const r = area.getBoundingClientRect();
    const x = e.clientX-r.left, y = e.clientY-r.top;
    trace.push({x,y});
    seed.style.left = (x-16)+"px"; seed.style.top = (y-16)+"px";
  });
  area.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    const sr = seed.getBoundingClientRect(), wr = well.getBoundingClientRect();
    const inside = Math.hypot(sr.left+16-(wr.left+29), sr.top+16-(wr.top+29)) < 30;
    const turns = [];
    for (let i=2;i<trace.length;i++){
      const a1 = Math.atan2(trace[i-1].y-trace[i-2].y, trace[i-1].x-trace[i-2].x);
      const a2 = Math.atan2(trace[i].y-trace[i-1].y, trace[i].x-trace[i-1].x);
      turns.push(Math.abs(a2-a1));
    }
    if (inside && trace.length > 12 && avg(turns) > .006){
      $("testVeil").hidden = true;
      Integrity.locked = false; Integrity.score = 75; Integrity.reason = t("i_pass");
      Integrity.samples.length = 0; Integrity.gaps.length = 0;
      paintIntegrity();
    } else {
      $("testText").textContent = inside ? t("checksmooth") : t("checkwell");
      seed.style.left = "14px"; seed.style.top = "69px";
    }
  });
})();

/* =====================================================================
   2) PROFILE, LEVEL, ORE, SKINS
   Alles hier ist Sitzungsstand. Produktiv liegt es auf dem Server —
   sonst editiert sich jeder sein Guthaben in der Konsole.
   ===================================================================== */
const MAX_LEVEL = 100;

/* Startbonus. Kein reiner Vorteil: Bei dreifacher Masse ist man nach der
   Tempokurve rund 22 % langsamer und ein deutlich größeres Ziel. Deshalb ist
   er vertretbar — solange er nur mit erspieltem Ore zu haben ist. */
/* An die gesenkte Auszahlung angepasst: rund sieben bzw. zwanzig Minuten
   Spielzeit. Ein Verbrauchsgut darf nicht so teuer sein, dass man es nie
   benutzt. */
const BOOST_COST = {1:0, 2:400, 3:1100};



/* 46 Designs. Alle erspielbar: 21 über Level, 25 über Ore.
   Die Ore-Skins tragen die ersten Stunden, die Level-Skins die lange Strecke.
   Antimatter sitzt auf Level 100 — dem Ende der Leiter. */
const SKINS = [
  {id:"basalt",     mat:"fels",     label:"Basalt",       rock:"#6d7688", dark:"#454e5f", hot:"#ff7a45", air:"#7fb0e8", lv:1},
  {id:"regolith",   mat:"staub",   label:"Regolith",     rock:"#8a8578", dark:"#55524a", hot:"#ffb86b", air:"#cfc6ae", lv:2},
  {id:"iron",       mat:"metall",       label:"Iron",         rock:"#8d6a55", dark:"#5a4132", hot:"#ffb03a", air:"#e0a37a", lv:3},
  {id:"copper",     mat:"metall",     label:"Copper",       rock:"#b07a4a", dark:"#6e472a", hot:"#ffc36b", air:"#e8b98a", ore:500},
  {id:"ice",        mat:"eis",        label:"Ice",          rock:"#9fc4d8", dark:"#65899f", hot:"#8fe3ff", air:"#cfeaff", lv:5},
  {id:"jade",       mat:"kristall",       label:"Jade",         rock:"#5f9c82", dark:"#365c4d", hot:"#7fffc4", air:"#a9e7cf", ore:800},
  {id:"ash",        mat:"staub",        label:"Ash",          rock:"#7a7a80", dark:"#494950", hot:"#ff5f3a", air:"#b9b9c4", lv:7},
  {id:"ember",      mat:"glut",      label:"Ember",        rock:"#a4503c", dark:"#5f2a1e", hot:"#ff9b2f", air:"#ff9a72", ore:1200},
  {id:"cobalt",     mat:"metall",     label:"Cobalt",       rock:"#4d68b5", dark:"#2b3c72", hot:"#6fa8ff", air:"#93b4ff", lv:9},
  {id:"sulfur",     mat:"fels",     label:"Sulfur",       rock:"#c2b24a", dark:"#75692a", hot:"#fff06b", air:"#ecd97f", ore:1600},
  {id:"obsidian",   mat:"glas",   label:"Obsidian",     rock:"#33364a", dark:"#16171f", hot:"#c05cff", air:"#c9b4f0", lv:12},
  {id:"quartz",     mat:"kristall",     label:"Rose Quartz",  rock:"#c98d9c", dark:"#7d5460", hot:"#ff9ec4", air:"#f2c3d1", ore:2400},
  {id:"verdant",    mat:"fels",    label:"Verdant",      rock:"#6f9a45", dark:"#3f5b26", hot:"#c8ff5c", air:"#b7e08a", lv:15},
  {id:"tungsten",   mat:"metall",   label:"Tungsten",     rock:"#7f8794", dark:"#4a5058", hot:"#dfe9f5", air:"#b6c2d0", ore:3200},
  {id:"mercury",    mat:"metall",    label:"Mercury",      rock:"#a9b3bd", dark:"#5f686f", hot:"#e8f4ff", air:"#dbe6ef", lv:20},
  {id:"malachite",  mat:"kristall",  label:"Malachite",    rock:"#3f8f6a", dark:"#20553d", hot:"#6bffb0", air:"#8fdcb6", ore:4400},
  {id:"amber",      mat:"glas",      label:"Amber",        rock:"#c98f2e", dark:"#7a5212", hot:"#ffd166", air:"#f0c27a", ore:6000},
  {id:"nebula",     mat:"gas",     label:"Nebula",       rock:"#7a5aa8", dark:"#432f63", hot:"#ff6bd6", air:"#c39bff", lv:25},
  {id:"cinnabar",   mat:"fels",   label:"Cinnabar",     rock:"#a83f3a", dark:"#61201d", hot:"#ff6b4a", air:"#e08b7a", ore:8400},
  {id:"glacier",    mat:"eis",    label:"Glacier",      rock:"#7fb3c9", dark:"#48748a", hot:"#b8f0ff", air:"#dff3ff", lv:30},
  {id:"rust",       mat:"fels",       label:"Rust",         rock:"#9c5a33", dark:"#5c3218", hot:"#ff8f3a", air:"#d99a6a", ore:11600},
  {id:"indigo",     mat:"kristall",     label:"Indigo",       rock:"#4a4a9c", dark:"#28285e", hot:"#8f8fff", air:"#a3a3e8", ore:16000},
  {id:"aurora",     mat:"gas",     label:"Aurora",       rock:"#3f8f8a", dark:"#1f5450", hot:"#5cffb0", air:"#8ef0d8", lv:36},
  {id:"saffron",    mat:"staub",    label:"Saffron",      rock:"#cf9236", dark:"#7d5417", hot:"#ffd98f", air:"#f2cd8a", ore:22000},
  {id:"pearl",      mat:"perle",      label:"Pearl",        rock:"#d6cec0", dark:"#8a8377", hot:"#fff6e8", air:"#f0e8da", ore:30000},
  {id:"onyx",       mat:"glas",       label:"Onyx",         rock:"#2b2d3a", dark:"#131419", hot:"#9fabff", air:"#c2c9ea", lv:42},
  {id:"peridot",    mat:"kristall",    label:"Peridot",      rock:"#8fae3a", dark:"#556a1c", hot:"#d8ff6b", air:"#c2dc8a", ore:42000},
  {id:"magnetite",  mat:"metall",  label:"Magnetite",    rock:"#4a4f5c", dark:"#262a33", hot:"#ff5c8f", air:"#8a93a8", ore:58000},
  {id:"solaris",    mat:"glut",    label:"Solaris",      rock:"#d19a3a", dark:"#8a5c14", hot:"#fff3a0", air:"#ffd884", lv:50},
  {id:"corona",     mat:"glut",     label:"Corona",       rock:"#d4643a", dark:"#7d2f16", hot:"#ffb06b", air:"#ffb08f", ore:80000},
  {id:"titan",      mat:"metall",      label:"Titan",        rock:"#8a94a8", dark:"#4c5464", hot:"#cfe8ff", air:"#b3c4d8", lv:58},
  {id:"halide",     mat:"kristall",     label:"Halide",       rock:"#6ba8b5", dark:"#376a75", hot:"#a0ffee", air:"#b8e8f0", ore:110000},
  {id:"bismuth",    mat:"perle",    label:"Bismuth",      rock:"#8f6bb5", dark:"#4e3670", hot:"#ff9bd6", air:"#d0a8e8", ore:150000},
  {id:"crimson",    mat:"staub",    label:"Crimson Dust", rock:"#a83a55", dark:"#5f1a2b", hot:"#ff5c7a", air:"#e08a9c", lv:66},
  {id:"zircon",     mat:"kristall",     label:"Zircon",       rock:"#7f9bd6", dark:"#43578a", hot:"#c4dcff", air:"#c2d4f0", ore:210000},
  {id:"plasma",     mat:"energie",     label:"Plasma",       rock:"#b53a8f", dark:"#69184f", hot:"#ff6bff", air:"#ff9be8", lv:74},
  {id:"horizon",    mat:"schlund", label:"Event Horizon",rock:"#1a1e30", dark:"#0a0c16", hot:"#6b8fff", air:"#bcd0ff", ore:290000, wucht:.80},
  {id:"quasar",     mat:"glut",     label:"Quasar",       rock:"#d6b03a", dark:"#7d6414", hot:"#fffcb0", air:"#ffe89b", lv:82},
  {id:"primordial", mat:"fels", label:"Primordial",   rock:"#8a7142", dark:"#332816", hot:"#ffce5c", air:"#f0dba6", ore:400000},
  {id:"singularity",mat:"schlund",label:"Umbra",     rock:"#1a1c2a", dark:"#0a0b12", hot:"#8f5cff", air:"#b49bff", lv:90, wucht:.58},
  {id:"void",       mat:"schlund",    label:"Void",         rock:"#1b1d28", dark:"#0a0b10", hot:"#7fa8ff", air:"#dceaff", lv:95, wucht:1},
  {id:"antimatter", mat:"energie", label:"Antimatter",   rock:"#5b2f5e", dark:"#2c1430", hot:"#ff2fb0", air:"#ff8ce0", lv:100},

  /* Stufe VI. Vier Stück, sehr teuer, mit Effekten, die keine andere
     Design hat. Bewusst nur über Ore — keine Levelbindung, damit sie
     unabhängig von der Leiter ein eigenes Ziel bilden.
     Regel wie überall: Der massive Kreis und der scharfe Rand bleiben exakt
     auf dem echten Radius. Alles Zusätzliche liegt durchscheinend darüber,
     sonst täuscht ein teurer Skin über die Reichweite. */
  {id:"eventide",  mat:"gas",  label:"Eventide",   rock:"#4a3f6b", dark:"#221c38", hot:"#b58cff", air:"#d6c2ff",
   ore:800000,  special:"trail"},
  {id:"halo",      mat:"perle",      label:"Halo",       rock:"#c9b76a", dark:"#6e5a1f", hot:"#fff2b0", air:"#ffe58a",
   ore:1100000, special:"halo"},
  {id:"singular",  mat:"schlund",  label:"Singularity",rock:"#0f1119", dark:"#03040a", hot:"#a8c8ff", air:"#eaf2ff", wucht:1,
   ore:1500000, special:"warp"},
  {id:"prism",     mat:"kristall",     label:"Prism",      rock:"#8f8fa8", dark:"#3f3f52", hot:"#ffffff", air:"#e8e8f5",
   ore:2000000, special:"prism"},
  /* Inferno (Schritt 104): nur fürs Werben — weder Level noch Ore. `sonder`
     hält es aus Zählung, Preisliste und Levelvergleich heraus; der Server
     schaltet es über das Werbeprogramm frei. */
  {id:"inferno",   mat:"glut",     label:"Inferno",    rock:"#c2481f", dark:"#5a1a0a", hot:"#ffd166", air:"#ff7b3a",
   special:"feuer", sonder:"werben"},
  /* Sunflare (Schritt 107): die erste volle Woche Tagesbonus. Auffällig
     (Thomas): rotierende Strahlen weit außerhalb des Kreises. */
  {id:"sunflare",  mat:"energie",  label:"Sunflare",   rock:"#ffb43c", dark:"#a1480f", hot:"#fff2a8", air:"#ffd36a",
   special:"strahlen", sonder:"woche"},
  /* Rime (Schritt 106, Raureif): nur über zehn volle Wochen Tagesbonus.
     „Glacier" gibt es schon als Level-Design — Kennungen müssen eindeutig
     sein, sonst findet `SKINS.find` das falsche. */
  {id:"rime",      mat:"eis",      label:"Rime",       rock:"#bfe3f4", dark:"#6fa3bf", hot:"#ffffff", air:"#dff6ff",
   special:"frost", sonder:"wochen"}
];
/* Zählbare Designs: alles, was sich erspielen oder kaufen lässt. */
const SKINS_ZAHL = SKINS.filter(s => !s.sonder).length;

/* Stufenprämien: erreichte Spitzenmasse zahlt sprunghaft, nicht nur linear.
   Damit lohnt sich das Weiterwachsen statt frühem Sterben und Neustarten. */
/* Auf ein Drittel gesenkt (10.09.2026). Vorher brachte eine gute Runde rund
   2.000 Ore und die teuerste Design war in zwanzig Stunden erreicht — zu
   billig für eine Währung, die auch den Startbonus kauft. Jetzt rund 700 je
   guter Runde, etwa 3.300 pro Stunde, teuerste Design rund sechzig Stunden. */
const STAGE_BONUS = [0, 4, 14, 50, 170];

/* Namen müssen tippbar sein, sonst kann niemand einen Freund suchen.
   Erlaubt: A-Z, a-z, 0-9, Leerzeichen, Punkt, Unterstrich, Bindestrich.
   Umlaute und Akzente werden übersetzt statt verworfen (ä→ae, é→e), alles
   andere fällt weg — auch Emoji und kyrillische oder chinesische Zeichen.
   Grund: Auf einer beliebigen Tastatur der Welt muss der Name eingebbar sein. */
const NAME_MAX = 14;
const NAME_OK = /^[A-Za-z0-9 ._-]*$/;
function cleanName(raw){
  return String(raw)
    .replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue")
    .replace(/Ä/g,"Ae").replace(/Ö/g,"Oe").replace(/Ü/g,"Ue").replace(/ß/g,"ss")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")   // Akzente entfernen
    .replace(/[^A-Za-z0-9 ._-]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, NAME_MAX);
}

/* Fünf Rangstufen über die Freischaltreihenfolge. Merkmal wechselt innerhalb
   der Stufe, damit nicht alle gleich aussehen, und eskaliert über die Stufen:
   glatt → gesprenkelt → gebändert → aufgerissen → bestachelt → Splittergürtel. */
const TRAITS = [["plain","speckle"], ["speckle","bands"], ["bands","cracks"],
                ["cracks","spikes"], ["spikes","shards"]];
const ROMAN = ["","I","II","III","IV","V","VI"];
SKINS.forEach((s,i) => {
  if (s.special){ s.tier = 6; s.trait = s.special; return; }
  s.tier = Math.min(5, 1 + Math.floor(i/9));
  s.trait = TRAITS[s.tier-1][i % 2];
});
const rivalTier = () => {
  const q = Math.random();
  return q < .42 ? 1 : q < .70 ? 2 : q < .87 ? 3 : q < .96 ? 4 : 5;
};

const Profile = {
  level:1, xp:0, ore:0, skin:"basalt", best:0, friends:[], hints:new Set(),
  /* Zähler der Runden, seit die Hinweise eingeschaltet wurden. Nach zwei
     Runden ist Schluss — wer dreimal gespielt hat, kennt die Steuerung, und
     dann werden Hinweise zur Bevormundung. Über die Einstellungen holt man
     sich beides zurück. */
  hintRuns:0,

  /* Bestwerte. Sie ersetzen keine echte Rangliste — die braucht den Server —
     aber sie geben ein Ziel, gegen das man antritt: sich selbst. */
  rec:{mass:0, kills:0, time:0, royale:0, clan:0, runs:0},

  /* Zwei getrennte Währungen, und die Trennung ist die ganze Zusage:
     ORE wird ausschließlich erspielt und kauft alles, was das Spiel berührt —
     derzeit den Startbonus.
     LUMI ist die bezahlte Währung und kauft ausschließlich Designs, und
     zwar nur die, die es ohnehin für Ore gibt. Level-Designs bleiben
     unverkäuflich, sonst wäre die 2000-Stunden-Leiter käuflich und damit
     wertlos. Wer zahlt, überspringt Wartezeit — nie einen Spielvorteil. */
  boost:1,
  owned:new Set(SKINS.filter(s => s.lv === 1).map(s => s.id)),

  /* Ausgelegt auf rund 2000 Stunden bis Level 100, gerechnet mit gemessenen
     8400 XP pro Stunde. Früh geht es schnell: Level 6 nach etwa 1,5 Stunden,
     Level 20 nach 39, Level 50 nach 367. */
  xpNeeded(l){ return Math.round(425 * Math.pow(l, 1.5)); },

  addXp(n){
    if (this.level >= MAX_LEVEL) return [];
    this.xp += n;
    const gained = [];
    while (this.level < MAX_LEVEL && this.xp >= this.xpNeeded(this.level)){
      this.xp -= this.xpNeeded(this.level);
      this.level++;
      for (const s of SKINS)
        if (s.lv === this.level && !this.owned.has(s.id)){ this.owned.add(s.id); gained.push(s); }
    }
    if (this.level >= MAX_LEVEL) this.xp = 0;
    return gained;
  },
  buy(s){
    if (!s.ore || this.owned.has(s.id) || this.ore < s.ore) return false;
    this.ore -= s.ore; this.owned.add(s.id); return true;
  },
  requirement(s){
    if (this.owned.has(s.id)) return t("owned");
    if (s.sonder) return t("sk_" + s.sonder);
    return s.lv ? t("levelreq", s.lv) : t("orereq", s.ore.toLocaleString(lang));
  },
  state(s){
    if (this.owned.has(s.id)) return "owned";
    if (s.ore && this.ore >= s.ore) return "buyable";
    return "locked";
  }
};
let skin = SKINS[0];

/* =====================================================================
   GASTFORTSCHRITT — bleibt im Browser (Schritt 95)

   Bis Schritt 94 war der Fortschritt ohne Konto nach jedem Neuladen weg, und
   Onlinerunden zahlten Gästen gar nichts: Der Todesbildschirm meldete
   „Freundschaftsspiel — nur Übung", obwohl der Gast im Freien Raum gespielt
   hatte. Auf Spieleportalen spielt praktisch **jeder** als Gast (eine
   Google-Anmeldung funktioniert dort im eingebetteten Fenster gar nicht) —
   ohne gespeicherten Fortschritt hätte dort niemand einen Grund
   wiederzukommen.

   Was hier liegt, ist **Anzeige für den Gast selbst**, nicht Wahrheit für
   den Server. Wer es im Browser umschreibt, betrügt nur sich: Ranglisten,
   Ehre, Käufe und alles Kontogebundene hängen weiter ausschließlich am
   Server, und `einstellen()` übernimmt nie Level, XP oder Ore aus dem Client.
   Deshalb wird Gastfortschritt beim Anlegen eines Kontos auch **nicht**
   übernommen.

   Solange ein Sitzungstoken existiert, wird nichts geschrieben — sonst
   überschriebe der Kontostand den Gaststand. Nach dem Abmelden ist der
   Gaststand wieder da. */
/* Werbeprogramm im Client (Schritt 104). Der Code kommt vom Server; der
   Link führt auf die öffentliche Adresse mit `?w=CODE`. Ein mitgebrachter
   Code wird beim Laden gemerkt und beim Anlegen eines Kontos mitgeschickt. */
const Werben = {
  KEY: "talumi.werbecode",
  stand: null,
  ausAdresse(){
    try {
      const w = new URLSearchParams(location.search).get("w");
      if (w && /^[A-Za-z0-9]{3,12}$/.test(w)) localStorage.setItem(this.KEY, w.toUpperCase());
    } catch(_){}
  },
  gemerkt(){ try { return localStorage.getItem(this.KEY) || ""; } catch(_){ return ""; } },
  vergessen(){ try { localStorage.removeItem(this.KEY); } catch(_){} },
  link(){ return "https://talumi.io/?w=" + (this.stand ? this.stand.code : ""); },
  async laden(){
    if (!istAngemeldet()){ this.stand = null; return null; }
    const a = await Konto.ruf("/konto/werben");
    this.stand = a && a.status === 200 ? a : null;
    return this.stand;
  }
};

const Gast = {
  KEY: "talumi.gast",
  V: 1,
  laden(){
    let r = null;
    try { r = JSON.parse(localStorage.getItem(this.KEY) || "null"); } catch(_){ return; }
    if (!r || r.v !== this.V) return;
    const zahl = (x, max) => Math.max(0, Math.min(max, Math.floor(+x || 0)));
    Profile.level = Math.max(1, zahl(r.level, MAX_LEVEL));
    Profile.xp    = zahl(r.xp, 1e9);
    Profile.ore   = zahl(r.ore, 1e9);
    Profile.best  = zahl(r.best, 1e9);
    Profile.hintRuns = zahl(r.hintRuns, 99);
    if (r.rec && typeof r.rec === "object")
      for (const k in Profile.rec) Profile.rec[k] = zahl(r.rec[k], 1e9);
    const bekannt = new Set(SKINS.map(x => x.id));
    Profile.owned = new Set([
      ...SKINS.filter(x => x.lv && x.lv <= Profile.level).map(x => x.id),
      ...(Array.isArray(r.owned) ? r.owned.filter(id => bekannt.has(id)) : [])
    ]);
    if (Array.isArray(r.friends))
      Profile.friends = r.friends.map(f => cleanName(String(f)).trim())
        .filter(Boolean).slice(0, 50);
    const gew = SKINS.find(x => x.id === r.skin);
    if (gew && Profile.owned.has(gew.id)){ Profile.skin = gew.id; skin = gew; }
    if (typeof r.name === "string") this.name = cleanName(r.name).trim().slice(0, NAME_MAX);
    if (r.bonus && typeof r.bonus === "object")
      this.bonus = { tag: zahl(r.bonus.tag, 1e7), serie: Math.min(7, zahl(r.bonus.serie, 7)), wochen: zahl(r.bonus.wochen, 9999) };
    this.gutschein = [2, 3].includes(r.gutschein) ? r.gutschein : 0;
  },

  /* Name des Gastes (Schritt 95). Vorher war ein getippter Name nach dem
     Neuladen weg, und wer keinen tippte, hieß „Namenloser Körper" — auf
     einem Portal hießen dann halbe Ranglisten so. Jetzt bekommt ein Gast
     beim ersten Besuch einen Namen, den er im Menü ändern kann. Die Wörter
     überschneiden sich nicht mit den Namen der Computergegner. */
  name: "",
  NAMENSWORTE: ["Nova","Comet","Meteor","Nebula","Photon","Zenith","Aurora",
                "Astro","Cosmo","Stardust","Lumen","Vortex","Solar","Lunar"],
  /* Tagesreihe für Gäste (Schritt 96) — dieselbe Staffel wie am Server
     (`BONUS_ANZEIGE`), gezählt in Kalendertagen der Ortszeit. */
  bonus: { tag: 0, serie: 0, wochen: 0 },
  heute(){ return Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5); },
  bonusStand(){
    const h = this.heute(), b = this.bonus;
    return { offen: b.tag !== h,
             serie: (b.tag === h || b.tag === h - 1) ? b.serie : 0,
             wochen: b.wochen || 0, ziel: 10 };
  },
  bonusHolen(){
    const h = this.heute(), b = this.bonus;
    if (b.tag === h) return { fehler: "schon_abgeholt" };
    /* Im Kreis wie am Server (Schritt 106): nach Tag 7 wieder Tag 1, jede
       volle Woche zählt; nach zehn Wochen das Eis-Design. */
    const serie = b.tag === h - 1 ? (b.serie % 7) + 1 : 1;
    const wochen = (b.wochen || 0) + (serie === 7 ? 1 : 0);
    const g = BONUS_GAST[serie - 1] || {};
    const ore = g.ore || 0, xp = g.xp || 0, boost = g.boost || 0;
    this.bonus = { tag: h, serie, wochen };
    let eis = false, design = null;
    if (wochen >= 10 && !Profile.owned.has("rime")){ Profile.owned.add("rime"); eis = true; }
    if (serie === 7 && !Profile.owned.has("sunflare")){ Profile.owned.add("sunflare"); design = "sunflare"; }
    Profile.ore += ore;
    if (xp) Profile.addXp(xp);
    /* Der Gutschein gilt für die nächste lokale Runde mit Startbonus. */
    if (boost) this.gutschein = boost;
    this.sichern();
    return { ok: true, tag: serie, ore, xp, boost, ehre: 0, wochen, eis, design };
  },
  gutschein: 0,
  nameVorschlag(){
    const w = this.NAMENSWORTE[(Math.random() * this.NAMENSWORTE.length) | 0];
    return (w + " " + (10 + ((Math.random() * 990) | 0))).slice(0, NAME_MAX);
  },
  /* Seit Schritt 118 gibt es kein Namensfeld im Hangar mehr (Thomas: „das
     kann weg"). Der Gast bekommt beim ersten Besuch einen Vorschlag und
     ändert ihn in den Einstellungen. */
  nameEinsetzen(){
    if (!this.name) this.name = this.nameVorschlag();
  },
  sichern(){
    try {
      /* Freunde gehören immer dem Browser, auch mit Konto — also werden sie
         auch dann fortgeschrieben, der Rest nur ohne Sitzung. */
      const alt = JSON.parse(localStorage.getItem(this.KEY) || "null");
      const mitKonto = typeof Konto !== "undefined" && !!Konto.token;
      const d = (mitKonto && alt && alt.v === this.V) ? alt : {
        v: this.V, level: Profile.level, xp: Math.floor(Profile.xp),
        ore: Math.floor(Profile.ore), best: Math.floor(Profile.best),
        hintRuns: Profile.hintRuns, rec: Profile.rec,
        owned: [...Profile.owned], skin: Profile.skin
      };
      if (!mitKonto){
        if (this.name) d.name = this.name;
        d.bonus = this.bonus;
        d.gutschein = this.gutschein;
      }
      if (mitKonto && !(alt && alt.v === this.V)) return;
      d.friends = Profile.friends.slice(0, 50);
      localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch(_){}
  }
};
Gast.laden();
Werben.ausAdresse();

/* =====================================================================
   2b) SOUND
   Alles synthetisch über die Web Audio API — keine Dateien, keine fremden
   Rechte, kein Ladebalken. Der Kontext darf erst nach einer Nutzergeste
   starten, deshalb wird er am Startknopf geweckt.
   ===================================================================== */
const Sound = {
  ctx:null, bus:null, on:true, noise:null, last:0, keep:null,

  /* iPhones behandeln Web Audio wie einen Klingelton: Liegt der kleine
     Schalter an der Seite auf „lautlos", bleibt das Spiel stumm, obwohl
     technisch alles läuft — die häufigste Ursache für „der Ton geht nicht".
     Läuft dagegen ein gewöhnliches Audioelement, stuft iOS die Tonausgabe der
     Seite als Wiedergabe ein und lässt sie auch dann hören. Dafür genügt eine
     stille Tonspur in Dauerschleife; sie steckt als Datenadresse im Code, also
     ohne zusätzliche Datei und ohne fremde Quelle. */
  wachhalten(){
    if (this.keep) return;
    try {
      const a = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEA" +
        "RKwAAIhYAQACABAAZGF0YQAAAAA=");
      a.loop = true; a.volume = 0.0001;
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
      this.keep = a;
    } catch(_){}
  },

  unlock(){
    this.wachhalten();
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    /* Frisch erzeugte Kontexte starten auf iOS und vielen Android-Browsern im
       Zustand "suspended". Vorher lief resume() nur, wenn der Kontext schon
       existierte — beim allerersten Mal also nie, und es blieb für immer
       still. Jetzt unbedingt wecken. */
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.bus = this.ctx.createGain();
    this.bus.gain.value = Settings.volume;
    this.bus.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 0.4;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i=0;i<len;i++) d[i] = Math.random()*2-1;
  },

  tone(freq, dur, type, vol, slide){
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t+dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t+0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    o.connect(g); g.connect(this.bus);
    o.start(t); o.stop(t+dur+0.02);
  },

  burst(dur, freq, vol){
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = "bandpass";
    f.frequency.setValueAtTime(freq, t);
    f.frequency.exponentialRampToValueAtTime(freq*0.35, t+dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    s.connect(f); f.connect(g); g.connect(this.bus);
    s.start(t); s.stop(t+dur);
  },

  /* Fressen: Tonhöhe fällt mit wachsender Masse, so hört man das eigene
     Wachstum. Gedrosselt, sonst wird es bei 8 Stücken zum Maschinengewehr. */
  eat(m){
    const now = performance.now();
    if (now - this.last < 55) return;
    this.last = now;
    this.tone(760*Math.pow(m+40, -0.16)*3.4, 0.07, "sine", 0.16);
  },
  split(){ this.tone(220, 0.16, "triangle", 0.2, 90); this.burst(0.1, 1800, 0.1); },
  shedS(){ this.tone(420, 0.07, "square", 0.08, 260); },
  absorb(m){ this.tone(110 + Math.min(90, m*0.08), 0.34, "sine", 0.3, 48);
             this.burst(0.2, 700, 0.14); },
  shatter(){ this.burst(0.45, 2600, 0.34); this.tone(150, 0.4, "sawtooth", 0.16, 55); },
  pop(){ this.tone(880, 0.09, "triangle", 0.14, 1500); },
  death(){ this.tone(300, 0.9, "sine", 0.28, 44); this.burst(0.7, 500, 0.18); },
  levelUp(){ this.tone(523, 0.16, "triangle", 0.2);
             setTimeout(() => this.tone(784, 0.3, "triangle", 0.2), 150); },

  toggle(){
    this.on = !this.on;
    if (this.on){ this.unlock(); this.tone(660, 0.09, "sine", 0.16); }
    const b = $("soundBtn");
    if (b) b.textContent = this.on ? "Sound on" : "Sound off";
    return this.on;
  }
};

/* =====================================================================
   2b) MUSIK — erzeugt, nicht abgespielt
   =====================================================================

   Thomas wollte den ruhigen Aufbauspiel-Ton: lange warme Flächen, sparsame
   Arpeggien, keine Percussion, dieser einsam-staunende Klang. Übernommen ist
   die **Machart**, nicht das Stück: Stil, Klangfarbe, Tempo und Stimmung sind
   frei, geschützt sind Melodie, Harmoniefolge und Aufnahme eines fremden
   Soundtracks. Deshalb gibt es hier gar keine feste Melodie — Akkorde und
   Töne werden bei jedem Lauf neu aus einem Tonvorrat gewürfelt. Das ist
   zugleich die ehrlichste Bauweise für Ambient: Sie wiederholt sich nie.

   Kein Audiodatei-Download, keine fremde Quelle: alles entsteht im Browser
   aus Oszillatoren und einem selbst gerechneten Hall. Das hält die Regel
   „nichts von außen" ein und kostet null Bytes Auslieferung.

   Aufbau:
     Fläche   drei leicht verstimmte Oszillatoren durch ein langsam
              wanderndes Tiefpassfilter — der Teppich, auf dem alles liegt
     Bass     eine Sinuswelle zwei Oktaven tiefer, sehr langsam an und ab
     Motiv    einzelne glockige Töne aus der Tonleiter, alle paar Sekunden,
              mit viel Hall — das, was man als „Melodie" wahrnimmt
     Luft     kaum hörbares gefiltertes Rauschen gegen die Sterilität

   Die Akkorde wandern in 11–17 Sekunden ineinander. Schneller klingt es
   nach Fahrstuhl, langsamer schläft es ein. */
const Musik = {
  an:false, el:null, nr:-1, leiser:1, imSpiel:false, liste:null,
  ziel:0, blendeZeit:0,

  /* =====================================================================
     Der Soundtrack. Sechs fertig eingespielte Stücke, alle gemeinfrei (CC0).

     Vorher entstand die Musik im Browser aus Oszillatoren. Das war rechtlich
     unangreifbar und klang trotzdem nicht gut — drei Umbauten lang. Fertige
     Musik von Menschen klingt wie Musik; das ist kein Umweg, sondern der
     kürzere Weg zum Ziel.

     **Gemeinfrei heißt gemeinfrei:** CC0 verlangt keine Namensnennung und
     erlaubt jede kommerzielle Nutzung ohne Bedingung. Woher jedes Stück
     stammt, steht in `MUSIK-QUELLEN.md` — nicht weil es verlangt wäre,
     sondern damit es im Zweifel belegbar ist.

     Die Dateien liegen auf der eigenen Adresse, nicht bei einem fremden
     Anbieter. Deshalb bleibt es dabei: kein fremdes Skript, keine fremde
     Verbindung, kein Einwilligungsbanner.
     ===================================================================== */

  /* Drei Ogg und drei MP3. Welche gespielt werden können, entscheidet der
     Browser selbst (`canPlayType`) — Safari kann Ogg Vorbis lange nicht oder
     nur eingeschränkt, und ein Stück, das dort still bliebe, gehört gar nicht
     erst in die Liste. */
  STUECKE: [
    { datei:"musik-outthere.ogg",  typ:"audio/ogg; codecs=vorbis" },
    { datei:"musik-deadship.ogg",  typ:"audio/ogg; codecs=vorbis" },
    { datei:"musik-star.ogg",      typ:"audio/ogg; codecs=vorbis" },
    { datei:"musik-caller.mp3",    typ:"audio/mpeg" },
    { datei:"musik-monoliths.mp3", typ:"audio/mpeg" },
    { datei:"musik-booya.mp3",     typ:"audio/mpeg" }
  ],

  /* Was dieser Browser abspielen kann. `canPlayType` antwortet "probably",
     "maybe" oder "" — nur das leere Ergebnis ist ein sicheres Nein. */
  spielbar(){
    if (this.liste) return this.liste;
    const pruef = document.createElement("audio");
    this.liste = this.STUECKE.filter(s => {
      try { return pruef.canPlayType(s.typ) !== ""; } catch(_){ return false; }
    });
    if (!this.liste.length) this.liste = this.STUECKE.filter(s => s.typ === "audio/mpeg");
    return this.liste;
  },

  starten(){
    if (this.an || !MUSIK_AKTIV) return;
    const liste = this.spielbar();
    if (!liste.length) return;
    this.an = true;

    if (!this.el){
      this.el = new Audio();
      /* Nichts laden, solange niemand Musik hören will. Ohne diese Zeile holt
         der Browser die erste Datei schon beim Aufbau der Seite — vier
         Megabyte, die die meisten Besucher nie hören. */
      this.el.preload = "none";
      this.el.loop = false;
      this.el.addEventListener("ended", () => this.weiter());
      /* Fehlt eine Datei oder mag der Browser sie doch nicht, zum nächsten
         Stück weitergehen statt still zu bleiben. */
      this.el.addEventListener("error", () => { if (this.an) this.weiter(); });
    }

    /* Nicht immer mit demselben Stück beginnen. */
    this.nr = Math.floor(Math.random() * liste.length) - 1;
    this.weiter();
  },

  weiter(){
    if (!this.an || !this.el) return;
    const liste = this.spielbar();
    this.nr = (this.nr + 1) % liste.length;
    this.el.src = liste[this.nr].datei;
    this.el.currentTime = 0;
    this.el.volume = 0;                       // fährt in blende() hoch
    this.ziel = this.lautWert();
    this.blendeZeit = 0;
    const versuch = this.el.play();
    /* Ohne Nutzergeste lehnt der Browser das Abspielen ab. Das ist kein
       Fehler, sondern die Regel — die Musik startet dann beim ersten Tippen. */
    if (versuch && versuch.catch) versuch.catch(() => {});
  },

  lautWert(){
    return Math.max(0, Math.min(1, (Settings.music || 0) * this.leiser));
  },

  /* Im Spiel leiser: Musik, die während einer Jagd genauso laut steht wie im
     Menü, verdeckt die Töne, an denen man Gefahr erkennt. */
  ducken(imSpiel){
    this.imSpiel = !!imSpiel;
    this.leiser = imSpiel ? 0.5 : 1;
    this.lautstaerke();
  },

  lautstaerke(){
    this.ziel = this.lautWert();
    if (this.el && !this.an) this.el.volume = this.ziel;
  },

  /* Wird aus der Bildschleife gerufen und blendet die Lautstärke weich nach.
     Ein harter Sprung beim Rundenstart hört sich nach Fehler an.

     Kein eigener Zeitgeber: Browser drosseln Zeitgeber in verdeckten Tabs. */
  takt(){
    if (!this.an || !this.el) return;
    const jetzt = (typeof performance !== "undefined" ? performance.now() : Date.now());
    if (!this.blendeZeit){ this.blendeZeit = jetzt; return; }
    const dt = Math.min(0.1, (jetzt - this.blendeZeit) / 1000);
    this.blendeZeit = jetzt;
    const ist = this.el.volume;
    if (Math.abs(this.ziel - ist) < 0.005){ this.el.volume = this.ziel; return; }
    /* Exponentiell, rund eine Sekunde bis zum Ziel. */
    this.el.volume = Math.max(0, Math.min(1, ist + (this.ziel - ist) * (1 - Math.exp(-3.2*dt))));
  },

  stoppen(){
    this.an = false;
    if (!this.el) return;
    try { this.el.pause(); } catch(_){}
    /* Quelle leeren, sonst lädt der Browser im Hintergrund weiter. */
    try { this.el.removeAttribute("src"); this.el.load(); } catch(_){}
  },

  /* Ein- und ausschalten über die Einstellungen. */
  nachziehen(){
    if (!MUSIK_AKTIV){ if (this.an) this.stoppen(); return; }
    if ((Settings.music || 0) > 0){
      if (!this.an) this.starten(); else this.lautstaerke();
    } else if (this.an) this.stoppen();
  }
};

/* =====================================================================
   3) WORLD
   ===================================================================== */
/* Balance, nachgerechnet statt geraten.
   Vorher: Aufnahme wuchs mit m^0.31, Schwund linear mit m ab 300 — ab dort
   schrumpfte man immer, Protoplanet und World waren unerreichbar.
   Jetzt: dichteres Feld, wertvollere Körner, Schwund erst ab 1200 und
   flacher. Gleichgewicht liegt bei rund 9000 Masse. */
/* Karte von 4600 auf 9000 — knapp die vierfache Fläche. Trümmer, Rivalen,
   Pulsare und Sterne wachsen mit, sonst kippt die Balance: die Aufnahme hängt
   an der Dichte, nicht an der Zahl. */
/* Drei Modi. Freundschaftsspiele und Clankämpfe laufen nur auf gespiegelten
   Arenen: gleiche Startmasse, gleiche Pulsarlage auf beiden Hälften. Auf der
   offenen Karte wäre ein verabredetes Spiel unfair, weil Startposition und
   Trümmerlage zufällig sind. */
const MODES = {
  open: {
    label:"Open space", blurb:"Free-for-all on the full map. Full rewards.",
    world:9000, debris:4200, rivals:40, pulsars:42, start:24,
    teams:false, mirror:false, time:0, rewards:1
  },
  /* Seit Schritt 105 online (Server rechnet Zone, Uhr, Mannschaften); die
     Werte hier gelten nur noch für den lokalen Rückfall. */
  clan: {
    label:"Clan battle", blurb:"Two clans, mirrored arena, five minutes. Highest clan mass wins.",
    world:5200, debris:1500, rivals:18, pulsars:14, start:40,
    teams:true, mirror:true, time:300, rewards:1, online:true
  },
  royale: {
    label:"Battle royale", blurb:"Everyone starts equal, the field closes in. Last body standing wins.",
    world:6000, debris:2000, rivals:24, pulsars:20, start:50,
    teams:false, mirror:false, time:330, rewards:1, royale:true, online:true
  },
  friendly: {
    label:"Friendly match", blurb:"Mirrored arena, everyone starts equal. Practice — no rewards.",
    world:4200, debris:1000, rivals:10, pulsars:10, start:60,
    teams:false, mirror:true, time:240, rewards:0
  },
  /* Onlinebetrieb. Alle Zahlen stehen hier bei null: Trümmer, Pulsare und
     Gegner kommen vom Server, nicht aus der lokalen Erzeugung.
     `rewards:0` heißt **nicht** „zahlt nicht", sondern „rechnet hier nicht":
     Ore und XP kommen fertig vom Server (`Net.lohn`). Lokal zu rechnen hieße,
     dass sich jeder sein Guthaben selbst schreibt. */
  online: {
    label:"Open space", blurb:"Real players on an authoritative server.",
    /* `world` ist hier nur der Rückfallwert, falls die Begrüßung ihn nicht
       mitbringt — maßgeblich ist `Net.world` vom Server (siehe `start()`). */
    world:14142, debris:0, rivals:0, pulsars:0, start:24,
    teams:false, mirror:false, time:0, rewards:0, online:true
  },
  /* Liga (Schritt 108): online wie der Freie Raum, aber Level und Monde
     zählen, und stärkere Beute bringt mehr — der Server rechnet das. */
  liga: {
    label:"League", blurb:"Levels and moons count. Stronger prey pays more.",
    world:14142, debris:0, rivals:0, pulsars:0, start:24,
    teams:false, mirror:false, time:0, rewards:0, online:true, liga:true
  }
};
/* Seit Schritt 69 gibt es „Freier Raum" nur noch einmal.

   Vorher standen zwei Einträge nebeneinander: „Freier Raum" (lokal, gegen
   vierzig KI-Rivalen) und „Online" (Server). Für den Spieler war das nicht zu
   unterscheiden und auch nicht zu erklären — beides ist alle gegen alle auf
   der ganzen Karte. Jetzt ist „Freier Raum" **der** Onlinemodus; fehlende
   Mitspieler füllt der Server mit Computergegnern auf.

   Die lokale Fassung (`MODES.open`) bleibt als Rückfall bestehen: Ohne
   erreichbaren Server — offline, installiert als App, Server in Wartung —
   läuft dieselbe Runde auf dem eigenen Gerät weiter. `ersatz` merkt sich, dass
   gerade der Rückfall läuft, ohne die Auswahl im Menü zu verstellen. Vorher
   schrieb der Rückfall `modeId = "open"`, und danach blieb der Spieler
   stillschweigend für immer offline. */
/* Seit Schritt 109 ist die Liga der Hauptmodus und deshalb vorausgewählt. */
let modeId = "liga";
let ersatz = false;
/* Welcher Modus gerade wirklich läuft: im Rückfall die lokale Fassung,
   sonst der gewählte. Die Auswahl im Menü bleibt davon unberührt. */
const MODE_ID = () => (ersatz && (modeId === "online" || modeId === "liga")) ? "open" : modeId;
const MODE = () => MODES[MODE_ID()];

let WORLD = 9000, DEBRIS = 4200;
const PELLET = 3;
const MAX_CELLS = 16;
const DECAY_FROM = 1200, DECAY_RATE = 0.0009;
const STAGES = [
  {at:0,    name:"Dust",         hint:"Sweep up debris. Nothing out here is smaller than you yet."},
  {at:60,   name:"Rubble",       hint:"Craters now. You can take anything loose and slow."},
  {at:240,  name:"Planetesimal", hint:"Your core is melting. Heat shows through the cracks."},
  {at:800,  name:"Protoplanet",  hint:"An atmosphere is holding. Pulsars will shatter you now."},
  {at:2000, name:"World",        hint:"Rings and moons. Everything left is worth eating."}
];
const stageOf = m => { let s=0; for (let i=0;i<STAGES.length;i++) if (m>=STAGES[i].at) s=i; return s; };
// 40 statt 12: Auf der größeren Karte wäre es sonst leer.
const RIVALS = ["Vesta","Kepler","Nyx","Erebus","Ceres","Pallas","Tycho","Rhea",
                "Orcus","Hygiea","Sedna","Charon","Eris","Makemake","Haumea","Ixion",
                "Varuna","Quaoar","Salacia","Chiron","Pholus","Nessus","Davida","Juno",
                "Iris","Europa","Callisto","Ganymede","Titania","Oberon","Umbriel",
                "Ariel","Miranda","Dione","Tethys","Iapetus","Phoebe","Enceladus",
                "Mimas","Triton"];

/* Schrumpfplan: Zeit in Sekunden, Radius als Anteil der Kartenbreite.
   Bewusst mit Pausen — dauerhaftes Schrumpfen nimmt jede Verschnaufpause und
   fühlt sich zäh an. Zwischen den Stufen kann man sich neu aufstellen. */
const ZONE_PLAN = [[0,.48],[40,.48],[80,.36],[110,.36],[145,.26],[170,.26],
                   [205,.17],[225,.17],[260,.09],[285,.09],[315,.035]];
function zoneRadius(t){
  const P = ZONE_PLAN;
  if (t <= P[0][0]) return WORLD*P[0][1];
  for (let i=1;i<P.length;i++){
    if (t <= P[i][0]){
      const [t0,r0] = P[i-1], [t1,r1] = P[i];
      return WORLD*(r0 + (r1-r0)*((t-t0)/(t1-t0)));
    }
  }
  return WORLD*P[P.length-1][1];
}
/* Nächste Schrumpfstufe, für die Anzeige */
function zoneNext(t){
  for (let i=1;i<ZONE_PLAN.length;i++){
    if (t < ZONE_PLAN[i][0] && ZONE_PLAN[i][1] < ZONE_PLAN[i-1][1])
      return ZONE_PLAN[i-1][0] > t ? ZONE_PLAN[i-1][0]-t : 0;
  }
  return null;
}

/* Rundenziele. Drei pro Runde, aus einem Katalog gezogen, nie zwei aus
   derselben Gruppe — sonst stehen „5 Körper" und „12 Körper" nebeneinander.
   Freundschaftsspiele bekommen keine, sonst wäre die Übungsarena mit
   schwachen Gegnern der schnellste Weg zu Ore. */
const GOALS = [
  {id:"st2", group:"stage", ore:40,
   test:s => s.peak >= 240, modes:["open","clan","royale"]},
  {id:"st3", group:"stage", ore:90,
   test:s => s.peak >= 800, modes:["open","clan","royale"]},
  {id:"st4", group:"stage", ore:175,
   test:s => s.peak >= 2000, modes:["open","clan"]},
  {id:"k5",  group:"kills", ore:70,
   test:s => s.g.kills >= 5, modes:["open","clan","royale"]},
  {id:"k12", group:"kills", ore:150,
   test:s => s.g.kills >= 12, modes:["open","clan"]},
  {id:"pul", group:"pulsar", ore:85,
   test:s => s.g.pulsarSpawns >= 1, modes:["open","clan","royale"]},
  {id:"spl", group:"skill", ore:115,
   test:s => s.g.splitKills >= 1, modes:["open","clan","royale"]},
  {id:"deb", group:"debris", ore:50,
   test:s => s.g.debrisEaten >= 300, modes:["open","clan","royale"]},
  {id:"srv", group:"time", ore:75,
   test:s => s.g.t >= 180 && s.g.cells.length > 0, modes:["open"]},
  {id:"top5",group:"place", ore:100,
   test:s => s.g.placed > 0 && s.g.placed <= 5, modes:["royale"]},
  {id:"win", group:"place", ore:235,
   test:s => s.g.won, modes:["royale"]},
  {id:"clan",group:"place", ore:140,
   test:s => s.g.won, modes:["clan"]}
];

/* Einstieg für neue Spieler. Kein Tutorial, das blockiert — in diesem Genre
   steigt man in den ersten zehn Sekunden ein oder gar nicht. Stattdessen
   Hinweise, die genau dann erscheinen, wenn die Situation sie erklärt.

   Jeder Hinweis erscheint einmal pro Sitzung, nie zwei gleichzeitig, und
   zwischen zweien liegen mindestens sieben Sekunden. Abschaltbar in den
   Einstellungen. */
const HINTS = [
  {id:"move", after:1.5, test:() => true, touch:true},
  {id:"prey", test:s => s.prey},
  {id:"threat", test:s => s.threat},
  {id:"split", test:s => s.mine >= 80 && s.prey && s.preyD < 430, touch:true},
  {id:"hide", test:s => s.pulsarD < 280 && s.mine < PULSAR_BITE},
  {id:"bite", test:s => s.pulsarD < 340 && s.mine >= PULSAR_BITE},
  {id:"shed", test:s => s.mine >= 140 && s.pulsarD < 520, touch:true}
];

const Game = {running:false, online:false, debris:[], rivals:[], shed:[], cells:[], pulsars:[],
              rings:[], name:"", t:0, kills:0, shake:0,
              teams:false, left:0, result:"", safe:0,
              killer:null, lastSplit:-99, lostPieces:0,
              royale:false, zoneR:0, zoneDeath:false, placed:0, won:false,
              goals:[], debrisEaten:0, pulsarSpawns:0, splitKills:0, toast:null,
              pulsarBack:[], pulsarsEaten:0, feastSeen:false,
              hint:null, hintUntil:0, hintCheck:0,
              sparks:[], levelFx:null, xpRun:0, unlockedRun:[]};

/* Spawn-Schutz. Zwei getrennte Maßnahmen:
   1. Startplatz: aus 48 Vorschlägen der mit dem größten Abstand zu allem,
      was gefährlich ist. Verhindert das Erscheinen im Maul eines Großen.
   2. Schutzzeit: SAFE_TIME Sekunden unverwundbar. Endet sofort beim Teilen
      oder Abwerfen — sonst ließe sich der Schutz zum Angriff missbrauchen.
   Trümmer darf man währenddessen fressen, sonst wäre die Zeit verschenkt. */
const SAFE_TIME = 5;

function safeSpawn(mass, x0, x1, inside){
  let best = null, bestScore = -Infinity;
  for (let i=0;i<48;i++){
    const x = rnd(x0, x1);
    const y = inside ? rnd(WORLD*.5-inside, WORLD*.5+inside) : rnd(WORLD*.08, WORLD*.92);
    if (inside && Math.hypot(x-WORLD/2, y-WORLD/2) > inside) continue;
    let score = Infinity;
    for (const r of Game.rivals){
      if (r.m < mass*1.5) continue;             // Kleinere sind keine Gefahr
      score = Math.min(score, Math.hypot(r.x-x, r.y-y) - radiusOf(r.m));
    }
    for (const p of Game.pulsars)
      score = Math.min(score, Math.hypot(p.x-x, p.y-y) - PULSAR_R*1.5);
    if (score > bestScore){ bestScore = score; best = {x, y}; }
  }
  return best || {x:(x0+x1)/2, y:WORLD/2};
}

/* Pulsare: das Hindernis. Kleine Körper gleiten hindurch und können sich
   dahinter verstecken. Wer größer als PULSAR_BITE ist und einen ganz
   überdeckt, wird zerrissen. Mit abgeworfener Masse lassen sie sich füttern,
   bis sie einen neuen Pulsar in Wurfrichtung ausstoßen — damit wird das
   Hindernis zur Waffe gegen größere Gegner. */
const PULSAR_R = 52, PULSAR_BITE = 240, PULSAR_FEED = 5;

/* Obergrenze für ausgestoßene Pulsare. Vorher stand hier fest 22 — der offene
   Raum startet aber mit 42. Die Bedingung „weniger als 22 Pulsare im Feld" war
   dort nie erfüllt, und damit war das Füttern im meistgespielten Modus ohne
   jede Wirkung: Man warf Masse hinein und es passierte nichts. Jetzt richtet
   sich die Grenze nach dem Modus und lässt in jedem genug Luft. */
const pulsarMax = () => MODE().pulsars + 14;

/* Pulsare verschlingen. Wer sich fast maximal geteilt hat, ist am
   verwundbarsten überhaupt — acht bis sechzehn kleine Stücke, jedes einzeln
   angreifbar. Dafür darf man dann Pulsare fressen, statt an ihnen zu
   zerreißen. Hohes Risiko, hoher Ertrag, und es gibt dem Teilen einen zweiten
   Zweck neben dem Jagen.
   Bedingung ist absichtlich hart: mindestens FEAST_CELLS Stücke, und das
   einzelne Stück muss den Pulsar sauber überdecken. Ein gefressener Pulsar
   kommt nach FEAST_BACK Sekunden anderswo zurück — sonst räumt ein einziger
   Großer das Feld leer und nimmt allen Kleinen ihre Deckung. */
const PULSAR_MASS = Math.round((PULSAR_R/4)*(PULSAR_R/4));   // ≈ 169
const FEAST_CELLS = 12, FEAST_BACK = 18;
const newPulsar = (x,y) => ({
  x: x !== undefined ? x : rnd(300, WORLD-300),
  y: y !== undefined ? y : rnd(300, WORLD-300),
  vx:0, vy:0, spin: rnd(0, 6.28), fed:0
});
let peak = 0;

const radiusOf = m => Math.sqrt(m)*4.0;

/* Tempo. In Schritt 7 hatte ich den Exponenten auf −0,15 abgeflacht, damit
   Große nicht zäh wirken — damit war klein sein aber kaum noch schneller
   (Faktor 1,94 zwischen Masse 24 und 2000). Jetzt −0,24 mit Untergrenze:
   Kleine flitzen mit 200 px/s, ab etwa 1900 Masse bleibt es bei 70, damit
   Riesen zwar schwer, aber nicht unspielbar sind. Faktor jetzt 2,86.
   Wichtige Folge: Ein Kleiner entkommt einem Großen im geraden Lauf immer —
   Große müssen sich teilen, um zu treffen. Genau das ist das Spiel. */
const SPEED_BASE = 429, SPEED_EXP = 0.24, SPEED_FLOOR = 70;
const speedOf  = m => Math.max(SPEED_FLOOR, SPEED_BASE*Math.pow(m, -SPEED_EXP));

/* Stoß beim Teilen wächst mit dem Radius. Fest 820 hieß: Ein Riese mit
   Radius 379 kam keine eigene Körperlänge weit, sein Angriff verpuffte. */
const splitPush = m => 700 + radiusOf(m)*1.5;
const decayOf  = m => m > DECAY_FROM ? DECAY_RATE : 0;

/* Trümmerfarbe aus dem Thema. Im dunklen Thema bleibt sie unverändert helles
   Tintenblau; im hellen Thema wären so helle Punkte auf Sand kaum zu sehen,
   deshalb dort dunklere, warme Körner. */
const newDebris = () => {
  const d = TH().dust;
  return {x:rnd(0,WORLD), y:rnd(0,WORLD), m:1,
    c:`hsl(${rnd(d.h[0],d.h[1])} ${rnd(d.s[0],d.s[1])}% ${rnd(d.l[0],d.l[1])}%)`,
    r:rnd(2.6,4.4)};
};
const newCell = (x,y,m) => ({x,y,m,vx:0,vy:0,name:Game.name,merge:0,mine:true});
/* gid = Gruppenkennung. Teilt sich ein Rivale, tragen alle Stücke dieselbe —
   sie fressen sich nicht gegenseitig, verschmelzen wieder und zählen auf der
   Rangliste als ein Körper, genau wie beim Spieler. */
let GID = 1;
const newRival = name => {
  const tier = rivalTier();
  return {x:rnd(0,WORLD), y:rnd(0,WORLD), m:rnd(20,300), name,
    gid: GID++, vx:0, vy:0, merge:0,
    aggr: rnd(.15,.85),                       // Angriffslust, je Rivale anders
    mood:Math.random(), goal:null, retarget:0, tint:rnd(-30,36),
    tier, trait: TRAITS[tier-1][Math.random() < .5 ? 0 : 1]};
};
const bodyCount = () => new Set(Game.rivals.map(r => r.gid)).size;

let stars = [];
const seedStars = () => {
  stars = Array.from({length: Math.round(WORLD*WORLD/(Settings.lowPower ? 260000 : ECO ? 180000 : 110000))}, () => ({
    x:rnd(0,WORLD), y:rnd(0,WORLD), r:rnd(.5,1.5), a:rnd(.15,.7), d:rnd(.25,.7)}));
};
seedStars();

function start(name){
  levelBeimStart = Profile.level;
  const M = MODE();
  Musik.ducken(true);
  /* Royale und Clankampf sind online **und** lokal (Rückfall) derselbe
     Eintrag — `ersatz` entscheidet (Schritt 105). */
  Game.online = !!M.online && !ersatz;
  /* Online bestimmt der Server die Weltgröße und schickt sie in `welcome`.
     Sie hier aus der eigenen Tabelle zu nehmen, hieße: Ändert jemand die
     Karte am Server, zeichnet der Client weiter die alte Grenze — sichtbar
     als Rand, an dem nichts mehr ist, oder als Rand, über den man hinausläuft. */
  WORLD = (M.online && Net.world) ? Net.world : M.world;
  DEBRIS = M.debris;
  seedStars();

  Game.name = cleanName(name) || t("unnamed");
  Game.debris = Array.from({length:DEBRIS}, newDebris); Game.debrisVer = (Game.debrisVer | 0) + 1;
  Grid.cells = null;
  Grid.rebuild(Game.debris);   // einmal je Runde, danach nur noch Umtragen

  /* Gespiegelte Arena: Pulsare paarweise punktsymmetrisch, Startplätze der
     beiden Hälften ebenso. Damit hat keine Seite die bessere Deckung. */
  Game.pulsars = [];
  if (M.mirror){
    for (let i=0;i<M.pulsars;i+=2){
      const x = rnd(WORLD*.12, WORLD*.88), y = rnd(WORLD*.12, WORLD*.5);
      Game.pulsars.push(newPulsar(x, y), newPulsar(WORLD-x, WORLD-y));
    }
  } else {
    for (let i=0;i<M.pulsars;i++) Game.pulsars.push(newPulsar());
  }

  Game.rivals = [];
  for (let i=0;i<M.rivals;i++){
    const r = newRival(RIVALS[i % RIVALS.length]);
    if (M.teams){
      r.team = i % 2 ? 2 : 1;                 // 1 = eigener Clan, 2 = Gegner
      r.m = M.start * rnd(.9, 1.6);
      const side = r.team === 1 ? .25 : .75;
      r.x = WORLD*side + rnd(-WORLD*.12, WORLD*.12);
      r.y = rnd(WORLD*.15, WORLD*.85);
    } else if (M.mirror){
      r.m = M.start * rnd(.8, 1.4);           // niemand startet im Vorteil
    }
    Game.rivals.push(r);
  }

  Game.royale = !!M.royale;
  Game.zoneR = Game.royale ? (Game.online ? (Net.zone || 3200) : zoneRadius(0)) : 0;
  if (Game.online){ Game.left = Net.zeit || 0; Game.team = Net.team || 0; }
  Game.zoneDeath = false; Game.placed = 0; Game.won = false;

  /* Im Royale müssen alle in den Kreis, sonst stirbt die halbe Karte sofort. */
  if (Game.royale){
    const c = WORLD/2;
    for (const r of Game.rivals){
      const a = rnd(0,6.283), d = Math.sqrt(Math.random())*Game.zoneR*.88;
      r.x = c + Math.cos(a)*d; r.y = c + Math.sin(a)*d;
      r.m = M.start * rnd(.92, 1.12);        // alle starten praktisch gleich
    }
    Game.pulsars = Game.pulsars.filter(p =>
      Math.hypot(p.x-c, p.y-c) < Game.zoneR*.9);
  }

  Game.teams = M.teams;
  Game.left = M.time;
  Game.result = "";
  Game.rings = []; Game.shake = 0;
  Game.shed = [];
  /* Bonus nur im offenen Modus. Die gespiegelten Arenen sind ausdrücklich
     als faire Karten gebaut — ein Startvorteil dort wäre ein Widerspruch. */
  /* Lokaler Startbonus nur ohne Konto. Bei einem Konto liegt das Ore auf dem
     Server: Hier abzubuchen würde die Anzeige senken, ohne dass der Server
     davon weiß — beim nächsten Neuladen wäre es wieder da. Im Onlinebetrieb
     bucht der Server ab, siehe `welcome`. */
  let startMass = M.start;
  if (MODE_ID() === "open" && Profile.boost > 1 && !Konto.angemeldet()){
    const cost = BOOST_COST[Profile.boost];
    if (Gast.gutschein === Profile.boost){
      /* Gutschein aus dem Tagesbonus: diese eine Runde kostet nichts. */
      Gast.gutschein = 0;
      Gast.sichern();
      startMass = M.start * Profile.boost;
    } else if (Profile.ore >= cost){
      Profile.ore -= cost;
      Gast.sichern();
      startMass = M.start * Profile.boost;
    } else {
      Profile.boost = 1;
      setTimeout(() => toast(t("boostpoor")), 400);
    }
  }

  const spot = M.teams ? safeSpawn(M.start, WORLD*.06, WORLD*.32)
             : Game.royale ? safeSpawn(M.start, WORLD*.5-Game.zoneR*.8,
                                                WORLD*.5+Game.zoneR*.8, Game.zoneR*.85)
                           : safeSpawn(M.start, WORLD*.08, WORLD*.92);
  Game.cells = [newCell(spot.x, spot.y, startMass)];
  Game.safe = SAFE_TIME;
  Game.running = true; Game.t = 0; Game.kills = 0; peak = 0;
  document.body.classList.add("playing");
  // Die Anzeige gehört zur laufenden Runde. Die Menüs sind absichtlich leicht
  // durchscheinend, damit das Sternenfeld dahinter zu sehen ist — eine
  // Masseanzeige von 0 und leere Aufgaben sollen dabei nicht mitscheinen.
  $("hud").hidden = false;
  Portal.gameplayStart();
  Game.killer = null; Game.lastSplit = -99; Game.lostPieces = 0;
  Game.debrisEaten = 0; Game.pulsarSpawns = 0; Game.splitKills = 0;
  Game.pulsarBack = []; Game.pulsarsEaten = 0; Game.feastSeen = false;
  Game.hint = null; Game.hintUntil = 0; Game.hintCheck = 0;
  Game.sparks = []; Game.levelFx = null; Game.xpRun = 0; Game.unlockedRun = [];
  if (Settings.hints) Profile.hintRuns++;
  Game.toast = null;
  Game.goals = [];
  if (M.rewards > 0){
    const pool = GOALS.filter(g => g.modes.includes(modeId));
    for (let i=pool.length-1;i>0;i--){                     // mischen
      const j = (Math.random()*(i+1))|0;
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const used = new Set();
    for (const g of pool){
      if (Game.goals.length >= 3) break;
      if (used.has(g.group)) continue;
      used.add(g.group);
      Game.goals.push({def:g, done:false});
    }
  }
  stick.active = false; stick.dx = 0; stick.dy = -1;
  ptr.x = VW/2; ptr.y = VH/2 - 1;
  Integrity.reset();
  hideAll();
  goImmersive();
  // Die Verbindung steht im Onlinebetrieb schon: verbindenDannStarten() ruft
  // start() erst, wenn der Server "welcome" geschickt hat.
}

/* Maus: Richtung ergibt sich aus der Zeigerposition zur Bildmitte.
   Finger: das geht nicht, weil der Daumen die eigene Zelle verdeckt. Daher
   ein relativer Stick — irgendwo aufsetzen und in die Wunschrichtung ziehen.
   Beim Loslassen bleibt die Richtung stehen, wie in anderen .io-Spielen. */
const ptr = {x:0, y:0};
const stick = {active:false, id:null, ox:0, oy:0, x:0, y:0, dx:0, dy:-1};
let STICK_MAX = 62;
const STICK_DEAD = 7;

function onPointer(e){
  Integrity.pointer(e, e.clientX, e.clientY);
  if (e.pointerType === "touch" || e.pointerType === "pen"){
    if (e.type === "pointerdown"){
      stick.active = true; stick.id = e.pointerId;
      stick.ox = stick.x = e.clientX; stick.oy = stick.y = e.clientY;
      cvs.setPointerCapture(e.pointerId);
      return;
    }
    if (!stick.active || e.pointerId !== stick.id) return;
    stick.x = e.clientX; stick.y = e.clientY;
    let dx = stick.x-stick.ox, dy = stick.y-stick.oy;
    const l = Math.hypot(dx,dy);
    if (l > STICK_DEAD){ stick.dx = dx/l; stick.dy = dy/l; }
    if (l > STICK_MAX){                       // Ursprung nachziehen
      stick.ox = stick.x - stick.dx*STICK_MAX;
      stick.oy = stick.y - stick.dy*STICK_MAX;
    }
  } else {
    ptr.x = e.clientX; ptr.y = e.clientY;
  }
}
cvs.addEventListener("pointermove", onPointer);
cvs.addEventListener("pointerdown", onPointer);
cvs.addEventListener("pointerup", e => {
  if (e.pointerId === stick.id) stick.active = false;
});
cvs.addEventListener("pointercancel", () => { stick.active = false; });
cvs.addEventListener("contextmenu", e => e.preventDefault());

addEventListener("keydown", e => {
  if (!Game.running || Integrity.locked) return;
  if (e.code === "Space"){ e.preventDefault(); if (Integrity.mayAct()) split(); }
  if (e.code === "KeyW"){ if (Integrity.mayAct()) shed(); }
  if (e.code === "KeyM"){
    Settings.volume = Settings.volume > 0 ? 0 : 0.22;
    applySetting("volume");
  }
});

function padPress(fn){
  return e => {
    e.preventDefault(); e.stopPropagation();
    if (!Game.running || Integrity.locked) return;
    if (Integrity.mayAct()) fn();
  };
}
$("padSplit").addEventListener("pointerdown", padPress(() => split()));
$("padShed").addEventListener("pointerdown", padPress(() => shed()));

function aim(){
  if (isTouch) return [stick.dx, stick.dy];
  const dx = ptr.x-VW/2, dy = ptr.y-VH/2, l = Math.hypot(dx,dy)||1;
  return [dx/l, dy/l];
}

/* Zielpunkt in Weltkoordinaten. Entscheidend nach dem Teilen: alle Stücke
   laufen auf denselben Punkt zu und finden dadurch wieder zusammen. Würde
   jedes Stück nur einer Richtung folgen, driften sie für immer auseinander,
   weil kleine Stücke schneller sind als große. */
function aimTarget(){
  if (isTouch){
    const [cx,cy] = centre();
    return [cx + stick.dx*900, cy + stick.dy*900];
  }
  return [cam.x + (ptr.x-VW/2)/cam.z, cam.y + (ptr.y-VH/2)/cam.z];
}

/* Wartezeit bis zum Verschmelzen, abhängig von der Masse. */
const mergeDelay = m => clamp(8 + Math.sqrt(m)*0.35, 8, 24);
function centre(){
  let x=0,y=0,m=0;
  for (const c of Game.cells){ x+=c.x*c.m; y+=c.y*c.m; m+=c.m; }
  return m ? [x/m,y/m,m] : [WORLD/2,WORLD/2,0];
}

/* Eigenbewegung, allein stehend. Der Onlinebetrieb braucht sie zur
   Vorausberechnung in genau derselben Form, in der der Server sie rechnet
   (sim.js, schritt) — jede Abweichung zeigt sich als Zerren an der eigenen
   Zelle, weil die Korrektur dann dauernd gegen die eigene Rechnung arbeitet. */
function moveOwnCells(dt, tx, ty){
  const decay = Math.exp(-2.4*dt);          // Stoß rollt über etwa eine Sekunde aus
  for (const c of Game.cells){
    const ax = tx-c.x, ay = ty-c.y, l = Math.hypot(ax,ay)||1;
    // Nahe am Ziel abbremsen, sonst zittern die Stücke um den Punkt herum.
    const ease = clamp(l/(radiusOf(c.m)+40), 0, 1);
    const v = speedOf(c.m)*ease;
    c.x += (ax/l*v + c.vx)*dt;
    c.y += (ay/l*v + c.vy)*dt;
    c.vx *= decay; c.vy *= decay;
    c.merge = Math.max(0, c.merge-dt);
    c.m *= Math.pow(1-decayOf(c.m), dt);
    bound(c, dt);
  }
}
function split(){
  /* Online entscheidet der Server, ob geteilt wird — er kennt Masse und
     Zellenzahl verbindlich. Lokal zu teilen und gleich darauf vom
     Serverstand überschrieben zu werden, flackert nur. */
  if (Game.online){
    /* `"split"` als Text, nicht die Funktion `split`: `Net.send` steckt das
       Argument in `JSON.stringify`, und eine Funktion fällt dort ersatzlos
       heraus — gesendet wurde `{"seq":42}` statt `{"kind":"split","seq":42}`.
       Der Server prüft `typeof m.kind !== "string"` und verwarf die Nachricht
       stillschweigend. Teilen und Abwerfen haben online deshalb **nie**
       funktioniert, seit der Client an den Server angebunden wurde
       (Commit a79fc7c). Gemeldet hat es Thomas am 15.09.2026. */
    Net.send("split");
    if (Game.cells.some(c => c.m >= 36)){ Game.lastSplit = Game.t; Sound.split(); }
    return;
  }
  const born = [], [dx,dy] = aim();
  for (const c of Game.cells){
    if (c.m < 36 || Game.cells.length+born.length >= MAX_CELLS) continue;
    c.m /= 2;
    const wait = mergeDelay(c.m);
    const k = newCell(c.x+dx*radiusOf(c.m)*1.05, c.y+dy*radiusOf(c.m)*1.05, c.m);
    // Nur das abgestoßene Stück bekommt Schwung, das Mutterstück bleibt stehen.
    const push = splitPush(c.m);
    k.vx = dx*push; k.vy = dy*push;
    k.merge = c.merge = wait;
    born.push(k);
  }
  if (born.length){
    Game.safe = 0; Game.lastSplit = Game.t;
    /* Sichtbarer Abstoß: Druckwelle am Ursprung und Funken in Wurfrichtung.
       Ohne das wirkt das Teilen wie ein Sprung ohne Ursache. */
    for (const k of born){
      ring(k.x, k.y, radiusOf(k.m)*3.4, skin.hot);
      burst(k.x, k.y, 10, skin.air, 300);
    }
    Sound.split(); Net.send("split");
  }
  Game.cells.push(...born);
}
/* Abwurf kostet einen Anteil der eigenen Masse statt fester 8. Damit wird
   das Geschoss mit dem Körper größer — vorher schoss ein Planet dieselben
   Krümel wie ein Staubkorn. Untergrenze 8, damit es früh spürbar bleibt,
   Obergrenze 260, damit sich niemand in einem Wurf halbiert. */
const SHED_COST = m => clamp(m*0.035, 8, 260);

function shed(){
  /* Wie beim Teilen: `"shed"` als Text, nicht die Funktion `shed`. */
  if (Game.online){ Net.send("shed"); Sound.shedS(); return; }
  const [dx,dy] = aim();
  let fired = false;
  for (const c of Game.cells){
    const cost = SHED_COST(c.m);
    if (c.m < cost*2.6) continue;          // nie unter ein Drittel schrumpfen
    c.m -= cost;
    const load = cost*0.78;                // Rest verpufft: Abwerfen kostet
    Game.shed.push({x:c.x+dx*radiusOf(c.m), y:c.y+dy*radiusOf(c.m),
      vx:dx*680, vy:dy*680, m:load, c:skin.rock, r:radiusOf(load),
      hot:skin.hot, tier:skin.tier || 1});
    fired = true;
  }
  if (fired){ Game.safe = 0; Sound.shedS(); Net.send("shed"); }
}

/* XP fällt jetzt während der Runde an statt erst am Ende. Nur so kann ein
   Levelaufstieg mitten im Spiel gefeiert werden. Die Summe bleibt identisch:
   0,6 je gewonnener Spitzenmasse plus 40 je verschlungenem Körper. */
function addXpLive(n){
  if (!Game.running || MODE().rewards <= 0) return;
  Game.xpRun += n;
  const vorher = Profile.level;
  const neu = Profile.addXp(n);
  if (Profile.level <= vorher) return;

  if (neu.length){
    skin = neu[neu.length-1];          // sofort tragen, mitten im Spiel
    Game.unlockedRun.push(...neu);
  }
  Game.levelFx = {life:3.0, level:Profile.level, skin: neu.length ? neu[neu.length-1].label : null};
  Sound.levelUp();
  const [cx, cy] = centre();
  ring(cx, cy, radiusOf(Math.max(30, Game.cells.reduce((s,c)=>s+c.m,0)))*4.5, TH().brass);
  burst(cx, cy, 26, TH().brass, 420);
}

/* Funken: kurzlebige Punkte für Teilen, Levelaufstieg und Treffer. */
function burst(x, y, n, colour, speed){
  for (let i=0;i<n;i++){
    const a = rnd(0, 6.283), v = rnd(speed*.35, speed);
    Game.sparks.push({x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v,
                      life:rnd(.45,.95), colour, r:rnd(1.6,3.4)});
  }
}

function ring(x, y, max, colour){
  Game.rings.push({x, y, r: max*0.2, max, life:1, colour});
}

/* Zerreißen an einem Pulsar. Beim Spieler in viele Stücke, beim Gegner
   als harter Massenverlust — Gegner sind Einzelkörper. */
function shatter(cell){
  Sound.shatter(); ring(cell.x, cell.y, radiusOf(cell.m)*2.4, TH().shatter);
  Game.shake = Math.min(1, Game.shake + .6);
  /* Der Pulsar soll zerlegen, nicht nur wehtun. Vorher behielt der
     Mutterkörper 45 % und es flogen höchstens acht Stücke weg — man blieb
     danach der größte Brocken im Bild und spielte fast unbeirrt weiter.
     Gemeint ist das Gegenteil: Wer hineinfliegt, zerfällt in viele kleine
     Teile und wird für kurze Zeit zur leichten Beute auch für Kleinere. Genau
     das macht den Pulsar zur Waffe des Unterlegenen.
     Jetzt behält der Mutterkörper nur ein knappes Viertel, der Rest verteilt
     sich auf bis zu zwölf Stücke. Der Aufprallverlust sinkt dafür von 15 auf
     10 % — die Strafe liegt in der Zerlegung, nicht im Schwund. */
  const room = MAX_CELLS - Game.cells.length;
  if (room <= 0){ cell.m *= .82; return; }
  const gesamt = cell.m * .90;
  const mutter = gesamt * .22;
  const rest   = gesamt - mutter;
  const minStk = Math.max(24, gesamt*.045);
  const parts  = clamp(Math.floor(rest/minStk), 2, Math.min(room, 12));
  const each   = rest / parts;

  cell.m = mutter; cell.merge = mergeDelay(mutter);
  for (let i=0;i<parts;i++){
    const a = (i/parts)*6.283 + rnd(-.25,.25);
    const k = newCell(cell.x + Math.cos(a)*8, cell.y + Math.sin(a)*8, each);
    k.vx = Math.cos(a)*rnd(380, 640); k.vy = Math.sin(a)*rnd(380, 640);
    k.merge = mergeDelay(each);
    Game.cells.push(k);
  }
}

/* Gitter für die Trümmerprüfung. Vorher prüfte jeder Körper gegen alle
   Trümmer: mit 40 Rivalen und 4200 Trümmern wären das 170 000 Abstände pro
   Bild. Jetzt nur noch die Felder, die der Körper wirklich überdeckt. */
const Grid = {
  size:300, cols:0, cells:null,
  /* Trümmer bewegen sich nie. Trotzdem wurde das Gitter bisher in JEDEM Bild
     komplett neu aufgebaut — 1.225 Felder leeren und 4.200 Einträge schreiben,
     sechzigmal pro Sekunde, für nichts. Jetzt einmal bauen und beim Ersetzen
     eines Trümmerstücks nur dessen Feld umtragen. */
  rebuild(list){
    const cols = Math.ceil(WORLD/this.size), n = cols*cols;
    this.cols = cols;
    this.cells = Array.from({length:n}, () => []);
    for (let i=0;i<list.length;i++) this.put(list[i], i);
  },
  feld(o){
    const cx = clamp(Math.floor(o.x/this.size), 0, this.cols-1);
    const cy = clamp(Math.floor(o.y/this.size), 0, this.cols-1);
    return cy*this.cols + cx;
  },
  put(o, i){
    if (!this.cells) return;
    o.feld = this.feld(o);
    this.cells[o.feld].push(i);
  },
  /* Muss mit dem ALTEN Objekt aufgerufen werden, bevor es ersetzt wird —
     nur das kennt sein Feld. Beim ersten Versuch lief es auf dem neuen
     Objekt, dessen Feld noch undefiniert war; der alte Eintrag blieb stehen
     und das Gitter füllte sich mit Doppelten. */
  drop(o, i){
    if (!this.cells || o.feld === undefined) return;
    const b = this.cells[o.feld];
    if (!b) return;
    const k = b.indexOf(i);
    if (k >= 0) b.splice(k, 1);
  },
  near(x, y, r, fn){
    const s = this.size, c = this.cols;
    const x0 = clamp(Math.floor((x-r)/s),0,c-1), x1 = clamp(Math.floor((x+r)/s),0,c-1);
    const y0 = clamp(Math.floor((y-r)/s),0,c-1), y1 = clamp(Math.floor((y+r)/s),0,c-1);
    for (let gy=y0; gy<=y1; gy++)
      for (let gx=x0; gx<=x1; gx++){
        const b = this.cells[gy*c+gx];
        for (let k=0;k<b.length;k++) fn(b[k]);
      }
  }
};

const eats = (a,b) => a.m >= b.m*1.22 &&
  Math.hypot(a.x-b.x, a.y-b.y) < radiusOf(a.m)-radiusOf(b.m)*.55;
/* Flexibler Rand. Vorher klemmte der Mittelpunkt bei genau r, der Körper
   berührte die Wand also nur. Folge: Ein Kleiner in der Ecke war für einen
   Großen rechnerisch NIE erreichbar — bei 2000 gegen 60 lag der kleinste
   mögliche Abstand bei 209 px, nötig wären unter 162 gewesen. Jetzt darf der
   Mittelpunkt bis auf 35 % des eigenen Radius an die Wand, der Körper hängt
   also über. Zurückgedrückt wird weich, nicht mit einem harten Anschlag. */
const EDGE_HANG = 0.35;
function bound(o, dt){
  const r = radiusOf(o.m), lim = r*EDGE_HANG;
  const k = Math.min(1, (dt || 1/60)*7);
  if (o.x < lim)        o.x += (lim-o.x)*k;
  if (o.y < lim)        o.y += (lim-o.y)*k;
  if (o.x > WORLD-lim)  o.x += (WORLD-lim-o.x)*k;
  if (o.y > WORLD-lim)  o.y += (WORLD-lim-o.y)*k;
  o.x = clamp(o.x, -r*0.6, WORLD+r*0.6);      // harte Notbremse
  o.y = clamp(o.y, -r*0.6, WORLD+r*0.6);
}

function rivalSplit(r, t){
  const dx = t.x-r.x, dy = t.y-r.y, l = Math.hypot(dx,dy)||1;
  r.m /= 2;
  const wait = mergeDelay(r.m);
  const k = Object.assign({}, r, {
    x: r.x + dx/l*radiusOf(r.m)*1.05, y: r.y + dy/l*radiusOf(r.m)*1.05,
    vx: dx/l*splitPush(r.m), vy: dy/l*splitPush(r.m), merge: wait, goal: t, retarget: 1.1
  });
  r.merge = wait; r.vx = 0; r.vy = 0;
  Game.rivals.push(k);
}

/* Ein Pulsartreffer zerlegt einen Rivalen genauso wie den Spieler
   (`shatter()`) und wie den Onlinebetrieb (`zersplittern()` in `sim.js`).

   Vorher stand hier eine Sonderregel: Der Getroffene verlor 38 % Masse und
   lief weg — er blieb ein einziger Körper. Wer einen Pulsar auf jemanden
   schoss, sah also etwas völlig anderes als das, was ihm selbst beim
   Hineinfliegen passiert, und die Waffe wirkte, als täte sie nichts. Die
   Teilstücke tragen dieselbe `gid` und wachsen deshalb später von allein
   wieder zusammen, genau wie nach einem Teilungsangriff.

   Die vier Zahlen sind dieselben wie in `shatter()`; `test.js` vergleicht
   sie bei jedem Lauf. */
function rivalShatter(r, px, py){
  ring(r.x, r.y, radiusOf(r.m)*2.4, TH().shatter);
  const eigene = Game.rivals.reduce((n,x) => n + (x.gid === r.gid ? 1 : 0), 0);
  const room = Math.min(MAX_CELLS - eigene, 96 - Game.rivals.length);
  if (room <= 0){ r.m *= .82; return; }
  const gesamt = r.m * .90;
  const mutter = gesamt * .22;
  const rest   = gesamt - mutter;
  const minStk = Math.max(24, gesamt*.045);
  const parts  = clamp(Math.floor(rest/minStk), 2, Math.min(room, 12));
  const each   = rest / parts;

  /* Weg vom Pulsar, sonst treiben die Stücke gleich wieder hinein. */
  const fx = r.x-px, fy = r.y-py, fl = Math.hypot(fx, fy) || 1;
  const flucht = () => ({x: r.x + fx/fl*900, y: r.y + fy/fl*900});

  r.m = mutter; r.merge = mergeDelay(mutter); r.vx = 0; r.vy = 0;
  r.goal = flucht(); r.retarget = 1.4;
  for (let i=0;i<parts;i++){
    const a = (i/parts)*6.283 + rnd(-.25,.25);
    Game.rivals.push(Object.assign({}, r, {
      x: r.x + Math.cos(a)*8, y: r.y + Math.sin(a)*8, m: each,
      vx: Math.cos(a)*rnd(380, 640), vy: Math.sin(a)*rnd(380, 640),
      merge: mergeDelay(each), goal: flucht(), retarget: 1.4
    }));
  }
}

/* Zielwahl der Rivalen. Die Reihenfolge ist die Entscheidung: Zone schlägt
   Überleben, Überleben schlägt Jagd, Jagd schlägt Fressen. Vorher gab es nur
   „flieh oder friss" in einem Radius von 480 — Teilungsangriffe kamen nie vor,
   und wer floh, rannte sich in die Ecke. */
function rivalGoal(r){
  const cx = WORLD/2, cy = WORLD/2;

  if (Game.royale && Math.hypot(r.x-cx, r.y-cy) > Game.zoneR*.86)
    return {x:cx, y:cy};

  const others = Game.safe > 0 ? Game.rivals : [...Game.rivals, ...Game.cells];
  const foe = o => !(o === r || o.gid === r.gid ||
                     (Game.teams && (o.team === r.team || (o.mine && r.team === 1))));

  // Gefahr — mit Teilungsreichweite: wer doppelt so groß ist, erreicht weiter
  let threat = null, td = Infinity;
  for (const o of others){
    if (!foe(o) || o.m < r.m*1.15) continue;
    const d = Math.hypot(o.x-r.x, o.y-r.y);
    const reach = (o.m > r.m*2.6 ? 460 : 320) + radiusOf(o.m);
    if (d < reach && d < td){ td = d; threat = o; }
  }
  if (threat){
    // Pulsar als Schild: der Verfolger zerreißt daran, man selbst nicht
    if (threat.m > PULSAR_BITE && r.m < PULSAR_BITE){
      let p = null, pd = 780;
      for (const q of Game.pulsars){
        const d = Math.hypot(q.x-r.x, q.y-r.y);
        if (d < pd){ pd = d; p = q; }
      }
      if (p) return {x:p.x, y:p.y};
    }
    const ax = r.x*2-threat.x, ay = r.y*2-threat.y;
    return {x: ax*.72 + cx*.28, y: ay*.72 + cy*.28};   // Zug zur Mitte gegen Ecken
  }

  // Beute: nicht die nächste, sondern die lohnendste. Im Clankampf führt das
  // von selbst dazu, dass mehrere denselben Gegner nehmen.
  let prey = null, best = Infinity;
  for (const o of others){
    if (!foe(o) || r.m < o.m*1.25) continue;
    const d = Math.hypot(o.x-r.x, o.y-r.y);
    if (d > 900) continue;
    const worth = d - o.m*.4;
    if (worth < best){ best = worth; prey = o; }
  }
  if (prey){
    /* Auch auf der Jagd Pulsare meiden — und zwar entlang des WEGES, nicht
       nur nach Entfernung. Vorher prüfte die KI Pulsare erst, wenn es gar
       keine Beute gab; deshalb fuhr sie schnurstracks in den Pulsar, hinter
       dem sich jemand versteckte. Genau darauf zielt das Verstecken ab, aber
       die KI soll es erkennen statt blind hineinzulaufen.
       Gerechnet wird der kürzeste Abstand der Strecke Rivale→Beute zum
       Pulsarmittelpunkt. Liegt er zu klein, wird seitlich ausgewichen. */
    if (r.m > PULSAR_BITE*0.8){
      const bahn = (px, py) => {
        const vx = prey.x-r.x, vy = prey.y-r.y;
        const len2 = vx*vx + vy*vy || 1;
        let tt = ((px-r.x)*vx + (py-r.y)*vy) / len2;
        tt = clamp(tt, 0, 1);
        return Math.hypot(r.x + vx*tt - px, r.y + vy*tt - py);
      };
      const platz = radiusOf(r.m)*0.7 + PULSAR_R;
      for (const p of Game.pulsars){
        if (bahn(p.x, p.y) > platz) continue;
        // seitlich am Pulsar vorbei, Richtung Beute beibehalten
        const vx = prey.x-r.x, vy = prey.y-r.y, l = Math.hypot(vx,vy)||1;
        const seite = ((p.x-r.x)*vy - (p.y-r.y)*vx) > 0 ? -1 : 1;
        const ausweich = platz + 90;
        return {x: p.x + (-vy/l)*ausweich*seite, y: p.y + (vx/l)*ausweich*seite};
      }
    }
    const d = Math.hypot(prey.x-r.x, prey.y-r.y);
    if (r.m > 60 && r.merge === 0 && r.m > prey.m*2.8 && Game.rivals.length < 80 &&
        d < radiusOf(r.m) + 300 && d > radiusOf(r.m)*.7 && Math.random() < r.aggr)
      rivalSplit(r, prey);
    return prey;
  }

  if (r.m > PULSAR_BITE*.8){
    for (const p of Game.pulsars)
      if (Math.hypot(p.x-r.x, p.y-r.y) < radiusOf(r.m) + PULSAR_R + 70)
        return {x:r.x*2-p.x, y:r.y*2-p.y};
  }

  // Trümmer über das Gitter statt über alle 4200 Stücke
  let goal = null, bd = Infinity;
  if (Grid.cells) Grid.near(r.x, r.y, 460, i => {
    const d = Game.debris[i];
    if (!d) return;
    const q = (d.x-r.x)**2 + (d.y-r.y)**2;
    if (q < bd){ bd = q; goal = d; }
  });
  if (!goal) for (const d of Game.debris){
    const q = (d.x-r.x)**2 + (d.y-r.y)**2;
    if (q < bd){ bd = q; goal = d; }
  }
  return goal;
}

function toast(text){ Game.toast = {text, life:3.4}; }

/* Meilensteine feiern (Schritt 103, Thomas: „bei Level Up und so weiter soll
   dieser noch besser ersichtlich sein"; Poki: „Congratulate the player at
   every milestone"). Ein Banner oben in der Abrechnung — große Zahl bzw.
   Abzeichen, kurz eingeblendet, mit Ton. Kein Konfetti über dem Spielfeld:
   Der Ergebnisbildschirm liegt bewusst über dem eingefrorenen Feld, und
   darauf soll man sehen, was gerade passiert ist. */
let levelBeimStart = 1;
/* Bildchen für Ore und XP in der Abrechnung (Schritt 103, Thomas' Wunsch).
   Kleine Pfade in Messing, wie die Rangabzeichen — keine Bilddateien. */
const ICON_ORE = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10l4 6-9 11L3 10z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M3 10h18M9 4l3 6 3-6M12 10v11" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".7"/></svg>`;
const ICON_XP  = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
function feierHtml({ level = 0, namen = [], rang = -1 } = {}){
  let html = "";
  if (level > 0){
    html += `<div class="feier"><small>${esc(t("f_level"))}</small><b class="gross">${level}</b>` +
            (namen.length ? `<span>${esc(t("f_frei", namen.join(", ")))}</span>` : "") + `</div>`;
  }
  if (rang >= 0){
    html += `<div class="feier rang"><small>${esc(t("f_rang"))}</small><canvas width="192" height="112" data-stufe="${rang}"></canvas>` +
            `<b>${esc(t("rk" + clamp(rang, 0, RANG_MAX)))}</b></div>`;
  }
  return html;
}
function feierMalen(){
  for (const c of document.querySelectorAll(".feier canvas[data-stufe]")){
    const g = c.getContext("2d"); g.clearRect(0, 0, c.width, c.height);
    abzeichen(g, 0, 0, +c.dataset.stufe, 112);
  }
}

/* Lage einmal zusammenfassen und alle Hinweise dagegen prüfen. Läuft 2,5-mal
   pro Sekunde, nicht in jedem Bild — 40 Rivalen und 42 Pulsare abzutasten
   lohnt sich nicht sechzigmal. */
const HINT_RUNS = 2;
function checkHints(){
  if (!Settings.hints || Profile.hintRuns > HINT_RUNS) return;
  if (!Game.running || Game.t < 0.5) return;
  if (Game.t < Game.hintUntil || Game.t < Game.hintCheck) return;
  Game.hintCheck = Game.t + 0.4;

  const [cx, cy] = centre();
  let mine = 0;
  for (const c of Game.cells) mine = Math.max(mine, c.m);

  let prey = null, preyD = Infinity, threat = false;
  for (const r of Game.rivals){
    const d = Math.hypot(r.x-cx, r.y-cy);
    if (d > 560) continue;
    if (mine > r.m*1.25 && d < preyD){ prey = r; preyD = d; }
    if (r.m > mine*1.25) threat = true;
  }
  let pulsarD = Infinity;
  for (const p of Game.pulsars)
    pulsarD = Math.min(pulsarD, Math.hypot(p.x-cx, p.y-cy));

  const s = {mine, prey, preyD, threat, pulsarD};
  for (const h of HINTS){
    if (Profile.hints.has(h.id)) continue;
    if (h.after && Game.t < h.after) continue;
    if (!h.test(s)) continue;
    Profile.hints.add(h.id);
    Game.hint = t("h_" + h.id + (isTouch && h.touch ? "_t" : ""));
    Game.hintUntil = Game.t + 7;      // Anzeigedauer und zugleich Sperrfrist
    break;
  }
}

function checkGoals(){
  if (!Game.goals.length) return;
  const s = {g:Game, peak, mine: Game.cells.reduce((a,c) => a+c.m, 0)};
  for (const it of Game.goals){
    if (it.done || !it.def.test(s)) continue;
    it.done = true;
    toast(t("g_"+it.def.id) + "  +" + it.def.ore + " Ore");
    Sound.levelUp();
  }
}

/* Funken, Ringe, Levelanzeige und Erschütterung altern lassen (Schritt 98).
   Stand bis v78 nur in `step()` — und das läuft **nur offline**. Online
   ersetzt `Net.schritt()` den Schritt, also alterte dort nichts: Jeder Ring
   aus einem Zersplittern-Ereignis blieb für immer als gelber Kreis auf der
   Karte, und jeder Funke wurde bis zum Rundenende in jedem Bild gezeichnet.
   Nach ein paar Minuten waren das Tausende — das Spiel ruckelte, bis man sich
   kaum noch bewegte. */
function effekteAltern(dt){
  // Funken bewegen
  for (let i=Game.sparks.length-1;i>=0;i--){
    const s = Game.sparks[i];
    s.x += s.vx*dt; s.y += s.vy*dt;
    s.vx *= Math.exp(-3.2*dt); s.vy *= Math.exp(-3.2*dt);
    s.life -= dt;
    if (s.life <= 0) Game.sparks.splice(i,1);
  }
  if (Game.levelFx){
    Game.levelFx.life -= dt;
    if (Game.levelFx.life <= 0) Game.levelFx = null;
  }

  // Ringe und Erschütterung abklingen lassen
  for (let i=Game.rings.length-1;i>=0;i--){
    const g = Game.rings[i];
    g.life -= dt*1.9; g.r += (g.max-g.r)*Math.min(1, dt*6);
    if (g.life <= 0) Game.rings.splice(i,1);
  }
  Game.shake = Math.max(0, Game.shake - dt*2.4);
}

function step(dt){
  if (Game.online){ Net.schritt(dt); return; }
  Game.t += dt;
  if (Game.safe > 0) Game.safe = Math.max(0, Game.safe - dt);
  if (Game.toast) Game.toast.life -= dt;
  checkGoals();
  checkHints();

  if (Game.royale){
    Game.zoneR = zoneRadius(Game.t);
    const cx = WORLD/2, cy = WORLD/2;
    // Außerhalb zehrt es an der Masse — schnell genug, um zu drängen
    for (const c of Game.cells)
      if (Math.hypot(c.x-cx, c.y-cy) > Game.zoneR){
        c.m -= (3 + c.m*.05)*dt;
        if (c.m <= 6){ c.m = 0; Game.zoneDeath = true; }
      }
    for (let i=Game.rivals.length-1;i>=0;i--){
      const r = Game.rivals[i];
      if (Math.hypot(r.x-cx, r.y-cy) > Game.zoneR){
        r.m -= (3 + r.m*.05)*dt;
        if (r.m <= 6) Game.rivals.splice(i,1);
      }
    }
    if (!Game.rivals.length && Game.cells.length){
      Game.won = true;
      finish(true); return;
    }
  }
  if (Game.left > 0){
    Game.left -= dt;
    if (Game.left <= 0){ Game.left = 0; finish(true); return; }
  }
  const [dx,dy] = aim(), [mx,my] = centre();

  let near = null, best = Infinity;
  for (const d of Game.debris){
    const q = (d.x-mx)**2 + (d.y-my)**2;
    if (q < best){ best = q; near = d; }
  }
  if (near){
    const l = Math.hypot(near.x-mx, near.y-my)||1;
    Integrity.aimTries++;
    if (dx*(near.x-mx)/l + dy*(near.y-my)/l > .9995) Integrity.aimHits++;
  }

  const [tx,ty] = aimTarget();
  moveOwnCells(dt, tx, ty);
  /* Zwei Zustände, vorher vermischt:
     Wartezeit läuft  → auseinanderdrücken, aber nur so weit wie nötig.
     Wartezeit vorbei → zueinander ziehen und verschmelzen. Vorher konnte das
     Abstoßen das Verschmelzen dauerhaft verhindern, weil der nötige Abstand
     kleiner war als der erzwungene. */
  for (let i=0;i<Game.cells.length;i++){
    for (let j=i+1;j<Game.cells.length;j++){
      const a = Game.cells[i], b = Game.cells[j];
      let nx = a.x-b.x, ny = a.y-b.y;
      let d = Math.hypot(nx,ny);
      if (d < .01){ nx = .01; ny = 0; d = .01; }
      nx /= d; ny /= d;
      const ra = radiusOf(a.m), rb = radiusOf(b.m);
      const touch = ra+rb, ready = a.merge === 0 && b.merge === 0;

      if (ready){
        if (d < Math.max(ra,rb)*0.9){
          a.m += b.m; a.vx = (a.vx+b.vx)/2; a.vy = (a.vy+b.vy)/2;
          Game.cells.splice(j,1); j--; continue;
        }
        if (d < touch*1.4){                       // sanft zusammenziehen
          const pull = Math.min(d-Math.max(ra,rb)*0.9, 140)*1.4*dt;
          a.x -= nx*pull*.5; a.y -= ny*pull*.5;
          b.x += nx*pull*.5; b.y += ny*pull*.5;
        }
        continue;
      }
      if (d >= touch) continue;
      // Auseinanderdrücken nach Masse: das große Stück weicht kaum aus.
      const over = (touch-d)*.55, tot = a.m+b.m;
      a.x += nx*over*(b.m/tot); a.y += ny*over*(b.m/tot);
      b.x -= nx*over*(a.m/tot); b.y -= ny*over*(a.m/tot);
    }
  }

  const decay = Math.exp(-2.4*dt);          // Stoß rollt über etwa eine Sekunde aus
  for (const r of Game.rivals){
    r.retarget -= dt;
    r.merge = Math.max(0, r.merge - dt);
    if (r.retarget <= 0 || !r.goal){
      r.retarget = rnd(.4,1.3);
      r.goal = rivalGoal(r);
    }
    if (r.goal){
      let dx = r.goal.x-r.x, dy = r.goal.y-r.y;
      const l = Math.hypot(dx,dy)||1, v = speedOf(r.m);
      dx /= l; dy /= l;
      /* Ausweichen in JEDEM Bild, nicht nur beim Zielwechsel. Das Ziel wird
         höchstens alle 1,3 Sekunden neu gewählt — in der Zeit legt ein großer
         Körper mehrere hundert Einheiten zurück. Pulsare driften außerdem, und
         das Schlingern unten schiebt zusätzlich seitlich. Deshalb fuhren
         Rivalen weiter in Pulsare hinein, obwohl die Zielwahl sie mied:
         besonders auf der Flucht, wo Pulsare bisher gar nicht geprüft wurden,
         und genau dann, wenn jemand sich darin versteckt hatte.
         Die Abstoßung wächst zum Rand hin und überstimmt das Ziel erst dicht
         davor — sonst würden Rivalen einen Bogen um das halbe Feld machen. */
      if (r.m > PULSAR_BITE*.8){
        const nah = radiusOf(r.m) + PULSAR_R + 60;
        let wx = 0, wy = 0;
        for (const p of Game.pulsars){
          const px = r.x-p.x, py = r.y-p.y, d = Math.hypot(px,py);
          if (d > nah || d < 1) continue;
          const kraft = 1 - d/nah;
          wx += px/d * kraft; wy += py/d * kraft;
        }
        if (wx || wy){
          dx += wx*2.6; dy += wy*2.6;
          const n = Math.hypot(dx,dy)||1; dx /= n; dy /= n;
        }
      }
      r.x += (dx*v + Math.sin(Game.t*3 + r.mood*9)*28 + r.vx)*dt;
      r.y += (dy*v + Math.cos(Game.t*2.4 + r.mood*7)*28 + r.vy)*dt;
      r.vx *= decay; r.vy *= decay;
    }
    r.m *= Math.pow(1-decayOf(r.m)*1.2, dt);
    bound(r, dt);
  }

  // Eigene Teilstücke wieder zusammenführen
  for (let i=0;i<Game.rivals.length;i++)
    for (let j=i+1;j<Game.rivals.length;j++){
      const a = Game.rivals[i], b = Game.rivals[j];
      if (a.gid !== b.gid || a.merge > 0 || b.merge > 0) continue;
      if (Math.hypot(a.x-b.x, a.y-b.y) < Math.max(radiusOf(a.m), radiusOf(b.m))*.9){
        a.m += b.m; Game.rivals.splice(j,1); j--;
      }
    }

  for (const s of Game.shed){
    s.x += s.vx*dt; s.y += s.vy*dt;
    s.vx *= Math.pow(.04,dt); s.vy *= Math.pow(.04,dt);
    bound(s, dt);
  }

  // Nachschub für verschlungene Pulsare
  for (let i=Game.pulsarBack.length-1;i>=0;i--){
    if (Game.t < Game.pulsarBack[i]) continue;
    Game.pulsarBack.splice(i,1);
    if (Game.royale){
      const a = rnd(0,6.283), d = Math.sqrt(Math.random())*Game.zoneR*.8;
      Game.pulsars.push(newPulsar(WORLD/2 + Math.cos(a)*d, WORLD/2 + Math.sin(a)*d));
    } else Game.pulsars.push(newPulsar());
  }

  const feast = Game.cells.length >= FEAST_CELLS;

  // Pulsare: träges Driften, Fütterung durch abgeworfene Masse
  for (let pi=Game.pulsars.length-1; pi>=0; pi--){
    const p = Game.pulsars[pi];
    p.spin += dt*.35;
    p.x += p.vx*dt; p.y += p.vy*dt;
    if (p.schuss > 0){ p.schuss -= dt; p.vx *= Math.exp(-.5*dt); p.vy *= Math.exp(-.5*dt); }
    else { p.vx *= Math.exp(-1.6*dt); p.vy *= Math.exp(-1.6*dt); }
    p.x = clamp(p.x, PULSAR_R, WORLD-PULSAR_R);
    p.y = clamp(p.y, PULSAR_R, WORLD-PULSAR_R);
    for (let i=Game.shed.length-1;i>=0;i--){
      const s = Game.shed[i];
      if (Math.hypot(p.x-s.x, p.y-s.y) > PULSAR_R) continue;
      const l = Math.hypot(s.vx, s.vy) || 1;
      p.fed++;
      Game.shed.splice(i,1);
      if (p.fed >= PULSAR_FEED && Game.pulsars.length < pulsarMax()){
        p.fed = 0;
        const q = newPulsar(p.x + s.vx/l*PULSAR_R*1.2, p.y + s.vy/l*PULSAR_R*1.2);
        /* Der ausgestoßene Pulsar ist die Waffe. Mit 520 und der normalen
           Bremsung kam er keine sieben Radien weit — zu wenig, um damit auf
           jemanden zu zielen. Jetzt fliegt er weit genug, um einen Gegner zu
           treffen, den man vor sich hat. `schuss` schaltet die schwächere
           Bremsung frei; danach driftet er wie jeder andere. */
        q.vx = s.vx/l*1150; q.vy = s.vy/l*1150; q.schuss = 1.6;
        Game.pulsars.push(q);
        Game.pulsarSpawns++;
        Sound.pop();
      }
    }
    /* Fressen oder Zerreißen — die Reihenfolge ist die ganze Mechanik.
       Wer weit genug geteilt ist, frisst. Alle anderen zerreißen. */
    let eaten = false;
    for (const c of Game.cells){
      const d = Math.hypot(p.x-c.x, p.y-c.y);
      const covers = d < radiusOf(c.m) - PULSAR_R*.35;
      if (!covers) continue;
      if (feast && c.m > PULSAR_MASS*1.22){
        c.m += PULSAR_MASS;
        Game.pulsarsEaten++;
        Sound.absorb(PULSAR_MASS);
        ring(p.x, p.y, PULSAR_R*3.2, TH().shatter);
        eaten = true;
        break;
      }
      if (c.m >= PULSAR_BITE) shatter(c);
    }
    if (eaten){
      Game.pulsars.splice(pi,1);
      Game.pulsarBack.push(Game.t + FEAST_BACK);
      continue;
    }
    /* Länge vorher festhalten: `rivalShatter` hängt Teilstücke an dieselbe
       Liste, und die sollen nicht im selben Schritt noch einmal zerlegt
       werden — sonst kettet ein Treffer sich durch die eigenen Splitter. */
    const anzahlRivalen = Game.rivals.length;
    for (let ri=0; ri<anzahlRivalen; ri++){
      const r = Game.rivals[ri];
      if (r.m < PULSAR_BITE) continue;
      if (Math.hypot(p.x-r.x, p.y-r.y) < radiusOf(r.m) - PULSAR_R*.35)
        rivalShatter(r, p.x, p.y);
    }
  }

  // Spitzenmasse und daraus fließende XP
  {
    const jetzt = Game.cells.reduce((s,c) => s+c.m, 0);
    if (jetzt > peak){ addXpLive((jetzt-peak)*0.6); peak = jetzt; }
  }

  // Schweifpunkte sammeln, nur für das Design, das ihn trägt
  if (skin.trait === "trail"){
    for (const c of Game.cells){
      if (!c.trail) c.trail = [];
      if (Game.t - (c.tt || 0) > .055){
        c.tt = Game.t;
        c.trail.push({x:c.x, y:c.y});
        if (c.trail.length > 14) c.trail.shift();
      }
    }
  }

  effekteAltern(dt);

  const feeders = [...Game.cells, ...Game.rivals];
  for (const f of feeders){
    const r = radiusOf(f.m);
    Grid.near(f.x, f.y, r, i => {
      const d = Game.debris[i];
      if (!d) return;
      if (Math.hypot(f.x-d.x, f.y-d.y) < r){
        f.m += PELLET;
        Grid.drop(d, i);                     // altes Feld räumen, solange d gilt
        Game.debris[i] = newDebris(); Game.debrisVer = (Game.debrisVer | 0) + 1;
        Grid.put(Game.debris[i], i);         // neues Feld eintragen
        if (f.mine){ Game.debrisEaten++; Sound.eat(f.m); }
      }
    });
    for (let i=Game.shed.length-1;i>=0;i--){
      const s = Game.shed[i];
      if (Math.hypot(f.x-s.x, f.y-s.y) < r){ f.m += s.m; Game.shed.splice(i,1); }
    }
  }

  for (let i=Game.rivals.length-1;i>=0;i--){
    const r = Game.rivals[i];
    if (Game.teams && r.team === 1) continue;      // eigener Clan wird nicht gefressen
    let gone = false;
    if (Game.safe <= 0) for (const c of Game.cells){
      if (eats(c,r)){
        c.m += r.m; gone = true; Game.kills++;
        if (Game.t - Game.lastSplit < 6) Game.splitKills++;
        addXpLive(40);
        Sound.absorb(r.m); ring(r.x, r.y, radiusOf(r.m)*2.6, TH().brass);
        break;
      }
      if (eats(r,c)){
        /* Wer zuletzt zubeißt, ist der Täter. Zusätzlich festhalten, in
           welchem Zustand man war — daraus wird später die Lehre. */
        Game.lostPieces++;
        Game.killer = {name:r.name, m:r.m, mine:c.m,
                       left: Game.cells.filter(x => x.m > 0).length - 1,
                       sinceSplit: Game.t - Game.lastSplit,
                       team: Game.teams ? r.team : 0};
        r.m += c.m; c.m = 0;
      }
    }
    if (gone){
      Game.rivals.splice(i,1);
      if (!Game.royale) Game.rivals.push(newRival(r.name));   // Royale: einmal tot, tot
    }
  }
  for (let i=Game.rivals.length-1;i>=0;i--){
    for (let j=0;j<Game.rivals.length;j++){
      if (i===j) continue;
      if (Game.rivals[i].gid === Game.rivals[j].gid) continue;   // eigene Stücke
      if (Game.teams && Game.rivals[i].team === Game.rivals[j].team) continue;
      if (eats(Game.rivals[j], Game.rivals[i])){
        Game.rivals[j].m += Game.rivals[i].m;
        Game.rivals.splice(i,1);
        if (!Game.royale)
          Game.rivals.push(newRival(RIVALS[(Math.random()*RIVALS.length)|0]));
        break;
      }
    }
  }

  Game.cells = Game.cells.filter(c => c.m > 0);
  if (!Game.cells.length) finish();
}

/* Aus der Todesursache eine brauchbare Lehre machen. Reihenfolge ist
   Absicht: die spezifischste Erklärung gewinnt, sonst bekommt man immer
   denselben Allgemeinplatz zu lesen. */
function deathLesson(k, total){
  if (Game.zoneDeath) return t("l_zone");
  if (!k) return null;
  if (k.sinceSplit < 6 && k.left > 0) return t("l_split");
  if (k.sinceSplit < 6) return t("l_split2");
  if (k.m < total * 1.6) return t("l_close");
  if (peak > total * 1.5) return t("l_shrunk");
  if (Game.t < 20) return t("l_early");
  return t("l_watch");
}

/* Ende einer Onlinerunde. Die Zahlen kommen vollständig vom Server; hier
   werden sie nur in die Felder gelegt, die finish() ohnehin liest. Dass
   MODE().rewards im Onlinemodus null ist, sorgt dafür, dass finish() kein
   Ore vergibt — das darf erst der Server, wenn er Konten führt. */
function endeOnline(d){
  if (!Game.running) return;
  peak = Math.max(peak, d.peak || 0);
  Game.kills = d.kills || 0;
  if (d.sek) Game.t = d.sek;
  if (d.abbruch){ Game.result = t("net_lost"); Game.killer = null; }
  /* Spielart (Schritt 105): Sieg, Platz, Zonentod und Rundenende kommen vom
     Server; `finish` liest sie aus `Net.ergebnis`. */
  Net.ergebnis = d.ende !== undefined ? d : null;
  Game.won = !!d.gewonnen; Game.placed = d.platz || 0; Game.zoneDeath = !!d.zone;
  finish(!!d.ende);
}

function finish(timeUp){
  Game.running = false;
  document.body.classList.remove("playing");
  $("hud").hidden = true;
  Portal.gameplayStop();
  if (!timeUp) Portal.countDeath();
  if (!timeUp) Sound.death();
  Net.leave();

  /* Online (Schritt 105): Das Ergebnis hat der Server entschieden. */
  if (Game.online && Net.ergebnis && (Game.teams || Game.royale)){
    const e = Net.ergebnis;
    if (Game.teams){
      const tm = e.tms || Net.tms || [0, 0];
      const us = Game.team === 2 ? tm[1] : tm[0], them = Game.team === 2 ? tm[0] : tm[1];
      Game.result = e.gewonnen ? t("r_clanwin", us, them) : us < them ? t("r_clanlose", them, us) : t("r_even");
    } else {
      const gesamt = e.koerper || Net.koerper || 0;
      Game.result = e.gewonnen ? (e.ende ? t("r_biggest") : t("r_last"))
                  : e.ende ? t("r_timeup") + " " + t("r_placed", Game.placed || 1, gesamt)
                           : t("r_placed", Game.placed || 1, gesamt);
    }
  } else if (Game.teams){
    let us = Game.cells.reduce((s,c) => s+c.m, 0), them = 0;
    for (const r of Game.rivals) (r.team === 1 ? us += r.m : them += r.m);
    Game.result = us > them ? t("r_clanwin", Math.round(us), Math.round(them))
                : us < them ? t("r_clanlose", Math.round(them), Math.round(us))
                            : t("r_even");
  } else if (Game.royale){
    Game.placed = bodyCount() + 1;
    if (Game.won){
      Game.result = t("r_last");
    } else if (timeUp){
      let bigger = 0, mine = Game.cells.reduce((s,c) => s+c.m, 0);
      for (const r of Game.rivals) if (r.m > mine) bigger++;
      Game.won = bigger === 0 && Game.cells.length > 0;
      Game.result = Game.won ? t("r_biggest")
                             : t("r_timeup") + " " + t("r_placed", bigger+1, MODE().rivals+1);
    } else {
      Game.result = t("r_placed", Game.placed, MODE().rivals + 1);
    }
  } else if (timeUp){
    Game.result = t("r_timeup");
  }

  /* Belohnung. Produktiv rechnet der Server das aus den von ihm
     simulierten Werten — nie aus Zahlen, die der Client mitschickt. */
  /* XP wurde bereits während der Runde vergeben (addXpLive). Hier nur noch
     anzeigen, was zusammengekommen ist — sonst zählte es doppelt. */
  let xpGain = Math.round(Game.xpRun);

  /* Ore setzt sich aus vier Teilen zusammen, damit sichtbar wird, wofür
     bezahlt wird — und damit hohe Spitzenmasse der stärkste Hebel ist. */
  const st        = stageOf(peak);
  const oreMass   = Math.round(peak / 30);
  const oreKills  = Game.kills * 2;
  const oreStages = STAGE_BONUS.slice(0, st+1).reduce((s,x) => s+x, 0);
  const beat      = peak > Profile.best;
  const oreBest   = beat ? Math.round((oreMass + oreKills + oreStages) * 0.5) : 0;
  /* Siegprämie: Ein Royale-Sieg ist selten und soll sich lohnen — sonst
     spielt jeder den offenen Modus, weil dort mehr Masse zu holen ist. */
  const oreWin = Game.won ? 200 : 0;
  checkGoals();                       // Ziele, die erst am Ende feststehen
  const oreGoals = Game.goals.reduce((s,it) => s + (it.done ? it.def.ore : 0), 0);
  const oreGrund  = oreMass + oreKills + oreStages + oreBest + oreWin + oreGoals;
  /* Happy Hour für Gäste im Onlinemodus — derselbe Faktor, den der Server
     für Konten anlegt. Lokale Runden gegen KI bleiben außen vor. */
  const oreHappy  = (!!MODE().online && !Konto.angemeldet())
    ? Math.round(oreGrund * (happyFaktor() - 1)) : 0;
  const oreGain   = oreGrund + oreHappy;

  /* Freundschaftsspiele zahlen nichts. Sonst wäre die gespiegelte Arena mit
     schwachen Gegnern der schnellste Weg zu Ore — Übung soll Übung bleiben. */

  /* Lokale Runden zahlen einem angemeldeten Spieler nichts. Das ist keine
     Strenge, sondern die einzige ehrliche Möglichkeit: Eine Runde gegen
     Computergegner rechnet der Browser, und was der Browser rechnet, kann
     jeder umschreiben. Guthaben, das hier vergeben wird, wäre beim nächsten
     Neuladen ohnehin weg, weil der Server es nicht kennt — und genau das
     fühlt sich beim Spielen wie ein Fehler an. Bestwerte gehören zum Konto
     und werden aus demselben Grund nicht lokal fortgeschrieben. */
  const aufKonto = Konto.angemeldet();
  /* Gast im Onlinemodus (Schritt 95): Der Server zahlt nur Konten. Die
     Zahlen dieser Runde (Spitzenmasse, Abschüsse) hat aber er gerechnet und
     geschickt — daraus bekommt der Gast dieselbe Abrechnung wie offline,
     gutgeschrieben im Browser. Vorher stand hier „Freundschaftsspiel — nur
     Übung", obwohl im Freien Raum gespielt wurde. */
  const gastOnline = !!MODE().online && !aufKonto;
  const paid = (MODE().rewards > 0 || gastOnline) && !aufKonto;

  if (!aufKonto){
    const R = Profile.rec;
    R.runs++;
    R.mass  = Math.max(R.mass,  Math.round(peak));
    R.kills = Math.max(R.kills, Game.kills);
    R.time  = Math.max(R.time,  Math.floor(Game.t));
    if (Game.won && Game.royale) R.royale++;
    if (Game.won && Game.teams)  R.clan++;
  }
  let unlocked = Game.unlockedRun;
  if (paid){
    Profile.ore += oreGain;
    if (beat) Profile.best = Math.round(peak);
    /* Online vergibt der Client unterwegs kein XP (er simuliert das Fressen
       nicht selbst). Also am Ende nach derselben Formel wie der Server:
       `xp: Math.round(peak * 0.6)` in `belohnung()`. */
    if (gastOnline && xpGain === 0){
      const dazu = Math.round(peak * 0.6);
      const neu = Profile.addXp(dazu);
      Game.xpRun = dazu;
      if (neu.length){ skin = neu[neu.length-1]; Profile.skin = skin.id; }
      unlocked = unlocked.concat(neu);
    }
  }
  Gast.sichern();

  const total = Math.max(1, Game.killer ? Game.killer.mine : peak);
  const k = Game.killer;
  let recap = "";
  if (Game.zoneDeath){
    recap = `<p class="recap">${t("r_zone")}</p>`;
    const l = deathLesson(null, 1);
    if (l) recap += `<p class="lesson">${l}</p>`;
  } else if (k && !timeUp){
    const bits = [t("r_by", `<b>${esc(k.name)}</b>`, Math.round(k.m))];
    if (k.left > 0) bits.push(t("r_pieces", k.left + 1));
    if (k.sinceSplit < 6) bits.push(t("r_after", k.sinceSplit.toFixed(1)));
    recap = `<p class="recap">${bits.join(", ")}.</p>`;
    const lesson = deathLesson(k, total);
    if (lesson) recap += `<p class="lesson">${lesson}</p>`;
  }
  /* „Noch N unter deiner Bestmasse" steht seit Schritt 103 nicht mehr da —
     Thomas: „das ist demotivierend." Der Bestwert steht im Reiter Statistik. */

  $("endText").textContent = (Game.result ? Game.result + " " : "") +
    t("r_line", Game.name, Math.round(peak), t("st" + stageOf(peak)),
      Game.kills === 1 ? t("r_body") : t("r_bodies", Game.kills),
      Math.floor(Game.t));

  $("endRecap").innerHTML = recap;

  /* Onlinerunde eines angemeldeten Spielers: Die Abrechnung kommt fertig vom
     Server (`Net.lohn`) und wird hier nur angezeigt. Selbst nachzurechnen
     wäre nicht nur doppelte Arbeit — es würde auch eine zweite Wahrheit
     schaffen, die von der ersten abweichen kann. */
  if (Net.lohn && Net.profil){
    const L = Net.lohn, T = L.teile;
    const zeilen = [
      [t("peakmass") + " " + Math.round(peak), T.masse],
      [t("swallowed") + " " + Game.kills, T.koerper],
      [t("reached") + " " + t("st" + L.stufe), T.stufen]
    ];
    if (T.rekord) zeilen.push([t("newbest"), T.rekord]);
    if (T.sieg)   zeilen.push([t("wonround"), T.sieg]);
    if (T.happy)  zeilen.push([t("hh_zeile"), T.happy]);

    let html = zeilen.filter(z => z[1] > 0)
      .map(z => `<div class="tally"><span>${z[0]}</span><span>+${z[1]}</span></div>`).join("");
    html += `<div class="tally sum"><span>${ICON_ORE}${t("oreearned")}</span><span>+${L.ore}</span></div>`;
    html += `<p class="gain">${ICON_XP}+<b>${L.xp}</b> XP</p>`;
    /* Der Server schickt Kennungen, keine Namen — Namen und Farben stehen
       nur hier. Level und Rang werden als Banner **vor** die Abrechnung
       gestellt (Schritt 103), damit man sie nicht überliest. */
    const namen = (Net.neueSkins || [])
      .map(id => (SKINS.find(s => s.id === id) || {}).label)
      .filter(Boolean);
    const feier = feierHtml({ level: Net.aufgestiegen || 0, namen, rang: Net.rangNeu > 0 ? Net.rangNeu : -1 });
    if (feier) Sound.levelUp();
    html = feier + html;
    /* Ehre dieser Runde. Sie steht getrennt von Ore und XP, weil sie etwas
       anderes ist: Ore und XP bekommt man fürs Wachsen, Ehre nur fürs Jagen.
       Auch eine Null steht da — sonst weiß man nicht, ob man nichts bekommen
       hat oder ob die Anzeige fehlt. */
    /* Neue Errungenschaften stehen vor der Ehresumme: Sie sind der Grund,
       warum die Summe höher ist als die Jagd allein hergibt. */
    if (Net.erfolge && Net.erfolge.length){
      html += Net.erfolge.map(e =>
        `<div class="tally"><span>${esc(t("e_neu"))}: ${esc(erfolgLabel(e.id))}</span>` +
        `<span>+${(+e.ehre || 0).toLocaleString(lang)}</span></div>`).join("");
    }
    /* Monde und Mondstaub (Schritt 108): stehen bei den Errungenschaften,
       weil sie wie diese etwas Bleibendes sind. */
    if (Net.monde.length){
      html += Net.monde.map(m =>
        `<div class="tally"><span>${esc(t("mo_neu", t((MONDE[m.art] || {}).name || "mo_eis")))}</span>` +
        `<span>${esc(t("mo_stufe", ["I", "II", "III"][(m.stufe || 1) - 1] || m.stufe))}</span></div>`).join("");
    }
    if (Net.staubDazu > 0)
      html += `<div class="tally"><span>${esc(t("mo_staub_dazu"))}</span><span>+${Net.staubDazu}</span></div>`;
    if (Net.ehre){
      html += Net.ehre.dazu > 0
        ? `<div class="tally sum"><span>${t("ehredazu")}</span>` +
          `<span>+${Net.ehre.dazu}</span></div>` +
          `<p class="gain">${esc(t("rang"))}: <b>${esc(t("rk" + clamp(Net.ehre.rang,0,RANG_MAX)))}</b></p>`
        : `<p class="hintline">${esc(t("ehrekeine"))} ${esc(t("ehrewie"))}</p>`;
    }
    $("endZiel").innerHTML = naechstesZiel();
    $("endRw").innerHTML = "";
    $("endGains").innerHTML = html;
    feierMalen();

    Konto.uebernehmen({profil: Net.profil, stand: Net.stand});
    /* Den Wert vorher festhalten: Zwei Zeilen tiefer wird Net.rangNeu
       zurückgesetzt, und die verzögerte Meldung las dann immer Stufe 0 —
       jeder Aufstieg hieß „Rang erreicht: Kadett“. */
    const erreicht = Net.rangNeu;
    if (erreicht) setTimeout(() => toast(
      t("rangneu", t("rk" + clamp(erreicht, 0, RANG_MAX)))), 600);
    const neueMonde = Net.monde;
    if (neueMonde.length) setTimeout(() => toast(
      t("mo_neu", t((MONDE[neueMonde[0].art] || {}).name || "mo_eis"))), erreicht ? 4200 : 600);
    mondeStand = null; skillStand = null;
    if (modeId === "clan"){ modeId = "liga"; buildModes(); buildBoost(); }
    Konto.kampfPruefen();
    Net.lohn = null; Net.profil = null; Net.ehre = null;
    Net.erfolge = []; Net.rangNeu = 0; Net.monde = []; Net.staubDazu = 0;
    paintPurse(); buildGrid(); paintRank();
    hideAll(); $("endVeil").hidden = false;
    $("again").focus();
    return;
  }

  if (!paid){
    /* Zwei verschiedene Gründe, nichts zu bekommen: Übungsmodus oder
       angemeldet und lokal gespielt. Ein Spieler, der den falschen Satz
       liest, sucht den Fehler bei sich. */
    $("endGains").innerHTML = `<p class="hintline">${
      MODE().rewards > 0 ? t("practiceacct") : t("practice")}</p>`;
    $("endZiel").innerHTML = ""; $("endRw").innerHTML = "";
    hideAll(); $("endVeil").hidden = false;
    $("again").focus();
    return;
  }
  const rows = [
    [t("peakmass") + " " + Math.round(peak), oreMass],
    [t("swallowed") + " " + Game.kills, oreKills],
    [t("reached") + " " + t("st"+st), oreStages]
  ];
  if (beat) rows.push([t("newbest"), oreBest]);
  if (oreWin) rows.push([t("wonround"), oreWin]);
  for (const it of Game.goals)
    if (it.done) rows.push([t("objective") + ": " + t("g_"+it.def.id), it.def.ore]);
  if (oreHappy) rows.push([t("hh_zeile"), oreHappy]);

  let html = "";
  html += rows.filter(r => r[1] > 0)
    .map(r => `<div class="tally"><span>${r[0]}</span><span>+${r[1]}</span></div>`).join("");
  html += `<div class="tally sum"><span>${ICON_ORE}${t("oreearned")}</span><span>+${oreGain}</span></div>`;
  html += `<p class="gain">${ICON_XP}+<b>${Math.round(Game.xpRun)}</b> XP</p>`;
  /* Aufstieg als Banner (Schritt 103) — auch ohne neues Design, wenn das
     Level in dieser Runde gestiegen ist. */
  if (Profile.level > levelBeimStart || unlocked.length)
    html = feierHtml({ level: Profile.level, namen: unlocked.map(s => s.label) }) + html;
  /* Freiwillige Belohnungsanzeige (nur auf Portalen, nur Gäste — deren Ore
     liegt ohnehin im Browser). Einmal pro Runde, deutlich als freiwillig
     gekennzeichnet, belohnt nur bei vollständig gesehener Anzeige. */
  $("endZiel").innerHTML = naechstesZiel();
  const doppelt = oreGain > 0 && Portal.rewardAvailable();
  /* Der Knopf steht bei den Aktionen unter „Nochmal", nicht in der
     Abrechnung: Die scrollt auf Handys, und ganz unten sah ihn niemand. */
  $("endRw").innerHTML = doppelt
    ? `<button type="button" id="rwBtn" class="quiet" style="margin-top:6px">${esc(t("rw_double", oreGain))}</button>` +
      `<p class="hintline" id="rwNote" style="text-align:center">${esc(t("rw_optional"))}</p>`
    : "";
  $("endGains").innerHTML = html;
  if (doppelt){
    const knopf = $("rwBtn"), notiz = $("rwNote");
    knopf.addEventListener("click", () => {
      knopf.disabled = true;
      Portal.offerReward(ok => {
        if (ok){
          Profile.ore += oreGain;
          Gast.sichern();
          paintPurse(); buildGrid();
          notiz.textContent = t("rw_done", oreGain);
        } else {
          notiz.textContent = t("rw_none");
        }
        knopf.remove();
      });
    });
  }

  paintPurse(); buildGrid();
  hideAll(); $("endVeil").hidden = false;
  $("again").focus();
}

/* =====================================================================
   4) RENDER
   ===================================================================== */
const cam = {x:WORLD/2, y:WORLD/2, z:1};

/* Gefahr außerhalb des Bildes (Schritt 103). Thomas: „Spieler gar nicht auf
   meinem Bildschirm ersichtlich, aber so groß, dass er sich beim Teilen auf
   mich schießen kann." Ein Kleiner sieht rund 600 Einheiten weit; ein
   Großer springt beim Teilen 700 + anderthalb Radien. Ganz herauszoomen
   hilft nicht — dann wäre der eigene Körper drei Bildpunkte groß. Deshalb
   ein Pfeil am Bildrand für jeden Körper, der (1) auch halbiert noch fressen
   könnte (mindestens das 2,44-Fache der eigenen größten Zelle: geteilt
   bleibt die Hälfte, und die muss 1,22-mal schwerer sein) und (2) mit einem
   Sprung erreichbar ist. Je näher, desto größer und kräftiger der Pfeil. */
const randGefahren = [];
/* Letzter Abstand je Gegner, um „kommt näher" zu erkennen (Schritt 111). */
const gefahrAbstand = new Map();
const GEFAHR_MASSE = 20000;
function gefahrenMalen(g){
  if (!randGefahren.length) return;
  /* Auf einem Ring um die eigene Mitte, nicht am Bildrand: Dort liegen die
     Tafeln der Anzeige darüber, und ein Pfeil unter der Rangliste warnt
     niemanden (so gesehen beim ersten Versuch). */
  const cx = VW/2, cy = VH/2, ring = Math.min(VW, VH)*0.36;
  const puls = .75 + .25*Math.sin(Game.t*6);
  for (const r of randGefahren){
    const sx = r.dx*cam.z, sy = r.dy*cam.z;
    const l = Math.hypot(sx, sy) || 1;
    const px = cx + sx/l*ring, py = cy + sy/l*ring;
    const groesse = 9 + 9*r.nah;
    const a = Math.atan2(sy, sx);
    g.save();
    g.translate(px, py); g.rotate(a);
    g.globalAlpha = .55 + .45*r.nah*puls;
    g.beginPath();
    g.moveTo(groesse, 0); g.lineTo(-groesse*.7, -groesse*.62); g.lineTo(-groesse*.7, groesse*.62); g.closePath();
    g.fillStyle = "#f26b5b"; g.fill();
    g.lineWidth = 1.5; g.strokeStyle = "rgba(20,8,6,.85)"; g.stroke();
    g.restore();
  }
}

/* =====================================================================
   DESIGNS — wie ein Körper gezeichnet wird

   Drei Regeln, die nicht verhandelbar sind:

   1. **Der massive Kreis und der scharfe Rand liegen exakt auf r.** Ein
      Design darf nie über die echte Reichweite täuschen. Alles Weitere
      liegt durchscheinend darüber oder ganz außerhalb.

   2. **Eine Lichtquelle für alles, links oben.** Vorher hatte jedes
      Merkmal seine eigene Richtung — der Verlauf kam von links oben, die
      Glutstriche lagen kreuz und quer, die Krater waren flache Scheiben
      ohne Schatten. Genau daran erkennt man Amateurarbeit: Es sieht nicht
      wie eine Kugel aus, sondern wie ein Kreis mit Aufklebern.

   3. **Jedes Design würfelt sein eigenes Muster — aber immer dasselbe.**
      Vorher trugen alle 46 dieselben vierzehn Punkte an denselben Stellen
      und dieselben vier Striche; nur die Farbe wechselte. Deshalb waren
      Basalt, Regolith, Iron und Copper nicht auseinanderzuhalten. Jetzt
      bestimmt die Kennung den Wurf, also sieht jedes Design anders aus und
      sieht in jeder Sitzung wieder genauso aus.

   Dazu Materialarten statt einer Einheitskugel: Fels bekommt Krater mit
   beleuchtetem Wall, Eis zersprungene Platten, Metall ein Glanzband, Glut
   ein verzweigtes Spaltennetz, Kristall Facetten, Glas einen harten
   Lichtpunkt, Gas wandernde Bänder, Perle ein Schillern. Welche Art ein
   Design hat, steht als `mat` in `SKINS`.
   ===================================================================== */

/* Richtung, aus der alles beleuchtet wird. Einmal hier, nirgends sonst. */
const LICHT = Math.atan2(-.46, -.42);
const LX = Math.cos(LICHT), LY = Math.sin(LICHT);

/* Farbe aufhellen oder abdunkeln. Nimmt „#a1b2c3" und „rgb(1,2,3)" an,
   weil `shade()` das zweite zurückgibt. */
function mischen(farbe, f){
  let r, gr, b;
  if (farbe[0] === "#"){
    const n = parseInt(farbe.slice(1),16);
    r = n>>16&255; gr = n>>8&255; b = n&255;
  } else {
    const p = farbe.match(/-?\d+/g);
    r = +p[0]; gr = +p[1]; b = +p[2];
  }
  const z = f > 0 ? 255 : 0, k = Math.abs(f);
  return `rgb(${r+(z-r)*k|0},${gr+(z-gr)*k|0},${b+(z-b)*k|0})`;
}

/* Deterministischer Würfel. Gleiche Kennung → gleiches Muster, in jeder
   Sitzung, auf jedem Gerät, bei jedem Spieler. Ohne das würfelt der Körper
   bei jedem Bild neu und flackert. */
function saat(text){
  let h = 2166136261;
  for (let i=0;i<text.length;i++){ h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function wuerfel(z){
  return function(){
    z = z + 0x6D2B79F5 | 0;
    let t = Math.imul(z ^ z >>> 15, 1 | z);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* Einmal je Design gewürfelt und behalten. Nicht am Farbobjekt gemerkt,
   sondern hier: Die Rivalenfarben sind ein Proxy, an dem Merken nicht
   funktioniert — es würde bei jedem Bild neu würfeln. */
const MERKMALE = new Map();
function merkmale(pal){
  const schl = pal.id || pal.rock || "rival";
  let M = MERKMALE.get(schl);
  if (M) return M;

  const w = wuerfel(saat(schl));
  const art = pal.mat || "fels";
  M = {art, krater:[], spalten:[], platten:[], facetten:[], baender:[], flecken:[]};

  if (art === "fels" || art === "staub"){
    /* Krater. Wurzel aus dem Zufall, damit sie sich nicht in der Mitte
       drängen — gleichverteilt auf der Fläche, nicht auf dem Radius. */
    const n = art === "fels" ? 8 : 5;
    for (let i=0;i<n;i++)
      M.krater.push({a: w()*6.2832, d: Math.sqrt(w())*.80,
                     gr: (art === "fels" ? .09+w()*.15 : .13+w()*.22),
                     tief: .5 + w()*.5});
  }

  if (art === "glut" || art === "energie"){
    /* Verzweigtes Spaltennetz. Der alte Code zog gerade Striche von der
       Mitte nach außen — das sah aus wie hingeworfene Streichhölzer.
       Ein Riss läuft in Wahrheit unregelmäßig und gabelt sich. */
    const wurzeln = 3 + (w()*3|0);
    for (let i=0;i<wurzeln;i++){
      let a = w()*6.2832, d = .06 + w()*.10;
      const weg = [[Math.cos(a)*d, Math.sin(a)*d]];
      for (let k=0;k<7;k++){
        a += (w()-.5)*.95; d += .09 + w()*.11;
        if (d > .98) break;
        weg.push([Math.cos(a)*d, Math.sin(a)*d]);
      }
      if (weg.length > 1) M.spalten.push(weg);
      if (weg.length > 3 && w() < .75){
        const ab = weg[2];
        let b = Math.atan2(ab[1], ab[0]) + (w()-.5)*1.7, e = Math.hypot(ab[0], ab[1]);
        const ast = [ab];
        for (let k=0;k<4;k++){
          b += (w()-.5)*.85; e += .10 + w()*.10;
          if (e > .98) break;
          ast.push([Math.cos(b)*e, Math.sin(b)*e]);
        }
        if (ast.length > 1) M.spalten.push(ast);
      }
    }
  }

  if (art === "eis"){
    /* Bruchlinien: Sehnen quer über die Scheibe, nicht Speichen aus der
       Mitte. So zerfällt die Fläche in Platten wie echtes Packeis. */
    for (let i=0;i<7;i++){
      const a = w()*6.2832, versatz = (w()-.5)*1.3;
      M.platten.push({a, versatz, dicke: .5 + w()*.8});
    }
  }

  if (art === "kristall"){
    /* Facetten als Keile um die Mitte, jede mit eigener Helligkeit.
       Zusammen ergeben sie einen geschliffenen Stein. */
    let a = w()*6.2832;
    while (a < 6.2832 + LICHT){
      const breite = .5 + w()*.65;
      M.facetten.push({von:a, bis:a+breite, tiefe:.55 + w()*.45, hell:w()});
      a += breite;
    }
  }

  if (art === "gas" || art === "perle"){
    /* Bänder in wechselnder Höhe und Dicke, dazu ein Wirbel. */
    let y = -.86;
    while (y < .86){
      const h = .07 + w()*.15;
      M.baender.push({y: y+h/2, h, kraft: .18 + w()*.35, tempo: .12 + w()*.5});
      y += h + .02 + w()*.07;
    }
    M.flecken.push({a: w()*6.2832, d: .30 + w()*.34, gr: .14 + w()*.12});
  }

  if (art === "metall"){
    /* Wenige lange Kratzer quer zum Licht — das ist es, was eine
       geschliffene Metallfläche ausmacht. */
    for (let i=0;i<6;i++)
      M.flecken.push({q: (w()-.5)*1.7, laenge: .5 + w()*.5, hell: .06 + w()*.12});
  }

  MERKMALE.set(schl, M);
  return M;
}

/* --- Die Materialarten ------------------------------------------------
   Alles hier wird im Kreis beschnitten aufgerufen; keine Funktion muss
   sich um den Rand kümmern. */
function flaeche(g, x, y, r, pal, M, zeit){
  const A = M.art;

  if (A === "fels" || A === "staub"){
    for (const k of M.krater){
      const kx = x + Math.cos(k.a)*r*k.d, ky = y + Math.sin(k.a)*r*k.d;
      const kr = r*k.gr;
      if (A === "staub"){
        // Staub: weiche Flecken, kaum Kante
        const fg = g.createRadialGradient(kx, ky, 0, kx, ky, kr*1.6);
        fg.addColorStop(0, hexA(pal.dark, .30*k.tief));
        fg.addColorStop(1, hexA(pal.dark, 0));
        g.fillStyle = fg;
        g.beginPath(); g.arc(kx, ky, kr*1.6, 0, 7); g.fill();
        continue;
      }
      // Fels: Becken dunkel, Wall auf der Lichtseite hell — erst das
      // macht aus einer Scheibe ein Loch.
      g.beginPath(); g.arc(kx, ky, kr, 0, 7);
      g.fillStyle = hexA(pal.dark, .42*k.tief); g.fill();
      g.beginPath();
      g.arc(kx, ky, kr*.98, LICHT-1.5, LICHT+1.5);
      g.strokeStyle = hexA(pal.air, .26*k.tief);
      g.lineWidth = Math.max(.8, kr*.22); g.stroke();
      g.beginPath();
      g.arc(kx, ky, kr*.72, LICHT+1.5, LICHT+4.6);
      g.strokeStyle = hexA(pal.air, .13*k.tief);
      g.lineWidth = Math.max(.6, kr*.16); g.stroke();
    }
    return;
  }

  if (A === "eis"){
    g.strokeStyle = hexA(pal.dark, .40);
    for (const p of M.platten){
      const nx = Math.cos(p.a), ny = Math.sin(p.a);
      const mx = x + nx*r*p.versatz, my = y + ny*r*p.versatz;
      const s = Math.sqrt(Math.max(0, 1 - p.versatz*p.versatz))*r;
      g.lineWidth = Math.max(.8, r*.012*p.dicke);
      g.beginPath();
      g.moveTo(mx - ny*s, my + nx*s);
      g.lineTo(mx + ny*s, my - nx*s);
      g.stroke();
    }
    // Harter Glanzpunkt: Eis spiegelt, Fels nicht.
    const gx = x + LX*r*.46, gy = y + LY*r*.46;
    const gg = g.createRadialGradient(gx, gy, 0, gx, gy, r*.42);
    gg.addColorStop(0, hexA(pal.hot, .55));
    gg.addColorStop(1, hexA(pal.hot, 0));
    g.fillStyle = gg;
    g.beginPath(); g.arc(gx, gy, r*.42, 0, 7); g.fill();
    return;
  }

  if (A === "metall"){
    /* Glanzband quer zur Lichtrichtung. Ein geschliffenes Metall hat
       keinen runden Lichtpunkt, sondern einen gezogenen Streifen. */
    g.save();
    g.translate(x, y); g.rotate(LICHT + 1.5708);
    /* Der Kern des Glanzes ist Weiß, nicht die Glutfarbe. Mit `hot` bekam
       Magnetite einen rosa Balken quer über eine graue Kugel — die Glutfarbe
       ist für Risse gedacht, nicht für Reflexionen. */
    const bg = g.createLinearGradient(0, -r, 0, r);
    bg.addColorStop(0,   hexA(pal.air, 0));
    bg.addColorStop(.30, hexA(pal.air, .16));
    bg.addColorStop(.43, "rgba(255,255,255,.34)");
    bg.addColorStop(.49, "rgba(255,255,255,.52)");
    bg.addColorStop(.56, hexA(pal.air, .26));
    bg.addColorStop(.72, hexA(pal.air, .06));
    bg.addColorStop(1,   hexA(pal.air, 0));
    g.fillStyle = bg;
    g.fillRect(-r, -r, r*2, r*2);
    g.strokeStyle = hexA(pal.air, .16);
    for (const s of M.flecken){
      g.lineWidth = Math.max(.6, r*.012);
      g.globalAlpha = s.hell*3;
      g.beginPath();
      g.moveTo(-r*s.laenge, r*s.q);
      g.lineTo( r*s.laenge, r*s.q + r*.06);
      g.stroke();
    }
    g.globalAlpha = 1;
    g.restore();
    return;
  }

  if (A === "glut" || A === "energie"){
    /* Dunkle Kruste, dann das glühende Netz. Zwei Durchgänge: erst breit
       und schwach (der Schein im Gestein), dann schmal und hell (die
       Spalte selbst). */
    g.beginPath(); g.arc(x, y, r, 0, 7);
    g.fillStyle = hexA(pal.dark, A === "glut" ? .46 : .30); g.fill();

    const puls = .78 + .22*Math.sin(zeit*1.7);
    for (let durch=0; durch<2; durch++){
      g.strokeStyle = durch
        ? hexA(pal.hot, .92*puls)
        : hexA(pal.hot, .20*puls);
      g.lineWidth = Math.max(durch ? 1 : 2, r*(durch ? .022 : .085));
      g.lineCap = "round"; g.lineJoin = "round";
      for (const weg of M.spalten){
        g.beginPath();
        g.moveTo(x + weg[0][0]*r, y + weg[0][1]*r);
        for (let i=1;i<weg.length;i++) g.lineTo(x + weg[i][0]*r, y + weg[i][1]*r);
        g.stroke();
      }
    }
    g.lineCap = "butt"; g.lineJoin = "miter";

    if (A === "energie"){
      const kg = g.createRadialGradient(x, y, 0, x, y, r*.7);
      kg.addColorStop(0, hexA(pal.hot, .55*puls));
      kg.addColorStop(1, hexA(pal.hot, 0));
      g.fillStyle = kg;
      g.beginPath(); g.arc(x, y, r*.7, 0, 7); g.fill();
    }
    return;
  }

  if (A === "kristall"){
    /* Facetten: Keile, deren Helligkeit davon abhängt, wie sehr sie zum
       Licht zeigen. Das ergibt einen Schliff statt einer Kugel. */
    /* Facetten müssen hart gegeneinander stehen, sonst sieht man sie nicht
       und der Stein bleibt eine Kugel. Die Kante zwischen zwei Flächen ist
       das, was einen Schliff ausmacht — sie ist hier absichtlich sichtbar. */
    for (const f of M.facetten){
      const mitte = (f.von + f.bis)/2;
      const zumLicht = Math.cos(mitte - LICHT);
      g.beginPath();
      g.moveTo(x, y);
      g.arc(x, y, r*1.02, f.von, f.bis);
      g.closePath();
      g.fillStyle = zumLicht > 0
        ? `rgba(255,255,255,${(.05 + zumLicht*.30 + f.hell*.10).toFixed(3)})`
        : hexA(pal.dark, .16 + (-zumLicht)*.34 + f.hell*.10);
      g.fill();
      g.strokeStyle = hexA(pal.air, .22);
      g.lineWidth = Math.max(.7, r*.012); g.stroke();
    }
    /* Innerer Schliff: eine zweite, versetzte Lage kleiner Facetten. Erst
       damit wirkt es geschliffen statt facettiert angemalt. */
    for (const f of M.facetten){
      const mitte = (f.von + f.bis)/2 + .4;
      const zumLicht = Math.cos(mitte - LICHT);
      g.beginPath();
      g.moveTo(x, y);
      g.arc(x, y, r*f.tiefe*.62, f.von+.4, f.bis+.4);
      g.closePath();
      g.fillStyle = zumLicht > 0
        ? `rgba(255,255,255,${(.04 + zumLicht*.16).toFixed(3)})`
        : hexA(pal.dark, .10);
      g.fill();
    }
    // Kern: der Stein hat ein Inneres, das Licht führt
    const kg = g.createRadialGradient(x, y, 0, x, y, r*.50);
    kg.addColorStop(0, hexA(pal.hot, .42));
    kg.addColorStop(1, hexA(pal.hot, 0));
    g.fillStyle = kg;
    g.beginPath(); g.arc(x, y, r*.50, 0, 7); g.fill();
    return;
  }

  if (A === "glas"){
    /* Fast schwarz, dafür ein harter Lichtpunkt und ein Lichtsaum auf
       der Schattenseite — so liest man poliertes Glas. */
    /* Nur leicht abdunkeln. Mit .50 fiel Obsidian zu einem schwarzen Loch
       zusammen, in dem nichts mehr zu erkennen war — poliertes Glas ist
       dunkel, aber es spiegelt, und genau das muss man sehen. */
    g.beginPath(); g.arc(x, y, r, 0, 7);
    g.fillStyle = hexA(pal.dark, .26); g.fill();
    const gx = x + LX*r*.44, gy = y + LY*r*.44;
    g.save();
    g.translate(gx, gy); g.rotate(LICHT);
    g.scale(1, .46);
    const gg = g.createRadialGradient(0, 0, 0, 0, 0, r*.34);
    gg.addColorStop(0,   "rgba(255,255,255,1)");
    gg.addColorStop(.18, "rgba(255,255,255,.72)");
    gg.addColorStop(.42, hexA(pal.hot, .40));
    gg.addColorStop(1,   hexA(pal.hot, 0));
    g.fillStyle = gg;
    g.beginPath(); g.arc(0, 0, r*.34, 0, 7); g.fill();
    g.restore();
    // Zweites, schwächeres Spiegelbild — Glas hat mehr als einen Glanzpunkt
    const sx = x - LX*r*.30, sy = y - LY*r*.52;
    const sg = g.createRadialGradient(sx, sy, 0, sx, sy, r*.40);
    sg.addColorStop(0, hexA(pal.air, .26));
    sg.addColorStop(1, hexA(pal.air, 0));
    g.fillStyle = sg;
    g.beginPath(); g.arc(sx, sy, r*.40, 0, 7); g.fill();
    // Lichtsaum auf der Schattenseite: das Kennzeichen einer glatten Kugel
    g.beginPath();
    g.arc(x, y, r*.93, LICHT+1.80, LICHT+4.50);
    g.strokeStyle = hexA(pal.air, .62);
    g.lineWidth = Math.max(1, r*.062); g.stroke();
    return;
  }

  if (A === "schlund"){
    /* Ein Loch, das trotzdem Eindruck macht.

       Das Problem, das diese Art löst: Die dunklen Glasdesigns auf Level 90
       und 95 standen zwischen Plasma, Quasar und Antimatter wie zwei blasse
       Flecken — obwohl sie weiter oben auf der Leiter stehen. Eine Leiter,
       die nach oben hin schwächer aussieht, taugt nichts.

       Dunkel heißt aber nicht blass. Ein Schwarzes Loch wirkt durch den
       **Gegensatz**: pechschwarzer Kern, und genau am Rand der scharfe
       Lichtring aus dem Licht, das dort gerade noch entlangläuft. Die
       Wucht steuert `wucht` am Design — so ist Level 95 stärker als 90,
       ohne dass beide gleich aussehen. */
    const W = pal.wucht || 1;

    g.beginPath(); g.arc(x, y, r, 0, 7);
    g.fillStyle = "rgba(2,3,8,.90)"; g.fill();

    // Lichtring genau auf dem Rand — er liegt auf r, täuscht also nichts vor
    const rg = g.createRadialGradient(x, y, r*.55, x, y, r);
    rg.addColorStop(0,   hexA(pal.hot, 0));
    rg.addColorStop(.72, hexA(pal.hot, .06*W));
    rg.addColorStop(.90, hexA(pal.hot, .46*W));
    rg.addColorStop(.98, hexA(pal.hot, .92*W));
    rg.addColorStop(1,   hexA(pal.air, .70*W));
    g.fillStyle = rg;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();

    /* Lichtbeugung: kurze Bögen in wechselnder Höhe, die langsam wandern.
       Echte Verzerrung wäre zu teuer, der Eindruck genügt. */
    const n = Math.round(6 + 5*W);
    for (let i=0;i<n;i++){
      const a = i*(6.2832/n) + zeit*.10;
      const rr = r*(.80 + (i%3)*.055);
      g.beginPath();
      g.arc(x, y, rr, a, a + .30 + (i%4)*.05);
      g.strokeStyle = hexA(pal.hot, (.10 + (i%3)*.10)*W);
      g.lineWidth = Math.max(1, r*.028); g.stroke();
    }
    return;
  }

  if (A === "gas" || A === "perle"){
    /* Bänder, die langsam wandern. Gekrümmt gezeichnet, nicht als gerade
       Ellipsen — eine Kugel hat keine geraden Streifen. */
    for (const b of M.baender){
      const yy = y + b.y*r;
      const versatz = Math.sin(zeit*b.tempo + b.y*4)*r*.05;
      const hoch = Math.max(1, b.h*r);
      const hue = A === "perle"
        ? `hsla(${(zeit*22 + b.y*150 + 300) % 360} 70% 72% / ${b.kraft*.75})`
        : hexA(b.y < 0 ? pal.air : pal.dark, b.kraft);
      g.fillStyle = hue;
      g.beginPath();
      g.ellipse(x + versatz, yy, r*1.06, hoch, 0, 0, 7);
      g.fill();
    }
    for (const f of M.flecken){
      const fx = x + Math.cos(f.a)*r*f.d, fy = y + Math.sin(f.a)*r*f.d*.6;
      const fg = g.createRadialGradient(fx, fy, 0, fx, fy, r*f.gr*1.8);
      fg.addColorStop(0, hexA(pal.hot, .40));
      fg.addColorStop(1, hexA(pal.hot, 0));
      g.fillStyle = fg;
      g.save(); g.translate(fx, fy); g.scale(1.5, 1);
      g.beginPath(); g.arc(0, 0, r*f.gr*1.8, 0, 7); g.fill();
      g.restore();
    }
    return;
  }
}

function body(g, x, y, r, m, pal, tint, label, mine, tier, trait){
  const st = stageOf(m);
  const T = tier || pal.tier || 1;
  const F = trait || pal.trait || "plain";
  const M = merkmale(pal);
  const rock = shade(pal.rock, tint||0), dark = shade(pal.dark, tint||0);
  /* Drei Stufen: voll, Sparstufe (ECO — Material und Schatten bleiben, das
     Leuchten drumherum fällt weg), flach (Einstellung „Sparmodus"). Im Menü
     immer voll: Dort ist der Körper die Fortschrittsanzeige. */
  const voll  = MENUE_VOLL || (!Settings.lowPower && !ECO);
  const fancy = MENUE_VOLL || !Settings.lowPower;
  const fein  = fancy && r > 11;      // Feinheiten erst, wenn man sie sähe

  /* ---- 1. Außenraum: Rang, Lufthülle, Ringe --------------------------
     Alles außerhalb von r. Der Rang muss sichtbar sein: Größe sagt nur,
     wer gerade satt ist — nicht, wer etwas kann. */
  if (T >= 3 && voll && r > 8){
    const puls = T >= 6 ? .30 + .14*Math.sin(Game.t*2.2 + x*.01)
               : T >= 5 ? .26 + .12*Math.sin(Game.t*3 + x*.01)
               : T >= 4 ? .17 : .09;
    const far = r*(T >= 6 ? 1.95 : T >= 5 ? 1.70 : T >= 4 ? 1.42 : 1.26);
    const glow = g.createRadialGradient(x,y,r*.95, x,y,far);
    glow.addColorStop(0, hexA(pal.hot, puls));
    glow.addColorStop(1, hexA(pal.hot, 0));
    g.fillStyle = glow;
    g.beginPath(); g.arc(x,y,far,0,7); g.fill();
  }

  if (st >= 3 && voll){
    const halo = g.createRadialGradient(x,y,r*.9, x,y,r*1.35);
    halo.addColorStop(0, hexA(pal.air,.28));
    halo.addColorStop(1, hexA(pal.air,0));
    g.fillStyle = halo;
    g.beginPath(); g.arc(x,y,r*1.35,0,7); g.fill();
  }
  if (st >= 4){
    g.save(); g.translate(x,y); g.scale(1,.3); g.rotate(.2);
    for (let i=0;i<3;i++){
      g.beginPath(); g.arc(0,0,r*(1.5+i*.16),0,7);
      g.strokeStyle = hexA(pal.air, .34-i*.09);
      g.lineWidth = Math.max(1, r*.055); g.stroke();
    }
    g.restore();
  }

  /* ---- 2. Die Grundkugel ---------------------------------------------
     Der Verlauf sitzt auf der Lichtseite, nicht in der Mitte. */
  g.beginPath(); g.arc(x,y,r,0,7);
  if (!fancy){
    g.fillStyle = rock;
  } else {
    const grad = g.createRadialGradient(x+LX*r*.50, y+LY*r*.50, r*.04, x, y, r*1.06);
    grad.addColorStop(0,   mischen(rock, .26));
    grad.addColorStop(.48, rock);
    grad.addColorStop(1,   dark);
    g.fillStyle = grad;
  }
  g.fill();

  /* ---- 3. Die Materialoberfläche ------------------------------------- */
  if (fein){
    g.save();
    g.beginPath(); g.arc(x,y,r,0,7); g.clip();
    flaeche(g, x, y, r, pal, M, Game.t);
    g.restore();
  }

  /* ---- 4. Terminator: die abgewandte Seite ---------------------------
     Der eine Handgriff, der am meisten bringt. Ohne ihn bleibt jeder
     Körper eine flache Scheibe, egal wie fein die Oberfläche ist. */
  if (fancy && r > 9){
    /* Wie dunkel die Schattenseite wird, hängt vom Material ab. Glas und
       Kristall spiegeln ihre Umgebung und fallen nie ins Schwarze; Staub
       schluckt Licht und wird am dunkelsten. Mit einem festen Wert für
       alle fielen Obsidian, Onyx und Void zu Löchern im Bild zusammen. */
    const kraft = M.art === "schlund"                        ? .14
                : M.art === "glas" || M.art === "kristall" ? .34
                : M.art === "energie" || M.art === "glut"  ? .46
                : M.art === "metall"                        ? .58
                : .66;
    g.save();
    g.beginPath(); g.arc(x,y,r,0,7); g.clip();
    const tx = x + LX*r*.60, ty = y + LY*r*.60;
    const tg = g.createRadialGradient(tx, ty, r*.20, tx, ty, r*1.95);
    tg.addColorStop(0,   "rgba(0,0,0,0)");
    tg.addColorStop(.42, `rgba(0,0,0,${(kraft*.09).toFixed(3)})`);
    tg.addColorStop(.74, `rgba(0,0,0,${(kraft*.45).toFixed(3)})`);
    tg.addColorStop(1,   `rgba(0,0,0,${kraft.toFixed(3)})`);
    g.fillStyle = tg;
    g.fillRect(x-r, y-r, r*2, r*2);
    g.restore();
  }

  /* ---- 5. Randlicht auf der Lichtseite -------------------------------- */
  if (fancy && r > 9){
    g.beginPath();
    g.arc(x, y, r*.96, LICHT-1.30, LICHT+1.30);
    g.strokeStyle = hexA(pal.air, .30 + Math.min(T,5)*.028);
    g.lineWidth = Math.max(1, r*.06);
    g.stroke();
  }

  /* ---- 6. Lufthülle als Saum auf der Schattenseite --------------------
     Ab Protoplanet hält eine Atmosphäre — die sieht man am Rand, wo das
     Licht sie streifend trifft, nicht als Kreis um alles. */
  if (st >= 3 && fancy && r > 9){
    g.beginPath();
    g.arc(x, y, r*.99, LICHT+1.05, LICHT+5.23);
    g.strokeStyle = hexA(pal.air, .34);
    g.lineWidth = Math.max(1, r*.05);
    g.stroke();
  }

  /* ---- 7. Stufe VI: was kein anderes Design hat -----------------------
     Alles außerhalb oder durchscheinend darüber. Der Kreis bleibt. */

  designSchmuck(g, x, y, r, pal, F, M, fancy);

  if (st >= 4){
    for (let i=0;i<3;i++){
      const a = Game.t*(.35+i*.14) + i*2.1, d = r*(1.75+i*.22);
      g.beginPath();
      g.arc(x+Math.cos(a)*d, y+Math.sin(a)*d*.42, Math.max(2, r*.07), 0, 7);
      g.fillStyle = pal.air; g.fill();
    }
  }

  /* ---- 8. Rand: heller und kräftiger mit dem Rang --------------------- */
  g.beginPath(); g.arc(x,y,r,0,7);
  g.strokeStyle = mine ? hexA(pal.air,.55) : hexA(pal.air, .10 + T*.085);
  g.lineWidth = Math.max(1, r*(.035 + T*.008)); g.stroke();

  if (label && r > 9){
    g.font = `600 ${Math.max(9, r*.3)}px Georgia, serif`;
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = TH().label;
    g.fillText(label, x, y);
  }
}

/* Was ein Design außerhalb des Kreises trägt (Halo, Feuer, Strahlen, Frost,
   Beugung, Prisma, Stacheln, Splitter). Aus `body()` herausgezogen (Schritt
   118), weil das 3D-Modell im Hangar (`Held3D`) dieselben Effekte über
   seine Kugel legt — eine Stelle, zwei Bilder. Alles hier bleibt außerhalb
   von `r` oder durchscheinend darüber; der Kreis selbst wird hier nie
   gezeichnet. */
function designSchmuck(g, x, y, r, pal, F, M, fancy){
  // Halo: gegenläufiger Ring weit außen, dazu ein wanderndes Licht
  if (F === "halo" && fancy && r > 10){
    g.save(); g.translate(x, y); g.rotate(-Game.t*.22);
    g.beginPath();
    g.ellipse(0, 0, r*2.05, r*.62, 0, 0, 6.2832);
    g.strokeStyle = hexA(pal.air, .40);
    g.lineWidth = Math.max(1.5, r*.05); g.stroke();
    for (let i=0;i<5;i++){
      const a = i*1.2566;
      g.beginPath();
      g.arc(Math.cos(a)*r*2.05, Math.sin(a)*r*.62, Math.max(1.5, r*.05), 0, 7);
      g.fillStyle = hexA(pal.hot, .75); g.fill();
    }
    g.restore();
  }

  /* Inferno (Schritt 104): brennende Zungen **außerhalb** von r — der Kreis
     bleibt, was er ist. Zeit statt Zufall: dieselbe Zunge flackert bei jedem
     Bild weiter, statt zu springen. */
  if (F === "feuer" && fancy && r > 6){
    const n = 14, tt = Game.t;
    g.save(); g.translate(x, y);
    for (let i=0;i<n;i++){
      const a = i*(6.2832/n) + Math.sin(tt*1.7 + i)*.12;
      const flack = .5 + .5*Math.sin(tt*9 + i*2.3)*Math.cos(tt*4.1 + i*.7);
      const h = r*(.26 + .40*flack), w = r*.22;
      g.save(); g.rotate(a);
      g.beginPath();
      g.moveTo(r*.94, -w);
      g.quadraticCurveTo(r + h*.55, -w*.35, r + h, 0);
      g.quadraticCurveTo(r + h*.55, w*.35, r*.94, w);
      g.closePath();
      g.fillStyle = hexA(i % 3 ? pal.hot : pal.air, .26 + .24*flack);
      g.fill(); g.restore();
    }
    g.restore();
    g.beginPath(); g.arc(x, y, r*1.05, 0, 7);
    g.strokeStyle = hexA(pal.hot, .30 + .15*Math.sin(tt*6));
    g.lineWidth = Math.max(1.5, r*.05); g.stroke();
  }

  /* Sunflare (Schritt 107): zwölf drehende Strahlen und eine Korona — alles
     außerhalb von r, durchscheinend; der Kreis bleibt der Kreis. */
  if (F === "strahlen" && fancy && r > 6){
    const n = 12, tt = Game.t;
    g.save(); g.translate(x, y); g.rotate(tt*.5);
    for (let i=0;i<n;i++){
      const a = i*(6.2832/n), l = r*(.55 + .25*Math.sin(tt*3 + i*1.3)), w = r*.09;
      g.save(); g.rotate(a);
      g.beginPath(); g.moveTo(r*1.02, -w); g.lineTo(r*1.02 + l, 0); g.lineTo(r*1.02, w); g.closePath();
      g.fillStyle = hexA(i % 2 ? pal.hot : pal.air, .34); g.fill();
      g.restore();
    }
    g.restore();
    g.beginPath(); g.arc(x, y, r*1.09, 0, 7);
    g.strokeStyle = hexA(pal.hot, .38 + .12*Math.sin(tt*5)); g.lineWidth = Math.max(1.5, r*.06); g.stroke();
  }

  /* Rime (Schritt 106): Eiskristalle, die langsam um den Körper kreisen,
     dazu ein kalter Schimmer knapp außerhalb von r. Zeit statt Zufall. */
  if (F === "frost" && fancy && r > 6){
    const n = 8, tt = Game.t;
    g.save(); g.translate(x, y);
    g.beginPath(); g.arc(0, 0, r*1.08, 0, 7);
    g.strokeStyle = hexA(pal.air, .30 + .10*Math.sin(tt*2.2)); g.lineWidth = Math.max(1.2, r*.05); g.stroke();
    for (let i=0;i<n;i++){
      const a = i*(6.2832/n) + tt*.35, d = r*(1.28 + .10*Math.sin(tt*1.6 + i));
      const kx = Math.cos(a)*d, ky = Math.sin(a)*d, k = Math.max(2.2, r*.11);
      g.save(); g.translate(kx, ky); g.rotate(tt*.8 + i);
      g.beginPath();
      for (let j=0;j<6;j++){ const b = j*1.0472; j ? g.lineTo(Math.cos(b)*k, Math.sin(b)*k) : g.moveTo(Math.cos(b)*k, Math.sin(b)*k); }
      g.closePath();
      g.fillStyle = hexA(i % 2 ? pal.hot : pal.air, .42); g.fill();
      g.strokeStyle = hexA(pal.air, .7); g.lineWidth = 1; g.stroke();
      g.restore();
    }
    g.restore();
  }

  /* Singularity: Lichtbeugung am Rand. Echte Verzerrung wäre zu teuer —
     tangentiale Bögen in wechselnder Höhe erzeugen den Einsteinring. */
  if (F === "warp" && fancy && r > 10){
    for (let i=0;i<14;i++){
      const a = i*.4488 + Game.t*.12;
      const rr = r*(1.10 + (i%3)*.09);
      const span = .28 + (i%4)*.05;
      g.beginPath();
      g.arc(x, y, rr, a, a+span);
      g.strokeStyle = hexA(pal.hot, .10 + (i%3)*.10);
      g.lineWidth = Math.max(1, r*.035); g.stroke();
    }
    if (M.art !== "schlund"){
      g.beginPath(); g.arc(x, y, r*.55, 0, 7);
      g.fillStyle = "rgba(3,4,9,.72)"; g.fill();
    }
  }

  // Prism: ein Lichtsaum, der durch das Spektrum wandert
  if (F === "prism" && fancy && r > 10){
    const hue = (Game.t*40) % 360;
    g.save();
    g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
    const pg = g.createLinearGradient(x-r, y-r, x+r, y+r);
    for (let i=0;i<=5;i++)
      pg.addColorStop(i/5, `hsla(${(hue + i*62) % 360} 92% 66% / .30)`);
    g.fillStyle = pg;
    g.fillRect(x-r, y-r, r*2, r*2);
    g.restore();
    g.beginPath(); g.arc(x, y, r*1.05, 0, 7);
    g.strokeStyle = `hsla(${hue} 95% 70% / .38)`;
    g.lineWidth = Math.max(1.5, r*.04); g.stroke();
  }

  // Stacheln nach außen: dünn und durchscheinend, damit die Größe stimmt
  if (F === "spikes" && fancy && r > 10){
    g.strokeStyle = hexA(pal.hot,.38);
    g.lineWidth = Math.max(1, r*.04);
    for (let i=0;i<12;i++){
      const a = i/12*6.2832 + Game.t*.12;
      g.beginPath();
      g.moveTo(x+Math.cos(a)*r, y+Math.sin(a)*r);
      g.lineTo(x+Math.cos(a)*r*1.13, y+Math.sin(a)*r*1.13);
      g.stroke();
    }
  }
  // Splittergürtel: zwei gegenläufige Bahnen, die äußere schwächer
  if (F === "shards" && fancy && r > 10){
    for (let i=0;i<9;i++){
      const a = Game.t*.5 + i*.698, d = r*1.3;
      g.beginPath();
      g.arc(x+Math.cos(a)*d, y+Math.sin(a)*d, Math.max(1.5, r*.06), 0, 7);
      g.fillStyle = hexA(pal.hot,.65); g.fill();
    }
    for (let i=0;i<6;i++){
      const a = -Game.t*.31 + i*1.047, d = r*1.62;
      g.beginPath();
      g.arc(x+Math.cos(a)*d, y+Math.sin(a)*d*.72, Math.max(1.2, r*.042), 0, 7);
      g.fillStyle = hexA(pal.air,.45); g.fill();
    }
  }
}

/* =====================================================================
   ERRUNGENSCHAFTEN

   Dauerhafte Ziele, die einmal zählen und Ehre einbringen. Welche es gibt und
   was sie wert sind, entscheidet der Server (`ERFOLGE` in `server.js`) — hier
   steht nur, wie sie heißen.

   **Absichtlich keine erfundenen Namen.** Eine Errungenschaft heißt hier wie
   ihre Bedingung: „Verschling 25 Körper". Ein Name wie „Jäger III" müsste
   erst erklärt werden, in sieben Sprachen, und sagt weniger. Deshalb acht
   Muster mit einer Zahl statt einundzwanzig Fantasienamen.

   Die Zahlen stehen doppelt — hier und im Server. `testkonto-runde.js`
   vergleicht beide Listen bei jedem Lauf.
   ===================================================================== */

/* Kennung → [Textmuster, Zahl im Text, Ehre]. Die Ehre steht auch im Server
   (`ERFOLGE`); `testkonto-runde.js` vergleicht beide Listen. */
const ERFOLG_TEXT = {
  w_geroell:  ["e_masse",     240,   50],
  w_planetes: ["e_masse",     800,  100],
  w_proto:    ["e_masse",    2000,  200],
  w_welt:     ["e_masse",    5000,  400],
  w_koloss:   ["e_masse",   12000,  400],
  j_erster:   ["e_jagd1",       1,   25],
  j_25:       ["e_jagd",       25,  100],
  j_250:      ["e_jagd",      250,  400],
  j_1000:     ["e_jagd",     1000,  400],
  j_runde5:   ["e_jagdrunde",   5,  150],
  j_runde12:  ["e_jagdrunde",  12,  350],
  j_runde25:  ["e_jagdrunde",  25,  300],
  d_erster:   ["e_duell1",      1,   50],
  d_25:       ["e_duell",      25,  150],
  d_100:      ["e_duell",     100,  300],
  a_10:       ["e_runden",     10,   50],
  a_100:      ["e_runden",    100,  200],
  a_500:      ["e_runden",    500,  600],
  a_fuenfmin: ["e_zeit",        5,  200],
  a_zehnmin:  ["e_zeit",       10,  250],
  a_stunden:  ["e_stunden",    10,  250],
  c_mitglied: ["e_clan",        1,  100],
  g_werber:   ["e_werben",     10,  250],
  t_woche:    ["e_treue",       7,  300],
  s_10:       ["e_skins",      10,  100],
  s_25:       ["e_skins",      25,  300],
  s_alle:     ["e_skins",      46,  800],
  l_10:       ["e_level",      10,  100],
  l_25:       ["e_level",      25,  250],
  l_50:       ["e_level",      50,  600],
  l_100:      ["e_level",     100, 1500]
};

/* Reihenfolge im Bildschirm: dieselbe wie oben, gruppenweise. Erreichte
   stehen nicht oben — sonst wandert die Liste bei jedem Erfolg, und man
   findet nichts wieder. */
const ERFOLG_REIHE = Object.keys(ERFOLG_TEXT);

function erfolgLabel(id){
  const e = ERFOLG_TEXT[id];
  return e ? t(e[0], e[1].toLocaleString(lang)) : id;
}

/* Errungenschaften, die außerhalb einer Runde dazukommen (Tagesbonus, Kauf).
   Kurz nach der eigentlichen Meldung, damit „Bonus abgeholt" nicht sofort
   überschrieben wird. Nach einer Runde stehen sie im Ergebnisbildschirm. */
function erfolgeMelden(a){
  const neu = Array.isArray(a.erfolge) ? a.erfolge : [];
  if (neu.length) setTimeout(() => toast(neu.map(e =>
    t("e_neu") + ": " + erfolgLabel(e.id) + " +" + (+e.ehre || 0).toLocaleString(lang)).join(" · ")), 1800);
  const erreicht = +a.rangNeu || 0;
  if (erreicht) setTimeout(() => toast(t("rangneu", t("rk" + clamp(erreicht, 0, RANG_MAX)))), 3600);
}

/* =====================================================================
   RANGABZEICHEN

   Dreizehn Stufen, gezeichnet als Pfade — keine Bilddateien, passend zum
   Grundsatz „nichts von außen". Die Stufen unterscheiden sich an der **Form**
   (Winkel, schmale Balken, breite Balken, Sterne), nicht nur an der Anzahl:
   In Spielgröße — rund 26 × 15 Bildpunkte — ist eine Form auf einen Blick
   lesbar, drei gezählte Striche nicht.

   Die Rangnamen stehen in `sprachen.js`, hier nur die Gestaltung.
   ===================================================================== */

const RANG_STIL = [
  {art:"winkel", n:1, farbe:"#c08f5c", rand:"#8a6440", grund:"#1c1510"},  // Kadett
  {art:"winkel", n:2, farbe:"#c08f5c", rand:"#8a6440", grund:"#1c1510"},  // Fähnrich
  {art:"balken", n:1, breit:false, farbe:"#d3d9df", rand:"#8d949b", grund:"#1c1510"},
  {art:"balken", n:2, breit:false, farbe:"#d3d9df", rand:"#8d949b", grund:"#1c1510"},
  {art:"balken", n:3, breit:false, farbe:"#d3d9df", rand:"#8d949b", grund:"#1c1510"},
  {art:"balken", n:1, breit:true,  farbe:"#d8a75f", rand:"#b88a44", grund:"#1c1510"},
  {art:"balken", n:2, breit:true,  farbe:"#d8a75f", rand:"#b88a44", grund:"#1c1510"},
  {art:"balken", n:3, breit:true,  farbe:"#d8a75f", rand:"#b88a44", grund:"#1c1510"},
  {art:"stern",  n:1, farbe:"#f1d38c", rand:"#d8a75f", grund:"#221a12"},  // Kommodore
  {art:"stern",  n:2, farbe:"#f1d38c", rand:"#d8a75f", grund:"#221a12"},
  {art:"stern",  n:3, farbe:"#f1d38c", rand:"#d8a75f", grund:"#221a12"},
  {art:"stern",  n:4, farbe:"#f1d38c", rand:"#d8a75f", grund:"#221a12"},  // Admiral
  {art:"gross",  n:1, farbe:"#f1d38c", rand:"#d8a75f", grund:"#2a1f12"}   // Großadmiral
];
const RANG_MAX = RANG_STIL.length - 1;

/* Bedingungen der Ränge — **Spiegel** von `EHRE_SCHWELLE` und `OBERE_RAENGE`
   in server.js, nur zum Anzeigen. `testkonto-runde.js` vergleicht beide bei
   jedem Lauf; vergeben wird ausschließlich dort. */
const RANG_SCHWELLE = [0, 25, 100, 300, 750, 1600, 3200, 6000];
const RANG_OBEN = [
  { stufe: 8,  anteil: 0.10, plaetze: 0, minEhre:  10000 },
  { stufe: 9,  anteil: 0.03, plaetze: 0, minEhre:  20000 },
  { stufe: 10, anteil: 0.01, plaetze: 0, minEhre:  40000 },
  { stufe: 11, anteil: 0,    plaetze: 5, minEhre:  80000 },
  { stufe: 12, anteil: 0,    plaetze: 1, minEhre: 150000 }
];
function rangBedingung(stufe){
  if (stufe < RANG_SCHWELLE.length)
    return stufe === 0 ? t("rg_start") : t("rg_ab", RANG_SCHWELLE[stufe].toLocaleString(lang));
  const o = RANG_OBEN.find(x => x.stufe === stufe);
  if (!o) return "";
  const ehre = o.minEhre.toLocaleString(lang);
  if (o.plaetze === 1) return t("rg_erster", ehre);
  if (o.plaetze) return t("rg_plaetze", o.plaetze, ehre);
  return t("rg_anteil", Math.round(o.anteil * 100), ehre);
}
/* Alle Ränge untereinander, der eigene hervorgehoben. Auch für Gäste: Wer
   sieht, was es zu erreichen gibt, hat einen Grund für ein Konto. */
function buildRaenge(){
  const box = $("rangListe");
  if (!box) return;
  const meiner = istAngemeldet() && Number.isInteger(Konto.profil.rang) ? Konto.profil.rang : -1;
  box.innerHTML = `<h2>${esc(t("rg_head"))}</h2><p class="hinweis" style="margin:0 0 6px">${esc(t("rg_sub"))}</p>` +
    RANG_STIL.map((_, i) =>
      `<div class="rangZeile${i === meiner ? " du" : ""}"><canvas width="96" height="56"></canvas>` +
      `<div><b>${esc(t("rk" + i))}${i === meiner ? " · " + esc(t("rg_du")) : ""}</b>` +
      `<small>${esc(rangBedingung(i))}</small></div></div>`).join("");
  box.querySelectorAll("canvas").forEach((c, i) => {
    const g = c.getContext("2d"); g.clearRect(0, 0, c.width, c.height); abzeichen(g, 0, 0, i, 56);
  });
}
/* Seitenverhältnis der Plakette, 48 × 28 aus dem Entwurf. */
const ABZEICHEN_V = 48/28;
const abzeichenBreite = h => h * ABZEICHEN_V;

function stern(g, x, y, r){
  g.beginPath();
  for (let i = 0; i < 10; i++){
    const a = -Math.PI/2 + i * Math.PI/5;
    const rr = i % 2 ? r * .42 : r;
    i ? g.lineTo(x + Math.cos(a)*rr, y + Math.sin(a)*rr)
      : g.moveTo(x + Math.cos(a)*rr, y + Math.sin(a)*rr);
  }
  g.closePath();
}

/* Zeichnet das Abzeichen der Stufe `stufe` mit der Höhe `h`.
   (`x`, `y`) ist die linke obere Ecke, alles in Bildschirmpunkten. */
function abzeichen(g, x, y, stufe, h){
  const s = RANG_STIL[clamp(Math.round(stufe), 0, RANG_MAX)];
  const b = abzeichenBreite(h), r = h * .22;

  // Plakette
  g.beginPath();
  if (g.roundRect) g.roundRect(x, y, b, h, r);
  else g.rect(x, y, b, h);
  g.fillStyle = s.grund; g.fill();
  g.strokeStyle = s.rand; g.lineWidth = Math.max(1, h * .06); g.stroke();

  g.save();
  g.fillStyle = s.farbe; g.strokeStyle = s.rand;
  g.lineWidth = Math.max(.8, h * .045);
  const mx = x + b/2, my = y + h/2;

  if (s.art === "winkel"){
    /* Winkel: die Spitze zeigt nach oben, wie ein Ärmelabzeichen. */
    const dick = h * .15, weite = b * .30, hoch = h * .17;
    for (let i = 0; i < s.n; i++){
      const oy = my + (i - (s.n-1)/2) * (h * .30) + h * .04;
      g.beginPath();
      g.moveTo(mx - weite, oy + hoch);
      g.lineTo(mx,         oy - hoch);
      g.lineTo(mx + weite, oy + hoch);
      g.lineTo(mx + weite, oy + hoch + dick);
      g.lineTo(mx,         oy - hoch + dick);
      g.lineTo(mx - weite, oy + hoch + dick);
      g.closePath(); g.fill();
    }
  } else if (s.art === "balken"){
    const bw = s.breit ? b * .62 : b * .52;
    const bh = s.breit ? h * .17 : h * .09;
    const luft = s.breit ? h * .11 : h * .13;
    const gesamt = s.n * bh + (s.n - 1) * luft;
    for (let i = 0; i < s.n; i++){
      const oy = my - gesamt/2 + i * (bh + luft);
      g.beginPath();
      if (g.roundRect) g.roundRect(mx - bw/2, oy, bw, bh, bh * .35);
      else g.rect(mx - bw/2, oy, bw, bh);
      g.fill();
      if (s.breit) g.stroke();
    }
  } else if (s.art === "stern"){
    /* Bis zu vier Sterne: eine Reihe, bei vier zwei über zwei — sonst werden
       sie in Spielgröße zu klein, um noch Sterne zu sein. */
    const reihen = s.n === 4 ? [[0,1],[2,3]] : [[...Array(s.n).keys()]];
    const rr = s.n === 4 ? h * .19 : h * .26;
    reihen.forEach((reihe, ri) => {
      const oy = my + (ri - (reihen.length-1)/2) * (rr * 2.1);
      reihe.forEach((_, ci) => {
        const ox = mx + (ci - (reihe.length-1)/2) * (rr * 2.2);
        stern(g, ox, oy, rr); g.fill();
      });
    });
  } else {
    /* Großadmiral: ein großer Stern zwischen zwei Bögen — eine Form, die
       sonst nirgends vorkommt. Es gibt ihn je Land nur einmal. */
    stern(g, mx, my, h * .30); g.fill();
    g.lineWidth = Math.max(1, h * .085);
    /* Radius knapp unter der halben Plakettenhöhe: Mit dem größeren Radius
       standen die Bögen oben und unten über den Rand hinaus. */
    for (const seite of [-1, 1]){
      g.beginPath();
      g.arc(mx, my, h * .44, seite > 0 ? -1.0 : Math.PI - 1.0,
                             seite > 0 ?  1.0 : Math.PI + 1.0);
      g.stroke();
    }
  }
  g.restore();
}

/* =====================================================================
   NAMENSZEILE

   Unter dem **größten** Körper eines Spielers steht `[Abzeichen] Level Name`
   in fester Größe — unabhängig davon, wie groß der Kreis gerade ist. Alle
   kleineren Teilstücke tragen weiter nur den Namen im Kreis.

   Gezeichnet wird in Bildschirmpunkten und **nach** allen Körpern und
   Pulsaren: Sonst schiebt sich eine vorbeiziehende größere Zelle über die
   Anzeige, und in einem Gewühl ist gerade sie nicht mehr lesbar.
   ===================================================================== */

const ZEILE_H = 15;                   // Höhe des Abzeichens in Bildpunkten
const zeilen = [];                    // je Bild neu gefüllt

/* Steckt der Körper unter einem Pulsar? Dann verschwindet auch seine Zeile —
   sonst verriete sie genau das Versteck, das der Pulsar bietet. */
function unterPulsar(x, y, r){
  for (const p of Game.pulsars){
    if (Math.hypot(p.x - x, p.y - y) + r <= PULSAR_R * .98) return true;
  }
  return false;
}

/* Der Körper, an dem die Zeile hängt: der größte. Bei Gleichstand entscheidet
   die Lage, nicht die Reihenfolge im Feld — sonst springt die Zeile zwischen
   zwei gleich großen Stücken hin und her. */
function groesstes(liste){
  let best = null;
  for (const c of liste){
    if (!best) { best = c; continue; }
    if (c.m > best.m + 1e-6) best = c;
    else if (Math.abs(c.m - best.m) <= 1e-6 &&
             (c.x < best.x - 1e-6 || (Math.abs(c.x - best.x) <= 1e-6 && c.y < best.y))) best = c;
  }
  return best;
}

function zeilenZeichnen(g, schuettelX, schuettelY){
  if (!zeilen.length) return;
  g.save();
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.textBaseline = "middle";
  for (const z of zeilen){
    const px = (z.x - cam.x) * cam.z + VW/2 + schuettelX;
    const py = (z.y - cam.y) * cam.z + VH/2 + schuettelY;
    const rr = z.r * cam.z;
    /* Sparzeichnung (Schritt 117): Unter zehn Punkten Radius ist der Name
       länger als der Körper — weglassen spart bei vierzig Körpern die
       teuerste Arbeit des Bildes, das Textmessen. Die eigene Zeile bleibt. */
    if (rr < 10 && !z.eigen) continue;

    const hatAbz = Number.isInteger(z.rang);
    const stufe  = Number.isInteger(z.level) ? String(z.level) : "";
    /* Clan-Kürzel in eckigen Klammern vor dem Namen (Schritt 100). */
    const tag    = z.tag ? "[" + z.tag + "]" : "";

    g.font = `600 ${ZEILE_H - 3}px Georgia, serif`;
    const nameB  = g.measureText(z.name).width;
    g.font = `600 ${ZEILE_H - 5}px Georgia, serif`;
    const stufeB = stufe ? g.measureText(stufe).width + ZEILE_H * .45 : 0;
    const tagB   = tag ? g.measureText(tag).width + ZEILE_H * .35 : 0;
    const abzB   = hatAbz ? abzeichenBreite(ZEILE_H) + ZEILE_H * .32 : 0;
    const breite = abzB + stufeB + tagB + nameB;
    const luft   = ZEILE_H * .38;

    /* Unterhalb des Körpers, mit Abstand zu Ringen und Glühen. Am unteren
       Bildrand wandert die Zeile nach oben über den Kreis — sonst steht sie
       außerhalb des Bildes. */
    const unten = py + rr * 1.30 + ZEILE_H * .85;
    const oben  = py - rr * 1.30 - ZEILE_H * .85;
    const cy = unten + ZEILE_H > VH - 12 ? oben : unten;
    const cx = px - breite/2;
    if (cx + breite < -40 || cx > VW + 40 || cy < -40 || cy > VH + 40) continue;

    g.beginPath();
    const pb = breite + luft*2, ph = ZEILE_H + luft*.9;
    if (g.roundRect) g.roundRect(cx - luft, cy - ph/2, pb, ph, ph*.28);
    else g.rect(cx - luft, cy - ph/2, pb, ph);
    g.fillStyle = TH().label; g.fill();

    let ox = cx;
    if (hatAbz){ abzeichen(g, ox, cy - ZEILE_H/2, z.rang, ZEILE_H);
                 ox += abzeichenBreite(ZEILE_H) + ZEILE_H * .32; }
    if (stufe){
      g.font = `600 ${ZEILE_H - 5}px Georgia, serif`;
      g.textAlign = "left"; g.fillStyle = hexA(TH().brass, .95);
      g.fillText(stufe, ox, cy + .5);
      ox += g.measureText(stufe).width + ZEILE_H * .45;
    }
    if (tag){
      g.font = `600 ${ZEILE_H - 5}px Georgia, serif`;
      g.textAlign = "left"; g.fillStyle = hexA(TH().brass, .95);
      g.fillText(tag, ox, cy + .5);
      ox += g.measureText(tag).width + ZEILE_H * .35;
    }
    g.font = `600 ${ZEILE_H - 3}px Georgia, serif`;
    g.textAlign = "left"; g.fillStyle = TH().paper || "#e8ddc8";
    g.fillText(z.name, ox, cy + .5);

    /* Titel in Gold über dem Namen (Schritt 97). Leicht leuchtend, damit er
       auch auf hellen Designs und im Gewimmel lesbar bleibt. */
    if (z.titel){
      const tt = t("titel_name").toUpperCase();
      g.font = `700 ${ZEILE_H - 2}px Georgia, serif`;
      g.textAlign = "center";
      const ty = cy - ph/2 - ZEILE_H * .62;
      g.lineWidth = 3; g.strokeStyle = "rgba(20,12,0,.75)";
      g.strokeText(tt, px, ty);
      g.shadowColor = "rgba(255,200,80,.8)"; g.shadowBlur = 8;
      g.fillStyle = "#f2c14e";
      g.fillText(tt, px, ty);
      g.shadowBlur = 0;
    }
  }
  g.restore();
}

function hexA(hex,a){
  const n = parseInt(hex.slice(1),16);
  return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;
}
function shade(hex,hue){
  const n = parseInt(hex.slice(1),16);
  const r = clamp((n>>16&255)+hue, 0, 255);
  const g = clamp((n>>8&255), 0, 255);
  const b = clamp((n&255)-hue*.4, 0, 255);
  return `rgb(${r|0},${g|0},${b|0})`;
}
const RIVAL_PAL = new Proxy({}, {get:(t,k) => TH().rival[k]});
/* Grün gegen Rot ist ausgerechnet die Paarung, die bei Rot-Grün-Schwäche
   zusammenfällt. Blau gegen Orange bleibt für alle unterscheidbar. */
const TEAM_PALS = {
  classic:{
    1:{rock:"#5f9c82", dark:"#365c4d", hot:"#7fffc4", air:"#a9e7cf"},
    2:{rock:"#a4503c", dark:"#5f2a1e", hot:"#ff9b2f", air:"#ff9a72"}},
  safe:{
    1:{rock:"#4d68b5", dark:"#2b3c72", hot:"#6fa8ff", air:"#93b4ff"},
    2:{rock:"#c98f2e", dark:"#7a5212", hot:"#ffd166", air:"#f0c27a"}}
};
const teamPal = t => TEAM_PALS[Settings.teams][t === 1 ? 1 : 2];

let zieleStand = "";
function draw(){
  const [mx,my,gm] = centre();
  peak = Math.max(peak, gm);
  // Basiszoom hängt nur an der Masse; FIT gleicht die Bildschirmgröße aus,
  // damit Handy und PC dieselbe Fläche des Spielfelds sehen.
  /* Obergrenze 1,1 statt 1,25 (Schritt 103): Kleine sehen ein Achtel weiter,
     ohne dass sie selbst winzig werden. */
  /* Deckel nach oben hin (Schritt 111, Thomas: „Wenn man extrem groß ist,
     verdeckt man den ganzen Bildschirm"): Der eigene Körper nimmt höchstens
     30 % der kürzeren Bildkante ein. Unter der alten Untergrenze 0,3 füllte
     ein Körper ab etwa 45.000 Masse das Bild. Der Server weitet die Sicht
     dazu (`sicht()` in sim.js), sonst wäre der Rand leer. */
  const eigenR = radiusOf(Math.max(gm,10));
  const deckel = Math.max(0.04, 0.30 * Math.min(VW, VH) / eigenR);
  const target = Math.min(clamp(Math.pow(48/eigenR, .42), .3, 1.1), deckel) * FIT;
  cam.x += (mx-cam.x)*.14; cam.y += (my-cam.y)*.14; cam.z += (target-cam.z)*.05;

  const pad = 60/cam.z;
  const view = {x0:cam.x-VW/2/cam.z-pad, x1:cam.x+VW/2/cam.z+pad,
                y0:cam.y-VH/2/cam.z-pad, y1:cam.y+VH/2/cam.z+pad};
  const seen = o => o.x>view.x0 && o.x<view.x1 && o.y>view.y0 && o.y<view.y1;

  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.fillStyle = TH().ink; ctx.fillRect(0,0,VW,VH);

  ctx.save();
  for (const s of stars){
    const px = (s.x - cam.x*s.d)*cam.z + VW/2, py = (s.y - cam.y*s.d)*cam.z + VH/2;
    if (px < -20 || px > VW+20 || py < -20 || py > VH+20) continue;
    ctx.globalAlpha = s.a;
    ctx.fillStyle = TH().star;
    ctx.fillRect(px - s.r, py - s.r, s.r * 2, s.r * 2);
  }
  ctx.restore();

  ctx.save();
  const sh = Settings.shake ? Game.shake*9 : 0;
  /* Der Versatz des Rüttelns wird gemerkt: Die Namenszeilen werden weiter
     unten in Bildschirmpunkten gezeichnet und müssen dieselbe Erschütterung
     mitmachen, sonst schwimmen sie über dem Bild. */
  const ruettelX = rnd(-sh, sh), ruettelY = rnd(-sh, sh);
  ctx.translate(VW/2 + ruettelX, VH/2 + ruettelY);
  ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  ctx.strokeStyle = TH().border; ctx.lineWidth = 4;
  ctx.strokeRect(0,0,WORLD,WORLD);

  /* Alles außerhalb des Kreises einfärben: Rechteck über den sichtbaren
     Bereich, dann den Kreis gegen den Uhrzeigersinn als Loch hineinlegen.

     Das moveTo() davor ist zwingend: Ohne es zieht arc() automatisch eine
     Verbindungslinie vom Ende des Rechtecks zum Anfang des Kreises — die
     erschien als roter Balken quer durchs Spielfeld.

     Das Rechteck folgt jetzt dem Sichtfeld statt festen Weltgrenzen, sonst
     endet die Einfärbung bei kleinem Zoom sichtbar im Nichts. */
  if (Game.royale && Game.zoneR > 0){
    const cx = WORLD/2, cy = WORLD/2;
    ctx.beginPath();
    ctx.rect(view.x0-600, view.y0-600,
             (view.x1-view.x0)+1200, (view.y1-view.y0)+1200);
    ctx.moveTo(cx + Game.zoneR, cy);
    ctx.arc(cx, cy, Game.zoneR, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fillStyle = TH().zone; ctx.fill();
    const puls = .5 + .25*Math.sin(Game.t*4);
    ctx.beginPath(); ctx.arc(cx, cy, Game.zoneR, 0, 7);
    ctx.strokeStyle = `rgba(${TH().zoneEdge},${puls})`;
    ctx.lineWidth = 6; ctx.stroke();
  }

  /* Sparzeichnung (Schritt 117): Ist ein Trümmer auf dem Schirm kleiner als
     zwei Punkte, sieht niemand den Unterschied zwischen Bogen und Rechteck —
     bei 2.500 sichtbaren Trümmern eines Riesen ist es der Unterschied
     zwischen 17 und 5 ms je Bild. Nach Farbe gebündelt, damit der Pinsel
     nur wenige Male wechselt. */
  if (cam.z < 0.3){
    /* Fernsicht (Schritt 117): Truemmer sind hier kleiner als ein Punkt.
       Rechtecke statt Boegen, nach Farbe gebuendelt — und je kleiner sie
       auf dem Schirm waeren, desto weniger davon: jedes zweite bzw. vierte.
       Der Staub sieht gleich dicht aus, kostet aber ein Viertel. Ein
       gemeinsamer Pfad (Path2D) war gemessen langsamer als einzelne
       Rechtecke. */
    const kante = Math.max(2 / cam.z, 3);
    const punkt = 8 * cam.z;                       // Durchmesser eines Truemmers auf dem Schirm
    const schritt = punkt >= 1 ? 1 : punkt >= 0.5 ? 2 : 4;
    const nachFarbe = new Map();
    const deb = Game.debris;
    for (let i = 0; i < deb.length; i += schritt){
      const d = deb[i];
      if (!d || !seen(d)) continue;
      let l = nachFarbe.get(d.c); if (!l){ l = []; nachFarbe.set(d.c, l); }
      l.push(d);
    }
    for (const [farbe, liste] of nachFarbe){
      ctx.fillStyle = farbe;
      for (const d of liste){ const k = Math.max(kante, d.r * 2); ctx.fillRect(d.x - k/2, d.y - k/2, k, k); }
    }
  } else for (const d of Game.debris){
    if (!seen(d)) continue;
    ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,7); ctx.fillStyle = d.c; ctx.fill();
  }
  for (const s of Game.shed){
    if (!seen(s)) continue;
    // Ab Rangstufe III glüht die geworfene Masse — sichtbarer Unterschied,
    // der nichts am Spiel ändert, aber den Rang im Feld zeigt.
    if (s.hot && s.tier >= 3 && !Settings.lowPower){
      const g = ctx.createRadialGradient(s.x, s.y, s.r*.4, s.x, s.y, s.r*2.6);
      g.addColorStop(0, hexA(s.hot, .55));
      g.addColorStop(1, hexA(s.hot, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r*2.6, 0, 7); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,7); ctx.fillStyle = s.c; ctx.fill();
    if (s.hot && s.tier >= 3){
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r*.45, 0, 7);
      ctx.fillStyle = hexA(s.hot, .85); ctx.fill();
    }
  }
  const all = [...Game.rivals.map(o => ({o, mine:false})),
               ...Game.cells.map(o => ({o, mine:true}))].sort((a,b) => a.o.m-b.o.m);
  /* Eventide: Schweif aus Reststaub. Die Punkte werden im Schritt gesammelt,
     hier nur gezeichnet — vor den Körpern, damit sie darunter liegen. */
  if (skin.trait === "trail" && !Settings.lowPower){
    for (const c of Game.cells){
      if (!c.trail) continue;
      for (let i=0;i<c.trail.length;i++){
        const p = c.trail[i], f = (i+1)/c.trail.length;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radiusOf(c.m)*(.25 + f*.55), 0, 7);
        ctx.fillStyle = hexA(skin.air, .07*f);
        ctx.fill();
      }
    }
  }

  const lead = Game.cells.reduce((p,c) => !p || c.m > p.m ? c : p, null);

  /* Unsichtbare Große in Sprungweite einsammeln — gezeichnet nach dem
     Spielfeld, in Bildschirmkoordinaten (`gefahrenMalen`). */
  randGefahren.length = 0;
  if (lead && Game.running){
    const meine = lead.m;
    const schonDa = new Set();
    /* Schritt 111 (Thomas): Pfeile nur für Körper über GEFAHR_MASSE, und
       nur, wenn sie näher kommen — ein Riese, der wegfährt, ist keine
       Warnung wert. */
    const jetztDa = new Set();
    for (const {o, mine} of all){
      if (mine || o.m < GEFAHR_MASSE || o.m < meine*2.44 || seen(o)) continue;
      const key = o.gid !== undefined ? "g" + o.gid : o;
      if (schonDa.has(key)) continue;
      schonDa.add(key); jetztDa.add(key);
      const d = Math.hypot(o.x - lead.x, o.y - lead.y);
      const vorher = gefahrAbstand.get(key);
      gefahrAbstand.set(key, d);
      const reich = splitPush(o.m/2) + radiusOf(o.m/2) + radiusOf(o.m) + radiusOf(meine) + 300;
      if (d > reich) continue;
      if (!(vorher > d + 0.5)) continue;          // kommt nicht näher
      randGefahren.push({dx:o.x - cam.x, dy:o.y - cam.y, m:o.m, nah: clamp(1 - d/reich, 0, 1)});
    }
    for (const k of gefahrAbstand.keys()) if (!jetztDa.has(k)) gefahrAbstand.delete(k);
  }

  /* Namenszeilen einsammeln: je Spieler eine, am größten Stück. Online
     gehören alle Zellen mit derselben `gid` zu einem Spieler; lokal ist jeder
     Rivale ein eigener Körper und damit seine eigene Gruppe. */
  zeilen.length = 0;
  const traeger = new Set();
  if (Settings.labels !== "off"){
    const gruppen = new Map();
    for (const {o, mine} of all){
      if (mine) continue;
      if (!seen(o)) continue;
      const schluessel = o.gid !== undefined ? "g" + o.gid : o;
      if (!gruppen.has(schluessel)) gruppen.set(schluessel, []);
      gruppen.get(schluessel).push(o);
    }
    for (const teile of gruppen.values()){
      const c = groesstes(teile);
      if (!c || radiusOf(c.m) * cam.z < 7) continue;
      if (unterPulsar(c.x, c.y, radiusOf(c.m))) continue;
      traeger.add(c);
      zeilen.push({x:c.x, y:c.y, r:radiusOf(c.m), name:c.name,
                   titel: Game.online && Net.kt > 0 && c.gid === Net.kt,
                   tag: c.tag || null,
                   level:Number.isInteger(c.lvl) ? c.lvl : null,
                   rang: Number.isInteger(c.rang) ? c.rang : null});
    }
    /* Die eigene Zeile. Level kennt der Browser immer, das Abzeichen nur mit
       Konto — Ehre gibt es nicht ohne Konto. */
    const meins = groesstes(Game.cells);
    if (meins && !unterPulsar(meins.x, meins.y, radiusOf(meins.m))){
      traeger.add(meins);
      zeilen.push({x:meins.x, y:meins.y, r:radiusOf(meins.m), name:Game.name, eigen:true,
                   titel: Game.online && Net.kt > 0 && Net.kt === Net.you,
                   tag: istAngemeldet() && Konto.profil.clan ? Konto.profil.clan.tag : null,
                   level:Profile.level,
                   rang: istAngemeldet() && Number.isInteger(Konto.profil.rang)
                         ? Konto.profil.rang : null});
    }
  }

  const meineMonde = eigeneMonde();
  for (const {o,mine} of all){
    /* Eigene Stuecke ausserhalb des Bildes ebenfalls ueberspringen (Schritt
       117): Nach einem Pulsar liegen bis zu sechzehn davon verstreut, und
       jedes wurde bisher voll gezeichnet, auch unsichtbar. Das groesste
       bleibt immer — an ihm haengen Zeile und Kamera. */
    if (!seen(o) && (!mine || o !== lead)) continue;
    const pal = mine ? skin
      : (Game.teams && o.team) ? teamPal(o.team)
      : o.pal ? o.pal
      : Game.teams ? teamPal(o.team) : RIVAL_PAL;
    /* Wer eine Zeile unter sich hat, trägt keinen Namen mehr im Kreis —
       sonst stünde er zweimal da. */
    const label = Settings.labels === "off" || traeger.has(o) ? ""
      : (Settings.labels === "lead" && mine && o !== lead) ? "" : o.name;
    /* Monde (Schritt 108): Bahn außerhalb von r, hintere Hälfte vor dem
       Körper, vordere danach. Eigene nur in der Liga. */
    const rWelt = radiusOf(o.m);
    /* Sparzeichnung (Schritt 117): Ein fremder Körper, der auf dem Schirm
       kleiner als 14 Punkte ist, bekommt eine flache Scheibe in seiner
       Grundfarbe — Verläufe, Krater und Hülle wären dort ohnehin unsichtbar.
       Der eigene Körper wird immer voll gezeichnet. */
    if (!mine && rWelt * cam.z < 14){
      ctx.beginPath(); ctx.arc(o.x, o.y, rWelt, 0, 7);
      ctx.fillStyle = (pal && pal.rock) || RIVAL_PAL.rock; ctx.fill();
      continue;
    }
    const monde = mine ? meineMonde : o.mo;
    if (monde) mondeMalen(ctx, o.x, o.y, rWelt, monde, Game.t, true);
    body(ctx, o.x, o.y, rWelt, o.m, pal, mine ? 0 : o.tint, label, mine,
         mine ? skin.tier : o.tier, mine ? skin.trait : o.trait);
    if (monde) mondeMalen(ctx, o.x, o.y, rWelt, monde, Game.t);
  }
  if (Game.safe > 0 && Game.running){
    const puls = .35 + .25*Math.sin(Game.t*7);
    for (const c of Game.cells){
      ctx.beginPath(); ctx.arc(c.x, c.y, radiusOf(c.m)*1.28, 0, 7);
      ctx.strokeStyle = hexA(TH().brass, puls);
      ctx.lineWidth = 3; ctx.setLineDash([9, 7]); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  for (const s of Game.sparks){
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7);
    ctx.fillStyle = hexA(s.colour, Math.max(0, Math.min(1, s.life)));
    ctx.fill();
  }

  /* Pulsare liegen jetzt VOR den Körpern: Wer klein genug ist, verschwindet
     darunter. Vorher lag der Spieler oben und das Versteck war wirkungslos —
     man sah genau, wer sich da verbirgt. */
  for (const p of Game.pulsars){
    if (!seen(p)) continue;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin);
    ctx.beginPath();
    for (let i=0;i<20;i++){
      const a = i/20*6.2832, rr = PULSAR_R*(i%2 ? .74 : 1 + p.fed*.02);
      i ? ctx.lineTo(Math.cos(a)*rr, Math.sin(a)*rr)
        : ctx.moveTo(Math.cos(a)*rr, Math.sin(a)*rr);
    }
    ctx.closePath();
    ctx.fillStyle = TH().pulsar; ctx.fill();
    ctx.strokeStyle = TH().pulsarEdge; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, PULSAR_R*.3, 0, 7);
    ctx.fillStyle = TH().pulsarCore; ctx.fill();
    ctx.restore();
  }

  for (const g of Game.rings){
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, 7);
    ctx.strokeStyle = hexA(g.colour, Math.max(0, g.life)*.55);
    ctx.lineWidth = 3.5; ctx.stroke();
  }
  ctx.restore();

  /* Namenszeilen ganz zuletzt — nach Körpern, Pulsaren und Ringen. Eine
     vorbeiziehende größere Zelle darf die Anzeige nicht verdecken. */
  zeilenZeichnen(ctx, ruettelX, ruettelY);

  // Stick sichtbar machen, solange der Daumen liegt
  if (isTouch && stick.active && Game.running){
    ctx.beginPath(); ctx.arc(stick.ox, stick.oy, STICK_MAX, 0, 7);
    ctx.strokeStyle = hexA(TH().brass, .22); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath();
    ctx.arc(stick.ox + stick.dx*STICK_MAX*.55, stick.oy + stick.dy*STICK_MAX*.55, 13, 0, 7);
    ctx.fillStyle = hexA(TH().brass, .30); ctx.fill();
  }

  $("mass").firstChild.nodeValue = Math.round(gm);
  const gp = $("goalPlate");
  if (Game.goals.length && Game.running){
    gp.hidden = false;
    // Die ersten Sekunden blinkt der Rahmen, damit man die Tafel überhaupt bemerkt
    gp.classList.toggle("flash", Game.t < 4);
    /* Nur neu aufbauen, wenn sich etwas geändert hat: Vorher wurde die
       Liste bei **jedem Bild** neu in die Seite geschrieben — Layout und
       Schriftsatz sechzigmal je Sekunde für einen Text, der sich alle paar
       Minuten ändert. */
    const stand = Game.goals.map(it => (it.done ? "1" : "0") + it.def.id).join("|") + lang;
    if (stand !== zieleStand){
      zieleStand = stand;
      $("goalList").innerHTML = Game.goals.map(it =>
        `<div class="goal${it.done ? " done" : ""}"><i>${it.done ? "✓" : "○"}</i>` +
        `<span>${esc(t("g_"+it.def.id))}</span></div>`).join("");
    }
  } else gp.hidden = true;

  /* Levelaufstieg: groß in der Bildmitte, Ringe nach außen, Schrift wächst
     und verblasst. Das ist der einzige Moment, in dem das Spiel sich selbst
     feiern darf — er kommt bei 100 Leveln selten genug. */
  if (Game.levelFx && Game.running){
    const fx = Game.levelFx;
    const p = 1 - fx.life/3.0;                       // 0 → 1
    const ein = Math.min(1, p*7);                    // schneller Auftritt
    const aus = Math.max(0, Math.min(1, (1-p)*3.2)); // sanftes Verblassen
    const a = ein*aus;
    ctx.save();
    ctx.translate(VW/2, VH*0.38);

    for (let i=0;i<3;i++){
      const rr = 40 + p*(260 + i*90);
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, 7);
      ctx.strokeStyle = hexA(TH().brass, a*(.35 - i*.09));
      ctx.lineWidth = 3; ctx.stroke();
    }
    const glow = ctx.createRadialGradient(0,0,0, 0,0, 220);
    glow.addColorStop(0, hexA(TH().brass, a*.22));
    glow.addColorStop(1, hexA(TH().brass, 0));
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0,0,220,0,7); ctx.fill();

    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const gross = 44 + ein*22;
    ctx.font = `600 ${gross}px Georgia, serif`;
    ctx.fillStyle = hexA(TH().brass, a);
    ctx.fillText(t("lvlup", fx.level), 0, 0);
    if (fx.skin){
      ctx.font = `600 20px Georgia, serif`;
      ctx.fillStyle = hexA(TH().paper, a);
      ctx.fillText(t("lvlskin", fx.skin), 0, gross*0.85);
      ctx.font = `400 14px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillStyle = hexA(TH().paper2, a);
      ctx.fillText(t("lvlworn"), 0, gross*0.85 + 26);
    }
    ctx.restore();
  }

  /* Warnpfeile in Bildschirmkoordinaten — nach dem Spielfeld, vor der Anzeige. */
  gefahrenMalen(ctx);
  /* Bildrate (Schritt 115): kleine Zahl links unten, nur auf Wunsch. */
  if (Settings.fps && Game.running){
    ctx.save();
    ctx.font = "600 12px " + (getComputedStyle(document.body).getPropertyValue("--sans") || "sans-serif");
    ctx.textBaseline = "bottom"; ctx.textAlign = "left";
    const txt = Math.round(fpsAnzeige) + " fps" + (ECO ? " · " + t("s_eco_kurz") : "") + " · " + DPR.toFixed(2) + "×";
    ctx.fillStyle = "rgba(0,0,0,.45)";
    const w = ctx.measureText(txt).width + 12;
    ctx.fillRect(Settings.hudEdge, VH - Settings.hudEdge - 20, w, 20);
    ctx.fillStyle = fpsAnzeige >= 50 ? "#7fffc4" : fpsAnzeige >= 30 ? "#ffd166" : "#f26b5b";
    ctx.fillText(txt, Settings.hudEdge + 6, VH - Settings.hudEdge - 3);
    ctx.restore();
  }

  const hEl = $("hint");
  if (Game.hint && Game.running && Game.t < Game.hintUntil){
    hEl.hidden = false;
    hEl.textContent = Game.hint;
    hEl.style.opacity = String(clamp(Game.hintUntil - Game.t, 0, 1));
  } else hEl.hidden = true;

  const tEl = $("toast");
  if (Game.toast && Game.toast.life > 0 && Game.running){
    tEl.hidden = false;
    tEl.textContent = Game.toast.text;
    tEl.style.opacity = String(Math.min(1, Game.toast.life));
  } else tEl.hidden = true;

  const rp = $("royalePlate");
  if (Game.royale && Game.running){
    rp.hidden = false;
    $("brLeft").textContent = Game.online ? Math.max(1, Net.lebende || 1) : bodyCount() + 1;
    const nx = Game.online ? null : zoneNext(Game.t);
    $("brZoneLabel").textContent = nx === null ? t("field") : t("fieldcloses");
    $("brZone").textContent = Game.online ? (Game.zoneR <= 320 ? t("final") : Math.round(Game.zoneR).toLocaleString(lang))
                            : nx === null ? t("final") : Math.ceil(nx) + "s";
    const s = Math.max(0, Math.round(Game.left));
    $("brClock").textContent = Math.floor(s/60) + ":" + String(s%60).padStart(2,"0");
  } else rp.hidden = true;

  const plate = $("clanPlate");
  if (Game.teams && Game.running){
    plate.hidden = false;
    let us = gm, them = 0;
    if (Game.online && Net.tms){ us = Game.team === 2 ? Net.tms[1] : Net.tms[0]; them = Game.team === 2 ? Net.tms[0] : Net.tms[1]; }
    else for (const r of Game.rivals) (r.team === 1 ? us += r.m : them += r.m);
    $("clanUs").textContent = Math.round(us);
    $("clanThem").textContent = Math.round(them);
    const s = Math.max(0, Math.round(Game.left));
    $("clanClock").textContent = Math.floor(s/60) + ":" + String(s%60).padStart(2,"0");
  } else plate.hidden = true;
  paintStage(gm); paintBoard(gm);
  /* Die Musik wird aus der Bildschleife getaktet, nicht aus einem eigenen
     Zeitgeber: Browser drosseln Zeitgeber in verdeckten Tabs, und dann bliebe
     sie auf einem Akkord stehen. */
  Musik.takt();
  requestAnimationFrame(loop);
}
function paintStage(m){
  const i = stageOf(m), s = STAGES[i], next = STAGES[i+1];
  $("stageName").textContent = t("st"+i);
  $("stageHint").textContent = t("st" + i + "h");
  $("stageBar").style.width = next ? clamp((m-s.at)/(next.at-s.at),0,1)*100+"%" : "100%";
  const sl = $("safeLine");
  const canFeast = Game.running && Game.cells.length >= FEAST_CELLS &&
                   Game.cells.some(c => c.m > PULSAR_MASS*1.22);
  if (Game.safe > 0 && Game.running){
    sl.hidden = false;
    sl.textContent = t("protected", Math.ceil(Game.safe));
  } else if (canFeast){
    sl.hidden = false;
    sl.textContent = t("feast");
    if (!Game.feastSeen){
      Game.feastSeen = true;
      toast(t("feast"));
    }
  } else sl.hidden = true;
}
const esc = s => String(s).replace(/[<>&"]/g, c => ({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c]));
/* Wie viele Ranglistenzeilen passen wirklich? Vorher war das eine Schätzung
   aus festen Pixelwerten je Tafel. Sie stimmte nicht: Aufgabentexte brechen in
   langen Sprachen um, und die rechte Spalte ist zusätzlich gedeckelt, damit sie
   die Daumentasten frei lässt. Auf einem Handy im Querformat lag die Rangliste
   dadurch gut hundert Pixel unterhalb der Kante und wurde abgeschnitten.
   Jetzt wird der Platz gemessen statt geraten — zweimal pro Sekunde, weil
   Geometrie abzufragen den Bildaufbau anhält und sich hier selten etwas ändert. */
/* Höhe, die die Daumentasten unten rechts beanspruchen. Steht auch im CSS
   (`--pad-room`), von dort gesetzt aus dieser Konstante. */
const PAD_ROOM = 104;
document.documentElement.style.setProperty("--pad-room", PAD_ROOM + "px");

function paintBoard(gm){
  let list;
  if (Game.online){
    /* Online kommt die Rangliste vom Server. Die lokale Zählung könnte nur
       Spieler im eigenen Sichtfeld sehen — das wäre keine Rangliste, sondern
       eine Nachbarschaftsliste. Der Server schickt die besten zehn des Raums.
       Steht man selbst nicht darunter, wird man angehängt — mit dem echten
       Platz aus `Net.platz` (Schritt 102). Vorher stand dort immer „11",
       weil nur die Länge der Liste plus eins bekannt war. */
    list = Net.top.map(e => +e.id === Net.you
      ? {name:Game.name, m:+e.m, me:true, titel: +e.id === Net.kt}
      : {name:mitMarke(String(e.n || "?"), e.b), m:+e.m, titel: +e.id === Net.kt});
    if (gm > 0 && !list.some(e => e.me))
      list.push({name:Game.name, m:gm, me:true, titel: Net.kt === Net.you, platz: Net.platz || 0});
  } else {
    const byGid = new Map();
    for (const r of Game.rivals){
      const e = byGid.get(r.gid);
      if (e) e.m += r.m; else byGid.set(r.gid, {name:r.name, m:r.m});
    }
    list = [...byGid.values()];
    if (gm > 0) list.push({name:Game.name, m:gm, me:true});
  }
  list.sort((a,b) => b.m-a.m);

  /* **Fünf Plätze und der eigene.** Thomas' Vorgabe vom 15.09.2026: „Die
     ersten 5 Plätze reichen und der eigene Platz."

     Vorher rechnete `boardRoom()` aus, wie viele Zeilen in die Spalte
     passen — bis zu zehn. Das hatte zwei Nachteile: Die Liste wuchs und
     schrumpfte beim Spielen, je nachdem was sonst gerade in der Spalte
     stand, und sie war die höchste Tafel im Bild, obwohl sie nicht die
     wichtigste ist. Fünf ist eine Zahl, die man auf einen Blick erfasst.

     Der eigene Eintrag kommt dazu, wenn er nicht unter den ersten fünf ist —
     sonst sähe man ausgerechnet die eigene Platzierung nicht. Er ersetzt
     dabei niemanden: Es werden dann sechs Zeilen, und die sechste ist die
     eigene. */
  const BOARD_PLAETZE = 5;
  const meIdx = list.findIndex(e => e.me);
  const zeigen = list.slice(0, BOARD_PLAETZE).map((e,i) => ({e, rang:i+1}));
  if (meIdx >= BOARD_PLAETZE){
    const eigener = list[meIdx];
    zeigen.push({e:eigener, rang: eigener.platz > meIdx ? eigener.platz : meIdx+1});
  }
  let titelZeile = "";
  if (Game.online && Net.kt > 0 && !zeigen.some(z => z.e.titel)){
    const w = Net.kt === Net.you ? {n: Game.name} : Net.wer.get(Net.kt);
    titelZeile = `<div class="row"><span><b style="color:#f2c14e">♛</b> ${esc((w && w.n) || "?")}</span>` +
                 `<span>${dauerText(Net.kts)}</span></div>`;
  }
  $("board").innerHTML = zeigen.map(({e,rang}) =>
    `<div class="row${e.me?" me":""}"><span>${rang}. ${e.titel ? '<b style="color:#f2c14e">♛</b> ' : ""}${esc(e.name)}</span>` +
    `<span>${Math.round(e.m)}</span></div>`
  ).join("") + titelZeile;
}

/* =====================================================================
   5) LOOP
   ===================================================================== */
/* Pause, sobald der Tab in den Hintergrund geht. Portale verlangen das, und
   ohne läuft man weiter, während man eine Nachricht liest — der ärgerlichste
   Tod überhaupt. Mit echtem Server geht das nicht mehr; dann muss die Figur
   stattdessen sichtbar untätig bleiben. */
let paused = false;
document.addEventListener("visibilitychange", () => {
  paused = document.hidden;
  if (paused) Portal.gameplayStop(); else if (Game.running) Portal.gameplayStart();
  if (Sound.ctx){
    if (paused) Sound.ctx.suspend();
    else if (Sound.on) Sound.ctx.resume();
  }
});

/* Bildratenwächter (Schritt 100 neu). Vorher: Einmal in den ersten zwei
   Sekunden unter 45 Bilder/s — genau dann, wenn der Browser noch übersetzt
   und lädt — und der Sparmodus stand **für immer** im Speicher. Jetzt:
   - die ersten drei Sekunden zählen nicht,
   - zwei schlechte Fenster hintereinander senken auf die Sparstufe (`ECO`),
   - läuft es eine Weile gut, geht es wieder hoch,
   - gespeichert wird nichts. */
let fpsFenster = [], fpsSchlecht = 0, fpsGut = 0;
let fpsAnzeige = 0;                     // geglättete Bilder je Sekunde (Schritt 115)
function wacheFps(dt){
  if (dt > 0) fpsAnzeige = fpsAnzeige ? fpsAnzeige * 0.9 + (1 / dt) * 0.1 : 1 / dt;
  if (Settings.lowPower || !Game.running) return;
  if (Game.t < 3){ fpsFenster.length = 0; return; }
  fpsFenster.push(dt);
  if (fpsFenster.length < 90) return;
  const mittel = fpsFenster.reduce((a,b)=>a+b,0) / fpsFenster.length;
  fpsFenster.length = 0;
  const fps = 1 / mittel;
  if (fps < 40){ fpsSchlecht++; fpsGut = 0; } else if (fps > 55){ fpsGut++; fpsSchlecht = 0; } else { fpsSchlecht = 0; }
  if (ECO === 0 && fpsSchlecht >= 2){
    ECO = 1; fpsSchlecht = 0; seedStars(); resize();
    toast(t("s_eco"));
  } else if (ECO === 1 && fpsGut >= 12){   // rund 20 Sekunden flüssig
    ECO = 0; fpsGut = 0; seedStars(); resize();
  }
}

let last = performance.now();
function loop(t){
  const dt = Math.min(.05, (t-last)/1000); last = t;
  /* Vor der ersten Runde und zwischen zwei Runden zeichnet der Menühimmel
     (Schritt 88). Ohne ihn lag hinter Anmeldung und Konsole eine schwarze
     Fläche — das war der Grund, warum beide wie eine Seite aussahen und
     nicht wie ein Spiel. `MenueHimmel` steht am Dateiende und ist beim
     ersten Bild längst angelegt; die Prüfung fängt nur den Fall ab, dass
     das Laden vorher abbricht. */
  if (typeof MenueHimmel !== "undefined" && MenueHimmel.vielleichtZeichnen(t)){
    requestAnimationFrame(loop);
    return;
  }
  if (Game.running && !Integrity.locked && !portrait && !paused){ step(dt); wacheFps(dt); }
  draw();
}
requestAnimationFrame(loop);

/* =====================================================================
   6) SCREENS
   ===================================================================== */
/* Seit Schritt 79 sind „Designs" und „Errungenschaften" Reiter im
   Startbildschirm und keine eigenen Bildschirme mehr. */
/* Jeder Schleier, den `show()` wechselt, muss hier stehen — sonst bleibt er
   hinter dem nächsten offen (so geschehen mit dem Bonusfenster, 16.09.2026). */
const VEILS = ["accountVeil","startVeil","testVeil","endVeil","legalVeil",
               "friendsVeil","setVeil","rankVeil","pwVeil","pwaVeil","clanVeil",
               "hilfeVeil","bonusVeil","meldeVeil"];


const SET_UI = [
  /* Die Stufen lagen bei 0,12 bis 0,4. Zusammen mit den ohnehin leisen
     Einzeltönen (0,08 bis 0,34) kam am Lautsprecher eines Handys ein Bruchteil
     der Vollaussteuerung an — das Spiel galt schlicht als tonlos. */
  {key:"volume", label:"s_sound", hint:"s_sound_h",
   opts:[["o_off",0],["o_quiet",0.35],["o_normal",0.7],["o_loud",1]]},
  {key:"music", label:"s_music", hint:"s_music_h",
   opts:[["o_off",0],["o_quiet",0.3],["o_normal",0.55],["o_loud",0.85]]},
  {key:"shake", label:"s_shake", hint:"s_shake_h",
   opts:[["o_on",true],["o_off",false]]},
  {key:"sens", label:"s_stick", hint:"s_stick_h",
   opts:[["o_short",44],["o_normal",62],["o_long",84]], touch:true},
  {key:"lefty", label:"s_side", hint:"s_side_h",
   opts:[["o_right",false],["o_left",true]], touch:true},
  {key:"teams", label:"s_clan", hint:"s_clan_h",
   opts:[["o_gr","classic"],["o_bo","safe"]]},
  {key:"labels", label:"s_names", hint:"s_names_h",
   opts:[["o_all","all"],["o_largest","lead"],["o_off","off"]]},
  {key:"theme", label:"s_theme", hint:"s_theme_h",
   opts:[["o_earth","earth"],["o_sand","sand"]]},
  {key:"lang", label:"language", opts:"langs"},
  {key:"hints", label:"s_hints", hint:"s_hints_h",
   opts:[["o_on",true],["o_off",false]]},
  {key:"hudEdge", label:"s_edge", hint:"s_edge_h",
   opts:[["o_tight",8],["o_safe",44]], touch:true},
  {key:"lowPower", label:"s_perf", hint:"s_perf_h",
   opts:[["o_off",false],["o_on",true]]},
  {key:"fps", label:"s_fps", hint:"s_fps_h",
   opts:[["o_off",false],["o_on",true]]}
];

function applySetting(key){
  if (key === "volume"){
    Sound.on = Settings.volume > 0;
    if (Sound.bus) Sound.bus.gain.value = Settings.volume;
    if (Sound.on) Sound.unlock();
  }
  if (key === "music") Musik.nachziehen();
  einstellungenSichern();
  if (key === "sens") STICK_MAX = Settings.sens;
  if (key === "lefty") document.body.classList.toggle("lefty", Settings.lefty);
  if (key === "hudEdge"){
    const h = $("hud");
    if (h) h.style.setProperty("--edge-x", Settings.hudEdge + "px");
  }
  // Wieder einschalten heißt: von vorn. Sonst bringt der Schalter nichts,
  // wenn man alle Hinweise schon gesehen hat.
  if (key === "hints" && Settings.hints){
    Profile.hints.clear();
    Profile.hintRuns = 0;          // wieder zwei Runden lang zeigen
  }
  if (key === "theme") applyTheme();
  if (key === "lowPower"){ seedStars(); resize(); }   // resize: Sparmodus regelt die Bildschärfe
}

/* Der Spielername (Schritt 113, Thomas): vergeben bei der Registrierung,
   danach nur in den Einstellungen, alle 30 Tage (`NAME_SPERRE_TAGE` im
   Server). Im Hangar ist das Feld für Konten deshalb nur noch Anzeige;
   Gäste tippen dort weiter ihren Namen. */
/* Der Name, unter dem man spielt — die **eine** Stelle dafür (Schritt 118).
   Mit Konto kommt er aus dem Profil, sonst vom Gast. Das Namensfeld im
   Hangar ist weg: Der Name steht mittig über dem Körper und wird nur in
   den Einstellungen geändert (Konto: alle 30 Tage, der Server prüft). */
function spielerName(){
  if (istAngemeldet() && Konto.profil.name) return Konto.profil.name;
  return Gast.name || "";
}
function nameZeileBauen(box){
  const an = istAngemeldet();
  const p = an ? Konto.profil : { name: Gast.name };
  const seit = an ? (Number(p.nameSeit) || 0) : 0, frei = seit + 30 * 86400000, gesperrt = seit > 0 && Date.now() < frei;
  const wrap = document.createElement("div");
  wrap.className = "opt"; wrap.dataset.key = "name";
  wrap.innerHTML = `<div><b>${esc(t("s_name"))}</b><small>${esc(gesperrt ? t("s_name_note", new Date(frei).toLocaleDateString(lang)) : t("namerule"))}</small></div>` +
    `<div class="nameWechsel"><input type="text" id="setName" maxlength="14" value="${esc(p.name || "")}" autocomplete="off" autocapitalize="off" spellcheck="false" ${gesperrt ? "disabled" : ""}>` +
    `<button type="button" id="setNameGo" ${gesperrt ? "disabled" : ""}>${esc(t("s_name_go"))}</button></div>`;
  box.appendChild(wrap);
  guardName($("setName"));
  const go = $("setNameGo");
  if (go) go.addEventListener("click", async () => {
    const n = cleanName($("setName").value).trim();
    if (!n || n === spielerName()) return;
    go.disabled = true;
    if (!an){
      /* Gast: der Name gehört dem Browser, keine Sperre — er steht in
         keiner Rangliste und kann niemanden verwechseln. */
      Gast.name = n.slice(0, NAME_MAX); Gast.sichern();
      Game.name = Gast.name; toast(t("s_name_ok")); heldMalen(); buildSettings();
      return;
    }
    const e = await Konto.einstellen({ name: n });
    if (e.ok){ toast(t("s_name_ok")); Game.name = Konto.profil.name; heldMalen(); }
    else toast(t(KONTO_FEHLER[e.fehler] || "e_net"));
    buildSettings();
  });
}
/* Welche Fassung läuft (Schritt 114): steht unten in den Einstellungen,
   damit Thomas am Handy sieht, ob die neue Fassung angekommen ist. Die
   Nummer steht nur in sw.js — von dort wird sie gelesen. */
let fassungText = "";
function fassungZeigen(){
  const el = $("setFassung");
  if (!el) return;
  /* Dahinter der Zustand des 3D-Modells — die eine Zeile, die Thomas
     vorlesen kann, wenn es auf einem Gerät nicht erscheint. */
  const drei = () => {
    try {
      if (Held3D.ok === false) return " · 3D: aus — " + (Held3D.grund || "unbekannt");
      if (Held3D.ok && Held3D.ruhig()) return " · 3D: an, steht still (Sparmodus, schwache Grafik oder „Bewegung reduzieren“)";
      if (Held3D.ok) return " · 3D: an";
    } catch(_){}
    return "";
  };
  if (fassungText){ el.textContent = fassungText + drei(); return; }
  fetch("sw.js", { cache: "no-store" }).then(r => r.text()).then(txt => {
    const m = txt.match(/VERSION = "(v\d+)"/);
    if (m){ fassungText = "Talumi " + m[1]; el.textContent = fassungText + drei(); }
  }).catch(() => {});
}
function buildSettings(){
  const box = $("setList");
  box.innerHTML = "";
  fassungZeigen();
  nameZeileBauen(box);
  for (const row of SET_UI){
    if (row.touch && !isTouch) continue;
    if (row.key === "music" && !MUSIK_AKTIV) continue;
    const wrap = document.createElement("div");
    wrap.className = "opt";
    /* Damit ein Pruefstand nach einer Zeile fragen kann, ohne sie an ihrer
       uebersetzten Beschriftung zu suchen — die aendert sich mit der Sprache. */
    wrap.dataset.key = row.key;
    const text = document.createElement("div");
    text.innerHTML = `<b>${t(row.label)}</b>` +
      (row.hint ? `<small>${t(row.hint)}</small>` : "");
    const seg = document.createElement("div");
    seg.className = "seg";
    const opts = row.opts === "langs"
      ? Object.keys(LANGNAMES).map(c => [LANGNAMES[c], c]) : row.opts;
    for (const [label, value] of opts){
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = row.opts === "langs" ? label : t(label);
      const cur = row.key === "lang" ? lang : Settings[row.key];
      b.setAttribute("aria-pressed", String(cur === value));
      b.addEventListener("click", () => {
        if (row.key === "lang"){ lang = value; applyLang(); buildSettings(); return; }
        Settings[row.key] = value;
        applySetting(row.key);
        buildSettings();
        if (row.key === "volume" && value > 0) Sound.tone(660, .08, "sine", .16);
      });
      seg.appendChild(b);
    }
    wrap.appendChild(text); wrap.appendChild(seg);
    box.appendChild(wrap);
  }

  /* Einwilligung ändern. Ein Widerruf muss so leicht sein wie die Zustimmung
     war — deshalb steht er hier und nicht irgendwo im Rechtstext. Er
     erscheint nur, wenn es überhaupt etwas zu erlauben gibt. */
  if (WERBUNG_AKTIV){
    const cw = document.createElement("div");
    cw.className = "opt";
    const ct = document.createElement("div");
    ct.innerHTML = `<b>${t("ck_kopf")}</b><small>${
      Einwilligung.gefragt()
        ? t(Einwilligung.erlaubt("werbung") || Einwilligung.erlaubt("messung")
            ? "ck_stand_ja" : "ck_stand_nein")
        : t("ck_stand_offen")}</small>`;
    const cb = document.createElement("button");
    cb.type = "button"; cb.className = "quiet";
    cb.textContent = t("ck_aendern");
    cb.addEventListener("click", () => { show("startVeil"); Einwilligung.widerrufen(); });
    cw.appendChild(ct); cw.appendChild(cb);
    box.appendChild(cw);
  }

  /* Konto ganz unten: Wer angemeldet ist, sieht hier, als wer — und kommt
     wieder heraus. Ohne Konto steht hier nichts; ein Abmeldeknopf für
     niemanden wäre nur Verwirrung. */
  if (!Konto.angemeldet()){
    /* Schritt 95: Ein Gast kam bisher nur über Neuladen zur Anmeldung. Wer
       nach ein paar Runden Lust auf ein Konto bekommt, ist genau der Spieler,
       den man halten will — also hier ein Weg dorthin. Nur, wenn der Server
       überhaupt erreichbar ist. */
    if (Konto.erreichbar !== true) return;
    const gw = document.createElement("div");
    gw.className = "opt";
    const gt = document.createElement("div");
    gt.innerHTML = `<b>${esc(t("k_guest"))}</b><small>${esc(t("k_why"))}</small>`;
    const gb = document.createElement("button");
    gb.type = "button"; gb.className = "quiet";
    gb.style.cssText = "margin:0;width:auto;padding:6px 12px";
    gb.textContent = t("k_signin");
    gb.addEventListener("click", () => { kontoMeldung(""); show("accountVeil"); });
    gw.appendChild(gt); gw.appendChild(gb);
    box.appendChild(gw);
    return;
  }
  const wrap = document.createElement("div");
  wrap.className = "opt";
  const text = document.createElement("div");
  text.innerHTML = `<b>${esc(Konto.profil.name)}</b>` +
    `<small>${esc(Konto.profil.email || Konto.profil.anbieter || "")}</small>`;
  const knopf = document.createElement("button");
  knopf.type = "button";
  knopf.className = "quiet";
  knopf.style.cssText = "margin:0;width:auto;padding:6px 12px";
  knopf.textContent = t("k_signout");
  knopf.addEventListener("click", async () => {
    knopf.disabled = true;
    await Konto.abmelden();
    /* Zurück auf Anfang: Ein abgemeldetes Fenster darf den Fortschritt des
       Kontos nicht weiter anzeigen — sonst spielt man weiter und wundert
       sich, dass nichts davon ankommt. */
    location.reload();
  });
  wrap.appendChild(text); wrap.appendChild(knopf);
  box.appendChild(wrap);
}
function hideAll(){ VEILS.forEach(v => $(v).hidden = true); anmeldungLage(); }
/* Merkt am <body>, ob gerade die Anmeldung zu sehen ist (Schritt 110):
   Dann darf hochkant kein Drehhinweis stehen, und ein Telefon im Querformat
   bekommt die Bitte, hochkant zu halten. */
function anmeldungLage(){
  const a = document.getElementById("accountVeil");
  document.body.classList.toggle("anmeldung", !!a && !a.hidden);
}
/* ---- Reiter im Konsolenfenster (Schritt 79) ------------------------
   Vier Reiter statt vier Vollbildschirmen. Der Unterschied ist nicht nur
   Gestaltung: Wer im Laden steht, sieht weiter seinen Stand und kommt mit
   einem Klick zurück, statt über einen „Fertig"-Knopf. */
let reiterJetzt = "start";
const REITER = { start:"paneStart", haut:"paneHaut", erf:"paneErf", stat:"paneStat", monde:"paneMonde" };

function reiter(name){
  if (!REITER[name]) name = "start";
  reiterJetzt = name;
  for (const [k, id] of Object.entries(REITER)){
    const pane = $(id);
    if (pane) pane.hidden = (k !== name);
  }
  const leiste = $("konsReiter");
  if (leiste) for (const b of leiste.querySelectorAll("button[data-reiter]"))
    b.setAttribute("aria-selected", String(b.dataset.reiter === name));
  if (name === "haut"){ paintPurse(); buildGrid(); }
  if (name === "erf") buildErfolge();
  if (name === "stat"){ buildRecords(); paintRank(); }
  if (name === "monde") buildMonde();
  if (name === "start") heldMalen();
}

/* ---- Monde (Schritt 108) ------------------------------------------------
   Erspielte Ausrüstung: fünf Arten, drei Stufen, höchstens drei angelegt.
   Sie wirken nur in der Liga (der Server rechnet, `modFuer` in sim.js);
   hier werden sie gezeigt, angelegt und aufgewertet. Nie kaufbar — das ist
   die Zusage aus KONZEPT-AUSRUESTUNG.md, und deshalb gibt es hier keinen
   Ore-Knopf. */
const MONDE = {
  eis:   { name:"mo_eis",   wirkung:"mo_eis_w",    quelle:"mo_q_eis",   farbe:"#cfe9f7", kern:"#7fb8d8", schein:"#bfe8ff" },
  eisen: { name:"mo_eisen", wirkung:"mo_eisen_w",  quelle:"mo_q_eisen", farbe:"#aab2bb", kern:"#5c656f", schein:"#d7dde3" },
  glut:  { name:"mo_glut",  wirkung:"mo_glut_w",   quelle:"mo_q_glut",  farbe:"#ff9a3c", kern:"#8a2a08", schein:"#ffd08a" },
  staub: { name:"mo_staubm",wirkung:"mo_staubm_w", quelle:"mo_q_staub", farbe:"#d9c9a6", kern:"#8a7a58", schein:"#f1e6c8" },
  sturm: { name:"mo_sturm", wirkung:"mo_sturm_w",  quelle:"mo_q_sturm", farbe:"#eef2ff", kern:"#6c7bd6", schein:"#ffffff" }
};
const MOND_ARTEN = ["eis", "eisen", "glut", "staub", "sturm"];
const MOND_PCT_ANZEIGE = [0, 3, 5, 8];
/* Feste Umlaufbahn je Art (Phase, Neigung, Umlaufzeit) — nie Math.random,
   damit nichts flackert und drei Monde nicht im Gleichschritt laufen. */
const MOND_BAHN = {
  eis:   { phase: 0.0, neig: 0.42, umlauf: 9.0 },
  eisen: { phase: 2.1, neig: 0.30, umlauf: 7.0 },
  glut:  { phase: 4.2, neig: 0.55, umlauf: 11.0 },
  staub: { phase: 1.3, neig: 0.36, umlauf: 8.0 },
  sturm: { phase: 3.4, neig: 0.48, umlauf: 6.0 }
};
/* Ein Mond: kleine Kugel, Lichtseite links oben wie LICHT. `r` ist der
   Radius des Mondes selbst. */
function mondKugel(g, x, y, r, art, alpha = 1){
  const M = MONDE[art]; if (!M) return;
  g.save(); g.globalAlpha = alpha;
  const lx = x - r*0.35, ly = y - r*0.35;
  const v = g.createRadialGradient(lx, ly, r*0.1, x, y, r);
  v.addColorStop(0, M.schein); v.addColorStop(0.45, M.farbe); v.addColorStop(1, M.kern);
  g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = v; g.fill();
  g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = Math.max(0.6, r*0.08); g.stroke();
  if (art === "glut"){ g.beginPath(); g.arc(x, y, r*1.35, 0, 7); g.fillStyle = "rgba(255,140,40,.18)"; g.fill(); }
  if (art === "sturm"){ g.beginPath(); g.arc(x, y, r*1.3, 0, 7); g.strokeStyle = "rgba(200,215,255,.45)"; g.lineWidth = r*0.18; g.stroke(); }
  g.restore();
}
/* Monde um einen Körper: Bahn außerhalb von r (Regel 1 der Designs — nichts
   täuscht über die Reichweite). `hinten` zeichnet die Hälfte der Bahn, die
   hinter dem Körper liegt (vor `body()` aufrufen), sonst die vordere. */
function mondeMalen(g, x, y, r, arten, zeit, hinten = false){
  if (!arten || !arten.length) return;
  const mr = Math.max(3, r * 0.16);
  const bahn = r * 1.32 + mr;
  arten.slice(0, 3).forEach((art, i) => {
    const B = MOND_BAHN[art]; if (!B) return;
    /* Drittel je Platz, damit zwei Monde nicht übereinanderliegen; die
       Art gibt nur Tempo und Neigung. */
    const w = i * 2.094 + B.phase * 0.25 + zeit * (6.283 / B.umlauf);
    const sw = Math.sin(w);
    if (hinten ? sw >= 0 : sw < 0) return;
    mondKugel(g, x + Math.cos(w) * bahn, y + sw * bahn * B.neig, mr * (0.85 + 0.15 * sw), art, hinten ? 0.85 : 1);
  });
}
/* Die eigenen Monde im Spiel: nur online in der Liga, nur mit Konto. */
function eigeneMonde(){
  if (!Game.online || Net.modus !== "liga" || !Profile.monde) return null;
  return Profile.monde.aktiv.length ? Profile.monde.aktiv : null;
}
function mondBild(art, stufe){
  const c = document.createElement("canvas");
  c.width = c.height = 104;
  const g = c.getContext("2d");
  mondKugel(g, 52, 48, 30, art);
  for (let i = 0; i < 3; i++){
    g.beginPath(); g.arc(40 + i*12, 94, 3.2, 0, 7);
    g.fillStyle = i < stufe ? "#e9b063" : "rgba(255,255,255,.18)"; g.fill();
  }
  return c;
}
let mondeStand = null;   // letzte Antwort von /konto/monde
/* Der Reiter „Monde" ist nur da, wenn die Liga gewählt ist — Entscheidung
   von Thomas am 16.09.2026: sichtbar nur, wo sie zählen. Wechselt die
   Spielart, während der Reiter offen ist, geht es zurück in den Hangar. */
function mondeReiterZeigen(){
  const leiste = $("konsReiter");
  const knopf = leiste && leiste.querySelector("button[data-reiter=monde]");
  if (!knopf) return;
  const zeigen = modeId === "liga";
  knopf.hidden = !zeigen;
  if (!zeigen && reiterJetzt === "monde") reiter("start");
}
/* Skillpunkte (Schritt 109): ein Punkt je Level, verteilt auf fünf
   Eigenschaften. Der Server rechnet (`modAusSkill` in sim.js) und prüft die
   Summe; hier wird nur verteilt und gespeichert. */
const SKILL_FELDER = ["start", "staub", "decay", "merge", "push"];
let skillStand = null;    // {verteilung, punkte, frei} vom Server
let skillEntwurf = null;  // lokale Verteilung bis zum Speichern
function buildSkill(){
  const box = $("skillInhalt");
  if (!box) return;
  if (!istAngemeldet()){ box.innerHTML = ""; return; }
  const zeichnen = () => {
    const st = skillStand; if (!st) return;
    const v = skillEntwurf;
    const vergeben = SKILL_FELDER.reduce((n, f) => n + (v[f] || 0), 0);
    const frei = Math.max(0, st.punkte - vergeben);
    const geaendert = SKILL_FELDER.some(f => (v[f] || 0) !== (st.verteilung[f] || 0));
    box.innerHTML = `<div class="plate recbox" style="grid-column:1/-1"><h3>${esc(t("sp_kopf"))}</h3>` +
      `<small class="hintline">${esc(t("sp_erkl"))}</small>` +
      `<div class="skillFrei">${esc(t("sp_frei", frei, st.punkte))}</div><div id="skillZeilen"></div>` +
      `<div class="skillFuss"><button type="button" id="skillSpeichern" ${geaendert ? "" : "disabled"}>${esc(t("sp_speichern"))}</button>` +
      `<button type="button" class="quiet" id="skillReset" ${vergeben ? "" : "disabled"}>${esc(t("sp_reset"))}</button></div></div>`;
    const z = $("skillZeilen");
    for (const f of SKILL_FELDER){
      const row = document.createElement("div"); row.className = "skillZeile";
      row.innerHTML = `<div><b>${esc(t("sp_" + f))}</b><small>+${((v[f] || 0) / 10).toLocaleString(lang, {minimumFractionDigits:1, maximumFractionDigits:1})} %</small></div>` +
        `<div class="skillKn"><button type="button" data-minus="${f}" ${v[f] ? "" : "disabled"}>−</button><i>${v[f] || 0}</i>` +
        `<button type="button" data-plus="${f}" ${frei ? "" : "disabled"}>+</button></div>`;
      z.appendChild(row);
    }
    for (const b of box.querySelectorAll("[data-plus]")) b.addEventListener("click", () => { v[b.dataset.plus] = (v[b.dataset.plus] || 0) + 1; zeichnen(); });
    for (const b of box.querySelectorAll("[data-minus]")) b.addEventListener("click", () => { v[b.dataset.minus] = Math.max(0, (v[b.dataset.minus] || 0) - 1); zeichnen(); });
    $("skillReset").addEventListener("click", () => { for (const f of SKILL_FELDER) v[f] = 0; zeichnen(); });
    $("skillSpeichern").addEventListener("click", async () => {
      $("skillSpeichern").disabled = true;
      const a = await Konto.ruf("/konto/skill/setzen", { verteilung: v });
      if (a && a.ok){ skillStand = a.skill; skillEntwurf = Object.assign({}, a.skill.verteilung); Profile.skill = Object.assign({}, a.skill.verteilung); toast(t("sp_gespeichert")); zeichnen(); }
      else { toast(t("net_fail")); zeichnen(); }
    });
  };
  if (skillStand && skillStand.konto === Konto.profil.id) zeichnen();
  Konto.ruf("/konto/skill").then(a => {
    if (!a || !a.ok) return;
    a.konto = Konto.profil ? Konto.profil.id : 0;
    skillStand = a; skillEntwurf = Object.assign({}, a.verteilung); Profile.skill = Object.assign({}, a.verteilung);
    if (reiterJetzt === "monde") zeichnen();
  });
}
function buildMonde(){
  buildSkill();
  const box = $("mondeInhalt");
  if (!box) return;
  if (!istAngemeldet()){
    box.innerHTML = `<p class="hintline">${esc(t("mo_konto"))}</p>`;
    return;
  }
  const roem = st => ["I", "II", "III"][st - 1] || String(st);
  const zeichnen = () => {
    const m = mondeStand;
    if (!m) return;
    const besitz = m.monde.besitz, aktiv = m.monde.aktiv;
    box.innerHTML =
      `<div class="plate recbox"><h3>${esc(t("mo_angelegt"))}</h3><div class="mondPlaetze" id="mondPlaetze"></div>` +
      `<h3 style="margin-top:14px">${esc(t("mo_staub"))}</h3><div class="mondStaub">${(m.monde.staub || 0).toLocaleString(lang)}</div>` +
      `<small class="hintline">${esc(t("mo_staub_erkl"))}</small></div>` +
      `<div class="plate recbox"><h3>${esc(t("mo_besitz"))}</h3><div id="mondListe"></div>` +
      `<h3 style="margin-top:14px">${esc(t("mo_woher"))}</h3><ol class="mondWoher">` +
      MOND_ARTEN.map(a => `<li class="${besitz[a] ? "hat" : ""}">${esc(t(MONDE[a].quelle))}</li>`).join("") + `</ol></div>`;
    const pl = $("mondPlaetze");
    for (let i = 0; i < (m.plaetze || 3); i++){
      const art = aktiv[i];
      const d = document.createElement("div");
      d.className = "mondPlatz" + (art ? " voll" : "");
      if (art){ d.appendChild(mondBild(art, besitz[art] || 1)); const n = document.createElement("span"); n.textContent = t(MONDE[art].name); d.appendChild(n); }
      else d.textContent = t("mo_platz");
      pl.appendChild(d);
    }
    const liste = $("mondListe");
    const eigene = MOND_ARTEN.filter(a => besitz[a]);
    if (!eigene.length){ liste.innerHTML = `<p class="hintline">${esc(t("mo_leer"))}</p>`; return; }
    for (const art of eigene){
      const st = besitz[art], an = aktiv.includes(art);
      const k = document.createElement("div"); k.className = "mondKarte";
      k.appendChild(mondBild(art, st));
      const tx = document.createElement("div");
      tx.innerHTML = `<b>${esc(t(MONDE[art].name))} · ${esc(t("mo_stufe", roem(st)))}</b>` +
        `<small>${esc(t(MONDE[art].wirkung, MOND_PCT_ANZEIGE[st]))}</small>`;
      k.appendChild(tx);
      const kn = document.createElement("div"); kn.className = "kn";
      const b1 = document.createElement("button"); b1.type = "button";
      b1.textContent = t(an ? "mo_ablegen" : "mo_anlegen");
      b1.onclick = async () => {
        const neu = an ? aktiv.filter(a => a !== art) : aktiv.concat(art);
        if (neu.length > (m.plaetze || 3)){ toast(t("mo_voll")); return; }
        b1.disabled = true;
        const a = await Konto.ruf("/konto/monde/anlegen", { aktiv: neu });
        if (a && a.ok){ m.monde = a.monde; Profile.monde = a.monde; zeichnen(); heldMalen(); }
        else { b1.disabled = false; toast(t("net_fail")); }
      };
      kn.appendChild(b1);
      const b2 = document.createElement("button"); b2.type = "button";
      if (st >= 3){ b2.textContent = t("mo_max"); b2.disabled = true; }
      else {
        const kosten = (m.kosten || [0, 0, 30, 80])[st + 1];
        b2.textContent = t("mo_aufwerten", kosten);
        b2.disabled = (m.monde.staub || 0) < kosten;
        b2.onclick = async () => {
          b2.disabled = true;
          const a = await Konto.ruf("/konto/monde/aufwerten", { art });
          if (a && a.ok){ m.monde = a.monde; Profile.monde = a.monde; zeichnen(); heldMalen(); Sound.levelUp(); }
          else { b2.disabled = false; toast(t("net_fail")); }
        };
      }
      kn.appendChild(b2);
      k.appendChild(kn);
      liste.appendChild(k);
    }
  };
  if (mondeStand && mondeStand.konto === Konto.profil.id) zeichnen();
  Konto.ruf("/konto/monde").then(a => {
    if (!a || !a.ok) return;
    a.konto = Konto.profil ? Konto.profil.id : 0;
    mondeStand = a; Profile.monde = a.monde;
    if (reiterJetzt === "monde") zeichnen();
  });
}

/* Der eigene Körper in der Mitte — gezeichnet von `body()`, also von
   derselben Funktion wie im Spiel. Ein eigenes Schaubild wäre eine zweite
   Wahrheit: Ändert sich die Darstellung im Spiel, stimmte das Bild im Menü
   nicht mehr. Die gezeigte Masse ist die eigene Bestmasse (mindestens so
   viel, dass man etwas sieht) — damit wächst das Bild mit dem Fortschritt. */
function heldMalen(){
  const c = $("heldCanvas"), gl3 = $("heldGL");
  if (!c) return;
  const S = c.width;
  /* Die echte Bestmasse, nicht eine geschönte Untergrenze. Das Bild ist
     damit selbst eine Fortschrittsanzeige: Wer noch nichts gespielt hat,
     sieht ein Staubkorn und liest „hier draußen ist noch nichts kleiner als
     du". Ein Anfänger, dem das Menü eine Stufe vorspielt, die er nicht hat,
     lernt daraus nur, dass die Anzeige nichts bedeutet. */
  const masse = Math.max(30, Profile.best || 0);
  /* **Gezeigt** wird das Design immer als Welt — mit Ringen (Thomas,
     17.09.2026: „das Design soll als Welt angezeigt werden"). Der Hangar ist
     das Schaufenster des Designs; den echten Fortschritt nennt weiter die
     Plakette darunter („Stufe 2 — Geröll") und die Bestmasse. Damit ist die
     frühere Regel „keine geschönte Mindestmasse" für das **Bild** aufgehoben,
     für die **Zahlen** gilt sie weiter. */
  const schauMasse = Math.max(masse, STAGES[STAGES.length - 1].at);
  /* Monde nur, wenn die Liga gewählt ist — im Freien Raum zählen sie nicht,
     und das Bild soll zeigen, was man dort sehen wird (Thomas, 16.09.). */
  const monde = modeId === "liga" && Profile.monde && Profile.monde.aktiv.length ? Profile.monde.aktiv : null;
  /* Platz für alles, was ein Design außerhalb von r zeichnet (Schritt 113,
     Thomas: „rechts und links fehlen ein paar Millimeter"): `heldAnteil()`
     rechnet aus Stufe, Rang, Designschmuck und Monden, wie viel Rand nötig ist. */
  const stufe = stageOf(schauMasse);
  const R = S * heldAnteil(stufe, skin, monde);

  /* Seit Schritt 118 als 3D-Modell (`Held3D`); ohne WebGL wie bisher als
     Scheibe von `body()`. */
  if (gl3 && Held3D.moeglich(gl3)){
    gl3.hidden = false;
    Held3D.zeigen({ pal: skin, masse: schauMasse, stufe, monde, R, S });
  } else {
    if (gl3) gl3.hidden = true;
    const g = c.getContext("2d");
    g.clearRect(0, 0, S, S);
    const saveT = Game.t; Game.t = 1.2;
    MENUE_VOLL = true;
    if (monde) mondeMalen(g, S/2, S/2, R, monde, 1.2, true);
    try { body(g, S/2, S/2, R, schauMasse, skin, 0, "", true); } catch(_){}
    if (monde) mondeMalen(g, S/2, S/2, R, monde, 1.2);
    MENUE_VOLL = false;
    Game.t = saveT;
  }

  setze("heldName", spielerName() || t("k_guest"));
  const st = stageOf(masse);
  /* „Stufe 4 — Welt" wie im Entwurf, nicht der ganze Erklärsatz: Der steht
     im Spiel über der Stufenanzeige, wo er gebraucht wird. */
  setze("heldStufe", t("k_stufe", st + 1, t("st" + st)));
}

/* Wie groß der Körper auf der Fläche steht: so, dass alles hineinpasst, was
   Design, Stufe, Rang und Monde außerhalb von r zeichnen (Ringe bis 2,05 r,
   Halo bis 2,1 r, Strahlen bis 1,9 r, Monde bis 1,7 r). Vorher waren es
   drei feste Zahlen nach Stufe, und Sunflare ragte bei Stufe 1 aus dem Bild. */
function heldAnteil(stufe, pal, monde){
  const T = pal.tier || 1, F = pal.trait || "plain";
  let weit = stufe >= 4 ? 2.05 : stufe >= 3 ? 1.35 : 1.0;
  weit = Math.max(weit, T >= 6 ? 1.95 : T >= 5 ? 1.70 : T >= 4 ? 1.42 : T >= 3 ? 1.26 : 1);
  const schmuck = { halo:2.1, strahlen:1.9, feuer:1.75, shards:1.72, frost:1.45, warp:1.32, spikes:1.18, prism:1.1 };
  weit = Math.max(weit, schmuck[F] || 1);
  if (monde) weit = Math.max(weit, 1.7);
  return Math.min(.40, .49 / weit);
}

/* =====================================================================
   DER KÖRPER IM HANGAR ALS 3D-MODELL (Schritt 118)

   Thomas am 17.09.2026: „das aktuell ausgewählte Design, das in der Mitte
   des Menüs erscheint, als prunkvolles 3D-Modell". Bis v97 zeichnete
   `body()` den Körper im Hangar als Scheibe — dieselbe Funktion wie im
   Spiel. Jetzt steht dort eine beleuchtete Kugel in WebGL:

   - Die Oberfläche entsteht aus **denselben Farben und derselben
     Materialart** wie im Spiel (`SKINS`: rock, dark, hot, air, mat) und
     würfelt mit `saat()`/`wuerfel()` — gleiche Kennung, gleiches Muster,
     nie `Math.random()`.
   - **Eine Lichtquelle**, links oben wie `LICHT`.
   - Ringe ab Stufe „Welt", mit dem Schatten des Körpers darauf; die Monde
     als kleine Kugeln auf ihrer Bahn (nur in der Spielart Aufstieg, wie
     bisher). Rang und Lufthülle als Schein dahinter.
   - Was ein Design **außerhalb** des Kreises trägt (Halo, Feuer, Strahlen,
     Frost, Beugung, Prisma), legt `designSchmuck()` als zweite Fläche
     darüber — derselbe Code wie im Spiel, keine zweite Wahrheit.

   Was gleich bleibt: die echte Bestmasse bestimmt die Stufe. Das Bild ist
   weiter eine Fortschrittsanzeige, nur eine, die sich dreht. Ohne WebGL
   zeichnet `heldMalen()` wie bisher mit `body()`.

   Kein fremdes Skript: alles hier ist roher WebGL-Code — drei kleine
   Programme (Kugel, Ring, Schein), keine Bibliothek.
   ===================================================================== */
const Held3D = {
  gl: null, canvas: null, ok: null, prog: {}, form: {},
  texturen: new Map(), mondTex: {}, ringTex: null,
  stand: null, laeuft: false, raf: 0, zuletzt: 0, zeit: 0,
  /* Wächter: Kostet ein Bild im Mittel mehr als 45 ms (Software-Zeichnung
     ohne Grafikkarte, sehr alte Geräte), bleibt das Modell stehen — ein
     stehendes Bild ist besser als ein Menü, das ruckelt. Gemessen: ohne
     Grafikkarte im Prüfstand 250 ms je Bild, mit 2 ms. */
  kosten: 0, bilder: 0, stehen: false,

  /* Materialart → wie die Kugel Licht nimmt. `amb` ist die Resthelligkeit
     der Schattenseite (dieselbe Rangfolge wie der Terminator in `body()`:
     Staub am dunkelsten, Glas und Kristall nie schwarz), `spec`/`shine` der
     Glanzpunkt, `fres` der Lichtsaum am Rand in der Luftfarbe, `puls` das
     Glühen aus den Spalten. */
  MAT: {
    fels:    { amb:.15, spec:.10, shine:14, fres:.30, fpow:3.0, puls:0 },
    staub:   { amb:.12, spec:.04, shine:8,  fres:.26, fpow:3.2, puls:0 },
    eis:     { amb:.24, spec:.75, shine:64, fres:.55, fpow:2.5, puls:0 },
    metall:  { amb:.16, spec:.95, shine:38, fres:.40, fpow:3.0, puls:0 },
    glut:    { amb:.18, spec:.16, shine:18, fres:.45, fpow:3.0, puls:.95 },
    energie: { amb:.30, spec:.25, shine:24, fres:.75, fpow:2.2, puls:1.0 },
    kristall:{ amb:.28, spec:.85, shine:48, fres:.60, fpow:2.4, puls:.35 },
    glas:    { amb:.30, spec:1.0, shine:96, fres:.75, fpow:2.2, puls:0 },
    gas:     { amb:.24, spec:.12, shine:12, fres:.85, fpow:2.0, puls:0 },
    perle:   { amb:.32, spec:.60, shine:30, fres:.80, fpow:2.0, puls:0 },
    schlund: { amb:.04, spec:0,   shine:1,  fres:0,   fpow:1,   puls:0, schlund:1 }
  },
  /* Lichtrichtung im Raum: links oben wie `LICHT`, dazu ein Anteil zum
     Betrachter, damit die Lichtseite nicht nur eine Sichel ist. */
  LICHT: [-.42, .46, .78],

  VS: `
    attribute vec3 aPos; attribute vec2 aUv;
    uniform mat3 uRot; uniform vec3 uLage; uniform float uGr;
    varying vec3 vN; varying vec2 vUv; varying vec3 vP;
    void main(){
      vec3 p = uRot * aPos;
      vN = p; vUv = aUv; vP = p;
      gl_Position = vec4(uLage.xy + p.xy * uGr, uLage.z - p.z * uGr * 0.4, 1.0);
    }`,
  FS_KUGEL: `
    precision mediump float;
    varying vec3 vN; varying vec2 vUv;
    uniform sampler2D uTex; uniform vec3 uLicht, uHot, uAir;
    uniform float uAmb, uSpec, uShine, uFres, uFpow, uPuls, uZeit, uSchlund;
    void main(){
      vec4 t = texture2D(uTex, vUv);
      vec3 N = normalize(vN); vec3 V = vec3(0.0, 0.0, 1.0); vec3 L = normalize(uLicht);
      float nl = dot(N, L);
      float diff = clamp(nl, 0.0, 1.0);
      float wrap = clamp((nl + 0.22) / 1.22, 0.0, 1.0);
      vec3 H = normalize(L + V);
      float spec = pow(clamp(dot(N, H), 0.0, 1.0), uShine) * uSpec * (0.25 + 0.75 * diff);
      float nv = clamp(dot(N, V), 0.0, 1.0);
      float fres = pow(1.0 - nv, uFpow);
      vec3 col = t.rgb * (uAmb + (1.0 - uAmb) * wrap) * (1.0 + 0.30 * diff * diff);
      col += spec * mix(vec3(1.0), uAir, 0.35);
      col += uAir * fres * uFres * (0.40 + 0.60 * clamp(nl * 0.5 + 0.5, 0.0, 1.0));
      col += uHot * t.a * uPuls;
      if (uSchlund > 0.0){
        /* Ein Loch, das trotzdem Eindruck macht: pechschwarzer Kern, der
           Lichtring genau am Rand, wandernde Beugungsbögen. */
        float a = atan(N.y, N.x);
        float ring = pow(1.0 - nv, 6.0) * (0.80 + 0.20 * sin(a * 9.0 + uZeit * 0.8));
        col = mix(col, uHot, clamp(ring * 1.8 * uSchlund, 0.0, 1.0));
        col += uAir * pow(1.0 - nv, 16.0) * uSchlund;
      }
      gl_FragColor = vec4(col, 1.0);
    }`,
  FS_RING: `
    precision mediump float;
    varying vec3 vP; varying vec2 vUv;
    uniform sampler2D uTex; uniform vec3 uLicht; uniform float uAlpha;
    void main(){
      vec4 t = texture2D(uTex, vec2(vUv.x, 0.5));
      vec3 L = normalize(uLicht);
      float entlang = dot(vP, L);
      float quer = length(vP - L * entlang);
      float schatten = entlang < 0.0 ? mix(0.22, 1.0, smoothstep(0.92, 1.10, quer)) : 1.0;
      float a = t.a * uAlpha;
      gl_FragColor = vec4(t.rgb * schatten * a, a);
    }`,
  VS_SCHEIN: `
    attribute vec2 aPos; varying vec2 vXy;
    void main(){ vXy = aPos; gl_Position = vec4(aPos, 0.999, 1.0); }`,
  FS_SCHEIN: `
    precision mediump float;
    varying vec2 vXy;
    uniform float uR, uHalo, uRang, uRangWeit, uSchein; uniform vec3 uAir, uHot;
    void main(){
      float d = length(vXy) / uR;
      float a1 = uHalo * 0.30 * (1.0 - smoothstep(0.90, 1.35, d));
      float a2 = uRang * (1.0 - smoothstep(0.95, uRangWeit, d));
      float a3 = uSchein * (1.0 - smoothstep(0.80, 2.6, d)) * (1.0 - smoothstep(0.70, 0.98, length(vXy)));
      vec3 c = uAir * (a1 + a3) + uHot * a2;
      gl_FragColor = vec4(c, a1 + a2 + a3);
    }`,

  moeglich(canvas){
    if (this.ok !== null && this.canvas === canvas) return this.ok;
    try {
      /* Mehrere Anläufe: Manche Rechner geben mit Kantenglättung keinen
         Zusammenhang her, manche nur die neuere Fassung. Scheitert alles,
         steht der Grund in `grund` und ist in den Einstellungen neben der
         Fassung zu lesen — sonst bleibt „am PC kein 3D" ein Rätsel
         (Thomas, 17.09.2026). */
      let gl = null;
      for (const [art, glatt] of [["webgl",true],["webgl",false],["experimental-webgl",false],["webgl2",false]]){
        try { gl = canvas.getContext(art, { alpha:true, antialias:glatt, premultipliedAlpha:true }); } catch(_){ gl = null; }
        if (gl) break;
      }
      if (!gl) throw new Error("Browser gibt kein WebGL her (Hardwarebeschleunigung aus?)");
      this.gl = gl; this.canvas = canvas;
      this.bauen();
      canvas.addEventListener("webglcontextlost", e => {
        e.preventDefault(); this.ok = false; this.laeuft = false; this.grund = "Grafikzusammenhang verloren";
        try { heldMalen(); } catch(_){}
      });
      this.ok = true; this.grund = "";
    } catch(e){ this.ok = false; this.grund = String(e && e.message || e).slice(0, 140); }
    return this.ok;
  },

  programm(vs, fs){
    const gl = this.gl;
    const bau = (art, quelle) => {
      const s = gl.createShader(art);
      gl.shaderSource(s, quelle); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, bau(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, bau(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, a = {};
    const nu = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < nu; i++){ const n = gl.getActiveUniform(p, i).name; u[n] = gl.getUniformLocation(p, n); }
    const na = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < na; i++){ const n = gl.getActiveAttrib(p, i).name; a[n] = gl.getAttribLocation(p, n); }
    return { p, u, a };
  },

  bauen(){
    const gl = this.gl;
    this.prog.kugel  = this.programm(this.VS, this.FS_KUGEL);
    this.prog.ring   = this.programm(this.VS, this.FS_RING);
    this.prog.schein = this.programm(this.VS_SCHEIN, this.FS_SCHEIN);

    /* Kugel: Breiten- und Längengrade, Texturkoordinaten wie eine Weltkarte. */
    const SEG = 72, RINGE = 44, pos = [], uv = [], idx = [];
    for (let i = 0; i <= RINGE; i++){
      const v = i / RINGE, phi = v * Math.PI, y = Math.cos(phi), rr = Math.sin(phi);
      for (let j = 0; j <= SEG; j++){
        const u = j / SEG, th = u * 6.2831853;
        pos.push(rr * Math.cos(th), y, rr * Math.sin(th));
        uv.push(u, 1 - v);
      }
    }
    for (let i = 0; i < RINGE; i++) for (let j = 0; j < SEG; j++){
      const a = i * (SEG + 1) + j, b = a + SEG + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    this.form.kugel = this.formBauen(pos, uv, idx);

    /* Ring: eine flache Scheibe mit Loch, von 1,45 r bis 2,05 r wie die
       drei Ringe in `body()`. Die Texturkoordinate läuft von innen nach
       außen. */
    const RS = 160, IN = 1.45, AUS = 2.05, rp = [], ru = [], ri = [];
    for (let j = 0; j <= RS; j++){
      const th = j / RS * 6.2831853, c = Math.cos(th), s = Math.sin(th);
      rp.push(IN * c, 0, IN * s, AUS * c, 0, AUS * s);
      ru.push(0, 0, 1, 0);
    }
    for (let j = 0; j < RS; j++){ const a = j * 2; ri.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    this.form.ring = this.formBauen(rp, ru, ri);

    /* Schein: ein Viereck über die ganze Fläche. */
    const q = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, q);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    this.form.quad = q;

    this.ringTex = this.ringTextur();
  },

  formBauen(pos, uv, idx){
    const gl = this.gl;
    const bp = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bp);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
    const bu = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bu);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
    const bi = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bi);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    return { pos: bp, uv: bu, idx: bi, n: idx.length };
  },

  /* Farbe „#rrggbb" → [r,g,b] in 0…1 */
  rgb(hex){
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  },

  /* --- Die Oberfläche eines Designs als Weltkarte (2:1) ---------------
     Gezeichnet mit dem 2D-Zeichner, dann als Bild auf die Kugel gelegt.
     Zwei Flächen: die Farbe und das Glühen (für Glut, Energie, Kristall);
     das Glühen wandert in den Alphakanal, den der Shader mit `hot`
     einfärbt. Nahe den Polen werden Formen waagerecht gestreckt, sonst
     drängen sie sich auf der Kugel dort zusammen. */
  textur(pal){
    const gl = this.gl;
    const alt = this.texturen.get(pal.id);
    if (alt) return alt;
    /* Höchstens sechs Karten im Speicher — mehr braucht niemand, der im
       Hangar Designs durchprobiert, und jede kostet zwei Megabyte. */
    if (this.texturen.size >= 6){
      const [k, v] = this.texturen.entries().next().value;
      gl.deleteTexture(v); this.texturen.delete(k);
    }
    const W = Settings.lowPower ? 512 : 1024, H = W / 2;
    const A = document.createElement("canvas"); A.width = W; A.height = H;
    const E = document.createElement("canvas"); E.width = W; E.height = H;
    const ga = A.getContext("2d"), ge = E.getContext("2d");
    const w = wuerfel(saat(pal.id + "|3d"));
    const art = pal.mat || "fels";
    const rock = pal.rock, dark = pal.dark, air = pal.air, hot = pal.hot;
    const hell = mischen(rock, .18);
    ga.fillStyle = rock; ga.fillRect(0, 0, W, H);
    ge.fillStyle = "#000"; ge.fillRect(0, 0, W, H);

    /* Eine Form an (u, v) in Kartenmaßen, an den Polen gestreckt, am
       linken und rechten Rand fortgesetzt, damit keine Naht entsteht. */
    const streck = v => 1 / Math.max(.22, Math.cos((v - .5) * Math.PI));
    const oval = (g, u, v, rx, ry, mal) => {
      const f = streck(v), x = u * W, y = v * H;
      for (const dx of [0, -W, W]){
        if (x + dx + rx * f < -4 || x + dx - rx * f > W + 4) continue;
        g.save(); g.translate(x + dx, y); g.scale(f, 1);
        mal(g, rx, ry); g.restore();
      }
    };
    const weich = (g, u, v, r, farbe, a) => oval(g, u, v, r, r, (g2, rx) => {
      const gr = g2.createRadialGradient(0, 0, 0, 0, 0, rx);
      gr.addColorStop(0, hexA(farbe, a)); gr.addColorStop(1, hexA(farbe, 0));
      g2.fillStyle = gr; g2.beginPath(); g2.arc(0, 0, rx, 0, 7); g2.fill();
    });
    /* Ein Weg über die Karte, wie ein Riss: unregelmäßig, gabelt sich. */
    const weg = (u, v, schritte, laenge) => {
      let a = w() * 6.2832;
      const p = [[u * W, v * H]];
      for (let k = 0; k < schritte; k++){
        a += (w() - .5) * 1.1;
        const l = laenge * (.6 + w() * .8) * W;
        const [x, y] = p[p.length - 1];
        const y2 = Math.max(H * .04, Math.min(H * .96, y + Math.sin(a) * l));
        p.push([x + Math.cos(a) * l * streck(y2 / H), y2]);
      }
      return p;
    };
    const zug = (g, p, farbe, a, lw) => {
      g.strokeStyle = farbe[0] === "#" ? hexA(farbe, a) : farbe;
      g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round";
      for (const dx of [0, -W, W]){
        g.beginPath(); g.moveTo(p[0][0] + dx, p[0][1]);
        for (let i = 1; i < p.length; i++) g.lineTo(p[i][0] + dx, p[i][1]);
        g.stroke();
      }
    };

    /* Grundton: weiche Flecken, damit die Fläche nicht wie lackiert wirkt. */
    for (let i = 0; i < 70; i++)
      weich(ga, w(), .06 + w() * .88, W * (.03 + w() * .09), w() < .5 ? dark : hell, .10 + w() * .10);

    if (art === "fels"){
      /* Krater: dunkles Becken, heller Wall rundum, Schatten unten rechts. */
      for (let i = 0; i < 34; i++){
        const u = w(), v = .08 + w() * .84, r = W * (.008 + w() * .026), tief = .5 + w() * .5;
        oval(ga, u, v, r, r, (g, rx) => {
          g.beginPath(); g.arc(0, 0, rx, 0, 7); g.fillStyle = hexA(dark, .42 * tief); g.fill();
          g.beginPath(); g.arc(0, 0, rx * .97, 0, 7); g.strokeStyle = hexA(air, .22 * tief); g.lineWidth = Math.max(1, rx * .18); g.stroke();
          g.beginPath(); g.arc(0, 0, rx * .70, .6, 2.6); g.strokeStyle = hexA(dark, .35 * tief); g.lineWidth = Math.max(1, rx * .16); g.stroke();
        });
      }
    }
    if (art === "staub"){
      for (let i = 0; i < 40; i++) weich(ga, w(), .06 + w() * .88, W * (.02 + w() * .05), dark, .22 + w() * .14);
      for (let i = 0; i < 12; i++) weich(ga, w(), .1 + w() * .8, W * (.06 + w() * .10), hell, .08);
    }
    if (art === "eis"){
      for (let i = 0; i < 14; i++) weich(ga, w(), .08 + w() * .84, W * (.04 + w() * .08), air, .12 + w() * .08);
      for (let i = 0; i < 34; i++) zug(ga, weg(w(), .08 + w() * .84, 5 + (w() * 9 | 0), .02 + w() * .03), dark, .45, 1 + w() * 2);
    }
    if (art === "metall"){
      /* Gebürstet: viele feine Striche entlang der Breitengrade. */
      for (let i = 0; i < 190; i++){
        const y = w() * H, k = w();
        ga.strokeStyle = hexA(k < .5 ? air : dark, .04 + w() * .10);
        ga.lineWidth = .8 + w() * 1.8;
        ga.beginPath(); ga.moveTo(0, y); ga.lineTo(W, y + (w() - .5) * H * .03); ga.stroke();
      }
      for (let i = 0; i < 12; i++){
        const x = w() * W, y = w() * H, l = W * (.08 + w() * .3);
        ga.strokeStyle = hexA(air, .18 + w() * .14); ga.lineWidth = 1;
        ga.beginPath(); ga.moveTo(x, y); ga.lineTo(x + l, y + (w() - .5) * H * .02); ga.stroke();
      }
    }
    if (art === "glut" || art === "energie"){
      ga.fillStyle = hexA(dark, art === "glut" ? .46 : .30); ga.fillRect(0, 0, W, H);
      /* Das Spaltennetz glüht: erst breit und schwach (der Schein im
         Gestein), dann schmal und hell (die Spalte selbst). */
      const wege = [];
      for (let i = 0; i < 18; i++){
        const p = weg(w(), .1 + w() * .8, 7 + (w() * 8 | 0), .018 + w() * .025);
        wege.push(p);
        if (w() < .7 && p.length > 4){
          const ab = p[2 + (w() * (p.length - 3) | 0)];
          wege.push(weg(ab[0] / W, ab[1] / H, 3 + (w() * 4 | 0), .015 + w() * .02));
        }
      }
      for (const p of wege) zug(ge, p, "rgba(255,255,255,.30)", 1, W * .012);
      for (const p of wege) zug(ge, p, "rgba(255,255,255,1)", 1, W * .0035);
      for (const p of wege) zug(ga, p, dark, .5, W * .006);
      if (art === "energie") for (let i = 0; i < 12; i++) weich(ge, w(), .1 + w() * .8, W * (.04 + w() * .07), "#ffffff", .32);
    }
    if (art === "kristall"){
      /* Facetten: ein verschobenes Raster, jede Fläche mit eigener
         Helligkeit, harte Kanten dazwischen — das ist der Schliff. */
      const CX = 18, CY = 9, cw = W / CX, ch = H / CY;
      const ecke = (i, j) => [i * cw + (w() - .5) * cw * .7, j * ch + (w() - .5) * ch * .7];
      const ecken = [];
      for (let j = 0; j <= CY; j++){ ecken.push([]); for (let i = 0; i <= CX; i++) ecken[j].push(ecke(i, j)); }
      for (let j = 0; j < CY; j++) for (let i = 0; i < CX; i++){
        const p = [ecken[j][i], ecken[j][i + 1], ecken[j + 1][i + 1], ecken[j + 1][i]];
        const h = w();
        ga.beginPath(); ga.moveTo(p[0][0], p[0][1]); for (let k = 1; k < 4; k++) ga.lineTo(p[k][0], p[k][1]); ga.closePath();
        ga.fillStyle = h > .5 ? `rgba(255,255,255,${(.04 + (h - .5) * .5).toFixed(3)})` : hexA(dark, .10 + (.5 - h) * .5);
        ga.fill(); ga.strokeStyle = hexA(air, .24); ga.lineWidth = Math.max(1, W * .0012); ga.stroke();
      }
      for (let i = 0; i < 40; i++) weich(ge, w(), .1 + w() * .8, W * (.02 + w() * .05), "#ffffff", .18);
    }
    if (art === "glas"){
      ga.fillStyle = hexA(dark, .26); ga.fillRect(0, 0, W, H);
      for (let i = 0; i < 8; i++) oval(ga, w(), .15 + w() * .7, W * (.10 + w() * .12), H * (.06 + w() * .08), (g, rx, ry) => {
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
        gr.addColorStop(0, hexA(air, .07)); gr.addColorStop(1, hexA(air, 0));
        g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 7); g.fill();
      });
    }
    if (art === "gas" || art === "perle"){
      /* Bänder mit welligen Kanten, dazu ein oder zwei Stürme. */
      let v = 0;
      while (v < 1){
        const h = .03 + w() * .07, kraft = .16 + w() * .32;
        const amp = H * (.006 + w() * .012), k = 2 + (w() * 4 | 0), ph = w() * 6.28;
        const amp2 = H * (.006 + w() * .012), k2 = 2 + (w() * 4 | 0), ph2 = w() * 6.28;
        const y0 = v * H, y1 = Math.min(H, (v + h) * H);
        ga.beginPath(); ga.moveTo(0, y0);
        for (let x = 0; x <= W; x += 8) ga.lineTo(x, y0 + amp * Math.sin(x / W * 6.2832 * k + ph));
        for (let x = W; x >= 0; x -= 8) ga.lineTo(x, y1 + amp2 * Math.sin(x / W * 6.2832 * k2 + ph2));
        ga.closePath();
        ga.fillStyle = art === "perle"
          ? `hsla(${Math.round((v * 720 + 300) % 360)} 70% 72% / ${(kraft * .6).toFixed(3)})`
          : hexA(w() < .5 ? air : dark, kraft);
        ga.fill();
        v += h + .01 + w() * .03;
      }
      for (let i = 0; i < 2; i++) oval(ga, w(), .32 + w() * .36, W * (.03 + w() * .035), H * (.03 + w() * .03), (g, rx, ry) => {
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
        gr.addColorStop(0, hexA(hot, .42)); gr.addColorStop(.6, hexA(air, .18)); gr.addColorStop(1, hexA(air, 0));
        g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 7); g.fill();
      });
    }
    if (art === "schlund"){
      ga.fillStyle = "#050612"; ga.fillRect(0, 0, W, H);
    }

    /* Farbe aus der einen Fläche, Glühen aus der anderen — von Hand
       zusammengesetzt, damit der Alphakanal nicht als Durchsichtigkeit
       gelesen wird (der Browser würde die Farbe dort sonst verwerfen). */
    const ca = ga.getImageData(0, 0, W, H).data, ce = ge.getImageData(0, 0, W, H).data;
    const px = new Uint8Array(W * H * 4);
    for (let i = 0; i < W * H; i++){
      px[i * 4] = ca[i * 4]; px[i * 4 + 1] = ca[i * 4 + 1]; px[i * 4 + 2] = ca[i * 4 + 2]; px[i * 4 + 3] = ce[i * 4];
    }
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.texturen.set(pal.id, tex);
    this.gebaut = true;   // dieses Bild zählt für die Bremse nicht mit
    return tex;
  },

  /* Die Ringe als Streifen von innen nach außen: drei Bänder wie in
     `body()` (1,5 r, 1,66 r, 1,82 r), dazwischen dünner Dunst, und eine
     feine Körnung, damit sie nicht wie gemalt aussehen. Farbe kommt je
     Bild als `air` dazu — die Karte ist weiß. */
  ringTextur(){
    const gl = this.gl, N = 512, px = new Uint8Array(N * 4);
    const w = wuerfel(saat("ringe"));
    for (let i = 0; i < N; i++){
      const r = 1.45 + i / (N - 1) * .60;
      let a = .05 * (1 - Math.abs((r - 1.75) / .30));
      for (const [c, br, k] of [[1.52, .05, .40], [1.66, .045, .30], [1.82, .035, .20], [1.95, .05, .10]])
        a += k * Math.exp(-((r - c) / br) * ((r - c) / br));
      a *= .78 + .22 * w();
      a *= 1 - Math.max(0, (r - 1.98) / .07);
      const A = Math.max(0, Math.min(255, Math.round(a * 255)));
      px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = 255; px[i * 4 + 3] = A;
    }
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, N, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  },

  /* Ein Mond ist eine einfarbige Kugel; Licht und Saum macht der Shader. */
  mondTextur(art){
    if (this.mondTex[art]) return this.mondTex[art];
    const gl = this.gl, M = MONDE[art], c = this.rgb(M.farbe);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([c[0] * 255, c[1] * 255, c[2] * 255, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    this.mondTex[art] = tex;
    return tex;
  },

  /* --- Drehmatrizen (3×3, spaltenweise, wie GLSL sie will) ----------- */
  rotX(a){ const c = Math.cos(a), s = Math.sin(a); return [1,0,0, 0,c,s, 0,-s,c]; },
  rotY(a){ const c = Math.cos(a), s = Math.sin(a); return [c,0,-s, 0,1,0, s,0,c]; },
  rotZ(a){ const c = Math.cos(a), s = Math.sin(a); return [c,s,0, -s,c,0, 0,0,1]; },
  mal(A, B){
    const R = new Array(9);
    for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++)
      R[c * 3 + r] = A[r] * B[c * 3] + A[3 + r] * B[c * 3 + 1] + A[6 + r] * B[c * 3 + 2];
    return R;
  },

  /* Zeigen — von `heldMalen()` bei jeder Änderung gerufen. Malt sofort ein
     Bild (Prüfstände und „Bewegung reduzieren" sehen damit etwas) und
     lässt dann die Schleife laufen, solange der Hangar zu sehen ist. */
  zeigen(stand){
    this.stand = stand;
    this.bild();
    if (this.ruhig()) return;
    if (!this.laeuft){ this.laeuft = true; this.zuletzt = 0; this.raf = requestAnimationFrame(t => this.schleife(t)); }
  },
  ruhig(){
    return this.stehen || Settings.lowPower || (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
  },
  sichtbar(){
    const sv = document.getElementById("startVeil"), ps = document.getElementById("paneStart");
    return !!sv && !sv.hidden && !!ps && !ps.hidden && !document.hidden && !Game.running;
  },
  schleife(jetzt){
    if (!this.laeuft) return;
    if (!this.sichtbar() || this.ruhig()){ this.laeuft = false; this.zuletzt = 0; return; }
    /* Auf Tippgeräten dreißig Bilder je Sekunde — mehr sieht bei dieser
       Drehung niemand, und der Akku dankt es. */
    if (isTouch && this.zuletzt && jetzt - this.zuletzt < 30){ this.raf = requestAnimationFrame(t => this.schleife(t)); return; }
    const dt = this.zuletzt ? Math.min(.1, (jetzt - this.zuletzt) / 1000) : 0;
    this.zuletzt = jetzt; this.zeit += dt;
    const vor = performance.now();
    try { this.bild(); } catch(_){ this.laeuft = false; return; }
    /* Die Bremse misst nur das **Zeichnen**. Bis v100 zählte auch das Bild
       mit, in dem eine Oberfläche neu gerechnet wird (einmal je Design, am
       Rechner 1024 × 512 Punkte) — ein Designwechsel reichte dann, und das
       Modell blieb für immer stehen (Thomas, 17.09.2026: „am PC nicht in
       3D"). Jetzt zählen solche Bilder nicht, und stehen bleibt es erst
       nach zwanzig langsamen Bildern in Folge. */
    const ms = performance.now() - vor;
    if (this.gebaut){ this.gebaut = false; }
    else {
      this.kosten = this.kosten * .7 + ms * .3;
      this.langsam = ms > 45 ? (this.langsam || 0) + 1 : 0;
      if (++this.bilder > 6 && this.langsam >= 20){ this.stehen = true; this.laeuft = false; return; }
    }
    this.raf = requestAnimationFrame(t => this.schleife(t));
  },
  weiter(){ if (this.ok && this.stand && !this.laeuft && this.sichtbar()) this.zeigen(this.stand); },

  bild(){
    const gl = this.gl, st = this.stand;
    if (!gl || !st) return;
    const pal = st.pal, S = st.S, R = st.R, M = this.MAT[pal.mat] || this.MAT.fels;
    const gr = 2 * R / S;              // Radius in Bildkoordinaten (−1…1)
    const T = pal.tier || 1, zeit = this.zeit;
    const air = this.rgb(pal.air), hot = this.rgb(pal.hot);

    gl.viewport(0, 0, S, S);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    /* 1. Schein dahinter: Lufthülle ab Protoplanet, Rangglühen, und ein
       leiser Lichthof, der die Kugel vom Fenster löst. */
    {
      const P = this.prog.schein;
      gl.useProgram(P.p);
      gl.disable(gl.DEPTH_TEST);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.form.quad);
      gl.enableVertexAttribArray(P.a.aPos);
      gl.vertexAttribPointer(P.a.aPos, 2, gl.FLOAT, false, 0, 0);
      const puls = T >= 6 ? .30 + .14 * Math.sin(zeit * 2.2) : T >= 5 ? .26 + .12 * Math.sin(zeit * 3) : T >= 4 ? .17 : T >= 3 ? .09 : 0;
      const weit = T >= 6 ? 1.95 : T >= 5 ? 1.70 : T >= 4 ? 1.42 : 1.26;
      gl.uniform1f(P.u.uR, gr);
      gl.uniform1f(P.u.uHalo, st.stufe >= 3 ? 1 : 0);
      gl.uniform1f(P.u.uRang, puls);
      gl.uniform1f(P.u.uRangWeit, weit);
      gl.uniform1f(P.u.uSchein, .11);
      gl.uniform3fv(P.u.uAir, air);
      gl.uniform3fv(P.u.uHot, hot);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    /* Lage im Raum: Achse leicht geneigt, der Körper dreht sich langsam. */
    const neigung = this.mal(this.rotZ(-.20), this.rotX(.305));
    const rot = this.mal(neigung, this.rotY(zeit * .22));

    /* 2. Die Kugel. */
    const K = this.prog.kugel;
    gl.useProgram(K.p);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
    /* Die Dreiecke der Kugel laufen im Uhrzeigersinn — ohne diese Zeile
       sortiert WebGL die Vorderseite aus, und man sieht die Innenseite. */
    gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); gl.frontFace(gl.CW);
    const kugel = (form, tex, rotM, lage, groesse, mat, farbeAir, farbeHot) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, form.pos);
      gl.enableVertexAttribArray(K.a.aPos); gl.vertexAttribPointer(K.a.aPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, form.uv);
      gl.enableVertexAttribArray(K.a.aUv); gl.vertexAttribPointer(K.a.aUv, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, form.idx);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(K.u.uTex, 0);
      gl.uniformMatrix3fv(K.u.uRot, false, rotM);
      gl.uniform3fv(K.u.uLage, lage);
      gl.uniform1f(K.u.uGr, groesse);
      gl.uniform3fv(K.u.uLicht, this.LICHT);
      gl.uniform3fv(K.u.uAir, farbeAir); gl.uniform3fv(K.u.uHot, farbeHot);
      gl.uniform1f(K.u.uAmb, mat.amb); gl.uniform1f(K.u.uSpec, mat.spec); gl.uniform1f(K.u.uShine, mat.shine);
      gl.uniform1f(K.u.uFres, mat.fres); gl.uniform1f(K.u.uFpow, mat.fpow);
      gl.uniform1f(K.u.uPuls, mat.puls ? mat.puls * (.78 + .22 * Math.sin(zeit * 1.7)) : 0);
      gl.uniform1f(K.u.uZeit, zeit);
      gl.uniform1f(K.u.uSchlund, mat.schlund ? (pal.wucht || 1) : 0);
      gl.drawElements(gl.TRIANGLES, form.n, gl.UNSIGNED_SHORT, 0);
    };
    kugel(this.form.kugel, this.textur(pal), rot, [0, 0, 0], gr, M, air, hot);

    /* 3. Monde: dieselbe Bahn wie `mondeMalen()` (Drittel je Platz, Neigung
       und Umlauf je Art), nur dass die Tiefe jetzt echt ist — wer hinten
       ist, verschwindet hinter der Kugel von selbst. */
    if (st.monde){
      const mr = .16, bahn = 1.32 + mr;
      st.monde.slice(0, 3).forEach((art, i) => {
        const B = MOND_BAHN[art]; if (!B) return;
        const wnk = i * 2.094 + B.phase * .25 + (zeit + 1.2) * (6.283 / B.umlauf);
        const sw = Math.sin(wnk), cw = Math.cos(wnk);
        const x = cw * bahn, y = sw * bahn * B.neig, z = -sw * bahn * (1 - B.neig);
        const MM = MONDE[art];
        const mmat = { amb: .22, spec: art === "eis" ? .7 : .3, shine: 24, fres: .5, fpow: 2.4, puls: art === "glut" ? .6 : 0 };
        kugel(this.form.kugel, this.mondTextur(art), this.mal(neigung, this.rotY(zeit * .5 + i)),
              [x * gr, y * gr, -z * gr * .4], gr * mr, mmat, this.rgb(MM.schein), this.rgb(art === "glut" ? MM.schein : MM.kern));
      });
    }

    /* 4. Die Ringe ab Stufe „Welt" — durchscheinend, deshalb zuletzt, mit
       Tiefenprüfung, aber ohne Tiefe zu schreiben. */
    if (st.stufe >= 4){
      const P = this.prog.ring, form = this.form.ring;
      gl.useProgram(P.p);
      gl.disable(gl.CULL_FACE); gl.depthMask(false);
      gl.bindBuffer(gl.ARRAY_BUFFER, form.pos);
      gl.enableVertexAttribArray(P.a.aPos); gl.vertexAttribPointer(P.a.aPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, form.uv);
      gl.enableVertexAttribArray(P.a.aUv); gl.vertexAttribPointer(P.a.aUv, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, form.idx);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.ringTex);
      gl.uniform1i(P.u.uTex, 0);
      gl.uniformMatrix3fv(P.u.uRot, false, this.mal(neigung, this.rotY(zeit * .05)));
      gl.uniform3fv(P.u.uLage, [0, 0, 0]);
      gl.uniform1f(P.u.uGr, gr);
      gl.uniform3fv(P.u.uLicht, this.LICHT);
      gl.uniform1f(P.u.uAlpha, 1);
      /* Ringfarbe: die Karte ist weiß, eingefärbt wird über die
         Farbmaske — billiger als eine Karte je Design. */
      gl.blendColor(air[0], air[1], air[2], 1);
      gl.blendFunc(gl.CONSTANT_COLOR, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawElements(gl.TRIANGLES, form.n, gl.UNSIGNED_SHORT, 0);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(true);
    }

    /* 5. Darüber, auf der zweiten Fläche: was das Design außerhalb des
       Kreises trägt — derselbe Code wie im Spiel. */
    const c2 = document.getElementById("heldCanvas");
    if (c2){
      const g = c2.getContext("2d");
      g.clearRect(0, 0, c2.width, c2.height);
      const saveT = Game.t; Game.t = zeit + 1.2;
      try { designSchmuck(g, S / 2, S / 2, R, pal, pal.trait || "plain", merkmale(pal), true); } catch(_){}
      Game.t = saveT;
    }
  }
};
document.addEventListener("visibilitychange", () => { if (!document.hidden) Held3D.weiter(); });

/* „Nächste Errungenschaften": die drei, die am nächsten dran sind.
   Erfunden ist daran nichts — die Schwellen stehen in `ERFOLG_TEXT`, der
   Stand in `Profile.rec`, im Level und in der Zahl der Designs. */
function erfolgStand(id){
  const R = Profile.rec, art = ERFOLG_TEXT[id][0], ziel = ERFOLG_TEXT[id][1];
  const ist = art === "e_masse"     ? (R.mass || 0)
            : art === "e_jagd1" ||
              art === "e_jagd"      ? (R.kills || 0)
            : art === "e_jagdrunde" ? (R.kills || 0)
            : art === "e_runden"    ? (R.runs || 0)
            : art === "e_zeit"      ? Math.floor((R.time || 0)/60)
            : art === "e_skins"     ? Profile.owned.size
            : art === "e_level"     ? Profile.level
            : null;
  return ist === null ? null : { ist, ziel };
}

function naechsteErfolgeMalen(){
  const box = $("naechstBox");
  if (!box) return;
  const hat = new Set((istAngemeldet() && Konto.profil.erfolge) || []);
  const offen = [];
  for (const id of ERFOLG_REIHE){
    if (hat.has(id)) continue;
    const st = erfolgStand(id);
    if (!st) continue;
    offen.push({ id, ...st, anteil: Math.min(1, st.ist / st.ziel) });
  }
  offen.sort((a, b) => b.anteil - a.anteil);
  const drei = offen.slice(0, 3);
  const kopf = `<h2>${esc(t("k_next"))}<em>${hat.size}/${ERFOLG_REIHE.length}</em></h2>`;
  if (!drei.length){
    box.innerHTML = kopf + `<div class="konsBlock"><p class="hintline" style="margin:0">${esc(t("allunlocked"))}</p></div>`;
    return;
  }
  box.innerHTML = kopf + `<div class="konsBlock">` + drei.map(e =>
    `<div class="konsFort${e.anteil >= 1 ? " fertig" : ""}">` +
    `<span>${esc(erfolgLabel(e.id))}</span>` +
    `<span class="bar"><i style="width:${Math.round(e.anteil*100)}%"></i></span>` +
    `<b>${e.anteil >= 1 ? "✓" : Math.round(e.anteil*100) + " %"}</b></div>`).join("") + `</div>`;
}

/* Freundekasten im Startbildschirm. Bewusst **ohne** Onlineanzeige: Die gibt
   es noch nicht (`friendspending`), und ein grauer Punkt, der „offline"
   behauptet, wäre eine Angabe, die das Spiel gar nicht hat. */
function freundBoxMalen(){
  const box = $("freundBox");
  if (!box) return;
  const kopf = `<h2>${esc(t("friends"))}<em><button type="button" id="freundMehr">` +
               `${esc(t("k_manage"))}</button></em></h2>`;
  const liste = Profile.friends.slice(0, 4);
  box.innerHTML = kopf + `<div class="konsBlock">` + (liste.length
    ? liste.map(n => `<div class="konsFr"><span>${esc(n)}</span></div>`).join("") +
      (Profile.friends.length > liste.length
        ? `<div class="konsFr"><small>+${Profile.friends.length - liste.length}</small></div>` : "")
    : `<p class="hintline" style="margin:0">${esc(t("nofriends"))}</p>`) + `</div>`;
  const b = $("freundMehr");
  if (b) b.addEventListener("click", () => { buildFriends(); friendNote(""); show("friendsVeil"); });
}

function show(id){
  hideAll(); $(id).hidden = false; anmeldungLage();
  if (id === "startVeil"){
    /* Der Clankampf ist keine Wahl im Hangar (Schritt 109): Zurueck im
       Hangar steht wieder die Liga, sonst bliebe „clan" als Spielart. */
    if (modeId === "clan"){ modeId = "liga"; buildModes(); }
    buildStrip(); buildBoost(); buildRecords(); paintBonus(); onlineZeigen();
    naechsteErfolgeMalen(); freundBoxMalen(); heldMalen(); clanKnopfMalen();
    bestenlisteZeigen().catch(() => {});
  }
  /* Im Menü darf die Musik vorn stehen, im Spiel nicht: Dort verdeckt sie
     sonst die Töne, an denen man Gefahr erkennt. */
  Musik.ducken(false);
}

/* Zahlenleiste im Reiter und die drei Werte unter dem Körper.
   Seit Schritt 79 gibt es die Werte nur noch **einmal** im Bild. Vorher
   standen dieselben vier Zahlen zweimal in der Seite (Startbildschirm und
   Laden), und jede Änderung musste an zwei Stellen gepflegt werden. */
function setze(id, text){ const el = $(id); if (el) el.textContent = text; }

function paintPurse(){
  const need = Profile.xpNeeded(Profile.level);
  setze("lvNum", Profile.level);
  setze("xpText", Profile.level >= MAX_LEVEL
    ? t("maxlevel") : Profile.xp.toLocaleString(lang) + " / " + need.toLocaleString(lang));
  setze("oreNum", Profile.ore.toLocaleString(lang));
  setze("bestNum", Profile.best.toLocaleString(lang));
  setze("runNum", (Profile.rec.runs || 0).toLocaleString(lang));
  setze("hautNum", Profile.owned.size + " / " + SKINS_ZAHL);
  const bar = $("xpBar");
  if (bar) bar.style.width = (Profile.level >= MAX_LEVEL ? 1
    : clamp(Profile.xp/need, 0, 1))*100 + "%";

  /* Ehre gibt es ausschließlich aus Onlinerunden, die der Server gerechnet
     hat. Ohne Konto steht dort keine Null, sondern nichts. */
  const zeile = $("ehreZeile");
  if (zeile){
    const hat = istAngemeldet() && Number.isFinite(+Konto.profil.ehre);
    zeile.hidden = !hat;
    if (hat) setze("ehreNum", (+Konto.profil.ehre).toLocaleString(lang));
    /* Das Rangabzeichen neben der Ehre — dasselbe, das im Spiel neben dem
       Namen steht, gezeichnet von `abzeichen()`. */
    const abz = $("ehreAbz");
    if (abz){
      const stufe = hat && Number.isInteger(Konto.profil.rang) ? clamp(Konto.profil.rang, 0, RANG_MAX) : null;
      abz.hidden = stufe === null;
      if (stufe !== null){
        try {
          const g = abz.getContext("2d");
          g.clearRect(0, 0, abz.width, abz.height);
          abzeichen(g, 0, 0, stufe, abz.height);
        } catch(_){}
      }
    }
  }
}

/* Rangtafel im Menü. Sie steht nur bei einem Konto da: Ehre gibt es
   ausschließlich aus Onlinerunden, die der Server gerechnet hat. */
/* „Freunde werben" im Reiter Statistik (Schritt 104). Nur mit Konto — der
   Code hängt an der Kontokennung. */
async function buildWerben(){
  const box = $("werbeBox");
  if (!box) return;
  if (!istAngemeldet()){ box.hidden = true; return; }
  const st = Werben.stand || await Werben.laden();
  if (!st){ box.hidden = true; return; }
  box.hidden = false;
  const link = Werben.link();
  box.innerHTML =
    `<h2>${esc(t("w_head"))}</h2>` +
    `<p class="hinweis">${esc(t("w_text", st.level, st.lohnWerber.toLocaleString(lang), st.lohnNeu.toLocaleString(lang), st.ziel, st.bonusOre.toLocaleString(lang)))}</p>` +
    `<div class="werbeZeile"><span>${esc(t("w_code"))}</span><b>${esc(st.code)}</b></div>` +
    `<div class="werbeZeile"><span>${esc(t("w_link"))}</span><b class="klein">${esc(link)}</b></div>` +
    `<div class="werbeKnoepfe"><button type="button" id="werbeKopie">${esc(t("w_kopieren"))}</button>` +
    (navigator.share ? `<button type="button" class="quiet" id="werbeTeilen">${esc(t("w_teilen"))}</button>` : "") + `</div>` +
    `<p class="hinweis werbeStand">${esc(t("w_stand", st.geworben, st.ziel))}${st.bonus ? " · " + esc(t("w_bonus")) : ""}</p>`;
  const kopie = $("werbeKopie");
  if (kopie) kopie.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(link); kopie.textContent = t("w_kopiert"); }
    catch(_){ kopie.textContent = link; }
  });
  const teilen = $("werbeTeilen");
  if (teilen) teilen.addEventListener("click", () => {
    try { navigator.share({ title: "Talumi", text: t("w_teiltext"), url: link }).catch(() => {}); } catch(_){}
  });
}

function paintRank(){
  buildRaenge();
  buildWerben().catch(() => {});
  const box = $("rankBox");
  if (!box) return;
  if (!istAngemeldet() || !Number.isInteger(Konto.profil.rang)){ box.hidden = true; return; }
  const stufe = clamp(Konto.profil.rang, 0, RANG_MAX);
  const ehre  = Konto.profil.ehre || 0;
  box.hidden = false;
  box.innerHTML =
    `<h2>${esc(t("rang"))}</h2>` +
    `<div class="rankline"><canvas width="96" height="56"></canvas>` +
    `<div><b>${esc(t("rk" + stufe))}</b>` +
    `<small>${esc(ehre.toLocaleString(lang))} ${esc(t("ehre"))}</small></div></div>` +
    `<p class="hinweis">${esc(t("ehrewie"))}</p>`;
  const c = box.querySelector("canvas");
  const g = c.getContext("2d");
  g.clearRect(0, 0, c.width, c.height);
  /* Doppelt so groß gezeichnet wie angezeigt — auf einem Bildschirm mit
     hoher Auflösung sieht das Abzeichen sonst weich aus. */
  abzeichen(g, 0, 0, stufe, 56);
}

function preview(canvas, pal){
  canvas.width = 132; canvas.height = 132;
  const g = canvas.getContext("2d");
  g.clearRect(0,0,132,132);
  const saveT = Game.t; Game.t = 1.2;
  body(g, 66, 62, 36, 3000, pal, 0, "", true);
  Game.t = saveT;
}
/* Schritt 96: Auf dem Ergebnisbildschirm steht, wie weit es bis zum
   nächsten Level ist und was dort wartet. „Noch eine Runde" braucht ein
   sichtbares Ziel, das nahe genug ist, um es heute zu schaffen. Die Zahlen
   sind dieselben wie oben im Menü (Profile, beim Konto vom Server). */
function naechstesZiel(){
  if (Profile.level >= MAX_LEVEL) return "";
  const noetig = Profile.xpNeeded(Profile.level);
  const anteil = clamp(Profile.xp / noetig, 0, 1);
  const design = SKINS.find(s => s.lv === Profile.level + 1);
  const text = t("e_ziel", Math.max(0, Math.ceil(noetig - Profile.xp)).toLocaleString(lang),
                 Profile.level + 1) + (design ? `: <b>${esc(design.label)}</b>` : "");
  return `<div style="margin:10px 0 2px;height:6px;border-radius:3px;background:rgba(255,255,255,.12);overflow:hidden">` +
         `<i style="display:block;height:100%;width:${(anteil*100).toFixed(1)}%;background:var(--brass)"></i></div>` +
         `<p class="hintline" style="margin-top:4px">${text}</p>`;
}

function nextUnlock(){
  const byLevel = SKINS.filter(s => s.lv && !Profile.owned.has(s.id))
                       .sort((a,b) => a.lv-b.lv)[0];
  const byOre = SKINS.filter(s => s.ore && !Profile.owned.has(s.id))
                     .sort((a,b) => a.ore-b.ore)[0];
  const bits = [];
  if (byLevel) bits.push(t("levelreq", byLevel.lv) + ": " + byLevel.label);
  if (byOre) bits.push(t("orereq", byOre.ore.toLocaleString(lang)) + ": " + byOre.label);
  return bits.length ? t("nextup") + " " + bits.join(" · ") : t("allunlocked");
}

/* Nur was freigespielt ist. Gesperrte Designs gehören in den Shop,
   nicht in die Schnellwahl — sonst ist die Leiste bei 42 Einträgen unbrauchbar. */
/* --- Modi --------------------------------------------------------- */
/* Wie viele Menschen gerade spielen, unter dem Startknopf.

   Ohne erreichbaren Server bleibt die Zeile **leer** statt „0 online" zu
   behaupten: Null Spieler und kein Server sind zwei verschiedene Aussagen, und
   die erste schreckt ab, obwohl sie gar nicht stimmt. NPCs zählen nicht mit —
   `/health` trennt sie, und eine Zahl, die Computergegner mitzählt, wäre
   genau die Art Angabe, die das Spiel anderen vorwirft. */
function onlineZeigen(){
  const n = Konto.online;
  /* Nur noch auf dem Anmeldebildschirm, und nur, wenn wirklich jemand
     spielt. Thomas am 16.09.2026: „Noch niemand im Orbit — das ist nicht gut
     für uns." Eine leere Zeile sagt nichts; eine Null sagt „hier ist nichts
     los" — und das liest jeder Besucher als Grund zu gehen. Unter dem
     Startknopf stand die Zahl bis Schritt 101 auch; dort verbreiterte sie
     den Block und schob ihn über die Kopfzeile. */
  const el = $("anmOnline");
  if (!el) return;
  if (!(n > 0)){ el.hidden = true; el.textContent = ""; return; }
  el.hidden = false;
  el.textContent = n === 1 ? t("online1") : t("onlinen", n);
}

/* Der Startblock sitzt im Querformat rechts **auf** der Kopfzeile, und die
   Kopfzeile muss ihm Platz lassen (`padding-right`, siehe index.html). Wie
   breit er ist, hängt von Sprache, Tippgerät und Happy-Hour-Zeile ab — eine
   feste Zahl war zweimal zu klein (Schritt 94 und 101). Deshalb wird er
   gemessen, und die Kopfzeile bekommt die Breite als `--start-breite`. */
(function kopfPlatz(){
  const kopf = document.querySelector(".konsKopf");
  const start = document.querySelector(".konsStart");
  if (!kopf || !start) return;
  /* Ist rechts noch etwas verborgen? Dann bekommt der Streifen einen
     Verlauf am Rand, damit man sieht, dass er sich schieben lässt. */
  const rand = () => {
    kopf.classList.toggle("schiebbar", kopf.scrollWidth - kopf.clientWidth - kopf.scrollLeft > 2);
  };
  /* Sitzt der Block fest am Bildrand (`position:fixed`), wird er aus der
     Kopfzeile herausgehoben und hängt direkt am Startbildschirm. Die
     Kopfzeile ist dort ein schiebbarer Streifen (`overflow-x:auto`), und
     Safari auf dem iPhone schneidet feste Kinder eines solchen Streifens an
     dessen Kante ab — der Knopf liegt aber ganz außerhalb und war deshalb
     auf Telefonen unsichtbar (Thomas, 17.09.2026), während jeder
     Rechner-Browser ihn zeigte. Am Rechner gehört er in die Mitte der
     Kopfzeile und kommt dorthin zurück. */
  const veil = kopf.parentElement, danach = kopf.querySelector(".konsG.r");
  const ort = () => {
    const fest = getComputedStyle(start).position === "fixed";
    if (fest && start.parentElement === kopf) veil.insertBefore(start, kopf.nextSibling);
    else if (!fest && start.parentElement !== kopf) kopf.insertBefore(start, danach);
  };
  const setzen = () => {
    ort();
    const b = Math.ceil(start.getBoundingClientRect().width);
    if (b > 0) kopf.style.setProperty("--start-breite", b + "px");
    rand();
  };
  /* Nur der Startblock wird beobachtet. Die Kopfzeile selbst zu beobachten
     und im Rückruf ihre Klasse zu ändern, meldete der Browser als
     „ResizeObserver loop" (gesehen auf talumi.io, 16.09.2026) — der Rand
     wird stattdessen nach jeder Breitenänderung und beim Schieben geprüft. */
  if (typeof ResizeObserver === "function") new ResizeObserver(setzen).observe(start);
  window.addEventListener("resize", setzen);
  /* Zusätzlich auf die Formatgrenzen selbst hören: Beim Drehen des Telefons
     kommt das Größenereignis nicht überall verlässlich vor dem neuen Stil. */
  if (typeof matchMedia === "function") for (const q of ["(max-height:640px)", "(max-width:900px)", "(min-width:640px)"]) {
    const m = matchMedia(q);
    if (m.addEventListener) m.addEventListener("change", setzen); else if (m.addListener) m.addListener(setzen);
  }
  kopf.addEventListener("scroll", rand, { passive: true });
  setzen();
  requestAnimationFrame(rand);
})();

/* Happy Hour (Schritt 100): eine Zeile unter dem Startknopf und eine auf dem
   Anmeldebildschirm. Läuft sie, steht die Restzeit da; sonst die Uhrzeit der
   nächsten, in der Ortszeit des Spielers. Ohne Server bleibt die Zeile weg. */
function happyFaktor(){
  const h = Konto.happy;
  if (!h) return 1;
  /* Aus den Zeitmarken gerechnet, nicht aus `aktiv`: Der letzte Stand kommt
     vom Startbildschirm, und eine Runde kann in die Stunde hinein- oder aus
     ihr herauslaufen. Der Server rechnet für Konten ohnehin selbst. */
  const jetzt = Date.now();
  const laeuft = h.aktiv ? jetzt < h.bis
               : (h.naechste > 0 && jetzt >= h.naechste && jetzt < h.naechste + 3600000);
  return laeuft ? h.faktor : 1;
}
function happyZeigen(){
  const h = Konto.happy;
  for (const id of ["happyText", "anmHappy"]){
    const el = $(id);
    if (!el) continue;
    /* Unter dem Startknopf nur, solange sie läuft — als Werbung für die
       nächste Stunde reicht die Zeile auf dem Anmeldebildschirm; unter dem
       Knopf wäre sie eine zweite Textzeile, die die Kopfzeile sprengt. */
    if (!h || (id === "happyText" && !h.aktiv)){ el.hidden = true; el.textContent = ""; el.classList.remove("an"); continue; }
    el.hidden = false;
    const faktor = h.faktor.toLocaleString(lang, { maximumFractionDigits: 1 });
    if (h.aktiv){
      const rest = Math.max(1, Math.ceil((h.bis - Date.now()) / 60000));
      el.textContent = t("hh_aktiv", faktor, rest);
      el.classList.add("an");
    } else {
      const uhr = h.naechste
        ? new Date(h.naechste).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" }) : "";
      el.textContent = t("hh_naechste", uhr, faktor);
      el.classList.remove("an");
    }
  }
}

/* Saison im Hangar (Schritt 100): „Saison 1 · noch 12 Tage", darunter die
   eigene Saison-Ehre mit Fortschrittsbalken der Saison. Gäste sehen Nummer
   und Restzeit und den Satz, worum es geht. */
function saisonZeigen(){
  const box = $("saisonBox");
  if (!box) return;
  const s = Konto.saison;
  if (!s){ box.hidden = true; return; }
  box.hidden = false;
  const tage = Math.max(0, Math.ceil((s.ende - Date.now()) / 86400000));
  setze("saisonKopf", t("s_kopf", s.nr));
  setze("saisonRest", tage <= 1 ? t("s_rest1") : t("s_rest", tage));
  const anteil = s.ende > s.start ? clamp((Date.now() - s.start) / (s.ende - s.start), 0, 1) : 0;
  const ehre = istAngemeldet() && Konto.profil.saison ? (+Konto.profil.saison.ehre || 0) : null;
  $("saisonInhalt").innerHTML =
    (ehre === null
      ? `<span>${esc(t("s_regel"))}</span>`
      : `<span><b>${ehre.toLocaleString(lang)}</b>${esc(t("s_ehre"))}</span>`) +
    `<span class="balken" title="${Math.round(anteil*100)} %"><i style="width:${Math.round(anteil*100)}%"></i></span>`;
}

/* Regelmäßig nachfragen, aber nur solange der Startbildschirm zu sehen ist —
   im Spiel läuft die Verbindung ohnehin, und eine Abfrage alle halbe Minute
   aus jedem offenen Tab wäre eine Last ohne Gegenwert. */
setInterval(() => {
  const v = $("startVeil");
  if (!v || v.hidden) return;
  if (document.hidden) return;
  Konto.anklopfen().catch(() => {});
  Konto.kampfPruefen();
}, 30000);

/* Clankampf im Hangar (Schritt 109): die Karte steht nur, solange für den
   eigenen Clan ein Kampf läuft — Thomas: „Außer der Kampf findet statt,
   dann muss er für die Teilnehmer im Hauptmenü sichtbar sein." */
function kampfKarteMalen(){
  const box = $("kampfBox");
  if (!box) return;
  const k = Konto.kampf;
  if (!k || !istAngemeldet() || !Konto.profil.clan || Date.now() > k.ende){ box.hidden = true; box.innerHTML = ""; return; }
  const gegner = Konto.profil.clan.tag === k.von.tag ? k.an : k.von;
  const restS = Math.max(0, Math.round((k.beitrittBis - Date.now()) / 1000));
  const offen = k.offen !== false && restS > 0;
  box.hidden = false;
  box.innerHTML = `<h2>${esc(t("ck_kopf"))}</h2><div class="konsBlock kampfKarte">` +
    `<span><b>${esc(t("ck_laeuft", "[" + gegner.tag + "] " + gegner.name))}</b><br><small>${esc(offen ? t("ck_offen", restS) : t("ck_zu"))}</small></span>` +
    `<button type="button" id="kampfGo" ${offen ? "" : "disabled"}>${esc(t("ck_beitreten"))}</button></div>`;
  $("kampfGo").addEventListener("click", kampfBeitreten);
}
function kampfBeitreten(){
  const cv = $("clanVeil"); if (cv && !cv.hidden) show("startVeil");
  modeId = "clan"; buildModes(); buildBoost();
  $("startBtn").click();
}

/* Bestenliste auf dem Startbildschirm — die besten acht nach Spitzenmasse.

   Sie stand bisher nur hinter dem Knopf „Ranglisten". Damit war das, was das
   Spiel seit Schritt 65 ausmacht, auf dem Startbildschirm unsichtbar, und
   unter dem Startknopf blieb ein leeres Feld. Agar zeigt genau das an genau
   dieser Stelle.

   Höchstens einmal je Minute geholt: Die Liste ändert sich langsam, und jeder
   Besuch des Menüs eine Abfrage wäre Last ohne Gegenwert. */
let bestenCache = { zeit: 0, html: "" };
/* Wie viele Plätze auf dem Startbildschirm stehen. Fünf — so steht es im
   Entwurf, und mehr passt in der rechten Spalte nicht, ohne dass die Liste
   unten abgeschnitten wird. Wer alle sehen will, öffnet „Ranglisten". */
const BESTEN_ZEILEN = 5;

async function bestenlisteZeigen(){
  const box = $("boardBox"), liste = $("boardList");
  if (!box || !liste) return;
  if (Konto.online === null || Konto.online === undefined){ box.hidden = true; return; }

  if (bestenCache.html && Date.now() - bestenCache.zeit < 60000){
    liste.innerHTML = bestenCache.html; box.hidden = false; return;
  }
  const a = await Konto.rangliste("best", null, null);
  const zeilen = (a && a.liste) ? a.liste.slice(0, BESTEN_ZEILEN) : [];
  if (!zeilen.length){ box.hidden = true; return; }

  const ich = Konto.profil ? Konto.profil.id : -1;
  bestenCache = {
    zeit: Date.now(),
    html: zeilen.map(e => {
      const land = e.land ? `<small>${esc(e.land)}</small>` : "";
      const wert = Math.round(+e.wert || +e.best || 0).toLocaleString(lang);
      return `<div class="rankrow${+e.id === ich ? " me" : ""}">` +
             `<i>${e.rang}</i><b>${esc(e.name)}${land}</b><span>${wert}</span></div>`;
    }).join("")
  };
  liste.innerHTML = bestenCache.html;
  box.hidden = false;
}

/* Reihenfolge im Menü. „Freier Raum" steht oben, weil es der Modus ist, für
   den die Leute kommen. `open` fehlt bewusst: Das ist seit Schritt 69 nur noch
   der lokale Rückfall desselben Eintrags, kein eigener Modus mehr. */
/* Schritt 109 (Thomas): nur noch Liga (Hauptmodus) und Freies Spiel im
   Hangar. Battle Royale und Freundschaftsspiel sind ausgeblendet, nicht
   gelöscht (MODES kennt sie weiter); der Clankampf kommt über das Clanmenü. */
const MODE_LISTE = ["liga", "online"];

function buildModes(){
  const box = $("modes");
  box.innerHTML = "";
  for (const id of MODE_LISTE){
    const M = MODES[id];
    if (!M) continue;
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-pressed", String(modeId === id));
    b.innerHTML = `<b>${t("m_"+id)}</b><span>${t("m_"+id+"_b")}</span>`;
    b.addEventListener("click", () => { modeId = id; buildModes(); buildBoost(); heldMalen(); });
    box.appendChild(b);
  }
  mondeReiterZeigen();
}

/* --- Freunde -------------------------------------------------------- */
function friendNote(text, kind){
  const n = $("friendNote");
  n.textContent = text || "";
  n.className = "notice" + (kind ? " " + kind : "");
}
function buildFriends(){
  const list = $("friendList");
  list.innerHTML = "";
  if (!Profile.friends.length){
    list.innerHTML = `<p class="hintline">${t("nofriends")}</p>`;
    return;
  }
  for (const name of Profile.friends){
    const row = document.createElement("div");
    row.className = "friend";
    const label = document.createElement("div");
    label.innerHTML = `${esc(name)}<small>${t("friendspending")}</small>`;
    const del = document.createElement("button");
    del.type = "button"; del.textContent = t("remove");
    del.addEventListener("click", () => {
      Profile.friends = Profile.friends.filter(f => f !== name);
      Gast.sichern();
      buildFriends(); friendNote(t("fr_removed", name));
    });
    row.appendChild(label); row.appendChild(del);
    list.appendChild(row);
  }
}
function addFriend(){
  const raw = $("friendName").value;
  const name = cleanName(raw).trim();
  if (!name) return friendNote(t("fr_type"), "warn");
  if (name.toLowerCase() === spielerName().trim().toLowerCase())
    return friendNote(t("fr_own"), "warn");
  if (Profile.friends.some(f => f.toLowerCase() === name.toLowerCase()))
    return friendNote(t("fr_already", name), "warn");
  if (Profile.friends.length >= 50) return friendNote(t("fr_full"), "warn");
  Profile.friends.push(name);
  Gast.sichern();
  $("friendName").value = "";
  buildFriends();
  friendNote(t("fr_added", name), "good");
}

/* --- Clans (Schritt 100) ---------------------------------------------
   Eine Karte, drei Lagen: kein Konto, kein Clan, im Clan. Alles, was hier
   steht, kommt vom Server (`/konto/clan/…`, `/clan/…`); der Client zeigt
   nur an und schickt Wünsche. */
function clanMeldung(text, art){
  const n = $("clanNote");
  if (!n) return;
  n.textContent = text || "";
  n.className = "notice" + (art ? " " + art : "");
}
function clanKnopfMalen(){
  const b = $("clanBtnTag");
  if (!b) return;
  const tag = istAngemeldet() && Konto.profil.clan ? Konto.profil.clan.tag : "";
  b.textContent = tag; b.hidden = !tag;
}
async function clanTun(was, daten, erfolgText){
  clanMeldung(t("k_wait"));
  const e = await Konto.clanTun(was, daten);
  if (e.fehler){ clanMeldung(t(KONTO_FEHLER[e.fehler] || "e_net"), "warn"); return null; }
  clanMeldung("");
  if (erfolgText) toast(erfolgText(e));
  clanKnopfMalen();
  await clanZeichnen();
  return e;
}
function clanListeHtml(liste, mitBeitreten){
  if (!liste || !liste.length) return `<p class="hintline">${esc(t("cl_keine"))}</p>`;
  return `<div class="clanListe">` + liste.map((c, i) =>
    `<div class="clanZeile"><span class="tg">${esc(c.tag)}</span>` +
    `<span>${esc(c.name)}<small style="color:var(--paper-2)"> · ${c.mitglieder} · ${(c.ehre || 0).toLocaleString(lang)} ${esc(t("ehre"))}</small></span>` +
    `<i>${c.rang ? "#" + c.rang : ""}</i>` +
    (mitBeitreten ? `<button type="button" class="quiet" data-clan="${c.id}">${esc(t("cl_beitreten"))}</button>` : `<span></span>`) +
    `</div>`).join("") + `</div>`;
}
async function clanZeichnen(){
  const body = $("clanBody");
  if (!body) return;
  if (!Konto.angemeldet()){
    body.innerHTML = `<p class="hintline">${esc(t("cl_konto"))}</p>` +
      `<button type="button" id="clanAnmelden" style="margin-top:12px;width:auto;padding:10px 18px">${esc(t("k_signin"))}</button>`;
    $("clanAnmelden").addEventListener("click", () => show("accountVeil"));
    return;
  }
  body.innerHTML = `<p class="hintline">${esc(t("k_wait"))}</p>`;
  const [ich, beste] = await Promise.all([Konto.clanIch(), Konto.clanListe("/clan/rangliste")]);
  if (!ich){ body.innerHTML = `<p class="hintline">${esc(t("e_net"))}</p>`; return; }
  const top = (beste && beste.liste) || [];
  clanKampfStand = ich.kampf || null;
  Konto.kampfPruefen();
  if (ich.clan) clanImClan(body, ich.clan, top);
  else await clanOhne(body, ich.einladungen || [], top);
}
let clanKampfStand = null;
function kampfHtml(leiter, c){
  const K = clanKampfStand || { laeuft: null, eingehend: [], ausgehend: [], letzte: [] };
  const gegnerVon = k => (k.von.id === c.id ? k.an : k.von);
  let html = `<div class="konsSek"><h2>${esc(t("ck_kopf"))}</h2><div class="konsBlock">` +
    `<p class="hintline" style="margin:0 0 8px">${esc(t("ck_erkl"))}</p>`;
  if (K.laeuft){
    const g = gegnerVon(K.laeuft), restS = Math.max(0, Math.round((K.laeuft.beitrittBis - Date.now()) / 1000));
    html += `<div class="kampfKarte"><span><b>${esc(t("ck_laeuft", "[" + g.tag + "] " + g.name))}</b><br><small>${esc(restS > 0 ? t("ck_offen", restS) : t("ck_zu"))}</small></span>` +
      `<button type="button" id="kampfGo2" ${restS > 0 ? "" : "disabled"}>${esc(t("ck_beitreten"))}</button></div>`;
  }
  if (leiter){
    html += `<div class="clanReihe" style="margin-top:8px"><input type="text" id="kampfTag" maxlength="24" placeholder="${esc(t("ck_tag"))}" autocomplete="off">` +
      `<button type="button" id="kampfFordern">${esc(t("ck_fordern"))}</button></div>`;
  } else html += `<p class="hintline">${esc(t("ck_leiter"))}</p>`;
  if (K.eingehend.length){
    html += `<h3 style="margin:10px 0 4px">${esc(t("ck_eingehend"))}</h3>` + K.eingehend.map(k =>
      `<div class="kampfZeile"><span>[${esc(k.von.tag)}] ${esc(k.von.name)}</span>` +
      (leiter ? `<button type="button" data-annehmen="${k.id}">${esc(t("ck_annehmen"))}</button><button type="button" class="quiet" data-ablehnen="${k.id}">${esc(t("ck_ablehnen"))}</button>` : "") +
      `</div>`).join("");
  }
  if (K.ausgehend.length){
    html += `<h3 style="margin:10px 0 4px">${esc(t("ck_ausgehend"))}</h3>` + K.ausgehend.map(k =>
      `<div class="kampfZeile"><span>[${esc(k.an.tag)}] ${esc(k.an.name)}</span></div>`).join("");
  }
  if (K.letzte.length){
    html += `<h3 style="margin:10px 0 4px">${esc(t("ck_letzte"))}</h3>` + K.letzte.map(k => {
      const g = gegnerVon(k);
      const txt = !k.sieger ? t("ck_remis", "[" + g.tag + "]") : k.sieger === c.id ? t("ck_sieg", "[" + g.tag + "]") : t("ck_niederlage", "[" + g.tag + "]");
      const m = k.massen && Array.isArray(k.massen) ? ` · ${k.massen[0]} : ${k.massen[1]}` : "";
      return `<div class="kampfZeile"><span>${esc(txt)}<small style="color:var(--paper-2)">${esc(m)}</small></span></div>`;
    }).join("");
  }
  return html + `</div></div>`;
}
function kampfHandler(body){
  const go = $("kampfGo2"); if (go) go.addEventListener("click", kampfBeitreten);
  const f = $("kampfFordern");
  if (f) f.addEventListener("click", () => {
    const tag = ($("kampfTag").value || "").trim();
    if (!tag) return clanMeldung(t("ck_tag"), "warn");
    clanTun("herausfordern", { tag }, e => t("ck_gefordert", "[" + e.kampf.an.tag + "]"));
  });
  for (const b of body.querySelectorAll("[data-annehmen]"))
    b.addEventListener("click", () => clanTun("annehmen", { id: +b.dataset.annehmen }));
  for (const b of body.querySelectorAll("[data-ablehnen]"))
    b.addEventListener("click", () => clanTun("ablehnen", { id: +b.dataset.ablehnen }));
}
function clanImClan(body, c, top){
  const ich = Konto.profil.id;
  const leiter = c.mitglieder.some(m => m.id === ich && m.rolle === "leiter");
  const zeilen = c.mitglieder.map((m, i) =>
    `<div class="clanZeile"><i>${i + 1}</i>` +
    `<span>${esc(m.name)}<small style="color:var(--paper-2)"> · ${esc(t("level"))} ${m.level}</small></span>` +
    `<span class="${m.rolle === "leiter" ? "rolle" : "ehre"}">${m.rolle === "leiter" ? esc(t("cl_leiter")) : (m.ehre || 0).toLocaleString(lang)}</span>` +
    (leiter && m.id !== ich
      ? `<span><button type="button" class="quiet" data-raus="${m.id}">${esc(t("cl_rauswerfen"))}</button> ` +
        `<button type="button" class="quiet" data-chef="${m.id}">${esc(t("cl_uebergeben"))}</button></span>`
      : `<span></span>`) + `</div>`).join("");
  body.innerHTML =
    `<div class="clanKopf"><span class="tag">[${esc(c.tag)}]</span><span class="nm">${esc(c.name)}</span>` +
    `<div class="werte"><span><b>${(c.ehre || 0).toLocaleString(lang)}</b>${esc(t("cl_ehre"))}</span>` +
    `<span><b>#${c.platz}</b>${esc(t("cl_platz"))}</span>` +
    `<span><b>${c.mitglieder.length}/30</b>${esc(t("cl_mitglieder"))}</span></div></div>` +
    `<p class="hintline" style="margin:0 0 10px">${esc(t("cl_gruender", new Date(c.erstellt).toLocaleDateString(lang)))} · ${esc(c.offen ? t("cl_offen") : t("cl_zu"))}</p>` +
    `<div class="clanSpalten"><div>` +
    `<div class="konsSek"><h2>${esc(t("cl_mitglieder"))}</h2><div class="konsBlock">${zeilen}</div></div></div>` +
    `<div>` + kampfHtml(leiter, c) +
    (leiter
      ? `<div class="konsSek"><h2>${esc(t("cl_einladen"))}</h2><div class="konsBlock">` +
        `<div class="clanReihe"><input type="text" id="clanEinlName" maxlength="14" placeholder="${esc(t("playername"))}" autocomplete="off" autocapitalize="off" spellcheck="false">` +
        `<button type="button" id="clanEinlGo">${esc(t("cl_einladen"))}</button></div>` +
        `<div class="clanReihe"><button type="button" class="quiet" id="clanOffenGo" style="flex:1">${esc(c.offen ? t("cl_zu") : t("cl_offen"))}</button></div>` +
        `</div></div>`
      : "") +
    `<div class="konsSek"><h2>${esc(t("cl_beste"))}</h2><div class="konsBlock">${clanListeHtml(top.slice(0, 8), false)}</div></div>` +
    `<div class="clanReihe" style="margin-top:14px"><button type="button" class="quiet" id="clanRaus" style="flex:1">${esc(t("cl_verlassen"))}</button></div>` +
    `</div></div>`;
  for (const b of body.querySelectorAll("[data-raus]"))
    b.addEventListener("click", () => clanTun("rauswerfen", { id: +b.dataset.raus }, () => t("cl_entfernt")));
  for (const b of body.querySelectorAll("[data-chef]"))
    b.addEventListener("click", () => clanTun("uebergeben", { id: +b.dataset.chef }));
  const einl = $("clanEinlGo");
  if (einl) einl.addEventListener("click", () => {
    const n = cleanName($("clanEinlName").value).trim();
    if (!n) return clanMeldung(t("fr_type"), "warn");
    clanTun("einladen", { name: n }, e => t("cl_eingeladen", e.name));
  });
  const offen = $("clanOffenGo");
  if (offen) offen.addEventListener("click", () => clanTun("offen", { offen: !c.offen }));
  kampfHandler(body);
  const raus = $("clanRaus");
  raus.addEventListener("click", () => {
    if (raus.dataset.sicher !== "1"){ raus.dataset.sicher = "1"; raus.textContent = t("cl_sicher"); return; }
    clanTun("verlassen", {}, () => t("cl_verlassen_ok"));
  });
}
async function clanOhne(body, einladungen, top){
  const offene = await Konto.clanListe("/clan/suche");
  const einl = einladungen.length
    ? `<div class="clanListe">` + einladungen.map(e =>
        `<div class="clanZeile"><span class="tg">${esc(e.tag)}</span><span>${esc(e.name)}` +
        (e.von ? `<small style="color:var(--paper-2)"> · ${esc(t("cl_von", e.von))}</small>` : "") + `</span><i></i>` +
        `<button type="button" class="quiet" data-clan="${e.id}">${esc(t("cl_beitreten"))}</button></div>`).join("") + `</div>`
    : `<p class="hintline" style="margin:0">${esc(t("cl_keine_einl"))}</p>`;
  body.innerHTML =
    `<p class="hintline" style="margin:0 0 10px">${esc(t("cl_none"))}</p>` +
    `<div class="clanSpalten"><div class="clanForm">` +
    `<div class="konsSek"><h2>${esc(t("cl_gruenden"))}</h2><div class="konsBlock">` +
    `<label for="clanNeuName">${esc(t("cl_name"))}</label><input type="text" id="clanNeuName" maxlength="20" autocomplete="off" spellcheck="false">` +
    `<label for="clanNeuTag">${esc(t("cl_tag"))}</label><input type="text" id="clanNeuTag" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false">` +
    `<div class="seg" id="clanNeuOffen" style="margin-top:10px"><button type="button" data-offen="1" aria-pressed="true">${esc(t("cl_offen"))}</button><button type="button" data-offen="0" aria-pressed="false">${esc(t("cl_zu"))}</button></div>` +
    `<button type="button" id="clanNeuGo">${esc(t("cl_gruenden"))}</button></div></div></div>` +
    `<div>` +
    `<div class="konsSek"><h2>${esc(t("cl_einladungen"))}</h2><div class="konsBlock">${einl}</div></div>` +
    `<div class="konsSek"><h2>${esc(t("cl_offene"))}</h2><div class="konsBlock">` +
    `<div class="clanReihe" style="margin:0 0 6px"><input type="text" id="clanSuche" maxlength="20" placeholder="${esc(t("cl_suchen"))}" autocomplete="off" spellcheck="false"></div>` +
    `<div id="clanOffeneListe">${clanListeHtml((offene && offene.liste) || [], true)}</div></div></div>` +
    `<div class="konsSek"><h2>${esc(t("cl_beste"))}</h2><div class="konsBlock">${clanListeHtml(top.slice(0, 5), false)}</div></div>` +
    `</div></div>`;
  let neuOffen = true;
  for (const b of body.querySelectorAll("#clanNeuOffen button"))
    b.addEventListener("click", () => {
      neuOffen = b.dataset.offen === "1";
      for (const x of body.querySelectorAll("#clanNeuOffen button")) x.setAttribute("aria-pressed", String(x === b));
    });
  $("clanNeuGo").addEventListener("click", () =>
    clanTun("gruenden", { name: $("clanNeuName").value, tag: $("clanNeuTag").value, offen: neuOffen },
            e => t("cl_gegruendet", e.clan.name)));
  const beitritt = b => clanTun("beitreten", { id: +b.dataset.clan }, e => t("cl_beigetreten", e.clan.name));
  for (const b of body.querySelectorAll("[data-clan]")) b.addEventListener("click", () => beitritt(b));
  let suchWecker = 0;
  $("clanSuche").addEventListener("input", () => {
    clearTimeout(suchWecker);
    suchWecker = setTimeout(async () => {
      const r = await Konto.clanListe("/clan/suche?q=" + encodeURIComponent($("clanSuche").value.trim()));
      const box = $("clanOffeneListe");
      if (!box) return;
      box.innerHTML = clanListeHtml((r && r.liste) || [], true);
      for (const b of box.querySelectorAll("[data-clan]")) b.addEventListener("click", () => beitritt(b));
    }, 250);
  });
}

/* Anmeldebonus im Startbildschirm. Nur für angemeldete Spieler — ohne Konto
   gäbe es nichts, woran sich die Reihe festmachen ließe, und ein Bonus, den
   man durch Leeren des Browsers beliebig oft bekommt, ist keiner.

   Die Staffel steht auf dem Server; hier wird nur angezeigt, was er meldet.
   Abgeholt wird auf Knopfdruck, nicht von allein: Eine Belohnung, die man
   nicht bemerkt hat, holt niemanden zurück. */
/* Dieselbe Reihe wie `BONUS_STAFFEL` im Server (Schritt 100): Ore, Gutschein
   für den Startbonus (×2, ×3), Ehre, Erfahrung. Gäste haben keine Ehre —
   ihr vierter Tag zahlt Ore (`BONUS_GAST`). */
const BONUS_ANZEIGE = [
  { ore: 100 }, { ore: 150 }, { boost: 2 }, { ehre: 40 }, { xp: 400 }, { boost: 3 }, { ore: 1000, design: "sunflare" }
];
const BONUS_GAST = BONUS_ANZEIGE.map(b => b.ehre ? { ore: 200 } : b);
function bonusReihe(){ return istAngemeldet() ? BONUS_ANZEIGE : BONUS_GAST; }
/* Kurztext eines Tages: „50 Ore", „Startbonus ×2", „20 Ehre", „150 XP". */
function bonusText(b){
  if (!b) return "";
  if (b.design && !Profile.owned.has(b.design)){
    const d = SKINS.find(k => k.id === b.design);
    return t("b_design", d ? d.label : b.design) + " + " + (b.ore || 0).toLocaleString(lang) + " Ore";
  }
  if (b.boost) return t("b_boost", b.boost);
  if (b.xp)    return b.xp.toLocaleString(lang) + " XP";
  if (b.ehre)  return b.ehre.toLocaleString(lang) + " " + t("ehre");
  return (b.ore || 0).toLocaleString(lang) + " Ore";
}
/* Die Bildchen der Tagesreihe (Schritt 107, Thomas: „hochauflösende, echte
   kleine Bildchen"): auf einer Leinwand mit Verläufen und Glanz gezeichnet
   und als Bild eingebettet — doppelt so groß gerechnet wie gezeigt, damit
   sie auf dichten Bildschirmen scharf bleiben. Ein Design wird mit
   `body()` selbst gemalt, wie im Hangar. */
const IKON_CACHE = {};
function ikonBild(art, design){
  const key = design ? "d:" + design : art;
  if (IKON_CACHE[key]) return IKON_CACHE[key];
  const S = 96, c = document.createElement("canvas"); c.width = c.height = S;
  const g = c.getContext("2d");
  if (design){
    const pal = SKINS.find(k => k.id === design);
    if (pal){ const t0 = Game.t; Game.t = 1.2; try { body(g, S/2, S/2, S*.30, 3000, pal, 0, "", true); } catch(_){} Game.t = t0; }
  } else if (art === "ore"){
    /* Erznugget: Facetten, Messingverlauf, Lichtkante links oben. */
    const gr = g.createLinearGradient(14, 14, 82, 86);
    gr.addColorStop(0, "#ffe2a4"); gr.addColorStop(.45, "#e9b063"); gr.addColorStop(1, "#7a4a1c");
    g.beginPath(); g.moveTo(48, 10); g.lineTo(82, 30); g.lineTo(78, 68); g.lineTo(48, 88); g.lineTo(16, 66); g.lineTo(20, 28); g.closePath();
    g.fillStyle = gr; g.fill();
    g.strokeStyle = "rgba(60,30,10,.7)"; g.lineWidth = 2.5; g.stroke();
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(48, 10); g.lineTo(52, 48); g.lineTo(82, 30); g.moveTo(52, 48); g.lineTo(48, 88); g.moveTo(52, 48); g.lineTo(16, 66); g.stroke();
    g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.ellipse(36, 30, 9, 5, -.6, 0, 7); g.fill();
  } else if (art === "xp"){
    const glow = g.createRadialGradient(48, 48, 6, 48, 48, 46);
    glow.addColorStop(0, "rgba(255,230,140,.85)"); glow.addColorStop(1, "rgba(255,200,80,0)");
    g.fillStyle = glow; g.fillRect(0, 0, S, S);
    const st = g.createLinearGradient(20, 16, 76, 84); st.addColorStop(0, "#fff6c8"); st.addColorStop(1, "#e9a23a");
    g.beginPath();
    for (let i=0;i<10;i++){ const a = -1.5708 + i*.6283, rr = i%2 ? 15 : 36; i ? g.lineTo(48+Math.cos(a)*rr, 50+Math.sin(a)*rr) : g.moveTo(48+Math.cos(a)*rr, 50+Math.sin(a)*rr); }
    g.closePath(); g.fillStyle = st; g.fill();
    g.strokeStyle = "rgba(120,70,10,.6)"; g.lineWidth = 2; g.stroke();
  } else if (art === "ehre"){
    /* Medaille: Band, Scheibe, Ring, Stern. */
    g.fillStyle = "#b03a3a"; g.beginPath(); g.moveTo(30, 6); g.lineTo(46, 40); g.lineTo(36, 46); g.lineTo(20, 12); g.closePath(); g.fill();
    g.fillStyle = "#8a2c2c"; g.beginPath(); g.moveTo(66, 6); g.lineTo(50, 40); g.lineTo(60, 46); g.lineTo(76, 12); g.closePath(); g.fill();
    const md = g.createRadialGradient(42, 52, 4, 48, 60, 30); md.addColorStop(0, "#fff0bf"); md.addColorStop(.6, "#e9b063"); md.addColorStop(1, "#8a5a24");
    g.beginPath(); g.arc(48, 60, 27, 0, 7); g.fillStyle = md; g.fill();
    g.strokeStyle = "rgba(90,50,10,.8)"; g.lineWidth = 2.5; g.stroke();
    g.beginPath(); g.arc(48, 60, 19, 0, 7); g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1.5; g.stroke();
    g.beginPath();
    for (let i=0;i<10;i++){ const a = -1.5708 + i*.6283, rr = i%2 ? 5 : 12; i ? g.lineTo(48+Math.cos(a)*rr, 60+Math.sin(a)*rr) : g.moveTo(48+Math.cos(a)*rr, 60+Math.sin(a)*rr); }
    g.closePath(); g.fillStyle = "#6b3f14"; g.fill();
  } else if (art === "boost2" || art === "boost3"){
    const ring = g.createRadialGradient(48, 48, 20, 48, 48, 44);
    ring.addColorStop(0, "rgba(61,220,132,.05)"); ring.addColorStop(.8, "rgba(61,220,132,.35)"); ring.addColorStop(1, "rgba(61,220,132,0)");
    g.fillStyle = ring; g.fillRect(0, 0, S, S);
    g.beginPath(); g.arc(48, 48, 34, 0, 7); g.strokeStyle = "rgba(141,245,189,.9)"; g.lineWidth = 4; g.stroke();
    g.fillStyle = "#c8ffe0"; g.font = "700 40px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.shadowColor = "rgba(61,220,132,.9)"; g.shadowBlur = 12;
    g.fillText("×" + art.slice(-1), 48, 50);
  }
  let url = "";
  try { url = c.toDataURL("image/png"); } catch(_){}
  IKON_CACHE[key] = `<img class="ik" src="${url}" alt="">`;
  return IKON_CACHE[key];
}
/* Was ein Tag zeigt: das Design, solange man es noch nicht hat, sonst
   sein Ore. */
function bonusArt(b){
  if (b.design && !Profile.owned.has(b.design)) return { design: b.design };
  return b;
}
function bonusBild(b){
  const a = bonusArt(b);
  if (a.design) return ikonBild(null, a.design);
  if (a.boost) return ikonBild("boost" + a.boost);
  if (a.xp) return ikonBild("xp");
  if (a.ehre) return ikonBild("ehre");
  return ikonBild("ore");
}
function bonusBildAlt(b){
  const svg = inhalt => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inhalt}</svg>`;
  if (b.boost) return `<em class="bx">×${b.boost}</em>`;
  if (b.xp)    return svg(`<path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 2.8 1.1-6.1L3.2 9.4l6.1-.8z"/>`);
  if (b.ehre)  return svg(`<path d="M6 3h12l-1 8a5 5 0 0 1-10 0z"/><path d="M8 21h8M12 16v5M4 6H2a3 3 0 0 0 3 4M20 6h2a3 3 0 0 1-3 4"/>`);
  return svg(`<path d="M12 3l7 4v10l-7 4-7-4V7z"/><path d="M12 3v18M5 7l7 4 7-4"/>`);
}

function paintBonus(){
  const box = $("bonusBox");
  if (!box) return;
  /* Schritt 96: auch Gäste bekommen die Tagesreihe. Der alte Einwand („ein
     Bonus, den man durch Leeren des Browsers beliebig oft bekommt") gilt
     nicht mehr: Wer den Browser leert, verliert seit Schritt 95 auch das
     Ore. Die Reihe liegt beim Gast im Browser, beim Konto auf dem Server. */
  const gast = !Konto.angemeldet();
  const B = gast ? Gast.bonusStand() : Konto.bonus;
  if (!B){
    box.hidden = true; document.body.classList.remove("bonusoffen"); return;
  }
  /* Schritt 114 (Thomas): der Kasten bleibt aus dem Hangar — der Bonus ist
     nur noch das Bildchen neben dem Spielen-Knopf (`bonusKnopfMalen`). */
  box.hidden = true;

  /* Steht ein Bonus zum Abholen bereit, rückt der Kasten auf schmalen
     Schirmen nach oben (`body.bonusoffen`, siehe Stilblatt). */
  document.body.classList.toggle("bonusoffen", !!B.offen);

  const serie = B.serie || 0;
  /* Die Reihe läuft im Kreis (Schritt 106): nach Tag 7 folgt Tag 1. */
  const naechster = B.offen ? (serie % 7) + 1 : serie;
  const wochen = B.wochen || 0, ziel = B.ziel || 10;
  const reihe = bonusReihe();
  const perlen = (gross) => reihe.map((b, i) => {
    const nr = i + 1;
    const zustand = nr <= serie && !B.offen ? "done"
                  : nr < naechster ? "done"
                  : nr === naechster ? "next" : "";
    const a = bonusArt(b);
    const wert = a.design ? t("b_designkurz") : b.boost ? "" : b.xp ? b.xp + " XP" : b.ehre ? b.ehre : (b.ore || 0);
    return `<i class="bead ${zustand}${a.design ? " design" : ""}" title="${esc(bonusText(b))}">` +
           (gross ? `<small>${nr}</small>` : "") +
           `<span class="bb">${bonusBild(b)}</span>` + (gross ? `<b>${wert}</b>` : "") + `</i>`;
  }).join("");

  /* Klein im Hangar (Thomas, 16.09.2026: „nur noch ein kleines Feld, nicht
     ein Viertel des Bildschirms"): eine Zeile — Titel, Tag, Woche, Perlen
     nur als Bildchen, Knopf. Groß gibt es die Reihe einmal am Tag im
     Fenster `#bonusVeil`. */
  const wochenText = t("b_woche", wochen, ziel);
  box.innerHTML = "";

  const holen = async (knopf) => {
    if (knopf) knopf.disabled = true;
    const e = gast ? Gast.bonusHolen() : await Konto.bonusHolen();
    if (e.ok){
      const b = e.boost ? {boost:e.boost} : e.xp ? {xp:e.xp} : e.ehre ? {ehre:e.ehre} : {ore:e.ore};
      /* Strahlend in der Mitte (Thomas) — statt der kleinen Zeile unten. */
      lohnZeigen(bonusText(b), t("b_got3", e.tag), bonusBild(b));
      if (e.design){
        const d = SKINS.find(k => k.id === e.design);
        Profile.owned.add(e.design);
        setTimeout(() => lohnZeigen(d ? d.label : e.design, t("b_design_da"), ikonBild(null, e.design)), 2300);
      }
      if (e.eis) setTimeout(() => lohnZeigen("Rime", t("b_eis_da"), ikonBild(null, "rime")), e.design ? 4600 : 2300);
      paintPurse(); buildBoost(); buildGrid();
    }
    else toast(t(KONTO_FEHLER[e.fehler] || "e_net"));
    bonusVeilZu();
    paintBonus();
  };
  /* Das Bildchen neben dem Spielen-Knopf: heutige (oder nächste) Belohnung,
     grüner Punkt, solange etwas abzuholen ist; Klick öffnet das Fenster. */
  bonusKnopfMalen(B, reihe[naechster - 1], () =>
    bonusVeilAuf(perlen(true), naechster, reihe[naechster - 1], wochenText, wochen, ziel, holen, !!B.offen));

  /* Einmal am Tag groß (Thomas): beim ersten Öffnen des Hangars mit offenem
     Bonus erscheint das Fenster; danach nur noch die kleine Zeile. */
  const heute = Gast.heute();
  let gezeigt = 0; try { gezeigt = +localStorage.getItem("talumi.bonusGezeigt") || 0; } catch(_){}
  if (B.offen && gezeigt !== heute && !$("startVeil").hidden){
    try { localStorage.setItem("talumi.bonusGezeigt", String(heute)); } catch(_){}
    bonusVeilAuf(perlen(true), naechster, reihe[naechster - 1], wochenText, wochen, ziel, holen, true);
  }
}
function bonusKnopfMalen(B, heute, oeffnen){
  const k = $("bonusKnopf");
  if (!k) return;
  if (!B || !heute){ k.hidden = true; return; }
  k.hidden = false;
  k.classList.toggle("offen", !!B.offen);
  const titel = t("b_title") + (B.offen ? " — " + t("b_holen") : "");
  k.title = titel; k.setAttribute("aria-label", titel);
  k.innerHTML = bonusBild(heute);
  k.onclick = oeffnen;
}

/* Das große Bonusfenster (Schritt 106) — einmal am Tag. */
function bonusVeilAuf(perlen, tag, heute, wochenText, wochen, ziel, holen, offen = true){
  const v = $("bonusVeil");
  if (!v) return;
  /* Schon abgeholt: das Fenster zeigt die Reihe, aber keinen Abholknopf. */
  $("bonusVeilSub").textContent = offen ? t("b_get2", tag, bonusText(heute)) : t("b_next");
  $("bonusVeilBeads").innerHTML = perlen;
  $("bonusVeilWochen").textContent = wochenText;
  /* Ansporn (Schritt 107): die beiden Designs, die es zu holen gibt — mit
     Bild, gemalt wie im Hangar. */
  const ansporn = $("bonusAnsporn");
  if (ansporn){
    const karte = (id, wann) => {
      const d = SKINS.find(k => k.id === id); if (!d) return "";
      const hat = Profile.owned.has(id);
      return `<div class="ziel${hat ? " hat" : ""}">${ikonBild(null, id)}<b>${esc(d.label)}</b>` +
             `<small>${esc(hat ? t("b_besitz") : wann)}</small></div>`;
    };
    ansporn.innerHTML = `<p class="hinweis" style="margin:12px 0 6px">${esc(t("b_ansporn"))}</p>` +
      `<div class="ziele">${karte("sunflare", t("b_nach7"))}${karte("rime", t("b_nach10w", ziel))}</div>`;
  }
  const go = $("bonusVeilGo");
  go.hidden = !offen;
  go.disabled = false;
  go.onclick = () => holen(go);
  $("bonusVeilSpaeter").onclick = bonusVeilZu;
  show("bonusVeil");
}
function bonusVeilZu(){
  const v = $("bonusVeil");
  if (v && !v.hidden) show("startVeil");
}

/* Belohnung strahlend in der Mitte des Schirms (Schritt 106). Kurz, groß,
   von selbst wieder weg — kein Klick nötig. */
let lohnWecker = 0;
function lohnZeigen(text, unter, bild){
  const el = $("lohnGlanz");
  if (!el) return;
  $("lohnText").textContent = text;
  $("lohnSub").textContent = unter || "";
  $("lohnBild").innerHTML = bild || "";
  el.hidden = false;
  el.classList.remove("an"); void el.offsetWidth; el.classList.add("an");
  try { Sound.levelUp(); } catch(_){}
  clearTimeout(lohnWecker);
  lohnWecker = setTimeout(() => { el.hidden = true; el.classList.remove("an"); }, 2200);
}

function buildRecords(){
  const box = $("recBox");
  if (!box) return;
  const R = Profile.rec;
  if (!R.runs){
    box.innerHTML = `<h2>${t("rec")}</h2><p class="recline">${t("rec_none")}</p>`;
    return;
  }
  const zeit = R.time >= 60
    ? Math.floor(R.time/60) + ":" + String(R.time%60).padStart(2,"0")
    : R.time + "s";
  const zeilen = [
    [t("rec_mass"),  R.mass.toLocaleString(lang)],
    [t("rec_kills"), R.kills],
    [t("rec_time"),  zeit],
    [t("rec_runs"),  R.runs]
  ];
  if (R.royale) zeilen.splice(3, 0, [t("rec_royale"), R.royale]);
  if (R.clan)   zeilen.splice(3, 0, [t("rec_clan"), R.clan]);
  box.innerHTML = `<h2>${t("rec")}</h2>` + zeilen.map(([a,b]) =>
    `<div class="recline"><span>${a}</span><b>${b}</b></div>`).join("");
}

/* Wo der Startbonus wirken kann, entscheidet sich daran, wo das Ore liegt:
   Bei einem Konto liegt es auf dem Server, also nur im Onlinebetrieb — dort
   bucht der Server beim Beitritt ab. Ohne Konto liegt es im Browser, also nur
   auf der lokalen offenen Karte; online wüsste der Server nichts davon. */
/* `Konto` wird erst weiter unten in der Datei angelegt. `buildBoost()` läuft
   aber schon beim Aufbau des Menüs, also vorher — und ein `const` vor seiner
   Zeile anzufassen wirft. Zu diesem Zeitpunkt ist niemand angemeldet, genau
   das gibt die Klammer zurück. */
function istAngemeldet(){
  try { return Konto.angemeldet(); } catch(_){ return false; }
}

/* Startbonus nur im freien Raum. Die gespiegelten Arenen sind ausdrücklich
   als faire Karten gebaut — ein Startvorteil dort wäre ein Widerspruch.
   Seit der Zusammenlegung ist das genau ein Modus, für Gäste wie für Konten:
   Angemeldet bucht der Server beim Beitritt ab, im lokalen Rückfall der
   Client. */
function boostErlaubt(){
  return modeId === "online";
}

function buildBoost(){
  const box = $("boostPick");
  if (!box) return;
  box.innerHTML = "";
  const erlaubt = boostErlaubt();
  /* Eine gewählte Stufe zurücksetzen, die hier nicht wirkt. Sonst steht im
     Menü ein bezahlter Bonus, der niemals abgebucht wird — genau die Art
     Unstimmigkeit, die sich beim Spielen als „irgendwas stimmt nicht" zeigt. */
  if (!erlaubt) Profile.boost = 1;
  for (const f of [1,2,3]){
    const b = document.createElement("button");
    b.type = "button";
    /* Zwei Zeilen im Knopf statt einer langen: Faktor oben, Preis darunter.
       In einer 215 Punkte breiten Spalte brachen die drei Knöpfe sonst auf
       zwei Reihen um — gemessen 93 Punkte Höhe statt 44, und genau die
       fehlten auf einem Telefon im Querformat. Gelesen wird dasselbe, es
       steht nur übereinander. */
    if (f === 1){
      b.textContent = t("boostoff");
    } else {
      const oben = document.createElement("b");
      oben.textContent = "×" + f;
      const unten = document.createElement("small");
      /* Ein Gutschein aus dem Tagesbonus macht genau diese Stufe einmal
         umsonst — das steht dann statt des Preises da. */
      const gutschein = istAngemeldet() ? (Konto.profil.gutschein || 0) : Gast.gutschein;
      unten.textContent = gutschein === f ? t("b_gratis") : BOOST_COST[f].toLocaleString(lang) + " Ore";
      if (gutschein === f) b.classList.add("gratis");
      b.append(oben, unten);
    }
    b.setAttribute("aria-pressed", String(Profile.boost === f));
    b.disabled = !erlaubt && f > 1;
    b.addEventListener("click", () => { Profile.boost = f; buildBoost(); });
    box.appendChild(b);
  }
  const notiz = $("boostNote");
  notiz.textContent =
    erlaubt                ? t("boostnote")
    : istAngemeldet()      ? t("practiceacct")
    : modeId === "online"  ? t("boostacct")
                           : t("boostonly");
  /* Sichtbar nur, wenn er etwas erklärt: Entweder wirkt der Bonus hier
     nicht — dann muss man wissen, warum — oder es ist einer gewählt, und
     dann gehört der Hinweis dazu, was er kostet. Bei „Aus" und erlaubtem
     Bonus schweigt er; genau so steht es im Entwurf. */
  notiz.hidden = erlaubt && Profile.boost === 1;
}

/* Fünf Kacheln wie im Entwurf: die freigeschalteten Designs zuerst (das
   gewählte ist immer dabei), dann die nächsten noch gesperrten, gedimmt mit
   ihrer Bedingung — so sieht man, was als Nächstes kommt. Ein Tipp auf eine
   gesperrte Kachel führt in den Reiter „Designs" zu genau diesem Design. */
const STRIP_KACHELN = 5;

function buildStrip(){
  const strip = $("strip");
  if (!strip) return;
  strip.innerHTML = "";
  const frei = SKINS.filter(s => Profile.owned.has(s.id));
  const zu   = SKINS.filter(s => !Profile.owned.has(s.id));
  let wahl = frei.slice(0, STRIP_KACHELN);
  if (!wahl.some(s => s.id === skin.id) && Profile.owned.has(skin.id)) wahl = [skin, ...wahl.slice(0, STRIP_KACHELN - 1)];
  const reihe = wahl.map(s => ({ s, offen: true }))
    .concat(zu.slice(0, Math.max(0, STRIP_KACHELN - wahl.length)).map(s => ({ s, offen: false })));
  for (const { s, offen } of reihe){
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-pressed", String(offen && skin.id === s.id));
    if (!offen) b.className = "zu";
    b.title = offen ? s.label : Profile.requirement(s);
    const c = document.createElement("canvas");
    b.appendChild(c);
    preview(c, s);
    const nm = document.createElement("span");
    nm.className = "nm"; nm.textContent = offen ? s.label : Profile.requirement(s);
    b.appendChild(nm);
    b.addEventListener("click", () => {
      if (offen){
        /* Wie `pick()`: merken, sonst ist die Wahl nach dem Neuladen weg. */
        skin = s; Profile.skin = s.id; Gast.sichern();
        if (Konto.angemeldet()) Konto.einstellen({ skin: s.id });
        buildStrip(); heldMalen();
      }
      else { reiter("haut"); pick(s); }
    });
    strip.appendChild(b);
    /* Nur den Streifen selbst schieben, nicht die Seite. `scrollIntoView`
       scrollt jeden Vorfahren mit — auf einem Telefon landete man dadurch
       mitten im Fenster statt oben, ohne je gescrollt zu haben. */
    if (offen && skin.id === s.id) setTimeout(() => {
      strip.scrollLeft = b.offsetLeft - (strip.clientWidth - b.offsetWidth)/2;
    }, 0);
  }
  const more = document.createElement("button");
  more.type = "button";
  /* Die Klasse gehört auf die Schaltfläche, nicht auf den Text darin: Die
     Schaltfläche schneidet mit `overflow:hidden` ab. Stand die Klasse auf
     dem inneren `span`, ragte der Text aus seiner eigenen Schaltfläche heraus
     und wurde abgeschnitten: sichtbar als „all skin:" statt „all skins". */
  more.className = "more";
  more.title = t("skincount", Profile.owned.size, SKINS_ZAHL);
  more.innerHTML = `<span>${t("k_all")}<b>${SKINS_ZAHL} →</b></span>`;
  more.addEventListener("click", () => reiter("haut"));
  strip.appendChild(more);
}

function buildGrid(){
  const grid = $("grid");
  grid.innerHTML = "";
  $("shopCount").textContent = t("ownedcount", Profile.owned.size, SKINS_ZAHL);
  $("shopNext").textContent = nextUnlock();
  for (const s of SKINS){
    const st = Profile.state(s);
    const b = document.createElement("button");
    b.className = "tile"; b.type = "button";
    b.dataset.state = st;
    b.setAttribute("aria-pressed", String(skin.id === s.id));
    const c = document.createElement("canvas");
    b.appendChild(c);
    preview(c, s);
    const nm = document.createElement("span");
    nm.className = "nm";
    nm.innerHTML = esc(s.label) + ` <i>${ROMAN[s.tier]}</i>`;
    const rq = document.createElement("span");
    rq.className = "rq"; rq.textContent = Profile.requirement(s);
    b.appendChild(nm); b.appendChild(rq);
    b.addEventListener("click", () => pick(s));
    grid.appendChild(b);
  }
}
function note(text, kind){
  const n = $("shopNote");
  n.textContent = text;
  n.className = "notice" + (kind ? " " + kind : "");
}
async function pick(s){
  if (Profile.owned.has(s.id)){
    kaufLeisteAus();
    skin = s; Profile.skin = s.id;
    Gast.sichern();
    buildGrid();
    note(t("selected", s.label), "good");
    /* Bei einem Konto gehört die Wahl auf den Server. Ohne diesen Aufruf wäre
       sie nur eine Anzeige und nach dem Neuladen wieder verschwunden. */
    if (Konto.angemeldet()) Konto.einstellen({skin: s.id});
    return;
  }
  if (s.sonder){
    kaufLeisteAus();
    note(t("sk_" + s.sonder + "_note"), "warn");
    return;
  }
  if (s.lv){
    kaufLeisteAus();
    note(t("needlevel", s.label, s.lv), "warn");
    return;
  }
  /* Nicht mehr sofort kaufen: Erst zeigen, was sie kostet — für Ore und, wo
     es geht, für Geld. Vorher reichte ein versehentlicher Tipp, um eine
     Million Ore auszugeben. */
  kaufZeigen(s);
}

async function kaufMitOre(s){
  if (Profile.ore < s.ore){
    note(t("needore", s.label, s.ore.toLocaleString(lang)), "warn");
    return;
  }

  /* Angemeldet kauft der Server. Der Client darf sein Guthaben nicht selbst
     senken und seine Besitzliste nicht selbst erweitern — beides käme beim
     nächsten Neuladen vom Server zurück, und zwar unverändert. */
  if (Konto.angemeldet()){
    if (Konto.laeuft) return;
    Konto.laeuft = true;
    note(t("k_wait"));
    const e = await Konto.kaufen(s.id);
    Konto.laeuft = false;
    if (e.ok){
      skin = SKINS.find(x => x.id === Profile.skin) || s;
      paintPurse(); buildGrid(); kaufLeisteAus();
      note(t("bought", s.label, s.ore.toLocaleString(lang)), "good");
    } else if (e.fehler === "zu_wenig_ore"){
      paintPurse();
      note(t("needore", s.label, s.ore.toLocaleString(lang)), "warn");
    } else {
      note(t(e.fehler === "netz" ? "k_offline" : "k_buyfail"), "warn");
    }
    return;
  }

  if (Profile.buy(s)){
    skin = s; Profile.skin = s.id;
    Gast.sichern();
    paintPurse(); buildGrid(); kaufLeisteAus();
    note(t("bought", s.label, s.ore.toLocaleString(lang)), "good");
  }
}

/* Käufe mit echtem Geld gab es hier bis Schritt 100 (Designs über Paddle).
   Zurückgebaut am 16.09.2026, weil Thomas Ore verkaufen will und Paddle das
   verbietet. Der nächste Anbieter kommt nach seiner Entscheidung; bis dahin
   gibt es im Laden nur Ore-Käufe. Alter Stand: Commit 0cefc66. */

let kaufGewaehlt = null;      // Design in der Kaufleiste

/* Sieht der Spieler den Laden gerade? Früher war das „ist der Bildschirm
   sichtbar", jetzt „ist der Reiter vorn und der Startbildschirm offen". */
function ladenOffen(){
  return !$("startVeil").hidden && reiterJetzt === "haut";
}

function ladenOeffnen(){
  kaufLeisteAus();
  if ($("startVeil").hidden) show("startVeil");
  reiter("haut");
}

function kaufLeisteAus(){
  kaufGewaehlt = null;
  $("kaufLeiste").hidden = true;
}

function kaufZeigen(s){
  kaufGewaehlt = s;
  $("kaufLeiste").hidden = false;
  $("kaufText").textContent = t("kauf_wahl", s.label, s.ore.toLocaleString(lang));

  const ore = $("kaufOre");
  ore.textContent = t("kauf_ore", s.ore.toLocaleString(lang));
  ore.disabled = Profile.ore < s.ore;
  note(ore.disabled ? t("needore", s.label, s.ore.toLocaleString(lang)) : t("shoppick"),
       ore.disabled ? "warn" : "");

  $("kaufHinweis").textContent = "";
}

$("kaufOre").addEventListener("click", () => { if (kaufGewaehlt) kaufMitOre(kaufGewaehlt); });

(function buildLangPick(){
  const box = $("langPick");
  if (!box) return;
  const draw = () => {
    box.innerHTML = "";
    for (const code of Object.keys(LANGNAMES)){
      const b = document.createElement("button");
      b.type = "button";
      /* Beide Formen stehen im Knopf: der volle Name und das Kürzel. Welche
         zu sehen ist, entscheidet die Bildschirmhöhe — auf einem Telefon im
         Querformat kosteten sieben ausgeschriebene Sprachnamen eine ganze
         Zeile Höhe, und die fehlte unten beim Knopf „Als Gast spielen".
         Ausgeblendet wird nur die Anzeige; vorgelesen wird immer der volle
         Name (`aria-label`). */
      const voll = document.createElement("span");
      voll.className = "voll"; voll.textContent = LANGNAMES[code];
      const kurz = document.createElement("span");
      kurz.className = "kurz"; kurz.textContent = code.toUpperCase();
      b.append(voll, kurz);
      b.setAttribute("aria-label", LANGNAMES[code]);
      b.setAttribute("aria-pressed", String(code === lang));
      b.addEventListener("click", () => { lang = code; applyLang(); draw(); });
      box.appendChild(b);
    }
  };
  box.draw = draw; draw();
})();

$("guestBtn").addEventListener("click", () => { paintPurse(); buildGrid(); show("startVeil"); });
/* Auf Spieleportalen gleich ins Menü (Schritt 95). Dort will niemand vor
   der ersten Runde ein Formular sehen, und die Portale werten die Zeit bis
   zum ersten Spiel. Anmelden bleibt über die Einstellungen erreichbar. */
if (Portal.name) setTimeout(() => { paintPurse(); buildGrid(); show("startVeil"); }, 0);
/* Wiederkehrende Gäste ebenso (Schritt 101). Wer hier schon eine Runde
   gespielt hat und kein Konto gemerkt hat, will nicht bei jedem Besuch erst
   das Anmeldeformular wegklicken — Poki und CrazyGames zählen die Klicks bis
   zum Spiel, und „höchstens einer" ist ihre Vorgabe. Der Anmeldebildschirm
   bleibt für Erstbesucher (und für Suchmaschinen, die keinen Gaststand
   haben); Anmelden bleibt über die Einstellungen erreichbar. Kommt jemand
   über einen Link aus einer Mail (Anker), geht der vor. */
else setTimeout(() => {
  if (location.hash || Konto.gemerkt() || !((Profile.rec && Profile.rec.runs) > 0)) return;
  paintPurse(); buildGrid(); show("startVeil");
}, 0);

/* ---- Anmeldung ----------------------------------------------------
   Ein Formular für beides. `anlegen` schaltet zwischen Anmelden und
   Registrieren um; der Unterschied ist ein zusätzliches Namensfeld und ein
   anderer Endpunkt. Zwei getrennte Formulare wären doppelte Pflege für
   denselben Vorgang.
   ------------------------------------------------------------------- */

let anlegen = false;

/* Die Fehlermeldungen des Servers sind Schlüssel, keine Sätze — sonst käme
   der Text in einer Sprache zurück, die der Spieler nicht gewählt hat. */
const KONTO_FEHLER = {
  kein_kampf: "e_kein_kampf", kampf_zu: "e_kampf_zu", clan_unbekannt: "e_clan_unbekannt",
  kampf_selbst: "e_kampf_selbst", kampf_laeuft: "e_kampf_laeuft", kampf_offen: "e_kampf_offen",
  kampf_unbekannt: "e_kampf_unbekannt",
  email_ungueltig: "e_email",
  passwort_kurz:   "e_pwshort",
  email_vergeben:  "e_taken",
  zugangsdaten:    "e_login",
  zu_viele_versuche: "e_many",
  name_ungueltig:  "e_name",
  gesperrt:        "e_blocked",
  land_gesperrt:   "e_land",
  name_gesperrt:   "e_name_gesperrt",
  clan_name_ungueltig: "e_cl_name",
  clan_tag_ungueltig:  "e_cl_tag",
  clan_name_vergeben:  "e_cl_name_vergeben",
  clan_tag_vergeben:   "e_cl_tag_vergeben",
  schon_im_clan:       "e_schon_im_clan",
  kein_clan:           "e_kein_clan",
  clan_voll:           "e_clan_voll",
  clan_geschlossen:    "e_clan_geschlossen",
  nicht_leiter:        "e_nicht_leiter",
  clan_unbekannt:      "e_clan_unbekannt",
  konto_unbekannt:     "e_konto_unbekannt",
  selbst:              "e_selbst",
  netz:            "e_net"
};

function kontoMeldung(text, art){
  const n = $("acctNote");
  n.textContent = text || "";
  n.className = "notice" + (art ? " " + art : "");
}

function kontoFormZeichnen(){
  $("acctNameRow").hidden = !anlegen;
  { const cr = $("acctCodeRow"); if (cr){ cr.hidden = !anlegen; const f = $("acctCode"); if (f && !f.value) f.value = Werben.gemerkt(); } }
  $("acctPwHint").hidden = !anlegen;
  if ($("acctPw2Row")){ $("acctPw2Row").hidden = !anlegen; if (!anlegen) $("acctPw2").value = ""; }
  $("acctGo").textContent = t(anlegen ? "k_signup" : "k_signin");
  $("acctSwap").textContent = t(anlegen ? "k_have" : "k_new");
  $("acctPw").autocomplete = anlegen ? "new-password" : "current-password";
  kontoMeldung("");
}

$("acctSwap").addEventListener("click", () => { anlegen = !anlegen; kontoFormZeichnen(); });

$("acctForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (Konto.laeuft) return;
  const email = $("acctMail").value.trim();
  const pw    = $("acctPw").value;
  const name  = $("acctName").value.trim();

  /* Was sich hier prüfen lässt, wird hier geprüft — das spart dem Spieler
     die Wartezeit auf eine Antwort, die ohnehin absehbar ist. Verbindlich
     prüft trotzdem der Server; diese Prüfung ist Bequemlichkeit, kein Schutz. */
  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email))
    return kontoMeldung(t("e_email"), "warn");
  if (anlegen && pw.length < 8) return kontoMeldung(t("e_pwshort"), "warn");
  if (anlegen && $("acctPw2") && $("acctPw2").value !== pw)
    return kontoMeldung(t("e_pwmatch"), "warn");
  if (anlegen && !name)         return kontoMeldung(t("e_name"), "warn");

  Konto.laeuft = true;
  $("acctGo").disabled = true;
  kontoMeldung(t("k_wait"));
  const e2 = anlegen ? await Konto.registrieren(email, pw, name)
                     : await Konto.anmelden(email, pw);
  Konto.laeuft = false;
  $("acctGo").disabled = false;

  if (e2.fehler) return kontoMeldung(t(KONTO_FEHLER[e2.fehler] || "e_net"), "warn");

  $("acctPw").value = "";
  if ($("acctPw2")) $("acctPw2").value = "";
  nachAnmeldung();
});

/* Nach erfolgreicher Anmeldung: Anzeige auffrischen und ins Menü. Der
   Anmeldebonus wird nicht von allein abgeholt — er soll ein sichtbarer
   Knopf sein, keine Zahl, die unbemerkt hochspringt. */
function nachAnmeldung(){
  paintPurse(); buildGrid(); buildRecords(); paintBonus(); paintRank();
  show("startVeil");
  toast(t("k_hello", Konto.profil ? Konto.profil.name : ""));
}

/* Anmeldung über Google und Facebook (Schritt 88).

   Kein fremdes Skript: Der Knopf schickt den Browser an **unseren** Server,
   der leitet zum Anbieter weiter und nimmt den Rückweg entgegen. Vor dem
   Klick geht damit an Google und Meta gar nichts — auch keine IP-Adresse.
   Der ganze Ablauf steht in `oauth.js` auf dem Server.

   Welche Knöpfe überhaupt erscheinen, sagt `/health`. Ist bei einem Anbieter
   nichts eingerichtet, bleibt sein Knopf weg statt abgeschaltet dazustehen. */
const FREMD_KNOPF = { google: "googleBtn", facebook: "facebookBtn" };

function fremdKnoepfeZeigen(){
  /* Auf Portalen läuft das Spiel in einem eingebetteten Fenster; Google und
     Facebook verweigern ihre Anmeldeseite dort. Ein Knopf, der sicher
     scheitert, bleibt weg. */
  const liste = (Array.isArray(Konto.oauth) && !Portal.name) ? Konto.oauth : [];
  let eins = false;
  for (const a in FREMD_KNOPF){
    const el = $(FREMD_KNOPF[a]);
    if (!el) continue;
    const an = liste.includes(a);
    el.hidden = !an;
    if (an) eins = true;
  }
  const streifen = $("anmFremd");
  if (streifen) streifen.hidden = !eins;
}

function fremdAnmelden(anbieter){
  /* Die eigene Adresse geht als Ziel mit — der Server prüft sie gegen seine
     Herkunftsliste und leitet nur dorthin zurück. Anker und Abfrage bleiben
     weg, sonst käme eine halbe Adresse zurück. */
  const ziel = location.origin + location.pathname;
  const u = kontoBasis() + "/konto/oauth/" + anbieter +
            "?ziel=" + encodeURIComponent(ziel) + "&sprache=" + encodeURIComponent(lang);
  kontoMeldung(t("k_wait"));
  /* Merker für den Rückweg (Schritt 96): Nur ein Tab, der die Anmeldung
     selbst begonnen hat, nimmt ein `#tok=` an. Sonst könnte ein fremder Link
     mit dem Token eines fremden Kontos jemanden unbemerkt dort anmelden —
     und alles, was er dann spielt oder kauft, landete in diesem Konto. */
  try { sessionStorage.setItem("talumi.oauth", String(Date.now())); } catch(_){}
  location.href = u;
}

for (const a in FREMD_KNOPF){
  const el = $(FREMD_KNOPF[a]);
  if (el) el.addEventListener("click", () => fremdAnmelden(a));
}
$("endShop").addEventListener("click", ladenOeffnen);

/* ---- Problem melden (17.09.2026) -------------------------------------
   Ein Fenster, eine Nachricht, ein Versand. Der Server leitet sie als Mail
   weiter und speichert nichts. Was hier mitgeht (Name, Runde, Fassung), ist
   für den Server eine Behauptung — er benennt Konten selbst aus der Sitzung. */
let meldeZurueck = "startVeil", meldeArtJetzt = "fehler", meldeRunde = "";
function meldeOeffnen(){
  const offen = VEILS.map(id => $(id)).find(v => v && !v.hidden);
  meldeZurueck = offen && offen.id !== "meldeVeil" ? offen.id : "startVeil";
  /* Was über die Runde bekannt ist — hilft beim Nachstellen eines Fehlers. */
  try {
    meldeRunde = meldeZurueck === "endVeil"
      ? [modeId, ($("endText") && $("endText").textContent || "").slice(0, 120)].join(" · ")
      : "aus dem Menü";
  } catch(_){ meldeRunde = ""; }
  const box = $("meldeArt"); box.innerHTML = "";
  for (const a of ["fehler", "spieler", "idee", "sonstiges"]){
    const b = document.createElement("button");
    b.type = "button"; b.textContent = t("md_a_" + a);
    b.setAttribute("aria-pressed", a === meldeArtJetzt ? "true" : "false");
    b.addEventListener("click", () => { meldeArtJetzt = a; for (const x of box.children) x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    box.appendChild(b);
  }
  try { fassungZeigen(); } catch(_){}
  $("meldeNote").textContent = ""; $("meldeSenden").disabled = false;
  show("meldeVeil");
}
for (const id of ["endMelden", "setMelden"]) if ($(id)) $(id).addEventListener("click", meldeOeffnen);
$("meldeZu").addEventListener("click", () => show(meldeZurueck));
$("meldeSenden").addEventListener("click", async () => {
  const text = $("meldeText").value.trim(), email = $("meldeMail").value.trim(), note = $("meldeNote");
  if (text.length < 10){ note.textContent = t("md_kurz"); return; }
  if (email && !/^[^ @]+@[^ @]+[.][A-Za-z]{2,}$/.test(email)){ note.textContent = t("md_mailfalsch"); return; }
  const knopf = $("meldeSenden"); knopf.disabled = true; note.textContent = "…";
  const a = await Konto.ruf("/konto/melden", { text, email, art: meldeArtJetzt, name: spielerName() || "",
                                               runde: meldeRunde, fassung: fassungText || "", sprache: lang });
  if (a && a.ok){
    $("meldeText").value = ""; note.textContent = t("md_danke");
    setTimeout(() => { if (!$("meldeVeil").hidden) show(meldeZurueck); }, 1600);
  } else {
    knopf.disabled = false;
    note.textContent = a && a.status === 429 ? t("md_oft") : a && a.fehler === "zu_kurz" ? t("md_kurz")
                     : a && a.fehler === "email_ungueltig" ? t("md_mailfalsch") : t("md_fehl");
  }
});
$("endMenu").addEventListener("click", () => { paintPurse(); show("startVeil"); reiter("start"); });

/* Die Reiterleiste. Ein Klick wechselt den Inhalt des Fensters — niemand
   verlässt dabei den Startbildschirm, und es gibt nichts zu schließen. */
for (const b of document.querySelectorAll("#konsReiter button[data-reiter]"))
  b.addEventListener("click", () => reiter(b.dataset.reiter));
/* „Zurück" führt dorthin, woher man kam: vom Anmeldebildschirm dorthin, aus
   den Einstellungen (dort steht der Knopf seit dem 17.09.2026) zurück in die
   Einstellungen. Vorher hing das an `Game.name` — das ist im Hangar leer,
   und ein Gast landete nach „Rechtliches" auf dem Anmeldebildschirm. */
let legalZurueck = "accountVeil";
$("legalBtn").addEventListener("click", () => { legalZurueck = "accountVeil"; show("legalVeil"); });
$("legalBtn2").addEventListener("click", () => { legalZurueck = "setVeil"; show("legalVeil"); });
$("legalClose").addEventListener("click", () => show(legalZurueck));
/* Sofort weiter: Kein Umweg über den Startbildschirm, gleicher Modus,
   gleicher Name. Reibung nach dem Tod ist der häufigste Abbruchgrund. */
/* Schritt 95: „Nochmal spielen" rief im Onlinemodus `start()` direkt auf.
   Die Verbindung hatte `finish()` aber gerade getrennt (`Net.leave()`) —
   die neue Runde begann ohne Server und endete nach einem Bild mit
   „Verbindung verloren". Jeder zweite Versuch eines Spielers scheiterte so,
   vom Tag der Serveranbindung an. Jetzt nimmt „Nochmal" denselben Weg wie
   der Startknopf, und die Taste auf dem Ergebnisbildschirm auch (die ging
   bisher zusätzlich an der Werbepause vorbei). */
function nochmal(){
  const knopf = $("again");
  if (knopf.disabled) return;
  Sound.unlock();
  Portal.breakBefore(() => {
    ersatz = false;
    if (MODES[modeId] && MODES[modeId].online) verbindenDannStarten(Game.name, knopf);
    else start(Game.name);
  });
}
$("again").addEventListener("click", nochmal);
addEventListener("keydown", e => {
  if ($("endVeil").hidden) return;
  if (e.target && e.target.closest && e.target.closest("button,input,a") && e.target.id !== "again") return;
  if (e.code === "Enter" || e.code === "Space"){ e.preventDefault(); nochmal(); }
});

/* Eingaben sofort säubern, damit niemand einen untippbaren Namen wählt */
function guardName(input, note){
  if (!input) return;
  input.addEventListener("input", () => {
    const before = input.value, after = cleanName(before);
    if (after !== before){
      input.value = after;
      if (note) $(note).textContent =
        t("namefix");
    }
  });
}
setTimeout(() => { if (!Konto.gemerkt()) Gast.nameEinsetzen(); }, 0);
guardName($("friendName"));

$("friendsBtn").addEventListener("click", () => {
  buildFriends(); friendNote(""); show("friendsVeil");
});
if ($("clanBtn")){
  $("clanBtn").addEventListener("click", () => { clanMeldung(""); show("clanVeil"); clanZeichnen(); });
  $("clanClose").addEventListener("click", () => show("startVeil"));
}
$("friendsClose").addEventListener("click", () => show("startVeil"));
$("friendAdd").addEventListener("click", addFriend);
$("friendName").addEventListener("keydown", e => { if (e.key === "Enter") addFriend(); });
$("friendsHelp").addEventListener("click", () => {
  const p = $("friendsInfo"); p.hidden = !p.hidden;
});
buildModes();

Portal.loadingStart();
const startBtn = $("startBtn");
entryProof("talumi-" + Date.now(), 17, n => {
  const pw = $("powText");
  pw.dataset.i18n = "powdone";
  pw.textContent = t("powdone");
  Portal.loadingStop();
  startBtn.disabled = false;
  // Der Schlüssel muss mitwandern: Sonst setzt der nächste applyLang() den
  // Knopf aus data-i18n zurück auf „Formiert sich …" — auf schnellen Rechnern
  // ist der Nachweis schon fertig, bevor die Sprache überhaupt feststeht.
  startBtn.dataset.i18n = "start";
  startBtn.textContent = t("start");
});
/* Erst verbinden, dann starten. Eine Runde zu beginnen und die Verbindung
   danach scheitern zu lassen, hieße: der Spieler steht in einer leeren Welt
   und weiß nicht, warum. Scheitert es, wird offline gegen KI weitergespielt —
   ein Fehlschlag darf nicht in einem toten Bildschirm enden. */
function verbindenDannStarten(name, knopf){
  const btn = knopf || $("startBtn");
  const vorher = btn.dataset.i18n || "start";
  btn.disabled = true;
  btn.dataset.i18n = "net_dial";
  btn.textContent = t("net_dial");
  Game.name = cleanName(name) || t("unnamed");
  Net.join({name: Game.name, skin: skin.id, bonus: Profile.boost});

  const frist = jetzt() + 6;            // sechs Sekunden Geduld, dann offline
  (function warten(){
    const fertig = () => {
      btn.disabled = false;
      btn.dataset.i18n = vorher;
      btn.textContent = t(vorher);
    };
    if (Net.lage === "verbunden"){ fertig(); start(name); return; }
    if (Net.lage === "abgelehnt" || (modeId === "clan" && (Net.lage === "fehler" || jetzt() > frist))){
      const grund = Net.lage === "abgelehnt" ? Net.grund : "";
      Net.leave(); fertig();
      modeId = "liga"; buildModes(); buildBoost();
      toast(t(KONTO_FEHLER[grund] || "net_fail"));
      Konto.kampfPruefen();
      return;
    }
    if (Net.lage === "fehler" || jetzt() > frist){
      Net.leave();
      fertig();
      /* Rückfall auf die lokale Fassung desselben Modus. Die Auswahl im Menü
         bleibt stehen: Beim nächsten Start wird wieder der Server versucht. */
      ersatz = true;
      start(name);
      toast(t("net_fail"));
      return;
    }
    setTimeout(warten, 100);
  })();
}

startBtn.addEventListener("click", () => {
  Sound.unlock();                       // Nutzergeste: erst hier darf Ton starten
  const name = spielerName().trim().slice(0,14);
  if (!Konto.angemeldet()) Gast.sichern();
  /* Jede Runde beginnt mit dem Versuch, online zu spielen. Erst wenn das
     scheitert, setzt `verbindenDannStarten` den Rückfall. */
  ersatz = false;
  if (MODES[modeId] && MODES[modeId].online) verbindenDannStarten(name);
  else start(name);
});
$("settingsBtn").addEventListener("click", () => { buildSettings(); show("setVeil"); });
$("setClose").addEventListener("click", () => show("startVeil"));
/* Browser lassen Ton erst nach einer Nutzergeste zu. Bisher geschah das erst
   beim Klick auf „Starten" — dann wäre die Musik im Menü nie zu hören
   gewesen, obwohl sie genau dort hingehört. Deshalb einmalig auf die erste
   beliebige Geste hören. */
(function ersteGeste(){
  const wecken = () => {
    document.removeEventListener("pointerdown", wecken);
    document.removeEventListener("keydown", wecken);
    try { Sound.unlock(); Musik.nachziehen(); } catch(_){}
  };
  document.addEventListener("pointerdown", wecken, {once:false});
  document.addEventListener("keydown", wecken, {once:false});
})();

/* Gespeicherte Einstellungen gelten, bevor irgendetwas gezeichnet wird —
   sonst blitzt kurz das falsche Thema auf. */
einstellungenLaden();

/* Bedienung des Einwilligungskastens. */
(function einwilligungVerdrahten(){
  const k = (id, fn) => { const b = $(id); if (b) b.addEventListener("click", fn); };
  k("ckJa",   () => Einwilligung.setzen(true, true));
  k("ckNein", () => Einwilligung.setzen(false, false));
  k("ckFein", () => {
    $("cookieFein").hidden = false;
    $("ckSpeichern").hidden = false;
    $("ckFein").hidden = true;
    Einwilligung.platzMessen();   // die Feineinstellung macht den Kasten höher
  });
  k("ckSpeichern", () => Einwilligung.setzen(
    $("ckWerbung") && $("ckWerbung").checked,
    $("ckMessung") && $("ckMessung").checked));
})();

/* Vor allem anderen: Ohne gespeicherte Zustimmung darf nichts Fremdes laden. */
Einwilligung.start();

lang = pickLang();
applyTheme();
STICK_MAX = Settings.sens;
document.body.classList.toggle("lefty", Settings.lefty);
Sound.on = Settings.volume > 0;
applyLang();
paintIntegrity(); paintPurse();
kontoFormZeichnen();

/* =====================================================================
   6b) APP-BETRIEB
   Vollbild und Querformatsperre brauchen eine Nutzergeste, deshalb laufen
   sie erst beim Spielstart. Beides ist optional: schlägt es fehl, spielt
   sich alles unverändert weiter, nur mit Browserleisten am Rand.
   ===================================================================== */
async function goImmersive(){
  if (!isTouch) return;
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen)
      await document.documentElement.requestFullscreen({navigationUI:"hide"});
  } catch (_) {}
  /* Querformat-Sperre — Schritt 103 hatte sie aufgehoben (hochkant
     spielbar), Thomas am 16.09.2026 abends: „Nimm das Spiel im Hochformat
     bitte wieder raus. Das ist nicht gut." Seitdem wieder wie vor v84. */
  try {
    if (screen.orientation && screen.orientation.lock)
      await screen.orientation.lock("landscape");
  } catch (_) {}   // iOS Safari kennt die Sperre nicht — dafür der Drehhinweis
  setTimeout(resize, 200);
}

/* Service Worker registrieren. Er hält das Spiel offline lauffähig und holt
   sich beim Start immer die neueste Fassung vom Server: einmal hochladen,
   und beim nächsten Öffnen ist die neue Version auf dem Handy. */
if ("serviceWorker" in navigator && !Portal.name){
  addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then(reg => {
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        sw && sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller)
            showUpdateHint();
        });
      });
    }).catch(() => {});
  });
}
function showUpdateHint(){
  const n = $("accountNote");
  if (!n) return;
  n.textContent = "A new version is ready. Close and reopen the app to load it.";
  n.className = "notice good";
}


/* =====================================================================
   7) NET — Onlinebetrieb

   Der Server ist die Wahrheit. Er rechnet zwanzigmal je Sekunde und
   schickt jedem Client nur dessen Ausschnitt; der Client schickt nur
   Blickrichtung und Aktionen. Das Protokoll steht in der Server-README.

   Hier liegen zwei Aufgaben, und beide sind nötig:

   1) ZWISCHENBERECHNUNG für alles Fremde. Zwanzig Zustände je Sekunde
      gegen sechzig Bilder heißt ohne Zwischenwerte: jede fremde Zelle
      ruckelt sichtbar. Deshalb wird absichtlich um NET_DELAY verzögert
      gezeichnet. Dann liegt zu jedem gezeichneten Zeitpunkt schon ein
      späterer Zustand vor, und es lässt sich zwischen zwei echten
      Zuständen rechnen statt über den letzten hinaus zu raten.

   2) VORAUSBERECHNUNG für die eigenen Zellen. Auf das Netz zu warten
      hieße, die eigene Maus verzögert zu sehen — das ist in einem Spiel
      dieser Art das Erste, was auffällt. Die eigene Bewegung läuft
      deshalb sofort, mit derselben Formel wie auf dem Server
      (moveOwnCells). Der Serverzustand korrigiert nur, und umso härter,
      je größer der Fehler ist.

   Der Grundsatz dabei: STRUKTUR kommt vom Server, POSITION vom Client.
   Ändert sich die Anzahl eigener Zellen — geteilt, verschmolzen, ein
   Stück gefressen — wird neu aufgebaut statt korrigiert. Masse, Tode und
   wer wen frisst entstehen ausschließlich auf dem Server.

   Serveradresse: aus der Seitenadresse abgeleitet, damit nichts fest
   verdrahtet ist. Zum Testen überschreibbar mit ?server=ws://…
   ===================================================================== */

/* =====================================================================
   6d) KONTO — Anmeldung und dauerhafter Fortschritt

   Der Server führt die Wahrheit; hier steht nur, was gerade angezeigt wird.
   Level, Ore und Bestwerte kommen ausschließlich aus seinen Antworten — was
   dieses Modul hineinschreibt, ist eine Anzeige, keine Buchung.

   Das Sitzungstoken liegt im lokalen Speicher des Browsers, nicht in einem
   Cookie. Es wird dadurch nicht automatisch an den Server geschickt, sondern
   nur dann, wenn dieser Code es ausdrücklich mitgibt — das schließt eine
   ganze Angriffsklasse aus (Cross-Site-Request-Forgery). Und es ist kein
   Cookie: Die Einwilligungspflicht knüpft ans Speichern auf dem Gerät an,
   und was für die Anmeldung erforderlich ist, fällt unter die Ausnahme.

   Ohne erreichbaren Server bleibt alles wie bisher: Man spielt ohne Konto,
   der Fortschritt gilt für diese Sitzung. Das Spiel darf nie daran hängen,
   dass die Anmeldung erreichbar ist.
   ===================================================================== */

const KONTO_SCHLUESSEL = "talumi.sitzung";

function kontoBasis(){
  try {
    const q = adressUeberschreibung("api");
    if (q) return q.replace(/\/+$/, "");
    if (SERVER_HOST) return "https://" + SERVER_HOST;
    if (location.protocol === "https:") return location.origin;
    return "http://" + (location.hostname || "localhost") + ":8080";
  } catch(_){ return "http://localhost:8080"; }
}

const Konto = {
  token:null, profil:null, stand:null, bonus:null,
  /* null = noch nicht versucht, true/false = Ergebnis des letzten Versuchs */
  erreichbar:null,
  /* Kann der Server Mails verschicken? Steht in der Antwort von `/health`.
     Ohne Versand wird „Passwort vergessen" nicht angeboten — ein Knopf, der
     zuverlässig eine Fehlermeldung erzeugt, ist schlechter als keiner. */
  versand:false,
  /* Welche Fremdanmeldungen der Server anbietet (aus `/health`). Leer heißt:
     kein Knopf für Google oder Facebook. */
  oauth:[],
  laeuft:false,

  merken(token){
    this.token = token || null;
    // Kann in privaten Fenstern und bei gesperrten Seitendaten werfen.
    try {
      if (token) localStorage.setItem(KONTO_SCHLUESSEL, token);
      else localStorage.removeItem(KONTO_SCHLUESSEL);
    } catch(_){}
  },

  gemerkt(){
    try { return localStorage.getItem(KONTO_SCHLUESSEL); } catch(_){ return null; }
  },

  async ruf(pfad, daten){
    const kopf = {};
    if (this.token) kopf["authorization"] = "Bearer " + this.token;
    if (daten) kopf["content-type"] = "application/json";
    /* Abbruch nach acht Sekunden: Ohne Frist hängt der Anmeldeknopf
       unbegrenzt, wenn der Server nicht antwortet. */
    const stopp = new AbortController();
    const wecker = setTimeout(() => stopp.abort(), 8000);
    try {
      const a = await fetch(kontoBasis() + pfad, {
        method: daten ? "POST" : "GET",
        headers: kopf,
        body: daten ? JSON.stringify(daten) : undefined,
        signal: stopp.signal
      });
      this.erreichbar = true;
      const text = await a.text();
      let inhalt = {};
      try { inhalt = text ? JSON.parse(text) : {}; } catch(_){}
      return { status: a.status, ...inhalt };
    } catch(_){
      this.erreichbar = false;
      return { status: 0, fehler: "netz" };
    } finally { clearTimeout(wecker); }
  },

  /* Übernimmt, was der Server geschickt hat, in die Anzeige. Der Besitz an
     Designs kommt ebenfalls von dort: Was nicht in der Liste steht, ist
     nicht freigeschaltet — auch wenn der Browser etwas anderes meint. */
  uebernehmen(antwort){
    if (!antwort || !antwort.profil) return;
    this.profil = antwort.profil;
    if (antwort.stand) this.stand = antwort.stand;
    if (antwort.bonus) this.bonus = antwort.bonus;
    if (antwort.saison && typeof antwort.saison === "object")
      this.saison = { nr: Number(antwort.saison.nr) || 1, ende: Number(antwort.saison.ende) || 0,
                      start: Number(antwort.saison.start) || 0 };
    /* Saisonlohn (Schritt 100): kommt genau einmal mit und wird gezeigt,
       kurz nach der Begrüßung, damit er nicht von ihr überschrieben wird. */
    const lohn = antwort.saisonLohn;
    if (lohn && typeof lohn === "object")
      setTimeout(() => toast(t("s_lohn", lohn.nr, lohn.platz, (+lohn.ore || 0).toLocaleString(lang))), 2200);
    try { saisonZeigen(); } catch(_){}

    const p = antwort.profil;
    Profile.level = p.level;
    Profile.xp    = this.stand ? this.stand.rest : 0;
    Profile.ore   = p.ore;
    Profile.best  = p.best;
    Profile.rec   = Object.assign({mass:0, kills:0, time:0, royale:0, clan:0, runs:0}, p.rec);
    /* Alles bis zum erreichten Level plus alles Gekaufte. Der Server trägt
       Level-Designs beim Aufstieg zwar selbst ein, aber die Ableitung aus
       dem Level ist die verlässlichere: Sie stimmt auch dann, wenn ein
       Aufstieg vor dieser Fassung passiert ist. */
    Profile.owned = new Set([
      ...SKINS.filter(s => s.lv && s.lv <= p.level).map(s => s.id),
      ...(p.skins || [])
    ]);
    const gewaehlt = SKINS.find(s => s.id === p.skin);
    if (gewaehlt && Profile.owned.has(p.skin)){ Profile.skin = p.skin; skin = gewaehlt; }
    if (p.name) Game.name = p.name;
    /* Monde (Schritt 108): Anzeige um den Körper, Wirkung nur in der Liga. */
    if (p.monde && typeof p.monde === "object")
      Profile.monde = { besitz: p.monde.besitz || {}, aktiv: Array.isArray(p.monde.aktiv) ? p.monde.aktiv : [], staub: +p.monde.staub || 0 };
    if (p.skill && typeof p.skill === "object") Profile.skill = Object.assign({}, p.skill);
  },

  angemeldet(){ return !!(this.token && this.profil); },

  async wiederaufnehmen(){
    const t = this.gemerkt();
    if (!t) return false;
    this.token = t;
    const a = await this.ruf("/konto/ich");
    if (a.status === 200){ this.uebernehmen(a); return true; }
    // 401 heißt: Sitzung abgelaufen oder zurückgezogen. Dann weg damit.
    if (a.status === 401) this.merken(null);
    else this.token = t;              // nur Netzstörung — Token behalten
    return false;
  },

  async registrieren(email, passwort, name){
    const feld = $("acctCode");
    const code = ((feld && feld.value.trim()) || Werben.gemerkt() || "").toUpperCase().slice(0, 12);
    const a = await this.ruf("/konto/registrieren",
      { email, passwort, name, land: landAusSprache(), code: code || undefined });
    if (a.status === 200){ Werben.vergessen(); this.merken(a.token); this.uebernehmen(a); return { ok:true }; }
    return { fehler: a.fehler || "netz" };
  },

  async anmelden(email, passwort){
    const a = await this.ruf("/konto/anmelden", { email, passwort });
    if (a.status === 200){ this.merken(a.token); this.uebernehmen(a); return { ok:true }; }
    return { fehler: a.fehler || "netz" };
  },

  async abmelden(){
    if (this.token) await this.ruf("/konto/abmelden", {});
    this.merken(null);
    this.profil = null; this.stand = null; this.bonus = null;
  },

  async bonusHolen(){
    const a = await this.ruf("/konto/bonus", {});
    if (a.status === 200){ this.uebernehmen(a);
                           this.bonus = {offen:false, serie:a.tag, wochen:a.wochen || 0, ziel:10};
                           erfolgeMelden(a);
                           return { ok:true, tag:a.tag, ore:a.ore || 0, xp:a.xp || 0,
                                    boost:a.boost || 0, ehre:a.ehre || 0, wochen:a.wochen || 0, eis:!!a.eis,
                                    design: typeof a.design === "string" ? a.design : null }; }
    return { fehler: a.fehler || "netz" };
  },

  /* Einmal anklopfen, bevor ein Anmeldeformular angeboten wird. Solange kein
     Server läuft — und auf der öffentlichen Seite läuft noch keiner —, wäre
     ein Formular, das jede Eingabe mit „Server antwortet nicht" quittiert,
     schlechter als gar keines. */
  /* Läuft für meinen Clan gerade ein Kampf? (Schritt 109) */
  kampf: null,
  async kampfPruefen(){
    if (!this.angemeldet() || !this.profil.clan){ this.kampf = null; kampfKarteMalen(); return null; }
    const a = await this.ruf("/konto/kampf");
    this.kampf = a && a.ok && a.laeuft ? a.laeuft : null;
    kampfKarteMalen();
    return this.kampf;
  },
  async anklopfen(){
    const a = await this.ruf("/health");
    this.versand = !!a.mail;
    /* Meldestelle: Knöpfe nur, wenn der Server sie anbietet. */
    this.melden = a.status === 200 && !!a.melden;
    for (const id of ["endMelden", "setMelden"]){ const k = document.getElementById(id); if (k) k.hidden = !this.melden; }
    /* Zahl der Menschen im Betrieb — nur Menschen, `/health` zählt NPCs
       getrennt. Sie auf dem Startbildschirm zu zeigen ist das einzige
       Zeichen dort, dass gerade jemand spielt. */
    this.online = a.status === 200 ? Math.max(0, Number(a.spieler) || 0) : null;
    /* Welche Fremdanmeldungen der Server anbietet. Ist keine eingerichtet,
       bleibt der ganze Streifen weg. */
    this.oauth = Array.isArray(a.oauth) ? a.oauth : [];
    /* Happy Hour (Schritt 100): Zeiten kommen vom Server, gerechnet wird
       hier nur die Anzeige. Gäste bekommen denselben Faktor auf ihr Ore. */
    this.happy = a.status === 200 && a.happy && typeof a.happy === "object"
      ? { aktiv: !!a.happy.aktiv, faktor: Math.max(1, Number(a.happy.faktor) || 1),
          bis: Number(a.happy.bis) || 0, naechste: Number(a.happy.naechste) || 0,
          gemessen: Date.now() }
      : null;
    this.saison = a.status === 200 && a.saison && typeof a.saison === "object"
      ? { nr: Number(a.saison.nr) || 1, ende: Number(a.saison.ende) || 0, start: Number(a.saison.start) || 0 }
      : null;
    fremdKnoepfeZeigen();
    onlineZeigen();
    happyZeigen();
    saisonZeigen();
    if (a.status === 200) bestenlisteZeigen().catch(() => {});
    return a.status === 200;
  },

  /* Was der Spieler selbst ändern darf: Name, Land, Design. Ohne diesen
     Aufruf wäre die Wahl nur eine Anzeige — nach dem Neuladen käme wieder,
     was auf dem Server steht. */
  async einstellen(felder){
    if (!this.angemeldet()) return { fehler: "kein_konto" };
    const a = await this.ruf("/konto/einstellen", felder);
    if (a.status === 200){ this.uebernehmen(a); return { ok:true }; }
    return { fehler: a.fehler || "netz" };
  },

  /* Design kaufen. Den Preis kennt der Server; hier geht nur mit, welche
     gemeint ist. Sonst könnte der Client seinen eigenen Preis nennen. */
  async kaufen(skinId){
    const a = await this.ruf("/konto/kaufen", { skin: skinId });
    if (a.status === 200){ this.uebernehmen(a); erfolgeMelden(a); return { ok:true }; }
    return { fehler: a.fehler || "netz" };
  },

  /* Zurücksetz-Link anfordern. Die Antwort ist immer dieselbe, auch bei einer
     unbekannten Adresse — sonst wäre dieses Formular eine Abfrage, welche
     Adressen registriert sind. */
  async pwVergessen(email){
    const a = await this.ruf("/konto/passwort-vergessen", { email, sprache: lang });
    if (a.status === 200) return { ok:true };
    return { fehler: a.status === 503 ? "versand_aus" : (a.fehler || "netz") };
  },

  async pwSetzen(marke, passwort){
    const a = await this.ruf("/konto/passwort-neu", { marke, passwort });
    if (a.status === 200){ this.merken(a.token); this.uebernehmen(a); return { ok:true }; }
    return { fehler: a.fehler || "netz" };
  },

  async bestaetigen(marke){
    const a = await this.ruf("/konto/bestaetigen", { marke });
    if (a.status === 200){
      // Läuft auch ohne Anmeldung. Ist gerade jemand angemeldet, zieht die
      // Anzeige sofort nach, statt bis zum nächsten Neuladen falsch zu stehen.
      if (this.profil) this.profil.emailOk = true;
      return { ok:true };
    }
    return { fehler: a.fehler || "netz" };
  },

  async bestaetigungNeu(){
    const a = await this.ruf("/konto/bestaetigung", { sprache: lang });
    if (a.status === 200) return { ok:true };
    return { fehler: a.status === 503 ? "versand_aus" : (a.fehler || "netz") };
  },

  /* `namen` statt Kennungen: Die Freundesliste liegt im Browser und soll dort
     bleiben. `freunde` sagt dem Server, dass eine Einschränkung gewollt war —
     sonst käme bei unbekannten Namen die Weltrangliste zurück. */
  /* ---- Clans (Schritt 100) ---------------------------------------- */
  async clanIch(){
    if (!this.angemeldet()) return null;
    const a = await this.ruf("/konto/clan/ich");
    return a.status === 200 ? a : null;
  },
  async clanTun(was, daten){
    if (!this.angemeldet()) return { fehler: "kein_konto" };
    const a = await this.ruf("/konto/clan/" + was, daten || {});
    if (a.status === 200 && a.profil) this.uebernehmen(a);
    return a.status === 200 ? a : { fehler: a.fehler || "netz" };
  },
  async clanListe(pfad){
    const a = await this.ruf(pfad);
    return a.status === 200 ? a : null;
  },

  async rangliste(art, land, namen){
    const teile = ["art=" + encodeURIComponent(art || "best")];
    if (land) teile.push("land=" + encodeURIComponent(land));
    if (namen){
      teile.push("freunde=1");
      if (namen.length) teile.push("namen=" + namen.map(encodeURIComponent).join(","));
    }
    const a = await this.ruf("/rangliste?" + teile.join("&"));
    return a.status === 200 ? a : null;
  }
};

/* Landeskennung aus der Browsersprache, nicht aus der IP-Adresse. Eine
   Ortsbestimmung über die Adresse wäre für ein Spiel nicht erforderlich und
   müsste in der Datenschutzerklärung stehen. Der Spieler kann sie in den
   Einstellungen ändern; hier wird nur ein Vorschlag gemacht. */
function landAusSprache(){
  try {
    for (const w of (navigator.languages || [navigator.language || ""])){
      const teil = String(w).split("-")[1];
      if (teil && /^[A-Za-z]{2}$/.test(teil)) return teil.toUpperCase();
    }
  } catch(_){}
  return null;
}

/* Computergegner des Servers tragen ein Kürzel vor dem Namen („NPC Vesta").
   Sie sollen nie als echte Mitspieler durchgehen — weder im Kreis noch in
   der Bestenliste noch auf dem Bildschirm „gefressen von". */
/* Seit Schritt 98 ohne „NPC“-Vorsatz (Thomas' Vorgabe). Computergegner
   erkennt man am fehlenden Rangabzeichen; `b` bleibt in den Daten. */
const mitMarke = (name, bot) => name;

/* Was der Server über einen Mitspieler schickt, in die Form bringen, in der
   der Client damit arbeitet. `l` (Level) und `r` (Rang) kommen nur für
   angemeldete Konten — bei Gästen und Computergegnern fehlen sie, und dann
   zeigt die Namenszeile nur den Namen. */
function steckbrief(e){
  const w = { n: mitMarke(String(e.n || "?"), e.b), s: String(e.s || "basalt") };
  if (Number.isInteger(e.l)) w.l = e.l;
  if (Number.isInteger(e.r)) w.r = e.r;
  if (e.b) w.b = 1;
  if (Number.isInteger(e.tm)) w.tm = e.tm;
  if (typeof e.t === "string" && e.t) w.t = e.t;
  if (Array.isArray(e.mo)){ const mo = e.mo.filter(a => MONDE[a]).slice(0, 3); if (mo.length) w.mo = mo; }
  return w;
}

const NET_DELAY = 0.09;          // Sekunden Zeichenverzögerung, knapp zwei Serverschritte
const NET_KEEP  = 1.5;           // Sekunden Schnappschüsse aufbewahren
const jetzt = () => performance.now()/1000;

/* `?server=` und `?api=` gelten nur auf dem eigenen Rechner (Schritt 95).
   Vorher galten sie überall — ein Link wie
   `https://talumi.io/?api=https://fremd.example` hätte das gemerkte
   Sitzungstoken und beim Anmelden E-Mail und Passwort an einen fremden
   Server geschickt. Alle Prüfstände laufen auf `localhost` und sind davon
   nicht betroffen. */
function adressUeberschreibung(name){
  try {
    const h = location.hostname;
    const lokal = h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1" ||
                  location.protocol === "file:";
    if (!lokal) return null;
    return new URLSearchParams(location.search).get(name);
  } catch(_){ return null; }
}

function serverUrl(){
  try {
    const q = adressUeberschreibung("server");
    if (q) return q;
    if (SERVER_HOST) return "wss://" + SERVER_HOST + "/play";
    if (location.protocol === "https:") return "wss://" + location.host + "/play";
    return "ws://" + (location.hostname || "localhost") + ":8080";
  } catch(_) { return "ws://localhost:8080"; }
}

/* Nächster-Nachbar-Zuordnung. Das Protokoll schickt je Zelle nur die
   Spielerkennung, nicht eine eigene je Stück — alle Stücke eines Spielers
   tragen dieselbe. Zwischen zwei Zuständen muss deshalb über die Nähe
   zugeordnet werden. Das ist hier verlässlich, weil Zellen sich in einem
   Fünfzigstel Sekunde nur wenige Bildpunkte weit bewegen. Die Alternative
   wäre eine Kennung je Zelle in jedem Zustand — das kostet Bandbreite bei
   allen Spielern, und Bandbreite ist der Grund für den Sichtfeld-Ausschnitt. */
function zuordnen(von, nach){
  const frei = nach.slice(), paare = [];
  for (const a of von){
    let best = -1, bestQ = Infinity;
    for (let i=0;i<frei.length;i++){
      const q = (frei[i].x-a.x)**2 + (frei[i].y-a.y)**2;
      if (q < bestQ){ bestQ = q; best = i; }
    }
    paare.push([a, best >= 0 ? frei.splice(best,1)[0] : null]);
  }
  return {paare, neu:frei};
}

const Net = {
  socket:null, seq:0, connected:false,
  lage:"aus",                    // aus | waehlt | verbunden | fehler
  grund:"",
  you:0, rate:20,
  wer:new Map(),                 // Spielerkennung -> {n, s, l?, r?, b?}
  schnapp:[],                    // Schnappschüsse, ältester zuerst
  eigen:null,                    // letzter autoritativer Stand eigener Zellen
  /* Trümmer kommen als Unterschied (`dn` neu/geändert, `dw` weg) und liegen
     hier als Nummer → [x, y, Farbton]. Sie stehen bewusst außerhalb der
     Schnappschüsse: Sie bewegen sich nicht, also gibt es nichts zu glätten.
     `debNeu` merkt sich, ob seit dem letzten Bild etwas anders ist — dann
     baut der Client die Zeichenliste neu, sonst behält er sie. */
  deb:new Map(), debNeu:true,
  world:0,                       // Weltgröße, kommt mit „welcome" vom Server
  top:[],
  tot:null,
  lohn:null, profil:null, stand:null, aufgestiegen:0, neueSkins:[],  // Abrechnung vom Server
  ehre:null,                     // {dazu, gesamt, rang} — nur mit Konto
  erfolge:[], rangNeu:0,         // in dieser Runde neu erreicht
  monde:[], staubDazu:0,         // Monde und Mondstaub dieser Runde (Liga)
  letzteEingabe:0,

  join(info){
    this.leave();
    this.lage = "waehlt"; this.grund = "";
    this.schnapp = []; this.wer.clear(); this.eigen = null;
    this.deb.clear(); this.debNeu = true;
    this.top = []; this.platz = 0; this.tot = null; this.you = 0; this.seq = 0;
    this.modus = "online"; this.team = 0; this.zeit = 0; this.zone = 0; this.rest = 0;
    this.lebende = 0; this.tms = null; this.koerper = 0; this.ergebnis = null;
    this.kt = 0; this.kts = 0;
    const url = serverUrl();
    try { this.socket = new WebSocket(url); }
    catch(e){ this.lage = "fehler"; this.grund = String(e && e.message || e); return; }
    this.socket.onopen = () => {
      /* Ist ein Sitzungstoken da, geht es mit. Der Server nimmt dann Name und
         Design aus dem Profil statt aus dieser Nachricht — und nur dann
         wird die Runde einem Konto gutgeschrieben. */
      try { this.socket.send(JSON.stringify({kind:"join", name:info.name, skin:info.skin,
                                             bonus: info.bonus || 1, mode: modeId,
                                             token: Konto.token || undefined})); }
      catch(_){}
    };
    this.socket.onmessage = e => this.onState(e.data);
    this.socket.onerror = () => {
      if (this.lage !== "verbunden"){ this.lage = "fehler"; this.grund = url; }
    };
    this.socket.onclose = () => {
      this.connected = false;
      if (this.lage === "verbunden") this.lage = "getrennt";
      else if (this.lage !== "fehler") { this.lage = "fehler"; this.grund = url; }
    };
  },

  send(kind){
    if (!this.connected) return;
    try { this.socket.send(JSON.stringify({kind, seq:this.seq++})); } catch(_){}
  },

  /* Alles, was hier ankommt, ist Text von außen: erst prüfen, dann glauben.
     Ein unvollständiger Zustand darf die Runde nicht abbrechen. */
  onState(roh){
    let m; try { m = JSON.parse(roh); } catch(_){ return; }
    if (!m || typeof m.t !== "string") return;

    /* Der Server lehnt den Beitritt ab (Schritt 109: Clankampf ohne
       laufende Herausforderung). Kein Rückfall auf eine lokale Runde. */
    if (m.t === "abgelehnt"){ this.lage = "abgelehnt"; this.grund = String(m.grund || ""); return; }
    if (m.t === "welcome"){
      this.you = +m.you || 0;
      this.rate = +m.tick || 20;
      /* Weltgröße vom Server. `start()` liest sie gleich aus. */
      this.world = Math.max(1000, Math.min(40000, +m.world || 9000));
      /* Spielart (Schritt 105). */
      this.modus = typeof m.modus === "string" ? m.modus : "online";
      this.team = +m.team || 0; this.zeit = +m.zeit || 0; this.koerper = +m.koerper || 0;
      this.zone = 0; this.rest = 0; this.lebende = 0; this.tms = null;
      this.connected = true; this.lage = "verbunden";
      this.wer.clear();
      for (const id in (m.names || {})){
        const e = m.names[id];
        if (e && typeof e.n === "string") this.wer.set(+id, steckbrief(e));
      }
      /* Startbonus: Der Server sagt, was er abgebucht hat. Reichte das
         Guthaben nicht, steht hier eine niedrigere Stufe als gewählt — dann
         startet der Spieler normal und erfährt auch, warum. */
      if (m.ore !== null && m.ore !== undefined && Konto.profil){
        Konto.profil.ore = Math.max(0, +m.ore || 0);
        Profile.ore = Konto.profil.ore;
        paintPurse();
      }
      const bezahlt = Math.max(1, +m.bonus || 1);
      if (bezahlt < Profile.boost) toast(t("boostpoor"));
      Profile.boost = bezahlt;
      return;
    }

    if (m.t === "dead"){
      this.tot = {peak:+m.peak||0, kills:+m.kills||0, sek:+m.sek||0,
                  ende: !!m.ende, gewonnen: !!m.gewonnen, platz: +m.platz || 0, zone: !!m.zone,
                  tms: Array.isArray(m.tms) ? m.tms : null, koerper: +m.koerper || 0};
      /* Der Fresser kommt mit der Todesnachricht — ein „eat"-Ereignis im
         Zustand erreicht den Gefressenen nicht mehr. */
      if (m.von && typeof m.von.n === "string" && !Game.killer)
        Game.killer = {
          name: mitMarke(m.von.n, m.von.b),
          m: +m.von.m || 0,
          left: Math.max(0, Game.cells.length - 1),
          sinceSplit: Game.t - Game.lastSplit,
          mine: Game.cells.reduce((s,c) => s+c.m, 0)
        };
      /* Abrechnung eines angemeldeten Spielers. Sie kommt nur mit, wenn beim
         Beitritt ein gültiges Token dabei war; sonst bleiben die Felder leer
         und der Ergebnisbildschirm zeigt wie bisher „Übung, keine Belohnung". */
      this.lohn = m.lohn || null;
      this.profil = m.profil || null;
      this.ehre = m.ehre || null;
      this.erfolge = Array.isArray(m.erfolge) ? m.erfolge : [];
      this.monde = Array.isArray(m.monde) ? m.monde : [];
      this.staubDazu = +m.staubDazu || 0;
      this.rangNeu = +m.rangNeu || 0;
      this.stand = m.stand || null;
      this.aufgestiegen = m.aufgestiegen || 0;
      this.neueSkins = m.neueSkins || [];
      return;
    }

    if (m.t !== "state") return;

    for (const e of (m.ev || [])){
      if (!e) continue;
      if (e.t === "join" && typeof e.n === "string")
        this.wer.set(+e.id, steckbrief(e));
      if (e.t === "left") this.wer.delete(+e.id);
      /* Aufstieg mitten in der Runde. Ohne dieses Ereignis trüge ein Spieler
         sein neues Abzeichen erst in der nächsten Runde. */
      if (e.t === "rang" && Number.isInteger(e.r)){
        const w = this.wer.get(+e.id);
        if (w) w.r = e.r;
        if (+e.id === this.you){
          if (Konto.profil) Konto.profil.rang = e.r;
          toast(t("rangneu", t("rk" + e.r)));
          Sound.levelUp();
        }
      }
      /* Der Titel wechselt. Meldung nur, wenn es einen selbst betrifft oder
         man gerade dem Träger nah genug ist, ihn zu sehen — sonst wäre das
         bei 190 Körpern ein Dauerrauschen. */
      if (e.t === "titel"){
        this.kt = +e.id || 0; this.kts = 0;
        if (+e.id === this.you){
          toast(t("titel_du", t("titel_name")));
          Sound.levelUp();
          const [cx, cy] = centre();
          ring(cx, cy, 260, "#f2c14e");
        } else if (+e.von === this.you && +e.id){
          const w = this.wer.get(+e.id);
          toast(t("titel_weg", t("titel_name"), (w && w.n) || "?"));
        }
      }
      if (e.t === "burst" && isFinite(e.x) && isFinite(e.y))
        ring(+e.x, +e.y, 120, TH().shatter);
      /* Wer uns gefressen hat, sagt nur dieses Ereignis. Der Todesbildschirm
         lebt von dieser Zeile, deshalb wird sie hier festgehalten — die
         spätere "dead"-Nachricht enthält keinen Namen. */
      if (e.t === "eat" && +e.wen === this.you){
        const w = this.wer.get(+e.von);
        const oben = (Array.isArray(m.top) ? m.top : []).find(x => x && +x.id === +e.von);
        Game.killer = {
          name: (w && w.n) || (oben && mitMarke(oben.n, oben.b)) || "?",
          m: (oben && +oben.m) || 0,
          left: Math.max(0, Game.cells.length - 1),
          sinceSplit: Game.t - Game.lastSplit,
          mine: Game.cells.reduce((s,c) => s+c.m, 0)
        };
      }
    }

    const gruppen = new Map();
    for (const c of (m.cells || [])){
      if (!c || c.length < 4) continue;
      const id = +c[0];
      let g = gruppen.get(id); if (!g) gruppen.set(id, g = []);
      g.push({x:+c[1], y:+c[2], m:+c[3]});
    }
    /* Die Bestenliste kommt nur in jedem vierten Takt. Fehlt sie, gilt die
       letzte weiter — sie hier zu leeren ließe die Anzeige flackern. */
    if (Array.isArray(m.top)) this.top = m.top;
    /* Spielart (Schritt 105). */
    if (Number.isFinite(m.zone)){ this.zone = m.zone; if (Game.royale) Game.zoneR = m.zone; }
    if (Number.isFinite(m.rest)){ this.rest = m.rest; Game.left = m.rest; }
    if (Number.isInteger(m.leb)) this.lebende = m.leb;
    if (Array.isArray(m.tms)) this.tms = m.tms;
    /* Eigener Platz im ganzen Raum (Schritt 102), kommt mit der Liste. */
    if (Number.isInteger(m.pl) && m.pl > 0) this.platz = m.pl;
    /* Titelträger (Schritt 97): Kennung und seit wie vielen Sekunden. */
    if (Number.isInteger(m.kt)) this.kt = m.kt;
    if (Number.isFinite(m.kts)) this.kts = m.kts;
    if (gruppen.has(this.you)) this.eigen = gruppen.get(this.you);

    /* Trümmer nachführen: erst entfernen, dann setzen. */
    if (Array.isArray(m.dw) && m.dw.length){
      for (const i of m.dw) this.deb.delete(+i);
      this.debNeu = true;
    }
    if (Array.isArray(m.dn) && m.dn.length){
      for (const e of m.dn){
        if (!e || e.length < 4) continue;
        this.deb.set(+e[0], [+e[1], +e[2], +e[3]]);
      }
      this.debNeu = true;
    }

    this.schnapp.push({
      at: jetzt(), gruppen,
      pul: Array.isArray(m.pul) ? m.pul : [],
      wurf: Array.isArray(m.shed) ? m.shed : [],
      safe: +m.safe || 0
    });
    const grenze = jetzt() - NET_KEEP;
    while (this.schnapp.length > 2 && this.schnapp[0].at < grenze) this.schnapp.shift();
  },

  /* Ein Schritt im Onlinebetrieb. Tritt an die Stelle der lokalen
     Simulation: gerechnet wird nichts mehr, nur übernommen und geglättet. */
  schritt(dt){
    Game.t += dt;
    if (Game.toast) Game.toast.life -= dt;
    effekteAltern(dt);

    if (this.connected && jetzt() - this.letzteEingabe >= 1/this.rate){
      this.letzteEingabe = jetzt();
      const [ax, ay] = aim();
      try { this.socket.send(JSON.stringify({kind:"input", ax, ay, seq:this.seq++})); } catch(_){}
    }

    this.fremdes();
    this.eigenes(dt);

    if (this.tot){ const d = this.tot; this.tot = null; endeOnline(d); return; }
    if (!this.connected && this.lage !== "waehlt" && Game.running)
      endeOnline({peak:Math.round(peak), kills:Game.kills, sek:Math.round(Game.t), abbruch:true});
  },

  /* Fremde Körper, Trümmer, Pulsare, Würfe — zwischen zwei Zuständen gerechnet. */
  fremdes(){
    const ziel = jetzt() - NET_DELAY;
    let a = null, b = null;
    for (const s of this.schnapp){
      if (s.at <= ziel) a = s; else { b = s; break; }
    }
    if (!a) a = this.schnapp[0];
    if (!a) return;
    const f = (b && b.at > a.at) ? clamp((ziel - a.at)/(b.at - a.at), 0, 1) : 0;

    const rivalen = [];
    for (const [id, von] of a.gruppen){
      if (id === this.you) continue;
      const info = this.wer.get(id) || {n:"?", s:"basalt"};
      const haut = SKINS.find(s => s.id === info.s) || null;
      const nach = (b && b.gruppen.get(id)) || null;
      const {paare} = nach ? zuordnen(von, nach) : {paare: von.map(c => [c, null])};
      for (const [c, d] of paare){
        const x = d ? c.x + (d.x-c.x)*f : c.x;
        const y = d ? c.y + (d.y-c.y)*f : c.y;
        const mm = d ? c.m + (d.m-c.m)*f : c.m;
        rivalen.push({x, y, m:mm, name:info.n, gid:id, vx:0, vy:0, merge:0,
                      /* Level und Rang kommen vom Server. Ein Gast hat
                         keins von beidem.

                         **Computergegner tragen kein Abzeichen** (Thomas,
                         13.09.2026: „Gäste und Computergegner: Zeile ohne
                         Abzeichen, nur Level und Name"). Der Server schickt
                         ihre Rangstufe trotzdem mit — sie steuert, wie gut
                         ein NPC spielt, und wird an anderer Stelle gebraucht.
                         Soll sie doch im Bild stehen, ist `!info.b &&` hier
                         die einzige Änderung. */
                      lvl:info.l, rang: info.b ? undefined : info.r,
                      tag: typeof info.t === "string" ? info.t : null,
                      /* Mannschaft aus Sicht des Spielers: 1 = eigene, 2 = Gegner. */
                      team: info.tm ? (info.tm === this.team ? 1 : 2) : 0,
                      mo: info.mo || null,
                      tint:0, pal:haut, tier:(haut && haut.tier) || 1,
                      trait:(haut && haut.trait) || "plain"});
      }
    }
    Game.rivals = rivalen;

    /* Trümmer liegen still — der Server bewegt sie nicht. Deshalb ohne
       Zwischenwerte direkt übernehmen. Der Farbton kommt vom Server, die
       Sättigung aus dem Thema: so bleibt die Streuung erhalten, ohne dass
       im hellen Thema bunte Punkte auf Sand liegen. */
    if (this.debNeu || this.debThema !== Settings.theme){
      const d = TH().dust;
      const sat = (d.s[0]+d.s[1])/2, lig = (d.l[0]+d.l[1])/2;
      const liste = [];
      for (const e of this.deb.values())
        liste.push({ x:e[0], y:e[1], m:1, r:3.4,
          c:`hsl(${d.h[0] + ((e[2]%360)/360)*(d.h[1]-d.h[0])} ${sat}% ${lig}%)` });
      Game.debris = liste; Game.debrisVer = (Game.debrisVer | 0) + 1;
      this.debNeu = false;
      this.debThema = Settings.theme;
    }
    Game.pulsars = a.pul.map(e => ({
      x:e[0], y:e[1], vx:0, vy:0, fed:+e[2]||0,
      spin:((e[0]*0.7 + e[1]*0.3) % 6.28)      // aus der Lage, damit er nicht flackert
    }));
    Game.shed = a.wurf.map(e => ({
      x:e[0], y:e[1], vx:0, vy:0, m:+e[2]||0, r:radiusOf(+e[2]||0),
      c:TH().rival.rock, hot:TH().rival.hot, tier:1
    }));
    Game.safe = a.safe;
  },

  /* Eigene Zellen: sofort bewegen, dann gegen den Serverstand korrigieren. */
  eigenes(dt){
    const auth = this.eigen;
    if (!auth || !auth.length) return;

    /* Struktur vom Server. Eine andere Zellenzahl heißt geteilt,
       verschmolzen oder ein Stück verloren — dann ist Korrigieren falsch,
       weil es kein Gegenstück zum Korrigieren gibt. */
    if (Game.cells.length !== auth.length){
      Game.cells = auth.map(c => ({x:c.x, y:c.y, m:c.m, vx:0, vy:0,
                                   name:Game.name, merge:0, mine:true}));
      return;
    }

    const [cx, cy] = centre(), [ax, ay] = aim();
    moveOwnCells(dt, cx + ax*900, cy + ay*900);   // dieselbe Formel wie im Server

    const {paare} = zuordnen(Game.cells, auth);
    for (const [c, s] of paare){
      if (!s) continue;
      /* Umso härter, je größer der Fehler. Kleine Abweichungen entstehen
         durch die Laufzeit und dürfen nicht dauernd zurückgezogen werden —
         sonst gummibandet die eigene Zelle. Große Abweichungen sind echte
         Ereignisse (Stoß, Wandkontakt, Rückstoß) und müssen durchgreifen. */
      const fehler = Math.hypot(s.x-c.x, s.y-c.y);
      const k = fehler > 260 ? 1 : fehler > 60 ? .10 : .02;
      c.x += (s.x-c.x)*k;
      c.y += (s.y-c.y)*k;
      c.m = s.m;                                  // Masse immer vom Server
    }
  },

  leave(){
    if (this.socket){
      try { if (this.connected) this.socket.send(JSON.stringify({kind:"leave"})); } catch(_){}
      try { this.socket.onclose = null; this.socket.close(); } catch(_){}
    }
    this.socket = null; this.connected = false;
    if (this.lage === "verbunden") this.lage = "aus";
  }
};

/* =====================================================================
   6e) RANGLISTEN
   Gewertet wird nur, was der Server gerechnet hat. Eine lokale Runde gegen
   Computergegner kann niemand nachprüfen, deshalb zählt sie nicht — das steht
   auch im Bildschirm, sonst sucht ein Spieler den Fehler bei sich.

   Drei Ansichten und drei Wertungen ergeben neun Listen. Alle kommen vom
   Server fertig sortiert und auf fünfzig Zeilen begrenzt: Sortieren im
   Browser hieße, erst alle Konten zu schicken.
   ===================================================================== */

let rangWer = "welt";      // welt | land | freunde
let rangWas = "best";      // best | ehre | abschuesse | saison | level | clans | titel
let rangLauf = 0;          // laufende Nummer, gegen überholende Antworten

/* Wertungen (Schritt 101, Thomas' Vorgabe vom 16.09.2026): Ehre, Abschüsse
   und Clans dazu, Ore weg — ein Kontostand ist keine Leistung, und eine
   Liste, die ihn zeigt, lädt zum Horten ein statt zum Spielen. */
function rangKnoepfe(){
  const wer = [["welt","r_world"], ["land","r_country"], ["freunde","r_friends"]];
  const was = [["best","r_best"], ["ehre","r_ehre"], ["abschuesse","r_kills"], ["saison","s_tab"],
               ["level","r_level"], ["clans","clan"], ["titel","titel_name"]];
  for (const [box, liste, jetzt, setzen] of
       [[$("rankWho"), wer, rangWer, v => rangWer = v],
        [$("rankWhat"), was, rangWas, v => rangWas = v]]){
    box.innerHTML = "";
    for (const [wert, schluessel] of liste){
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = t(schluessel);
      b.setAttribute("aria-pressed", String(jetzt === wert));
      b.addEventListener("click", () => { setzen(wert); rangKnoepfe(); rangLaden(); });
      box.appendChild(b);
    }
  }
}

function rangHinweis(text, art){
  const n = $("rankNote");
  n.textContent = text || "";
  n.className = "notice" + (art ? " " + art : "");
}

/* Zahlen groß genug, dass sie nebeneinander lesbar bleiben: 1.240.000 statt
   1240000. Masse und Ore werden gerundet, Level ist ohnehin ganz. */
const dauerText = sek => {
  sek = Math.max(0, Math.floor(sek));
  const h = Math.floor(sek / 3600), m = Math.floor(sek / 60) % 60, s2 = sek % 60;
  return h ? `${h}:${String(m).padStart(2,"0")}:${String(s2).padStart(2,"0")}`
           : `${m}:${String(s2).padStart(2,"0")}`;
};
const rangWert = (e) => rangWas === "level"
  ? t("level") + " " + e.wert
  : rangWas === "titel" ? dauerText(e.wert)
  : Math.round(e.wert).toLocaleString(lang);

/* Titel-Rangliste (Schritt 97): weltweit, auch für Gäste lesbar — auf
   Portalen spielt fast jeder ohne Konto. Land und Freunde gibt es hier nicht. */
async function titelRangLaden(meine){
  const box = $("rankList");
  box.innerHTML = `<p class="hintline">${t("r_loading")}</p>`;
  rangHinweis(t("titel_regel", t("titel_name")));
  const a = await Konto.ruf("/titel");
  if (meine !== rangLauf) return;
  if (!a || a.status !== 200){ box.innerHTML = ""; return rangHinweis(t("r_offline"), "warn"); }
  const liste = Array.isArray(a.liste) ? a.liste : [];
  if (!liste.length){ box.innerHTML = ""; return rangHinweis(t("titel_leer", t("titel_name"))); }
  const ichKonto = istAngemeldet() ? Konto.profil.id : -1;
  const ichName = (Game.name || spielerName() || "").toLowerCase();
  box.innerHTML = liste.map(e => {
    const ich = e.id ? +e.id === ichKonto : (!istAngemeldet() && String(e.name).toLowerCase() === ichName);
    const zusatz = e.laufend ? `<small style="color:#f2c14e">♛</small>`
                 : e.gast ? `<small>${esc(t("k_guest"))}</small>`
                 : e.land ? `<small>${esc(e.land)}</small>` : "";
    return `<div class="rankrow${ich ? " me" : ""}">` +
           `<i>${e.rang}</i><b>${esc(e.name)}${zusatz}</b>` +
           `<span>${esc(dauerText(e.wert))}</span></div>`;
  }).join("");
}

/* Clan-Rangliste: Summe der Ehre aller Mitglieder, weltweit, für jeden
   lesbar. Derselbe Endpunkt wie im Reiter „Clan"; hier nur die volle Liste. */
async function clanRangLaden(meine){
  const box = $("rankList");
  box.innerHTML = `<p class="hintline">${t("r_loading")}</p>`;
  rangHinweis(t("r_clans_hint"));
  const a = await Konto.ruf("/clan/rangliste");
  if (meine !== rangLauf) return;
  if (!a || a.status !== 200){ box.innerHTML = ""; return rangHinweis(t("r_offline"), "warn"); }
  const liste = Array.isArray(a.liste) ? a.liste : [];
  if (!liste.length){ box.innerHTML = ""; return rangHinweis(t("r_empty")); }
  const meiner = istAngemeldet() && Konto.profil.clan ? Konto.profil.clan.id : -1;
  box.innerHTML = liste.map(e =>
    `<div class="rankrow${+e.id === meiner ? " me" : ""}">` +
    `<i>${e.rang}</i><b>[${esc(e.tag)}] ${esc(e.name)}<small>${esc(t("r_clan_n", e.mitglieder))}</small></b>` +
    `<span>${Math.round(+e.ehre || 0).toLocaleString(lang)}</span></div>`).join("");
}

async function rangLaden(){
  const box = $("rankList");
  const meine = ++rangLauf;
  { const w = $("rankWho"); if (w) w.hidden = rangWas === "titel" || rangWas === "clans"; }
  if (rangWas === "titel") return titelRangLaden(meine);
  if (rangWas === "clans") return clanRangLaden(meine);

  if (!Konto.angemeldet()){
    box.innerHTML = "";
    rangHinweis(t("r_guest"), "warn");
    return;
  }
  if (rangWer === "land" && !Konto.profil.land){
    box.innerHTML = "";
    rangHinweis(t("r_noland"), "warn");
    return;
  }
  if (rangWer === "freunde" && !Profile.friends.length){
    box.innerHTML = "";
    rangHinweis(t("r_nofriends"));
    return;
  }

  box.innerHTML = `<p class="hintline">${t("r_loading")}</p>`;
  rangHinweis("");

  /* Der eigene Name gehört in die Freundesliste, sonst fehlt man in der
     eigenen Wertung — und eine Rangliste, in der man selbst nicht vorkommt,
     ist zum Vergleichen unbrauchbar. */
  const namen = rangWer === "freunde"
    ? Profile.friends.concat([Konto.profil.name]) : null;
  const land = rangWer === "land" ? Konto.profil.land : null;

  const a = await Konto.rangliste(rangWas, land, namen);
  /* Eine langsame Antwort auf eine alte Auswahl darf eine neue nicht
     überschreiben. Ohne diese Prüfung blinkt die Liste zwischen zwei
     Ansichten, wenn schnell umgeschaltet wird. */
  if (meine !== rangLauf) return;

  if (!a){ box.innerHTML = ""; return rangHinweis(t("r_offline"), "warn"); }

  const liste = a.liste || [];
  if (!liste.length){
    box.innerHTML = "";
    return rangHinweis(t(rangWer === "freunde" ? "r_nofound" : "r_empty"));
  }

  const ich = Konto.profil.id;
  box.innerHTML = liste.map(e => {
    const land2 = e.land ? `<small>${esc(e.land)}</small>` : "";
    return `<div class="rankrow${+e.id === ich ? " me" : ""}">` +
           `<i>${e.rang}</i><b>${esc(e.name)}${land2}</b>` +
           `<span>${esc(rangWert(e))}</span></div>`;
  }).join("");

  /* Der eigene Platz getrennt — aber nur, wenn er nicht ohnehin in der
     sichtbaren Liste steht. Dort ist die eigene Zeile hervorgehoben; ein
     zweiter Satz darunter wäre nur Wiederholung. */
  const drin = liste.some(e => +e.id === ich);
  /* Bei den Abschüssen steht dazu, dass nur Menschen zählen — sonst fragt
     jeder, warum seine 40 gefressenen NPCs fehlen. */
  rangHinweis([a.eigener && !drin ? t("r_you", a.eigener.toLocaleString(lang)) : "",
               rangWas === "abschuesse" ? t("r_kills_hint") : ""].filter(Boolean).join(" · "));
}

$("rankBtn").addEventListener("click", () => {
  rangKnoepfe(); show("rankVeil"); rangLaden();
});
$("rankClose").addEventListener("click", () => show("startVeil"));

/* Spielanleitung (Schritt 102): aus den Einstellungen, aus „Rechtliches" und
   aus dem Hangar. „Zurück" führt dorthin, wo man herkam. */
let hilfeZurueck = "startVeil";
function hilfeOeffnen(){
  const offen = document.querySelector(".veil:not([hidden])");
  hilfeZurueck = offen && offen.id !== "hilfeVeil" ? offen.id : "startVeil";
  show("hilfeVeil");
  const v = $("hilfeVeil"); if (v) v.scrollTop = 0;
}
for (const id of ["hilfeBtn", "hilfeBtn2"]){ const b = $(id); if (b) b.addEventListener("click", hilfeOeffnen); }
$("hilfeClose").addEventListener("click", () => show(hilfeZurueck));
document.addEventListener("click", e => {
  const a = e.target && e.target.closest && e.target.closest("#hilfeLink");
  if (a){ e.preventDefault(); hilfeOeffnen(); }
});
/* „alle" über der Bestenliste im Hangar: derselbe Weg wie der Knopf oben. */
if ($("boardMehr")) $("boardMehr").addEventListener("click", () => $("rankBtn").click());
/* „Designs" in der Kopfzeile: der Reiter, in dem man sie sich ansieht. */
if ($("hautBtn")) $("hautBtn").addEventListener("click", () => reiter("haut"));

/* Sprachwahl in der Kopfzeile der Konsole (Schritt 99). Ein Kürzel-Knopf
   öffnet die Liste der sieben Sprachen; Klick daneben oder Escape schließt. */
(function langMenue(){
  const knopf = $("langBtn"), menue = $("langMenu");
  if (!knopf || !menue) return;
  const zu = () => { menue.hidden = true; knopf.setAttribute("aria-expanded", "false"); };
  const auf = () => {
    menue.innerHTML = "";
    for (const code of Object.keys(LANGNAMES)){
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("role", "menuitemradio");
      b.textContent = LANGNAMES[code];
      b.setAttribute("aria-pressed", String(code === lang));
      b.addEventListener("click", () => { lang = code; applyLang(); zu(); });
      menue.appendChild(b);
    }
    menue.hidden = false; knopf.setAttribute("aria-expanded", "true");
  };
  knopf.addEventListener("click", e => { e.stopPropagation(); menue.hidden ? auf() : zu(); });
  document.addEventListener("click", e => { if (!menue.hidden && !menue.contains(e.target)) zu(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !menue.hidden) zu(); });
})();

/* ---- Errungenschaften ---------------------------------------------- */

/* Errungenschaften als **eine Zeile je Art** (Thomas, 15.09.2026): links ein
   Bildchen, dann der Name der Art, die Stufen als Punkte, der Fortschritt
   zur nächsten Stufe und was sie einbringt. Die 21 Kennungen und ihre Ehre
   bleiben unverändert — der Server kennt sie so; hier ändert sich nur, wie
   sie gezeigt werden. `e_jagd1` (der erste Abschuss) ist die erste Stufe der
   Jagd, kein eigener Eintrag. */
const ERFOLG_FAMILIEN = [
  { art:"e_masse",     bild:"masse",  ids:["w_geroell","w_planetes","w_proto","w_welt","w_koloss"] },
  { art:"e_jagd",      bild:"jagd",   ids:["j_erster","j_25","j_250","j_1000"] },
  { art:"e_jagdrunde", bild:"blitz",  ids:["j_runde5","j_runde12","j_runde25"] },
  { art:"e_duell",     bild:"duell",  ids:["d_erster","d_25","d_100"] },
  { art:"e_runden",    bild:"runden", ids:["a_10","a_100","a_500"] },
  { art:"e_zeit",      bild:"uhr",    ids:["a_fuenfmin","a_zehnmin"] },
  { art:"e_stunden",   bild:"sand",   ids:["a_stunden"] },
  { art:"e_treue",     bild:"tage",   ids:["t_woche"] },
  { art:"e_clan",      bild:"clan",   ids:["c_mitglied"] },
  { art:"e_werben",    bild:"werben", ids:["g_werber"] },
  { art:"e_skins",     bild:"skins",  ids:["s_10","s_25","s_alle"] },
  { art:"e_level",     bild:"level",  ids:["l_10","l_25","l_50","l_100"] }
];

/* Die Bildchen: kleine Pfade, in Messing gezeichnet, keine Bilddateien —
   wie die Rangabzeichen. */
const ERFOLG_BILD = {
  masse:  `<circle cx="12" cy="12" r="5.5"/><ellipse cx="12" cy="12" rx="10" ry="3.2" transform="rotate(-18 12 12)"/>`,
  jagd:   `<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>`,
  blitz:  `<path d="M13 2 5 13h6l-1 9 8-12h-6z"/>`,
  runden: `<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>`,
  uhr:    `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>`,
  tage:   `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m8.5 15 2.5 2.5 4.5-4.5"/>`,
  skins:  `<path d="M12 3 20 9l-3 11H7L4 9z"/><path d="M4 9h16M12 3l-3 6 3 11 3-11z"/>`,
  level:  `<path d="m5 15 7-7 7 7"/><path d="m5 20 7-7 7 7" opacity=".5"/>`,
  duell:  `<circle cx="8" cy="12" r="4"/><circle cx="17" cy="9" r="2.5"/><path d="M12 12h2M4 20l4-4M20 20l-3-3"/>`,
  sand:   `<path d="M7 3h10M7 21h10M8 3c0 5 4 6 4 9s-4 4-4 9M16 3c0 5-4 6-4 9s4 4 4 9"/>`,
  werben: `<circle cx="9" cy="9" r="3.5"/><path d="M3 20c0-3.6 2.7-6.2 6-6.2s6 2.6 6 6.2M18 8v6M15 11h6"/>`,
  clan:   `<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20c0-3.5 2.7-6 6-6s6 2.5 6 6M10 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/>`
};
function erfolgBild(name){
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ` +
         `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ERFOLG_BILD[name] || ""}</svg>`;
}

function buildErfolge(){
  const box = $("erfList");
  if (!box) return;
  const hat = new Set((istAngemeldet() && Konto.profil.erfolge) || []);
  box.innerHTML = ERFOLG_FAMILIEN.map(f => {
    const da = f.ids.filter(id => hat.has(id)).length;
    const naechste = f.ids.find(id => !hat.has(id));
    const punkte = f.ids.map((id, i) => `<i class="${i < da ? "da" : ""}"></i>`).join("");
    let rechts, unten;
    if (naechste){
      const st = erfolgStand(naechste);
      const anteil = st ? Math.min(1, st.ist / st.ziel) : 0;
      const ehre = ERFOLG_TEXT[naechste][2];
      rechts = `<b>+${ehre.toLocaleString(lang)}</b>`;
      unten = `<span class="ziel">${esc(erfolgLabel(naechste))}</span>` +
              `<span class="bar"><i style="width:${Math.round(anteil*100)}%"></i></span>` +
              `<small>${st ? Math.min(st.ist, st.ziel).toLocaleString(lang) + " / " + st.ziel.toLocaleString(lang) : ""}</small>`;
    } else {
      rechts = `<b class="fertig">✓</b>`;
      unten = `<span class="ziel fertig">${esc(t("e_alle"))}</span>`;
    }
    return `<div class="erfZ${naechste ? "" : " done"}">` +
           `<div class="bild">${erfolgBild(f.bild)}</div>` +
           `<div class="mitte"><div class="kopf"><span class="titel">${esc(t("ef_" + f.art.slice(2)))}</span>` +
           `<span class="stufen">${punkte}</span></div><div class="fort">${unten}</div></div>` +
           `<div class="rechts">${rechts}<small>${naechste ? esc(t("e_naechste")) : ""}</small></div></div>`;
  }).join("");
  $("erfNote").textContent = istAngemeldet()
    ? t("e_stand", hat.size, ERFOLG_REIHE.length)
    : t("e_konto");
  $("erfNote").className = "notice" + (istAngemeldet() ? "" : " warn");
}


/* =====================================================================
   6f) PASSWORT VERGESSEN UND ADRESSE BESTÄTIGEN
   Zwei Wege in denselben Bildschirm: „Passwort vergessen" fragt nach der
   Adresse, ein Link aus der Mail setzt gleich ein neues Passwort.
   ===================================================================== */

let pwMarke = null;

function pwMeldung(text, art){
  const n = $("pwNote");
  n.textContent = text || "";
  n.className = "notice" + (art ? " " + art : "");
}

/* `marke` gesetzt heißt: Der Spieler kommt aus der Mail und darf gleich ein
   neues Passwort wählen. Ohne Marke wird erst nach der Adresse gefragt. */
function pwZeigen(marke){
  pwMarke = marke || null;
  $("pwAskForm").hidden = !!pwMarke;
  $("pwSetForm").hidden = !pwMarke;
  $("pwHead").textContent = t("p_head");
  $("pwMail").value = ""; $("pwNew").value = "";
  // Kein Hinweis: „Neues Passwort wählen" steht schon über dem Formular.
  pwMeldung("");
  show("pwVeil");
  setTimeout(() => { try { $(pwMarke ? "pwNew" : "pwMail").focus(); } catch(_){} }, 50);
}

$("acctForgot").addEventListener("click", () => pwZeigen(null));
$("pwClose").addEventListener("click", () => {
  show(Konto.angemeldet() ? "startVeil" : "accountVeil");
});

$("pwAskForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (Konto.laeuft) return;
  const email = $("pwMail").value.trim();
  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email))
    return pwMeldung(t("e_email"), "warn");

  Konto.laeuft = true; $("pwAsk").disabled = true;
  pwMeldung(t("p_wait"));
  const a = await Konto.pwVergessen(email);
  Konto.laeuft = false; $("pwAsk").disabled = false;

  if (a.fehler === "versand_aus") return pwMeldung(t("p_off"), "warn");
  if (a.fehler) return pwMeldung(t("e_net"), "warn");
  /* Bewusst dieselbe Auskunft, ob es die Adresse gibt oder nicht. */
  pwMeldung(t("p_sent"), "good");
});

$("pwSetForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (Konto.laeuft || !pwMarke) return;
  const pw = $("pwNew").value;
  if (pw.length < 8) return pwMeldung(t("e_pwshort"), "warn");

  Konto.laeuft = true; $("pwSave").disabled = true;
  pwMeldung(t("p_wait"));
  const a = await Konto.pwSetzen(pwMarke, pw);
  Konto.laeuft = false; $("pwSave").disabled = false;
  $("pwNew").value = "";

  if (a.fehler === "marke_ungueltig"){ pwMarke = null; return pwMeldung(t("p_bad"), "warn"); }
  if (a.fehler) return pwMeldung(t("e_net"), "warn");

  /* Das Passwortsetzen schließt alle Sitzungen des Kontos und öffnet eine
     neue — man ist also sofort angemeldet. */
  pwMarke = null;
  nachAnmeldung();
  toast(t("p_done"));
});

/* Marke aus der Adresszeile. Sie steht im Anker (`#pw=` / `#ok=`), nicht in
   der Abfragezeichenfolge: Ein Anker wird vom Browser nie an einen Server
   geschickt und landet damit in keinem Zugriffsprotokoll.

   Danach wird der Anker entfernt — sonst bleibt der Schlüssel zum Konto in
   der Adresszeile und im Verlauf stehen. */
async function markeAusAdresse(){
  let anker = "";
  try { anker = (location.hash || "").replace(/^#/, ""); } catch(_){ return false; }
  if (!anker) return false;

  const p = new URLSearchParams(anker);
  const neu = p.get("pw"), ok = p.get("ok");
  /* Rückweg von Google oder Facebook: Das fertige Sitzungstoken steht im
     Anker, nie in der Abfragezeichenfolge — ein Anker wird vom Browser nicht
     mitgeschickt und steht deshalb in keinem Serverprotokoll. */
  const tok = p.get("tok"), fremdFehler = p.get("oauth");
  if (!neu && !ok && !tok && !fremdFehler) return false;

  try { history.replaceState(null, "", location.pathname + location.search); } catch(_){}

  if (tok){
    let begonnen = 0;
    try {
      begonnen = +sessionStorage.getItem("talumi.oauth") || 0;
      sessionStorage.removeItem("talumi.oauth");
    } catch(_){}
    if (!begonnen || Date.now() - begonnen > 30 * 60 * 1000){
      kontoMeldung(t("k_fremd_fehler"), "warn");
      return true;
    }
    Konto.merken(tok);
    if (await Konto.wiederaufnehmen()){
      nachAnmeldung();
      return true;
    }
    Konto.merken(null);
    kontoMeldung(t("k_fremd_fehler"), "warn");
    return true;
  }
  if (fremdFehler){
    /* „abgebrochen" heißt, der Spieler hat beim Anbieter selbst abgebrochen.
       Das ist kein Fehler und braucht keine rote Meldung — aber eine, die
       noch von einem vorigen Versuch steht, muss weg. Sonst steht über einem
       leeren Formular eine Warnung, die zu nichts mehr gehört. */
    if (fremdFehler === "abgebrochen") kontoMeldung("");
    else kontoMeldung(t("k_fremd_fehler"), "warn");
    return true;
  }

  if (neu){ pwZeigen(neu); return true; }

  const a = await Konto.bestaetigen(ok);
  /* Läuft ohne Anmeldung: Wer den Link auf einem anderen Gerät öffnet, soll
     die Adresse trotzdem bestätigen können. */
  kontoMeldung(t(a.ok ? "p_confirmed" : "p_confirmbad"), a.ok ? "good" : "warn");
  return false;
}

/* Ändert sich nur der Anker, lädt der Browser die Seite **nicht** neu. Wer
   die Seite schon offen hat und dann den Link aus der Mail anklickt, sähe
   sonst gar nichts passieren. */
window.addEventListener("hashchange", () => { markeAusAdresse(); });

/* Gastfortschritt auch sichern, wenn mitten in der Runde geschlossen wird —
   offline vergibt `addXpLive()` XP unterwegs, und das soll nicht verfallen,
   nur weil der Tab zugeht statt der Runde. */
window.addEventListener("pagehide", () => Gast.sichern());
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") Gast.sichern();
});

/* Gemerkte Sitzung wieder aufnehmen. Steht bewusst am Dateiende: Das
   Konto-Modul wird mit `const` angelegt und ist vorher noch nicht benutzbar.
   Läuft nebenher, damit der Anmeldebildschirm sofort bedienbar ist — auch
   wenn der Server langsam antwortet oder gar nicht. Wer schon angemeldet ist,
   landet ohne Umweg im Menü. */
(async () => {
  /* Zuerst anklopfen, in jedem Fall: Von dieser Antwort hängt ab, ob es
     überhaupt ein Formular gibt und ob der Server Mails verschicken kann. */
  const da = await Konto.anklopfen();

  if (da){
    $("acctForgot").hidden = !Konto.versand;
    // Kommt der Spieler aus einer Mail, geht das vor allem anderen.
    const ausMail = await markeAusAdresse();

    if (Konto.gemerkt()){
      if (!ausMail) kontoMeldung(t("k_wait"));
      if (await Konto.wiederaufnehmen()){
          if (ausMail){ paintPurse(); buildGrid(); buildRecords(); paintBonus(); paintRank(); }
        else if (!$("accountVeil").hidden) nachAnmeldung();
        else { paintPurse(); buildGrid(); buildRecords(); paintBonus(); paintRank(); }
        return;
      }
    }
    if (!ausMail && !$("pwNote").textContent) kontoMeldung("");
    return;
  }

  /* Kein Server: Das Formular verschwindet, „Ohne Konto spielen" bleibt und
     wird zum Hauptknopf. Erklärt wird der Grund einmal, statt ihn bei jedem
     Anmeldeversuch neu zu melden. */
  for (const id of ["acctForm", "acctSwap", "acctForgot", "anmFremd"])
    { const el = $(id); if (el) el.hidden = true; }
  $("guestBtn").classList.remove("quiet");
  kontoMeldung(t("k_offline"));
})();

/* =====================================================================
   Sternenhimmel hinter den Menüs (Schritt 88)

   Vor dem ersten Start lief die Zeichenschleife gar nicht — die Fläche
   hinter Anmeldung und Konsole war deshalb schwarz, und beide sahen aus wie
   eine Seite, nicht wie ein Spiel. Genau das war Thomas' Einwand am
   14.09.2026: „das Startmenü vor Login sieht noch richtig altmodisch aus".

   Was hier gezeichnet wird, ist absichtlich wenig: ein driftendes Sternenfeld
   und ein paar sehr dunkle Körper weit hinten. Kein Spielfeld, keine Trümmer,
   keine Bewegung, die vom Menü ablenkt.

   Vier Regeln, damit das niemandem den Akku kostet:
     - Sie läuft **nur**, solange ein Menü offen und kein Spiel im Gang ist.
     - Sie hält an, sobald der Tab verdeckt ist (`document.hidden`).
     - Sie zeichnet höchstens 30 Bilder je Sekunde, nicht 60.
     - `lowPower` und „Bewegung reduzieren" halbieren noch einmal bzw. legen
       das Feld still — dann steht es einfach, statt zu driften.
   ===================================================================== */
const MenueHimmel = {
  punkte: null, koerper: null, breite: 0, hoehe: 0, laeuft: false,
  zuletzt: 0, zeit: 0,

  /* Erst bauen, wenn die Größe feststeht — und neu bauen, wenn sie sich
     ändert. Ein Feld, das für 1920 Punkte gewürfelt wurde, ist auf einem
     Telefon zu dicht und andersherum zu leer. */
  aufbauen(){
    const w = VW || innerWidth || 1, h = VH || innerHeight || 1;
    if (this.punkte && Math.abs(w - this.breite) < 40 && Math.abs(h - this.hoehe) < 40) return;
    this.breite = w; this.hoehe = h; this.fertig = false;
    /* Gemessen, nicht geschätzt: Bei 13.000 kamen auf einem 1280er Schirm
       71 Sterne heraus — zu wenige, um als Feld gelesen zu werden. */
    const dichte = Settings.lowPower ? 11000 : 5200;
    const zahl = Math.min(560, Math.round(w * h / dichte));
    const z = () => Math.random();
    this.punkte = Array.from({length: zahl}, () => ({
      x: z() * w, y: z() * h,
      r: z() * 1.35 + .4,
      /* Kräftiger als im Spielfeld: Dort liegt das ganze Bild voller Körper,
         hier ist der Himmel das einzige, was den Bildschirm trägt. */
      a: z() * .62 + .2,
      /* Drei Ebenen: Je heller und größer ein Stern, desto schneller zieht
         er — daraus entsteht Tiefe ohne ein zweites Bild. */
      v: (z() * .5 + .12) * 6,
      f: z() * 6.28,
    }));
    /* Drei bis fünf dunkle Körper weit hinten. Sie sind fast unsichtbar und
       geben dem Bild trotzdem einen Maßstab. */
    this.koerper = Array.from({length: Settings.lowPower ? 2 : 4}, (_, i) => ({
      x: z() * w, y: z() * h,
      r: (z() * .13 + .07) * Math.min(w, h),
      a: z() * .05 + .025,
      vx: (z() - .5) * 2.2, vy: (z() - .5) * 1.4,
      ton: z(),
    }));
  },

  /* Ist gerade ein Menü zu sehen, hinter dem es nichts zu sehen gibt?

     `endVeil` steht bewusst **nicht** in der Liste: Dahinter liegt das
     eingefrorene Spielfeld mit dem eigenen Körper und dem, was ihn gefressen
     hat. Das durch ein Sternenfeld zu ersetzen hieße, dem Spieler die
     Antwort auf „was ist gerade passiert" wegzunehmen. `testVeil` ebenso —
     dort läuft die Eingabeprüfung auf der Fläche. */
  MENUES: ["accountVeil","startVeil","legalVeil","friendsVeil","meldeVeil",
           "setVeil","rankVeil","pwVeil","pwaVeil","clanVeil","hilfeVeil","bonusVeil"],
  sichtbar(){
    if (Game.running) return false;
    if (document.hidden) return false;
    const ende = document.getElementById("endVeil");
    if (ende && !ende.hidden) return false;
    for (const id of this.MENUES){
      const el = document.getElementById(id);
      if (el && !el.hidden) return true;
    }
    return false;
  },

  /* Ein Körper als fertiges Bild. Wird einmal je Körper gebaut. */
  stempeln(k){
    const d = Math.max(2, Math.ceil(k.r * 2));
    const c = document.createElement("canvas");
    c.width = d; c.height = d;
    const g2 = c.getContext("2d");
    const g = g2.createRadialGradient(k.r * .7, k.r * .7, k.r * .1, k.r, k.r, k.r);
    g.addColorStop(0, `rgba(${Math.round(120 + k.ton * 60)},${Math.round(110 + k.ton * 40)},${Math.round(150 - k.ton * 30)},${k.a})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    g2.fillStyle = g;
    g2.beginPath(); g2.arc(k.r, k.r, k.r, 0, 7); g2.fill();
    return c;
  },

  bild(jetzt){
    const ruhig = matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dt = this.zuletzt ? Math.min(.1, (jetzt - this.zuletzt) / 1000) : 0;
    this.zuletzt = jetzt;
    if (!ruhig) this.zeit += dt;

    this.aufbauen();
    const th = TH();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = th.ink;
    ctx.fillRect(0, 0, VW, VH);

    /* Die dunklen Körper zuerst — sie liegen hinter allem.

       Jeder wird **einmal** auf eine eigene kleine Fläche gemalt und danach
       nur noch kopiert. Vier große Radialverläufe bei jedem Bild neu zu
       erzeugen kostete gemessen bis zu 21 ms; kopiert sind es Bruchteile
       davon. Ein Verlauf hängt nur an Größe und Farbton, nicht an der
       Stelle — er muss also nie neu entstehen. */
    ctx.save();
    for (const k of this.koerper){
      if (!k.stempel) k.stempel = this.stempeln(k);
      const x = (k.x + k.vx * this.zeit) % (VW + k.r * 2) - k.r;
      const y = (k.y + k.vy * this.zeit) % (VH + k.r * 2) - k.r;
      ctx.drawImage(k.stempel, x - k.r, y - k.r);
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = th.star;
    for (const s of this.punkte){
      /* Waagerechtes Driften mit Umbruch am Rand — billiger als eine echte
         Kamera und für einen Hintergrund völlig ausreichend. */
      let x = s.x - s.v * this.zeit;
      x = ((x % (VW + 8)) + VW + 8) % (VW + 8) - 4;
      /* Ein sanftes Atmen statt Blinken: Blinkende Sterne ziehen den Blick
         vom Menü weg, und darum geht es hier gerade nicht. */
      ctx.globalAlpha = ruhig ? s.a : s.a * (.72 + .28 * Math.sin(this.zeit * .7 + s.f));
      ctx.beginPath(); ctx.arc(x, s.y, s.r, 0, 7); ctx.fill();
    }
    ctx.restore();
  },

  /* Kein eigener Taktgeber: `draw()` laeuft ohnehin bei jedem Bild und
     zeichnet auf dieselbe Flaeche. Zwei Schleifen auf einer Zeichenflaeche
     waeren ein Flackern — deshalb ruft `draw()` diesen Himmel auf, solange
     keine Runde laeuft. */
  letztesBild: 0,
  vielleichtZeichnen(jetzt){
    if (!this.sichtbar()){ this.zuletzt = 0; this.fertig = false; return false; }

    /* „Bewegung reduzieren": Dann wird der Himmel **einmal** gemalt und
       bleibt stehen. Das ist nicht nur die richtige Antwort auf die
       Einstellung, es ist auch die billigste: keine Bildfolge, keine Last.
       Auch jeder Prüfstand, der ein Bildschirmfoto braucht, setzt sie —
       ein Bild von einer Fläche, die sich dauernd ändert, lässt sich nicht
       zuverlässig aufnehmen. */
    const ruhig = matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (ruhig){
      if (this.fertig) return true;
      this.fertig = true;
      try { this.bild(jetzt); } catch(_){}
      return true;
    }

    /* Zwölf Bilder je Sekunde, bei sparsamer Einstellung acht. Die Sterne
       ziehen so langsam, dass mehr niemand sieht — gemessen kostet jedes
       Bild rund 1,4 ms, und das ist Last, die ein Hintergrund nicht
       verdient. Bei 60 Bildern wäre es das Fünffache. */
    const abstand = Settings.lowPower ? 125 : 83;
    if (this.letztesBild && jetzt - this.letztesBild < abstand) return true;
    this.letztesBild = jetzt;
    try { this.bild(jetzt); } catch(_){}
    return true;
  },
};

/* =====================================================================
   „Zum Startbildschirm hinzufügen" (Schritt 92)

   Thomas am 15.09.2026: „Ich greife mit der App nur auf das Web zu. Habe
   deshalb oben einen Refresh Button und teilen Button. Wie bekomme ich eine
   richtige App auf Handy?"

   Das Spiel **ist** seit Langem als App installierbar — `manifest.json` mit
   `display: fullscreen`, ein Dienst-Worker, HTTPS. Nur gesagt hat es nie
   jemand. Installiert verschwinden Adresszeile und Werkzeugleiste, und das
   Spiel startet auch ohne Netz.

   Die beiden Systeme funktionieren grundverschieden:

   - **Android und andere Chromium-Browser** melden von sich aus, dass eine
     Installation möglich ist (`beforeinstallprompt`). Der Browser darf aber
     nur nach einem Klick fragen — deshalb wird das Ereignis aufgehoben und
     erst beim Knopfdruck eingelöst.
   - **iPhone und iPad kennen dieses Ereignis nicht.** Safari lässt keine
     Anfrage zu; der Weg führt allein über das Teilen-Symbol. Dort bleibt
     nur, ihn zu zeigen. (Nachgelesen 15.09.2026: Apple hat das bis heute
     nicht geöffnet.)

   Drei Regeln, damit daraus keine Nervensäge wird:
   - **Kein Banner, das von selbst aufgeht.** Es gibt einen Knopf in der
     Kopfzeile, mehr nicht. Wer ihn nicht drückt, sieht nie etwas.
   - **Der Knopf erscheint nur, wenn es etwas zu tun gibt**: nicht im
     Vollbild (dann läuft das Spiel schon als App), nicht am Rechner mit
     Maus, und auf Android erst, wenn der Browser die Bereitschaft meldet.
   - **Nach der Installation verschwindet er** von selbst, ohne Neuladen.
   ===================================================================== */
const PWA = {
  angebot: null,          // das aufgehobene Ereignis (nur Chromium)

  /* Läuft das Spiel schon als App? Zwei Wege, weil iOS den ersten nicht
     kennt und Android den zweiten nicht. */
  installiert(){
    try {
      if (matchMedia("(display-mode: standalone)").matches) return true;
      if (matchMedia("(display-mode: fullscreen)").matches) return true;
    } catch(_){}
    return !!navigator.standalone;        // Safari auf iPhone und iPad
  },

  /* iPhone oder iPad? Neuere iPads melden sich als Mac — deshalb zusätzlich
     die Frage nach dem Tippbildschirm. */
  apple(){
    const u = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/.test(u)) return true;
    return /Macintosh/.test(u) && navigator.maxTouchPoints > 1;
  },

  /* Lohnt sich der Knopf überhaupt? Am Rechner mit Maus nicht: Dort stört
     keine Adresszeile, und ein Fenster ist kein Startbildschirm. */
  moeglich(){
    if (Portal.name) return false;      // Portale verbieten Wege aus ihrer Seite heraus
    if (this.installiert()) return false;
    if (!isTouch) return false;
    return !!this.angebot || this.apple();
  },

  knopfPruefen(){
    const b = document.getElementById("pwaBtn");
    if (b) b.hidden = !this.moeglich();
  },

  zeigen(){
    const ios = this.apple() && !this.angebot;
    const s = id => { const e = document.getElementById(id); if (e) e.hidden = true; };
    const z = id => { const e = document.getElementById(id); if (e) e.hidden = false; };
    (ios ? z : s)("pwaIos");
    (ios ? s : z)("pwaAnd");
    (ios ? s : z)("pwaGo");
    show("pwaVeil");
  },

  /* Der Knopf im Fenster: Hier wird das aufgehobene Ereignis eingelöst.
     Es gilt **genau einmal** — danach ist es verbraucht, egal wie der
     Spieler entschieden hat. */
  async einloesen(){
    if (!this.angebot) return;
    const angebot = this.angebot;
    this.angebot = null;
    try {
      angebot.prompt();
      await angebot.userChoice;
    } catch(_){}
    this.knopfPruefen();
    show("startVeil");
  },

  start(){
    addEventListener("beforeinstallprompt", e => {
      /* Ohne das zeigt Chrome seine eigene Leiste unten im Bild — genau die
         Art Einblendung, die auf einem flachen Schirm das Spiel verdeckt. */
      e.preventDefault();
      this.angebot = e;
      this.knopfPruefen();
    });
    /* Fertig installiert: Der Knopf hat seinen Zweck erfüllt. */
    addEventListener("appinstalled", () => {
      this.angebot = null;
      this.knopfPruefen();
      try { toast(t("pwa_head")); } catch(_){}
    });
    const b = document.getElementById("pwaBtn");
    if (b) b.addEventListener("click", () => this.zeigen());
    const g = document.getElementById("pwaGo");
    if (g) g.addEventListener("click", () => this.einloesen());
    const c = document.getElementById("pwaClose");
    if (c) c.addEventListener("click", () => show("startVeil"));
    this.knopfPruefen();
  },
};
PWA.start();
