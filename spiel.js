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

const cvs = document.getElementById("sky");
const ctx = cvs.getContext("2d");
let DPR = 1, VW = 0, VH = 0, FIT = 1;

/* Sichtfeld-Parität: Auf jedem Gerät soll gleich viel Spielfeld zu sehen
   sein. Bezug ist ein Desktopfenster von rund 1440 × 810, verglichen über
   das geometrische Mittel — damit hängt die Fläche nicht am Seitenverhältnis. */
const REF_VIEW = Math.sqrt(1440 * 810);

const isTouch = matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
if (isTouch) document.body.classList.add("touch");

function resize(){
  /* Füllrate ist die Hauptursache für warme Handys: Bei Faktor 1,75 sind das
     auf einem 844×390-Schirm rund 60 Millionen Bildpunkte pro Sekunde. Auf
     1,25 gesenkt halbiert sich das fast. Sichtbar ist der Unterschied bei
     einem dunklen Spiel mit weichen Kanten kaum, spürbar dagegen deutlich. */
  const cap = Math.min(innerWidth, innerHeight) < 500 ? 1.25 : 2;
  DPR = Math.min(devicePixelRatio || 1, cap);
  VW = innerWidth; VH = innerHeight;
  cvs.width = Math.round(VW*DPR); cvs.height = Math.round(VH*DPR);
  FIT = Math.sqrt(VW*VH) / REF_VIEW;
  checkOrientation();
}
addEventListener("resize", resize);
addEventListener("orientationchange", () => setTimeout(resize, 120));

let portrait = false;
function checkOrientation(){
  portrait = isTouch && VH > VW;
  document.body.classList.toggle("portrait", portrait);
}
resize();

const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const rnd = (a,b) => a + Math.random()*(b-a);
const avg = a => a.reduce((s,x)=>s+x,0)/(a.length||1);
const sd  = a => { const m = avg(a); return Math.sqrt(avg(a.map(x=>(x-m)*(x-m)))); };
const $ = id => document.getElementById(id);
/* Einstellungen. Sitzungsweit, aber bewusst als eigenes Objekt gebaut —
   sobald es Konten gibt, wandert genau dieses Objekt auf den Server. */
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
   zwischen zwei Unterbrechungen. Die Recherche zu Agar.io nennt Werbung nach
   jedem Tod als lautesten Beschwerdegrund — das darf hier technisch nicht
   passieren können. */
const Portal = {
  ready:false, lastBreak:0, deaths:0, sinceAd:0,
  started: performance.now()/1000,

  /* Werberegeln als Code, nicht als Vorsatz.
     Vier Bedingungen müssen ALLE erfüllt sein, bevor eine Unterbrechung kommt:

     MIN_DEATHS   mindestens vier Tode seit der letzten Werbung
     MIN_BREAK    mindestens drei Minuten seit der letzten Werbung
     GRACE_DEATHS die ersten drei Tode bleiben frei
     GRACE_TIME   die ersten fünf Minuten einer Sitzung bleiben frei

     Warum nicht nur die Todeszählung: Vier Tode können in vierzig Sekunden
     passieren — Spawn-Tod, früher Royale-Ausstieg, missglückte Teilung. Die
     Werbung träfe dann genau den frustrierten Anfänger. Warum die Schonfrist:
     Wer neu ist, hat sich noch nicht für das Spiel entschieden; eine
     Unterbrechung in den ersten Minuten kostet ihn ganz.

     Unterbrechungen kommen ausschließlich zwischen zwei Runden, nie im Spiel. */
  MIN_BREAK:180, MIN_DEATHS:4, GRACE_DEATHS:3, GRACE_TIME:300,

  loadingStart(){ /* SDK: loadingStart */ },
  loadingStop(){ this.ready = true; /* SDK: loadingStop */ },
  gameplayStart(){ /* SDK: gameplayStart */ },
  gameplayStop(){ /* SDK: gameplayStop */ },

  countDeath(){ this.deaths++; this.sinceAd++; },

  mayBreak(){
    if (!this.ready) return false;
    const now = performance.now()/1000;
    if (this.deaths <= this.GRACE_DEATHS) return false;
    if (now - this.started < this.GRACE_TIME) return false;
    if (this.sinceAd < this.MIN_DEATHS) return false;
    if (now - this.lastBreak < this.MIN_BREAK) return false;
    return true;
  },

  /* Ruft weiter, egal ob Werbung lief — der Spieler wartet nie auf eine
     fehlgeschlagene Anzeige. */
  breakBefore(next){
    if (!this.mayBreak()) return next();
    this.lastBreak = performance.now()/1000;
    this.sinceAd = 0;
    this.gameplayStop();
    // SDK: commercialBreak(next) — bis dahin direkt weiter
    next();
  },

  /* Freiwillige Belohnungswerbung. Bleibt ohne SDK unsichtbar, damit im Spiel
     kein Knopf steht, der nichts tut. */
  rewardAvailable(){ return false; },
  offerReward(onDone){ onDone(false); }
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
  // Platzhalter in Eingabefeldern brauchen eine eigene Runde
  const phs = document.querySelectorAll ? document.querySelectorAll("[data-i18n-ph]") : [];
  for (const el of phs) el.placeholder = t(el.dataset.i18nPh);
  const ctrl = $("controls");
  if (ctrl) ctrl.innerHTML = (isTouch ? t("ctrltouch") : t("ctrlmouse")) +
    "<br>" + t("earned");
  buildModes(); buildStrip(); buildGrid(); paintPurse(); paintIntegrity();
  buildRecords(); buildBoost();
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
    star:"#e8d9bd", border:"#2b1f15", label:"rgba(14,10,7,.78)",
    pulsar:"rgba(44,30,18,.96)", pulsarEdge:"rgba(216,167,95,.7)",
    pulsarCore:"rgba(216,167,95,.2)", zone:"rgba(120,44,18,.34)",
    zoneEdge:"224,122,60", rival:{rock:"#8a7659", dark:"#4a3c2a", hot:"#e07a3c", air:"#d8c4a0"}
  },
  sand: {
    ink:"#e9dcc4", ink2:"#dccdb0", plate:"#f4ebdc", line:"#c2aa86",
    brass:"#8a5a24", paper:"#2c2117", paper2:"#6b5842", ember:"#b8501f", onBrass:"#f7f0e2",
    star:"#a68e68", border:"#c9b590", label:"rgba(250,244,232,.85)",
    pulsar:"rgba(120,96,64,.92)", pulsarEdge:"rgba(70,48,24,.8)",
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
  const meta = document.querySelector && document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", th.ink);
}

