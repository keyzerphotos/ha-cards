/*
  bord-basis.js v1.0 — de gedeelde basis voor alle Lenovo-borden.
  Borden-eenheid (plan 6 nov 2026, bouw gestart 7 nov 2026): één bron voor
  tokens, lettertype, navigatie, ring en podium-schaal, in plaats van een
  hard gecodeerde CSS-kopie per kaart. Tokenlaag = dialect B (Keuken,
  Energie, Auto, Stofzuiger) zoals vastgelegd in het plan par. 2.

  Gebruik in een kaart (ES-module, relatief pad zodat de jsDelivr-commitpin
  van de kaart ook voor de basis geldt):
    import { zorgFont, NAV, navHtml, koppelNav, ringCss, ringRustCss,
             BASIS_CSS, startFit } from "./bord-basis.js";

  Lettertype: één familie 'Inter', vastgepind op fontsource 5.2.5 (geen
  @latest meer), gewichten 300/400/500/600 + 700 (700 bestond al op Eten en
  Muziek voor koppen; één extra gewichtbestand, één keer gecachet).
  Guard-id "bord-fonts"; de oude namen (FBInter, EBInter, MBInter) en de
  oude guard "familiebord-fonts" verdwijnen per gemigreerd bord.
*/

export var TOK = {
  achtergrond: "#08090b",
  gloed: "#101216",
  tekst: "#f4f4f2",
  label: "#a3a3a0",
  sleutel: "#d6d6d2",
  goud: "#d9a441",
  goudTekst: "#14100a",
  haarlijn: "rgba(255,255,255,.08)",
  tegelrand: "rgba(255,255,255,.09)",
  chiprand: "rgba(255,255,255,.13)",
  ringRust: "rgba(255,255,255,.07)",
  ringIdle: "rgba(217,164,65,.45)",
  disc: "#0b0c0f",
  opwek: "#e9c886",
  teruglever: "#8fce6e",
  waarschuwing: "#e8b04b",
  fout: "#e5484d",
  live: "#7ac74f"
};

var FONT_ID = "bord-fonts";
export function zorgFont() {
  if (document.getElementById(FONT_ID)) return;
  var gewichten = [300, 400, 500, 600, 700];
  var css = gewichten.map(function (g) {
    return "@font-face{font-family:'Inter';font-style:normal;font-weight:" + g +
      ";font-display:swap;src:url(https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-" +
      g + "-normal.woff2) format('woff2');}";
  }).join("");
  var st = document.createElement("style");
  st.id = FONT_ID;
  st.textContent = css;
  document.head.appendChild(st);
}

export var NAV = [
  ["Home", "/familie-bord"],
  ["Keuken", "/keuken-bord"],
  ["Muziek", "/muziek-dashboard"],
  ["Energie", "/energie-bord"],
  ["Auto", "/auto-bord"],
  ["Stofzuiger", "/stofzuiger-bord"],
  ["Babyfoon", "/babyfoon-bord"],
  ["Eten", "/eten-bord"]
];

// Let op: geeft alleen de <a>-items terug, zonder de .nav-wikkel;
// de kaart zet er zelf '<div class="nav">' + navHtml(x) + '</div>' omheen.
export function navHtml(actief) {
  return NAV.map(function (n) {
    return '<a href="' + n[1] + '"' + (n[0] === actief ? ' class="active"' : "") + ">" + n[0] + "</a>";
  }).join("");
}

/* SPA-wissel: pushState + location-changed, terugval na 900 ms als de
   wissel niet pakt. Directe /local/-links blijven een volle paginalading. */
export function koppelNav(wortel, hostEl) {
  Array.prototype.forEach.call(wortel.querySelectorAll(".nav a"), function (a) {
    a.addEventListener("click", function (ev) {
      var href = a.getAttribute("href");
      if (!href) return;
      if (href.indexOf("/local/") === 0) return;
      if (window.location.pathname === href) { ev.preventDefault(); return; }
      try {
        ev.preventDefault();
        window.history.pushState(null, "", href);
        var e = new Event("location-changed", { bubbles: true, composed: true });
        e.detail = { replace: false };
        window.dispatchEvent(e);
        setTimeout(function () { if (hostEl.isConnected) window.location.href = href; }, 900);
      } catch (err) { window.location.href = href; }
    });
  });
}

/* Eén ringdialect: graden, voortgang vol goud, rustspoor rgba(255,255,255,.07). */
export function ringCss(pct, kleur) {
  var deg = Math.max(0, Math.min(100, pct)) * 3.6;
  var k = kleur || TOK.goud;
  return "conic-gradient(" + k + " " + deg + "deg, " + TOK.ringRust + " " + deg + "deg)";
}
export function ringRustCss() {
  return "conic-gradient(" + TOK.ringIdle + " 0deg, " + TOK.ringRust + " 0deg)";
}

