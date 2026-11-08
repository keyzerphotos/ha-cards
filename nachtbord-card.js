/* nachtbord-card.js v1.0 — "Nachtbord" voor de Lenovo (Kiosk Satellite).
   Compleet nieuw ontwerp naast de bestaande borden; deelt niets met
   bord-basis behalve de technische drager (1920x1200-podium met schaal-fit).
   Ontwerptaal (naar de Prairie Nights-post): bijna zwart marineblauw,
   kaarten blauw-grijs, turquoise als enige statuskleur, grote witte waarde
   met een kleine grijze zin eronder, pill-navigatie bovenaan, hero-band met
   een samenvattende zin in spreektaal. Zeven secties in een kaart:
   Thuis, Kamers, Auto, Energie, Veiligheid, Stofzuiger, Muziek.
   Harde lessen blijven gelden: expliciete kleur op elk tekstelement,
   geen backdrop-filter, :host fixed, setConfig verplicht. */
"use strict";

var FONT_ID = "nacht-fonts";
function zorgFont() {
  if (document.getElementById(FONT_ID)) return;
  var css = "";
  [400, 600, 700, 800, 900].forEach(function (g) {
    css += "@font-face{font-family:'NBFont';font-style:normal;font-weight:" + g +
      ";font-display:swap;src:url(https://cdn.jsdelivr.net/fontsource/fonts/nunito@5.2.5/latin-" +
      g + "-normal.woff2) format('woff2');}";
  });
  var st = document.createElement("style");
  st.id = FONT_ID;
  st.textContent = css;
  document.head.appendChild(st);
}

var KLEUR = {
  bg: "#060B14", kaart: "#111C2C", kaart2: "#0D1624",
  teal: "#2DD4BF", tealZacht: "rgba(45,212,191,.12)",
  wit: "#F7FAFC", grijs: "#9DB0C4", dim: "#5C6E82",
  lijn: "rgba(255,255,255,.05)", baan: "rgba(255,255,255,.07)",
  amber: "#F5A623", rood: "#E5484D"
};

var ICONS = {
  thuis: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9.5h4.5v-6h3v6H18V10"/>',
  kamers: '<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="3.5" width="7.5" height="5" rx="1.5"/><rect x="13" y="10.5" width="7.5" height="10" rx="1.5"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5"/>',
  auto: '<path d="M4.5 15.5 6 10a2 2 0 0 1 1.9-1.5h8.2A2 2 0 0 1 18 10l1.5 5.5"/><path d="M3.5 15.5h17V18h-17z"/><circle cx="7.5" cy="18" r="1.4"/><circle cx="16.5" cy="18" r="1.4"/>',
  energie: '<path d="M13 2.5 4.5 14H11l-1 7.5L18.5 10H12l1-7.5z"/>',
  veiligheid: '<path d="M12 3l7 2.8v6.1c0 4.4-2.9 7.4-7 9.1-4.1-1.7-7-4.7-7-9.1V5.8L12 3z"/><path d="M9 11.8l2.2 2.2 4-4.2"/>',
  stofzuiger: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.4"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3"/>',
  muziek: '<path d="M9.5 18.5V7l10-2v11.5"/><circle cx="6.8" cy="18.5" r="2.7"/><circle cx="16.8" cy="16.5" r="2.7"/>',
  weer: '<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/>',
  thermo: '<path d="M10 13.6V5a2 2 0 0 1 4 0v8.6a4.6 4.6 0 1 1-4 0z"/><circle cx="12" cy="17.5" r="1.6"/>',
  slot: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  slotopen: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 6.8-1.2"/>',
  camera: '<rect x="3" y="7" width="12.5" height="11" rx="2"/><path d="M15.5 10.8 21 7.5v9l-5.5-3.3"/>',
  bel: '<path d="M6.5 15.5v-4.7a5.5 5.5 0 0 1 11 0v4.7l1.6 3.2H4.9l1.6-3.2"/><path d="M10 21a2.2 2.2 0 0 0 4 0"/>',
  beweging: '<path d="M3 12h4l2.5-6.5 4 13 2.5-6.5h5"/>',
  eten: '<path d="M7 3v6.5M4.6 3v3.8a2.4 2.4 0 0 0 4.8 0V3M7 9.5V21"/><path d="M17.5 3c-1.7.6-2.6 2.6-2.6 5 0 1.9.8 3 2.6 3.6V21"/>',
  klok: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  terug: '<path d="M14.5 5 7.5 12l7 7"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  min: '<path d="M5.5 12h13"/>',
  power: '<path d="M12 3v7.5"/><path d="M6.6 6.2a8 8 0 1 0 10.8 0"/>',
  speel: '<path d="M8.5 5.8v12.4L18.5 12z"/>',
  pauze: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
  volgende: '<path d="M6 6v12l8-6z"/><path d="M17.5 6v12"/>',
  vorige: '<path d="M18 6v12l-8-6z"/><path d="M6.5 6v12"/>',
  ververs: '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20.5 3.5v4h-4"/>',
  vlam: '<path d="M12 3.2c.8 2.8-2 4.3-2 6.9a4.4 4.4 0 0 0 8.8 0c0-1.9-.9-3.3-1.9-4.8-.3 1.4-1 2.4-1.9 2.9.4-1.9-.6-3.7-3-4.7z"/>',
  stekker: '<path d="M9 7V3.5M15 7V3.5"/><path d="M7 7h10v3.5a5 5 0 0 1-10 0V7z"/><path d="M12 15.5v5"/>',
  deur: '<rect x="6" y="3" width="12" height="18" rx="1"/><circle cx="15" cy="12" r="1"/>',
  persoon: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.4 3.6-5 7-5s6.2 1.6 7 5"/>',
  accu: '<rect x="2.8" y="8" width="16.5" height="8.5" rx="2"/><path d="M21.5 11v2.5"/>',
  druppel: '<path d="M12 3.5c3 4.2 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 3-6.8 6-11z"/>'
};
function icoon(naam, maat, kleur) {
  return '<svg viewBox="0 0 24 24" width="' + maat + '" height="' + maat +
    '" fill="none" stroke="' + (kleur || KLEUR.grijs) + '" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (ICONS[naam] || "") + "</svg>";
}

var WEER_NL = {
  "clear-night": "Helder", "cloudy": "Bewolkt", "fog": "Mist",
  "hail": "Hagel", "lightning": "Onweer", "lightning-rainy": "Onweer met regen",
  "partlycloudy": "Half bewolkt", "pouring": "Stortregen", "rainy": "Regen",
  "snowy": "Sneeuw", "snowy-rainy": "Natte sneeuw", "sunny": "Zonnig",
  "windy": "Winderig", "windy-variant": "Winderig", "exceptional": "Extreem weer"
};

