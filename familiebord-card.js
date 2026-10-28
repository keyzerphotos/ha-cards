/* Familiebord home card v1.5 — webapp-stijl familiepagina voor Home Assistant.
   Eén custom element, vanilla JS, data rechtstreeks uit hass.
   Ontwerp: donker homio-thema, klok + weer links, klimaatring als hero,
   status + todo rechts, kamerchips onderin, deurbel-overlay bij ding.
   v1.1: portretstand voor telefoons (zelfde kaart, eigen compositie).
   v1.2: schaal valt terug op venstermaat als de kaart zelf geen hoogte krijgt.
   v1.3: host verankerd met position:fixed inset:0 (het wallpanel-patroon).
   In de app klapte de hosthoogte naar 0 en knipte overflow:hidden het hele
   podium weg (zwart beeld); als vast schermvullend element kan dat niet meer.
   v1.4: kamerchips zijn nu echt knoppen. Tot v1.3 waren ze alleen een
   temperatuur-overzicht en toonde de ring altijd de woonkamer; wie erop
   drukte zag terecht niets gebeuren. Tikken wisselt nu de ring naar die kamer.
   v1.5: verwarming bedienen per gekozen kamer. Min/plus naast de ring zet de
   temperatuur lokaal via HomeKit (stapjes van 0,5). Modusknoppen onder de
   ring: Verwarmen en Uit lokaal, Schema hervatten = hvac_mode auto op de
   Tado-cloudentiteit (de _2), want alleen de cloud kan de handmatige
   override wissen; zonder cloudlogin meldt de knop dat eerlijk terug. */