/*
  Gedeelde CSS. Kaarten nemen dit over en voegen alleen hun eigen
  bordspecifieke regels toe. Podium: vast 1920x1200, portret 900x1600.
*/
export var BASIS_CSS = `
  :host{ display:block; position:fixed; inset:0; height:100%; overflow:hidden; background:#08090b;
    font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif; color:#f4f4f2;
    -webkit-font-smoothing:antialiased; }
  *{ margin:0; padding:0; box-sizing:border-box; }
  .stage{ position:relative; width:1920px; height:1200px; transform-origin:top left; overflow:hidden;
    background:radial-gradient(1200px 800px at 30% 42%, #101216 0%, #08090b 62%); }
  .caps{ font-size:21px; letter-spacing:.34em; text-transform:uppercase; color:#a3a3a0; font-weight:500; }
  .tcaps{ font-size:18px; letter-spacing:.26em; text-transform:uppercase; color:#a3a3a0; font-weight:500; }
  .topbar{ position:absolute; top:56px; left:80px; right:80px; display:flex; justify-content:space-between; align-items:baseline; }
  .klok{ font-size:30px; font-weight:300; color:#f4f4f2; }
  .topline{ position:absolute; top:112px; left:80px; right:80px; height:1px; background:rgba(255,255,255,.08); }
  .tegel{ border:1px solid rgba(255,255,255,.09); border-radius:20px; background:rgba(255,255,255,.02); padding:24px 26px; }
  .chip{ font-size:20px; color:#d6d6d2; border:1px solid rgba(255,255,255,.13); border-radius:999px;
    padding:14px 26px; background:rgba(255,255,255,.025); cursor:pointer; user-select:none; }
  .chip.active{ border-color:rgba(217,164,65,.55); color:#f4f4f2; background:rgba(217,164,65,.10); }
  .chip:active, .ctl:active{ transform:scale(.97); }
  .ctl{ text-align:center; font-size:22px; padding:16px 10px; border-radius:16px; cursor:pointer; user-select:none;
    border:1px solid rgba(255,255,255,.13); background:rgba(255,255,255,.03); color:#f4f4f2; }
  .ctl.on{ border-color:rgba(217,164,65,.65); background:rgba(217,164,65,.12); }
  .srow{ display:flex; justify-content:space-between; align-items:center; padding:12px 0;
    border-bottom:1px solid rgba(255,255,255,.07); font-size:23px; }
  .srow:last-child{ border-bottom:none; }
  .srow .k{ color:#d6d6d2; }
  .srow .v{ font-weight:500; }
  .nav{ position:absolute; left:50%; transform:translateX(-50%); bottom:30px; display:flex; gap:8px;
    background:rgba(14,16,19,.88); border:1px solid rgba(255,255,255,.10); border-radius:999px; padding:9px; z-index:40; }
  .nav a{ font-size:21px; color:#d6d6d2; text-decoration:none; padding:11px 30px; border-radius:999px;
    border:1px solid transparent; letter-spacing:.04em; }
  .nav a.active{ background:rgba(217,164,65,.14); color:#f4f4f2; border-color:rgba(217,164,65,.55); }
  .stage.portrait{ width:900px; height:1600px; }
  .stage.portrait .topbar{ top:40px; left:44px; right:44px; }
  .stage.portrait .topline{ top:94px; left:44px; right:44px; }
  .stage.portrait .nav{ bottom:14px; flex-wrap:wrap; justify-content:center; width:94vw; row-gap:6px; }
  .stage.portrait .nav a{ font-size:19px; padding:10px 22px; }
`;

/*
  Podium-schaal: past het vaste podium in de host, wisselt portretklasse.
  Geeft een stopfunctie terug (observer + resize loskoppelen).
*/
export function startFit(host, stage) {
  function fit() {
    if (!stage) return;
    var w = host.clientWidth || window.innerWidth || 1920;
    var h = host.clientHeight || window.innerHeight || 1200;
    var portrait = h > w;
    stage.classList.toggle("portrait", portrait);
    var SW = portrait ? 900 : 1920, SH = portrait ? 1600 : 1200;
    var s = Math.min(w / SW, h / SH);
    stage.style.transform = "scale(" + s + ")";
    stage.style.marginLeft = ((w - SW * s) / 2) + "px";
    stage.style.marginTop = ((h - SH * s) / 2) + "px";
  }
  var ro = null;
  if (window.ResizeObserver) {
    ro = new ResizeObserver(fit);
    ro.observe(host);
  }
  window.addEventListener("resize", fit);
  fit();
  setTimeout(fit, 300);
  return function stopFit() {
    if (ro) ro.disconnect();
    window.removeEventListener("resize", fit);
  };
}
