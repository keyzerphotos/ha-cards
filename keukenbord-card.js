/* Keukenbord card v1.3.0 — keukenpagina (oven + vaatwasser).
   v1.3.0 (7 nov 2026, borden-eenheid blok 1): gemigreerd op bord-basis.js.
   Lettertype, tokens, navigatie, ring en podium-schaal komen nu uit de
   gedeelde basis; de lokale kopieën (eigen fontblok onder de gedeelde
   guard "familiebord-fonts", eigen NAV-array, eigen CSS-chunks) zijn weg.
   Chips staan op de standaardmaat van het ontwerpsysteem (20px, 14/26)
   en de statusregels op het gedeelde ritme (padding 12px), plan 3.4.
   v1.2.6 en eerder: zie git-geschiedenis (oven-presets, timer-rij,
   optimistische tikfeedback, wallpanel-host). */
import { zorgFont, navHtml, koppelNav, ringCss, ringRustCss, BASIS_CSS, startFit } from "./bord-basis.js";

(function () {
  "use strict";

  zorgFont();

  var OVEN = {
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
    remote: "binary_sensor.oven_start_op_afstand"
  };
  var VAAT = {
    status: "sensor.vaatwasser_status",
    door: "sensor.vaatwasser_deur",
    activeProg: "select.vaatwasser_actieve_programma",
    selProg: "select.vaatwasser_geselecteerd_programma",
    progress: "sensor.vaatwasser_programma_voortgang",
    endtime: "sensor.vaatwasser_programma_eindtijd",
    power: "switch.vaatwasser_inschakelen",
    stopBtn: "button.vaatwasser_stop_programma",
    conn: "binary_sensor.vaatwasser_connectiviteit",
    remote: "binary_sensor.vaatwasser_start_op_afstand",
    light: "binary_sensor.vaatwasser_interior_illumination_active"
  };

  var SETTEMP = "number.keuken_oven_ingestelde_temperatuur";
  var TIMER = "input_number.oven_timer";
  function fmtTimer(min) {
    min = Math.round(min);
    if (min < 60) return min + " min";
    var h = Math.floor(min / 60), r = min % 60;
    return r ? h + " uur " + r + " min" : h + " uur";
  }
  var OVEN_PRESETS = [
    { id: "script.oven_preset_basmati", label: "Basmati", prog: "cooking_oven_program_steam_modes_steam" },
    { id: "script.oven_preset_afbakbroodjes", label: "Afbakbroodjes", prog: "cooking_oven_program_heating_mode_hot_air", temp: 200 },
    { id: "script.oven_preset_warmhouden_60", label: "Warmhouden 60°", prog: "cooking_oven_program_heating_mode_keep_warm", temp: 60 },
    { id: "script.oven_preset_warmhouden_80", label: "Warmhouden 80°", prog: "cooking_oven_program_heating_mode_keep_warm", temp: 80 },
    { id: "script.oven_preset_hetelucht_180", label: "Hetelucht 180°", prog: "cooking_oven_program_heating_mode_hot_air", temp: 180 },
    { id: "script.oven_preset_hetelucht_200", label: "Hetelucht 200°", prog: "cooking_oven_program_heating_mode_hot_air", temp: 200 }
  ];

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
    sabbath_programme: "Sabbatprogramma", steam_modes_steam: "Stomen", keep_warm: "Warmhouden",
    dish_recommendation_conv_steam_part_cooked_bread_rolls_or_baguette: "Afbakbroodjes",
    intensive: "Intensief", hot_air_gentle: "Hetelucht zacht", top_bottom_heating_gentle: "Boven- en onderwarmte zacht",
    cool_star: "Coolstart", preheat_oven: "Voorverwarmen", dry: "Drogen", plate_warming: "Borden verwarmen"
  };
  var DW_NL = {
    intensiv_70: "Intensief 70°", auto_2: "Auto", eco_50: "Eco 50°", night_wash: "Nachtwassen",
    kurz_60: "Kort 60°", glas_40: "Glas 40°", quick_45: "Snel 45°", pre_rinse: "Voorspoelen",
    machine_care: "Machinereiniging"
  };
  function ovenLabel(raw) {
    if (!raw || raw === "unknown" || raw === "unavailable") return "Geen programma";
    var key = String(raw).replace("cooking_oven_program_heating_mode_", "").replace("cooking_oven_program_", "");
    if (PROG_NL[key]) return PROG_NL[key];
    return key.replace(/_/g, " ").replace(/^\w/, function (c) { return c.toUpperCase(); });
  }
  function dwLabel(raw) {
    if (!raw || raw === "unknown" || raw === "unavailable") return "Geen programma";
    var key = String(raw).replace("dishcare_dishwasher_program_", "");
    if (DW_NL[key]) return DW_NL[key];
    return key.replace(/_/g, " ").replace(/^\w/, function (c) { return c.toUpperCase(); });
  }
  function fmtTime(iso) {
    if (!iso || iso === "unavailable" || iso === "unknown") return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  }

  var CSS = BASIS_CSS + `
  .divider{ position:absolute; top:170px; bottom:150px; left:960px; width:1px; background:rgba(255,255,255,.07); }
  .panel{ position:absolute; top:140px; width:840px; }
  .panel.left{ left:80px; }
  .panel.right{ left:1000px; }
  .phead{ display:flex; justify-content:space-between; align-items:center; }
  .pstatus{ font-size:24px; display:flex; align-items:center; gap:12px; }
  .dot{ width:12px; height:12px; border-radius:50%; background:#3a3d42; }
  .dot.on{ background:#d9a441; box-shadow:0 0 14px rgba(217,164,65,.8); }
  .ringwrap{ position:relative; width:284px; height:284px; margin:6px auto 0; }
  .ring{ position:absolute; inset:0; border-radius:50%; }
  .ringdisc{ position:absolute; inset:22px; border-radius:50%; background:#0b0c0f;
    display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0 20px; }
  .ringdisc .now{ font-size:96px; font-weight:300; letter-spacing:-.02em; line-height:1; text-align:center; }
  .ringdisc .now sup{ font-size:38px; font-weight:300; color:#d9a441; margin-left:4px; }
  .ringdisc .now.word{ font-size:52px; letter-spacing:0; }
  .ringdisc .sub{ margin-top:12px; font-size:22px; color:#a3a3a0; text-align:center; }
  .below{ margin-top:8px; text-align:center; }
  .below .prog{ font-size:30px; font-weight:500; }
  .below .meta{ margin-top:6px; font-size:22px; color:#a3a3a0; min-height:26px; }
  .chips{ display:flex; flex-wrap:wrap; gap:9px; margin:6px 0 2px; justify-content:center; }
  .chipslabel{ margin-top:4px; text-align:center; font-size:18px; letter-spacing:.26em;
    text-transform:uppercase; color:#a3a3a0; font-weight:500; }
  .timerrow{ display:flex; align-items:center; gap:12px; margin-top:6px; }
  .timerrow .tlabel{ font-size:20px; color:#d6d6d2; margin-right:auto; }
  .timerrow .tbtn{ width:42px; height:42px; border-radius:50%; border:1px solid rgba(217,164,65,.55);
    color:#f4f4f2; font-size:26px; line-height:1; display:flex; align-items:center; justify-content:center;
    cursor:pointer; user-select:none; background:rgba(217,164,65,.08); }
  .timerrow .tbtn:active{ transform:scale(.94); }
  .timerrow .tval{ font-size:22px; font-weight:500; min-width:100px; text-align:center; }
  .srow.tap:active{ transform:scale(.97); }
  .controls{ display:flex; gap:14px; margin:6px 0 4px; }
  .ctl{ flex:1; }
  .ctl small{ display:block; margin-top:5px; font-size:18px; color:#a3a3a0; }
  .ctl.stop{ color:#e8a09a; }
  .status{ margin-top:6px; }
  .srow.tap{ cursor:pointer; }
  .stage.portrait .divider{ display:none; }
  .stage.portrait .panel{ width:812px; left:44px; }
  .stage.portrait .panel.left{ top:116px; }
  .stage.portrait .panel.right{ top:906px; }
  .stage.portrait .ringwrap{ width:198px; height:198px; margin-top:10px; }
  .stage.portrait .ringdisc .now{ font-size:70px; }
  .stage.portrait .ringdisc .now.word{ font-size:40px; }
  .stage.portrait .ringdisc .sub{ font-size:19px; margin-top:8px; }
  .stage.portrait .below{ margin-top:14px; }
  .stage.portrait .below .prog{ font-size:26px; }
  .stage.portrait .chips{ margin-top:8px; gap:8px; }
  .stage.portrait .chip{ font-size:17px; padding:8px 13px; }
  .stage.portrait .controls{ margin-top:9px; }
  .stage.portrait .ctl{ padding:11px 8px; font-size:20px; }
  .stage.portrait .status{ margin-top:10px; }
  .stage.portrait .srow{ padding:7px 0; font-size:21px; }
  .stage.portrait .xp{ display:none; }
  `;

  function panelHTML(prefix, name) {
    return '<div class="phead"><span class="caps">' + name + '</span>' +
      '<span class="pstatus"><span class="dot" id="' + prefix + 'dot"></span><span id="' + prefix + 'status">Niet actief</span></span></div>' +
      '<div class="ringwrap"><div class="ring" id="' + prefix + 'ring"></div>' +
        '<div class="ringdisc"><div class="now" id="' + prefix + 'now">--</div>' +
        '<div class="sub" id="' + prefix + 'sub"></div></div></div>' +
      '<div class="below"><div class="prog" id="' + prefix + 'prog">Geen programma</div>' +
        '<div class="meta" id="' + prefix + 'meta"></div></div>' +
      '<div class="chipslabel" id="' + prefix + 'chipslabel"></div>' +
      '<div class="chips" id="' + prefix + 'chips"></div>' +
      '<div class="controls">' +
        '<div class="ctl" id="' + prefix + 'power">Aan / uit<small id="' + prefix + 'powerstate">Uit</small></div>' +
        '<div class="ctl stop" id="' + prefix + 'stop">Stop programma<small>Direct stoppen</small></div>' +
      '</div>';
  }

  class KeukenbordCard extends HTMLElement {
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
    _optVal(key, real) {
      var o = this._opt && this._opt[key];
      if (!o) return real;
      if (Date.now() - o.t > 12000 || o.v === real) { delete this._opt[key]; return real; }
      return o.v;
    }
    _bumpTimer(delta) {
      var cur = this._optVal("timer", parseFloat(this._st(TIMER)));
      if (isNaN(cur)) cur = 60;
      var v = Math.max(5, Math.min(360, cur + delta));
      this._opt.timer = { v: v, t: Date.now() };
      this._svc("input_number", "set_value", { entity_id: TIMER, value: v });
      this._update();
    }
    _build() {
      if (this._built) return;
      this._built = true;
      this._opt = {};
      var root = this.shadowRoot || this.attachShadow({ mode: "open" });
      var navHtmlStr = navHtml("Keuken");
      root.innerHTML = "<style>" + CSS + "</style>" +
      '<div class="stage" id="stage">' +
        '<div class="topbar"><span class="caps" id="datum">Keuken</span><span class="klok" id="klok">--:--</span></div>' +
        '<div class="topline"></div>' +
        '<div class="divider"></div>' +
        '<div class="panel left">' + panelHTML("o", "Oven") +
          '<div class="timerrow xp"><span class="tlabel">Timer hetelucht</span>' +
            '<span class="tbtn" id="otminus">\u2212</span><span class="tval" id="otval">--</span><span class="tbtn" id="otplus">+</span></div>' +
          '<div class="status">' +
            '<div class="srow"><span class="k">Deur</span><span class="v" id="odoor">Gesloten</span></div>' +
            '<div class="srow xp"><span class="k">Start op afstand</span><span class="v" id="oremote">Uit</span></div>' +
            '<div class="srow tap" id="olockrow"><span class="k">Kinderslot</span><span class="v" id="olock">Uit</span></div>' +
            '<div class="srow xp"><span class="k">Verbinding</span><span class="v" id="oconn">Verbonden</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="panel right">' + panelHTML("v", "Vaatwasser") +
          '<div class="status">' +
            '<div class="srow"><span class="k">Deur</span><span class="v" id="vdoor">Gesloten</span></div>' +
            '<div class="srow"><span class="k">Start op afstand</span><span class="v" id="vremote">Aan</span></div>' +
            '<div class="srow xp"><span class="k">Verbinding</span><span class="v" id="vconn">Verbonden</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="nav">' + navHtmlStr + '</div>' +
      '</div>';
      koppelNav(root, this);
      var q = function (id) { return root.getElementById(id); };
      var ids = ["stage", "datum", "klok"];
      ["o", "v"].forEach(function (p) {
        ["dot", "status", "ring", "now", "sub", "prog", "meta", "chips", "chipslabel", "power", "powerstate", "stop"]
          .forEach(function (s) { ids.push(p + s); });
      });
      ids.push("otval", "odoor", "olock", "oconn", "oremote", "vdoor", "vremote", "vconn");
      this._el = {};
      var self = this;
      ids.forEach(function (id) { self._el[id] = q(id); });
      q("ochipslabel").textContent = "Mijn presets · tik = start";
      q("vchipslabel").textContent = "Programma kiezen";

      q("opower").addEventListener("click", function () {
        self._opt.opow = { v: self._st(OVEN.power) !== "on" ? "on" : "off", t: Date.now() };
        self._svc("switch", "toggle", { entity_id: OVEN.power });
        self._update();
      });
      q("ostop").addEventListener("click", function () {
        self._svc("button", "press", { entity_id: OVEN.stopBtn });
      });
      q("olockrow").addEventListener("click", function () {
        self._opt.olock = { v: self._st(OVEN.childlock) !== "on" ? "on" : "off", t: Date.now() };
        self._svc("switch", "toggle", { entity_id: OVEN.childlock });
        self._update();
      });
      q("otminus").addEventListener("click", function () { self._bumpTimer(-5); });
      q("otplus").addEventListener("click", function () { self._bumpTimer(5); });
      q("vpower").addEventListener("click", function () {
        self._opt.vpow = { v: self._st(VAAT.power) !== "on" ? "on" : "off", t: Date.now() };
        self._svc("switch", "toggle", { entity_id: VAAT.power });
        self._update();
      });
      q("vstop").addEventListener("click", function () {
        self._svc("button", "press", { entity_id: VAAT.stopBtn });
      });

      this._tickClock();
      this._clockTimer = setInterval(function () { self._tickClock(); }, 1000);
      this._stopFit = startFit(this, q("stage"));
      if (this._hass) this._update();
    }
    _tickClock() {
      var el = this._el;
      if (!el || !el.klok) return;
      var d = new Date();
      var t = d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
      if (el.klok.textContent !== t) el.klok.textContent = t;
      var dt = d.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
      if (el.datum.textContent !== dt) el.datum.textContent = dt;
    }
    _renderChips(prefix, selEntity, labelFn, optKey) {
      var el = this._el, self = this;
      var opts = this._attrs(selEntity).options || [];
      var current = this._optVal(optKey, this._st(selEntity));
      var html = "";
      opts.forEach(function (o) {
        html += '<span class="chip' + (o === current ? " active" : "") + '" data-prog="' + o + '">' + labelFn(o) + "</span>";
      });
      var box = el[prefix + "chips"];
      if (box.innerHTML !== html) {
        box.innerHTML = html;
        Array.prototype.forEach.call(box.children, function (chip) {
          chip.addEventListener("click", function () {
            self._opt[optKey] = { v: chip.getAttribute("data-prog"), t: Date.now() };
            self._svc("select", "select_option", { entity_id: selEntity, option: chip.getAttribute("data-prog") });
            self._update();
          });
        });
      }
    }
    _renderPresetChips() {
      var el = this._el, self = this;
      var active = this._st(OVEN.activeProg);
      var setTemp = parseFloat(this._st(SETTEMP));
      var tapped = this._optPreset;
      var html = "";
      OVEN_PRESETS.forEach(function (p) {
        var on = false;
        if (tapped && tapped.id === p.id && Date.now() - tapped.t < 20000) on = true;
        if (active === p.prog && (p.temp === undefined || isNaN(setTemp) || setTemp === p.temp)) on = true;
        html += '<span class="chip' + (on ? " active" : "") + '" data-preset="' + p.id + '">' + p.label + "</span>";
      });
      var box = el.ochips;
      if (box.innerHTML !== html) {
        box.innerHTML = html;
        Array.prototype.forEach.call(box.children, function (chip) {
          chip.addEventListener("click", function () {
            var id = chip.getAttribute("data-preset");
            self._optPreset = { id: id, t: Date.now() };
            self._svc("script", "turn_on", { entity_id: id });
            self._update();
          });
        });
      }
    }
    _updateAppliance(prefix, E, labelFn, keys, extra) {
      var el = this._el;
      var status = this._st(E.status) || "unavailable";
      var powerOn = this._optVal(keys.pow, this._st(E.power)) === "on";
      var running = status === "run" || status === "pause" || status === "delayedstart";
      el[prefix + "status"].textContent = powerOn || running ? (STATUS_NL[status] || status) : "Uit";
      el[prefix + "dot"].className = "dot" + (running || powerOn ? " on" : "");
      var active = this._st(E.activeProg);
      var selected = this._optVal(keys.sel, this._st(E.selProg));
      var progShown = (active && active !== "unknown" && active !== "unavailable") ? active : selected;
      el[prefix + "prog"].textContent = labelFn(progShown);
      var prog = parseFloat(this._st(E.progress));
      var endt = fmtTime(this._st(E.endtime));
      var meta = "";
      if (running && !isNaN(prog)) meta = Math.round(prog) + "% klaar";
      if (endt && (running || status === "delayedstart")) meta += (meta ? " · " : "") + "klaar om " + endt;
      el[prefix + "meta"].textContent = meta;
      if (extra.center) extra.center(el, prefix, { status: status, powerOn: powerOn, running: running, prog: prog });
      if (prefix === "o") this._renderPresetChips();
      else this._renderChips(prefix, E.selProg, labelFn, keys.sel);
      el[prefix + "power"].className = "ctl" + (powerOn ? " on" : "");
      el[prefix + "powerstate"].textContent = powerOn ? "Aan" : "Uit";
    }
    _update() {
      var el = this._el;
      if (!el) return;
      var self = this;
      this._updateAppliance("o", OVEN, ovenLabel, { pow: "opow", sel: "osel" }, {
        center: function (el2, p, ctx) {
          if (!ctx.powerOn) {
            el2[p + "now"].className = "now word";
            el2[p + "now"].textContent = "Uit";
            el2[p + "ring"].style.background = ringRustCss();
            el2[p + "sub"].textContent = "oven is uit";
            return;
          }
          var tempRaw = parseFloat(self._st(OVEN.temp));
          var hasTemp = !isNaN(tempRaw);
          el2[p + "now"].className = "now";
          el2[p + "now"].innerHTML = hasTemp ? Math.round(tempRaw) + "<sup>°C</sup>" : "--";
          var pct = hasTemp ? Math.max(0, Math.min(100, tempRaw / 250 * 100)) : 0;
          var col = ctx.running ? "#d9a441" : "rgba(217,164,65,.45)";
          el2[p + "ring"].style.background = ringCss(pct, col);
          el2[p + "sub"].textContent = ctx.running ? "aan het verwarmen" : (ctx.powerOn ? "stand-by" : "oven is uit");
        }
      });
      el.odoor.textContent = DOOR_NL[this._st(OVEN.door)] || this._st(OVEN.door) || "Onbekend";
      el.olock.textContent = this._optVal("olock", this._st(OVEN.childlock)) === "on" ? "Aan" : "Uit";
      el.oconn.textContent = this._st(OVEN.conn) === "on" ? "Verbonden" : "Niet verbonden";
      el.oremote.textContent = this._st(OVEN.remote) === "on" ? "Aan" : "Uit";
      var tmin = this._optVal("timer", parseFloat(this._st(TIMER)));
      el.otval.textContent = isNaN(tmin) ? "--" : fmtTimer(tmin);

      this._updateAppliance("v", VAAT, dwLabel, { pow: "vpow", sel: "vsel" }, {
        center: function (el2, p, ctx) {
          var nowEl = el2[p + "now"];
          if (ctx.running && !isNaN(ctx.prog)) {
            nowEl.className = "now";
            nowEl.textContent = Math.round(ctx.prog) + "%";
            el2[p + "ring"].style.background = ringCss(ctx.prog);
            el2[p + "sub"].textContent = ctx.status === "pause" ? "gepauzeerd" : "aan het wassen";
          } else {
            nowEl.className = "now word";
            nowEl.textContent = !ctx.powerOn ? "Uit" : (STATUS_NL[ctx.status] || ctx.status);
            el2[p + "ring"].style.background = ringRustCss();
            el2[p + "sub"].textContent = ctx.powerOn ? "programma gekozen" : "vaatwasser is uit";
          }
        }
      });
      el.vdoor.textContent = DOOR_NL[this._st(VAAT.door)] || this._st(VAAT.door) || "Onbekend";
      el.vremote.textContent = this._st(VAAT.remote) === "on" ? "Aan" : "Uit";
      el.vconn.textContent = this._st(VAAT.conn) === "on" ? "Verbonden" : "Niet verbonden";
    }
    disconnectedCallback() {
      if (this._stopFit) this._stopFit();
      if (this._clockTimer) clearInterval(this._clockTimer);
    }
  }

  if (!customElements.get("keukenbord-card")) customElements.define("keukenbord-card", KeukenbordCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "keukenbord-card", name: "Keukenbord", preview: false,
    description: "Keukenpagina (oven + vaatwasser) in de stijl van het familiebord." });
})();
