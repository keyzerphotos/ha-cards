/* Insta-bord v1.0 (test) — dashboard in de stijl van het Instagram-
   voorbeeld dat Alex koos (3 nov 2026): lichte frosted-glass kaarten,
   een sleepbare thermostaatknop met een ring van streepjes die van blauw
   naar oranje kleurt, mint pillen en zachte schaduwen. Vanaf nul opge-
   bouwd in die stijl, gevuld met de gegevens van dit huis (weer, Tado-
   zones, energie, Kuga, todo, status, camera's en deurbel-overlay).
   Canvas 1920x1200 dat als geheel meeschaalt (wallpanel-patroon). */
(function () {
  "use strict";

  var FONT_ID = "insta-bord-fonts";
  if (!document.getElementById(FONT_ID)) {
    var st = document.createElement("style");
    st.id = FONT_ID;
    st.textContent =
      "@font-face{font-family:'IBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-300-normal.woff2') format('woff2');font-weight:300}" +
      "@font-face{font-family:'IBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff2') format('woff2');font-weight:400}" +
      "@font-face{font-family:'IBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.woff2') format('woff2');font-weight:500}" +
      "@font-face{font-family:'IBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.woff2') format('woff2');font-weight:600}" +
      "@font-face{font-family:'IBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff2') format('woff2');font-weight:700}";
    document.head.appendChild(st);
  }

  var COND_NL = {
    "sunny": "Zonnig", "clear-night": "Helder", "cloudy": "Bewolkt",
    "partlycloudy": "Half bewolkt", "rainy": "Regen", "pouring": "Stortregen",
    "snowy": "Sneeuw", "snowy-rainy": "Natte sneeuw", "fog": "Mist",
    "hail": "Hagel", "lightning": "Onweer", "lightning-rainy": "Onweer",
    "windy": "Windy", "windy-variant": "Windy", "exceptional": "Extreem weer"
  };
  var COND_SHORT = {
    "sunny": "Zonnig", "clear-night": "Helder", "cloudy": "Bewolkt",
    "partlycloudy": "Half bew.", "rainy": "Regen", "pouring": "Regen",
    "snowy": "Sneeuw", "snowy-rainy": "Sneeuw", "fog": "Mist",
    "hail": "Hagel", "lightning": "Onweer", "lightning-rainy": "Onweer",
    "windy": "Wind", "windy-variant": "Wind", "exceptional": "Extreem"
  };

  var CSS = `
  :host{ display:block; position:fixed; inset:0; width:100%; height:100%; }
  *{ margin:0; padding:0; box-sizing:border-box; }
  .stage{
    position:relative; width:1920px; height:1200px; transform-origin: top left;
    font-family:'IBInter','Inter','Segoe UI',Roboto,Arial,sans-serif;
    background: linear-gradient(160deg, #fcfefe 0%, #edf4f6 55%, #e1ebef 100%);
    color:#16232c; overflow:hidden; -webkit-font-smoothing:antialiased;
  }
  .stage.night{ filter:brightness(.95); }
  .caps{ text-transform:uppercase; letter-spacing:.2em; font-size:17px; font-weight:600; color:#7d8a94; }
  .card{
    position:absolute; background:rgba(255,255,255,.66);
    backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
    border:1px solid rgba(255,255,255,.95); border-radius:30px;
    box-shadow:0 18px 40px rgba(31,52,64,.10);
  }
  .topbar{ position:absolute; top:46px; left:64px; right:64px; display:flex; justify-content:space-between; align-items:flex-start; }
  .brand{ font-size:38px; font-weight:700; letter-spacing:-.01em; }
  .brandsub{ margin-top:6px; }
  .clockbox{ text-align:right; }
  .clock{ font-size:44px; font-weight:700; line-height:1; font-variant-numeric:tabular-nums; }
  .clocksub{ margin-top:6px; }

  /* Thermostaatkaart met de sleepknop */
  .dialcard{ left:64px; top:170px; width:660px; height:660px;
    border:1.5px solid rgba(20,184,166,.45);
    box-shadow:0 0 0 5px rgba(20,184,166,.07), 0 24px 50px rgba(31,52,64,.12); }
  .kamernaam{ position:absolute; top:28px; left:30px; }
  .functiepil{ position:absolute; top:22px; right:24px; background:#d7f2ea; color:#14655a;
    font-size:14px; font-weight:700; letter-spacing:.13em; padding:6px 15px; border-radius:999px; }
  .dialwrap{ position:absolute; left:50%; top:55%; transform:translate(-50%,-50%);
    width:480px; height:480px; touch-action:none; cursor:grab; outline:none;
    -webkit-tap-highlight-color:transparent; }
  .dialwrap:active{ cursor:grabbing; }
  .tick{ position:absolute; left:50%; top:50%; width:5px; height:15px; border-radius:3px;
    margin:-7.5px 0 0 -2.5px; background:rgba(22,35,44,.10); pointer-events:none;
    transition:background .15s ease; }
  .face{ position:absolute; inset:12.5%; border-radius:50%;
    background:radial-gradient(circle at 50% 36%, #ffffff, #e9f0f3 74%);
    box-shadow:inset 0 0 0 1px rgba(22,35,44,.04), 0 12px 32px rgba(31,52,64,.07);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    pointer-events:none; text-align:center; }
  .doel{ font-size:96px; font-weight:700; line-height:1; font-variant-numeric:tabular-nums; }
  .nudial{ margin-top:12px; font-size:20px; color:#5c6d78; display:flex; align-items:center; gap:8px; }
  .stip{ width:9px; height:9px; border-radius:50%; background:rgba(22,35,44,.16); }
  .stip.aan{ background:#ef6a3a; box-shadow:0 0 9px rgba(239,106,58,.8); }
  .rotor{ position:absolute; inset:0; pointer-events:none; }
  .dialwrap:not(.bezig) .rotor{ transition:transform .35s cubic-bezier(.22,1,.36,1); }
  .knop{ position:absolute; left:50%; top:6.25%; width:32px; height:32px; border-radius:50%;
    transform:translate(-50%,-50%); background:#ffffff;
    border:1px solid rgba(22,35,44,.07); box-shadow:0 4px 14px rgba(31,52,64,.28);
    transition:width .12s ease, height .12s ease; }
  .dialwrap.bezig .knop{ width:38px; height:38px; }

  /* Kamerkeuze en modi onder de thermostaatkaart */
  .chips{ position:absolute; left:64px; top:856px; width:660px; display:flex; gap:10px; }
  .chip{ flex:1; text-align:center; background:rgba(255,255,255,.66); backdrop-filter:blur(14px);
    border:1px solid rgba(255,255,255,.95); box-shadow:0 8px 20px rgba(31,52,64,.07);
    border-radius:999px; padding:15px 4px; font-size:19px; color:#5c6d78; cursor:pointer; user-select:none; }
  .chip b{ color:#16232c; font-weight:600; }
  .chip.active{ background:#d7f2ea; border-color:rgba(20,101,90,.25); color:#14655a; }
  .chip.active b{ color:#14655a; }
  .chip:active{ transform:scale(.96); }
  .modes{ position:absolute; left:64px; top:940px; width:660px; display:flex; gap:10px; }
  .mode{ flex:1; text-align:center; background:rgba(255,255,255,.66); backdrop-filter:blur(14px);
    border:1px solid rgba(255,255,255,.95); box-shadow:0 8px 20px rgba(31,52,64,.07);
    border-radius:999px; padding:14px 4px; font-size:19px; color:#5c6d78; cursor:pointer; user-select:none; }
  .mode.active{ background:#d7f2ea; border-color:rgba(20,101,90,.25); color:#14655a; font-weight:600; }
  .mode:active{ transform:scale(.96); }

  /* Rechterkaarten */
  .ctitle{ display:flex; align-items:baseline; justify-content:space-between; }
  .ctitle .add{ font-size:17px; color:#93a1ab; cursor:pointer; letter-spacing:0; text-transform:none; font-weight:400; }
  .weercard{ left:764px; top:170px; width:1092px; height:296px; padding:30px 36px; }
  .weerflex{ display:flex; gap:40px; margin-top:14px; }
  .weernu{ display:flex; align-items:flex-start; gap:24px; min-width:430px; }
  .weertemp{ font-size:86px; font-weight:300; line-height:1; white-space:nowrap; }
  .weerword{ font-size:32px; font-weight:500; padding-top:8px; }
  .weersub{ margin-top:8px; font-size:20px; color:#5c6d78; line-height:1.45; }
  .hours{ flex:1; display:flex; border-left:1px solid rgba(22,35,44,.08); padding-left:36px; }
  .hour{ flex:1; } .hour .h{ font-size:18px; color:#93a1ab; letter-spacing:.06em; }
  .hour .t{ font-size:29px; font-weight:500; margin-top:8px; }
  .hour .c{ font-size:18px; color:#5c6d78; margin-top:4px; }
  .energiecard{ left:764px; top:490px; width:534px; height:250px; padding:28px 34px; }
  .autocard{ left:1322px; top:490px; width:534px; height:250px; padding:28px 34px; }
  .stats{ display:flex; gap:30px; margin-top:20px; }
  .stat{ flex:1; }
  .stat .sv{ font-size:56px; font-weight:600; line-height:1; font-variant-numeric:tabular-nums; }
  .stat .sv span{ font-size:26px; color:#7d8a94; font-weight:400; }
  .stat .sk{ margin-top:10px; font-size:19px; color:#5c6d78; display:flex; align-items:center; gap:8px; }
  .grootlijn{ margin-top:20px; font-size:21px; color:#5c6d78; display:flex; align-items:center; gap:9px; }
  .todocard{ left:764px; top:764px; width:534px; height:230px; padding:26px 34px; }
  .todoitem{ display:flex; align-items:center; gap:14px; padding:13px 0 1px; font-size:22px; font-weight:300; cursor:pointer; }
  .todoitem .box{ width:24px; height:24px; border:2px solid rgba(22,35,44,.30); border-radius:7px; flex:none; background:rgba(255,255,255,.6); }
  .todo-empty{ padding:22px 0 4px; font-size:22px; color:#5c6d78; font-weight:300; }
  .statuscard{ left:1322px; top:764px; width:534px; height:230px; padding:26px 34px; }
  .srow{ display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid rgba(22,35,44,.06); }
  .srow .k{ display:flex; align-items:center; gap:11px; font-size:21px; color:#5c6d78; }
  .srow .v{ font-size:22px; font-weight:500; }
  .cambtns{ display:flex; gap:9px; margin-top:16px; }
  .cambtn{ flex:1; text-align:center; border:1px solid rgba(22,35,44,.09); background:rgba(255,255,255,.55);
    border-radius:999px; padding:11px 4px; font-size:18px; color:#3d4c59; cursor:pointer; user-select:none; }
  .cambtn:active{ transform:scale(.96); border-color:rgba(239,106,58,.6); color:#ef6a3a; }

  /* Navigatie */
  .pnav{ position:absolute; left:50%; transform:translateX(-50%); bottom:32px; display:flex; gap:8px; z-index:4;
    background:rgba(255,255,255,.85); border:1px solid rgba(22,35,44,.07); border-radius:999px; padding:9px;
    box-shadow:0 12px 28px rgba(31,52,64,.13); backdrop-filter:blur(10px); }
  .pnav a{ font-size:20px; color:#3d4c59; text-decoration:none; padding:11px 28px; border-radius:999px;
    border:1px solid transparent; letter-spacing:.04em; }
  .pnav a.active{ background:#d7f2ea; color:#14655a; border-color:rgba(20,101,90,.25); }

  /* Deurbel- en cameravenster */
  .overlay{ position:absolute; inset:0; background:rgba(22,35,44,.38); display:none; align-items:center; justify-content:center; z-index:5; }
  .overlay.show{ display:flex; }
  .belcard{ width:1180px; background:linear-gradient(160deg,#ffffff,#edf3f6); border:1px solid rgba(255,255,255,.9);
    box-shadow:0 24px 60px rgba(22,35,44,.25); border-radius:28px; padding:44px 48px 40px; }
  .belhead{ display:flex; align-items:center; justify-content:space-between; }
  .belhead .t{ font-size:34px; font-weight:500; display:flex; align-items:center; gap:16px; }
  .belhead .t .stip{ width:13px; height:13px; }
  .belhead .time{ font-size:24px; color:#5c6d78; }
  .belview{ margin-top:30px; height:520px; border-radius:18px; background:linear-gradient(160deg,#dfe9ee,#c9d6dd);
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; overflow:hidden; position:relative; }
  .belview img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .belview .cam{ font-size:22px; letter-spacing:.22em; color:#5c6d78; text-transform:uppercase; }
  .belview .live{ font-size:20px; color:#7d8a94; }
  .belbtns{ margin-top:32px; display:flex; gap:16px; justify-content:flex-end; }
  .btn{ font-size:23px; padding:18px 36px; border-radius:999px; border:1px solid rgba(22,35,44,.14);
    background:rgba(255,255,255,.7); color:#16232c; cursor:pointer; }
  .btn.primary{ background:#0d9488; border-color:#0d9488; color:#ffffff; font-weight:600; }
  `;

  var TICKS = "";
  for (var ti = 0; ti < 46; ti++) TICKS += '<div class="tick"></div>';

  var HTML = `
  <div class="stage" id="stage">
    <div class="topbar">
      <div>
        <div class="brand">Thuis</div>
        <div class="brandsub caps" id="dateline">…</div>
      </div>
      <div class="clockbox">
        <div class="clock" id="clock">--:--</div>
        <div class="clocksub caps">Leiderdorp</div>
      </div>
    </div>

    <section class="card dialcard">
      <div class="kamernaam caps" id="herolabel">Woonkamer</div>
      <div class="functiepil">VERWARMING</div>
      <div class="dialwrap" id="dialwrap" tabindex="0" role="slider" aria-label="Doeltemperatuur">
        ${TICKS}
        <div class="face">
          <div class="doel" id="doel">--</div>
          <div class="nudial"><span class="stip" id="dialstip"></span><span id="nudial">…</span></div>
        </div>
        <div class="rotor" id="rotor"><div class="knop"></div></div>
      </div>
    </section>

    <nav class="chips" id="chips"></nav>
    <div class="modes">
      <div class="mode" id="modeheat">Verwarmen</div>
      <div class="mode" id="modeschema">Schema hervatten</div>
      <div class="mode" id="modeoff">Uit</div>
    </div>

    <section class="card weercard">
      <div class="ctitle"><span class="caps">Weer</span></div>
      <div class="weerflex">
        <div class="weernu">
          <div class="weertemp" id="wtemp">--°</div>
          <div>
            <div class="weerword" id="wword">…</div>
            <div class="weersub" id="wsub">…</div>
          </div>
        </div>
        <div class="hours" id="hours"></div>
      </div>
    </section>

    <section class="card energiecard">
      <div class="ctitle"><span class="caps">Energie</span></div>
      <div class="stats">
        <div class="stat"><div class="sv" id="verbruik">--</div><div class="sk">Verbruik huis</div></div>
        <div class="stat"><div class="sv" id="zon">--</div><div class="sk"><span class="stip" id="zonstip"></span>Zon</div></div>
      </div>
    </section>

    <section class="card autocard">
      <div class="ctitle"><span class="caps">Kuga</span></div>
      <div class="stats">
        <div class="stat"><div class="sv" id="kugaaccu">--</div><div class="sk">Accu</div></div>
      </div>
      <div class="grootlijn"><span class="stip" id="kugastip"></span><span id="kugastatus">…</span></div>
    </section>

    <section class="card todocard">
      <div class="ctitle"><span class="caps">Te doen</span><span class="add" id="todoadd">+ Nieuw</span></div>
      <div id="todo"></div>
    </section>

    <section class="card statuscard">
      <div class="ctitle"><span class="caps">Status</span></div>
      <div id="statusrows"></div>
      <div class="cambtns">
        <div class="cambtn" id="camvoordeur">Voordeur</div>
        <div class="cambtn" id="camnaud">Naud</div>
        <div class="cambtn" id="camcas">Cas</div>
      </div>
    </section>

    <div class="pnav">
      <a href="/insta-bord" class="active">Home</a>
      <a href="/keuken-bord">Keuken</a>
      <a href="/energie-bord">Energie</a>
      <a href="/auto-bord">Auto</a>
      <a href="/stofzuiger-bord">Stofzuiger</a>
      <a href="/babyfoon-bord">Babyfoon</a>
    </div>

    <div class="overlay" id="overlay">
      <div class="belcard">
        <div class="belhead">
          <div class="t"><span class="stip aan"></span><span id="beltitle">Er is aangebeld</span></div>
          <div class="time"><span id="camwhere">Voordeur</span> · <span id="beltime">--:--</span></div>
        </div>
        <div class="belview" id="belview">
          <div class="cam" id="camname">Voordeur</div>
          <div class="live" id="bellive">Live beeld start…</div>
        </div>
        <div class="belbtns">
          <div class="btn" id="belweg">Weg</div>
          <div class="btn primary" id="belgroot">Open groot</div>
        </div>
      </div>
    </div>
  </div>`;

  function fmt(n, dec) {
    if (n === null || n === undefined || isNaN(n)) return null;
    return Number(n).toFixed(dec === undefined ? 1 : dec).replace(".", ",");
  }
  function hhmm(d) {
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  // Kleurverloop van de ring: blauw (koud) via groen en geel naar oranje (warm).
  function ringKleur(f) {
    var stops = [[0.0, [53, 166, 220]], [0.45, [79, 192, 141]], [0.7, [242, 193, 78]], [1.0, [239, 106, 58]]];
    for (var i = 1; i < stops.length; i++) {
      if (f <= stops[i][0]) {
        var f0 = stops[i - 1], f1 = stops[i];
        var t = (f - f0[0]) / (f1[0] - f0[0]);
        var c = f0[1].map(function (v, k) { return Math.round(v + (f1[1][k] - v) * t); });
        return "rgb(" + c.join(",") + ")";
      }
    }
    return "rgb(239,106,58)";
  }

  var ZONES = [
    ["Woonkamer", "climate.woonkamer_woonkamer"],
    ["Naud", "climate.slaapkamer_naud_slaapkamer_naud"],
    ["Cas", "climate.slaapkamer_cas_slaapkamer_cas"],
    ["Slaapkamer", "climate.slaapkamer_slaapkamer"],
    ["Badkamer", "climate.badkamer_badkamer"]
  ];

  class InstaBordCard extends HTMLElement {
    setConfig(config) {
      this._config = config || {};
      if (!this._built) this._build();
    }
    _build() {
      this._built = true;
      var root = this.attachShadow({ mode: "open" });
      var style = document.createElement("style");
      style.textContent = CSS;
      var wrap = document.createElement("div");
      wrap.innerHTML = HTML;
      root.appendChild(style);
      root.appendChild(wrap);
      var hostEl = this;
      Array.prototype.forEach.call(root.querySelectorAll(".pnav a"), function (a) {
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
      this._el = {};
      var self = this;
      ["stage","dateline","clock","herolabel","dialwrap","doel","nudial","dialstip","rotor",
       "chips","modeheat","modeschema","modeoff","wtemp","wword","wsub","hours",
       "verbruik","zon","zonstip","kugaaccu","kugastip","kugastatus",
       "todo","todoadd","statusrows","overlay","beltime","belview","bellive","belweg","belgroot",
       "camvoordeur","camnaud","camcas","beltitle","camname","camwhere"]
        .forEach(function (id) { self._el[id] = root.getElementById(id); });
      this._ticks = Array.prototype.slice.call(root.querySelectorAll(".tick"));
      this._room = 0;
      var dw = this._el.dialwrap;
      dw.addEventListener("pointerdown", function (ev) { self._startSleep(ev); });
      dw.addEventListener("pointermove", function (ev) { self._sleep(ev); });
      dw.addEventListener("pointerup", function (ev) { self._stopSleep(ev); });
      dw.addEventListener("pointercancel", function (ev) { self._stopSleep(ev); });
      dw.addEventListener("keydown", function (ev) { self._toets(ev); });
      this._el.modeheat.addEventListener("click", function () { self._mode("heat"); });
      this._el.modeschema.addEventListener("click", function () { self._mode("auto"); });
      this._el.modeoff.addEventListener("click", function () { self._mode("off"); });
      this._el.camvoordeur.addEventListener("click", function () { self._openCam("camera.voordeur_live", "Voordeur"); });
      this._el.camnaud.addEventListener("click", function () { self._openCam("camera.astronaud", "Naud"); });
      this._el.camcas.addEventListener("click", function () { self._openCam("camera.astrocas", "Cas"); });
      this._el.belweg.addEventListener("click", function () { self._hideBel(); });
      this._el.belgroot.addEventListener("click", function () {
        var v = self._el.belview;
        if (v.requestFullscreen) v.requestFullscreen();
      });
      this._el.todoadd.addEventListener("click", function () { self._addTodo(); });
      this._ro = new ResizeObserver(function () { self._fit(); });
      this._ro.observe(this);
      this._onResize = function () { self._fit(); };
      window.addEventListener("resize", this._onResize);
      this._tickClock();
      this._clockTimer = setInterval(function () { self._tickClock(); }, 5000);
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
    _tickClock() {
      if (!this._el || !this._el.clock) return;
      var d = new Date();
      this._el.clock.textContent = hhmm(d);
      var date = d.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
      this._el.dateline.textContent = date.charAt(0).toUpperCase() + date.slice(1);
      var hr = d.getHours();
      this._el.stage.classList.toggle("night", hr >= 22 || hr < 7);
    }
    set hass(hass) {
      this._hass = hass;
      if (!this._built) return;
      this._update();
      if (!this._subscribed && hass.connection) {
        this._subscribed = true;
        var self = this;
        hass.connection.subscribeEvents(function (ev) {
          var eid = ev.data && ev.data.entity_id;
          if (eid === "binary_sensor.voordeur_ding" && ev.data.new_state && ev.data.new_state.state === "on") self._showBel();
          if (eid === "binary_sensor.voordeur_motion" && ev.data.new_state && ev.data.new_state.state === "on") self._motionTs = Date.now();
          if (eid === "binary_sensor.0xa4c138259343bb2e_presence" && ev.data.new_state && ev.data.new_state.state === "on") self._casTs = Date.now();
        }, "state_changed");
      }
      this._maybeForecast();
      this._maybeTodo();
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
    _zone() { return ZONES[this._room]; }
    _doelWaarde(st) {
      if (this._dragVal != null) return this._dragVal;
      if (this._ovSet && this._ovSet.room === this._room && Date.now() < this._ovSet.until) return this._ovSet.val;
      if (!st) return null;
      if (st.attributes.temperature != null) return st.attributes.temperature;
      return st.attributes.current_temperature != null ? st.attributes.current_temperature : null;
    }
    _update() {
      var el = this._el, self = this;
      // weer nu
      var w = this._st("weather.forecast_thuis");
      if (w) {
        var t = w.attributes.temperature;
        el.wtemp.textContent = (t === undefined ? "--" : fmt(t)) + "°";
        el.wword.textContent = COND_NL[w.state] || w.state;
        var sub = "Vocht " + (w.attributes.humidity || "--") + "% · Wind " + (w.attributes.wind_speed || "--") + " km/u";
        if (this._rainToday !== undefined) sub += this._rainToday > 0 ? " · Neerslag ±" + fmt(this._rainToday) + " mm" : " · Droog vandaag";
        el.wsub.textContent = sub;
      }
      // thermostaatknop van de gekozen kamer
      if (this._room >= ZONES.length) this._room = 0;
      el.herolabel.textContent = ZONES[this._room][0];
      var cl = this._st(ZONES[this._room][1]);
      var waarde = this._doelWaarde(cl);
      var gr = this._grenzen(cl);
      var f = waarde == null ? 0 : Math.min(1, Math.max(0, (waarde - gr.min) / (gr.max - gr.min)));
      var uit = !cl || cl.state === "off";
      var straal = el.dialwrap.clientWidth * 0.4375;
      var n = this._ticks.length;
      this._ticks.forEach(function (tick, i) {
        var tf = i / (n - 1);
        tick.style.transform = "rotate(" + (-135 + tf * 270) + "deg) translateY(" + (-straal) + "px)";
        tick.style.background = !uit && tf <= f + 0.001 ? ringKleur(tf) : "rgba(22,35,44,.10)";
      });
      el.rotor.style.transform = "rotate(" + (-135 + f * 270) + "deg)";
      el.doel.textContent = waarde == null ? "--" : fmt(waarde) + "°";
      var verwarmt = cl && cl.attributes.hvac_action === "heating";
      var nu = cl ? cl.attributes.current_temperature : undefined;
      el.nudial.textContent =
        (nu != null ? "nu " + fmt(nu) + "°" : "") +
        (!cl ? "" : uit ? " · uit" : verwarmt ? " · verwarmt" : " · op temperatuur");
      el.dialstip.className = "stip" + (verwarmt ? " aan" : "");
      el.dialwrap.setAttribute("aria-valuemin", gr.min);
      el.dialwrap.setAttribute("aria-valuemax", gr.max);
      if (waarde != null) el.dialwrap.setAttribute("aria-valuenow", waarde);
      // modusknoppen
      var cs = this._st(ZONES[this._room][1] + "_2");
      var mode = null;
      if (cs && cs.state !== "unavailable" && cs.state !== "unknown") mode = cs.state;
      else if (cl) mode = cl.state === "off" ? "off" : "heat";
      if (this._ovMode && this._ovMode.room === this._room && Date.now() < this._ovMode.until) mode = this._ovMode.mode;
      el.modeheat.classList.toggle("active", mode === "heat");
      el.modeschema.classList.toggle("active", mode === "auto");
      el.modeoff.classList.toggle("active", mode === "off");
      if (this._flashMsg && Date.now() < this._flashUntil) el.nudial.textContent = this._flashMsg;
      // energie
      var hv = this._num("sensor.huisverbruik");
      el.verbruik.innerHTML = hv === null ? "--" : fmt(hv, 0) + " <span>W</span>";
      var zp = this._num("sensor.solaredge_i1_ac_power");
      el.zon.innerHTML = zp === null ? "--" : fmt(zp, 0) + " <span>W</span>";
      el.zonstip.className = "stip" + (zp !== null && zp > 50 ? " aan" : "");
      // Kuga
      var kg = this._st("sensor.fordpass_wf0fxxwpmhld21343_elvehcharging");
      var kb = this._num("sensor.fordpass_wf0fxxwpmhld21343_soc");
      var charging = kg && (kg.state === "IN_PROGRESS" || kg.state === "CHARGING");
      el.kugaaccu.innerHTML = kb === null ? "--" : fmt(kb, 0) + " <span>%</span>";
      el.kugastatus.textContent = kb === null ? "Geen verbinding" : charging ? "Laadt op" : "Niet aan het laden";
      el.kugastip.className = "stip" + (charging ? " aan" : "");
      // statusregels
      var rows = [];
      var wm = this._num("sensor.power_plug_wasmachine_vermogen");
      if (wm !== null) rows.push({ k: "Wasmachine", dot: wm > 5, v: wm > 5 ? "Draait" : "Klaar" });
      var cas = this._st("binary_sensor.0xa4c138259343bb2e_presence");
      if ((cas && cas.state === "on") || (this._casTs && Date.now() - this._casTs < 60000))
        rows.unshift({ k: "Cas", dot: true, v: "Beweegt" });
      if (this._motionTs && Date.now() - this._motionTs < 60000)
        rows.unshift({ k: "Voordeur", dot: true, v: "Beweging" });
      el.statusrows.innerHTML = rows.slice(0, 2).map(function (r) {
        return '<div class="srow"><div class="k">' + (r.dot ? '<span class="stip aan"></span>' : "") + r.k +
          '</div><div class="v">' + r.v + "</div></div>";
      }).join("");
      // kamerchips
      el.chips.innerHTML = ZONES.map(function (z, i) {
        var s = self._st(z[1]);
        var v = s && s.attributes.current_temperature !== undefined ? fmt(s.attributes.current_temperature) : "--";
        var act = i === self._room;
        return '<div class="chip' + (act ? " active" : "") + '" data-room="' + i + '">' + z[0] + " <b>" + v + "°</b></div>";
      }).join("");
      Array.prototype.forEach.call(el.chips.querySelectorAll("[data-room]"), function (chip) {
        chip.addEventListener("click", function () {
          self._room = parseInt(chip.getAttribute("data-room"), 10);
          self._dragVal = null;
          self._update();
        });
      });
    }
    _hoekNaarWaarde(ev) {
      var r = this._el.dialwrap.getBoundingClientRect();
      var dx = ev.clientX - (r.left + r.width / 2);
      var dy = ev.clientY - (r.top + r.height / 2);
      var hoek = Math.atan2(dx, -dy) * 180 / Math.PI;
      if (hoek > 135) hoek = 135;
      if (hoek < -135) hoek = -135;
      var st = this._st(this._zone()[1]);
      var gr = this._grenzen(st);
      var v = gr.min + ((hoek + 135) / 270) * (gr.max - gr.min);
      v = Math.round(v / gr.stap) * gr.stap;
      return Math.min(gr.max, Math.max(gr.min, Math.round(v * 10) / 10));
    }
    _startSleep(ev) {
      if (!this._st(this._zone()[1])) return;
      ev.preventDefault();
      this._el.dialwrap.setPointerCapture(ev.pointerId);
      this._bezig = true;
      this._el.dialwrap.classList.add("bezig");
      this._dragVal = this._hoekNaarWaarde(ev);
      this._update();
    }
    _sleep(ev) {
      if (!this._bezig) return;
      this._dragVal = this._hoekNaarWaarde(ev);
      this._update();
    }
    _stopSleep() {
      if (!this._bezig) return;
      this._bezig = false;
      this._el.dialwrap.classList.remove("bezig");
      var st = this._st(this._zone()[1]);
      var huidig = st ? st.attributes.temperature : null;
      var v = this._dragVal;
      this._dragVal = null;
      if (st && v != null && v !== huidig) {
        this._ovSet = { room: this._room, val: v, until: Date.now() + 12000 };
        this._call("climate", "set_temperature", { temperature: v }, { entity_id: this._zone()[1] });
      }
      this._update();
    }
    _toets(ev) {
      var st = this._st(this._zone()[1]);
      if (!st) return;
      var gr = this._grenzen(st);
      var huidig = this._doelWaarde(st);
      if (huidig == null) return;
      var v = null;
      if (ev.key === "ArrowUp" || ev.key === "ArrowRight") v = huidig + gr.stap;
      else if (ev.key === "ArrowDown" || ev.key === "ArrowLeft") v = huidig - gr.stap;
      else if (ev.key === "Home") v = gr.min;
      else if (ev.key === "End") v = gr.max;
      if (v == null) return;
      ev.preventDefault();
      v = Math.min(gr.max, Math.max(gr.min, Math.round(v * 10) / 10));
      this._ovSet = { room: this._room, val: v, until: Date.now() + 12000 };
      this._call("climate", "set_temperature", { temperature: v }, { entity_id: this._zone()[1] });
      this._update();
    }
    _mode(m) {
      var z = this._zone();
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
      this._ovMode = { room: this._room, mode: m, until: Date.now() + 12000 };
      this._update();
    }
    _flash(msg) {
      this._flashMsg = msg;
      this._flashUntil = Date.now() + 4500;
      this._update();
      var self = this;
      setTimeout(function () { self._update(); }, 4700);
    }
    _maybeForecast() {
      var now = Date.now();
      if (this._fcTs && now - this._fcTs < 20 * 60 * 1000) return;
      this._fcTs = now;
      var self = this;
      this._hass.callService("weather", "get_forecasts", { type: "hourly" }, { entity_id: "weather.forecast_thuis" }, false, true)
        .then(function (resp) {
          var fc = resp && resp.response && resp.response["weather.forecast_thuis"]
            ? resp.response["weather.forecast_thuis"].forecast : [];
          var d = new Date();
          var later = fc.filter(function (f) { return new Date(f.datetime) > d; });
          var todayRain = later.filter(function (f) {
            return new Date(f.datetime).getDate() === d.getDate();
          }).reduce(function (a, f) { return a + (f.precipitation || 0); }, 0);
          self._rainToday = todayRain;
          self._el.hours.innerHTML = later.slice(0, 5).map(function (f) {
            var dt = new Date(f.datetime);
            return '<div class="hour"><div class="h">' + hhmm(dt) + '</div><div class="t">' +
              fmt(f.temperature) + '°</div><div class="c">' + (COND_SHORT[f.condition] || "") + "</div></div>";
          }).join("");
          self._update();
        }).catch(function () { self._fcTs = 0; });
    }
    _todoEntity() { return (this._config && this._config.todo_entity) || "todo.te_doen"; }
    _maybeTodo() {
      var eid = this._todoEntity();
      var ent = this._st(eid);
      var count = ent ? parseInt(ent.state, 10) : -1;
      var now = Date.now();
      if (this._todoCount === count && this._todoTs && now - this._todoTs < 60000) return;
      this._todoCount = count; this._todoTs = now;
      if (!ent) { this._renderTodo(null); return; }
      var self = this;
      this._hass.callService("todo", "get_items", { status: "needs_action" }, { entity_id: eid }, false, true)
        .then(function (resp) {
          var items = resp && resp.response && resp.response[eid] ? resp.response[eid].items : [];
          self._renderTodo(items || []);
        }).catch(function () { self._renderTodo(null); });
    }
    _renderTodo(items) {
      var el = this._el.todo;
      if (!items || items.length === 0) {
        el.innerHTML = '<div class="todo-empty">Niets openstaand</div>';
        return;
      }
      var self = this;
      el.innerHTML = "";
      items.slice(0, 3).forEach(function (it) {
        var row = document.createElement("div");
        row.className = "todoitem";
        row.innerHTML = '<span class="box"></span><span></span>';
        row.querySelector("span:last-child").textContent = it.summary;
        row.addEventListener("click", function () {
          self._hass.callService("todo", "update_item", { item: it.uid, status: "completed" }, { entity_id: self._todoEntity() });
          self._todoTs = 0;
        });
        el.appendChild(row);
      });
    }
    _addTodo() {
      var txt = window.prompt("Nieuwe taak");
      if (txt) {
        this._hass.callService("todo", "add_item", { item: txt }, { entity_id: this._todoEntity() });
        this._todoTs = 0;
      }
    }
    _showBel() {
      this._showCam("camera.voordeur_live", "Voordeur", 60000, "Er is aangebeld");
    }
    _openCam(eid, label) {
      this._showCam(eid, label, 0, label);
    }
    _showCam(eid, label, autoHide, title) {
      var el = this._el, self = this;
      this._camEntity = eid;
      el.beltitle.textContent = title;
      el.camname.textContent = label;
      el.camwhere.textContent = label;
      el.beltime.textContent = hhmm(new Date());
      var old = el.belview.querySelector("img");
      if (old) old.remove();
      el.bellive.textContent = "Live beeld start…";
      el.overlay.classList.add("show");
      clearTimeout(this._belTimer);
      if (autoHide) this._belTimer = setTimeout(function () { self._hideBel(); }, autoHide);
      this._refreshCam();
      clearInterval(this._camTimer);
      this._camTimer = setInterval(function () { self._refreshCam(); }, 4000);
    }
    _hideBel() {
      this._el.overlay.classList.remove("show");
      clearTimeout(this._belTimer);
      clearInterval(this._camTimer);
    }
    _refreshCam() {
      var self = this;
      if (!this._hass || !this._hass.connection) return;
      this._hass.connection.sendMessagePromise({ type: "auth/sign_path", path: "/api/camera_proxy/" + (this._camEntity || "camera.voordeur_live") })
        .then(function (res) {
          var img = self._el.belview.querySelector("img");
          if (!img) {
            img = document.createElement("img");
            self._el.belview.appendChild(img);
          }
          img.src = res.path;
          self._el.bellive.textContent = "";
        }).catch(function () { /* snapshot komt later */ });
    }
    disconnectedCallback() {
      if (this._ro) this._ro.disconnect();
      if (this._onResize) window.removeEventListener("resize", this._onResize);
      clearInterval(this._clockTimer);
      clearInterval(this._camTimer);
      clearTimeout(this._belTimer);
    }
  }

  customElements.define("insta-bord-card", InstaBordCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "insta-bord-card", name: "Insta-bord (test)", preview: false });
})();
