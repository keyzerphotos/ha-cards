/* Stofzuigerbord card v1.0 — stofzuigerpagina (Ecovacs Deebot James) in de
   stijl van de bordenfamilie. Links de echte plattegrond (image.james) in een
   vast paneel, daaronder de status in woorden. Rechts de laatste schoonmaak
   als tegels, zuigstand als chips en de bediening: een gouden hoofdknop met
   wisselend label en een knop Naar dock. Bewust geen Stop-knop (Daan) en
   geen kamerchips: segmentreiniging is op deze Gen3 nog niet end-to-end
   bewezen (Stijn), dat is werk voor v1.1 na een begeleide kamertest.
   De accu komt uit sensor.james_batterij; het battery-attribuut op
   vacuum.james zelf is leeg. Totalen (het _2-paar) blijven weg tot hun
   betekenis met een delta na een echte rit is bewezen.
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

  var E = {
    vac: "vacuum.james",
    batt: "sensor.james_batterij",
    opp: "sensor.james_oppervlakte",
    duur: "sensor.james_duur",
    kaart: "image.james"
  };
  var FAN_LABELS = { quiet: "Stil", normal: "Normaal", max: "Max", max_plus: "Max+" };
  var FAN_ORDER = ["quiet", "normal", "max", "max_plus"];

  function num(v) {
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  function fmtGetal(v, dec) {
    if (v === null) return "--";
    return v.toLocaleString("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: dec === undefined ? 1 : dec });
  }
  function hhmm(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  }

  var NAV = [["Home", "/familie-bord"], ["Keuken", "/keuken-bord"], ["Energie", "/energie-bord"], ["Auto", "/auto-bord"], ["Stofzuiger", "/stofzuiger-bord"]];
  var NAV_ACTIVE = "Stofzuiger";

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

  .bloklabel{ display:block; padding-bottom:12px; border-bottom:1px solid rgba(255,255,255,.08); }
  .col{ position:absolute; top:150px; }
  .col.left{ left:80px; width:820px; }
  .col.right{ left:1000px; width:840px; }
  .mappanel{ margin-top:18px; height:600px; border:1px solid rgba(255,255,255,.09); border-radius:18px;
    background:#101215; padding:18px; position:relative; overflow:hidden; }
  .mappanel img{ width:100%; height:100%; object-fit:contain; display:none; }
  .mapleeg{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    font-size:21px; color:#a3a3a0; text-align:center; padding:0 60px; }
  .kaartvers{ margin-top:14px; font-size:19px; color:#a3a3a0; min-height:24px; }
  .statusblok{ margin-top:30px; }
  .statuszin{ display:flex; align-items:center; gap:16px; font-size:34px; font-weight:500; min-height:44px; }
  .statuszin .dot{ width:13px; height:13px; border-radius:50%; background:transparent; border:2px solid rgba(255,255,255,.25); flex:0 0 auto; }
  .statuszin .dot.aan{ background:#d9a441; border-color:#d9a441; }
  .statuszin .dot.fout{ background:#e8b04b; border-color:#e8b04b; }
  .gevolg{ margin-top:10px; font-size:21px; color:#a3a3a0; min-height:27px; }
  .gevolg.warn{ color:#e8b04b; }

  .tiles{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-top:18px; }
  .tile{ border:1px solid rgba(255,255,255,.09); border-radius:20px; padding:24px 26px; background:rgba(255,255,255,.02); }
  .tile .tcaps{ font-size:19px; letter-spacing:.26em; text-transform:uppercase; color:#a3a3a0; font-weight:500; }
  .tile .tv{ margin-top:12px; font-size:48px; font-weight:300; line-height:1; }
  .tile .tv small{ font-size:24px; color:#a3a3a0; }
  .tile .tsub{ margin-top:9px; font-size:21px; color:#a3a3a0; }
  .blok{ margin-top:36px; }
  .chips{ display:flex; gap:12px; margin-top:18px; flex-wrap:wrap; }
  .chip{ border:1px solid rgba(255,255,255,.13); border-radius:999px; padding:16px 26px; font-size:20px;
    color:#9ba1a8; display:flex; align-items:center; gap:10px; cursor:pointer; user-select:none; }
  .chip:active{ transform:scale(.96); }
  .chip.active{ border-color:rgba(217,164,65,.55); color:#f4f4f2; }
  .chip .cdot{ width:8px; height:8px; border-radius:50%; background:#d9a441; visibility:hidden; }
  .chip.active .cdot{ visibility:visible; }
  .controls{ display:flex; gap:14px; margin-top:18px; }
  .ctl{ flex:1; text-align:center; font-size:22px; padding:20px 8px; border-radius:16px; cursor:pointer; user-select:none;
    border:1px solid rgba(255,255,255,.13); background:rgba(255,255,255,.03); color:#f4f4f2; }
  .ctl:active{ transform:scale(.97); }
  .ctl.primary{ flex:1.6; background:#d9a441; border-color:#d9a441; color:#14100a; font-weight:600; }
  .ctl.busy{ opacity:.55; pointer-events:none; }
  .ctl.disabled{ opacity:.45; pointer-events:none; }
  .offline{ margin-top:26px; font-size:24px; line-height:1.5; color:#d6d6d2; }

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
  .stage.portrait .col.right{ top:900px; }
  .stage.portrait .mappanel{ height:430px; margin-top:16px; }
  .stage.portrait .statusblok{ margin-top:18px; }
  .stage.portrait .statuszin{ font-size:30px; }
  .stage.portrait .tiles{ margin-top:16px; gap:12px; }
  .stage.portrait .tile{ padding:16px 18px; }
  .stage.portrait .tile .tv{ font-size:42px; margin-top:8px; }
  .stage.portrait .blok{ margin-top:20px; }
  .stage.portrait .nav{ bottom:14px; }
  .stage.portrait .nav a{ font-size:19px; padding:10px 18px; }
  `;

  class StofzuigerbordCard extends HTMLElement {
    setConfig(config) {
      this._config = config || {};
      this._build();
    }
    getCardSize() { return 1; }
    set hass(hass) {
      this._hass = hass;
      if (this._built) { this._update(); this._maybeMap(); }
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
      if (!this._hass) return;
      var p = this._hass.callService(domain, service, data);
      if (p && p.catch) p.catch(function () {});
    }
    _build() {
      if (this._built) return;
      this._built = true;
      var root = this.shadowRoot || this.attachShadow({ mode: "open" });
      var navHtml = NAV.map(function (n) {
        return '<a href="' + n[1] + '"' + (n[0] === NAV_ACTIVE ? ' class="active"' : "") + ">" + n[0] + "</a>";
      }).join("");
      var chipsHtml = FAN_ORDER.map(function (f) {
        return '<div class="chip" data-fan="' + f + '"><span class="cdot"></span>' + FAN_LABELS[f] + "</div>";
      }).join("");
      root.innerHTML = "<style>" + CSS + "</style>" +
      '<div class="stage" id="stage">' +
        '<div class="topbar"><span class="caps" id="datum">Stofzuiger</span><span class="klok" id="klok">--:--</span></div>' +
        '<div class="topline"></div>' +
        '<div class="divider"></div>' +
        '<div class="col left">' +
          '<span class="caps bloklabel">Plattegrond</span>' +
          '<div class="mappanel" id="mappanel"><img id="kaartimg" alt="Plattegrond van James"><div class="mapleeg" id="mapleeg">Nog geen kaart beschikbaar</div></div>' +
          '<div class="kaartvers" id="kaartvers"></div>' +
          '<div class="statusblok">' +
            '<div class="statuszin"><span class="dot" id="statusdot"></span><span id="statuswoord">Even geduld</span></div>' +
            '<div class="gevolg" id="gevolg"></div>' +
          '</div>' +
        '</div>' +
        '<div class="col right">' +
          '<div id="online">' +
            '<span class="caps bloklabel">Laatste schoonmaak</span>' +
            '<div class="tiles">' +
              '<div class="tile"><div class="tcaps">Batterij</div><div class="tv"><span id="tbatt">--</span><small> %</small></div><div class="tsub" id="tbattsub">accu</div></div>' +
              '<div class="tile"><div class="tcaps">Oppervlakte</div><div class="tv"><span id="topp">--</span><small> m²</small></div><div class="tsub">schoongemaakt</div></div>' +
              '<div class="tile"><div class="tcaps">Duur</div><div class="tv"><span id="tduur">--</span><small> min</small></div><div class="tsub">onderweg geweest</div></div>' +
            '</div>' +
            '<div class="blok"><span class="caps bloklabel">Zuigstand</span><div class="chips" id="fanchips">' + chipsHtml + '</div></div>' +
            '<div class="blok"><span class="caps bloklabel">Bediening</span><div class="controls">' +
              '<div class="ctl primary" id="hoofdknop">Start zuigen</div>' +
              '<div class="ctl" id="dockknop" style="display:none">Naar dock</div>' +
            '</div></div>' +
          '</div>' +
          '<div class="offline" id="offline" style="display:none">James is even niet bereikbaar.<br>De bediening staat uit tot er weer verbinding is.</div>' +
        '</div>' +
        '<div class="nav">' + navHtml + '</div>' +
      '</div>';
      var q = function (id) { return root.getElementById(id); };
      var ids = ["stage", "datum", "klok", "mappanel", "kaartimg", "mapleeg", "kaartvers",
        "statusdot", "statuswoord", "gevolg", "online", "offline", "tbatt", "tbattsub", "topp", "tduur",
        "fanchips", "hoofdknop", "dockknop"];
      this._el = {};
      var self = this;
      ids.forEach(function (id) { self._el[id] = q(id); });
      Array.prototype.forEach.call(this._el.fanchips.querySelectorAll("[data-fan]"), function (chip) {
        chip.addEventListener("click", function () { self._fanTap(chip.getAttribute("data-fan")); });
      });
      this._el.hoofdknop.addEventListener("click", function () { self._hoofdTap(); });
      this._el.dockknop.addEventListener("click", function () { self._dockTap(); });
      this._el.kaartimg.addEventListener("error", function () {
        self._el.kaartimg.style.display = "none";
        self._el.mapleeg.style.display = "flex";
      });
      this._tickClock();
      this._clockTimer = setInterval(function () {
        self._tickClock();
        if (self._pendMain || self._pendFan || self._flashMsg) self._update();
      }, 1000);
      this._mapTimer = setInterval(function () { self._maybeMap(); }, 60000);
      this._ro = new ResizeObserver(function () { self._fit(); });
      this._ro.observe(this);
      this._onResize = function () { self._fit(); };
      window.addEventListener("resize", this._onResize);
      this._fit();
      setTimeout(function () { self._fit(); }, 300);
      if (this._hass) { this._update(); this._maybeMap(); }
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
    _flash(msg) {
      this._flashMsg = msg;
      this._flashUntil = Date.now() + 4500;
      this._update();
    }
    _hoofdTap() {
      if (this._pendMain) return;
      var a = this._hoofdActie;
      if (!a) return;
      this._pendMain = { tekst: a.bezig, van: this._st(E.vac), tot: Date.now() + 12000 };
      this._svc("vacuum", a.service, { entity_id: E.vac });
      this._update();
    }
    _dockTap() {
      if (this._pendMain) return;
      this._pendMain = { tekst: "Naar het dock…", van: this._st(E.vac), tot: Date.now() + 12000 };
      this._svc("vacuum", "return_to_base", { entity_id: E.vac });
      this._update();
    }
    _fanTap(fan) {
      if (this._pendFan) return;
      if (this._attrs(E.vac).fan_speed === fan) return;
      this._pendFan = { val: fan, tot: Date.now() + 12000 };
      this._svc("vacuum", "set_fan_speed", { entity_id: E.vac, fan_speed: fan });
      this._update();
    }
    _update() {
      var el = this._el;
      if (!el) return;
      var vacState = this._st(E.vac);
      var offline = !vacState || vacState === "unavailable" || vacState === "unknown";
      var batt = num(this._st(E.batt));
      var fan = this._attrs(E.vac).fan_speed;

      // openstaande commando's afhandelen: echte state wint, time-out is eerlijk
      if (this._pendMain) {
        if (vacState !== this._pendMain.van || Date.now() > this._pendMain.tot) {
          var verlopen = vacState === this._pendMain.van && Date.now() > this._pendMain.tot;
          this._pendMain = null;
          if (verlopen && !offline) {
            this._flashMsg = "James reageert niet, probeer het opnieuw";
            this._flashUntil = Date.now() + 4500;
          }
        }
      }
      if (this._pendFan) {
        if (fan === this._pendFan.val || Date.now() > this._pendFan.tot) this._pendFan = null;
      }

      el.online.style.display = offline ? "none" : "block";
      el.offline.style.display = offline ? "block" : "none";

      // statuszin en gevolg
      var woord = "", gevolg = "", dot = "", gevolgWarn = false;
      if (offline) {
        var s = this._hass && this._hass.states[E.vac];
        woord = "Geen verbinding";
        gevolg = s && s.last_changed ? "Laatst gezien om " + hhmm(s.last_changed) : "";
      } else if (vacState === "docked") {
        woord = "In het dock";
        gevolg = batt !== null && batt >= 99 ? "Volgeladen" : "Laadt op";
      } else if (vacState === "cleaning") {
        woord = "Aan het zuigen";
        dot = "aan";
        if (batt !== null && batt <= 20) { gevolg = "Batterij laag, " + Math.round(batt) + "%"; gevolgWarn = true; }
        else gevolg = "Stand " + (FAN_LABELS[fan] || "onbekend");
      } else if (vacState === "paused") {
        woord = "Gepauzeerd";
        gevolg = "Tik op Ga verder om door te gaan";
      } else if (vacState === "returning") {
        woord = "Onderweg naar het dock";
        dot = "aan";
        gevolg = "In het dock laadt hij weer op";
      } else if (vacState === "error") {
        woord = "Vastgelopen";
        dot = "fout";
        gevolg = "Kijk James even na en stuur hem daarna naar het dock";
        gevolgWarn = true;
      } else if (vacState === "idle") {
        woord = "Staat stil";
        gevolg = "Niet in het dock";
      } else {
        woord = vacState;
      }
      if (this._pendMain) { woord = this._pendMain.tekst; gevolg = ""; dot = "aan"; }
      el.statuswoord.textContent = woord;
      el.statusdot.className = "dot" + (dot ? " " + dot : "");
      if (this._flashMsg && Date.now() < this._flashUntil) {
        el.gevolg.textContent = this._flashMsg;
        el.gevolg.className = "gevolg warn";
      } else {
        el.gevolg.textContent = gevolg;
        el.gevolg.className = "gevolg" + (gevolgWarn ? " warn" : "");
      }

      // tegels
      el.tbatt.textContent = batt === null ? "--" : String(Math.round(batt));
      el.tbattsub.textContent = offline ? "accu" :
        vacState === "docked" ? (batt !== null && batt >= 99 ? "volgeladen" : "laadt op") :
        vacState === "cleaning" ? "in gebruik" : "accu";
      el.topp.textContent = fmtGetal(num(this._st(E.opp)), 0);
      el.tduur.textContent = fmtGetal(num(this._st(E.duur)), 1);

      // zuigstandchips
      var actiefFan = this._pendFan ? this._pendFan.val : fan;
      Array.prototype.forEach.call(el.fanchips.querySelectorAll("[data-fan]"), function (chip) {
        chip.classList.toggle("active", chip.getAttribute("data-fan") === actiefFan);
      });

      // hoofdknop en dockknop
      var actie = null;
      if (!offline) {
        if (vacState === "docked" || vacState === "idle") actie = { label: "Start zuigen", service: "start", bezig: "Starten…" };
        else if (vacState === "cleaning") actie = { label: "Pauze", service: "pause", bezig: "Pauzeren…" };
        else if (vacState === "paused") actie = { label: "Ga verder", service: "start", bezig: "Verder gaan…" };
        else if (vacState === "error") actie = { label: "Naar dock", service: "return_to_base", bezig: "Naar het dock…" };
        else if (vacState === "returning") actie = { label: "Onderweg…", service: null, bezig: "" };
      }
      this._hoofdActie = actie && actie.service ? actie : null;
      el.hoofdknop.textContent = this._pendMain ? this._pendMain.tekst : (actie ? actie.label : "Start zuigen");
      el.hoofdknop.className = "ctl primary" +
        (this._pendMain ? " busy" : "") + (!actie || !actie.service ? " disabled" : "");
      var dockZichtbaar = !offline && (vacState === "cleaning" || vacState === "paused" || vacState === "idle");
      el.dockknop.style.display = dockZichtbaar ? "block" : "none";
      el.dockknop.className = "ctl" + (this._pendMain ? " busy" : "");
    }
    _maybeMap() {
      if (!this._hass || !this._hass.connection) return;
      var ts = this._st(E.kaart);
      if (!ts || ts === "unavailable" || ts === "unknown") {
        this._el.kaartvers.textContent = "";
        return;
      }
      this._el.kaartvers.textContent = "Kaart van " + hhmm(ts);
      if (ts === this._mapTs) return;
      this._mapTs = ts;
      var self = this;
      this._hass.connection.sendMessagePromise({ type: "auth/sign_path", path: "/api/image_proxy/" + E.kaart })
        .then(function (res) {
          var pre = new Image();
          pre.onload = function () {
            self._el.kaartimg.src = pre.src;
            self._el.kaartimg.style.display = "block";
            self._el.mapleeg.style.display = "none";
          };
          pre.onerror = function () { /* oude kaart of leegtekst blijft staan */ };
          pre.src = res.path;
        }).catch(function () { /* kaart komt later */ });
    }
    disconnectedCallback() {
      if (this._ro) this._ro.disconnect();
      if (this._clockTimer) clearInterval(this._clockTimer);
      if (this._mapTimer) clearInterval(this._mapTimer);
      if (this._onResize) window.removeEventListener("resize", this._onResize);
    }
  }

  if (!customElements.get("stofzuigerbord-card")) customElements.define("stofzuigerbord-card", StofzuigerbordCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "stofzuigerbord-card", name: "Stofzuigerbord", preview: false,
    description: "Stofzuigerpagina (James) in de stijl van de bordenfamilie." });
})();