var FORD = "fordpass_wf0fxxwpmhld21343_";
var KAMERS = [
  { id: "woonkamer", naam: "Woonkamer", ce: "climate.woonkamer_woonkamer_3", lokaal: "climate.woonkamer_woonkamer", venster: "binary_sensor.woonkamer_woonkamer_venster" },
  { id: "ouders", naam: "Slaapkamer", ce: "climate.slaapkamer_slaapkamer_3", lokaal: "climate.slaapkamer_slaapkamer", venster: "binary_sensor.slaapkamer_slaapkamer_venster" },
  { id: "cas", naam: "Cas", ce: "climate.slaapkamer_cas_slaapkamer_cas_3", lokaal: "climate.slaapkamer_cas_slaapkamer_cas", venster: "binary_sensor.slaapkamer_cas_slaapkamer_cas_venster" },
  { id: "naud", naam: "Naud", ce: "climate.slaapkamer_naud_slaapkamer_naud_3", lokaal: "climate.slaapkamer_naud_slaapkamer_naud", venster: "binary_sensor.slaapkamer_naud_slaapkamer_naud_venster" },
  { id: "badkamer", naam: "Badkamer", ce: "climate.badkamer_badkamer_3", lokaal: "climate.badkamer_badkamer", venster: "binary_sensor.badkamer_badkamer_venster" },
  { id: "kantoor", naam: "Kantoor", ce: "climate.kantoor_kantoor_2", lokaal: "climate.kantoor_kantoor", venster: "binary_sensor.kantoor_kantoor_venster", geenTemp: true },
  { id: "wc", naam: "WC", speciaal: "wc" },
  { id: "keuken", naam: "Keuken", speciaal: "keuken" }
];
var TABS = [
  { id: "thuis", naam: "Thuis", icoon: "thuis" },
  { id: "kamers", naam: "Kamers", icoon: "kamers" },
  { id: "auto", naam: "Auto", icoon: "auto" },
  { id: "energie", naam: "Energie", icoon: "energie" },
  { id: "veiligheid", naam: "Veiligheid", icoon: "veiligheid" },
  { id: "stofzuiger", naam: "Stofzuiger", icoon: "stofzuiger" },
  { id: "muziek", naam: "Muziek", icoon: "muziek" }
];
var SPELERS = [
  { id: "media_player.jbl_bar_800_3", naam: "Woonkamer · JBL Bar" },
  { id: "media_player.keuken_2", naam: "Keuken" },
  { id: "media_player.huiskamer_2", naam: "Huiskamer" },
  { id: "media_player.slaapkamer_nachtkastje", naam: "Slaapkamer" },
  { id: "media_player.koken_met_sanne_2", naam: "Koken met Sanne" },
  { id: "media_player.lg_webos_tv_nano886pb", naam: "TV" }
];

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function getal(v, dec) {
  var n = parseFloat(v);
  if (isNaN(n)) return null;
  return n.toLocaleString("nl-NL", { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
}
function tijdVan(iso) {
  if (!iso) return "";
  var d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}
function geleden(iso) {
  if (!iso) return "onbekend";
  var d = new Date(iso), nu = Date.now(), min = Math.round((nu - d.getTime()) / 60000);
  if (isNaN(d.getTime())) return "onbekend";
  if (min < 1) return "zojuist";
  if (min < 60) return min + " min geleden";
  var uur = Math.floor(min / 60);
  if (uur < 24 && d.getDate() === new Date().getDate()) return uur + " uur geleden";
  if (uur < 48) return "gisteren " + tijdVan(iso);
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) + " " + tijdVan(iso);
}
function veiligGet(key) {
  try { return window.localStorage.getItem(key); } catch (e) { return null; }
}
function veiligSet(key, val) {
  try { window.localStorage.setItem(key, val); } catch (e) { /* kiosk zonder opslag */ }
}

var CSS = `
:host{position:fixed;inset:0;background:${KLEUR.bg};overflow:hidden;}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
.stage{position:absolute;left:0;top:0;width:1920px;height:1200px;transform-origin:0 0;
  background:radial-gradient(1300px 850px at 28% 30%, #0A1424 0%, ${KLEUR.bg} 65%);
  color:${KLEUR.wit};font-family:'NBFont','Nunito',sans-serif;padding:40px 48px;
  display:flex;flex-direction:column;}
.nav{display:flex;gap:14px;justify-content:center;}
.pil{display:flex;align-items:center;gap:12px;padding:10px 22px 10px 12px;border-radius:999px;
  background:rgba(255,255,255,.03);border:1px solid ${KLEUR.lijn};cursor:pointer;
  font-size:21px;font-weight:600;color:${KLEUR.grijs};}
.pil .rond{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:rgba(255,255,255,.04);}
.pil.aan{color:${KLEUR.wit};background:${KLEUR.tealZacht};border-color:rgba(45,212,191,.35);}
.pil.aan .rond{background:${KLEUR.teal};}
.hero{margin-top:26px;height:238px;border-radius:24px;background:${KLEUR.kaart};
  border:1px solid ${KLEUR.lijn};display:flex;overflow:hidden;flex:none;}
.hero-tekst{flex:1;padding:38px 44px;display:flex;flex-direction:column;justify-content:center;}
.hero-zin{font-size:47px;font-weight:800;line-height:1.16;color:${KLEUR.wit};}
.hero-sub{margin-top:14px;font-size:22px;font-weight:600;color:${KLEUR.grijs};line-height:1.35;}
.hero-beeld{flex:none;height:100%;}
.hero-beeld img{height:100%;display:block;}
.hero-icoon{flex:none;width:300px;display:flex;align-items:center;justify-content:center;}
.hero-icoon .bol{width:150px;height:150px;border-radius:50%;background:${KLEUR.tealZacht};
  display:flex;align-items:center;justify-content:center;}
.inhoud{flex:1;margin-top:26px;min-height:0;}
.raster{display:grid;gap:22px;height:100%;}
.tegel{background:${KLEUR.kaart};border:1px solid ${KLEUR.lijn};border-radius:24px;
  padding:28px 30px;display:flex;flex-direction:column;justify-content:center;min-width:0;}
.tegel.klikbaar{cursor:pointer;}
.tegel .kop{display:flex;align-items:center;gap:14px;margin-bottom:12px;}
.tegel .chip{width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.05);
  display:flex;align-items:center;justify-content:center;flex:none;}
.tegel .kop .naam{font-size:21px;font-weight:700;color:${KLEUR.grijs};}
.waarde{font-size:62px;font-weight:800;line-height:1.05;color:${KLEUR.wit};white-space:nowrap;}
.waarde .eenheid{font-size:30px;font-weight:700;color:${KLEUR.grijs};}
.zin{margin-top:10px;font-size:21px;font-weight:600;color:${KLEUR.grijs};line-height:1.35;}
.balk{margin-top:18px;height:10px;border-radius:999px;background:${KLEUR.baan};overflow:hidden;}
.balk i{display:block;height:100%;border-radius:999px;background:${KLEUR.teal};}
.rijen{display:flex;flex-direction:column;gap:14px;}
.rij{background:${KLEUR.kaart};border:1px solid ${KLEUR.lijn};border-radius:20px;
  padding:20px 26px;display:flex;align-items:center;gap:18px;cursor:pointer;}
.rij .rond{width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.05);
  display:flex;align-items:center;justify-content:center;flex:none;}
.rij .midden{flex:1;min-width:0;}
.rij .titel{font-size:24px;font-weight:700;color:${KLEUR.wit};}
.rij .onder{font-size:19px;font-weight:600;color:${KLEUR.grijs};margin-top:2px;}
.rij .rechts{font-size:26px;font-weight:800;color:${KLEUR.wit};white-space:nowrap;}
.rij.klein{padding:12px 20px;gap:14px;border-radius:16px;}
.rij.klein .rond{width:42px;height:42px;}
.rij.klein .titel{font-size:21px;}
.rij.klein .onder{font-size:16.5px;}
.rij.klein .rechts{font-size:22px;}
.rij.klein .knop{padding:10px 18px;font-size:19px;}
.knop{display:inline-flex;align-items:center;gap:12px;padding:16px 28px;border-radius:999px;
  background:rgba(255,255,255,.05);border:1px solid ${KLEUR.lijn};color:${KLEUR.wit};
  font-size:22px;font-weight:700;cursor:pointer;font-family:inherit;}
.knop.teal{background:${KLEUR.tealZacht};border-color:rgba(45,212,191,.4);color:${KLEUR.teal};}
.knop:active{transform:scale(.97);}
.rondknop{width:92px;height:92px;border-radius:50%;background:rgba(255,255,255,.05);
  border:1px solid ${KLEUR.lijn};display:flex;align-items:center;justify-content:center;cursor:pointer;}
.rondknop.teal{background:${KLEUR.teal};border-color:${KLEUR.teal};}
.planvak{position:relative;}
.kamervlak{position:absolute;border-radius:14px;background:${KLEUR.kaart2};
  border:1px solid rgba(255,255,255,.09);padding:10px 12px;cursor:pointer;overflow:hidden;}
.kamervlak .kn{font-size:18px;font-weight:700;color:${KLEUR.grijs};white-space:nowrap;}
.kamervlak .kt{font-size:31px;font-weight:800;color:${KLEUR.wit};line-height:1.1;}
.kamervlak .kd{font-size:15px;font-weight:600;color:${KLEUR.dim};}
.kamervlak.warm{background:rgba(45,212,191,.13);border-color:rgba(45,212,191,.45);}
.kamervlak.deco{cursor:default;background:rgba(255,255,255,.015);}
.vloertitel{position:absolute;font-size:19px;font-weight:800;color:${KLEUR.dim};letter-spacing:.4px;}
.stapknop{width:96px;height:96px;border-radius:50%;background:rgba(255,255,255,.05);
  border:1px solid ${KLEUR.lijn};display:flex;align-items:center;justify-content:center;cursor:pointer;}
.stapknop:active{transform:scale(.95);}
.foto{width:100%;height:100%;object-fit:cover;border-radius:24px;display:block;background:${KLEUR.kaart2};}
.raster.krap .tegel{padding:22px 24px;}
.raster.krap .waarde{font-size:50px;}
.raster.krap .tegel{flex:1;}
`;

class NachtbordCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tab = veiligGet("nachtbord-tab") || "thuis";
    if (!TABS.some(function (t) { return t.id === this._tab; }, this)) this._tab = "thuis";
    this._kamer = null;
    this._laatsteHtml = "";
    this._dag = null;
    this._dagTs = 0;
    this._fotoPad = {};
    this._klok = null;
  }
  setConfig(config) { this._config = config || {}; }
  getCardSize() { return 1; }
  connectedCallback() {
    zorgFont();
    var self = this;
    this._klok = setInterval(function () { self._render(); }, 30000);
    this._bouw();
    this._render();
  }
  disconnectedCallback() {
    if (this._klok) clearInterval(this._klok);
    if (this._fotoTimer) clearInterval(this._fotoTimer);
    if (this._resizeObs) this._resizeObs.disconnect();
  }
  set hass(h) {
    this._hass = h;
    if (!this._gebouwd) this._bouw();
    this._render();
    this._naHass();
  }
  get hass() { return this._hass; }

  _bouw() {
    if (this._gebouwd) return;
    this._gebouwd = true;
    var wortel = this.shadowRoot;
    wortel.innerHTML = "<style>" + CSS + '</style><div class="stage" id="stage">' +
      '<div class="nav" id="nav"></div><div class="hero" id="hero"></div>' +
      '<div class="inhoud" id="inhoud"></div></div>';
    this._fit();
    var self = this;
    this._resizeObs = new ResizeObserver(function () { self._fit(); });
    this._resizeObs.observe(document.documentElement);
    wortel.addEventListener("click", function (ev) { self._klik(ev); });
    this._tekenNav();
  }
  _fit() {
    var st = this.shadowRoot && this.shadowRoot.getElementById("stage");
    if (!st) return;
    var w = window.innerWidth || 1920, h = window.innerHeight || 1200;
    var s = Math.min(w / 1920, h / 1200);
    st.style.transform = "scale(" + s + ")";
    st.style.left = ((w - 1920 * s) / 2) + "px";
    st.style.top = ((h - 1200 * s) / 2) + "px";
  }
  _tekenNav() {
    var nav = this.shadowRoot.getElementById("nav");
    if (!nav) return;
    var self = this;
    nav.innerHTML = TABS.map(function (t) {
      var aan = t.id === self._tab;
      return '<div class="pil' + (aan ? " aan" : "") + '" data-act="tab" data-tab="' + t.id + '">' +
        '<span class="rond">' + icoon(t.icoon, 27, aan ? "#06231E" : KLEUR.grijs) + "</span>" +
        esc(t.naam) + "</div>";
    }).join("");
  }
  _klik(ev) {
    var el = ev.target.closest("[data-act]");
    if (!el) return;
    var act = el.getAttribute("data-act"), h = this._hass;
    if (act === "tab") {
      this._tab = el.getAttribute("data-tab");
      this._kamer = null;
      veiligSet("nachtbord-tab", this._tab);
      this._tekenNav();
      this._laatsteHtml = "";
      this._render();
      this._naHass();
      return;
    }
    if (!h) return;
    var svc = function (domein, service, data, target) {
      try { h.callService(domein, service, data || {}, target || undefined); } catch (e) { /* stil */ }
    };
    if (act === "kamer") { this._kamer = el.getAttribute("data-kamer"); this._laatsteHtml = ""; this._render(); }
    else if (act === "terug") { this._kamer = null; this._laatsteHtml = ""; this._render(); }
    else if (act === "stap") svc("script", "tado_stap", { entity_id: el.getAttribute("data-ent"), delta: parseFloat(el.getAttribute("data-delta")) });
    else if (act === "power") svc("script", "tado_power", { entity_id: el.getAttribute("data-ent") });
    else if (act === "knop") svc("button", "press", {}, { entity_id: el.getAttribute("data-ent") });
    else if (act === "vacuum") svc("vacuum", el.getAttribute("data-svc"), {}, { entity_id: "vacuum.james" });
    else if (act === "slot") {
      var slot = this._st("lock." + FORD + "doorlock");
      svc("lock", slot && slot.state === "locked" ? "unlock" : "lock", {}, { entity_id: "lock." + FORD + "doorlock" });
    } else if (act === "media") {
      var sp = el.getAttribute("data-ent"), s2 = el.getAttribute("data-svc");
      if (s2 === "volume_up" || s2 === "volume_down") {
        var cur = this._attr(sp, "volume_level");
        var nv = Math.max(0, Math.min(1, (typeof cur === "number" ? cur : 0.3) + (s2 === "volume_up" ? 0.08 : -0.08)));
        svc("media_player", "volume_set", { volume_level: Math.round(nv * 100) / 100 }, { entity_id: sp });
      } else svc("media_player", s2, {}, { entity_id: sp });
    }
  }
  _st(id) { return this._hass && this._hass.states ? this._hass.states[id] : undefined; }
  _s(id) { var s = this._st(id); return s ? s.state : null; }
  _attr(id, naam) { var s = this._st(id); return s && s.attributes ? s.attributes[naam] : undefined; }
  _num(id) { var v = parseFloat(this._s(id)); return isNaN(v) ? null : v; }

  _hero(zin, sub, beeld) {
    var rechts = "";
    if (beeld) rechts = '<div class="hero-beeld"><img src="' + beeld + '" alt=""></div>';
    else {
      var tabDef = null;
      for (var i = 0; i < TABS.length; i++) if (TABS[i].id === this._tab) tabDef = TABS[i];
      rechts = '<div class="hero-icoon"><div class="bol">' +
        icoon(tabDef ? tabDef.icoon : "thuis", 74, KLEUR.teal) + "</div></div>";
    }
    return '<div class="hero-tekst"><div class="hero-zin">' + esc(zin) + '</div>' +
      (sub ? '<div class="hero-sub">' + esc(sub) + "</div>" : "") + "</div>" + rechts;
  }
  _tegel(opt) {
    var balk = "";
    if (typeof opt.balk === "number") {
      var pct = Math.max(0, Math.min(100, opt.balk));
      balk = '<div class="balk"><i style="width:' + pct + '%"></i></div>';
    }
    return '<div class="tegel' + (opt.tab ? " klikbaar" : "") + '"' +
      (opt.tab ? ' data-act="tab" data-tab="' + opt.tab + '"' : "") + ">" +
      '<div class="kop"><span class="chip">' + icoon(opt.icoon || "thuis", 26, opt.teal ? KLEUR.teal : KLEUR.grijs) +
      '</span><span class="naam">' + esc(opt.naam) + "</span></div>" +
      '<div class="waarde">' + opt.waarde + "</div>" +
      (opt.zin ? '<div class="zin">' + esc(opt.zin) + "</div>" : "") + balk + "</div>";
  }
  _render() {
    if (!this._hass || !this._gebouwd) return;
    var heroEl = this.shadowRoot.getElementById("hero");
    var inhEl = this.shadowRoot.getElementById("inhoud");
    if (!heroEl || !inhEl) return;
    var deel = this["_tab_" + this._tab] ? this["_tab_" + this._tab]() : { hero: "", inhoud: "" };
    var sleutel = this._tab + "|" + (this._kamer || "") + "|" + deel.hero + "|" + deel.inhoud;
    if (sleutel === this._laatsteHtml) return;
    this._laatsteHtml = sleutel;
    heroEl.innerHTML = deel.hero;
    inhEl.innerHTML = deel.inhoud;
    if (this._tab === "veiligheid") this._laadFoto("voordeur", "camera.voordeur_snapshot", "/api/camera_proxy/camera.voordeur_snapshot");
    if (this._tab === "stofzuiger") this._laadFoto("jameskaart", "image.james", "/api/image_proxy/image.james");
    if (this._tab === "muziek") this._laadFoto("hoes", SPELERS[0].id, null);
  }
  _naHass() {
    var self = this;
    if (this._tab === "energie" || this._tab === "thuis") this._laadDag();
    if (this._fotoTimer) { clearInterval(this._fotoTimer); this._fotoTimer = null; }
    if (this._tab === "veiligheid") {
      this._fotoTimer = setInterval(function () {
        self._fotoPad.voordeur = null;
        self._laadFoto("voordeur", "camera.voordeur_snapshot", "/api/camera_proxy/camera.voordeur_snapshot");
      }, 30000);
    }
  }
  _laadFoto(sleutel, entiteit, pad) {
    var img = this.shadowRoot.getElementById("foto-" + sleutel);
    if (!img || !this._hass) return;
    if (this._fotoPad[sleutel]) { img.src = this._fotoPad[sleutel]; return; }
    var self = this;
    var bron = pad;
    if (!bron) {
      var pic = this._attr(entiteit, "entity_picture");
      if (pic) { img.src = pic; return; }
      bron = "/api/media_player_proxy/" + entiteit;
    }
    if (!this._hass.connection || !this._hass.connection.sendMessagePromise) return;
    this._hass.connection.sendMessagePromise({ type: "auth/sign_path", path: bron }).then(function (r) {
      if (r && r.path) {
        self._fotoPad[sleutel] = r.path;
        var el2 = self.shadowRoot.getElementById("foto-" + sleutel);
        if (el2) el2.src = r.path;
      }
    }).catch(function () { /* foto blijft leeg vlak */ });
  }
  _laadDag() {
    var nu = Date.now();
    if (this._dagTs && nu - this._dagTs < 60000) return;
    this._dagTs = nu;
    if (!this._hass || !this._hass.callWS) return;
    var start = new Date(); start.setHours(0, 0, 0, 0);
    var ids = ["sensor.p1_meter_energie_import", "sensor.p1_meter_energie_export",
      "sensor.solaredge_se3000h_energie", "sensor.gas_meter_gas"];
    var self = this;
    this._hass.callWS({
      type: "recorder/statistics_during_period",
      start_time: start.toISOString(), end_time: new Date().toISOString(),
      statistic_ids: ids, period: "day", types: ["change"]
    }).then(function (r) {
      var uit = {};
      ids.forEach(function (id) {
        var rij = r && r[id];
        uit[id] = rij && rij.length && typeof rij[0].change === "number" ? rij[0].change : null;
      });
      self._dag = uit;
      self._laatsteHtml = "";
      self._render();
    }).catch(function () { self._dag = self._dag || {}; });
  }

  /* ---------- THUIS ---------- */
  _tab_thuis() {
    var weer = this._st("weather.forecast_thuis");
    var temp = weer && typeof weer.attributes.temperature === "number" ? weer.attributes.temperature : null;
    var cond = weer ? (WEER_NL[weer.state] || weer.state) : "";
    var vocht = weer ? weer.attributes.humidity : null;
    var zonOnder = this._attr("sun.sun", "next_setting");
    var nu = new Date();
    var datum = nu.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
    var sub = datum.charAt(0).toUpperCase() + datum.slice(1) + " · " + tijdVan(nu.toISOString());
    if (temp !== null) sub += " · Buiten " + getal(temp, 1) + "° en " + cond.toLowerCase();
    if (zonOnder) sub += " · Zon onder om " + tijdVan(zonOnder);

    var p1 = this._num("sensor.p1_meter_vermogen");
    var zon = this._num("sensor.solaredge_se3000h_vermogen");
    var jamesState = this._s("vacuum.james");
    var bew = this._st("binary_sensor.voordeur_motion");
    var zin = "Alles rustig thuis.";
    if (bew && bew.state === "on") zin = "Er is beweging bij de voordeur.";
    else if (jamesState === "cleaning") zin = "James is aan het schoonmaken.";
    else if (p1 !== null && p1 < -100) zin = "De panelen leveren meer dan het huis vraagt.";
    else if (this._s("person.alex") === "not_home") zin = "Het huis is even alleen thuis.";

    var eten = this._st("calendar.mealie_diner");
    var etenWaarde = "Niets gepland", etenZin = "De weekplanner van Mealie is nog leeg";
    if (eten && eten.state === "on" && eten.attributes.message) {
      etenWaarde = esc(eten.attributes.message);
      etenZin = "Vanavond op het plan" + (eten.attributes.start_time ? " · " + tijdVan(eten.attributes.start_time) : "");
    }
    var jamesAccu = this._num("sensor.james_batterij");
    var kugaSoc = this._num("sensor." + FORD + "soc");
    var slotSt = this._s("sensor." + FORD + "doorlock");
    var energieWaarde, energieZin;
    if (p1 === null) { energieWaarde = "Onbekend"; energieZin = "De P1-meter geeft niets door"; }
    else if (p1 < 0) { energieWaarde = "Levert " + getal(Math.abs(p1)) + ' <span class="eenheid">W terug</span>'; energieZin = "De panelen wekken nu " + getal(zon) + " W op"; }
    else { energieWaarde = getal(p1) + ' <span class="eenheid">W</span>'; energieZin = "Verbruik nu" + (zon ? " · panelen leveren " + getal(zon) + " W" : ""); }

    var tegels = [
      this._tegel({ naam: "Weer", icoon: "weer", tab: "kamers", waarde: temp !== null ? getal(temp, 1) + "°" : "Onbekend", zin: cond + (vocht !== null && vocht !== undefined ? " · luchtvochtigheid " + getal(vocht) + "%" : "") }),
      this._tegel({ naam: "Energie nu", icoon: "energie", tab: "energie", teal: p1 !== null && p1 < 0, waarde: energieWaarde, zin: energieZin }),
      this._tegel({ naam: "Vanavond", icoon: "eten", waarde: etenWaarde, zin: etenZin }),
      this._tegel({ naam: "Voordeur", icoon: "bel", tab: "veiligheid", waarde: bew ? (bew.state === "on" ? "Beweging" : "Rustig") : "Onbekend", zin: bew ? "Laatste beweging " + geleden(bew.last_changed) : "" }),
      this._tegel({ naam: "Kuga", icoon: "auto", tab: "auto", waarde: kugaSoc !== null ? getal(kugaSoc) + ' <span class="eenheid">%</span>' : "Onbekend", zin: slotSt === "LOCKED" || slotSt === "Locked" ? "Accu · de auto is afgesloten" : "Accu · let op: de auto is niet afgesloten", balk: kugaSoc }),
      this._tegel({ naam: "James", icoon: "stofzuiger", tab: "stofzuiger", waarde: jamesAccu !== null ? getal(jamesAccu) + ' <span class="eenheid">%</span>' : "Onbekend", zin: jamesState === "docked" ? "Accu · aan het dock" : jamesState === "cleaning" ? "Accu · aan het schoonmaken" : "Accu · " + (jamesState || ""), balk: jamesAccu })
    ];
    return {
      hero: this._hero(zin, sub, "/local/nacht/huis.webp"),
      inhoud: '<div class="raster" style="grid-template-columns:repeat(3,1fr);grid-template-rows:1fr 1fr;">' + tegels.join("") + "</div>"
    };
  }

  /* ---------- KAMERS ---------- */
  _kamerData(k) {
    if (k.speciaal === "wc") {
      return { temp: this._num("sensor.bewegingssensor_wc_temperature"), vocht: this._num("sensor.bewegingssensor_wc_humidity"), doel: null, aan: false, verwarmt: false, aanwezig: this._s("binary_sensor.bewegingssensor_wc_presence") === "on" };
    }
    var ce = this._st(k.ce);
    if (!ce) return { temp: null, vocht: null, doel: null, aan: false, verwarmt: false };
    return {
      temp: typeof ce.attributes.current_temperature === "number" ? ce.attributes.current_temperature : null,
      vocht: typeof ce.attributes.current_humidity === "number" ? ce.attributes.current_humidity : null,
      doel: typeof ce.attributes.temperature === "number" ? ce.attributes.temperature : null,
      aan: ce.state !== "off" && ce.state !== "unavailable",
      verwarmt: ce.attributes.hvac_action === "heating",
      vensterOpen: this._s(k.venster) === "on"
    };
  }
  _tab_kamers() {
    if (this._kamer) return this._kamerDetail(this._kamer);
    var zin = "Zo voelt het huis nu.";
    var warmste = null, koudste = null;
    var vlakken = "";
    var pos = {
      woonkamer: [10, 46, 196, 396], keuken: [216, 46, 200, 178], hal: [216, 234, 200, 118],
      wc: [216, 362, 96, 96], trap: [322, 362, 94, 80],
      ouders: [452, 46, 202, 208], naud: [452, 264, 202, 178],
      cas: [664, 46, 190, 150], badkamer: [664, 206, 190, 150], overloop: [664, 366, 190, 76],
      kantoor: [10, 470, 412, 74], berging: [432, 470, 422, 74]
    };
    var deco = { trap: "Trap", overloop: "Overloop", berging: "Berging", hal: "Hal" };
    var self = this;
    Object.keys(pos).forEach(function (id) {
      var p = pos[id], stijl = "left:" + p[0] + "px;top:" + p[1] + "px;width:" + p[2] + "px;height:" + p[3] + "px;";
      if (deco[id]) {
        vlakken += '<div class="kamervlak deco" style="' + stijl + '"><div class="kn">' + deco[id] + "</div></div>";
        return;
      }
      var k = KAMERS.find(function (x) { return x.id === id; });
      var d = self._kamerData(k);
      if (d.temp !== null) {
        if (warmste === null || d.temp > warmste.temp) warmste = { naam: k.naam, temp: d.temp };
        if (koudste === null || d.temp < koudste.temp) koudste = { naam: k.naam, temp: d.temp };
      }
      var inhoudVlak = '<div class="kn">' + esc(k.naam) + "</div>";
      if (id === "keuken") {
        var oven = self._s("sensor.oven_status");
        inhoudVlak += '<div class="kt" style="font-size:24px;">' + (oven === "inactive" ? "Oven uit" : "Oven aan") + "</div>" +
          '<div class="kd">' + (self._s("sensor.vaatwasser_status") === "inactive" ? "Vaatwasser uit" : "Vaatwasser draait") + "</div>";
      } else if (d.temp !== null) {
        inhoudVlak += '<div class="kt">' + getal(d.temp, 1) + "°</div>" +
          '<div class="kd">' + (k.speciaal === "wc" ? "vocht " + (d.vocht !== null ? getal(d.vocht) + "%" : "?") :
            (d.aan && d.doel !== null ? "doel " + getal(d.doel, 1) + "°" : "verwarming uit")) + "</div>";
      } else {
        inhoudVlak += '<div class="kt" style="font-size:24px;">Geen meting</div><div class="kd">' +
          (d.doel !== null ? "doel " + getal(d.doel, 1) + "°" : "") + "</div>";
      }
      vlakken += '<div class="kamervlak' + (d.verwarmt ? " warm" : "") + '" style="' + stijl +
        '" data-act="kamer" data-kamer="' + id + '">' + inhoudVlak + "</div>";
    });
    if (warmste && koudste && warmste.naam !== koudste.naam) {
      zin = warmste.naam + " is het warmst, " + koudste.naam + " het koelst.";
    }
    var rijen = KAMERS.map(function (k) {
      var d = self._kamerData(k);
      var onder, rechts;
      if (k.speciaal === "keuken") {
        onder = "Oven " + (self._s("sensor.oven_status") === "inactive" ? "uit" : "aan") + " · vaatwasser " + (self._s("sensor.vaatwasser_status") === "inactive" ? "uit" : "draait");
        rechts = "";
      } else if (k.speciaal === "wc") {
        onder = d.vocht !== null ? "Luchtvochtigheid " + getal(d.vocht) + "%" + (d.aanwezig ? " · iemand aanwezig" : "") : "";
        rechts = d.temp !== null ? getal(d.temp, 1) + "°" : "";
      } else {
        onder = d.aan && d.doel !== null ? "Doel " + getal(d.doel, 1) + "°" : "Verwarming uit";
        if (d.vocht !== null) onder += " · vocht " + getal(d.vocht) + "%";
        if (d.vensterOpen) onder += " · raam open volgens Tado";
        rechts = d.temp !== null ? getal(d.temp, 1) + "°" : "geen meting";
      }
      return '<div class="rij klein" data-act="kamer" data-kamer="' + k.id + '">' +
        '<span class="rond">' + icoon("thermo", 22, d.verwarmt ? KLEUR.teal : KLEUR.grijs) + "</span>" +
        '<div class="midden"><div class="titel">' + esc(k.naam) + '</div><div class="onder">' + esc(onder) + "</div></div>" +
        '<div class="rechts">' + esc(rechts) + "</div></div>";
    }).join("");
    var ww = this._st("water_heater.warm_water_warm_water_2");
    var wwRij = '<div class="rij klein" style="cursor:default;"><span class="rond">' + icoon("vlam", 22, KLEUR.grijs) + "</span>" +
      '<div class="midden"><div class="titel">Warm water</div><div class="onder">' +
      (ww ? "Staat op " + (ww.state === "auto" ? "schema" : esc(ww.state)) : "Onbekend") + ' · boost:</div></div>' +
      [30, 60, 90].map(function (m) {
        return '<button class="knop" data-act="knop" data-ent="button.warm_water_warm_water_' + m + 'min_timer">' + m + " min</button>";
      }).join("") + "</div>";
    return {
      hero: this._hero(zin, "Tik op een kamer voor de bediening. De plattegrond toont de temperatuur van nu.", null),
      inhoud: '<div style="display:flex;gap:22px;height:100%;">' +
        '<div class="tegel" style="flex:none;width:902px;padding:22px;">' +
        '<div class="planvak" style="width:856px;height:560px;">' +
        '<div class="vloertitel" style="left:10px;top:6px;">Beneden</div>' +
        '<div class="vloertitel" style="left:452px;top:6px;">Boven</div>' + vlakken + "</div></div>" +
        '<div style="flex:1;display:flex;flex-direction:column;gap:10px;min-width:0;">' +
        '<div class="rijen" style="overflow:hidden;gap:10px;">' + rijen + "</div>" + wwRij + "</div></div>"
    };
  }
  _kamerDetail(id) {
    var k = KAMERS.find(function (x) { return x.id === id; });
    if (!k) { this._kamer = null; return this._tab_kamers(); }
    var d = this._kamerData(k);
    var terug = '<button class="knop" data-act="terug">' + icoon("terug", 22, KLEUR.wit) + " Plattegrond</button>";
    var midden;
    if (k.speciaal === "keuken") {
      var ov = this._st("sensor.oven_status"), vw = this._st("sensor.vaatwasser_status");
      midden = '<div class="raster" style="grid-template-columns:1fr 1fr;">' +
        this._tegel({ naam: "Oven", icoon: "vlam", waarde: ov && ov.state !== "inactive" ? "Aan" : "Uit", zin: "Programma: " + (this._s("select.oven_geselecteerd_programma") || "geen") + " · deur " + (this._s("sensor.oven_deur") === "closed" ? "dicht" : "open") + " · nu " + getal(this._num("sensor.oven_huidige_temperatuur_in_de_oven")) + "° binnen" }) +
        this._tegel({ naam: "Vaatwasser", icoon: "druppel", waarde: vw && vw.state !== "inactive" ? "Draait" : "Uit", zin: "Programma: " + (this._s("select.vaatwasser_geselecteerd_programma") || "geen") + " · deur " + (this._s("sensor.vaatwasser_deur") === "closed" ? "dicht" : "open") }) +
        "</div>";
      return {
        hero: this._hero("Keuken", "Bediening van oven en vaatwasser staat op het Keukenbord; hier zie je de stand.", null),
        inhoud: '<div style="margin-bottom:20px;">' + terug + "</div>" + midden
      };
    }
    if (k.speciaal === "wc") {
      midden = '<div class="raster" style="grid-template-columns:1fr 1fr;">' +
        this._tegel({ naam: "Temperatuur", icoon: "thermo", waarde: d.temp !== null ? getal(d.temp, 1) + "°" : "Onbekend", zin: "Gemeten door de bewegingssensor" }) +
        this._tegel({ naam: "Aanwezigheid", icoon: "beweging", waarde: d.aanwezig ? "Iemand" : "Niemand", zin: "Luchtvochtigheid " + (d.vocht !== null ? getal(d.vocht) + "%" : "onbekend") }) + "</div>";
      return {
        hero: this._hero("WC", "De WC heeft geen verwarmingsknop in dit overzicht, alleen de meting.", null),
        inhoud: '<div style="margin-bottom:20px;">' + terug + "</div>" + midden
      };
    }
    var lokaalSt = this._s(k.lokaal);
    var bedienbaar = lokaalSt !== null && lokaalSt !== "unavailable";
    var groot = d.temp !== null ? getal(d.temp, 1) + "°" : "Geen meting";
    var doelTekst = d.aan && d.doel !== null ? "Doel " + getal(d.doel, 1) + "°" : "Verwarming staat uit";
    var knoppen = "";
    if (bedienbaar) {
      knoppen = '<div style="display:flex;align-items:center;gap:26px;">' +
        '<div class="stapknop" data-act="stap" data-ent="' + k.lokaal + '" data-delta="-0.5">' + icoon("min", 40, KLEUR.wit) + "</div>" +
        '<div style="text-align:center;min-width:210px;"><div style="font-size:40px;font-weight:800;color:' + KLEUR.wit + ';">' +
        (d.doel !== null ? getal(d.doel, 1) + "°" : "20,0°") + '</div><div style="font-size:19px;font-weight:600;color:' + KLEUR.grijs + ';">ingesteld doel</div></div>' +
        '<div class="stapknop" data-act="stap" data-ent="' + k.lokaal + '" data-delta="0.5">' + icoon("plus", 40, KLEUR.wit) + "</div></div>" +
        '<button class="knop' + (d.aan ? "" : " teal") + '" data-act="power" data-ent="' + k.lokaal + '" style="margin-left:44px;">' +
        icoon("power", 24, d.aan ? KLEUR.wit : KLEUR.teal) + (d.aan ? " Zet verwarming uit" : " Zet aan op 20°") + "</button>";
    } else {
      knoppen = '<div class="zin">Bediening loopt voor deze kamer via de Tado-app; hier zie je alleen de stand.</div>';
    }
    midden = '<div class="tegel" style="height:340px;"><div class="kop"><span class="chip">' +
      icoon("thermo", 26, d.verwarmt ? KLEUR.teal : KLEUR.grijs) + '</span><span class="naam">' + esc(k.naam) + "</span></div>" +
      '<div style="display:flex;align-items:center;gap:60px;"><div><div class="waarde" style="font-size:96px;">' + groot + "</div>" +
      '<div class="zin">' + esc(doelTekst) + (d.vocht !== null ? " · luchtvochtigheid " + getal(d.vocht) + "%" : "") +
      (d.vensterOpen ? " · raam open volgens Tado" : "") + "</div></div>" + knoppen + "</div></div>";
    return {
      hero: this._hero(k.naam, d.verwarmt ? "De verwarming is hier nu aan het werk." : "Tik op plus of min om het doel bij te stellen.", null),
      inhoud: '<div style="margin-bottom:20px;">' + terug + "</div>" + midden
    };
  }

  /* ---------- AUTO ---------- */
  _tab_auto() {
    var soc = this._num("sensor." + FORD + "soc");
    var elBereik = this._num("sensor." + FORD + "elveh");
    var brandstof = this._num("sensor." + FORD + "fuel");
    var totaalBereik = this._num("sensor." + FORD + "fuelrange");
    var stekker = this._s("sensor." + FORD + "elvehplug");
    var laden = this._s("sensor." + FORD + "elvehcharging");
    var laadVermogen = this._num("sensor." + FORD + "elvehchargingpower");
    var slotSt = this._s("sensor." + FORD + "doorlock");
    var afgesloten = slotSt === "LOCKED" || slotSt === "Locked";
    var deuren = this._s("sensor." + FORD + "doorstatus");
    var ramen = this._s("sensor." + FORD + "windowposition");
    var zin = "De Kuga staat klaar.";
    if (laden === "CHARGING" || laden === "Charging") zin = "De Kuga staat te laden" + (laadVermogen ? " met " + getal(laadVermogen, 2) + " kW." : ".");
    else if (!afgesloten) zin = "De Kuga is niet afgesloten.";
    else if (soc !== null && soc < 30) zin = "De accu van de Kuga is bijna leeg.";
    var doel = this._s("select." + FORD + "elvehtargetcharge");
    var tegels = [
      this._tegel({ naam: "Accu", icoon: "accu", teal: true, waarde: soc !== null ? getal(soc) + ' <span class="eenheid">%</span>' : "Onbekend", zin: "Elektrisch bereik " + (elBereik !== null ? getal(elBereik, 1) + " km" : "onbekend") + (doel ? " · laadlimiet in de FordPass-app: " + esc(doel) + "%" : ""), balk: soc }),
      this._tegel({ naam: "Bereik totaal", icoon: "auto", waarde: totaalBereik !== null ? getal(totaalBereik) + ' <span class="eenheid">km</span>' : "Onbekend", zin: "Op benzine en stroom samen · stand " + (getal(this._num("sensor." + FORD + "odometer")) || "?") + " km" }),
      this._tegel({ naam: "Brandstof", icoon: "vlam", waarde: brandstof !== null ? getal(brandstof) + ' <span class="eenheid">%</span>' : "Onbekend", zin: "In de tank", balk: brandstof }),
      this._tegel({ naam: "Sloten", icoon: afgesloten ? "slot" : "slotopen", teal: afgesloten, waarde: afgesloten ? "Afgesloten" : "Open", zin: "Deuren " + (deuren === "Closed" ? "dicht" : esc(deuren || "?")) + " · ramen " + (ramen === "Closed" ? "dicht" : esc(ramen || "?")) }),
      this._tegel({ naam: "Stekker", icoon: "stekker", waarde: stekker === "CONNECTED" ? "Ingeplugd" : "Los", zin: laden === "CHARGING" || laden === "Charging" ? "Aan het laden" : "Niet aan het laden" }),
      this._tegel({ naam: "12V-accu en olie", icoon: "accu", waarde: (getal(this._num("sensor." + FORD + "battery")) || "?") + ' <span class="eenheid">%</span>', zin: "Startaccu · olie op " + (getal(this._num("sensor." + FORD + "oil")) || "?") + "% van de levensduur" })
    ];
    var knoppen = '<div style="display:flex;gap:16px;margin-top:22px;">' +
      '<button class="knop teal" data-act="slot">' + icoon(afgesloten ? "slotopen" : "slot", 24, KLEUR.teal) + (afgesloten ? " Ontgrendel" : " Vergrendel") + "</button>" +
      '<button class="knop" data-act="knop" data-ent="button.' + FORD + 'request_refresh">' + icoon("ververs", 24, KLEUR.wit) + " Vernieuw gegevens</button></div>";
    return {
      hero: this._hero(zin, "Ford Kuga · gegevens van " + geleden(this._st("sensor." + FORD + "lastrefresh") ? this._st("sensor." + FORD + "lastrefresh").last_changed : null), "/local/nacht/auto.webp"),
      inhoud: '<div style="display:flex;flex-direction:column;height:100%;">' +
        '<div class="raster" style="grid-template-columns:repeat(3,1fr);grid-template-rows:1fr 1fr;flex:1;">' + tegels.join("") + "</div>" + knoppen + "</div>"
    };
  }

  /* ---------- ENERGIE ---------- */
  _tab_energie() {
    var p1 = this._num("sensor.p1_meter_vermogen");
    var zon = this._num("sensor.solaredge_se3000h_vermogen");
    var dag = this._dag || {};
    var imp = dag["sensor.p1_meter_energie_import"], exp = dag["sensor.p1_meter_energie_export"];
    var zonDag = dag["sensor.solaredge_se3000h_energie"], gasDag = dag["sensor.gas_meter_gas"];
    var zin = "Het huis draait op stroom van het net.";
    if (p1 !== null && p1 < -50) zin = "Het huis levert nu terug aan het net.";
    else if (zon !== null && zon > 50) zin = "De panelen wekken nu stroom op.";
    var dagZin = function (v, eenheid) { return v === null || v === undefined ? "Dagstand wordt nog opgehaald" : "Vandaag " + getal(v, 2) + " " + eenheid; };
    var boven = [
      this._tegel({ naam: "Verbruik nu", icoon: "energie", teal: p1 !== null && p1 < 0, waarde: p1 === null ? "Onbekend" : p1 < 0 ? getal(Math.abs(p1)) + ' <span class="eenheid">W terug</span>' : getal(p1) + ' <span class="eenheid">W</span>', zin: p1 !== null && p1 < 0 ? "Het huis levert stroom terug aan het net" : "Wat het huis op dit moment afneemt", balk: p1 !== null ? Math.min(100, Math.abs(p1) / 30) : null }),
      this._tegel({ naam: "Opwek nu", icoon: "weer", teal: zon !== null && zon > 50, waarde: zon === null ? "Onbekend" : getal(zon) + ' <span class="eenheid">W</span>', zin: "Van de zonnepanelen · status " + (this._s("sensor.solaredge_se3000h_status") === "producing" ? "produceert" : esc(this._s("sensor.solaredge_se3000h_status") || "onbekend")), balk: zon !== null ? zon / 30 : null })
    ];
    var onder = [
      this._tegel({ naam: "Afname", icoon: "stekker", waarde: imp === null || imp === undefined ? "Even geduld" : getal(imp, 2) + ' <span class="eenheid">kWh</span>', zin: dagZin(imp, "kWh") === "Dagstand wordt nog opgehaald" ? "Dagstand wordt opgehaald uit de statistieken" : "Van het net gehaald · totaal " + (getal(this._num("sensor.p1_meter_energie_import")) || "?") + " kWh" }),
      this._tegel({ naam: "Teruglevering", icoon: "energie", waarde: exp === null || exp === undefined ? "Even geduld" : getal(exp, 2) + ' <span class="eenheid">kWh</span>', zin: "Terug aan het net · totaal " + (getal(this._num("sensor.p1_meter_energie_export")) || "?") + " kWh" }),
      this._tegel({ naam: "Opwek", icoon: "weer", waarde: zonDag === null || zonDag === undefined ? "Even geduld" : getal(zonDag, 2) + ' <span class="eenheid">kWh</span>', zin: "Van de panelen · totaal " + (getal(this._num("sensor.solaredge_se3000h_energie")) || "?") + " kWh" }),
      this._tegel({ naam: "Gas", icoon: "vlam", waarde: gasDag === null || gasDag === undefined ? "Even geduld" : getal(gasDag, 2) + ' <span class="eenheid">m³</span>', zin: "Verbruik vandaag · meterstand " + (getal(this._num("sensor.gas_meter_gas")) || "?") + " m³ · saldo stroom " + (getal(this._num("sensor.energie_saldo")) || "?") + " kWh" })
    ];
    return {
      hero: this._hero(zin, "Dagstanden komen uit de energiestatistieken van Home Assistant.", null),
      inhoud: '<div style="display:flex;flex-direction:column;gap:22px;height:100%;">' +
        '<div class="raster" style="grid-template-columns:1fr 1fr;flex:1.15;">' + boven.join("") + "</div>" +
        '<div class="raster" style="grid-template-columns:repeat(4,1fr);flex:1;">' + onder.join("") + "</div></div>"
    };
  }

  /* ---------- VEILIGHEID ---------- */
  _tab_veiligheid() {
    var bew = this._st("binary_sensor.voordeur_motion");
    var bel = this._st("binary_sensor.voordeur_ding");
    var bewCas = this._st("binary_sensor.0xa4c138259343bb2e_presence");
    var recent = bew && (Date.now() - new Date(bew.last_changed).getTime() < 30 * 60000);
    var zin = recent ? "Er was net beweging bij de voordeur." : "Alles rustig rond het huis.";
    var openRamen = [];
    KAMERS.forEach(function (k) { if (k.venster && this._s(k.venster) === "on") openRamen.push(k.naam); }, this);
    var p2 = this._st("sensor.p2000_hollands_midden");
    var p2Waarde = "Rustig", p2Zin = "Geen meldingen uit Leiderdorp in de laatste feed";
    if (p2 && p2.attributes && Array.isArray(p2.attributes.incidenten)) {
      var ld = p2.attributes.incidenten.filter(function (i) {
        var plaats = (i.city || i.plaats || i.locatie || "").toString().toLowerCase();
        return plaats.indexOf("leiderdorp") >= 0;
      })[0];
      if (ld) {
        p2Waarde = esc(ld.discipline || ld.dienst || ld.type || "Melding");
        var p2Tijd = ld.published || ld.tijd || ld.time;
        p2Zin = (p2Tijd ? geleden(p2Tijd) + " · " : "") + (ld.message || ld.titel || ld.omschrijving || ld.melding || ld.straat || "");
      } else if (p2.state) { p2Zin = "Laatste regiomelding: " + p2.state; }
    } else if (p2 && p2.state) { p2Zin = "Laatste regiomelding: " + p2.state; }
    var camStatus = function (id) {
      var s = this._s(id);
      return s === "recording" ? "Neemt op" : s === "idle" ? "Stand-by" : s === "streaming" ? "Kijkt mee" : (s || "Onbekend");
    };
    var tegels = [
      this._tegel({ naam: "Beweging voordeur", icoon: "beweging", teal: !!(bew && bew.state === "on"), waarde: bew ? (bew.state === "on" ? "Beweging" : "Rustig") : "Onbekend", zin: bew ? "Laatste beweging " + geleden(bew.last_changed) : "" }),
      this._tegel({ naam: "Deurbel", icoon: "bel", waarde: bel ? (bel.state === "on" ? "Er belt iemand" : "Stil") : "Onbekend", zin: bel ? "Laatst aangebeld " + geleden(bel.last_changed) : "" }),
      this._tegel({ naam: "Camera Naud", icoon: "camera", waarde: camStatus.call(this, "camera.astronaud"), zin: "Babyfooncamera in de kamer van Naud" }),
      this._tegel({ naam: "Camera Cas", icoon: "camera", waarde: camStatus.call(this, "camera.astrocas"), zin: "Babyfooncamera in de kamer van Cas" }),
      this._tegel({ naam: "Beweging bij Cas", icoon: "beweging", waarde: bewCas ? (bewCas.state === "on" ? "Beweging" : "Rustig") : "Onbekend", zin: bewCas ? "Laatste beweging " + geleden(bewCas.last_changed) : "" }),
      this._tegel({ naam: "Ramen", icoon: "deur", teal: openRamen.length === 0, waarde: openRamen.length === 0 ? "Dicht" : openRamen.length + " open", zin: openRamen.length === 0 ? "Alle ramen dicht, volgens de Tado-detectie" : "Open volgens Tado: " + openRamen.join(", ") }),
      this._tegel({ naam: "P2000 Leiderdorp", icoon: "bel", waarde: p2Waarde, zin: p2Zin })
    ];
    return {
      hero: this._hero(zin, "Camera's en beweging in en om het huis. Er is geen alarmsysteem in HA; dit is wat er echt gemeten wordt.", null),
      inhoud: '<div class="raster krap" style="grid-template-columns:740px 1fr 1fr 1fr;grid-template-rows:1fr 1fr 0.82fr;">' +
        '<div style="grid-row:1/4;position:relative;"><img class="foto" id="foto-voordeur" alt="">' +
        '<div style="position:absolute;left:22px;bottom:20px;background:rgba(6,11,20,.78);color:' + KLEUR.wit +
        ';font-size:20px;font-weight:700;padding:10px 18px;border-radius:999px;">Voordeur · ' +
        (bew ? "beweging " + geleden(bew.last_changed) : "") + "</div></div>" +
        tegels.slice(0, 6).join("") +
        '<div style="grid-column:2/5;display:flex;">' + tegels[6] + "</div></div>"
    };
  }

  /* ---------- STOFZUIGER ---------- */
  _tab_stofzuiger() {
    var st = this._s("vacuum.james");
    var accu = this._num("sensor.james_batterij");
    var zin = "James staat aan het dock.";
    if (st === "cleaning") zin = "James is aan het schoonmaken.";
    else if (st === "returning") zin = "James rijdt terug naar het dock.";
    else if (st === "paused") zin = "James staat op pauze.";
    var knoppen = '<div style="display:flex;gap:20px;align-items:center;">' +
      '<div class="rondknop teal" data-act="vacuum" data-svc="start">' + icoon("speel", 38, "#06231E") + "</div>" +
      '<div class="rondknop" data-act="vacuum" data-svc="pause">' + icoon("pauze", 38, KLEUR.wit) + "</div>" +
      '<div class="rondknop" data-act="vacuum" data-svc="return_to_base">' + icoon("thuis", 38, KLEUR.wit) + "</div>" +
      '<div style="margin-left:10px;"><div style="font-size:22px;font-weight:700;color:' + KLEUR.wit + ';">Start · Pauze · Dock</div>' +
      '<div style="font-size:19px;font-weight:600;color:' + KLEUR.grijs + ';">Kamergericht schoonmaken loopt via de Ecovacs-app</div></div></div>';
    var tegels = [
      this._tegel({ naam: "Accu", icoon: "accu", teal: true, waarde: accu !== null ? getal(accu) + ' <span class="eenheid">%</span>' : "Onbekend", zin: st === "docked" ? "Vol en aan het dock" : "Stand van de accu", balk: accu }),
      this._tegel({ naam: "Laatste beurt", icoon: "stofzuiger", waarde: (getal(this._num("sensor.james_oppervlakte")) || "?") + ' <span class="eenheid">m²</span>', zin: "In " + (getal(this._num("sensor.james_duur")) || "?") + " minuten schoongemaakt" }),
      this._tegel({ naam: "Totaal", icoon: "klok", waarde: (getal(this._num("sensor.james_duur_2")) || "?") + ' <span class="eenheid">uur</span>', zin: "Schoonmaaktijd tot nu toe · " + (getal(this._num("sensor.james_oppervlakte_2")) || "?") + " m² in totaal" })
    ];
    return {
      hero: this._hero(zin, "De kaart is de echte plattegrond die James zelf heeft gemaakt.", null),
      inhoud: '<div style="display:flex;gap:22px;height:100%;">' +
        '<div class="tegel" style="flex:none;width:760px;padding:18px;"><img class="foto" id="foto-jameskaart" alt="" style="border-radius:16px;"></div>' +
        '<div style="flex:1;display:flex;flex-direction:column;gap:22px;min-width:0;">' +
        '<div class="raster" style="grid-template-columns:1fr 1fr;flex:1;">' + tegels[0] + tegels[1] + "</div>" +
        '<div class="tegel" style="flex:none;">' + '<div class="kop"><span class="chip">' + icoon("klok", 26, KLEUR.grijs) + '</span><span class="naam">Totaal</span></div>' +
        '<div class="waarde">' + (getal(this._num("sensor.james_duur_2")) || "?") + ' <span class="eenheid">uur schoonmaaktijd</span></div>' +
        '<div class="zin">' + (getal(this._num("sensor.james_oppervlakte_2")) || "?") + " m² in totaal schoongemaakt</div></div>" +
        '<div class="tegel" style="flex:none;">' + knoppen + "</div></div></div>"
    };
  }

  /* ---------- MUZIEK ---------- */
  _tab_muziek() {
    var hoofd = SPELERS[0].id;
    var hoofdStaat = this._s(hoofd);
    var spelend = hoofdStaat === "playing";
    var actief = spelend || hoofdStaat === "paused";
    var titel = actief ? this._attr(hoofd, "media_title") : null;
    var artiest = actief ? this._attr(hoofd, "media_artist") : null;
    var zin = spelend ? "Er speelt muziek in de woonkamer." : "Het is stil in huis.";
    var self = this;
    var rijen = SPELERS.slice(1).map(function (sp) {
      var s = self._st(sp.id);
      var speelt = s && s.state === "playing";
      var onder2 = !s ? "Onbekend" : speelt ? ((s.attributes.media_title || "Speelt") + (s.attributes.media_artist ? " · " + s.attributes.media_artist : "")) : s.state === "off" ? "Uit" : s.state === "unavailable" ? "Niet bereikbaar" : "Staat klaar";
      return '<div class="rij" style="cursor:default;"><span class="rond">' + icoon("muziek", 25, speelt ? KLEUR.teal : KLEUR.grijs) + "</span>" +
        '<div class="midden"><div class="titel">' + esc(sp.naam) + '</div><div class="onder">' + esc(onder2) + "</div></div>" +
        '<div class="rechts" style="font-size:21px;color:' + (speelt ? KLEUR.teal : KLEUR.grijs) + ';">' + (speelt ? "Speelt" : "") + "</div></div>";
    }).join("");
    var transport = '<div style="display:flex;gap:18px;align-items:center;">' +
      '<div class="rondknop" style="width:76px;height:76px;" data-act="media" data-ent="' + hoofd + '" data-svc="media_previous_track">' + icoon("vorige", 30, KLEUR.wit) + "</div>" +
      '<div class="rondknop teal" style="width:96px;height:96px;" data-act="media" data-ent="' + hoofd + '" data-svc="' + (spelend ? "media_pause" : "media_play") + '">' + icoon(spelend ? "pauze" : "speel", 40, "#06231E") + "</div>" +
      '<div class="rondknop" style="width:76px;height:76px;" data-act="media" data-ent="' + hoofd + '" data-svc="media_next_track">' + icoon("volgende", 30, KLEUR.wit) + "</div>" +
      '<div style="width:26px;"></div>' +
      '<div class="rondknop" style="width:76px;height:76px;" data-act="media" data-ent="' + hoofd + '" data-svc="volume_down">' + icoon("min", 30, KLEUR.wit) + "</div>" +
      '<div class="rondknop" style="width:76px;height:76px;" data-act="media" data-ent="' + hoofd + '" data-svc="volume_up">' + icoon("plus", 30, KLEUR.wit) + "</div></div>";
    var nu = '<div class="tegel" style="flex:1;"><div style="display:flex;gap:30px;align-items:center;height:100%;">' +
      '<img id="foto-hoes" alt="" style="width:300px;height:300px;border-radius:20px;object-fit:cover;background:' + KLEUR.kaart2 + ';flex:none;">' +
      '<div style="min-width:0;"><div class="kop" style="display:flex;align-items:center;gap:14px;margin-bottom:12px;"><span class="chip" style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;">' +
      icoon("muziek", 26, spelend ? KLEUR.teal : KLEUR.grijs) + '</span><span style="font-size:21px;font-weight:700;color:' + KLEUR.grijs + ';">Nu op de JBL Bar</span></div>' +
      '<div style="font-size:44px;font-weight:800;color:' + KLEUR.wit + ';line-height:1.15;">' + esc(titel || (spelend ? "Speelt iets" : "Niets aan")) + "</div>" +
      '<div class="zin" style="font-size:24px;">' + esc(artiest || (spelend ? "" : "Kies muziek op het Muziekbord of in de app")) + "</div>" +
      '<div style="margin-top:30px;">' + transport + "</div></div></div></div>";
    return {
      hero: this._hero(zin, "Het volledige muziekbord met playlists en wachtrij staat op zijn eigen pagina; dit is de snelle bediening.", null),
      inhoud: '<div style="display:flex;gap:22px;height:100%;">' + nu +
        '<div style="flex:none;width:600px;display:flex;flex-direction:column;gap:14px;">' +
        '<div style="font-size:21px;font-weight:700;color:' + KLEUR.grijs + ';padding:2px 4px;">Andere spelers</div>' + rijen + "</div></div>"
    };
  }
}

customElements.define("nachtbord-card", NachtbordCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "nachtbord-card", name: "Nachtbord", preview: false, description: "Rustig nachtbord voor de Lenovo: zeven secties in een kaart." });
