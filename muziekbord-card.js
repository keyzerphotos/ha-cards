/* Muziekbord v1.0 (3 nov 2026) — maakt het muziekdashboard af tot een echt
   Lenovo-bord in dezelfde familie als familie/keuken/energie/auto/
   stofzuiger/babyfoon: panel-canvas 1920x1200, kiosk, gedeelde nav-balk.
   Inhoud en stijl erven van het oude sections-dashboard (23 okt 2026,
   Alex' keuze): alles op de JBL Bar 800, JBL-oranje (#FF4611), zendernamen
   vet in hoofdletters, dezelfde vijf zenders met dezelfde stream-URL's
   (Efteling Kids Radio als eerste). Nieuw: echte Nu-speelt-kaart met
   artwork en transport, volumeschuif met percentage, actieve zender
   gemarkeerd, klok. Alleen herrenderen als de spelerdata echt verandert. */
(function () {
  "use strict";

  var FONT_ID = "muziekbord-fonts";
  if (!document.getElementById(FONT_ID)) {
    var st = document.createElement("style");
    st.id = FONT_ID;
    st.textContent =
      "@font-face{font-family:'MBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-300-normal.woff2') format('woff2');font-weight:300}" +
      "@font-face{font-family:'MBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-400-normal.woff2') format('woff2');font-weight:400}" +
      "@font-face{font-family:'MBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-500-normal.woff2') format('woff2');font-weight:500}" +
      "@font-face{font-family:'MBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-600-normal.woff2') format('woff2');font-weight:600}" +
      "@font-face{font-family:'MBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-700-normal.woff2') format('woff2');font-weight:700}" +
      "@font-face{font-family:'MBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-800-normal.woff2') format('woff2');font-weight:800}";
    document.head.appendChild(st);
  }

  var ORANJE = "#FF4611";
  var CSS = `
  :host{ display:block; position:fixed; inset:0; width:100%; height:100%; }
  *{ margin:0; padding:0; box-sizing:border-box; }
  .stage{
    position:relative; width:1920px; height:1200px; transform-origin: top left;
    font-family:'MBInter','Inter','Segoe UI',Roboto,Arial,sans-serif;
    background:
      radial-gradient(1100px 620px at 22% -8%, rgba(255,70,17,.13), rgba(255,70,17,0) 62%),
      radial-gradient(900px 700px at 95% 110%, rgba(255,70,17,.06), rgba(255,70,17,0) 60%),
      #08090b;
    color:#f4f4f2; overflow:hidden; -webkit-font-smoothing:antialiased;
  }
  .kop{ position:absolute; left:44px; right:44px; top:36px; display:flex;
    justify-content:space-between; align-items:flex-start; }
  .titel{ font-size:46px; font-weight:700; color:#f4f4f2; }
  .ondertitel{ font-size:18px; color:#9a9a94; margin-top:4px; }
  .klok{ text-align:right; }
  .klok .tijd{ font-size:40px; font-weight:600; font-variant-numeric:tabular-nums; color:#f4f4f2; line-height:1.05; }
  .klok .datum{ font-size:15.5px; color:#9a9a94; margin-top:3px; text-transform:capitalize; }
  .inhoud{ position:absolute; left:44px; right:44px; top:138px; bottom:118px; display:flex; gap:26px; }
  .kaart{ background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.07);
    border-radius:26px; box-shadow:0 16px 36px rgba(0,0,0,.28); }
  .kaartkop{ font-size:15px; font-weight:600; letter-spacing:.18em; color:#9a9a94; text-transform:uppercase; }
  /* Nu speelt */
  .nukaart{ width:896px; flex:none; padding:30px 34px; display:flex; flex-direction:column; }
  .nuboven{ display:flex; gap:30px; margin-top:20px; }
  .art{ width:318px; height:318px; border-radius:22px; flex:none; overflow:hidden;
    background:linear-gradient(140deg, rgba(255,70,17,.5), rgba(255,70,17,.12));
    display:flex; align-items:center; justify-content:center; }
  .art img{ width:100%; height:100%; object-fit:cover; display:block; }
  .art .artletter{ font-size:64px; font-weight:800; letter-spacing:.04em; color:#ffffff; }
  .nuinfo{ flex:1; min-width:0; padding-top:8px; }
  .statuschip{ display:inline-flex; align-items:center; gap:9px; padding:8px 16px; border-radius:999px;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08);
    font-size:15.5px; font-weight:600; color:#d6d6d2; }
  .statuschip .cdot{ width:9px; height:9px; border-radius:50%; background:#5c5c58; }
  .statuschip.speelt{ color:#ffffff; border-color:rgba(255,70,17,.55); }
  .statuschip.speelt .cdot{ background:${ORANJE}; box-shadow:0 0 10px rgba(255,70,17,.9); }
  .nutitel{ font-size:36px; font-weight:700; line-height:1.16; margin-top:20px; color:#f4f4f2;
    display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  .nuonder{ font-size:20.5px; color:#9a9a94; margin-top:10px; line-height:1.35; }
  .transport{ display:flex; align-items:flex-start; justify-content:center; gap:44px; margin-top:44px; }
  .tknopblok{ display:flex; flex-direction:column; align-items:center; gap:10px; }
  .tknop{ border-radius:50%; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.10);
    display:flex; align-items:center; justify-content:center; cursor:pointer; user-select:none; color:#f4f4f2; }
  .tknop:active{ transform:scale(.93); }
  .tknop.klein{ width:86px; height:86px; font-size:30px; }
  .tknop.groot{ width:112px; height:112px; background:${ORANJE}; border-color:rgba(255,70,17,.8);
    box-shadow:0 10px 30px rgba(255,70,17,.35); }
  .tknop.groot:active{ transform:scale(.93); }
  .tknop.dicht{ opacity:.35; pointer-events:none; }
  .tlabel{ font-size:15px; color:#9a9a94; }
  .pauzebalken{ display:flex; gap:8px; }
  .pauzebalken i{ width:9px; height:34px; border-radius:3px; background:#ffffff; display:block; }
  .speeldriehoek{ width:0; height:0; border-left:30px solid #ffffff;
    border-top:19px solid transparent; border-bottom:19px solid transparent; margin-left:8px; }
  .vierkant{ width:26px; height:26px; border-radius:5px; background:#f4f4f2; }
  .volumeblok{ margin-top:auto; padding-top:36px; }
  .volumekop{ display:flex; justify-content:space-between; align-items:baseline; }
  .volumepct{ font-size:31px; font-weight:600; font-variant-numeric:tabular-nums; color:#f4f4f2; }
  .volumerij{ display:flex; align-items:center; gap:18px; margin-top:8px; }
  .volknop{ width:58px; height:58px; border-radius:50%; flex:none; background:rgba(255,255,255,.06);
    border:1px solid rgba(255,255,255,.10); color:#f4f4f2; font-size:28px;
    display:flex; align-items:center; justify-content:center; cursor:pointer; user-select:none; }
  .volknop:active{ transform:scale(.92); }
  .slider{ position:relative; flex:1; height:40px; touch-action:none; cursor:pointer; }
  .slider.dicht{ opacity:.35; pointer-events:none; }
  .strack{ position:absolute; left:0; right:0; top:50%; height:7px; transform:translateY(-50%);
    border-radius:99px; background:rgba(255,255,255,.10); }
  .sfill{ position:absolute; left:0; top:50%; height:7px; transform:translateY(-50%);
    border-radius:99px; background:linear-gradient(90deg,#ff7a4d,${ORANJE}); }
  .sknop{ position:absolute; top:50%; width:24px; height:24px; border-radius:50%;
    transform:translate(-50%,-50%); background:#ffffff; box-shadow:0 2px 8px rgba(0,0,0,.5); pointer-events:none; }
  .demp{ margin-top:16px; display:inline-flex; padding:11px 20px; border-radius:999px;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08);
    font-size:16px; color:#d6d6d2; cursor:pointer; user-select:none; }
  .demp.actief{ background:rgba(255,70,17,.18); border-color:rgba(255,70,17,.55); color:#ffffff; }
  /* Radio */
  .radiokaart{ flex:1; padding:30px 34px; display:flex; flex-direction:column; }
  .zenders{ display:flex; flex-direction:column; gap:14px; margin-top:20px; }
  .zender{ display:flex; align-items:center; gap:20px; padding:22px 24px; border-radius:20px;
    background:linear-gradient(135deg, rgba(255,70,17,.25), rgba(255,70,17,.08));
    border:1px solid rgba(255,70,17,.16); cursor:pointer; user-select:none; }
  .zender:active{ transform:scale(.985); }
  .zender.actief{ border-color:rgba(255,70,17,.75); box-shadow:0 0 0 1px rgba(255,70,17,.5), 0 8px 26px rgba(255,70,17,.22); }
  .zmonogram{ width:64px; height:64px; border-radius:16px; flex:none; background:rgba(0,0,0,.32);
    color:#ffb59d; font-size:19px; font-weight:800; letter-spacing:.02em;
    display:flex; align-items:center; justify-content:center; }
  .zender.actief .zmonogram{ color:#ffffff; background:${ORANJE}; }
  .ztekst{ flex:1; min-width:0; }
  .znaam{ font-size:24px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#f4f4f2; }
  .zonder{ font-size:16px; color:#c9a294; margin-top:3px; }
  .zspeelt{ font-size:15px; font-weight:700; color:#ffb59d; text-transform:uppercase; letter-spacing:.08em; }
  .radioot{ margin-top:auto; font-size:16px; color:#9a9a94; line-height:1.45; }
  /* Navigatiebalk, gelijk aan de andere borden */
  .pnav{ position:absolute; left:50%; transform:translateX(-50%); bottom:30px; display:flex; gap:8px; z-index:4;
    background:rgba(16,17,20,.72); border:1px solid rgba(255,255,255,.09); border-radius:999px; padding:7px; }
  .pnav a{ font-size:21px; color:#d6d6d2; text-decoration:none; padding:11px 30px; border-radius:999px;
    border:1px solid transparent; }
  .pnav a.active{ background:rgba(217,164,65,.14); color:#f4f4f2; border-color:rgba(217,164,65,.55); }
  `;

  var HTML = `
  <div class="stage" id="stage">
    <div class="kop">
      <div>
        <div class="titel">Muziek</div>
        <div class="ondertitel">JBL Bar 800 · woonkamer</div>
      </div>
      <div class="klok">
        <div class="tijd" id="ktijd">--:--</div>
        <div class="datum" id="kdatum"></div>
      </div>
    </div>
    <div class="inhoud">
      <section class="kaart nukaart">
        <div class="kaartkop">Nu speelt</div>
        <div class="nuboven">
          <div class="art" id="art"><span class="artletter">JBL</span></div>
          <div class="nuinfo">
            <span class="statuschip" id="statuschip"><span class="cdot"></span><span id="statustekst">Uit</span></span>
            <div class="nutitel" id="nutitel">JBL Bar 800</div>
            <div class="nuonder" id="nuonder"></div>
          </div>
        </div>
        <div class="transport">
          <div class="tknopblok">
            <div class="tknop klein" id="knopuit">⏻</div>
            <div class="tlabel" id="uitlabel">Uit</div>
          </div>
          <div class="tknopblok">
            <div class="tknop groot" id="knopspeel"><span class="speeldriehoek"></span></div>
            <div class="tlabel" id="speellabel">Speel</div>
          </div>
          <div class="tknopblok">
            <div class="tknop klein" id="knopstop"><span class="vierkant"></span></div>
            <div class="tlabel">Stop</div>
          </div>
        </div>
        <div class="volumeblok">
          <div class="volumekop">
            <div class="kaartkop">Volume</div>
            <div class="volumepct" id="volumepct">--</div>
          </div>
          <div class="volumerij">
            <div class="volknop" id="volmin">−</div>
            <div class="slider" id="volslider">
              <div class="strack"></div>
              <div class="sfill" id="volfill"></div>
              <div class="sknop" id="volknop"></div>
            </div>
            <div class="volknop" id="volplus">+</div>
          </div>
          <div class="demp" id="demp">Dempen</div>
        </div>
      </section>
      <section class="kaart radiokaart">
        <div class="kaartkop">Radio</div>
        <div class="zenders" id="zenders"></div>
        <div class="radioot">Alles speelt af op de JBL Bar 800. Tik een zender aan en hij start meteen.</div>
      </section>
    </div>
    <nav class="pnav">
      <a href="/familie-bord">Home</a>
      <a href="/keuken-bord">Keuken</a>
      <a href="/muziek-dashboard" class="active">Muziek</a>
      <a href="/energie-bord">Energie</a>
      <a href="/auto-bord">Auto</a>
      <a href="/stofzuiger-bord">Stofzuiger</a>
      <a href="/babyfoon-bord">Babyfoon</a>
    </nav>
  </div>`;

  var SPELER = "media_player.jbl_bar_800";
  // Dezelfde vijf zenders en stream-URL's als het oude dashboard; Efteling eerst.
  var ZENDERS = [
    { naam: "Efteling Kids Radio", kort: "EK", url: "http://25243.live.streamtheworld.com:3690/TLPSTR07_SC" },
    { naam: "NPO Radio 2", kort: "R2", url: "https://icecast.omroep.nl/radio2-bb-mp3" },
    { naam: "NPO 3FM", kort: "3FM", url: "https://icecast.omroep.nl/3fm-bb-mp3" },
    { naam: "Radio 538", kort: "538", url: "https://21223.live.streamtheworld.com/RADIO538.mp3" },
    { naam: "NPO Radio 1", kort: "R1", url: "https://icecast.omroep.nl/radio1-bb-mp3" }
  ];

  class MuziekBordCard extends HTMLElement {
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
          if (!href || window.location.pathname === href) { ev.preventDefault(); return; }
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
      ["stage","ktijd","kdatum","art","statuschip","statustekst","nutitel","nuonder",
       "knopuit","uitlabel","knopspeel","speellabel","knopstop",
       "volumepct","volslider","volfill","volknop","volmin","volplus","demp","zenders"]
        .forEach(function (id) { self._el[id] = root.getElementById(id); });
      this._el.zenders.innerHTML = ZENDERS.map(function (z, i) {
        return '<div class="zender" data-zender="' + i + '">' +
          '<div class="zmonogram">' + z.kort + '</div>' +
          '<div class="ztekst"><div class="znaam">' + z.naam + '</div>' +
          '<div class="zonder">Live radio</div></div>' +
          '<div class="zspeelt" data-zspeelt="' + i + '" style="display:none">Speelt nu</div></div>';
      }).join("");
      Array.prototype.forEach.call(this._el.zenders.querySelectorAll("[data-zender]"), function (tile) {
        tile.addEventListener("click", function () {
          var z = ZENDERS[parseInt(tile.getAttribute("data-zender"), 10)];
          self._call("media_player", "play_media",
            { media_content_id: z.url, media_content_type: "music" }, { entity_id: SPELER });
        });
      });
      this._el.knopuit.addEventListener("click", function () { self._power(); });
      this._el.knopspeel.addEventListener("click", function () { self._speelPauze(); });
      this._el.knopstop.addEventListener("click", function () {
        self._call("media_player", "media_stop", {}, { entity_id: SPELER });
      });
      this._el.volmin.addEventListener("click", function () {
        self._call("media_player", "volume_down", {}, { entity_id: SPELER });
      });
      this._el.volplus.addEventListener("click", function () {
        self._call("media_player", "volume_up", {}, { entity_id: SPELER });
      });
      this._el.demp.addEventListener("click", function () {
        var s = self._sp();
        var muted = s && s.attributes.is_volume_muted === true;
        self._call("media_player", "volume_mute", { is_volume_muted: !muted }, { entity_id: SPELER });
      });
      this._bindVolume();
      this._ro = new ResizeObserver(function () { self._fit(); });
      this._ro.observe(this);
      this._onResize = function () { self._fit(); };
      window.addEventListener("resize", this._onResize);
      this._klokTimer = setInterval(function () { self._tickClock(); }, 20000);
      this._tickClock();
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
      if (!this._el || !this._el.ktijd) return;
      var d = new Date();
      var p = function (n) { return (n < 10 ? "0" : "") + n; };
      this._el.ktijd.textContent = p(d.getHours()) + ":" + p(d.getMinutes());
      try {
        this._el.kdatum.textContent = d.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
      } catch (e) { this._el.kdatum.textContent = ""; }
    }
    _sp() { return this._hass && this._hass.states ? this._hass.states[SPELER] : undefined; }
    set hass(hass) {
      this._hass = hass;
      if (!this._built) return;
      var s = this._sp();
      var a = s ? s.attributes : {};
      var d = new Date();
      var sig = [s ? s.state : "weg", a.media_title, a.media_artist, a.media_content_id,
        a.volume_level, a.is_volume_muted, a.entity_picture, a.app_name,
        "min:" + (d.getHours() * 60 + d.getMinutes())].join("|");
      if (sig !== this._sig) { this._sig = sig; this._update(); }
    }
    _call(domain, service, data, target) {
      if (!this._hass) return;
      var p;
      try { p = this._hass.callService(domain, service, data, target); } catch (e) { p = null; }
      if (p && p.catch) p.catch(function () {});
    }
    _power() {
      var s = this._sp();
      if (!s) return;
      if (s.state === "off") this._call("media_player", "turn_on", {}, { entity_id: SPELER });
      else this._call("media_player", "turn_off", {}, { entity_id: SPELER });
    }
    _speelPauze() {
      var s = this._sp();
      if (!s || s.state === "off") return;
      this._call("media_player", "media_play_pause", {}, { entity_id: SPELER });
    }
    _bindVolume() {
      var self = this, el = this._el.volslider, bezig = false;
      function fractie(ev) {
        var r = el.getBoundingClientRect();
        return Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      }
      function teken(f) {
        self._el.volfill.style.width = (f * 100) + "%";
        self._el.volknop.style.left = (f * 100) + "%";
        self._el.volumepct.textContent = Math.round(f * 100) + "%";
      }
      el.addEventListener("pointerdown", function (ev) {
        ev.preventDefault();
        el.setPointerCapture(ev.pointerId);
        bezig = true;
        self._volSleep = fractie(ev);
        teken(self._volSleep);
      });
      el.addEventListener("pointermove", function (ev) {
        if (!bezig) return;
        self._volSleep = fractie(ev);
        teken(self._volSleep);
      });
      function klaar(commit) {
        if (!bezig) return;
        bezig = false;
        if (commit && self._volSleep != null) {
          self._call("media_player", "volume_set", { volume_level: Math.round(self._volSleep * 100) / 100 }, { entity_id: SPELER });
        }
        self._volSleep = null;
        self._update();
      }
      el.addEventListener("pointerup", function () { klaar(true); });
      el.addEventListener("pointercancel", function () { klaar(false); });
    }
    _update() {
      var el = this._el;
      var s = this._sp();
      var a = s ? s.attributes : {};
      var staat = s ? s.state : "unavailable";
      var uit = staat === "off" || staat === "unavailable";
      // status en teksten
      var chipTekst = staat === "playing" ? "Speelt" : staat === "paused" ? "Gepauzeerd" : staat === "idle" ? "Staat klaar" : staat === "buffering" ? "Laden" : "Uit";
      el.statustekst.textContent = chipTekst;
      el.statuschip.classList.toggle("speelt", staat === "playing");
      var zenderNu = null;
      if (a.media_content_id) {
        for (var i = 0; i < ZENDERS.length; i++) {
          if (ZENDERS[i].url === a.media_content_id) { zenderNu = ZENDERS[i]; break; }
        }
      }
      el.nutitel.textContent = uit ? "JBL Bar 800 staat uit"
        : a.media_title || (zenderNu ? zenderNu.naam : "JBL Bar 800");
      var onder = [];
      if (!uit) {
        if (a.media_artist) onder.push(a.media_artist);
        if (a.media_album_name) onder.push(a.media_album_name);
        if (!onder.length && zenderNu) onder.push("Live radio");
        if (a.app_name) onder.push(a.app_name);
        if (a.source && a.source !== "Cast") onder.push(a.source);
      }
      el.nuonder.textContent = onder.join(" · ");
      // artwork
      if (!uit && a.entity_picture) {
        el.art.innerHTML = '<img src="' + a.entity_picture + '" alt="">';
      } else {
        el.art.innerHTML = '<span class="artletter">' + (zenderNu ? zenderNu.kort : "JBL") + "</span>";
      }
      // transport
      el.uitlabel.textContent = staat === "off" ? "Aan" : "Uit";
      el.speellabel.textContent = staat === "playing" ? "Pauze" : "Speel";
      el.knopspeel.innerHTML = staat === "playing"
        ? '<span class="pauzebalken"><i></i><i></i></span>'
        : '<span class="speeldriehoek"></span>';
      el.knopspeel.classList.toggle("dicht", uit);
      el.knopstop.classList.toggle("dicht", uit);
      el.volslider.classList.toggle("dicht", uit);
      // volume
      if (this._volSleep == null) {
        var vol = typeof a.volume_level === "number" ? a.volume_level : null;
        el.volumepct.textContent = vol === null ? "--" : Math.round(vol * 100) + "%";
        el.volfill.style.width = vol === null ? "0%" : (vol * 100) + "%";
        el.volknop.style.left = vol === null ? "0%" : (vol * 100) + "%";
      }
      var muted = a.is_volume_muted === true;
      el.demp.textContent = muted ? "Geluid aanzetten" : "Dempen";
      el.demp.classList.toggle("actief", muted);
      // actieve zender markeren
      Array.prototype.forEach.call(el.zenders.querySelectorAll("[data-zender]"), function (tile) {
        var z = ZENDERS[parseInt(tile.getAttribute("data-zender"), 10)];
        var actief = !!zenderNu && z.url === zenderNu.url && (staat === "playing" || staat === "paused");
        tile.classList.toggle("actief", actief);
        var badge = tile.querySelector("[data-zspeelt]");
        if (badge) badge.style.display = actief ? "" : "none";
      });
    }
    disconnectedCallback() {
      if (this._ro) this._ro.disconnect();
      if (this._onResize) window.removeEventListener("resize", this._onResize);
      if (this._klokTimer) clearInterval(this._klokTimer);
    }
  }

  if (!customElements.get("muziekbord-card")) {
    customElements.define("muziekbord-card", MuziekBordCard);
    window.customCards = window.customCards || [];
    window.customCards.push({ type: "muziekbord-card", name: "Muziekbord", preview: false });
  }
})();