const Settings = {
  volume:0.22, shake:true, sens:62, lefty:false,
  teams:"classic", labels:"all", lowPower:false, hudEdge:8, hints:true,
  theme:"earth"
};


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
  b.style.background = Integrity.score>70 ? "#6f9ec4" : Integrity.score>40 ? "#d8b25f" : "#ff7a45";
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
    $("powText").textContent = "Entry proof: " + n.toLocaleString(lang) + " attempts…";
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



/* 42 Oberflächen. Alle erspielbar: 21 über Level, 21 über Ore.
   Die Ore-Skins tragen die ersten Stunden, die Level-Skins die lange Strecke.
   Antimatter sitzt auf Level 100 — dem Ende der Leiter. */
const SKINS = [
  {id:"basalt",     label:"Basalt",       rock:"#6d7688", dark:"#454e5f", hot:"#ff7a45", air:"#7fb0e8", lv:1},
  {id:"regolith",   label:"Regolith",     rock:"#8a8578", dark:"#55524a", hot:"#ffb86b", air:"#cfc6ae", lv:2},
  {id:"iron",       label:"Iron",         rock:"#8d6a55", dark:"#5a4132", hot:"#ffb03a", air:"#e0a37a", lv:3},
  {id:"copper",     label:"Copper",       rock:"#b07a4a", dark:"#6e472a", hot:"#ffc36b", air:"#e8b98a", ore:500},
  {id:"ice",        label:"Ice",          rock:"#9fc4d8", dark:"#65899f", hot:"#8fe3ff", air:"#cfeaff", lv:5},
  {id:"jade",       label:"Jade",         rock:"#5f9c82", dark:"#365c4d", hot:"#7fffc4", air:"#a9e7cf", ore:800},
  {id:"ash",        label:"Ash",          rock:"#7a7a80", dark:"#494950", hot:"#ff5f3a", air:"#b9b9c4", lv:7},
  {id:"ember",      label:"Ember",        rock:"#a4503c", dark:"#5f2a1e", hot:"#ff9b2f", air:"#ff9a72", ore:1200},
  {id:"cobalt",     label:"Cobalt",       rock:"#4d68b5", dark:"#2b3c72", hot:"#6fa8ff", air:"#93b4ff", lv:9},
  {id:"sulfur",     label:"Sulfur",       rock:"#c2b24a", dark:"#75692a", hot:"#fff06b", air:"#ecd97f", ore:1600},
  {id:"obsidian",   label:"Obsidian",     rock:"#3a3d4a", dark:"#1e2029", hot:"#c05cff", air:"#7d6ea8", lv:12},
  {id:"quartz",     label:"Rose Quartz",  rock:"#c98d9c", dark:"#7d5460", hot:"#ff9ec4", air:"#f2c3d1", ore:2400},
  {id:"verdant",    label:"Verdant",      rock:"#6f9a45", dark:"#3f5b26", hot:"#c8ff5c", air:"#b7e08a", lv:15},
  {id:"tungsten",   label:"Tungsten",     rock:"#7f8794", dark:"#4a5058", hot:"#dfe9f5", air:"#b6c2d0", ore:3200},
  {id:"mercury",    label:"Mercury",      rock:"#a9b3bd", dark:"#5f686f", hot:"#e8f4ff", air:"#dbe6ef", lv:20},
  {id:"malachite",  label:"Malachite",    rock:"#3f8f6a", dark:"#20553d", hot:"#6bffb0", air:"#8fdcb6", ore:4400},
  {id:"amber",      label:"Amber",        rock:"#c98f2e", dark:"#7a5212", hot:"#ffd166", air:"#f0c27a", ore:6000},
  {id:"nebula",     label:"Nebula",       rock:"#7a5aa8", dark:"#432f63", hot:"#ff6bd6", air:"#c39bff", lv:25},
  {id:"cinnabar",   label:"Cinnabar",     rock:"#a83f3a", dark:"#61201d", hot:"#ff6b4a", air:"#e08b7a", ore:8400},
  {id:"glacier",    label:"Glacier",      rock:"#7fb3c9", dark:"#48748a", hot:"#b8f0ff", air:"#dff3ff", lv:30},
  {id:"rust",       label:"Rust",         rock:"#9c5a33", dark:"#5c3218", hot:"#ff8f3a", air:"#d99a6a", ore:11600},
  {id:"indigo",     label:"Indigo",       rock:"#4a4a9c", dark:"#28285e", hot:"#8f8fff", air:"#a3a3e8", ore:16000},
  {id:"aurora",     label:"Aurora",       rock:"#3f8f8a", dark:"#1f5450", hot:"#5cffb0", air:"#8ef0d8", lv:36},
  {id:"saffron",    label:"Saffron",      rock:"#cf9236", dark:"#7d5417", hot:"#ffd98f", air:"#f2cd8a", ore:22000},
  {id:"pearl",      label:"Pearl",        rock:"#d6cec0", dark:"#8a8377", hot:"#fff6e8", air:"#f0e8da", ore:30000},
  {id:"onyx",       label:"Onyx",         rock:"#2f313b", dark:"#17181e", hot:"#8f9bff", air:"#5a6180", lv:42},
  {id:"peridot",    label:"Peridot",      rock:"#8fae3a", dark:"#556a1c", hot:"#d8ff6b", air:"#c2dc8a", ore:42000},
  {id:"magnetite",  label:"Magnetite",    rock:"#4a4f5c", dark:"#262a33", hot:"#ff5c8f", air:"#8a93a8", ore:58000},
  {id:"solaris",    label:"Solaris",      rock:"#d19a3a", dark:"#8a5c14", hot:"#fff3a0", air:"#ffd884", lv:50},
  {id:"corona",     label:"Corona",       rock:"#d4643a", dark:"#7d2f16", hot:"#ffb06b", air:"#ffb08f", ore:80000},
  {id:"titan",      label:"Titan",        rock:"#8a94a8", dark:"#4c5464", hot:"#cfe8ff", air:"#b3c4d8", lv:58},
  {id:"halide",     label:"Halide",       rock:"#6ba8b5", dark:"#376a75", hot:"#a0ffee", air:"#b8e8f0", ore:110000},
  {id:"bismuth",    label:"Bismuth",      rock:"#8f6bb5", dark:"#4e3670", hot:"#ff9bd6", air:"#d0a8e8", ore:150000},
  {id:"crimson",    label:"Crimson Dust", rock:"#a83a55", dark:"#5f1a2b", hot:"#ff5c7a", air:"#e08a9c", lv:66},
  {id:"zircon",     label:"Zircon",       rock:"#7f9bd6", dark:"#43578a", hot:"#c4dcff", air:"#c2d4f0", ore:210000},
  {id:"plasma",     label:"Plasma",       rock:"#b53a8f", dark:"#69184f", hot:"#ff6bff", air:"#ff9be8", lv:74},
  {id:"horizon",    label:"Event Horizon",rock:"#2a2f4a", dark:"#141728", hot:"#6b8fff", air:"#4a5c9c", ore:290000},
  {id:"quasar",     label:"Quasar",       rock:"#d6b03a", dark:"#7d6414", hot:"#fffcb0", air:"#ffe89b", lv:82},
  {id:"primordial", label:"Primordial",   rock:"#6b5a3a", dark:"#3a3020", hot:"#ffd98f", air:"#c4b08a", ore:400000},
  {id:"singularity",label:"Singularity",  rock:"#1e2030", dark:"#0d0e16", hot:"#a05cff", air:"#5c4a8a", lv:90},
  {id:"void",       label:"Void",         rock:"#2a2c38", dark:"#14151d", hot:"#5c7bff", air:"#4c5a8a", lv:95},
  {id:"antimatter", label:"Antimatter",   rock:"#5b2f5e", dark:"#2c1430", hot:"#ff2fb0", air:"#ff8ce0", lv:100},

  /* Stufe VI. Vier Stück, sehr teuer, mit Effekten, die keine andere
     Oberfläche hat. Bewusst nur über Ore — keine Levelbindung, damit sie
     unabhängig von der Leiter ein eigenes Ziel bilden.
     Regel wie überall: Der massive Kreis und der scharfe Rand bleiben exakt
     auf dem echten Radius. Alles Zusätzliche liegt durchscheinend darüber,
     sonst täuscht ein teurer Skin über die Reichweite. */
  {id:"eventide",  label:"Eventide",   rock:"#4a3f6b", dark:"#221c38", hot:"#b58cff", air:"#d6c2ff",
   ore:800000,  special:"trail"},
  {id:"halo",      label:"Halo",       rock:"#c9b76a", dark:"#6e5a1f", hot:"#fff2b0", air:"#ffe58a",
   ore:1100000, special:"halo"},
  {id:"singular",  label:"Singularity",rock:"#141622", dark:"#05060b", hot:"#8fb4ff", air:"#5c74b8",
   ore:1500000, special:"warp"},
  {id:"prism",     label:"Prism",      rock:"#8f8fa8", dark:"#3f3f52", hot:"#ffffff", air:"#e8e8f5",
   ore:2000000, special:"prism"}
];

