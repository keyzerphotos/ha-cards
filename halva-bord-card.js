/* Halva-bord v1.0 (test) — nabouw van het dashboard uit de Instagram-reel
   van @_code_and_chill_ (app "Halva"), zoals vastgesteld uit het startframe
   van de reel (3 nov 2026): donker frosted-glas venster op zwart met zachte
   kleurvlekken, linker zijbalk, Climate-pagina met een "Whole House"-kaart
   (thermostaatring met streepjes rondom, gloeiende cyaan boog, witte knop
   met donker hart, min/plus eronder, Mode-pillen, schuifbalk, tegels) en
   een "Rooms"-kaart met kamerrijen en schuifbalken. Gevuld met de echte
   gegevens van dit huis. Geen backdrop-filter (tekent niet betrouwbaar in
   de tablet-WebView): het glas is nagebootst met half-dekkende vlakken.
   Canvas 1920x1200 dat als geheel meeschaalt (wallpanel-patroon). */
(function () {
  "use strict";

  var FONT_ID = "halva-bord-fonts";
  if (!document.getElementById(FONT_ID)) {
    var st = document.createElement("style");
    st.id = FONT_ID;
    st.textContent =
      "@font-face{font-family:'HBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-300-normal.woff2') format('woff2');font-weight:300}" +
      "@font-face{font-family:'HBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff2') format('woff2');font-weight:400}" +
      "@font-face{font-family:'HBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.woff2') format('woff2');font-weight:500}" +
      "@font-face{font-family:'HBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.woff2') format('woff2');font-weight:600}" +
      "@font-face{font-family:'HBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff2') format('woff2');font-weight:700}";
    document.head.appendChild(st);
  }

  var CSS = `
  :host{ display:block; position:fixed; inset:0; width:100%; height:100%; }
  *{ margin:0; padding:0; box-sizing:border-box; }
  .stage{
    position:relative; width:1920px; height:1200px; transform-origin: top left;
    font-family:'HBInter','Inter','Segoe UI',Roboto,Arial,sans-serif;
    background:
      radial-gradient(1000px 640px at 16% -6%, rgba(34,211,238,.15), rgba(34,211,238,0) 62%),
      radial-gradient(1100px 760px at 88% 12%, rgba(129,140,248,.13), rgba(129,140,248,0) 64%),
      radial-gradient(900px 700px at 55% 115%, rgba(14,116,144,.10), rgba(14,116,144,0) 60%),
      #04060a;
    color:#f5f8fa; overflow:hidden; -webkit-font-smoothing:antialiased;
  }
  .venster{
    position:absolute; left:34px; top:34px; width:1852px; height:1132px;
    background:rgba(10,14,20,.78); border:1px solid rgba(255,255,255,.07);
    border-radius:30px; box-shadow:0 30px 80px rgba(0,0,0,.5);
    display:flex; overflow:hidden;
  }
  /* Zijbalk */
  .sidebar{ width:296px; flex:none; padding:30px 22px 24px; display:flex; flex-direction:column;
    background:rgba(255,255,255,.02); border-right:1px solid rgba(255,255,255,.05); }
  .merk{ display:flex; align-items:center; gap:14px; padding:2px 8px; }
  .merkicoon{ width:46px; height:46px; border-radius:13px; flex:none;
    background:linear-gradient(145deg,#67e8f9,#0891b2);
    display:flex; align-items:center; justify-content:center; }
  .merkicoon .ringetje{ width:20px; height:20px; border-radius:50%; border:3.5px solid #ffffff;
    display:flex; align-items:center; justify-content:center; }
  .merkicoon .ringetje i{ width:5px; height:5px; border-radius:50%; background:#ffffff; display:block; }
  .merknaam{ font-size:22px; font-weight:700; line-height:1.1; }
  .merksub{ font-size:13.5px; color:#8b98a5; margin-top:2px; }
  .menu{ margin-top:36px; display:flex; flex-direction:column; gap:3px; }
  .mi{ display:flex; align-items:center; gap:12px; padding:11px 13px; border-radius:13px;
    font-size:18.5px; color:#aeb9c4; cursor:pointer; user-select:none; text-decoration:none; }
  .mi .ic{ width:27px; height:27px; border-radius:8px; flex:none; background:rgba(255,255,255,.06);
    color:#dbe5ee; font-size:11.5px; font-weight:700; display:flex; align-items:center; justify-content:center; }
  .mi.actief{ background:rgba(255,255,255,.07); color:#ffffff; }
  .mi.dood{ cursor:default; }
  .submi{ margin-left:39px; padding:8px 13px; font-size:16.5px; color:#8b98a5; border-radius:11px;
    display:flex; align-items:center; gap:9px; cursor:pointer; user-select:none; }
  .submi .punt{ width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,.25); flex:none; }
  .submi.actief{ color:#22d3ee; }
  .submi.actief .punt{ background:#22d3ee; }
  .gebruiker{ margin-top:auto; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.05);
    border-radius:16px; padding:13px 14px; display:flex; align-items:center; gap:12px; }
  .avatar{ width:40px; height:40px; border-radius:50%; flex:none;
    background:linear-gradient(145deg,#67e8f9,#0891b2); color:#032830;
    font-size:17px; font-weight:700; display:flex; align-items:center; justify-content:center; }
  .gebruiker .gn{ font-size:16.5px; font-weight:600; line-height:1.15; }
  .gebruiker .gs{ font-size:13px; color:#8b98a5; margin-top:1px; }
  /* Hoofdgebied */
  .main{ flex:1; padding:32px 38px 30px; display:flex; flex-direction:column; min-width:0; }
  .kop{ display:flex; justify-content:space-between; align-items:flex-start; gap:20px; }
  .koplabel{ font-size:14px; font-weight:600; letter-spacing:.18em; color:#22d3ee; text-transform:uppercase; }
  .koptitel{ font-size:43px; font-weight:700; line-height:1.08; margin-top:5px; }
  .kopsub{ font-size:17.5px; color:#8b98a5; margin-top:7px; }
  .koprechts{ display:flex; align-items:center; gap:12px; padding-top:8px; }
  .zoek{ width:288px; padding:13px 18px; border-radius:999px; background:rgba(255,255,255,.045);
    border:1px solid rgba(255,255,255,.06); color:#67737f; font-size:16.5px; }
  .belbtn{ width:46px; height:46px; border-radius:50%; flex:none; background:rgba(255,255,255,.045);
    border:1px solid rgba(255,255,255,.06); display:flex; align-items:center; justify-content:center; position:relative; }
  .belbtn .belring{ width:15px; height:15px; border-radius:50%; border:2.5px solid #dbe5ee; }
  .belbtn .beldot{ position:absolute; top:9px; right:10px; width:8px; height:8px; border-radius:50%; background:#22d3ee; }
  .nieuw{ background:#22d3ee; color:#032830; font-size:16.5px; font-weight:600;
    padding:13px 22px; border-radius:999px; cursor:pointer; user-select:none; white-space:nowrap; }
  .nieuw:active{ transform:scale(.96); }
  .kopavatar{ width:46px; height:46px; font-size:18px; }
  .tabs{ display:flex; gap:10px; margin-top:26px; }
  .tab{ padding:11px 22px; border-radius:999px; background:rgba(255,255,255,.045);
    color:#aeb9c4; font-size:17px; user-select:none; }
  .tab.actief{ background:#22d3ee; color:#032830; font-weight:600; }
  .tab.dood{ cursor:default; }
  .inhoud{ display:flex; gap:24px; margin-top:24px; flex:1; min-height:0; }
  .kaart{ background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.07);
    border-radius:24px; box-shadow:0 16px 36px rgba(0,0,0,.28); }
  `;

  var CSS2 = `
  /* Kaart Hele huis */
  .huiskaart{ width:1022px; flex:none; padding:27px 32px; display:flex; flex-direction:column; }
  .kaarttitel{ font-size:25px; font-weight:600; }
  .kaartsub{ font-size:16px; color:#8b98a5; margin-top:4px; }
  .huislijf{ display:flex; margin-top:8px; flex:1; }
  .knopblok{ width:540px; flex:none; display:flex; flex-direction:column; align-items:center; }
  .dialwrap{ position:relative; width:520px; height:520px; flex:none;
    touch-action:none; cursor:grab; outline:none; -webkit-tap-highlight-color:transparent; }
  .dialwrap:active{ cursor:grabbing; }
  .ringlaag{ position:absolute; border-radius:50%; pointer-events:none; }
  .tick{ position:absolute; left:50%; top:50%; width:4px; height:11px; border-radius:2.5px;
    margin:-5.5px 0 0 -2px; background:rgba(255,255,255,.22); pointer-events:none; }
  .face{ position:absolute; inset:11%; border-radius:50%; background:#0a0e14;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    pointer-events:none; text-align:center; }
  .facelabel{ font-size:14.5px; font-weight:600; letter-spacing:.2em; color:#8b98a5; text-transform:uppercase; }
  .doel{ font-size:98px; font-weight:700; line-height:1.05; font-variant-numeric:tabular-nums; }
  .nudial{ margin-top:8px; font-size:17.5px; color:#8b98a5; display:flex; align-items:center; gap:8px; }
  .stip{ width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,.18); flex:none; }
  .stip.aan{ background:#22d3ee; box-shadow:0 0 9px rgba(34,211,238,.85); }
  .rotor{ position:absolute; inset:0; pointer-events:none; }
  .dialwrap:not(.bezig) .rotor{ transition:transform .35s cubic-bezier(.22,1,.36,1); }
  .knop{ position:absolute; left:50%; top:3.4%; width:27px; height:27px; border-radius:50%;
    transform:translate(-50%,-50%); background:#ffffff; box-shadow:0 3px 10px rgba(0,0,0,.5);
    display:flex; align-items:center; justify-content:center;
    transition:width .12s ease, height .12s ease; }
  .knop i{ width:8px; height:8px; border-radius:50%; background:#0a0e14; display:block; }
  .dialwrap.bezig .knop{ width:32px; height:32px; }
  .staprij{ width:520px; display:flex; justify-content:space-between; margin-top:16px; }
  .stepbtn{ width:62px; height:62px; border-radius:50%; background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.10); color:#ffffff; font-size:29px; line-height:1;
    display:flex; align-items:center; justify-content:center; cursor:pointer; user-select:none; }
  .stepbtn:active{ transform:scale(.92); border-color:rgba(34,211,238,.6); }
  .bediening{ flex:1; padding:14px 0 0 30px; display:flex; flex-direction:column; }
  .clabel{ font-size:14px; font-weight:600; letter-spacing:.18em; color:#8b98a5; text-transform:uppercase; }
  .pillen{ display:flex; gap:9px; margin-top:13px; flex-wrap:wrap; }
  .mpill{ padding:11px 16px; border-radius:999px; background:rgba(255,255,255,.045);
    border:1px solid rgba(255,255,255,.05); color:#c6d2dc; font-size:16.5px; cursor:pointer; user-select:none; white-space:nowrap; }
  .mpill:active{ transform:scale(.95); }
  .mpill.actief{ background:#04060a; border-color:rgba(255,255,255,.18); color:#ffffff; font-weight:600; }
  .schuifblok{ margin-top:58px; }
  .schuifkop{ display:flex; justify-content:space-between; align-items:baseline; }
  .schuifwaarde{ font-size:19px; font-weight:600; font-variant-numeric:tabular-nums; }
  .slider{ position:relative; height:36px; margin-top:6px; touch-action:none; cursor:pointer; }
  .strack{ position:absolute; left:0; right:0; top:50%; height:6px; transform:translateY(-50%);
    border-radius:99px; background:rgba(255,255,255,.10); }
  .sfill{ position:absolute; left:0; top:50%; height:6px; transform:translateY(-50%);
    border-radius:99px; background:linear-gradient(90deg,#7dd3fc,#22d3ee); }
  .sknop{ position:absolute; top:50%; width:22px; height:22px; border-radius:50%;
    transform:translate(-50%,-50%); background:#ffffff; box-shadow:0 2px 8px rgba(0,0,0,.5); pointer-events:none; }
  .tegels{ display:flex; gap:14px; margin-top:auto; padding-top:30px; }
  .tegel{ flex:1; background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.05);
    border-radius:18px; padding:16px 19px; }
  .tegel .tk{ font-size:15px; color:#8b98a5; }
  .tegel .tv{ font-size:27px; font-weight:600; margin-top:5px; font-variant-numeric:tabular-nums; }
  .tegel .tv span{ font-size:17px; color:#8b98a5; font-weight:400; }
  /* Kaart Kamers */
  .kamerskaart{ flex:1; padding:27px 30px; display:flex; flex-direction:column; }
  .krow{ padding:16px 0 13px; border-bottom:1px solid rgba(255,255,255,.05); }
  .krow:last-child{ border-bottom:none; }
  .krowkop{ display:flex; align-items:center; gap:13px; }
  .kicoon{ width:35px; height:35px; border-radius:10px; flex:none; background:rgba(255,255,255,.06);
    color:#dbe5ee; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; }
  .knaam{ font-size:19.5px; font-weight:500; }
  .kuit{ font-size:14.5px; color:#67737f; font-weight:400; }
  .ktemp{ margin-left:auto; text-align:right; font-variant-numeric:tabular-nums; }
  .ktemp .knu{ font-size:16px; color:#8b98a5; margin-right:9px; }
  .ktemp .kdoel{ font-size:20px; font-weight:600; }
  .krow .slider{ height:28px; margin-top:7px; }
  `;

  var TICKS = "";
  for (var ti = 0; ti < 60; ti++) TICKS += '<div class="tick"></div>';

  var HTML = `
  <div class="stage" id="stage">
    <div class="venster">
      <aside class="sidebar">
        <div class="merk">
          <div class="merkicoon"><div class="ringetje"><i></i></div></div>
          <div>
            <div class="merknaam">Thuis</div>
            <div class="merksub">Smart Home</div>
          </div>
        </div>
        <nav class="menu">
          <a class="mi" href="/familie-bord"><span class="ic">Ov</span>Overzicht</a>
          <div class="mi dood"><span class="ic">Ka</span>Kamers</div>
          <div class="mi dood"><span class="ic">Ap</span>Apparaten</div>
          <div class="mi actief"><span class="ic">Kl</span>Klimaat</div>
          <div class="submi actief"><span class="punt"></span>Thermostaat</div>
          <div class="submi dood"><span class="punt"></span>Verwarmingsplan</div>
          <div class="submi dood"><span class="punt"></span>Luchtkwaliteit</div>
          <a class="mi" href="/energie-bord"><span class="ic">En</span>Energie</a>
          <div class="mi dood"><span class="ic">Be</span>Beveiliging</div>
          <div class="mi dood"><span class="ic">Au</span>Automatiseringen</div>
          <a class="mi" href="/muziek-dashboard"><span class="ic">Mu</span>Muziek</a>
        </nav>
        <div class="gebruiker">
          <div class="avatar">A</div>
          <div>
            <div class="gn">Alex</div>
            <div class="gs">Thuis · Leiderdorp</div>
          </div>
        </div>
      </aside>
      <div class="main">
        <div class="kop">
          <div>
            <div class="koplabel">Klimaat</div>
            <div class="koptitel">Klimaat</div>
            <div class="kopsub" id="kopsub">…</div>
          </div>
          <div class="koprechts">
            <div class="zoek">Zoek apparaten…</div>
            <div class="belbtn"><div class="belring"></div><div class="beldot"></div></div>
            <div class="nieuw" id="nieuw">+ Nieuw</div>
            <div class="avatar kopavatar">A</div>
          </div>
        </div>
        <div class="tabs">
          <div class="tab actief">Thermostaat</div>
          <div class="tab dood">Verwarmingsplan</div>
          <div class="tab dood">Luchtkwaliteit</div>
        </div>
        <div class="inhoud">
          <section class="kaart huiskaart">
            <div class="kaarttitel">Hele huis</div>
            <div class="kaartsub" id="huissub">Woonkamer</div>
            <div class="huislijf">
              <div class="knopblok">
                <div class="dialwrap" id="dialwrap" tabindex="0" role="slider" aria-label="Doeltemperatuur woonkamer">
                  <div class="ringlaag" id="ringspoor"></div>
                  <div class="ringlaag" id="ringgloed"></div>
                  <div class="ringlaag" id="ringboog"></div>
                  ${TICKS}
                  <div class="face">
                    <div class="facelabel">Woonkamer</div>
                    <div class="doel" id="doel">--</div>
                    <div class="nudial"><span class="stip" id="dialstip"></span><span id="nudial">…</span></div>
                  </div>
                  <div class="rotor" id="rotor"><div class="knop"><i></i></div></div>
                </div>
                <div class="staprij">
                  <div class="stepbtn" id="stepmin">−</div>
                  <div class="stepbtn" id="stepplus">+</div>
                </div>
              </div>
              <div class="bediening">
                <div class="clabel">Modus</div>
                <div class="pillen">
                  <div class="mpill" id="modeheat">Verwarmen</div>
                  <div class="mpill" id="modeschema">Schema hervatten</div>
                  <div class="mpill" id="modeoff">Uit</div>
                </div>
                <div class="schuifblok">
                  <div class="schuifkop">
                    <div class="clabel">Temperatuur</div>
                    <div class="schuifwaarde" id="schuifwaarde">--</div>
                  </div>
                  <div class="slider" id="huisslider">
                    <div class="strack"></div>
                    <div class="sfill" id="huisfill"></div>
                    <div class="sknop" id="huisknop"></div>
                  </div>
                </div>
                <div class="tegels">
                  <div class="tegel"><div class="tk">Buiten</div><div class="tv" id="tilebuiten">--</div></div>
                  <div class="tegel"><div class="tk">Verbruik huis</div><div class="tv" id="tileverbruik">--</div></div>
                </div>
              </div>
            </div>
          </section>
          <section class="kaart kamerskaart">
            <div class="kaarttitel">Kamers</div>
            <div class="kaartsub">Stel per kamer een doel in</div>
            <div id="kamerrijen"></div>
          </section>
        </div>
      </div>
    </div>
  </div>`;

  function fmt(n, dec) {
    if (n === null || n === undefined || isNaN(n)) return null;
    return Number(n).toFixed(dec === undefined ? 1 : dec).replace(".", ",");
  }
  var COND_NL = {
    "sunny": "Zonnig", "clear-night": "Helder", "cloudy": "Bewolkt",
    "partlycloudy": "Half bewolkt", "rainy": "Regen", "pouring": "Stortregen",
    "snowy": "Sneeuw", "snowy-rainy": "Natte sneeuw", "fog": "Mist",
    "hail": "Hagel", "lightning": "Onweer", "lightning-rainy": "Onweer",
    "windy": "Windy", "windy-variant": "Windy", "exceptional": "Extreem weer"
  };
  // Zones: naam, lokale entiteit (sturen), cloudentiteit _3 (doel lezen als lokaal leeg is)
  var ZONES = [
    ["Woonkamer", "climate.woonkamer_woonkamer", "climate.woonkamer_woonkamer_3"],
    ["Naud", "climate.slaapkamer_naud_slaapkamer_naud", "climate.slaapkamer_naud_slaapkamer_naud_3"],
    ["Cas", "climate.slaapkamer_cas_slaapkamer_cas", "climate.slaapkamer_cas_slaapkamer_cas_3"],
    ["Slaapkamer", "climate.slaapkamer_slaapkamer", "climate.slaapkamer_slaapkamer_3"],
    ["Badkamer", "climate.badkamer_badkamer", "climate.badkamer_badkamer_3"]
  ];
  var WOON = 0;

  class HalvaBordCard extends HTMLElement {
    setConfig(config) {
      this._config = config || {};
      if (!this._built) this._build();
    }
    _build() {
      this._built = true;
      var root = this.attachShadow({ mode: "open" });
      var style = document.createElement("style");
      style.textContent = CSS + CSS2;
      var wrap = document.createElement("div");
      wrap.innerHTML = HTML;
      root.appendChild(style);
      root.appendChild(wrap);
      var hostEl = this;
      Array.prototype.forEach.call(root.querySelectorAll(".sidebar a.mi"), function (a) {
        a.addEventListener("click", function (ev) {
          var href = a.getAttribute("href");
          if (!href) return;
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
      this._el = {};
      var self = this;
      ["stage","kopsub","huissub","dialwrap","ringspoor","ringgloed","ringboog","doel","nudial","dialstip","rotor",
       "stepmin","stepplus","modeheat","modeschema","modeoff","schuifwaarde","huisslider","huisfill","huisknop",
       "tilebuiten","tileverbruik","kamerrijen","nieuw"]
        .forEach(function (id) { self._el[id] = root.getElementById(id); });
      this._ticks = Array.prototype.slice.call(root.querySelectorAll(".tick"));
      this._ov = {};
      var dw = this._el.dialwrap;
      dw.addEventListener("pointerdown", function (ev) { self._startSleep(ev); });
      dw.addEventListener("pointermove", function (ev) { self._sleep(ev); });
      dw.addEventListener("pointerup", function () { self._stopSleep(); });
      dw.addEventListener("pointercancel", function () { self._stopSleep(); });
      dw.addEventListener("keydown", function (ev) { self._toets(ev); });
      this._el.stepmin.addEventListener("click", function () { self._step(-0.5); });
      this._el.stepplus.addEventListener("click", function () { self._step(0.5); });
      this._el.modeheat.addEventListener("click", function () { self._mode("heat"); });
      this._el.modeschema.addEventListener("click", function () { self._mode("auto"); });
      this._el.modeoff.addEventListener("click", function () { self._mode("off"); });
      this._bindSlider(this._el.huisslider, function (f, commit) { self._huisSchuif(f, commit); });
      this._el.nieuw.addEventListener("click", function () {
        var txt = window.prompt("Nieuwe taak");
        if (txt) self._call("todo", "add_item", { item: txt }, { entity_id: "todo.te_doen" });
      });
      this._ro = new ResizeObserver(function () { self._fit(); });
      this._ro.observe(this);
      this._onResize = function () { self._fit(); };
      window.addEventListener("resize", this._onResize);
      this._fit();
      setTimeout(function () { self._fit(); }, 300);
      setTimeout(function () { self._fit(); }, 1200);
    }
    getCardSize() { return 1; }
    _fit() {
      var stage = this._el && this._el.stage;
      if (!stage) return;
      var w = this.clientWidth || window.innerWidth || 1920;
      var h = this.clientHeight || window.innerHeight || 1200;
      var s = Math.min(w / 1920, h / 1200);
      stage.style.transform = "scale(" + s + ")";
      stage.style.marginLeft = ((w - 1920 * s) / 2) + "px";
      stage.style.marginTop = ((h - 1200 * s) / 2) + "px";
    }
    set hass(hass) {
      this._hass = hass;
      if (!this._built) return;
      this._update();
    }
    _st(eid) { return this._hass && this._hass.states ? this._hass.states[eid] : undefined; }
    _num(eid) {
      var s = this._st(eid);
      if (!s || s.state === "unavailable" || s.state === "unknown") return null;
      var n = parseFloat(s.state);
      return isNaN(n) ? null : n;
    }
    _call(domain, service, data, target) {
      if (!this._hass) return;
      var p = this._hass.callService(domain, service, data, target);
      if (p && p.catch) p.catch(function () {});
    }
    _grenzen(st) {
      var a = st ? st.attributes : {};
      return {
        min: a.min_temp != null ? a.min_temp : 5,
        max: a.max_temp != null ? a.max_temp : 25,
        stap: a.target_temp_step != null ? a.target_temp_step : 0.5
      };
    }
    _doelVan(i) {
      if (this._drag && this._drag.idx === i && this._drag.val != null) return this._drag.val;
      var ov = this._ov[i];
      if (ov && Date.now() < ov.until) return ov.val;
      var lok = this._st(ZONES[i][1]);
      if (lok && lok.attributes.temperature != null) return lok.attributes.temperature;
      var cl = this._st(ZONES[i][2]);
      if (cl && cl.attributes.temperature != null) return cl.attributes.temperature;
      if (lok && lok.attributes.current_temperature != null) return lok.attributes.current_temperature;
      return null;
    }
    _nuVan(i) {
      var lok = this._st(ZONES[i][1]);
      if (lok && lok.attributes.current_temperature != null) return lok.attributes.current_temperature;
      var cl = this._st(ZONES[i][2]);
      return cl && cl.attributes.current_temperature != null ? cl.attributes.current_temperature : null;
    }
    _update() {
      var el = this._el, self = this;
      var w = this._st("weather.forecast_thuis");
      var buiten = w && w.attributes.temperature != null ? w.attributes.temperature : null;
      var doelW = this._doelVan(WOON);
      var nuW = this._nuVan(WOON);
      el.kopsub.textContent =
        "Verwarming " + (doelW == null ? "--" : fmt(doelW)) + "° · " +
        (nuW == null ? "--" : fmt(nuW)) + "° binnen · " +
        (buiten == null ? "--" : fmt(buiten)) + "° buiten";
      var clW = this._st(ZONES[WOON][1]);
      var verwarmt = clW && clW.attributes.hvac_action === "heating";
      var uitW = !clW || clW.state === "off";
      el.huissub.textContent = "Woonkamer · " + (uitW ? "Verwarming uit" : verwarmt ? "Verwarming aan" : "Op temperatuur");
      // thermostaatknop
      var gr = this._grenzen(clW);
      var f = doelW == null ? 0 : Math.min(1, Math.max(0, (doelW - gr.min) / (gr.max - gr.min)));
      var sweep = f * 270;
      var boog = "conic-gradient(from -135deg, #7dd3fc 0deg, #22d3ee " + (sweep * 0.6) + "deg, #0ea5b7 " + sweep + "deg, transparent " + sweep + "deg 360deg)";
      el.ringspoor.style.background = "conic-gradient(from 0deg, rgba(255,255,255,.055) 0deg 360deg)";
      el.ringspoor.style.inset = "4.6%";
      el.ringgloed.style.background = boog;
      el.ringgloed.style.inset = "3.4%";
      el.ringgloed.style.opacity = "0.30";
      el.ringboog.style.background = boog;
      el.ringboog.style.inset = "4.6%";
      var straal = el.dialwrap.clientWidth * 0.478;
      this._ticks.forEach(function (tick, i) {
        var a = i * 6;
        var da = a <= 180 ? a : a - 360;
        tick.style.transform = "rotate(" + a + "deg) translateY(" + (-straal) + "px)";
        var actief = !uitW && da >= -135 && da <= -135 + sweep;
        tick.style.background = actief ? "#bae6fd" : "rgba(255,255,255,.20)";
      });
      el.rotor.style.transform = "rotate(" + (-135 + sweep) + "deg)";
      el.doel.textContent = doelW == null ? "--" : fmt(doelW) + "°";
      el.nudial.textContent = this._flashMsg && Date.now() < this._flashUntil
        ? this._flashMsg
        : (nuW == null ? "" : "nu " + fmt(nuW) + "°") + (uitW ? " · uit" : verwarmt ? " · verwarmt" : " · op temperatuur");
      el.dialstip.className = "stip" + (verwarmt ? " aan" : "");
      el.dialwrap.setAttribute("aria-valuemin", gr.min);
      el.dialwrap.setAttribute("aria-valuemax", gr.max);
      if (doelW != null) el.dialwrap.setAttribute("aria-valuenow", doelW);
      // huisschuif en modus
      el.schuifwaarde.textContent = doelW == null ? "--" : fmt(doelW) + "°";
      el.huisfill.style.width = (f * 100) + "%";
      el.huisknop.style.left = (f * 100) + "%";
      var cs = this._st(ZONES[WOON][1] + "_2");
      var mode = null;
      if (cs && cs.state !== "unavailable" && cs.state !== "unknown") mode = cs.state;
      else if (clW) mode = clW.state === "off" ? "off" : "heat";
      if (this._ovMode && Date.now() < this._ovMode.until) mode = this._ovMode.mode;
      el.modeheat.classList.toggle("actief", mode === "heat");
      el.modeschema.classList.toggle("actief", mode === "auto");
      el.modeoff.classList.toggle("actief", mode === "off");
      // tegels
      el.tilebuiten.innerHTML = buiten == null ? "--" : fmt(buiten) + "° <span>" + (COND_NL[w.state] || "") + "</span>";
      var hv = this._num("sensor.huisverbruik");
      el.tileverbruik.innerHTML = hv === null ? "--" : fmt(hv, 0) + " <span>W</span>";
      // kamers (niet herbouwen tijdens een kamerschuif, dat breekt de pointer-capture)
      if (this._drag && this._drag.kind === "kamer") return;
      el.kamerrijen.innerHTML = ZONES.map(function (z, i) {
        var lok = self._st(z[1]);
        var gr2 = self._grenzen(lok);
        var doel = self._doelVan(i);
        var nu = self._nuVan(i);
        var f2 = doel == null ? 0 : Math.min(1, Math.max(0, (doel - gr2.min) / (gr2.max - gr2.min)));
        var uit = !lok || lok.state === "off";
        return '<div class="krow">' +
          '<div class="krowkop"><div class="kicoon">' + z[0].slice(0, 2) + '</div>' +
          '<div class="knaam">' + z[0] + (uit ? ' <span class="kuit">· uit</span>' : "") + '</div>' +
          '<div class="ktemp"><span class="knu">nu ' + (nu == null ? "--" : fmt(nu)) + '°</span>' +
          '<span class="kdoel" data-kdoel="' + i + '">' + (doel == null ? "--" : fmt(doel)) + '°</span></div></div>' +
          '<div class="slider" data-kamer="' + i + '"><div class="strack"></div>' +
          '<div class="sfill" style="width:' + (f2 * 100) + '%"></div>' +
          '<div class="sknop" style="left:' + (f2 * 100) + '%"></div></div></div>';
      }).join("");
      Array.prototype.forEach.call(el.kamerrijen.querySelectorAll("[data-kamer]"), function (sl) {
        var idx = parseInt(sl.getAttribute("data-kamer"), 10);
        self._bindSlider(sl, function (f2, commit) { self._kamerSchuif(idx, sl, f2, commit); });
      });
    }
    _bindSlider(el, handler) {
      var bezig = false;
      function fractie(ev) {
        var r = el.getBoundingClientRect();
        return Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      }
      el.addEventListener("pointerdown", function (ev) {
        ev.preventDefault();
        el.setPointerCapture(ev.pointerId);
        bezig = true;
        handler(fractie(ev), false);
      });
      el.addEventListener("pointermove", function (ev) {
        if (bezig) handler(fractie(ev), false);
      });
      el.addEventListener("pointerup", function (ev) {
        if (!bezig) return;
        bezig = false;
        handler(fractie(ev), true);
      });
      el.addEventListener("pointercancel", function (ev) {
        if (!bezig) return;
        bezig = false;
        handler(fractie(ev), true);
      });
    }
    _snap(v, gr) {
      v = Math.round(v / gr.stap) * gr.stap;
      return Math.min(gr.max, Math.max(gr.min, Math.round(v * 10) / 10));
    }
    _huisSchuif(f, commit) {
      var st = this._st(ZONES[WOON][1]);
      if (!st) return;
      var gr = this._grenzen(st);
      var v = this._snap(gr.min + f * (gr.max - gr.min), gr);
      this._drag = { kind: "huis", idx: WOON, val: v };
      this._update();
      if (commit) {
        this._drag = null;
        if (v !== st.attributes.temperature) {
          this._ov[WOON] = { val: v, until: Date.now() + 12000 };
          this._call("climate", "set_temperature", { temperature: v }, { entity_id: ZONES[WOON][1] });
        }
        this._update();
      }
    }
    _kamerSchuif(idx, slEl, f, commit) {
      var st = this._st(ZONES[idx][1]);
      if (!st) return;
      var gr = this._grenzen(st);
      var v = this._snap(gr.min + f * (gr.max - gr.min), gr);
      this._drag = { kind: "kamer", idx: idx, val: v };
      var fill = slEl.querySelector(".sfill");
      var knop = slEl.querySelector(".sknop");
      var f2 = (v - gr.min) / (gr.max - gr.min);
      if (fill) fill.style.width = (f2 * 100) + "%";
      if (knop) knop.style.left = (f2 * 100) + "%";
      var doelEl = this._el.kamerrijen.querySelector('[data-kdoel="' + idx + '"]');
      if (doelEl) doelEl.textContent = fmt(v) + "°";
      if (commit) {
        this._drag = null;
        var huidig = st.attributes.temperature;
        if (huidig == null) {
          var cl = this._st(ZONES[idx][2]);
          huidig = cl ? cl.attributes.temperature : null;
        }
        if (v !== huidig) {
          this._ov[idx] = { val: v, until: Date.now() + 12000 };
          this._call("climate", "set_temperature", { temperature: v }, { entity_id: ZONES[idx][1] });
        }
        this._update();
      }
    }
    _hoekNaarWaarde(ev) {
      var r = this._el.dialwrap.getBoundingClientRect();
      var dx = ev.clientX - (r.left + r.width / 2);
      var dy = ev.clientY - (r.top + r.height / 2);
      var hoek = Math.atan2(dx, -dy) * 180 / Math.PI;
      if (hoek > 135) hoek = 135;
      if (hoek < -135) hoek = -135;
      var st = this._st(ZONES[WOON][1]);
      var gr = this._grenzen(st);
      return this._snap(gr.min + ((hoek + 135) / 270) * (gr.max - gr.min), gr);
    }
    _startSleep(ev) {
      if (!this._st(ZONES[WOON][1])) return;
      ev.preventDefault();
      this._el.dialwrap.setPointerCapture(ev.pointerId);
      this._bezig = true;
      this._el.dialwrap.classList.add("bezig");
      this._drag = { kind: "dial", idx: WOON, val: this._hoekNaarWaarde(ev) };
      this._update();
    }
    _sleep(ev) {
      if (!this._bezig) return;
      this._drag = { kind: "dial", idx: WOON, val: this._hoekNaarWaarde(ev) };
      this._update();
    }
    _stopSleep() {
      if (!this._bezig) return;
      this._bezig = false;
      this._el.dialwrap.classList.remove("bezig");
      var st = this._st(ZONES[WOON][1]);
      var v = this._drag ? this._drag.val : null;
      this._drag = null;
      if (st && v != null && v !== st.attributes.temperature) {
        this._ov[WOON] = { val: v, until: Date.now() + 12000 };
        this._call("climate", "set_temperature", { temperature: v }, { entity_id: ZONES[WOON][1] });
      }
      this._update();
    }
    _toets(ev) {
      var st = this._st(ZONES[WOON][1]);
      if (!st) return;
      var gr = this._grenzen(st);
      var huidig = this._doelVan(WOON);
      if (huidig == null) return;
      var v = null;
      if (ev.key === "ArrowUp" || ev.key === "ArrowRight") v = huidig + gr.stap;
      else if (ev.key === "ArrowDown" || ev.key === "ArrowLeft") v = huidig - gr.stap;
      else if (ev.key === "Home") v = gr.min;
      else if (ev.key === "End") v = gr.max;
      if (v == null) return;
      ev.preventDefault();
      v = this._snap(v, gr);
      this._ov[WOON] = { val: v, until: Date.now() + 12000 };
      this._call("climate", "set_temperature", { temperature: v }, { entity_id: ZONES[WOON][1] });
      this._update();
    }
    _step(d) {
      var st = this._st(ZONES[WOON][1]);
      if (!st) return;
      var base = this._doelVan(WOON);
      if (base == null) return;
      var gr = this._grenzen(st);
      var v = this._snap(Number(base) + d, gr);
      this._ov[WOON] = { val: v, until: Date.now() + 12000 };
      this._call("climate", "set_temperature", { temperature: v }, { entity_id: ZONES[WOON][1] });
      this._update();
    }
    _mode(m) {
      var z = ZONES[WOON];
      if (m === "auto") {
        var cs = this._st(z[1] + "_2");
        if (!cs || cs.state === "unavailable" || cs.state === "unknown") {
          this._flash("Tado-cloud offline, log opnieuw in bij Tado");
          return;
        }
        this._call("climate", "set_hvac_mode", { hvac_mode: "auto" }, { entity_id: z[1] + "_2" });
      } else {
        this._call("climate", "set_hvac_mode", { hvac_mode: m }, { entity_id: z[1] });
      }
      this._ovMode = { mode: m, until: Date.now() + 12000 };
      this._update();
    }
    _flash(msg) {
      this._flashMsg = msg;
      this._flashUntil = Date.now() + 4500;
      this._update();
      var self = this;
      setTimeout(function () { self._update(); }, 4700);
    }
    disconnectedCallback() {
      if (this._ro) this._ro.disconnect();
      if (this._onResize) window.removeEventListener("resize", this._onResize);
    }
  }

  customElements.define("halva-bord-card", HalvaBordCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "halva-bord-card", name: "Halva-bord (test)", preview: false });
})();
