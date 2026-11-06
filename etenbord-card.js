/*
  Etenbord v1.0.1 - covers komen nu uit HA zelf (/local/mealie-covers/<id>.webp,
  door Henk gesynct uit Mealie), met de directe Mealie-URL als terugval.
  Reden: rechtstreeks naar Mealie linken brak op apparaten die het bord over
  https openen (gemengde inhoud) en is op elk apparaat een extra faalpad.
  Nieuwe recepten hebben pas een cover als de sync opnieuw draait.
  Etenbord v1.0 - receptenboek op basis van Mealie (officiele HA-integratie).
  Bovenin "Vanavond" uit de Mealie-weekplanner (met "Verras me" als er niets
  gepland staat), daaronder de weekstrip zodra er iets gepland is, en het
  boek zelf: alle recepten als covertegels met zoeken. Tik op een tegel
  opent het recept met ingredienten en stappen (kookweergave).
  Data via mealie.get_recipes / get_recipe / get_mealplan (return_response),
  covers rechtstreeks van Mealie: /api/media/recipes/<id>/images/...
*/
(function () {
  "use strict";

  var FONT_ID = "etenbord-fonts";
  if (!document.getElementById(FONT_ID)) {
    var st = document.createElement("style");
    st.id = FONT_ID;
    st.textContent =
      "@font-face{font-family:'EBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-400-normal.woff2') format('woff2');font-weight:400}" +
      "@font-face{font-family:'EBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-500-normal.woff2') format('woff2');font-weight:500}" +
      "@font-face{font-family:'EBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-600-normal.woff2') format('woff2');font-weight:600}" +
      "@font-face{font-family:'EBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-700-normal.woff2') format('woff2');font-weight:700}" +
      "@font-face{font-family:'EBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-800-normal.woff2') format('woff2');font-weight:800}";
    document.head.appendChild(st);
  }

  var GOUD = "#dfa03c";
  var CSS = `
  :host{ display:block; position:fixed; inset:0; width:100%; height:100%; }
  *{ margin:0; padding:0; box-sizing:border-box; }
  .stage{ position:absolute; inset:0; overflow-y:auto; overflow-x:hidden; background:#0a0b0d; color:#f2f0eb;
    font-family:'EBInter',system-ui,sans-serif; padding:34px 44px 120px 44px; overscroll-behavior:none; }
  .kop{ display:flex; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:26px; }
  .kop h1{ font-size:44px; font-weight:800; letter-spacing:-0.5px; }
  .kop .sub{ font-size:19px; color:#a7a49c; margin-top:4px; }
  .zoek{ flex:0 0 340px; }
  .zoek input{ width:100%; font-size:20px; font-family:inherit; color:#f2f0eb; background:#17181c;
    border:1px solid #2b2d33; border-radius:999px; padding:13px 22px; outline:none; }
  .zoek input:focus{ border-color:${GOUD}; }
  .sectietitel{ font-size:24px; font-weight:700; margin:26px 0 14px 0; }
  .hero{ display:flex; gap:28px; background:#141519; border:1px solid #23252b; border-radius:24px;
    padding:22px; align-items:center; }
  .hero img{ width:300px; height:210px; object-fit:cover; border-radius:16px; background:#1d1e24; flex:0 0 auto; }
  .hero .hnaam{ font-size:34px; font-weight:750; line-height:1.15; }
  .hero .hmeta{ font-size:19px; color:#a7a49c; margin-top:8px; }
  .knop{ display:inline-block; margin-top:18px; font-size:20px; font-weight:650; color:#141414;
    background:${GOUD}; border:none; border-radius:999px; padding:12px 28px; cursor:pointer; font-family:inherit; }
  .knop.zacht{ background:#23252b; color:#f2f0eb; margin-left:10px; }
  .week{ display:flex; gap:12px; flex-wrap:wrap; }
  .dag{ background:#141519; border:1px solid #23252b; border-radius:16px; padding:12px 16px; min-width:170px; flex:1; }
  .dag .dnaam{ font-size:15px; color:#a7a49c; }
  .dag .dnaam::first-letter{ text-transform:uppercase; }
  .dag .dgerecht{ font-size:19px; font-weight:600; margin-top:3px; }
  .boek{ display:grid; grid-template-columns:repeat(auto-fill,minmax(225px,1fr)); gap:20px; }
  .tegel{ background:#141519; border:1px solid #23252b; border-radius:20px; overflow:hidden; cursor:pointer; }
  .tegel:active{ transform:scale(0.985); }
  .tegel .cov{ height:150px; background:#1d1e24; position:relative; }
  .tegel .cov img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
  .tegel .cov .letter{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    font-size:64px; font-weight:800; color:#3a3b42; }
  .tegel .tnaam{ font-size:20px; font-weight:650; line-height:1.25; padding:13px 15px 4px 15px; }
  .tegel .tmeta{ font-size:16px; color:#a7a49c; padding:0 15px 14px 15px; }
  .melding{ font-size:21px; color:#a7a49c; padding:26px 4px; }
  .detail{ position:absolute; inset:0; background:#0a0b0d; z-index:6; overflow-y:auto; overscroll-behavior:none;
    padding:30px 44px 60px 44px; display:none; color:#f2f0eb; font-family:'EBInter',system-ui,sans-serif; }
  .detail.open{ display:block; }
  .detail .dtop{ display:flex; gap:30px; align-items:flex-start; }
  .detail img.dcov{ width:380px; height:270px; object-fit:cover; border-radius:20px; background:#1d1e24; flex:0 0 auto; }
  .detail h2{ font-size:40px; font-weight:800; line-height:1.12; }
  .detail .ddesc{ font-size:20px; color:#c9c6bf; margin-top:12px; line-height:1.45; max-width:900px; }
  .chips{ display:flex; gap:10px; flex-wrap:wrap; margin-top:16px; }
  .chip{ font-size:17px; color:#f2f0eb; background:#1d1e24; border:1px solid #2b2d33; border-radius:999px; padding:7px 16px; }
  .chip b{ color:${GOUD}; font-weight:700; }
  .sluit{ position:absolute; top:22px; right:30px; width:58px; height:58px; border-radius:50%; border:1px solid #2b2d33;
    background:#17181c; color:#f2f0eb; font-size:30px; cursor:pointer; line-height:1; }
  .dkolommen{ display:grid; grid-template-columns:minmax(300px,420px) 1fr; gap:44px; margin-top:34px; }
  .dkolommen h3{ font-size:24px; font-weight:700; margin-bottom:14px; }
  .ing{ font-size:20px; line-height:1.5; padding:9px 0; border-bottom:1px solid #1b1c21; color:#e8e5df; }
  .stap{ display:flex; gap:16px; padding:11px 0; border-bottom:1px solid #1b1c21; }
  .stap .nr{ flex:0 0 38px; height:38px; border-radius:50%; background:${GOUD}; color:#141414;
    font-size:19px; font-weight:750; display:flex; align-items:center; justify-content:center; }
  .stap .txt{ font-size:20px; line-height:1.5; color:#e8e5df; padding-top:6px; }
  .pnav{ position:absolute; left:50%; transform:translateX(-50%); bottom:26px; display:flex; gap:8px; z-index:8;
    background:rgba(16,17,20,0.92); padding:7px; border-radius:999px; border:1px solid #26272e;
    box-shadow:0 14px 34px rgba(0,0,0,0.5); }
  .pnav a{ font-size:20px; color:#d6d6d2; text-decoration:none; padding:10px 24px; border-radius:999px; white-space:nowrap; }
  .pnav a.active{ background:${GOUD}; color:#141414; font-weight:700; }
  `;

  var HTML = `
  <div class="stage" id="stage">
    <div class="kop">
      <div>
        <h1>Receptenboek</h1>
        <div class="sub" id="subtitel">Mealie</div>
      </div>
      <div class="zoek"><input id="zoekinput" type="text" placeholder="Zoek een recept..." autocomplete="off"></div>
    </div>
    <div id="herovlak"></div>
    <div id="weekvlak"></div>
    <div class="sectietitel">Alle recepten</div>
    <div class="boek" id="boek"></div>
    <div class="melding" id="melding">Recepten laden...</div>
  </div>
  <div class="detail" id="detail"></div>
  <nav class="pnav">
    <a href="/familie-bord">Home</a>
    <a href="/keuken-bord">Keuken</a>
    <a href="/muziek-dashboard">Muziek</a>
    <a href="/energie-bord">Energie</a>
    <a href="/auto-bord">Auto</a>
    <a href="/stofzuiger-bord">Stofzuiger</a>
    <a href="/babyfoon-bord">Babyfoon</a>
    <a href="/eten-bord" class="active">Eten</a>
  </nav>`;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function vandaagISO() {
    try {
      var delen = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
      var o = {};
      delen.forEach(function (d) { o[d.type] = d.value; });
      return o.year + "-" + o.month + "-" + o.day;
    } catch (e) {
      var d = new Date();
      function p(n) { return (n < 10 ? "0" : "") + n; }
      return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
    }
  }
  function plusDagen(iso, n) {
    var d = new Date(iso + "T12:00:00");
    d.setDate(d.getDate() + n);
    function p(x) { return (x < 10 ? "0" : "") + x; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function dagNaam(iso) {
    try {
      return new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long" }).format(new Date(iso + "T12:00:00"));
    } catch (e) { return iso; }
  }

  class EtenbordCard extends HTMLElement {
    setConfig(config) {
      this._config = Object.assign(
        { entry: "", mealie_url: "http://192.168.1.39:9000" },
        config || {}
      );
      if (!this._built) this._bouw();
    }
    _bouw() {
      this._built = true;
      var root = this.attachShadow({ mode: "open" });
      var style = document.createElement("style");
      style.textContent = CSS;
      var wrap = document.createElement("div");
      wrap.innerHTML = HTML;
      root.appendChild(style);
      root.appendChild(wrap);
      this._root = root;
      var self = this;
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
      root.getElementById("zoekinput").addEventListener("input", function (ev) {
        self._zoek = (ev.target.value || "").toLowerCase();
        self._tekenBoek();
      });
      this._recepten = [];
      this._plan = [];
      this._zoek = "";
      this._bezig = false;
    }
    set hass(hass) {
      this._hass = hass;
      if (!this._geladen && !this._bezig) this._laad();
    }
    getCardSize() { return 1; }
    _service(service, data) {
      var payload = {
        type: "call_service",
        domain: "mealie",
        service: service,
        service_data: Object.assign({ config_entry_id: this._config.entry }, data || {}),
        return_response: true
      };
      return this._hass.callWS(payload).then(function (r) {
        return (r && (r.response || r.service_response)) || {};
      });
    }
    _laad() {
      if (!this._hass || !this._config.entry) return;
      this._bezig = true;
      var self = this;
      var vandaag = vandaagISO();
      Promise.all([
        this._service("get_recipes", { result_limit: 100 }),
        this._service("get_mealplan", { start_date: vandaag, end_date: plusDagen(vandaag, 7) })
      ]).then(function (res) {
        var items = (res[0].recipes && res[0].recipes.items) || [];
        self._recepten = items;
        self._plan = res[1].mealplan || [];
        self._geladen = true;
        self._bezig = false;
        self._tekenAlles();
      }).catch(function () {
        self._bezig = false;
        var m = self._root.getElementById("melding");
        if (m) m.textContent = "Mealie is even niet bereikbaar. Tik op Eten in de balk om het opnieuw te proberen.";
      });
    }
    _img(recept) {
      if (!recept || !recept.recipe_id || !recept.image) return "";
      return "/local/mealie-covers/" + recept.recipe_id + ".webp";
    }
    _directImg(recept) {
      if (!recept || !recept.recipe_id || !recept.image) return "";
      return this._config.mealie_url + "/api/media/recipes/" + recept.recipe_id + "/images/min-original.webp";
    }
    _koppelFallback(imgEl, recept) {
      if (!imgEl) return;
      var direct = this._directImg(recept);
      imgEl.addEventListener("error", function () {
        if (direct && imgEl.src.indexOf("/api/media/") < 0) { imgEl.src = direct; return; }
        imgEl.style.display = "none";
      });
    }
    _planVoor(iso) {
      var eerste = null;
      var diner = null;
      (this._plan || []).forEach(function (p) {
        if ((p.date || "").slice(0, 10) !== iso) return;
        if (!eerste) eerste = p;
        var type = String(p.entry_type || p.entryType || "").toLowerCase();
        if (type === "dinner") diner = p;
      });
      return diner || eerste;
    }
    _planRecept(planItem) {
      if (!planItem) return null;
      var r = planItem.recipe || null;
      var rid = (r && (r.recipe_id || r.id)) || planItem.recipe_id || null;
      var naam = (r && r.name) || planItem.title || planItem.note_title || "";
      var match = null;
      if (rid) {
        this._recepten.forEach(function (x) { if (x.recipe_id === rid) match = x; });
      }
      if (match) return match;
      if (rid || naam) return { recipe_id: rid, name: naam, image: r ? r.image : null };
      return null;
    }
    _tekenAlles() {
      var sub = this._root.getElementById("subtitel");
      if (sub) sub.textContent = this._recepten.length + " recepten in Mealie";
      this._tekenHero();
      this._tekenWeek();
      this._tekenBoek();
    }
    _tekenHero() {
      var vlak = this._root.getElementById("herovlak");
      var vandaag = vandaagISO();
      var plan = this._planRecept(this._planVoor(vandaag));
      var self = this;
      if (plan) {
        var img = this._img(plan);
        vlak.innerHTML =
          '<div class="sectietitel">Vanavond</div><div class="hero">' +
          (img ? '<img src="' + esc(img) + '" alt="">' : "") +
          '<div><div class="hnaam">' + esc(plan.name) + '</div>' +
          '<div class="hmeta">' + esc(dagNaam(vandaag)) + '</div>' +
          '<button class="knop" id="heroopen">Bekijk recept</button></div></div>';
        this._koppelFallback(vlak.querySelector(".hero img"), plan);
        vlak.querySelector("#heroopen").addEventListener("click", function () { self._openRecept(plan); });
      } else {
        vlak.innerHTML =
          '<div class="sectietitel">Vanavond</div><div class="hero">' +
          '<div><div class="hnaam">Niets gepland</div>' +
          '<div class="hmeta">Zet een gerecht in de weekplanner van Mealie, of laat je verrassen uit het boek.</div>' +
          '<button class="knop" id="verras">Verras me</button></div></div>';
        vlak.querySelector("#verras").addEventListener("click", function () {
          if (!self._recepten.length) return;
          var willekeurig = self._recepten[Math.floor(Math.random() * self._recepten.length)];
          self._openRecept(willekeurig);
        });
      }
    }
    _tekenWeek() {
      var vlak = this._root.getElementById("weekvlak");
      var vandaag = vandaagISO();
      var html = "";
      var heeft = false;
      for (var i = 1; i <= 6; i++) {
        var iso = plusDagen(vandaag, i);
        var rec = this._planRecept(this._planVoor(iso));
        if (rec) {
          heeft = true;
          html += '<div class="dag" data-id="' + esc(rec.recipe_id || "") + '"><div class="dnaam">' + esc(dagNaam(iso)) + '</div>' +
            '<div class="dgerecht">' + esc(rec.name) + '</div></div>';
        }
      }
      vlak.innerHTML = heeft ? '<div class="sectietitel">Deze week</div><div class="week">' + html + '</div>' : "";
      if (heeft) {
        var self = this;
        Array.prototype.forEach.call(vlak.querySelectorAll(".dag"), function (el) {
          el.addEventListener("click", function () {
            var id = el.getAttribute("data-id");
            var rec2 = null;
            self._recepten.forEach(function (x) { if (x.recipe_id === id) rec2 = x; });
            if (rec2) self._openRecept(rec2);
          });
        });
      }
    }
    _tekenBoek() {
      var boek = this._root.getElementById("boek");
      var melding = this._root.getElementById("melding");
      var zoek = this._zoek;
      var lijst = this._recepten.filter(function (r) {
        return !zoek || (r.name || "").toLowerCase().indexOf(zoek) >= 0;
      });
      var self = this;
      boek.innerHTML = lijst.map(function (r) {
        var img = self._img(r);
        var meta = [];
        if (r.total_time) meta.push(r.total_time);
        if (r.recipe_servings) meta.push(r.recipe_servings + " pers.");
        return '<div class="tegel" data-id="' + esc(r.recipe_id) + '"><div class="cov">' +
          '<div class="letter">' + esc((r.name || "?").charAt(0)) + '</div>' +
          (img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : '') +
          '</div><div class="tnaam">' + esc(r.name) + '</div>' +
          '<div class="tmeta">' + esc(meta.join(" · ") || " ") + '</div></div>';
      }).join("");
      Array.prototype.forEach.call(boek.querySelectorAll(".tegel"), function (t) {
        var tid = t.getAttribute("data-id");
        var trec = null;
        self._recepten.forEach(function (x) { if (x.recipe_id === tid) trec = x; });
        if (trec) self._koppelFallback(t.querySelector("img"), trec);
      });
      melding.textContent = this._recepten.length
        ? (lijst.length ? "" : "Geen recept gevonden voor je zoekopdracht.")
        : "Nog geen recepten gevonden.";
      Array.prototype.forEach.call(boek.querySelectorAll(".tegel"), function (t) {
        t.addEventListener("click", function () {
          var id = t.getAttribute("data-id");
          var rec = null;
          self._recepten.forEach(function (x) { if (x.recipe_id === id) rec = x; });
          if (rec) self._openRecept(rec);
        });
      });
    }
    _openRecept(recept) {
      var detail = this._root.getElementById("detail");
      var self = this;
      detail.classList.add("open");
      detail.scrollTop = 0;
      detail.innerHTML = '<button class="sluit" id="dsluit">×</button><div class="melding">Recept laden...</div>';
      detail.querySelector("#dsluit").addEventListener("click", function () { detail.classList.remove("open"); });
      this._service("get_recipe", { recipe_id: recept.recipe_id }).then(function (res) {
        var r = res.recipe || recept;
        self._tekenDetail(r);
      }).catch(function () {
        self._tekenDetail(recept);
      });
    }
    _tekenDetail(r) {
      var detail = this._root.getElementById("detail");
      var img = this._img(r);
      var chips = "";
      if (r.prep_time) chips += '<span class="chip">Voorbereiding <b>' + esc(r.prep_time) + '</b></span>';
      if (r.perform_time || r.total_time) chips += '<span class="chip">Tijd <b>' + esc(r.perform_time || r.total_time) + '</b></span>';
      if (r.recipe_servings) chips += '<span class="chip">Voor <b>' + esc(r.recipe_servings) + ' personen</b></span>';
      var ings = (r.ingredients || []).map(function (ing) {
        var tekst = ing.display || ing.note || ((ing.food && ing.food.name) || "");
        return '<div class="ing">' + esc(tekst) + '</div>';
      }).join("");
      var stappen = (r.instructions || []).map(function (s, i) {
        return '<div class="stap"><div class="nr">' + (i + 1) + '</div><div class="txt">' + esc(s.text || "") + '</div></div>';
      }).join("");
      detail.innerHTML =
        '<button class="sluit" id="dsluit">×</button>' +
        '<div class="dtop">' + (img ? '<img class="dcov" src="' + esc(img) + '" alt="">' : "") +
        '<div><h2>' + esc(r.name) + '</h2>' +
        (r.description ? '<div class="ddesc">' + esc(r.description) + '</div>' : "") +
        '<div class="chips">' + chips + '</div></div></div>' +
        '<div class="dkolommen"><div><h3>Ingrediënten</h3>' + (ings || '<div class="melding">Geen ingrediënten.</div>') + '</div>' +
        '<div><h3>Bereiding</h3>' + (stappen || '<div class="melding">Geen stappen.</div>') + '</div></div>';
      this._koppelFallback(detail.querySelector("img.dcov"), r);
      detail.querySelector("#dsluit").addEventListener("click", function () { detail.classList.remove("open"); });
      detail.scrollTop = 0;
    }
  }

  customElements.define("etenbord-card", EtenbordCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "etenbord-card", name: "Etenbord", description: "Receptenboek uit Mealie met weekplanner" });
})();
