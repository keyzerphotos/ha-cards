/* Energiebord card v1.0.2 — energiepagina (P1 + SolarEdge) in de stijl van
   het familiebord. Links live stromen (huisverbruik = P1 + zon, fysiek
   berekend), rechts vandaag-tegels en totalen.
   De vandaag-waarden zijn delta's van de tellerstanden sinds middernacht,
   opgehaald via history/history_during_period over de websocket. Lukt dat
   niet, dan tonen de tegels een streepje en blijven de totalen staan.
   Host verankerd met position:fixed inset:0 (wallpanel-patroon).
   v1.0.1: alleen de nav-balk, Stofzuiger erbij (zelfde sprong op alle
   borden).
   v1.0.2: de nav wisselt nu binnen de app (pushState + location-changed)
   in plaats van een volledige paginalading; dat haalt de witte flits bij
   het wisselen weg. Pakt de wissel niet, dan valt hij na 900 ms alsnog
   terug op de gewone link. Zelfde wijziging op alle vijf de borden. */
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
    p1: "sensor.p1_meter_vermogen",
    solar: "sensor.solaredge_i1_ac_power",
    importT: "sensor.p1_meter_energie_import",
    exportT: "sensor.p1_meter_energie_export",
    solarT: "sensor.solaredge_i1_ac_energy",
    gasT: "sensor.gas_meter_gas",
    saldo: "sensor.energie_saldo",
    tarief: "sensor.p1_meter_tarief",
    seStatus: "sensor.solaredge_se3000h_status",
    onGrid: "binary_sensor.solaredge_se3000h_on_grid"
  };
  var SE_NL = {
    sleeping: "Slaapstand", producing: "Produceert", off: "Uit", starting: "Start op",
    fault: "Storing", standby: "Stand-by", throttled: "Begrensd", shutting_down: "Sluit af",
    unavailable: "Onbekend", unknown: "Onbekend"
  };

  function num(v) {
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  function fmtW(w) {
    if (w === null) return "--";
    var a = Math.abs(w);
    if (a >= 1000) return (w / 1000).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kW";
    return Math.round(w) + " W";
  }
  function fmtKwh(v, decimals) {
    if (v === null) return "--";
    return v.toLocaleString("nl-NL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  var NAV = [["Home", "/familie-bord"], ["Keuken", "/keuken-bord"], ["Energie", "/energie-bord"], ["Auto", "/auto-bord"], ["Stofzuiger", "/stofzuiger-bord"]];
  var NAV_ACTIVE = "Energie";

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
  .col.left{ left:80px; width:820px; }
  .col.right{ left:1000px; width:840px; }
  .hero{ margin-top:44px; }
  .hero .big{ font-size:128px; font-weight:300; letter-spacing:-.02em; line-height:1; }
  .hero .big small{ font-size:44px; color:#a3a3a0; font-weight:300; }
  .hero .sub{ margin-top:16px; font-size:24px; color:#a3a3a0; }
  .flow{ margin-top:46px; }
  .frow{ display:flex; justify-content:space-between; align-items:baseline; padding:17px 0;
    border-bottom:1px solid rgba(255,255,255,.07); }
  .frow .k{ font-size:25px; color:#d6d6d2; }
  .frow .v{ font-size:36px; font-weight:500; }
  .frow .v.gold{ color:#e9c886; }
  .frow .v.green{ color:#8fce6e; }
  .status{ margin-top:34px; }
  .srow{ display:flex; justify-content:space-between; align-items:center; padding:12px 0;
    border-bottom:1px solid rgba(255,255,255,.07); font-size:23px; }
  .srow:last-child{ border-bottom:none; }
  .srow .k{ color:#d6d6d2; }
  .srow .v{ font-weight:500; }

  .tiles{ display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:26px; }
  .tile{ border:1px solid rgba(255,255,255,.09); border-radius:20px; padding:26px 28px; background:rgba(255,255,255,.02); }
  .tile .tcaps{ font-size:18px; letter-spacing:.26em; text-transform:uppercase; color:#a3a3a0; font-weight:500; }
  .tile .tv{ margin-top:14px; font-size:62px; font-weight:300; line-height:1; }
  .tile .tv small{ font-size:26px; color:#a3a3a0; }
  .totalen{ margin-top:40px; }

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
  .stage.portrait .col.right{ top:800px; }
  .stage.portrait .hero{ margin-top:26px; }
  .stage.portrait .hero .big{ font-size:96px; }
  .stage.portrait .flow{ margin-top:26px; }
  .stage.portrait .frow{ padding:12px 0; }
  .stage.portrait .frow .v{ font-size:31px; }
  .stage.portrait .status{ margin-top:22px; }
  .stage.portrait .tiles{ margin-top:18px; gap:12px; }
  .stage.portrait .tile{ padding:18px 20px; }
  .stage.portrait .tile .tv{ font-size:46px; margin-top:10px; }
  .stage.portrait .totalen{ margin-top:24px; }
  .stage.portrait .nav{ bottom:14px; }
  .stage.portrait .nav a{ font-size:19px; padding:10px 22px; }
  `;

  class EnergiebordCard extends HTMLElement {
    setConfig(config) {
      this._config = config || {};
      this._build();
    }
    getCardSize() { return 1; }
    set hass(hass) {
      var first = !this._hass;
      this._hass = hass;
      if (this._built) {
        this._update();
        if (first) this._fetchToday();
      }
    }
    _st(id) {
      var s = this._hass && this._hass.states[id];
      return s ? s.state : undefined;
    }
    _svc() {}
    _build() {
      if (this._built) return;
      this._built = true;
      this._today = null;
      var root = this.shadowRoot || this.attachShadow({ mode: "open" });
      var navHtml = NAV.map(function (n) {
        return '<a href="' + n[1] + '"' + (n[0] === NAV_ACTIVE ? ' class="active"' : "") + ">" + n[0] + "</a>";
      }).join("");
      root.innerHTML = "<style>" + CSS + "</style>" +
      '<div class="stage" id="stage">' +
        '<div class="topbar"><span class="caps" id="datum">Energie</span><span class="klok" id="klok">--:--</span></div>' +
        '<div class="topline"></div>' +
        '<div class="divider"></div>' +
        '<div class="col left">' +
          '<span class="caps">Nu live</span>' +
          '<div class="hero"><div class="big"><span id="huis">--</span></div>' +
            '<div class="sub" id="huissub">huisverbruik op dit moment</div></div>' +
          '<div class="flow">' +
            '<div class="frow"><span class="k">Zonopwekking</span><span class="v gold" id="zon">--</span></div>' +
            '<div class="frow"><span class="k" id="netlabel">Net</span><span class="v" id="net">--</span></div>' +
          '</div>' +
          '<div class="status">' +
            '<div class="srow"><span class="k">Omvormer</span><span class="v" id="sestatus">Onbekend</span></div>' +
            '<div class="srow"><span class="k">Netkoppeling</span><span class="v" id="grid">Verbonden</span></div>' +
            '<div class="srow"><span class="k">Tarief</span><span class="v" id="tarief">Normaal</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="col right">' +
          '<span class="caps">Vandaag</span>' +
          '<div class="tiles">' +
            '<div class="tile"><div class="tcaps">Verbruikt</div><div class="tv"><span id="timp">--</span> <small>kWh</small></div></div>' +
            '<div class="tile"><div class="tcaps">Teruggeleverd</div><div class="tv"><span id="texp">--</span> <small>kWh</small></div></div>' +
            '<div class="tile"><div class="tcaps">Opgewekt</div><div class="tv"><span id="tsol">--</span> <small>kWh</small></div></div>' +
            '<div class="tile"><div class="tcaps">Gas</div><div class="tv"><span id="tgas">--</span> <small>m³</small></div></div>' +
          '</div>' +
          '<div class="totalen">' +
            '<span class="caps">Totalen</span>' +
            '<div class="status">' +
              '<div class="srow"><span class="k">Saldo (afname min teruglevering)</span><span class="v" id="saldo">--</span></div>' +
              '<div class="srow"><span class="k">Afgenomen van net</span><span class="v" id="totimp">--</span></div>' +
              '<div class="srow"><span class="k">Teruggeleverd aan net</span><span class="v" id="totexp">--</span></div>' +
              '<div class="srow"><span class="k">Opgewekt door panelen</span><span class="v" id="totsol">--</span></div>' +
              '<div class="srow"><span class="k">Gas totaal</span><span class="v" id="totgas">--</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="nav">' + navHtml + '</div>' +
      '</div>';
      var hostEl = this;
      Array.prototype.forEach.call(root.querySelectorAll(".nav a"), function (a) {
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
      var q = function (id) { return root.getElementById(id); };
      var ids = ["stage", "datum", "klok", "huis", "huissub", "zon", "net", "netlabel", "sestatus", "grid",
        "tarief", "timp", "texp", "tsol", "tgas", "saldo", "totimp", "totexp", "totsol", "totgas"];
      this._el = {};
      var self = this;
      ids.forEach(function (id) { self._el[id] = q(id); });
      this._tickClock();
      this._clockTimer = setInterval(function () { self._tickClock(); }, 1000);
      this._histTimer = setInterval(function () { self._fetchToday(); }, 300000);
      this._ro = new ResizeObserver(function () { self._fit(); });
      this._ro.observe(this);
      this._onResize = function () { self._fit(); };
      window.addEventListener("resize", this._onResize);
      this._fit();
      setTimeout(function () { self._fit(); }, 300);
      if (this._hass) { this._update(); this._fetchToday(); }
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
    _fetchToday() {
      if (!this._hass || !this._hass.connection || !this._hass.connection.sendMessagePromise) return;
      var self = this;
      var now = new Date();
      var start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 0, 0);
      var midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime() / 1000;
      var ids = [E.importT, E.exportT, E.solarT, E.gasT];
      this._hass.connection.sendMessagePromise({
        type: "history/history_during_period",
        start_time: start.toISOString(),
        end_time: now.toISOString(),
        entity_ids: ids,
        significant_changes_only: false,
        minimal_response: true,
        no_attributes: true
      }).then(function (res) {
        var out = {};
        var data = (res && res.result) || res || {};
        ids.forEach(function (id) {
          var entries = data[id] || [];
          var base = null;
          for (var i = 0; i < entries.length; i++) {
            var lu = entries[i].lu !== undefined ? entries[i].lu : entries[i].lc;
            if (lu !== undefined && lu <= midnight) base = parseFloat(entries[i].s);
          }
          if (base === null && entries.length) base = parseFloat(entries[0].s);
          var cur = num(self._st(id));
          if (base !== null && !isNaN(base) && cur !== null) {
            var d = cur - base;
            out[id] = (d >= 0 && d < 500) ? d : null;
          } else {
            out[id] = null;
          }
        });
        self._today = out;
        self._update();
      }).catch(function () {
        self._today = null;
      });
    }
    _update() {
      var el = this._el;
      if (!el) return;
      var p1 = num(this._st(E.p1));
      var solar = num(this._st(E.solar));
      var huis = (p1 !== null && solar !== null) ? p1 + solar : null;
      el.huis.innerHTML = fmtW(huis).replace(/ (kW|W)$/, ' <small>$1</small>');
      if (huis === null) el.huissub.textContent = "huisverbruik niet beschikbaar";
      else if (solar !== null && solar > 5 && p1 !== null && p1 < 0) el.huissub.textContent = "huis draait op zon en levert terug";
      else if (solar !== null && solar > 5) el.huissub.textContent = "deels op eigen zon";
      else el.huissub.textContent = "huisverbruik op dit moment";
      el.zon.textContent = fmtW(solar);
      if (p1 === null) {
        el.netlabel.textContent = "Net";
        el.net.textContent = "--";
        el.net.className = "v";
      } else if (p1 >= 0) {
        el.netlabel.textContent = "Van het net";
        el.net.textContent = fmtW(p1);
        el.net.className = "v";
      } else {
        el.netlabel.textContent = "Naar het net";
        el.net.textContent = fmtW(-p1);
        el.net.className = "v green";
      }
      el.sestatus.textContent = SE_NL[this._st(E.seStatus)] || this._st(E.seStatus) || "Onbekend";
      el.grid.textContent = this._st(E.onGrid) === "on" ? "Verbonden" : "Niet verbonden";
      var tar = this._st(E.tarief);
      el.tarief.textContent = tar === "1" ? "Dal" : (tar === "2" ? "Normaal" : (tar || "Onbekend"));
      var t = this._today || {};
      el.timp.textContent = fmtKwh(t[E.importT] !== undefined ? t[E.importT] : null, 1);
      el.texp.textContent = fmtKwh(t[E.exportT] !== undefined ? t[E.exportT] : null, 1);
      el.tsol.textContent = fmtKwh(t[E.solarT] !== undefined ? t[E.solarT] : null, 1);
      el.tgas.textContent = fmtKwh(t[E.gasT] !== undefined ? t[E.gasT] : null, 2);
      el.saldo.textContent = fmtKwh(num(this._st(E.saldo)), 0) + " kWh";
      el.totimp.textContent = fmtKwh(num(this._st(E.importT)), 0) + " kWh";
      el.totexp.textContent = fmtKwh(num(this._st(E.exportT)), 0) + " kWh";
      el.totsol.textContent = fmtKwh(num(this._st(E.solarT)), 0) + " kWh";
      el.totgas.textContent = fmtKwh(num(this._st(E.gasT)), 0) + " m³";
    }
    disconnectedCallback() {
      if (this._ro) this._ro.disconnect();
      if (this._clockTimer) clearInterval(this._clockTimer);
      if (this._histTimer) clearInterval(this._histTimer);
      if (this._onResize) window.removeEventListener("resize", this._onResize);
    }
  }

  if (!customElements.get("energiebord-card")) customElements.define("energiebord-card", EnergiebordCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "energiebord-card", name: "Energiebord", preview: false,
    description: "Energiepagina (P1 + SolarEdge) in de stijl van het familiebord." });
})();
