/* Ovenbord card v1.1 — ovenpagina in dezelfde donkere stijl als het familiebord.
   Eén custom element, vanilla JS, data rechtstreeks uit hass.
   Hero = actuele oventemperatuur in een ring; rechts programma-keuze als chips,
   bediening (aan/uit, stop, kinderslot) en statusregels.
   v1.1: host verankerd met position:fixed inset:0 tegen zwart beeld in de app
   (hosthoogte klapte naar 0 en overflow:hidden knipte het podium weg). */
(function () {
  "use strict";

  var FONT_ID = "familiebord-fonts";
  if (!document.getElementById(FONT_ID)) {
    var st = document.createElement("style");
    st.id = FONT_ID;
    st.textContent =
      "@font-face{font-family:'Inter';font-style:normal;font-weight:400;font-display:swap;src:url(https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff2) format('woff2');}" +
      "@font-face{font-family:'Inter';font-style:normal;font-weight:300;font-display:swap;src:url(https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-300-normal.woff2) format('woff2');}" +
      "@font-face{font-family:'Inter';font-style:normal;font-weight:500;font-display:swap;src:url(https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.woff2) format('woff2');}" +
      "@font-face{font-family:'Inter';font-style:normal;font-weight:600;font-display:swap;src:url(https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.woff2) format('woff2');}";
    document.head.appendChild(st);
  }

  var E = {
    temp: "sensor.oven_huidige_temperatuur_in_de_oven",
    status: "sensor.oven_status",
    door: "sensor.oven_deur",
    activeProg: "select.oven_actieve_programma",
    selProg: "select.oven_geselecteerd_programma",
    progress: "sensor.oven_programma_voortgang",
    endtime: "sensor.oven_programma_eindtijd",
    power: "switch.oven_inschakelen",
    childlock: "switch.oven_kinderslot",
    stopBtn: "button.oven_stop_programma",
    conn: "binary_sensor.oven_connectiviteit",
    remote: "binary_sensor.oven_start_op_afstand",
    light: "binary_sensor.oven_interior_illumination_active"
  };

  var STATUS_NL = {
    inactive: "Niet actief", ready: "Gereed", delayedstart: "Startuitstel",
    run: "Bezig", pause: "Gepauzeerd", actionrequired: "Actie nodig",
    finished: "Klaar", error: "Storing", unavailable: "Niet bereikbaar", unknown: "Onbekend"
  };
  var DOOR_NL = { closed: "Gesloten", open: "Open", locked: "Vergrendeld", unavailable: "Onbekend" };
  var PROG_NL = {
    slow_cook: "Langzaam garen", hot_air: "Hetelucht", top_bottom_heating: "Boven- en onderwarmte",
    hot_air_eco: "Hetelucht eco", top_bottom_heating_eco: "Boven- en onderwarmte eco",
    hot_air_grilling: "Heteluchtgrill", pizza_setting: "Pizzastand", bottom_heating: "Onderwarmte",
    preheat_ovenware: "Servies voorverwarmen", frozen_heatup_special: "Diepvries opwarmen",
    sabbath_programme: "Sabbatprogramma", steam_modes_steam: "Stomen",
    intensive: "Intensief", hot_air_gentle: "Hetelucht zacht", top_bottom_heating_gentle: "Boven- en onderwarmte zacht",
    cool_star: "Coolstart", preheat_oven: "Voorverwarmen", dry: "Drogen", keep_warm: "Warmhouden", plate_warming: "Borden verwarmen"
  };
  function progLabel(raw) {
    if (!raw || raw === "unknown" || raw === "unavailable") return "Geen programma";
    var key = String(raw).replace("cooking_oven_program_heating_mode_", "").replace("cooking_oven_program_", "");
    if (PROG_NL[key]) return PROG_NL[key];
    return key.replace(/_/g, " ").replace(/^\w/, function (c) { return c.toUpperCase(); });
  }

  var CSS = `
  :host{ display:block; position:fixed; inset:0; height:100%; overflow:hidden; background:#08090b;
    font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif; color:#f4f4f2;
    -webkit-font-smoothing:antialiased; }
  *{ margin:0; padding:0; box-sizing:border-box; }
  .stage{ position:relative; width:1920px; height:1200px; transform-origin:top left; overflow:hidden;
    background:radial-gradient(1200px 800px at 30% 42%, #101216 0%, #08090b 62%); }
  .caps{ font-size:21px; letter-spacing:.34em; text-transform:uppercase; color:#a3a3a0; font-weight:500; }
  .topbar{ position:absolute; top:64px; left:96px; right:96px; display:flex; justify-content:space-between; align-items:baseline; }
  .topstatus{ font-size:26px; color:#f4f4f2; display:flex; align-items:center; gap:14px; }
  .dot{ width:12px; height:12px; border-radius:50%; background:#3a3d42; }
  .dot.on{ background:#d9a441; box-shadow:0 0 14px rgba(217,164,65,.8); }
  .topline{ position:absolute; top:118px; left:96px; right:96px; height:1px; background:rgba(255,255,255,.08); }

  .left{ position:absolute; left:96px; top:170px; width:760px; display:flex; flex-direction:column; align-items:center; }
  .herolabel{ margin-top:26px; }
  .ringwrap{ position:relative; width:470px; height:470px; margin-top:44px; }
  .ring{ position:absolute; inset:0; border-radius:50%; }
  .ringdisc{ position:absolute; inset:26px; border-radius:50%; background:#0b0c0f;
    display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .ringdisc .now{ font-size:118px; font-weight:300; letter-spacing:-.02em; line-height:1; }
  .ringdisc .now sup{ font-size:44px; font-weight:300; color:#d9a441; margin-left:4px; }
  .ringdisc .sub{ margin-top:14px; font-size:24px; color:#a3a3a0; }
  .herobelow{ margin-top:40px; text-align:center; }
  .herobelow .prog{ font-size:32px; font-weight:500; }
  .herobelow .meta{ margin-top:10px; font-size:24px; color:#a3a3a0; }
  .progbar{ margin-top:26px; width:470px; height:8px; border-radius:99px; background:rgba(255,255,255,.08); overflow:hidden; }
  .progbar i{ display:block; height:100%; background:#d9a441; border-radius:99px; width:0%; }

  .right{ position:absolute; right:96px; top:170px; width:700px; }
  .blocklabel{ display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px; }
  .chips{ display:flex; flex-wrap:wrap; gap:12px; margin:16px 0 6px; }
  .chip{ font-size:22px; color:#d6d6d2; border:1px solid rgba(255,255,255,.13); border-radius:999px;
    padding:12px 22px; background:rgba(255,255,255,.025); cursor:pointer; user-select:none; }
  .chip.active{ border-color:rgba(217,164,65,.65); color:#f4f4f2; background:rgba(217,164,65,.10); }
  .controls{ display:flex; gap:16px; margin:26px 0 6px; }
  .ctl{ flex:1; text-align:center; font-size:23px; padding:18px 10px; border-radius:18px; cursor:pointer; user-select:none;
    border:1px solid rgba(255,255,255,.13); background:rgba(255,255,255,.03); color:#f4f4f2; }
  .ctl.on{ border-color:rgba(217,164,65,.65); background:rgba(217,164,65,.12); }
  .ctl small{ display:block; margin-top:6px; font-size:19px; color:#a3a3a0; }
  .ctl.stop{ color:#e8a09a; }
  .status{ margin-top:28px; }
  .srow{ display:flex; justify-content:space-between; align-items:center; padding:15px 0;
    border-bottom:1px solid rgba(255,255,255,.07); font-size:25px; }
  .srow:last-child{ border-bottom:none; }
  .srow .k{ color:#d6d6d2; display:flex; align-items:center; gap:14px; }
  .srow .v{ font-weight:500; }
  .srow.tap{ cursor:pointer; }

  .stage.portrait{ width:900px; height:1600px; }
  .stage.portrait .topbar{ top:44px; left:48px; right:48px; }
  .stage.portrait .topline{ top:98px; left:48px; right:48px; }
  .stage.portrait .left{ left:48px; top:120px; width:804px; }
  .stage.portrait .ringwrap{ width:400px; height:400px; margin-top:30px; }
  .stage.portrait .ringdisc .now{ font-size:98px; }
  .stage.portrait .progbar{ width:400px; }
  .stage.portrait .herobelow{ margin-top:26px; }
  .stage.portrait .right{ left:48px; right:48px; top:850px; width:auto; }
  .stage.portrait .chip{ font-size:20px; padding:10px 18px; }
  .stage.portrait .controls{ margin:20px 0 4px; }
  .stage.portrait .ctl{ padding:14px 8px; font-size:21px; }
  .stage.portrait .status{ margin-top:20px; }
  .stage.portrait .srow{ padding:11px 0; font-size:23px; }
  `;

  class OvenbordCard extends HTMLElement {
    setConfig(config) {
      this._config = config || {};
      this._build();
    }
    getCardSize() { return 1; }
    set hass(hass) {
      this._hass = hass;
      if (this._built) this._update();
    }
    _st(id) {
      var s = this._hass && this._hass.states[id];
      return s ? s.state : undefined;
    }
    _attrs(id) {
      var s = this._hass && this._hass.states[id];
      return s ? (s.attributes || {}) : {};
    }
    _svc(domain, service, data) {
      if (this._hass) this._hass.callService(domain, service, data);
    }
    _build() {
      if (this._built) return;
      this._built = true;
      var root = this.shadowRoot || this.attachShadow({ mode: "open" });
      root.innerHTML = "<style>" + CSS + "</style>" +
      '<div class="stage" id="stage">' +
        '<div class="topbar"><span class="caps">Oven</span>' +
          '<span class="topstatus"><span class="dot" id="sdot"></span><span id="sstatus">Niet actief</span></span></div>' +
        '<div class="topline"></div>' +
        '<div class="left">' +
          '<div class="caps herolabel">Temperatuur in de oven</div>' +
          '<div class="ringwrap"><div class="ring" id="ring"></div>' +
            '<div class="ringdisc"><div class="now"><span id="tnow">--</span><sup>°C</sup></div>' +
            '<div class="sub" id="tsub">oven is uit</div></div></div>' +
          '<div class="herobelow"><div class="prog" id="progname">Geen programma</div>' +
            '<div class="meta" id="progmeta"></div>' +
            '<div class="progbar" id="progbarwrap" style="display:none"><i id="progbar"></i></div></div>' +
        '</div>' +
        '<div class="right">' +
          '<div class="blocklabel"><span class="caps">Programma kiezen</span></div>' +
          '<div class="chips" id="chips"></div>' +
          '<div class="controls">' +
            '<div class="ctl" id="powerctl">Aan / uit<small id="powerstate">Uit</small></div>' +
            '<div class="ctl stop" id="stopctl">Stop programma<small>Direct stoppen</small></div>' +
          '</div>' +
          '<div class="status">' +
            '<div class="blocklabel"><span class="caps">Status</span></div>' +
            '<div class="srow"><span class="k">Deur</span><span class="v" id="vdoor">Gesloten</span></div>' +
            '<div class="srow"><span class="k">Verbinding</span><span class="v" id="vconn">Verbonden</span></div>' +
            '<div class="srow"><span class="k">Start op afstand</span><span class="v" id="vremote">Aan</span></div>' +
            '<div class="srow tap" id="lockrow"><span class="k">Kinderslot</span><span class="v" id="vlock">Uit</span></div>' +
            '<div class="srow"><span class="k">Binnenverlichting</span><span class="v" id="vlight">Uit</span></div>' +
          '</div>' +
        '</div>' +
      '</div>';
      var q = function (id) { return root.getElementById(id); };
      this._el = { stage: q("stage"), ring: q("ring"), tnow: q("tnow"), tsub: q("tsub"),
        sdot: q("sdot"), sstatus: q("sstatus"), progname: q("progname"), progmeta: q("progmeta"),
        progbarwrap: q("progbarwrap"), progbar: q("progbar"), chips: q("chips"),
        powerctl: q("powerctl"), powerstate: q("powerstate"), stopctl: q("stopctl"),
        vdoor: q("vdoor"), vconn: q("vconn"), vremote: q("vremote"), vlock: q("vlock"), vlight: q("vlight") };
      var self = this;
      this._el.powerctl.addEventListener("click", function () {
        self._svc("switch", "toggle", { entity_id: E.power });
      });
      this._el.stopctl.addEventListener("click", function () {
        self._svc("button", "press", { entity_id: E.stopBtn });
      });
      q("lockrow").addEventListener("click", function () {
        self._svc("switch", "toggle", { entity_id: E.childlock });
      });
      this._ro = new ResizeObserver(function () { self._fit(); });
      this._ro.observe(this);
      this._onResize = function () { self._fit(); };
      window.addEventListener("resize", this._onResize);
      this._fit();
      setTimeout(function () { self._fit(); }, 300);
      if (this._hass) this._update();
    }
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
    _renderChips() {
      var el = this._el, self = this;
      var opts = this._attrs(E.selProg).options || [];
      var current = this._st(E.selProg);
      var html = "";
      opts.forEach(function (o) {
        html += '<span class="chip' + (o === current ? " active" : "") + '" data-prog="' + o + '">' + progLabel(o) + "</span>";
      });
      if (el.chips.innerHTML !== html) {
        el.chips.innerHTML = html;
        Array.prototype.forEach.call(el.chips.children, function (chip) {
          chip.addEventListener("click", function () {
            self._svc("select", "select_option", { entity_id: E.selProg, option: chip.getAttribute("data-prog") });
          });
        });
      }
    }
    _update() {
      var el = this._el;
      if (!el) return;
      var tempRaw = parseFloat(this._st(E.temp));
      var hasTemp = !isNaN(tempRaw);
      var status = this._st(E.status) || "unavailable";
      var powerOn = this._st(E.power) === "on";
      var running = status === "run" || status === "pause" || status === "delayedstart";

      el.sstatus.textContent = STATUS_NL[status] || status;
      el.sdot.className = "dot" + (running || powerOn ? " on" : "");
      el.tnow.textContent = hasTemp ? String(Math.round(tempRaw)) : "--";
      var pct = hasTemp ? Math.max(0, Math.min(100, tempRaw / 250 * 100)) : 0;
      var deg = pct / 100 * 360;
      var col = running ? "#d9a441" : "rgba(217,164,65,.45)";
      el.ring.style.background = "conic-gradient(" + col + " " + deg + "deg, rgba(255,255,255,.07) " + deg + "deg)";
      el.tsub.textContent = running ? "aan het verwarmen" : (powerOn ? "stand-by" : "oven is uit");

      var active = this._st(E.activeProg);
      var selected = this._st(E.selProg);
      var progShown = (active && active !== "unknown" && active !== "unavailable") ? active : selected;
      el.progname.textContent = progLabel(progShown);

      var prog = parseFloat(this._st(E.progress));
      var endt = this._st(E.endtime);
      var meta = "";
      if (running && !isNaN(prog)) meta = Math.round(prog) + "% klaar";
      if (endt && endt !== "unavailable" && endt !== "unknown") {
        var d = new Date(endt);
        if (!isNaN(d.getTime())) meta += (meta ? " · " : "") + "klaar om " +
          d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
      }
      el.progmeta.textContent = meta;
      el.progbarwrap.style.display = (!isNaN(prog) && running) ? "block" : "none";
      el.progbar.style.width = isNaN(prog) ? "0%" : Math.min(100, prog) + "%";

      this._renderChips();
      el.powerctl.className = "ctl" + (powerOn ? " on" : "");
      el.powerstate.textContent = powerOn ? "Aan" : "Uit";
      el.vdoor.textContent = DOOR_NL[this._st(E.door)] || this._st(E.door) || "Onbekend";
      el.vconn.textContent = this._st(E.conn) === "on" ? "Verbonden" : "Niet verbonden";
      el.vremote.textContent = this._st(E.remote) === "on" ? "Aan" : "Uit";
      el.vlock.textContent = this._st(E.childlock) === "on" ? "Aan" : "Uit";
      el.vlight.textContent = this._st(E.light) === "on" ? "Aan" : "Uit";
    }
    disconnectedCallback() {
      if (this._ro) this._ro.disconnect();
      if (this._onResize) window.removeEventListener("resize", this._onResize);
    }
  }

  if (!customElements.get("ovenbord-card")) customElements.define("ovenbord-card", OvenbordCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "ovenbord-card", name: "Ovenbord", preview: false,
    description: "Ovenpagina in de stijl van het familiebord (Home Connect)." });
})();
