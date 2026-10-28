/* Autobord card v1.0.1 — autopagina (Ford Kuga PHEV) in de stijl van het
   familiebord. Links de accuring (hoogspanningsaccu uit _soc, NIET de
   12V-accu uit _battery), met puls tijdens laden en de laadeindtijd uit
   FordPass. Rechts tegels, statusregels en bediening (slot, start op
   afstand, locatie, vernieuwen).
   Host verankerd met position:fixed inset:0 (wallpanel-patroon). */
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

  var P = "fordpass_wf0fxxwpmhld21343_";
  var E = {
    soc: "sensor." + P + "soc",
    range: "sensor." + P + "elveh",
    charging: "sensor." + P + "elvehcharging",
    plug: "sensor." + P + "elvehplug",
    fuel: "sensor." + P + "fuel",
    fuelrange: "sensor." + P + "fuelrange",
    odo: "sensor." + P + "odometer",
    oil: "sensor." + P + "oil",
    batt12: "sensor." + P + "battery",
    tires: "sensor." + P + "tirepressure",
    lock: "lock." + P + "doorlock",
    doors: "sensor." + P + "doorstatus",
    windows: "sensor." + P + "windowposition",
    alarm: "sensor." + P + "alarm",
    ignition: "switch." + P + "ignition",
    remotestart: "sensor." + P + "remotestartstatus",
    refresh: "button." + P + "request_refresh",
    lastrefresh: "sensor." + P + "lastrefresh",
    tracker: "device_tracker." + P + "tracker",
    image: "image." + P + "vehicleimage"
  };

  function num(v) {
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  function fmtInt(v) {
    if (v === null) return "--";
    return Math.round(v).toLocaleString("nl-NL");
  }
  function fmtTime(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  }

  var NAV = [["Home", "/familie-bord"], ["Keuken", "/keuken-bord"], ["Energie", "/energie-bord"], ["Auto", "/auto-bord"]];
  var NAV_ACTIVE = "Auto";

  var CSS = `
  :host{ display:block; position:fixed; inset:0; height:100%; overflow:hidden; background:#08090b;
    font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif; color:#f4f4f2;
    -webkit-font-smoothing:antialiased; }
  *{ margin:0; padding:0; box-sizing:border-box; }
  .stage{ position:relative; width:1920px; height:1200px; transform-origin:top left; overflow:hidden;
    background:radial-gradient(1200px 800px at 30% 42%, #101216 0%, #08090b 62%); }
  .caps{ font-size:21px; letter-spacing:.34em; text-transform:uppercase; color:#a3a3a0; font-weight:500; }
  .topbar{ position:absolute; top:56px; left:80px; right:80px; display:flex; justify-content:space-between; align-items:baseline; }
  .klok{ font-size:30px; font-weight:300; }
  .topline{ position:absolute; top:112px; left:80px; right:80px; height:1px; background:rgba(255,255,255,.08); }
  .divider{ position:absolute; top:170px; bottom:150px; left:960px; width:1px; background:rgba(255,255,255,.07); }

  .col{ position:absolute; top:150px; }
  .col.left{ left:80px; width:820px; display:flex; flex-direction:column; align-items:center; }
  .col.left .caps{ align-self:flex-start; }
  .col.right{ left:1000px; width:840px; }
  .ringwrap{ position:relative; width:350px; height:350px; margin-top:34px; }
  .ring{ position:absolute; inset:0; border-radius:50%; }
  .ringwrap.laden .ring{ animation:pulse 2.2s ease-in-out infinite; }
  @keyframes pulse{ 0%,100%{ box-shadow:0 0 0 rgba(217,164,65,0);} 50%{ box-shadow:0 0 64px rgba(217,164,65,.35);} }
  .ringdisc{ position:absolute; inset:23px; border-radius:50%; background:#0b0c0f;
    display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .ringdisc .now{ font-size:104px; font-weight:300; letter-spacing:-.02em; line-height:1; }
  .ringdisc .now sup{ font-size:42px; font-weight:300; color:#d9a441; }
  .ringdisc .sub{ margin-top:12px; font-size:23px; color:#a3a3a0; }
  .laadregel{ margin-top:28px; font-size:26px; text-align:center; min-height:32px; }
  .laadregel .dim{ color:#a3a3a0; font-size:23px; }
  .carimg{ margin-top:22px; width:600px; max-height:250px; object-fit:contain; }

  .tiles{ display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:26px; }
  .tile{ border:1px solid rgba(255,255,255,.09); border-radius:20px; padding:24px 26px; background:rgba(255,255,255,.02); }
  .tile .tcaps{ font-size:18px; letter-spacing:.26em; text-transform:uppercase; color:#a3a3a0; font-weight:500; }
  .tile .tv{ margin-top:12px; font-size:56px; font-weight:300; line-height:1; }
  .tile .tv small{ font-size:25px; color:#a3a3a0; }
  .tile .tsub{ margin-top:9px; font-size:21px; color:#a3a3a0; }
  .status{ margin-top:30px; }
  .srow{ display:flex; justify-content:space-between; align-items:center; padding:12px 0;
    border-bottom:1px solid rgba(255,255,255,.07); font-size:23px; }
  .srow:last-child{ border-bottom:none; }
  .srow .k{ color:#d6d6d2; }
  .srow .v{ font-weight:500; }
  .srow .v.warn{ color:#e8b04b; }
  .controls{ display:flex; gap:14px; margin-top:28px; }
  .ctl{ flex:1; text-align:center; font-size:22px; padding:16px 8px; border-radius:16px; cursor:pointer; user-select:none;
    border:1px solid rgba(255,255,255,.13); background:rgba(255,255,255,.03); color:#f4f4f2; text-decoration:none; display:block; }
  .ctl.on{ border-color:rgba(217,164,65,.65); background:rgba(217,164,65,.12); }
  .ctl small{ display:block; margin-top:5px; font-size:18px; color:#a3a3a0; }
  .ctl:active{ transform:scale(.97); }

  .nav{ position:absolute; left:50%; transform:translateX(-50%); bottom:30px; display:flex; gap:8px;
    background:rgba(14,16,19,.88); border:1px solid rgba(255,255,255,.10); border-radius:999px; padding:9px; z-index:40; }
  .nav a{ font-size:21px; color:#d6d6d2; text-decoration:none; padding:11px 30px; border-radius:999px;
    border:1px solid transparent; letter-spacing:.04em; }
  .nav a.active{ background:rgba(217,164,65,.14); color:#f4f4f2; border-color:rgba(217,164,65,.55); }

  .stage.portrait{ width:900px; height:1600px; }
  .stage.portrait .topbar{ top:40px; left:44px; right:44px; }
  .stage.portrait .topline{ top:94px; left:44px; right:44px; }
  .stage.portrait .divider{ display:none; }
  .stage.portrait .col{ left:44px; width:812px; }
  .stage.portrait .col.left{ top:118px; }
  .stage.portrait .col.right{ top:838px; }
  .stage.portrait .ringwrap{ width:262px; height:262px; margin-top:20px; }
  .stage.portrait .ringdisc .now{ font-size:78px; }
  .stage.portrait .laadregel{ margin-top:18px; font-size:23px; }
  .stage.portrait .carimg{ width:470px; max-height:180px; margin-top:12px; }
  .stage.portrait .tiles{ margin-top:16px; gap:12px; }
  .stage.portrait .tile{ padding:16px 18px; }
  .stage.portrait .tile .tv{ font-size:42px; margin-top:8px; }
  .stage.portrait .status{ margin-top:14px; }
  .stage.portrait .srow{ padding:9px 0; font-size:21px; }
  .stage.portrait .controls{ margin-top:14px; }
  .stage.portrait .ctl{ padding:12px 6px; font-size:19px; }
  .stage.portrait .xp{ display:none; }
  .stage.portrait .nav{ bottom:14px; }
  .stage.portrait .nav a{ font-size:19px; padding:10px 22px; }
  `;

  class AutobordCard extends HTMLElement {
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
    _build() {
      if (this._built) return;
      this._built = true;
      this._opt = {};
      var root = this.shadowRoot || this.attachShadow({ mode: "open" });
      var navHtml = NAV.map(function (n) {
        return '<a href="' + n[1] + '"' + (n[0] === NAV_ACTIVE ? ' class="active"' : "") + ">" + n[0] + "</a>";
      }).join("");
      root.innerHTML = "<style>" + CSS + "</style>" +
      '<div class="stage" id="stage">' +
        '<div class="topbar"><span class="caps" id="datum">Auto</span><span class="klok" id="klok">--:--</span></div>' +
        '<div class="topline"></div>' +
        '<div class="divider"></div>' +
        '<div class="col left">' +
          '<span class="caps">Ford Kuga · Accu</span>' +
          '<div class="ringwrap" id="ringwrap"><div class="ring" id="ring"></div>' +
            '<div class="ringdisc"><div class="now"><span id="soc">--</span><sup>%</sup></div>' +
            '<div class="sub" id="range">elektrisch bereik onbekend</div></div></div>' +
          '<div class="laadregel" id="laadregel">Stekker niet aangesloten</div>' +
          '<img class="carimg" id="carimg" alt="Ford Kuga" style="display:none">' +
        '</div>' +
        '<div class="col right">' +
          '<span class="caps">Onderweg</span>' +
          '<div class="tiles">' +
            '<div class="tile"><div class="tcaps">Benzine</div><div class="tv"><span id="fuel">--</span><small> %</small></div><div class="tsub" id="fuelrange">bereik onbekend</div></div>' +
            '<div class="tile"><div class="tcaps">Kilometerstand</div><div class="tv"><span id="odo">--</span><small> km</small></div><div class="tsub">totaal gereden</div></div>' +
            '<div class="tile"><div class="tcaps">Olie</div><div class="tv"><span id="oil">--</span><small> %</small></div><div class="tsub">levensduur resterend</div></div>' +
            '<div class="tile"><div class="tcaps">12V-accu</div><div class="tv"><span id="batt12">--</span><small> %</small></div><div class="tsub">startaccu</div></div>' +
          '</div>' +
          '<div class="status">' +
            '<div class="srow"><span class="k">Slot</span><span class="v" id="vlock">Onbekend</span></div>' +
            '<div class="srow"><span class="k">Deuren</span><span class="v" id="vdoors">Onbekend</span></div>' +
            '<div class="srow"><span class="k">Banden</span><span class="v" id="vtires">Onbekend</span></div>' +
            '<div class="srow xp"><span class="k">Alarm</span><span class="v" id="valarm">Onbekend</span></div>' +
            '<div class="srow"><span class="k">Gegevens</span><span class="v" id="vfresh">Onbekend</span></div>' +
          '</div>' +
          '<div class="controls">' +
            '<div class="ctl" id="lockctl"><span id="lockmain">Vergrendel</span><small id="locksub">slot bedienen</small></div>' +
            '<div class="ctl" id="startctl">Start motor<small id="startsub">op afstand</small></div>' +
            '<a class="ctl" id="locctl" href="#" target="_blank" rel="noopener">Locatie<small>open in Maps</small></a>' +
            '<div class="ctl" id="refreshctl">Vernieuw<small>gegevens ophalen</small></div>' +
          '</div>' +
        '</div>' +
        '<div class="nav">' + navHtml + '</div>' +
      '</div>';
      var q = function (id) { return root.getElementById(id); };
      var ids = ["stage", "datum", "klok", "ringwrap", "ring", "soc", "range", "laadregel", "carimg",
        "fuel", "fuelrange", "odo", "oil", "batt12", "vlock", "vdoors", "vtires", "valarm", "vfresh",
        "lockctl", "lockmain", "locksub", "startctl", "startsub", "locctl", "refreshctl"];
      this._el = {};
      var self = this;
      ids.forEach(function (id) { self._el[id] = q(id); });
      this._el.carimg.addEventListener("error", function () { self._el.carimg.style.display = "none"; });
      this._el.carimg.addEventListener("load", function () { self._el.carimg.style.display = "block"; });
      this._el.lockctl.addEventListener("click", function () {
        var locked = self._optVal("lock", self._st(E.lock)) === "locked";
        self._opt.lock = { v: locked ? "unlocked" : "locked", t: Date.now() };
        self._svc("lock", locked ? "unlock" : "lock", { entity_id: E.lock });
        self._update();
      });
      this._el.startctl.addEventListener("click", function () {
        self._svc("switch", "toggle", { entity_id: E.ignition });
      });
      this._el.refreshctl.addEventListener("click", function () {
        self._svc("button", "press", { entity_id: E.refresh });
      });
      this._tickClock();
      this._clockTimer = setInterval(function () { self._tickClock(); self._updateFresh(); }, 1000);
      this._ro = new ResizeObserver(function () { self._fit(); });
      this._ro.observe(this);
      this._onResize = function () { self._fit(); };
      window.addEventListener("resize", this._onResize);
      this._fit();
      setTimeout(function () { self._fit(); }, 300);
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
    _updateFresh() {
      var el = this._el;
      if (!el || !el.vfresh) return;
      var lr = this._st(E.lastrefresh);
      var t = fmtTime(lr);
      if (!t) { el.vfresh.textContent = "Onbekend"; el.vfresh.className = "v"; return; }
      var age = Math.round((Date.now() - new Date(lr).getTime()) / 60000);
      if (age > 30) {
        el.vfresh.textContent = "van " + t + " · verouderd";
        el.vfresh.className = "v warn";
      } else {
        el.vfresh.textContent = "bijgewerkt om " + t;
        el.vfresh.className = "v";
      }
    }
    _update() {
      var el = this._el;
      if (!el) return;
      var soc = num(this._st(E.soc));
      el.soc.textContent = soc === null ? "--" : String(Math.round(soc));
      var deg = soc === null ? 0 : Math.max(0, Math.min(100, soc)) / 100 * 360;
      var range = num(this._st(E.range));
      el.range.textContent = range === null ? "elektrisch bereik onbekend" : fmtInt(range) + " km elektrisch";
      var chgAttrs = this._attrs(E.charging);
      var chgState = chgAttrs.chargingStatus || this._st(E.charging) || "";
      var laden = chgState === "CHARGING" || chgState === "IN_PROGRESS";
      el.ringwrap.className = "ringwrap" + (laden ? " laden" : "");
      var col = laden ? "#d9a441" : "rgba(217,164,65,.55)";
      el.ring.style.background = "conic-gradient(" + col + " " + deg + "deg, rgba(255,255,255,.07) " + deg + "deg)";

      var plug = this._st(E.plug) || chgAttrs.plugStatus || "";
      var regel = "";
      if (plug === "DISCONNECTED") {
        regel = 'Stekker niet aangesloten';
      } else if (laden) {
        regel = "Aan het laden";
        var kw = num(chgAttrs.chargingkW);
        if (kw !== null && kw > 0) regel += ' <span class="dim">· ' + kw.toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kW</span>";
        var eind = fmtTime(chgAttrs.estimatedEndTime);
        if (eind) regel += ' <span class="dim">· klaar om ' + eind + "</span>";
      } else if (plug === "CONNECTED") {
        regel = chgState === "COMPLETE" || chgState === "FINISHED" ? "Volgeladen, stekker aangesloten" : "Aangesloten, laadt niet";
      } else {
        regel = "Laadstatus onbekend";
      }
      el.laadregel.innerHTML = regel;

      var pic = this._attrs(E.image).entity_picture;
      if (pic && el.carimg.getAttribute("src") !== pic) el.carimg.setAttribute("src", pic);

      el.fuel.textContent = fmtInt(num(this._st(E.fuel)));
      var fr = num(this._st(E.fuelrange));
      el.fuelrange.textContent = fr === null ? "bereik onbekend" : "nog " + fmtInt(fr) + " km op benzine";
      el.odo.textContent = fmtInt(num(this._st(E.odo)));
      el.oil.textContent = fmtInt(num(this._st(E.oil)));
      el.batt12.textContent = fmtInt(num(this._st(E.batt12)));

      var locked = this._optVal("lock", this._st(E.lock)) === "locked";
      el.vlock.textContent = locked ? "Vergrendeld" : "Open";
      el.lockmain.textContent = locked ? "Ontgrendel" : "Vergrendel";
      el.lockctl.className = "ctl" + (locked ? "" : " on");
      el.locksub.textContent = locked ? "tik om te openen" : "tik om te vergrendelen";
      var doors = this._st(E.doors);
      el.vdoors.textContent = doors === "Open" ? "Open" : (doors === "Closed" ? "Dicht" : (doors || "Onbekend"));
      var tires = this._st(E.tires) || "";
      if (/fault|warning|low/i.test(tires)) {
        el.vtires.textContent = "Controle nodig";
        el.vtires.className = "v warn";
      } else if (tires) {
        el.vtires.textContent = "Op spanning";
        el.vtires.className = "v";
      } else {
        el.vtires.textContent = "Onbekend";
        el.vtires.className = "v";
      }
      var alarm = this._st(E.alarm);
      el.valarm.textContent = alarm === "ARMED" ? "Aan" : (alarm === "DISARMED" ? "Uit" : (alarm || "Onbekend"));
      var rs = this._st(E.remotestart);
      var ignOn = this._st(E.ignition) === "on" || rs === "Active";
      el.startctl.className = "ctl" + (ignOn ? " on" : "");
      el.startsub.textContent = ignOn ? "motor draait · tik om te stoppen" : "op afstand starten";
      var ta = this._attrs(E.tracker);
      if (ta.latitude !== undefined && ta.longitude !== undefined) {
        el.locctl.setAttribute("href", "https://www.google.com/maps?q=" + ta.latitude + "," + ta.longitude);
      }
      this._updateFresh();
    }
    disconnectedCallback() {
      if (this._ro) this._ro.disconnect();
      if (this._clockTimer) clearInterval(this._clockTimer);
      if (this._onResize) window.removeEventListener("resize", this._onResize);
    }
  }

  if (!customElements.get("autobord-card")) customElements.define("autobord-card", AutobordCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "autobord-card", name: "Autobord", preview: false,
    description: "Autopagina (Ford Kuga) in de stijl van het familiebord." });
})();
