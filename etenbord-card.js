/*
  Etenbord v1.1 - ontworpen tegels voor alles (besluit Alex, 6 nov 2026):
  geen foto's meer op het bord, maar rustige boekomslagen met de categorie
  erboven en een kleur per categorie (uit Mealie, daar nu overal gevuld).
  Detailweergave: leesbaarder tekst (groter, zwaarder, meer regelafstand),
  lange beschrijving ingeklapt met "Lees meer", en een personen-scaler die
  de ingredienthoeveelheden herberekent uit hoeveelheid + eenheid + product.
  v1.0.1: covers via /local (vervallen in v1.1, geen foto's meer).
  v1.0: receptenboek uit Mealie via de officiele HA-integratie
  (mealie.get_recipes / get_recipe / get_mealplan met return_response).
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
  var CATKLEUR = {
    "Ontbijt": "#232d26",
    "Brood": "#2e2417",
    "Zoet": "#2b2130",
    "Hoofdgerecht": "#1f2a33",
    "Bijgerechten": "#2a2d20"
  };
  var PALET = ["#263238", "#33261d", "#252b3a", "#2e2233", "#1f3038", "#332b1d"];
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
  .cat{ font-size:13.5px; font-weight:700; letter-spacing:2.2px; text-transform:uppercase; color:#f2f0eb; opacity:.72; }
  .lijn{ width:34px; height:3px; border-radius:2px; background:${GOUD}; margin:10px 0 12px 0; }
  .hero{ border-radius:24px; padding:28px 30px; border:1px solid rgba(255,255,255,0.07); }
  .hero .hnaam{ font-size:38px; font-weight:800; line-height:1.14; max-width:1150px; }
  .hero .hmeta{ font-size:19px; color:#f2f0eb; opacity:.66; margin-top:9px; }
  .knop{ display:inline-block; margin-top:20px; font-size:20px; font-weight:650; color:#141414;
    background:${GOUD}; border:none; border-radius:999px; padding:12px 28px; cursor:pointer; font-family:inherit; }
  .week{ display:flex; gap:12px; flex-wrap:wrap; }
  .dag{ border-radius:16px; padding:14px 18px; min-width:190px; flex:1; border:1px solid rgba(255,255,255,0.07); cursor:pointer; }
  .dag .dnaam{ font-size:15px; color:#f2f0eb; opacity:.62; }
  .dag .dnaam::first-letter{ text-transform:uppercase; }
  .dag .dgerecht{ font-size:20px; font-weight:650; margin-top:4px; line-height:1.25; }
  .boek{ display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:20px; }
  .tegel{ border-radius:20px; padding:20px 22px; height:208px; display:flex; flex-direction:column;
    border:1px solid rgba(255,255,255,0.07); cursor:pointer; }
  .tegel:active{ transform:scale(0.985); }
  .tegel .tnaam{ font-size:24px; font-weight:750; line-height:1.24; display:-webkit-box; -webkit-line-clamp:3;
    -webkit-box-orient:vertical; overflow:hidden; }
  .tegel .tmeta{ margin-top:auto; font-size:16.5px; color:#f2f0eb; opacity:.62; }
  .melding{ font-size:21px; color:#a7a49c; padding:26px 4px; }
  .detail{ position:absolute; inset:0; background:#0a0b0d; z-index:6; overflow-y:auto; overscroll-behavior:none;
    padding:30px 44px 60px 44px; display:none; color:#f5f2ea; font-family:'EBInter',system-ui,sans-serif; }
  .detail.open{ display:block; }
  .detail .dtop{ display:flex; gap:30px; align-items:flex-start; }
  .dblok{ width:300px; height:216px; border-radius:20px; flex:0 0 auto; padding:22px 24px;
    border:1px solid rgba(255,255,255,0.07); }
  .detail h2{ font-size:40px; font-weight:800; line-height:1.12; }
  .detail .ddesc{ font-size:20.5px; color:#ddd9d0; margin-top:12px; line-height:1.55; max-width:980px; font-weight:450; }
  .detail .ddesc.dicht{ max-height:4.65em; overflow:hidden; }
  .meerknop{ margin-top:8px; font-size:18px; font-weight:600; color:${GOUD}; background:none; border:none;
    cursor:pointer; font-family:inherit; padding:4px 0; }
  .chips{ display:flex; gap:10px; flex-wrap:wrap; margin-top:16px; align-items:center; }
  .chip{ font-size:17.5px; color:#f2f0eb; background:#1d1e24; border:1px solid #2b2d33; border-radius:999px; padding:8px 17px; }
  .chip b{ color:${GOUD}; font-weight:700; }
  .scaler{ display:inline-flex; align-items:center; gap:14px; background:#1d1e24; border:1px solid #2b2d33;
    border-radius:999px; padding:6px 8px; }
  .scaler button{ width:46px; height:46px; border-radius:50%; border:none; background:${GOUD}; color:#141414;
    font-size:27px; font-weight:800; cursor:pointer; line-height:1; font-family:inherit; }
  .scaler .swaarde{ font-size:18.5px; color:#f2f0eb; min-width:168px; text-align:center; }
  .scaler .swaarde b{ color:${GOUD}; font-weight:750; }
  .sluit{ position:absolute; top:22px; right:30px; width:58px; height:58px; border-radius:50%; border:1px solid #2b2d33;
    background:#17181c; color:#f2f0eb; font-size:30px; cursor:pointer; line-height:1; z-index:2; }
  .dkolommen{ display:grid; grid-template-columns:minmax(320px,450px) 1fr; gap:48px; margin-top:36px; }
  .dkolommen h3{ font-size:26px; font-weight:750; margin-bottom:14px; }
  .ing{ font-size:21.5px; font-weight:500; line-height:1.55; padding:10px 0; border-bottom:1px solid #1b1c21; color:#f5f2ea; }
  .ingtitel{ font-size:19px; font-weight:750; color:${GOUD}; padding:16px 0 4px 0; }
  .stap{ display:flex; gap:16px; padding:12px 0; border-bottom:1px solid #1b1c21; }
  .stap .nr{ flex:0 0 40px; height:40px; border-radius:50%; background:${GOUD}; color:#141414;
    font-size:20px; font-weight:750; display:flex; align-items:center; justify-content:center; }
  .stap .txt{ font-size:21.5px; font-weight:500; line-height:1.6; color:#f5f2ea; padding-top:6px; }
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
  function woordVoor(woord, aantal) {
    if (woord === "personen" && aantal === 1) return "persoon";
    return woord;
  }
  function fmtAantal(v) {
    var r = Math.round(v * 4) / 4;
    if (r === Math.floor(r)) return String(r);
    return String(r).replace(".", ",");
  }

  class EtenbordCard extends HTMLElement {
    setConfig(config) {
      this._config = Object.assign({ entry: "" }, config || {});
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
        self._recepten = (res[0].recipes && res[0].recipes.items) || [];
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
    _cat(recept) {
      var cats = (recept && recept.categories) || [];
      if (cats.length && cats[0].name) return cats[0].name;
      return "Recept";
    }
    _kleur(catNaam) {
      if (CATKLEUR[catNaam]) return CATKLEUR[catNaam];
      var som = 0;
      for (var i = 0; i < catNaam.length; i++) som += catNaam.charCodeAt(i);
      return PALET[som % PALET.length];
    }
    _basis(recept) {
      var s = parseFloat(recept.recipe_servings);
      if (s && s > 0) return { aantal: s, woord: "personen" };
      var yq = parseFloat(recept.recipe_yield_quantity);
      if (yq && yq > 0) return { aantal: yq, woord: recept.recipe_yield || "porties" };
      return { aantal: 1, woord: "personen" };
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
      if (rid) this._recepten.forEach(function (x) { if (x.recipe_id === rid) match = x; });
      if (match) return match;
      if (rid || naam) return { recipe_id: rid, name: naam, categories: r && r.categories };
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
        var cat = this._cat(plan);
        vlak.innerHTML =
          '<div class="sectietitel">Vanavond</div><div class="hero" style="background:' + this._kleur(cat) + '">' +
          '<div class="cat">' + esc(cat) + '</div><div class="lijn"></div>' +
          '<div class="hnaam">' + esc(plan.name) + '</div>' +
          '<div class="hmeta">' + esc(dagNaam(vandaag)) + '</div>' +
          '<button class="knop" id="heroopen">Bekijk recept</button></div>';
        vlak.querySelector("#heroopen").addEventListener("click", function () { self._openRecept(plan); });
      } else {
        vlak.innerHTML =
          '<div class="sectietitel">Vanavond</div><div class="hero" style="background:#17181c">' +
          '<div class="hnaam">Niets gepland</div>' +
          '<div class="hmeta">Zet een gerecht in de weekplanner van Mealie, of laat je verrassen uit het boek.</div>' +
          '<button class="knop" id="verras">Verras me</button></div>';
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
          var cat = this._cat(rec);
          html += '<div class="dag" data-id="' + esc(rec.recipe_id || "") + '" style="background:' + this._kleur(cat) + '">' +
            '<div class="dnaam">' + esc(dagNaam(iso)) + '</div>' +
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
        var cat = self._cat(r);
        var basis = self._basis(r);
        var meta = [];
        if (r.total_time) meta.push(r.total_time);
        meta.push(fmtAantal(basis.aantal) + " " + woordVoor(basis.woord, basis.aantal));
        return '<div class="tegel" data-id="' + esc(r.recipe_id) + '" style="background:' + self._kleur(cat) + '">' +
          '<div class="cat">' + esc(cat) + '</div><div class="lijn"></div>' +
          '<div class="tnaam">' + esc(r.name) + '</div>' +
          '<div class="tmeta">' + esc(meta.join(" · ")) + '</div></div>';
      }).join("");
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
        self._tekenDetail(res.recipe || recept);
      }).catch(function () {
        self._tekenDetail(recept);
      });
    }
    _ingredientTekst(ing, factor) {
      if (ing.title) return null;
      var q = parseFloat(ing.quantity);
      if (q && q > 0) {
        var delen = [fmtAantal(q * factor)];
        if (ing.unit && ing.unit.name) delen.push(ing.unit.name);
        if (ing.food && ing.food.name) delen.push(ing.food.name);
        var tekst = delen.join(" ");
        if (ing.note) tekst += " " + ing.note;
        return tekst;
      }
      return ing.display || ing.note || ((ing.food && ing.food.name) || "");
    }
    _tekenIngredienten() {
      var vlak = this._root.getElementById("dingredienten");
      if (!vlak || !this._detail) return;
      var factor = this._detail.aantal / this._detail.basis;
      var self = this;
      var html = (this._detail.recept.ingredients || []).map(function (ing) {
        if (ing.title) return '<div class="ingtitel">' + esc(ing.title) + '</div>';
        return '<div class="ing">' + esc(self._ingredientTekst(ing, factor)) + '</div>';
      }).join("");
      vlak.innerHTML = html || '<div class="melding">Geen ingrediënten.</div>';
      var waarde = this._root.getElementById("swaarde");
      if (waarde) waarde.innerHTML = 'Voor <b>' + fmtAantal(this._detail.aantal) + '</b> ' + esc(woordVoor(this._detail.woord, this._detail.aantal));
    }
    _tekenDetail(r) {
      var detail = this._root.getElementById("detail");
      var cat = this._cat(r);
      var basis = this._basis(r);
      this._detail = { recept: r, basis: basis.aantal, aantal: basis.aantal, woord: basis.woord };
      var chips = "";
      if (r.prep_time) chips += '<span class="chip">Voorbereiding <b>' + esc(r.prep_time) + '</b></span>';
      if (r.perform_time || r.total_time) chips += '<span class="chip">Tijd <b>' + esc(r.perform_time || r.total_time) + '</b></span>';
      chips += '<span class="scaler"><button id="smin" aria-label="minder">−</button>' +
        '<span class="swaarde" id="swaarde"></span>' +
        '<button id="splus" aria-label="meer">+</button></span>';
      var stappen = (r.instructions || []).map(function (s, i) {
        return '<div class="stap"><div class="nr">' + (i + 1) + '</div><div class="txt">' + esc(s.text || "") + '</div></div>';
      }).join("");
      detail.innerHTML =
        '<button class="sluit" id="dsluit">×</button>' +
        '<div class="dtop"><div class="dblok" style="background:' + this._kleur(cat) + '">' +
        '<div class="cat">' + esc(cat) + '</div><div class="lijn"></div></div>' +
        '<div><h2>' + esc(r.name) + '</h2>' +
        (r.description ? '<div class="ddesc dicht" id="ddesc">' + esc(r.description) + '</div><button class="meerknop" id="meerknop">Lees meer</button>' : "") +
        '<div class="chips">' + chips + '</div></div></div>' +
        '<div class="dkolommen"><div><h3>Ingrediënten</h3><div id="dingredienten"></div></div>' +
        '<div><h3>Bereiding</h3>' + (stappen || '<div class="melding">Geen stappen.</div>') + '</div></div>';
      var self = this;
      detail.querySelector("#dsluit").addEventListener("click", function () { detail.classList.remove("open"); });
      var meer = detail.querySelector("#meerknop");
      if (meer) {
        meer.addEventListener("click", function () {
          var d = detail.querySelector("#ddesc");
          var dicht = d.classList.toggle("dicht");
          meer.textContent = dicht ? "Lees meer" : "Lees minder";
        });
      }
      detail.querySelector("#smin").addEventListener("click", function () {
        if (self._detail.aantal > 1) { self._detail.aantal -= 1; self._tekenIngredienten(); }
      });
      detail.querySelector("#splus").addEventListener("click", function () {
        var max = Math.max(40, self._detail.basis * 3);
        if (self._detail.aantal < max) { self._detail.aantal += 1; self._tekenIngredienten(); }
      });
      this._tekenIngredienten();
      detail.scrollTop = 0;
    }
  }

  customElements.define("etenbord-card", EtenbordCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "etenbord-card", name: "Etenbord", description: "Receptenboek uit Mealie met weekplanner" });
})();