/* Stufenprämien: erreichte Spitzenmasse zahlt sprunghaft, nicht nur linear.
   Damit lohnt sich das Weiterwachsen statt frühem Sterben und Neustarten. */
/* Auf ein Drittel gesenkt (10.09.2026). Vorher brachte eine gute Runde rund
   2.000 Ore und die teuerste Oberfläche war in zwanzig Stunden erreicht — zu
   billig für eine Währung, die auch den Startbonus kauft. Jetzt rund 700 je
   guter Runde, etwa 3.300 pro Stunde, teuerste Oberfläche rund sechzig Stunden. */
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
     LUMI ist die bezahlte Währung und kauft ausschließlich Oberflächen, und
     zwar nur die, die es ohnehin für Ore gibt. Level-Oberflächen bleiben
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
   2b) SOUND
   Alles synthetisch über die Web Audio API — keine Dateien, keine fremden
   Rechte, kein Ladebalken. Der Kontext darf erst nach einer Nutzergeste
   starten, deshalb wird er am Startknopf geweckt.
   ===================================================================== */
const Sound = {
  ctx:null, bus:null, on:true, noise:null, last:0,

  unlock(){
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
  clan: {
    label:"Clan battle", blurb:"Two clans, mirrored arena, five minutes. Highest clan mass wins.",
    world:5200, debris:1500, rivals:18, pulsars:14, start:40,
    teams:true, mirror:true, time:300, rewards:1
  },
  royale: {
    label:"Battle royale", blurb:"Everyone starts equal, the field closes in. Last body standing wins.",
    world:6000, debris:2000, rivals:24, pulsars:20, start:50,
    teams:false, mirror:false, time:330, rewards:1, royale:true
  },
  friendly: {
    label:"Friendly match", blurb:"Mirrored arena, everyone starts equal. Practice — no rewards.",
    world:4200, debris:1000, rivals:10, pulsars:10, start:60,
    teams:false, mirror:true, time:240, rewards:0
  }
};
let modeId = "open";
const MODE = () => MODES[modeId];

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

const Game = {running:false, debris:[], rivals:[], shed:[], cells:[], pulsars:[],
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
const PULSAR_R = 52, PULSAR_BITE = 240, PULSAR_MAX = 22, PULSAR_FEED = 5;

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

const newDebris = () => ({x:rnd(0,WORLD), y:rnd(0,WORLD), m:1,
  c:`hsl(${rnd(196,232)} ${rnd(18,40)}% ${rnd(58,78)}%)`, r:rnd(2.6,4.4)});
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
  stars = Array.from({length: Math.round(WORLD*WORLD/(Settings.lowPower ? 260000 : 110000))}, () => ({
    x:rnd(0,WORLD), y:rnd(0,WORLD), r:rnd(.5,1.5), a:rnd(.15,.7), d:rnd(.25,.7)}));
};
seedStars();

function start(name){
  const M = MODE();
  WORLD = M.world; DEBRIS = M.debris;
  seedStars();

  Game.name = cleanName(name) || "Unnamed body";
  Game.debris = Array.from({length:DEBRIS}, newDebris);
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
  Game.zoneR = Game.royale ? zoneRadius(0) : 0;
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
  let startMass = M.start;
  if (modeId === "open" && Profile.boost > 1){
    const cost = BOOST_COST[Profile.boost];
    if (Profile.ore >= cost){
      Profile.ore -= cost;
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
  Net.join({name: Game.name, skin: skin.id});
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
function split(){
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
  ring(cx, cy, radiusOf(Math.max(30, Game.cells.reduce((s,c)=>s+c.m,0)))*4.5, "#d8b25f");
  burst(cx, cy, 26, "#d8b25f", 420);
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
  Sound.shatter(); ring(cell.x, cell.y, radiusOf(cell.m)*2.4, "#8fe3ff");
  Game.shake = Math.min(1, Game.shake + .6);
  /* Wie im Vorbild: Ein großer Restkörper bleibt, drumherum fliegen mehrere
     kleine weg. Sechzehn gleich große Krümel wären zu viel — dann ist man
     sofort erledigt statt angeschlagen.
     Der Mutterkörper behält 45 %, der Rest verteilt sich auf höchstens acht
     Stücke, deren Zahl an der Masse hängt: Kleine zerfallen in wenige große,
     Große in viele kleine. 15 % gehen beim Aufprall verloren. */
  const room = MAX_CELLS - Game.cells.length;
  if (room <= 0){ cell.m *= .82; return; }
  const gesamt = cell.m * .85;
  const mutter = gesamt * .45;
  const rest   = gesamt - mutter;
  const minStk = Math.max(35, gesamt*.06);
  const parts  = clamp(Math.floor(rest/minStk), 2, Math.min(room, 8));
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

function step(dt){
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

  for (const r of Game.rivals){
    r.retarget -= dt;
    r.merge = Math.max(0, r.merge - dt);
    if (r.retarget <= 0 || !r.goal){
      r.retarget = rnd(.4,1.3);
      r.goal = rivalGoal(r);
    }
    if (r.goal){
      const ax = r.goal.x-r.x, ay = r.goal.y-r.y, l = Math.hypot(ax,ay)||1, v = speedOf(r.m);
      r.x += (ax/l*v + Math.sin(Game.t*3 + r.mood*9)*28 + r.vx)*dt;
      r.y += (ay/l*v + Math.cos(Game.t*2.4 + r.mood*7)*28 + r.vy)*dt;
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
    p.vx *= Math.exp(-1.6*dt); p.vy *= Math.exp(-1.6*dt);
    p.x = clamp(p.x, PULSAR_R, WORLD-PULSAR_R);
    p.y = clamp(p.y, PULSAR_R, WORLD-PULSAR_R);
    for (let i=Game.shed.length-1;i>=0;i--){
      const s = Game.shed[i];
      if (Math.hypot(p.x-s.x, p.y-s.y) > PULSAR_R) continue;
      const l = Math.hypot(s.vx, s.vy) || 1;
      p.fed++;
      Game.shed.splice(i,1);
      if (p.fed >= PULSAR_FEED && Game.pulsars.length < PULSAR_MAX){
        p.fed = 0;
        const q = newPulsar(p.x + s.vx/l*PULSAR_R*1.2, p.y + s.vy/l*PULSAR_R*1.2);
        q.vx = s.vx/l*520; q.vy = s.vy/l*520;
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
        ring(p.x, p.y, PULSAR_R*3.2, "#8fe3ff");
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
    for (const r of Game.rivals){
      if (r.m < PULSAR_BITE) continue;
      if (Math.hypot(p.x-r.x, p.y-r.y) < radiusOf(r.m) - PULSAR_R*.35){
        r.m *= .62;
        r.goal = {x: r.x*2-p.x, y: r.y*2-p.y};
        r.retarget = 1.4;
        ring(r.x, r.y, radiusOf(r.m)*2.2, "#8fe3ff");
      }
    }
  }

  // Spitzenmasse und daraus fließende XP
  {
    const jetzt = Game.cells.reduce((s,c) => s+c.m, 0);
    if (jetzt > peak){ addXpLive((jetzt-peak)*0.6); peak = jetzt; }
  }

  // Schweifpunkte sammeln, nur für die Oberfläche, die ihn trägt
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

  const feeders = [...Game.cells, ...Game.rivals];
  for (const f of feeders){
    const r = radiusOf(f.m);
    Grid.near(f.x, f.y, r, i => {
      const d = Game.debris[i];
      if (!d) return;
      if (Math.hypot(f.x-d.x, f.y-d.y) < r){
        f.m += PELLET;
        Grid.drop(d, i);                     // altes Feld räumen, solange d gilt
        Game.debris[i] = newDebris();
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
        Sound.absorb(r.m); ring(r.x, r.y, radiusOf(r.m)*2.6, "#d8b25f");
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

function finish(timeUp){
  Game.running = false;
  Portal.gameplayStop();
  if (!timeUp) Portal.countDeath();
  if (!timeUp) Sound.death();
  Net.leave();

  /* Clanergebnis, bevor die Rivalen für die Anzeige eingefroren werden */
  if (Game.teams){
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
  const xpGain = Math.round(Game.xpRun);

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
  const oreGain   = oreMass + oreKills + oreStages + oreBest + oreWin + oreGoals;

  /* Freundschaftsspiele zahlen nichts. Sonst wäre die gespiegelte Arena mit
     schwachen Gegnern der schnellste Weg zu Ore — Übung soll Übung bleiben. */
  /* Bestwerte fortschreiben, bevor die Belohnung gerechnet wird */
  {
    const R = Profile.rec;
    R.runs++;
    R.mass  = Math.max(R.mass,  Math.round(peak));
    R.kills = Math.max(R.kills, Game.kills);
    R.time  = Math.max(R.time,  Math.floor(Game.t));
    if (Game.won && Game.royale) R.royale++;
    if (Game.won && Game.teams)  R.clan++;
  }

  const paid = MODE().rewards > 0;
  if (paid){
    Profile.ore += oreGain;
    if (beat) Profile.best = Math.round(peak);
  }
  const unlocked = Game.unlockedRun;

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
  const gap = Profile.best - peak;
  if (gap > 0 && Profile.best > 0)
    recap += `<p class="lesson">${t("shortof", Math.round(gap))}</p>`;

  $("endText").textContent = (Game.result ? Game.result + " " : "") +
    t("r_line", Game.name, Math.round(peak), t("st" + stageOf(peak)),
      Game.kills === 1 ? t("r_body") : t("r_bodies", Game.kills),
      Math.floor(Game.t));

  if (!paid){
    $("endGains").innerHTML = recap +
      `<p class="hintline">${t("practice")}</p>`;
    hideAll(); $("endVeil").hidden = false;
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

  let html = recap;
  html += rows.filter(r => r[1] > 0)
    .map(r => `<div class="tally"><span>${r[0]}</span><span>+${r[1]}</span></div>`).join("");
  html += `<div class="tally sum"><span>${t("oreearned")}</span><span>+${oreGain}</span></div>`;
  html += `<p class="gain">+<b>${xpGain}</b> XP</p>`;
  if (unlocked.length)
    html += `<p class="gain">${t("levelup", Profile.level)} <b>` +
            unlocked.map(s => s.label).join(", ") + `</b></p>`;
  $("endGains").innerHTML = html;

  paintPurse(); buildGrid();
  hideAll(); $("endVeil").hidden = false;
  $("again").focus();
}

/* =====================================================================
   4) RENDER
   ===================================================================== */
const cam = {x:WORLD/2, y:WORLD/2, z:1};

function body(g, x, y, r, m, pal, tint, label, mine, tier, trait){
  const st = stageOf(m);
  const T = tier || pal.tier || 1;
  const F = trait || pal.trait || "plain";
  const rock = shade(pal.rock, tint||0), dark = shade(pal.dark, tint||0);
  const fancy = !Settings.lowPower;

  /* Rangstufe sichtbar machen. Größe sagt nur, wer gerade satt ist — nicht,
     wer etwas kann. Ab Stufe IV glüht der Körper nach außen, Stufe V pulsiert.
     Der massive Kreis und der scharfe Rand bleiben exakt auf r, damit die
     Größe ablesbar bleibt und niemand über seine echte Reichweite täuscht. */
  /* Ab Stufe III ein dezentes Glühen, ab IV kräftiger, ab V pulsierend.
     Vorher begann der Effekt erst bei IV und die halbe Leiter sah gleich aus. */
  if (T >= 3 && fancy && r > 8){
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

  if (st >= 3 && fancy){
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

  g.beginPath(); g.arc(x,y,r,0,7);
  if (Settings.lowPower){
    g.fillStyle = rock;
  } else {
    const grad = g.createRadialGradient(x-r*.35, y-r*.4, r*.15, x, y, r);
    grad.addColorStop(0, rock); grad.addColorStop(1, dark);
    g.fillStyle = grad;
  }
  g.fill();

  /* Oberflächenmerkmal. Innerhalb des Kreises beschnitten, damit nichts
     über den Rand läuft und die Silhouette rund bleibt. */
  if (r > 10){
    g.save();
    g.beginPath(); g.arc(x,y,r,0,7); g.clip();

    if (F === "speckle"){
      for (let i=0;i<14;i++){
        const a = i*2.399, d = r*(.15 + ((i*11)%9)/11);
        g.beginPath();
        g.arc(x+Math.cos(a)*d, y+Math.sin(a)*d, Math.max(1, r*.035), 0, 7);
        g.fillStyle = hexA(pal.air,.22); g.fill();
      }
    } else if (F === "bands"){
      for (let i=-1;i<=1;i++){
        g.beginPath();
        g.ellipse(x, y + i*r*.44, r, r*.15, 0, 0, 7);
        g.fillStyle = hexA(pal.dark,.42); g.fill();
      }
    } else if (F === "cracks"){
      g.strokeStyle = hexA(pal.hot,.7);
      g.lineWidth = Math.max(1, r*.045);
      for (let i=0;i<7;i++){
        const a = i*.9 + 1;
        g.beginPath(); g.moveTo(x,y);
        g.lineTo(x+Math.cos(a)*r*.55, y+Math.sin(a)*r*.55);
        g.lineTo(x+Math.cos(a+.4)*r, y+Math.sin(a+.4)*r);
        g.stroke();
      }
    } else if (F === "spikes" || F === "shards"){
      g.beginPath();
      for (let i=0;i<18;i++){
        const a = i/18*6.2832, rr = r*(i%2 ? .74 : 1.02);
        i ? g.lineTo(x+Math.cos(a)*rr, y+Math.sin(a)*rr)
          : g.moveTo(x+Math.cos(a)*rr, y+Math.sin(a)*rr);
      }
      g.closePath();
      g.fillStyle = hexA(pal.hot,.26); g.fill();
    }
    g.restore();
  }

  /* ---- Stufe VI -------------------------------------------------------
     Alles hier liegt außerhalb oder durchscheinend über dem Körper. Der
     massive Kreis und der Rand bleiben unangetastet. */

  // Halo: zweiter, gegenläufiger Ring weit außen, dazu wanderndes Licht
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
    // wanderndes Band auf der Oberfläche
    g.save();
    g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
    const bx = x + Math.cos(Game.t*.9)*r*.55;
    const by = y + Math.sin(Game.t*.9)*r*.55;
    const bg = g.createRadialGradient(bx, by, 0, bx, by, r*.8);
    bg.addColorStop(0, hexA(pal.hot, .45));
    bg.addColorStop(1, hexA(pal.hot, 0));
    g.fillStyle = bg;
    g.beginPath(); g.arc(bx, by, r*.8, 0, 7); g.fill();
    g.restore();
  }

  /* Singularity: Lichtbeugung am Rand. Echte Verzerrung wäre zu teuer —
     stattdessen tangentiale Bögen in wechselnder Höhe, die den Eindruck
     eines Einsteinrings erzeugen, plus ein dunkler Kern. */
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
    g.beginPath(); g.arc(x, y, r*.55, 0, 7);
    g.fillStyle = "rgba(3,4,9,.72)"; g.fill();
  }

  // Prism: die Glutrisse wandern durch das Farbspektrum
  if (F === "prism" && r > 10){
    g.save();
    g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
    for (let i=0;i<6;i++){
      const hue = (Game.t*40 + i*60) % 360;
      const a = i*1.047 + .4;
      g.strokeStyle = `hsla(${hue} 95% 68% / .85)`;
      g.lineWidth = Math.max(2, r*.055);
      g.beginPath();
      g.moveTo(x + Math.cos(a)*r*.10, y + Math.sin(a)*r*.10);
      g.lineTo(x + Math.cos(a+.30)*r*.62, y + Math.sin(a+.30)*r*.62);
      g.lineTo(x + Math.cos(a+.62)*r, y + Math.sin(a+.62)*r);
      g.stroke();
    }
    g.restore();
    const hue = (Game.t*40) % 360;
    g.beginPath(); g.arc(x, y, r*1.06, 0, 7);
    g.strokeStyle = `hsla(${hue} 95% 70% / .35)`;
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
  // Splittergürtel der höchsten Stufe: zwei gegenläufige Bahnen, die äußere
  // schwächer — das erzeugt Tiefe, ohne die Silhouette zu verwischen.
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

  if (st >= 1 && r > 12){
    const n = Math.min(9, 3+st*2);
    for (let i=0;i<n;i++){
      const a = i*2.399 + ((m|0)%6);
      const rr = r*(.2 + ((i*7%5)/12));
      g.beginPath(); g.arc(x+Math.cos(a)*r*.5, y+Math.sin(a)*r*.5, rr*.32, 0, 7);
      g.fillStyle = hexA(pal.dark,.55); g.fill();
    }
  }
  if (st >= 2 && r > 14 && F !== "cracks"){
    g.strokeStyle = hexA(pal.hot,.55);
    g.lineWidth = Math.max(1, r*.05);
    for (let i=0;i<4;i++){
      const a = i*1.9 + m*.01;
      g.beginPath();
      g.moveTo(x+Math.cos(a)*r*.15, y+Math.sin(a)*r*.15);
      g.lineTo(x+Math.cos(a+.5)*r*.72, y+Math.sin(a+.5)*r*.72);
      g.stroke();
    }
  }
  if (st >= 4){
    for (let i=0;i<3;i++){
      const a = Game.t*(.35+i*.14) + i*2.1, d = r*(1.75+i*.22);
      g.beginPath();
      g.arc(x+Math.cos(a)*d, y+Math.sin(a)*d*.42, Math.max(2, r*.07), 0, 7);
      g.fillStyle = pal.air; g.fill();
    }
  }

  // Rand: heller und kräftiger mit dem Rang
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
const RIVAL_PAL_FEST = {rock:"#6d7688", dark:"#3d4453", hot:"#ff7a45", air:"#7fb0e8"};
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

function draw(){
  const [mx,my,gm] = centre();
  peak = Math.max(peak, gm);
  // Basiszoom hängt nur an der Masse; FIT gleicht die Bildschirmgröße aus,
  // damit Handy und PC dieselbe Fläche des Spielfelds sehen.
  const target = clamp(Math.pow(48/radiusOf(Math.max(gm,10)), .42), .3, 1.25) * FIT;
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
    ctx.beginPath(); ctx.arc(px,py,s.r,0,7); ctx.fillStyle = TH().star; ctx.fill();
  }
  ctx.restore();

  ctx.save();
  const sh = Settings.shake ? Game.shake*9 : 0;
  ctx.translate(VW/2 + rnd(-sh,sh), VH/2 + rnd(-sh,sh));
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

  for (const d of Game.debris){
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
  for (const {o,mine} of all){
    if (!mine && !seen(o)) continue;
    const pal = mine ? skin
      : Game.teams ? teamPal(o.team) : RIVAL_PAL;
    const label = Settings.labels === "off" ? ""
      : (Settings.labels === "lead" && mine && o !== lead) ? "" : o.name;
    body(ctx, o.x, o.y, radiusOf(o.m), o.m, pal, mine ? 0 : o.tint, label, mine,
         mine ? skin.tier : o.tier, mine ? skin.trait : o.trait);
  }
  if (Game.safe > 0 && Game.running){
    const puls = .35 + .25*Math.sin(Game.t*7);
    for (const c of Game.cells){
      ctx.beginPath(); ctx.arc(c.x, c.y, radiusOf(c.m)*1.28, 0, 7);
      ctx.strokeStyle = `rgba(216,178,95,${puls})`;
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

  // Stick sichtbar machen, solange der Daumen liegt
  if (isTouch && stick.active && Game.running){
    ctx.beginPath(); ctx.arc(stick.ox, stick.oy, STICK_MAX, 0, 7);
    ctx.strokeStyle = "rgba(216,178,95,.22)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath();
    ctx.arc(stick.ox + stick.dx*STICK_MAX*.55, stick.oy + stick.dy*STICK_MAX*.55, 13, 0, 7);
    ctx.fillStyle = "rgba(216,178,95,.30)"; ctx.fill();
  }

  $("mass").firstChild.nodeValue = Math.round(gm);
  const gp = $("goalPlate");
  if (Game.goals.length && Game.running){
    gp.hidden = false;
    // Die ersten Sekunden blinkt der Rahmen, damit man die Tafel überhaupt bemerkt
    gp.classList.toggle("flash", Game.t < 4);
    $("goalList").innerHTML = Game.goals.map(it =>
      `<div class="goal${it.done ? " done" : ""}"><i>${it.done ? "✓" : "○"}</i>` +
      `<span>${esc(t("g_"+it.def.id))}</span></div>`).join("");
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
      ctx.strokeStyle = `rgba(216,178,95,${a*(.35 - i*.09)})`;
      ctx.lineWidth = 3; ctx.stroke();
    }
    const glow = ctx.createRadialGradient(0,0,0, 0,0, 220);
    glow.addColorStop(0, `rgba(216,178,95,${a*.22})`);
    glow.addColorStop(1, "rgba(216,178,95,0)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0,0,220,0,7); ctx.fill();

    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const gross = 44 + ein*22;
    ctx.font = `600 ${gross}px Georgia, serif`;
    ctx.fillStyle = `rgba(216,178,95,${a})`;
    ctx.fillText(t("lvlup", fx.level), 0, 0);
    if (fx.skin){
      ctx.font = `600 20px Georgia, serif`;
      ctx.fillStyle = `rgba(223,232,245,${a})`;
      ctx.fillText(t("lvlskin", fx.skin), 0, gross*0.85);
      ctx.font = `400 14px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillStyle = `rgba(132,148,173,${a})`;
      ctx.fillText(t("lvlworn"), 0, gross*0.85 + 26);
    }
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
    $("brLeft").textContent = bodyCount() + 1;
    const nx = zoneNext(Game.t);
    $("brZoneLabel").textContent = nx === null ? "Field" : "Field closes in";
    $("brZone").textContent = nx === null ? t("final") : Math.ceil(nx) + "s";
    const s = Math.max(0, Math.round(Game.left));
    $("brClock").textContent = Math.floor(s/60) + ":" + String(s%60).padStart(2,"0");
  } else rp.hidden = true;

  const plate = $("clanPlate");
  if (Game.teams && Game.running){
    plate.hidden = false;
    let us = gm, them = 0;
    for (const r of Game.rivals) (r.team === 1 ? us += r.m : them += r.m);
    $("clanUs").textContent = Math.round(us);
    $("clanThem").textContent = Math.round(them);
    const s = Math.max(0, Math.round(Game.left));
    $("clanClock").textContent = Math.floor(s/60) + ":" + String(s%60).padStart(2,"0");
  } else plate.hidden = true;
  paintStage(gm); paintBoard(gm);
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
      toast("Pulsars are edible while you stay this split");
    }
  } else sl.hidden = true;
}
const esc = s => String(s).replace(/[<>&"]/g, c => ({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c]));
function paintBoard(gm){
  const byGid = new Map();
  for (const r of Game.rivals){
    const e = byGid.get(r.gid);
    if (e) e.m += r.m; else byGid.set(r.gid, {name:r.name, m:r.m});
  }
  const list = [...byGid.values()];
  if (gm > 0) list.push({name:Game.name, m:gm, me:true});
  list.sort((a,b) => b.m-a.m);

  /* Zeilenzahl an die Bildhöhe anpassen. Die rechte Spalte ist nach oben
     begrenzt, damit sie die Daumentasten frei lässt — bei sechs festen Zeilen
     wurde die Rangliste auf flachen Querformaten unten abgeschnitten. */
  const platz = VH - 104 - (Game.goals.length ? 92 : 0)
                        - ((Game.royale || Game.teams) ? 96 : 0)
                        - (Integrity.score < 100 ? 74 : 0);
  const max = clamp(Math.floor((platz - 34) / 19), 3, 8);

  /* Der eigene Eintrag steht immer im Bild, auch wenn er weit hinten liegt —
     sonst sieht man ausgerechnet die eigene Platzierung nicht. */
  const meIdx = list.findIndex(e => e.me);
  const zeigen = list.slice(0, max).map((e,i) => ({e, rang:i+1}));
  if (meIdx >= max){
    zeigen.pop();
    zeigen.push({e:list[meIdx], rang:meIdx+1});
  }
  $("board").innerHTML = zeigen.map(({e,rang}) =>
    `<div class="row${e.me?" me":""}"><span>${rang}. ${esc(e.name)}</span>` +
    `<span>${Math.round(e.m)}</span></div>`
  ).join("");
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

/* Bildratenwächter. Fällt die Rate über zwei Sekunden unter 45, wird der
   Sparmodus von allein eingeschaltet — einmal, und mit Meldung, damit niemand
   rätselt, warum es plötzlich schlichter aussieht. */
let fpsFenster = [], fpsGeprueft = false;
function wacheFps(dt){
  if (fpsGeprueft || Settings.lowPower || !Game.running) return;
  fpsFenster.push(dt);
  if (fpsFenster.length < 120) return;
  const mittel = fpsFenster.reduce((a,b)=>a+b,0) / fpsFenster.length;
  fpsFenster.length = 0;
  if (1/mittel < 45){
    fpsGeprueft = true;
    Settings.lowPower = true;
    applySetting("lowPower");
    toast(t("s_perf") + ": " + t("o_on"));
  }
}

let last = performance.now();
function loop(t){
  const dt = Math.min(.05, (t-last)/1000); last = t;
  if (Game.running && !Integrity.locked && !portrait && !paused){ step(dt); wacheFps(dt); }
  draw();
}
requestAnimationFrame(loop);

/* =====================================================================
   6) SCREENS
   ===================================================================== */
const VEILS = ["accountVeil","startVeil","shopVeil","testVeil","endVeil","legalVeil",
               "friendsVeil","setVeil","oreVeil"];

/* Ore-Pakete. Gemessene Verdienstrate: rund 5.300 Ore je Stunde. Die Pakete
   sind daran ausgerichtet und in Spielzeit umgerechnet direkt angeschrieben —
   wer kauft, soll sehen, wie viel Wartezeit er spart, statt eine nackte Zahl
   zu bekommen. Größere Pakete sind günstiger je Ore, das ist üblich und fair.
   Zuschnitt so gewählt, dass die Beträge auf Oberflächenpreise passen und
   möglichst wenig Restguthaben bleibt. */
const ORE_RATE = 5300;
const ORE_PACKS = [
  {ore:5000,  price:"1,99 €"},
  {ore:14000, price:"4,99 €"},
  {ore:30000, price:"9,99 €"},
  {ore:70000, price:"19,99 €"}
];


const SET_UI = [
  {key:"volume", label:"s_sound", hint:"s_sound_h",
   opts:[["o_off",0],["o_quiet",0.12],["o_normal",0.22],["o_loud",0.4]]},
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
   opts:[["o_off",false],["o_on",true]]}
];

function applySetting(key){
  if (key === "volume"){
    Sound.on = Settings.volume > 0;
    if (Sound.bus) Sound.bus.gain.value = Settings.volume;
    if (Sound.on) Sound.unlock();
  }
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
  if (key === "lowPower") seedStars();
}

function buildSettings(){
  const box = $("setList");
  box.innerHTML = "";
  for (const row of SET_UI){
    if (row.touch && !isTouch) continue;
    const wrap = document.createElement("div");
    wrap.className = "opt";
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
}
function hideAll(){ VEILS.forEach(v => $(v).hidden = true); }
function show(id){
  hideAll(); $(id).hidden = false;
  if (id === "startVeil"){ buildStrip(); buildBoost(); buildRecords(); }
}

function paintPurse(){
  const need = Profile.xpNeeded(Profile.level);
  for (const [lv,xp,ore,best] of [["lvNum","xpText","oreNum","bestNum"],
                                  ["lvNum2","xpText2","oreNum2","bestNum2"]]){
    $(lv).textContent = Profile.level;
    $(xp).textContent = Profile.level >= MAX_LEVEL
      ? t("maxlevel") : Profile.xp.toLocaleString(lang) + " / " + need.toLocaleString(lang);
    $(ore).textContent = Profile.ore.toLocaleString(lang);
    $(best).textContent = Profile.best.toLocaleString(lang);
  }
  $("xpBar").style.width = (Profile.level >= MAX_LEVEL ? 1
    : clamp(Profile.xp/need, 0, 1))*100 + "%";
}

function preview(canvas, pal){
  canvas.width = 132; canvas.height = 132;
  const g = canvas.getContext("2d");
  g.clearRect(0,0,132,132);
  const saveT = Game.t; Game.t = 1.2;
  body(g, 66, 62, 36, 3000, pal, 0, "", true);
  Game.t = saveT;
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

/* Nur was freigespielt ist. Gesperrte Oberflächen gehören in den Shop,
   nicht in die Schnellwahl — sonst ist die Leiste bei 42 Einträgen unbrauchbar. */
/* --- Modi --------------------------------------------------------- */
function buildModes(){
  const box = $("modes");
  box.innerHTML = "";
  for (const id of Object.keys(MODES)){
    const M = MODES[id];
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-pressed", String(modeId === id));
    b.innerHTML = `<b>${t("m_"+id)}</b><span>${t("m_"+id+"_b")}</span>`;
    b.addEventListener("click", () => { modeId = id; buildModes(); buildBoost(); });
    box.appendChild(b);
  }
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
  if (name.toLowerCase() === cleanName($("name").value).trim().toLowerCase())
    return friendNote(t("fr_own"), "warn");
  if (Profile.friends.some(f => f.toLowerCase() === name.toLowerCase()))
    return friendNote(t("fr_already", name), "warn");
  if (Profile.friends.length >= 50) return friendNote(t("fr_full"), "warn");
  Profile.friends.push(name);
  $("friendName").value = "";
  buildFriends();
  friendNote(t("fr_added", name), "good");
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

function buildBoost(){
  const box = $("boostPick");
  if (!box) return;
  box.innerHTML = "";
  const nurOffen = modeId === "open";
  for (const f of [1,2,3]){
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = f === 1 ? t("boostoff")
      : "×" + f + "  " + BOOST_COST[f].toLocaleString(lang) + " Ore";
    b.setAttribute("aria-pressed", String(Profile.boost === f));
    b.disabled = !nurOffen && f > 1;
    b.addEventListener("click", () => { Profile.boost = f; buildBoost(); });
    box.appendChild(b);
  }
  $("boostNote").textContent = nurOffen ? t("boostnote") : t("boostonly");
}

function buildStrip(){
  const strip = $("strip");
  if (!strip) return;
  strip.innerHTML = "";
  for (const s of SKINS){
    if (!Profile.owned.has(s.id)) continue;
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-pressed", String(skin.id === s.id));
    b.title = s.label;
    const c = document.createElement("canvas");
    b.appendChild(c);
    preview(c, s);
    const nm = document.createElement("span");
    nm.className = "nm"; nm.textContent = s.label;
    b.appendChild(nm);
    b.addEventListener("click", () => { skin = s; buildStrip(); });
    strip.appendChild(b);
    if (skin.id === s.id) setTimeout(() => b.scrollIntoView({block:"nearest", inline:"center"}), 0);
  }
  const more = document.createElement("button");
  more.type = "button";
  more.innerHTML = `<span class="more">${Profile.owned.size} of ${SKINS.length}<br>all skins</span>`;
  more.addEventListener("click", () => { paintPurse(); buildGrid(); show("shopVeil"); });
  strip.appendChild(more);
}

function buildGrid(){
  const grid = $("grid");
  grid.innerHTML = "";
  $("shopCount").textContent = t("ownedcount", Profile.owned.size, SKINS.length);
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
function pick(s){
  if (Profile.owned.has(s.id)){
    skin = s;
    buildGrid();
    note(t("selected", s.label), "good");
    return;
  }
  if (s.lv){
    note(t("needlevel", s.label, s.lv), "warn");
    return;
  }
  if (Profile.ore < s.ore){
    note(t("needore", s.label, s.ore.toLocaleString(lang)), "warn");
    return;
  }
  if (Profile.buy(s)){
    skin = s;
    paintPurse(); buildGrid();
    note(t("bought", s.label, s.ore.toLocaleString(lang)), "good");
  }
}

(function buildLangPick(){
  const box = $("langPick");
  if (!box) return;
  const draw = () => {
    box.innerHTML = "";
    for (const code of Object.keys(LANGNAMES)){
      const b = document.createElement("button");
      b.type = "button"; b.textContent = LANGNAMES[code];
      b.setAttribute("aria-pressed", String(code === lang));
      b.addEventListener("click", () => { lang = code; applyLang(); draw(); });
      box.appendChild(b);
    }
  };
  box.draw = draw; draw();
})();

$("guestBtn").addEventListener("click", () => { paintPurse(); buildGrid(); show("startVeil"); });
$("googleBtn").addEventListener("click", () => {});
$("facebookBtn").addEventListener("click", () => {});
$("shopBtn").addEventListener("click", () => { paintPurse(); buildGrid(); show("shopVeil"); });
$("endShop").addEventListener("click", () => { paintPurse(); buildGrid(); show("shopVeil"); });
$("endMenu").addEventListener("click", () => { paintPurse(); show("startVeil"); });
$("oreBtn").addEventListener("click", () => {
  const box = $("orePacks");
  box.innerHTML = "";
  for (const p of ORE_PACKS){
    const std = (p.ore/ORE_RATE).toFixed(1).replace(".", ",");
    const row = document.createElement("div");
    row.className = "tally";
    row.innerHTML = `<span>${p.ore.toLocaleString(lang)} Ore` +
      `<small style="display:block;color:var(--paper-2);font-size:11.5px">` +
      `${t("orehours", std)}</small></span><span>${p.price}</span>`;
    box.appendChild(row);
  }
  show("oreVeil");
});
$("oreClose").addEventListener("click", () => { buildGrid(); show("shopVeil"); });

$("shopClose").addEventListener("click", () => { paintPurse(); show("startVeil"); });
$("legalBtn").addEventListener("click", () => show("legalVeil"));
$("legalBtn2").addEventListener("click", () => show("legalVeil"));
$("legalClose").addEventListener("click", () =>
  show(Game.name ? "startVeil" : "accountVeil"));
/* Sofort weiter: Kein Umweg über den Startbildschirm, gleicher Modus,
   gleicher Name. Reibung nach dem Tod ist der häufigste Abbruchgrund. */
$("again").addEventListener("click", () => Portal.breakBefore(() => start(Game.name)));
addEventListener("keydown", e => {
  if ($("endVeil").hidden) return;
  if (e.code === "Enter" || e.code === "Space"){ e.preventDefault(); start(Game.name); }
});

/* Eingaben sofort säubern, damit niemand einen untippbaren Namen wählt */
function guardName(input, note){
  input.addEventListener("input", () => {
    const before = input.value, after = cleanName(before);
    if (after !== before){
      input.value = after;
      if (note) $(note).textContent =
        t("namefix");
    }
  });
}
guardName($("name"), "nameNote");
guardName($("friendName"));

$("friendsBtn").addEventListener("click", () => {
  buildFriends(); friendNote(""); show("friendsVeil");
});
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
  $("powText").textContent = "Entry proof cleared (nonce " + n + ").";
  Portal.loadingStop();
  startBtn.disabled = false;
  startBtn.textContent = t("start");
});
startBtn.addEventListener("click", () => {
  Sound.unlock();                       // Nutzergeste: erst hier darf Ton starten
  start($("name").value.trim().slice(0,14));
});
$("settingsBtn").addEventListener("click", () => { buildSettings(); show("setVeil"); });
$("setClose").addEventListener("click", () => show("startVeil"));
if (isTouch)
  $("controls").innerHTML = "<b>Drag</b> anywhere to steer · the two buttons " +
    "<b>split</b> and <b>shed mass</b><br>Every skin is earned by playing. " +
    "No lasting advantages for sale. Every skin can be earned by playing.";
lang = pickLang();
applyTheme();
applyLang();
paintIntegrity(); paintPurse();

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
  try {
    if (screen.orientation && screen.orientation.lock)
      await screen.orientation.lock("landscape");
  } catch (_) {}   // iOS Safari kennt die Sperre nicht — dafür der Drehhinweis
  setTimeout(resize, 200);
}

/* Service Worker registrieren. Er hält das Spiel offline lauffähig und holt
   sich beim Start immer die neueste Fassung vom Server: einmal hochladen,
   und beim nächsten Öffnen ist die neue Version auf dem Handy. */
if ("serviceWorker" in navigator){
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
   7) NET — Stub für den Mehrspielerbetrieb
   Heute läuft die Simulation lokal. Sobald der Server steht, wird genau
   dieses Modul ersetzt: der Client sendet nur Blickrichtung und Aktionen,
   der Server schickt Weltzustände zurück und rechnet Masse, Ore und
   Freischaltungen selbst aus.

   Protokoll (Entwurf):
     Client → Server   join   {token, name, skin}
                       input  {ax, ay, seq, t}      ~20/s
                       action {kind:"split"|"shed", seq}
                       leave  {}
     Server → Client   welcome {playerId, worldSize, tickRate}
                       state   {tick, bodies[], debrisDelta[], leaderboard[]}
                       reward  {xp, ore, level, unlocked[]}
                       kicked  {reason}
   ===================================================================== */
const Net = {
  socket:null, seq:0, connected:false,

  join(info){
    // const url = "wss://example.invalid/play";
    // this.socket = new WebSocket(url);
    // this.socket.onmessage = e => this.onState(JSON.parse(e.data));
    this.connected = false;
    this.info = info;
  },
  send(kind){
    if (!this.connected) return;                   // heute: lokale Simulation
    this.socket.send(JSON.stringify({kind, seq:this.seq++}));
  },
  onState(){ /* Serverzustand übernehmen, lokale Vorhersage korrigieren */ },
  leave(){ if (this.connected) this.socket.close(); this.connected = false; }
};
setInterval(() => {
  if (!Net.connected || !Game.running) return;
  const [ax, ay] = aim();
  Net.socket.send(JSON.stringify({kind:"input", ax, ay, seq:Net.seq++, t:Date.now()}));
}, 50);