(function () {
  "use strict";

  var FONT_ID = "familiebord-fonts";
  if (!document.getElementById(FONT_ID)) {
    var st = document.createElement("style");
    st.id = FONT_ID;
    st.textContent =
      "@font-face{font-family:'FBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-300-normal.woff2') format('woff2');font-weight:300}" +
      "@font-face{font-family:'FBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff2') format('woff2');font-weight:400}" +
      "@font-face{font-family:'FBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.woff2') format('woff2');font-weight:500}" +
      "@font-face{font-family:'FBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.woff2') format('woff2');font-weight:600}";
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
    font-family:'FBInter','Inter','Segoe UI',Roboto,Arial,sans-serif;
    background: radial-gradient(1200px 800px at 50% 30%, #0e1013, #08090b 70%);
    color:#f4f4f2; overflow:hidden; -webkit-font-smoothing:antialiased;
  }
  .stage.night{ filter:brightness(.72); }
  .caps{ text-transform:uppercase; letter-spacing:.22em; font-size:20px; font-weight:500; color:#9ba1a8; }
  .topbar{ position:absolute; top:52px; left:96px; right:96px; display:flex; justify-content:space-between; align-items:baseline; }
  .topbar .brand{ color:#6d7278; } .topbar .brand b{ color:#9ba1a8; font-weight:500; }
  .topline{ position:absolute; top:104px; left:96px; right:96px; height:1px; background:rgba(255,255,255,.08); }
  .left{ position:absolute; left:96px; top:200px; width:600px; }
  .clock{ font-size:172px; font-weight:300; letter-spacing:-.01em; line-height:1; }
  .weather{ margin-top:56px; display:flex; align-items:flex-start; gap:28px; }
  .weather .temp{ font-size:88px; font-weight:300; line-height:1; white-space:nowrap; }
  .weather .cond{ padding-top:10px; }
  .weather .cond .word{ font-size:34px; font-weight:400; }
  .weather .cond .sub{ margin-top:8px; font-size:21px; color:#9ba1a8; line-height:1.45; }
  .hours{ margin-top:52px; display:flex; border-top:1px solid rgba(255,255,255,.08); padding-top:28px; }
  .hour{ flex:1; } .hour .h{ font-size:20px; color:#6d7278; letter-spacing:.08em; }
  .hour .t{ font-size:30px; font-weight:400; margin-top:8px; }
  .hour .c{ font-size:19px; color:#9ba1a8; margin-top:4px; }
  .hero{ position:absolute; left:50%; top:545px; transform:translate(-50%,-50%); text-align:center; }
  .hero .above{ margin-bottom:34px; }
  .ringwrap{ position:relative; width:452px; height:452px; margin:0 auto; }
  .ring{ position:absolute; inset:0; border-radius:50%; box-shadow:0 0 90px rgba(217,164,65,.10); }
  .ringdisc{ position:absolute; inset:24px; border-radius:50%; background:#0b0c0e;
    display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .ringdisc .now{ font-size:104px; font-weight:300; line-height:1; }
  .ringdisc .now sup{ font-size:44px; color:#9ba1a8; }
  .ringdisc .set{ margin-top:14px; font-size:23px; color:#9ba1a8; }
  .ringdisc .set b{ color:#f4f4f2; font-weight:500; }
  .hero .below{ margin-top:32px; font-size:21px; color:#9ba1a8; }
  .dot{ display:inline-block; width:9px; height:9px; border-radius:50%; background:#d9a441; }
  .hero .below .dot{ margin-right:10px; vertical-align:2px; }
  .right{ position:absolute; right:96px; top:200px; width:430px; }
  .blocklabel{ display:flex; align-items:baseline; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,.08); padding-bottom:16px; }
  .blocklabel .add{ font-size:20px; color:#6d7278; cursor:pointer; }
  .todoitem{ display:flex; align-items:center; gap:16px; padding:17px 0 3px; font-size:24px; font-weight:300; cursor:pointer; }
  .todoitem .box{ width:26px; height:26px; border:2px solid rgba(255,255,255,.35); border-radius:7px; flex:none; }
  .todo-empty{ padding:26px 0 6px; font-size:24px; color:#9ba1a8; font-weight:300; }
  .status{ margin-top:58px; }
  .srow{ display:flex; align-items:center; justify-content:space-between; padding:21px 0; border-bottom:1px solid rgba(255,255,255,.08); }
  .srow .k{ display:flex; align-items:center; gap:14px; font-size:22px; color:#9ba1a8; }
  .srow .v{ font-size:24px; font-weight:400; }
  .srow .v span{ color:#9ba1a8; font-size:21px; }
  .chips{ position:absolute; left:96px; right:96px; bottom:88px; display:flex; justify-content:center; gap:16px; }
  .chip{ border:1px solid rgba(255,255,255,.13); border-radius:999px; padding:17px 30px; font-size:21px; color:#9ba1a8; display:flex; align-items:center; gap:12px; cursor:pointer; user-select:none; }
  .chip[data-room]:active{ transform:scale(.96); }
  .ringrow{ display:flex; align-items:center; justify-content:center; gap:30px; }
  .stepbtn{ width:70px; height:70px; flex:0 0 auto; border-radius:50%; border:1px solid rgba(255,255,255,.16); background:rgba(255,255,255,.03); color:#e8e6e1; font-size:36px; line-height:1; display:flex; align-items:center; justify-content:center; cursor:pointer; user-select:none; }
  .stepbtn:active{ transform:scale(.93); border-color:rgba(217,164,65,.65); color:#f2ead8; }
  .modes{ display:flex; gap:12px; justify-content:center; margin-top:28px; flex-wrap:wrap; }
  .mode{ border:1px solid rgba(255,255,255,.13); border-radius:999px; padding:15px 28px; font-size:20px; color:#9ba1a8; display:flex; align-items:center; gap:10px; cursor:pointer; user-select:none; }
  .mode:active{ transform:scale(.96); }
  .mode.active{ border-color:rgba(217,164,65,.55); color:#f2ead8; }
  .mode .mdot{ visibility:hidden; width:8px; height:8px; }
  .mode.active .mdot{ visibility:visible; }
  .chip b{ color:#f4f4f2; font-weight:500; }
  .chip.active{ border-color:rgba(217,164,65,.55); color:#f4f4f2; }
  .chip .dot{ width:8px; height:8px; }
  .overlay{ position:absolute; inset:0; background:rgba(4,5,6,.72); display:none; align-items:center; justify-content:center; z-index:5; }
  .overlay.show{ display:flex; }
  .belcard{ width:1180px; background:#101215; border:1px solid rgba(255,255,255,.12); border-radius:28px; padding:44px 48px 40px; }
  .belhead{ display:flex; align-items:center; justify-content:space-between; }
  .belhead .t{ font-size:34px; font-weight:500; display:flex; align-items:center; gap:16px; }
  .belhead .t .dot{ width:13px; height:13px; }
  .belhead .time{ font-size:24px; color:#9ba1a8; }
  .belview{ margin-top:30px; height:520px; border-radius:18px; background:linear-gradient(160deg,#17191d,#0c0e10);
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; overflow:hidden; position:relative; }
  .belview img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  .belview .cam{ font-size:22px; letter-spacing:.22em; color:#9ba1a8; text-transform:uppercase; }
  .belview .live{ font-size:20px; color:#6d7278; }
  .belbtns{ margin-top:32px; display:flex; gap:16px; justify-content:flex-end; }
  .btn{ font-size:23px; padding:18px 36px; border-radius:999px; border:1px solid rgba(255,255,255,.16); color:#f4f4f2; cursor:pointer; }
  .btn.primary{ background:#d9a441; border-color:#d9a441; color:#14100a; font-weight:600; }

  /* Portretstand (telefoon): rustige stapel, geen urenstrip en geen todo */
  .stage.portrait{ width:900px; height:1600px; }
  .stage.portrait .topbar{ top:44px; left:48px; right:48px; }
  .stage.portrait .topline{ top:96px; left:48px; right:48px; }
  .stage.portrait .left{ left:48px; top:140px; width:804px; }
  .stage.portrait .clock{ font-size:196px; }
  .stage.portrait .weather{ margin-top:40px; }
  .stage.portrait .hours{ display:none; }
  .stage.portrait .hero{ top:826px; }
  .stage.portrait .ringwrap{ width:430px; height:430px; }
  .stage.portrait .ringdisc .now{ font-size:96px; }
  .stage.portrait .right{ left:48px; right:48px; top:1152px; width:auto; }
  .stage.portrait .todolabel, .stage.portrait #todo{ display:none; }
  .stage.portrait .status{ margin-top:0; }
  .stage.portrait .srow{ padding:17px 0; }
  .stage.portrait .chips{ left:48px; right:48px; bottom:36px; flex-wrap:wrap; }
  .stage.portrait .belcard{ width:820px; }
  .stage.portrait .belview{ height:560px; }
  `;

  var HTML = `
  <div class="stage" id="stage">
    <div class="topbar">
      <div class="caps" id="dateline">…</div>
      <div class="caps brand"><b>Thuis</b> &nbsp;·&nbsp; Leiderdorp</div>
    </div>
    <div class="topline"></div>
    <section class="left">
      <div class="clock" id="clock">--:--</div>
      <div class="weather">
        <div class="temp" id="wtemp">--°</div>
        <div class="cond">
          <div class="word" id="wword">…</div>
          <div class="sub" id="wsub">…</div>
        </div>
      </div>
      <div class="hours" id="hours"></div>
    </section>
    <section class="hero">
      <div class="above caps" id="herolabel">Woonkamer</div>
      <div class="ringrow">
        <div class="stepbtn" id="stepmin">−</div>
        <div class="ringwrap">
          <div class="ring" id="ring"></div>
          <div class="ringdisc">
            <div class="now"><span id="rnow">--,-</span><sup>°</sup></div>
            <div class="set" id="rset">…</div>
          </div>
        </div>
        <div class="stepbtn" id="stepplus">+</div>
      </div>
      <div class="below" id="rbelow">…</div>
      <div class="modes">
        <div class="mode" id="modeheat"><span class="dot mdot"></span>Verwarmen</div>
        <div class="mode" id="modeschema"><span class="dot mdot"></span>Schema hervatten</div>
        <div class="mode" id="modeoff"><span class="dot mdot"></span>Uit</div>
      </div>
    </section>
    <aside class="right">
      <div class="blocklabel todolabel"><span class="caps">Te doen</span><span class="add" id="todoadd">+ Nieuw</span></div>
      <div id="todo"></div>
      <div class="status">
        <div class="blocklabel"><span class="caps">Status</span></div>
        <div id="statusrows"></div>
      </div>
    </aside>
    <nav class="chips" id="chips"></nav>
    <div class="overlay" id="overlay">
      <div class="belcard">
        <div class="belhead">
          <div class="t"><span class="dot"></span>Er is aangebeld</div>
          <div class="time">Voordeur · <span id="beltime">--:--</span></div>
        </div>
        <div class="belview" id="belview">
          <div class="cam">Voordeur</div>
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

  var ZONES = [
    ["Woonkamer", "climate.woonkamer_woonkamer"],
    ["Naud", "climate.slaapkamer_naud_slaapkamer_naud"],
    ["Cas", "climate.slaapkamer_cas_slaapkamer_cas"],
    ["Slaapkamer", "climate.slaapkamer_slaapkamer"],
    ["Badkamer", "climate.badkamer_badkamer"]
  ];

  class FamiliebordCard extends HTMLElement {
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
      this._el = {};
      var self = this;
      ["stage","dateline","clock","wtemp","wword","wsub","hours","ring","rnow","rset","rbelow","herolabel",
       "stepmin","stepplus","modeheat","modeschema","modeoff",
       "todo","todoadd","statusrows","chips","overlay","beltime","belview","bellive","belweg","belgroot"]
        .forEach(function (id) { self._el[id] = root.getElementById(id); });
      this._room = 0;
      this._el.stepmin.addEventListener("click", function () { self._step(-0.5); });
      this._el.stepplus.addEventListener("click", function () { self._step(0.5); });
      this._el.modeheat.addEventListener("click", function () { self._mode("heat"); });
      this._el.modeschema.addEventListener("click", function () { self._mode("auto"); });
      this._el.modeoff.addEventListener("click", function () { self._mode("off"); });
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
      var portrait = h > w;
      stage.classList.toggle("portrait", portrait);
      var SW = portrait ? 900 : 1920, SH = portrait ? 1600 : 1200;
      var s = Math.min(w / SW, h / SH);
      stage.style.transform = "scale(" + s + ")";
      stage.style.marginLeft = ((w - SW * s) / 2) + "px";
      stage.style.marginTop = ((h - SH * s) / 2) + "px";
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
    _update() {
      var el = this._el, self = this;
      // weer nu
      var w = this._st("weather.forecast_thuis");
      if (w) {
        var t = w.attributes.temperature;
        el.wtemp.textContent = (t === undefined ? "--" : fmt(t)) + "°";
        el.wword.textContent = COND_NL[w.state] || w.state;
        var rainToday = this._rainToday;
        var sub = "Vocht " + (w.attributes.humidity || "--") + "% · Wind " + (w.attributes.wind_speed || "--") + " km/u";
        if (rainToday !== undefined) sub += rainToday > 0 ? " · Neerslag ±" + fmt(rainToday) + " mm" : " · Droog vandaag";
        el.wsub.textContent = sub;
      }
      // ring van de gekozen kamer
      var zones = ZONES;
      if (this._room >= zones.length) this._room = 0;
      el.herolabel.textContent = zones[this._room][0];
      var cl = this._st(zones[this._room][1]);
      if (cl) {
        var cur = cl.attributes.current_temperature;
        var set = cl.attributes.temperature;
        if (this._ovSet && this._ovSet.room === this._room && Date.now() < this._ovSet.until) set = this._ovSet.val;
        el.rnow.textContent = cur === undefined ? "--,-" : fmt(cur);
        el.rset.innerHTML = set === undefined || set === null ? "Verwarming uit" : "Ingesteld op <b>" + fmt(set) + "°</b>";
        var pct = cur === undefined ? 0 : Math.max(0, Math.min(100, (cur - 10) / 20 * 100));
        el.ring.style.background = "conic-gradient(from -90deg, #d9a441 0 " + pct + "%, rgba(255,255,255,.08) " + pct + "% 100%)";
        var heating = cl.attributes.hvac_action === "heating" || cl.state === "heat";
        el.rbelow.innerHTML = cl.state === "off"
          ? "Verwarming uit"
          : (heating ? '<span class="dot"></span>Verwarming aan' : "Op temperatuur");
      }
      // modusknoppen: echte stand komt van de cloudentiteit als die er is
      var cs = this._st(zones[this._room][1] + "_2");
      var mode = null;
      if (cs && cs.state !== "unavailable" && cs.state !== "unknown") mode = cs.state;
      else if (cl) mode = cl.state === "off" ? "off" : "heat";
      if (this._ovMode && this._ovMode.room === this._room && Date.now() < this._ovMode.until) mode = this._ovMode.mode;
      el.modeheat.classList.toggle("active", mode === "heat");
      el.modeschema.classList.toggle("active", mode === "auto");
      el.modeoff.classList.toggle("active", mode === "off");
      if (this._flashMsg && Date.now() < this._flashUntil) el.rbelow.textContent = this._flashMsg;
      // statusregels
      var rows = [];
      var wm = this._num("sensor.power_plug_wasmachine_vermogen");
      if (wm !== null) rows.push({ k: "Wasmachine", dot: wm > 5, v: wm > 5 ? "Draait" : "Klaar" });
      var kg = this._st("sensor.fordpass_wf0fxxwpmhld21343_elvehcharging");
      var kb = this._num("sensor.fordpass_wf0fxxwpmhld21343_battery");
      if (kb !== null) {
        var charging = kg && (kg.state === "IN_PROGRESS" || kg.state === "CHARGING");
        rows.push({ k: "Kuga", dot: !!charging, v: (charging ? "Laadt · " : "Accu · ") + "<span>" + fmt(kb, 0) + "%</span>" });
      }
      var hv = this._num("sensor.huisverbruik");
      if (hv !== null) rows.push({ k: "Verbruik huis", dot: false, v: fmt(hv, 0) + " <span>W</span>" });
      var zp = this._num("sensor.solaredge_i1_ac_power");
      if (zp !== null) rows.push({ k: "Zon", dot: zp > 50, v: fmt(zp, 0) + " <span>W</span>" });
      if (this._motionTs && Date.now() - this._motionTs < 60000)
        rows.unshift({ k: "Voordeur", dot: true, v: "Beweging" });
      el.statusrows.innerHTML = rows.map(function (r) {
        return '<div class="srow"><div class="k">' + (r.dot ? '<span class="dot"></span>' : "") + r.k +
          '</div><div class="v">' + r.v + "</div></div>";
      }).join("");
      // chips (kamerkeuze voor de ring; Buiten is alleen informatie)
      var chips = zones.map(function (z, i) {
        var s = self._st(z[1]);
        var v = s && s.attributes.current_temperature !== undefined ? fmt(s.attributes.current_temperature) : "--";
        var act = i === self._room;
        return '<div class="chip' + (act ? " active" : "") + '" data-room="' + i + '">' + (act ? '<span class="dot"></span>' : "") + z[0] + " <b>" + v + "°</b></div>";
      });
      var bt = w && w.attributes.temperature !== undefined ? fmt(w.attributes.temperature) : "--";
      chips.push('<div class="chip">Buiten <b>' + bt + "°</b></div>");
      el.chips.innerHTML = chips.join("");
      Array.prototype.forEach.call(el.chips.querySelectorAll("[data-room]"), function (chip) {
        chip.addEventListener("click", function () {
          self._room = parseInt(chip.getAttribute("data-room"), 10);
          self._update();
        });
      });
    }
    _call(domain, service, data, target) {
      if (!this._hass) return;
      var p = this._hass.callService(domain, service, data, target);
      if (p && p.catch) p.catch(function () {});
    }
    _step(d) {
      var z = ZONES[this._room];
      var s = this._st(z[1]);
      if (!s) return;
      var base = (this._ovSet && this._ovSet.room === this._room && Date.now() < this._ovSet.until)
        ? this._ovSet.val : s.attributes.temperature;
      if (base === undefined || base === null) base = s.attributes.current_temperature;
      if (base === undefined || base === null) return;
      var min = s.attributes.min_temp !== undefined ? s.attributes.min_temp : 5;
      var max = s.attributes.max_temp !== undefined ? s.attributes.max_temp : 30;
      var nv = Math.round((Number(base) + d) * 2) / 2;
      nv = Math.max(min, Math.min(max, nv));
      this._ovSet = { room: this._room, val: nv, until: Date.now() + 12000 };
      this._call("climate", "set_temperature", { temperature: nv }, { entity_id: z[1] });
      this._update();
    }
    _mode(m) {
      var z = ZONES[this._room];
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
      items.slice(0, 5).forEach(function (it) {
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
      var el = this._el;
      el.beltime.textContent = hhmm(new Date());
      el.overlay.classList.add("show");
      this._belUntil = Date.now() + 60000;
      var self = this;
      clearTimeout(this._belTimer);
      this._belTimer = setTimeout(function () { self._hideBel(); }, 60000);
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
      this._hass.connection.sendMessagePromise({ type: "auth/sign_path", path: "/api/camera_proxy/camera.voordeur_live" })
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

  customElements.define("familiebord-card", FamiliebordCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "familiebord-card", name: "Familiebord home", preview: false });
})();
