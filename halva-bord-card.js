/* Halva-bord v2.0 — nabouw van het dashboard uit de Instagram-reel van
   @_code_and_chill_ (app "Halva"), Climate-pagina met echte huisgegevens.
   v2 (3 nov 2026, completeringsplan A t/m E na technische review):
   A) Kamersturing via de Tado-scriptroute (script.tado_zet_zone zet een
      zone die uit staat eerst aan, wacht 3 s en stuurt dan pas de
      temperatuur; steppers via script.tado_stap), één schaal 5-25 uit de
      Tado CE-entiteiten, Kantoor als offline rij, Schema hervatten via
      Tado CE zolang de kern-cloud unavailable is, fouten zichtbaar.
   B) Alleen elementen met een functie: dode tabs, zoekveld en bel weg.
   C) Vochtttegel met echte luchtvochtigheid erbij.
   D) Deurbel-overlay en cameraknoppen (patroon van het familiebord),
      klok in de kop, zichtbare todo-lijst in een paneel i.p.v. prompt().
   E) Alleen herrenderen als gebruikte data echt verandert, kamerrijen
      eenmalig gebouwd, dode zone midden op de dial, fonts gepind op
      versie 5.2.5, boog dimt als de verwarming uit staat.
   Geen backdrop-filter (tablet-WebView); glas = half-dekkende vlakken. */
(function () {
  "use strict";

  var FONT_ID = "halva-bord-fonts";
  if (!document.getElementById(FONT_ID)) {
    var st = document.createElement("style");
    st.id = FONT_ID;
    st.textContent =
      "@font-face{font-family:'HBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-300-normal.woff2') format('woff2');font-weight:300}" +
      "@font-face{font-family:'HBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-400-normal.woff2') format('woff2');font-weight:400}" +
      "@font-face{font-family:'HBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-500-normal.woff2') format('woff2');font-weight:500}" +
      "@font-face{font-family:'HBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-600-normal.woff2') format('woff2');font-weight:600}" +
      "@font-face{font-family:'HBInter';src:url('https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-700-normal.woff2') format('woff2');font-weight:700}";
    document.head.appendChild(st);
  }

  var CSS = `
  :host{ display:block; position:fixed; inset:0; width:100%; height:100%; }
  *{ margin:0; padding:0; box-sizing:border-box; }
  .stage{
    position:relative; width:1920px; height:1200px; transform-origin: top left;
    font-family:'HBInter','Inter','Segoe UI',Roboto,Arial,sans-serif;
    background:
      radial-gradient(1000px 640px at 16% -6%, rgba(34,211,238,.15), rgba(34,211,238,0) 62%),
      radial-gradient(1100px 760px at 88% 12%, rgba(129,140,248,.13), rgba(129,140,248,0) 64%),
      radial-gradient(900px 700px at 55% 115%, rgba(14,116,144,.10), rgba(14,116,144,0) 60%),
      #04060a;
    color:#f5f8fa; overflow:hidden; -webkit-font-smoothing:antialiased;
  }
  .venster{
    position:absolute; left:34px; top:34px; width:1852px; height:1132px;
    background:rgba(10,14,20,.78); border:1px solid rgba(255,255,255,.07);
    border-radius:30px; box-shadow:0 30px 80px rgba(0,0,0,.5);
    display:flex; overflow:hidden;
  }
  .sidebar{ width:296px; flex:none; padding:30px 22px 24px; display:flex; flex-direction:column;
    background:rgba(255,255,255,.02); border-right:1px solid rgba(255,255,255,.05); }
  .merk{ display:flex; align-items:center; gap:14px; padding:2px 8px; }
  .merkicoon{ width:46px; height:46px; border-radius:13px; flex:none;
    background:linear-gradient(145deg,#67e8f9,#0891b2);
    display:flex; align-items:center; justify-content:center; }
  .merkicoon .ringetje{ width:20px; height:20px; border-radius:50%; border:3.5px solid #ffffff;
    display:flex; align-items:center; justify-content:center; }
  .merkicoon .ringetje i{ width:5px; height:5px; border-radius:50%; background:#ffffff; display:block; }
  .merknaam{ font-size:22px; font-weight:700; line-height:1.1; color:#f5f8fa; }
  .merksub{ font-size:13.5px; color:#8b98a5; margin-top:2px; }
  .menu{ margin-top:36px; display:flex; flex-direction:column; gap:3px; }
  .mi{ display:flex; align-items:center; gap:12px; padding:11px 13px; border-radius:13px;
    font-size:18.5px; color:#aeb9c4; cursor:pointer; user-select:none; text-decoration:none; }
  .mi .ic{ width:27px; height:27px; border-radius:8px; flex:none; background:rgba(255,255,255,.06);
    color:#dbe5ee; font-size:11.5px; font-weight:700; display:flex; align-items:center; justify-content:center; }
  .mi.actief{ background:rgba(255,255,255,.07); color:#ffffff; cursor:default; }
  .gebruiker{ margin-top:auto; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.05);
    border-radius:16px; padding:13px 14px; display:flex; align-items:center; gap:12px; }
  .avatar{ width:40px; height:40px; border-radius:50%; flex:none;
    background:linear-gradient(145deg,#67e8f9,#0891b2); color:#032830;
    font-size:17px; font-weight:700; display:flex; align-items:center; justify-content:center; }
  .gebruiker .gn{ font-size:16.5px; font-weight:600; line-height:1.15; color:#f5f8fa; }
  .gebruiker .gs{ font-size:13px; color:#8b98a5; margin-top:1px; }
  .main{ flex:1; padding:32px 38px 30px; display:flex; flex-direction:column; min-width:0; }
  .kop{ display:flex; justify-content:space-between; align-items:flex-start; gap:20px; }
  .koplabel{ font-size:14px; font-weight:600; letter-spacing:.18em; color:#22d3ee; text-transform:uppercase; }
  .koptitel{ font-size:43px; font-weight:700; line-height:1.08; margin-top:5px; color:#f5f8fa; }
  .kopsub{ font-size:17.5px; color:#8b98a5; margin-top:7px; }
  .koprechts{ display:flex; align-items:center; gap:16px; padding-top:6px; }
  .kopklok{ text-align:right; }
  .kopklok .ktijd{ font-size:31px; font-weight:600; line-height:1.05; font-variant-numeric:tabular-nums; color:#f5f8fa; }
  .kopklok .kdatum{ font-size:14px; color:#8b98a5; margin-top:2px; text-transform:capitalize; }
  .nieuw{ background:#22d3ee; color:#032830; font-size:16.5px; font-weight:600;
    padding:13px 22px; border-radius:999px; cursor:pointer; user-select:none; white-space:nowrap; }
  .nieuw:active{ transform:scale(.96); }
  .kopavatar{ width:46px; height:46px; font-size:18px; }
  .tabs{ display:flex; gap:10px; margin-top:26px; }
  .tab{ padding:11px 22px; border-radius:999px; background:#22d3ee;
    color:#032830; font-size:17px; font-weight:600; user-select:none; }
  .inhoud{ display:flex; gap:24px; margin-top:24px; flex:1; min-height:0; }
  .kaart{ background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.07);
    border-radius:24px; box-shadow:0 16px 36px rgba(0,0,0,.28); }
  `;

  var CSS2 = `
  .huiskaart{ width:1022px; flex:none; padding:27px 32px; display:flex; flex-direction:column; }
  .kaarttitel{ font-size:25px; font-weight:600; color:#f5f8fa; }
  .kaartsub{ font-size:16px; color:#8b98a5; margin-top:4px; }
  .huislijf{ display:flex; margin-top:8px; flex:1; }
  .knopblok{ width:540px; flex:none; display:flex; flex-direction:column; align-items:center; }
  .dialwrap{ position:relative; width:520px; height:520px; flex:none;
    touch-action:none; cursor:grab; outline:none; -webkit-tap-highlight-color:transparent; }
  .dialwrap:active{ cursor:grabbing; }
  .dialwrap.dicht, .staprij.dicht, .schuifblok.dicht{ opacity:.45; pointer-events:none; }
  .ringlaag{ position:absolute; border-radius:50%; pointer-events:none; }
  .tick{ position:absolute; left:50%; top:50%; width:4px; height:11px; border-radius:2.5px;
    margin:-5.5px 0 0 -2px; background:rgba(255,255,255,.22); pointer-events:none; }
  .face{ position:absolute; inset:11%; border-radius:50%; background:#0a0e14;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    pointer-events:none; text-align:center; }
  .facelabel{ font-size:14.5px; font-weight:600; letter-spacing:.2em; color:#8b98a5; text-transform:uppercase; }
  .doel{ font-size:98px; font-weight:700; line-height:1.05; font-variant-numeric:tabular-nums; color:#f5f8fa; }
  .doel.grijs{ color:#7d8894; }
  .nudial{ margin-top:8px; font-size:17.5px; color:#8b98a5; display:flex; align-items:center; gap:8px; }
  .stip{ width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,.18); flex:none; }
  .stip.aan{ background:#22d3ee; box-shadow:0 0 9px rgba(34,211,238,.85); }
  .rotor{ position:absolute; inset:0; pointer-events:none; }
  .dialwrap:not(.bezig) .rotor{ transition:transform .35s cubic-bezier(.22,1,.36,1); }
  .knop{ position:absolute; left:50%; top:3.4%; width:27px; height:27px; border-radius:50%;
    transform:translate(-50%,-50%); background:#ffffff; box-shadow:0 3px 10px rgba(0,0,0,.5);
    display:flex; align-items:center; justify-content:center;
    transition:width .12s ease, height .12s ease; }
  .knop i{ width:8px; height:8px; border-radius:50%; background:#0a0e14; display:block; }
  .dialwrap.bezig .knop{ width:32px; height:32px; }
  .staprij{ width:520px; display:flex; justify-content:space-between; margin-top:16px; }
  .stepbtn{ width:62px; height:62px; border-radius:50%; background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.10); color:#ffffff; font-size:32px; line-height:1;
    display:flex; align-items:center; justify-content:center; cursor:pointer; user-select:none; }
  .stepbtn:active{ transform:scale(.92); border-color:rgba(34,211,238,.6); }
  .bediening{ flex:1; padding:14px 0 0 30px; display:flex; flex-direction:column; }
  .clabel{ font-size:14px; font-weight:600; letter-spacing:.18em; color:#8b98a5; text-transform:uppercase; }
  .pillen{ display:flex; gap:9px; margin-top:13px; flex-wrap:wrap; }
  .mpill{ padding:11px 16px; border-radius:999px; background:rgba(255,255,255,.045);
    border:1px solid rgba(255,255,255,.05); color:#c6d2dc; font-size:16.5px; cursor:pointer; user-select:none; white-space:nowrap; }
  .mpill:active{ transform:scale(.95); }
  .mpill.actief{ background:#04060a; border-color:rgba(255,255,255,.18); color:#ffffff; font-weight:600; }
  .schuifblok{ margin-top:58px; }
  .schuifkop{ display:flex; justify-content:space-between; align-items:baseline; }
  .schuifwaarde{ font-size:19px; font-weight:600; font-variant-numeric:tabular-nums; color:#f5f8fa; }
  .slider{ position:relative; height:36px; margin-top:6px; touch-action:none; cursor:pointer; }
  .strack{ position:absolute; left:0; right:0; top:50%; height:6px; transform:translateY(-50%);
    border-radius:99px; background:rgba(255,255,255,.10); }
  .sfill{ position:absolute; left:0; top:50%; height:6px; transform:translateY(-50%);
    border-radius:99px; background:linear-gradient(90deg,#7dd3fc,#22d3ee); }
  .sknop{ position:absolute; top:50%; width:22px; height:22px; border-radius:50%;
    transform:translate(-50%,-50%); background:#ffffff; box-shadow:0 2px 8px rgba(0,0,0,.5); pointer-events:none; }
  .tegels{ display:flex; gap:12px; margin-top:auto; padding-top:30px; }
  .tegel{ flex:1; background:rgba(255,255,255,.035); border:1px solid rgba(255,255,255,.05);
    border-radius:18px; padding:15px 16px; min-width:0; }
  .tegel .tk{ font-size:14.5px; color:#8b98a5; white-space:nowrap; }
  .tegel .tv{ font-size:23px; font-weight:600; margin-top:5px; font-variant-numeric:tabular-nums; color:#f5f8fa; white-space:nowrap; }
  .tegel .tv span{ font-size:14.5px; color:#8b98a5; font-weight:400; }
  .kamerskaart{ flex:1; padding:27px 30px; display:flex; flex-direction:column; }
  .krow{ padding:15px 0 12px; border-bottom:1px solid rgba(255,255,255,.05); }
  .krowkop{ display:flex; align-items:center; gap:13px; }
  .kicoon{ width:35px; height:35px; border-radius:10px; flex:none; background:rgba(255,255,255,.06);
    color:#dbe5ee; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; }
  .knaam{ font-size:19.5px; font-weight:500; color:#f5f8fa; }
  .kuit{ font-size:14.5px; color:#67737f; font-weight:400; }
  .ktemp{ margin-left:auto; text-align:right; font-variant-numeric:tabular-nums; }
  .ktemp .knu{ font-size:16px; color:#8b98a5; margin-right:9px; }
  .ktemp .kdoel{ font-size:20px; font-weight:600; color:#f5f8fa; }
  .krow .slider{ height:28px; margin-top:7px; }
  .krow.dicht .slider{ opacity:.35; pointer-events:none; }
  .krow.dicht .kdoel{ color:#67737f; }
  .kameronder{ margin-top:auto; padding-top:18px; }
  .samenvatting{ display:flex; gap:12px; }
  .camerarij{ margin-top:16px; }
  .camchips{ display:flex; gap:9px; margin-top:10px; }
  .camchip{ padding:10px 18px; border-radius:999px; background:rgba(255,255,255,.045);
    border:1px solid rgba(255,255,255,.06); color:#dbe5ee; font-size:16px; cursor:pointer; user-select:none;
    display:flex; align-items:center; gap:8px; }
  .camchip:active{ transform:scale(.95); }
  .camchip .cdot{ width:7px; height:7px; border-radius:50%; background:#22d3ee; }
  /* Overlays: camera en todo */
  .scherm{ position:absolute; inset:0; background:rgba(2,4,8,.74); display:none;
    align-items:center; justify-content:center; z-index:30; }
  .scherm.open{ display:flex; }
  .kijk{ width:1180px; background:#0b0f16; border:1px solid rgba(255,255,255,.10);
    border-radius:26px; padding:22px; box-shadow:0 30px 80px rgba(0,0,0,.6); }
  .kijk.groot{ width:1760px; }
  .kijkkop{ display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
  .kijktitel{ font-size:23px; font-weight:600; color:#f5f8fa; }
  .kijkknoppen{ display:flex; gap:10px; }
  .kijkbtn{ padding:12px 22px; border-radius:999px; background:rgba(255,255,255,.07);
    color:#f5f8fa; font-size:16.5px; font-weight:600; cursor:pointer; user-select:none; }
  .kijkbtn.primaire{ background:#22d3ee; color:#032830; }
  .kijkbeeld{ width:100%; aspect-ratio:16/9; background:#04060a; border-radius:16px; overflow:hidden;
    display:flex; align-items:center; justify-content:center; }
  .kijkbeeld img{ width:100%; height:100%; object-fit:cover; display:block; }
  .todopaneel{ width:760px; max-height:920px; background:#0b0f16; border:1px solid rgba(255,255,255,.10);
    border-radius:26px; padding:26px 28px; box-shadow:0 30px 80px rgba(0,0,0,.6);
    display:flex; flex-direction:column; }
  .todolijst{ margin-top:16px; overflow-y:auto; }
  .todoitem{ display:flex; align-items:center; gap:14px; padding:13px 6px;
    border-bottom:1px solid rgba(255,255,255,.05); cursor:pointer; }
  .todoitem .vink{ width:27px; height:27px; border-radius:50%; flex:none;
    border:2px solid rgba(255,255,255,.35); display:flex; align-items:center; justify-content:center;
    color:#032830; font-size:15px; font-weight:700; }
  .todoitem.klaar .vink{ background:#22d3ee; border-color:#22d3ee; }
  .todoitem.klaar .ttekst{ color:#67737f; text-decoration:line-through; }
  .todoitem .ttekst{ font-size:19px; color:#f5f8fa; }
  .todoleeg{ font-size:17.5px; color:#8b98a5; padding:14px 6px; }
  .todoinvoer{ display:flex; gap:10px; margin-top:18px; }
  .todoinvoer input{ flex:1; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.10);
    border-radius:13px; padding:13px 16px; color:#f5f8fa; font-size:17.5px; font-family:inherit; outline:none; }
  .todoinvoer .voeg{ background:#22d3ee; color:#032830; font-size:16.5px; font-weight:600;
    padding:13px 20px; border-radius:13px; cursor:pointer; user-select:none; }
  `;

  var TICKS = "";
  for (var ti = 0; ti < 60; ti++) TICKS += '<div class="tick"></div>';

  var HTML = `
  <div class="stage" id="stage">
    <div class="venster">
      <aside class="sidebar">
        <div class="merk">
          <div class="merkicoon"><div class="ringetje"><i></i></div></div>
          <div>
            <div class="merknaam">Thuis</div>
            <div class="merksub">Smart Home</div>
          </div>
        </div>
        <nav class="menu">
          <a class="mi" href="/familie-bord"><span class="ic">Ov</span>Overzicht</a>
          <div class="mi actief"><span class="ic">Kl</span>Klimaat</div>
          <a class="mi" href="/energie-bord"><span class="ic">En</span>Energie</a>
          <a class="mi" href="/auto-bord"><span class="ic">Au</span>Auto</a>
          <a class="mi" href="/stofzuiger-bord"><span class="ic">St</span>Stofzuiger</a>
          <a class="mi" href="/babyfoon-bord"><span class="ic">Ba</span>Babyfoon</a>
          <a class="mi" href="/keuken-bord"><span class="ic">Ke</span>Keuken</a>
          <a class="mi" href="/muziek-dashboard"><span class="ic">Mu</span>Muziek</a>
        </nav>
        <div class="gebruiker">
          <div class="avatar">A</div>
          <div>
            <div class="gn">Alex</div>
            <div class="gs">Thuis · Leiderdorp</div>
          </div>
        </div>
      </aside>
      <div class="main">
        <div class="kop">
          <div>
            <div class="koplabel">Klimaat</div>
            <div class="koptitel">Klimaat</div>
            <div class="kopsub" id="kopsub">…</div>
          </div>
          <div class="koprechts">
            <div class="kopklok">
              <div class="ktijd" id="ktijd">--:--</div>
              <div class="kdatum" id="kdatum"></div>
            </div>
            <div class="nieuw" id="nieuw">+ Nieuw</div>
            <div class="avatar kopavatar">A</div>
          </div>
        </div>
        <div class="tabs">
          <div class="tab">Thermostaat</div>
        </div>
        <div class="inhoud">
          <section class="kaart huiskaart">
            <div class="kaarttitel">Hele huis</div>
            <div class="kaartsub" id="huissub">Woonkamer</div>
            <div class="huislijf">
              <div class="knopblok">
                <div class="dialwrap" id="dialwrap" tabindex="0" role="slider" aria-label="Doeltemperatuur woonkamer">
                  <div class="ringlaag" id="ringspoor"></div>
                  <div class="ringlaag" id="ringgloed"></div>
                  <div class="ringlaag" id="ringboog"></div>
                  ${TICKS}
                  <div class="face">
                    <div class="facelabel">Woonkamer</div>
                    <div class="doel" id="doel">--</div>
                    <div class="nudial"><span class="stip" id="dialstip"></span><span id="nudial">…</span></div>
                  </div>
                  <div class="rotor" id="rotor"><div class="knop"><i></i></div></div>
                </div>
                <div class="staprij" id="staprij">
                  <div class="stepbtn" id="stepmin">−</div>
                  <div class="stepbtn" id="stepplus">+</div>
                </div>
              </div>
              <div class="bediening">
                <div class="clabel">Modus</div>
                <div class="pillen">
                  <div class="mpill" id="modeheat">Verwarmen</div>
                  <div class="mpill" id="modeschema">Schema hervatten</div>
                  <div class="mpill" id="modeoff">Uit</div>
                </div>
                <div class="schuifblok" id="schuifblok">
                  <div class="schuifkop">
                    <div class="clabel">Temperatuur</div>
                    <div class="schuifwaarde" id="schuifwaarde">--</div>
                  </div>
                  <div class="slider" id="huisslider">
                    <div class="strack"></div>
                    <div class="sfill" id="huisfill"></div>
                    <div class="sknop" id="huisknop"></div>
                  </div>
                </div>
                <div class="tegels">
                  <div class="tegel"><div class="tk">Vochtigheid</div><div class="tv" id="tilevocht">--</div></div>
                  <div class="tegel"><div class="tk">Buiten</div><div class="tv" id="tilebuiten">--</div></div>
                  <div class="tegel"><div class="tk">Verbruik huis</div><div class="tv" id="tileverbruik">--</div></div>
                </div>
              </div>
            </div>
          </section>
          <section class="kaart kamerskaart">
            <div class="kaarttitel">Kamers</div>
            <div class="kaartsub">Stel per kamer een doel in</div>
            <div id="kamerrijen"></div>
            <div class="kameronder">
              <div class="samenvatting">
                <div class="tegel"><div class="tk">Koudste kamer</div><div class="tv" id="tilekoud">--</div></div>
                <div class="tegel"><div class="tk">Warmste kamer</div><div class="tv" id="tilewarm">--</div></div>
              </div>
              <div class="camerarij">
                <div class="clabel">Camera's</div>
                <div class="camchips">
                  <div class="camchip" id="camvoordeur"><span class="cdot"></span>Voordeur</div>
                  <div class="camchip" id="camnaud"><span class="cdot"></span>Naud</div>
                  <div class="camchip" id="camcas"><span class="cdot"></span>Cas</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
    <div class="scherm" id="kijkscherm">
      <div class="kijk" id="kijk">
        <div class="kijkkop">
          <div class="kijktitel" id="kijktitel">Er is aangebeld</div>
          <div class="kijkknoppen">
            <div class="kijkbtn" id="kijkgroot">Open groot</div>
            <div class="kijkbtn primaire" id="kijksluit">Weg</div>
          </div>
        </div>
        <div class="kijkbeeld"><img id="kijkimg" alt="Camerabeeld"></div>
      </div>
    </div>
    <div class="scherm" id="todoscherm">
      <div class="todopaneel">
        <div class="kijkkop">
          <div class="kijktitel">Te doen</div>
          <div class="kijkknoppen"><div class="kijkbtn primaire" id="todosluit">Sluiten</div></div>
        </div>
        <div class="todolijst" id="todolijst"></div>
        <div class="todoinvoer">
          <input id="todotekst" type="text" placeholder="Nieuwe taak…" autocomplete="off">
          <div class="voeg" id="todovoeg">Voeg toe</div>
        </div>
      </div>
    </div>
  </div>`;

  function fmt(n, dec) {
    if (n === null || n === undefined || isNaN(n)) return null;
    return Number(n).toFixed(dec === undefined ? 1 : dec).replace(".", ",");
  }
  var COND_NL = {
    "sunny": "Zonnig", "clear-night": "Helder", "cloudy": "Bewolkt",
    "partlycloudy": "Half bewolkt", "rainy": "Regen", "pouring": "Stortregen",
    "snowy": "Sneeuw", "snowy-rainy": "Natte sneeuw", "fog": "Mist",
    "hail": "Hagel", "lightning": "Onweer", "lightning-rainy": "Onweer",
    "windy": "Windy", "windy-variant": "Windy", "exceptional": "Extreem weer"
  };
  // Zones: naam, lokale entiteit (sturen), Tado CE-entiteit (doel + schaal lezen),
  // kern-cloud _2 (alleen Kantoor leeft daar), vochtsensor.
  var ZONES = [
    { naam: "Woonkamer", lok: "climate.woonkamer_woonkamer", ce: "climate.woonkamer_woonkamer_3", cloud: null, vocht: "sensor.woonkamer_woonkamer_vochtigheid" },
    { naam: "Naud", lok: "climate.slaapkamer_naud_slaapkamer_naud", ce: "climate.slaapkamer_naud_slaapkamer_naud_3", cloud: null, vocht: "sensor.slaapkamer_naud_slaapkamer_naud_vochtigheid" },
    { naam: "Cas", lok: "climate.slaapkamer_cas_slaapkamer_cas", ce: "climate.slaapkamer_cas_slaapkamer_cas_3", cloud: null, vocht: "sensor.slaapkamer_cas_slaapkamer_cas_vochtigheid" },
    { naam: "Slaapkamer", lok: "climate.slaapkamer_slaapkamer", ce: "climate.slaapkamer_slaapkamer_3", cloud: null, vocht: "sensor.slaapkamer_slaapkamer_vochtigheid" },
    { naam: "Badkamer", lok: "climate.badkamer_badkamer", ce: "climate.badkamer_badkamer_3", cloud: null, vocht: "sensor.badkamer_badkamer_vochtigheid" },
    { naam: "Kantoor", lok: "climate.kantoor_kantoor", ce: null, cloud: "climate.kantoor_kantoor_2", vocht: "sensor.kantoor_kantoor_vochtigheid" }
  ];
  var WOON = 0, KANTOOR = 5;
  var CAMS = [
    ["camvoordeur", "camera.voordeur_live", "Voordeur"],
    ["camnaud", "camera.astronaud", "Naud"],
    ["camcas", "camera.astrocas", "Cas"]
  ];

  class HalvaBordCard extends HTMLElement {
    setConfig(config) {
      this._config = config || {};
      if (!this._built) this._build();
    }
    _build() {
      this._built = true;
      var root = this.attachShadow({ mode: "open" });
      var style = document.createElement("style");
      style.textContent = CSS + CSS2;
      var wrap = document.createElement("div");
      wrap.innerHTML = HTML;
      root.appendChild(style);
      root.appendChild(wrap);
      var hostEl = this;
      Array.prototype.forEach.call(root.querySelectorAll(".sidebar a.mi"), function (a) {
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
      this._el = {};
      var self = this;
      ["stage","kopsub","huissub","ktijd","kdatum","dialwrap","staprij","schuifblok","ringspoor","ringgloed","ringboog",
       "doel","nudial","dialstip","rotor","stepmin","stepplus","modeheat","modeschema","modeoff","schuifwaarde",
       "huisslider","huisfill","huisknop","tilevocht","tilebuiten","tileverbruik","kamerrijen","tilekoud","tilewarm",
       "nieuw","kijkscherm","kijk","kijktitel","kijkimg","kijkgroot","kijksluit",
       "todoscherm","todolijst","todotekst","todovoeg","todosluit"]
        .forEach(function (id) { self._el[id] = root.getElementById(id); });
      this._ticks = Array.prototype.slice.call(root.querySelectorAll(".tick"));
      this._ov = {};
      var dw = this._el.dialwrap;
      dw.addEventListener("pointerdown", function (ev) { self._startSleep(ev); });
      dw.addEventListener("pointermove", function (ev) { self._sleep(ev); });
      dw.addEventListener("pointerup", function () { self._stopSleep(false); });
      dw.addEventListener("pointercancel", function () { self._stopSleep(true); });
      dw.addEventListener("keydown", function (ev) { self._toets(ev); });
      this._el.stepmin.addEventListener("click", function () { self._stap(-0.5); });
      this._el.stepplus.addEventListener("click", function () { self._stap(0.5); });
      this._el.modeheat.addEventListener("click", function () { self._mode("heat"); });
      this._el.modeschema.addEventListener("click", function () { self._mode("auto"); });
      this._el.modeoff.addEventListener("click", function () { self._mode("off"); });
      this._bindSlider(this._el.huisslider,
        function (f, commit) { self._huisSchuif(f, commit); },
        function () { self._drag = null; self._update(); });
      this._el.nieuw.addEventListener("click", function () { self._openTodo(); });
      this._el.todosluit.addEventListener("click", function () { self._el.todoscherm.classList.remove("open"); });
      this._el.todovoeg.addEventListener("click", function () { self._voegTodoToe(); });
      this._el.todotekst.addEventListener("keydown", function (ev) { if (ev.key === "Enter") self._voegTodoToe(); });
      CAMS.forEach(function (c) {
        var knop = root.getElementById(c[0]);
        if (knop) knop.addEventListener("click", function () { self._openCam(c[1], c[2], false); });
      });
      this._el.kijksluit.addEventListener("click", function () { self._sluitCam(); });
      this._el.kijkgroot.addEventListener("click", function () {
        var g = self._el.kijk.classList.toggle("groot");
        self._el.kijkgroot.textContent = g ? "Kleiner" : "Open groot";
      });
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
    set hass(hass) {
      this._hass = hass;
      if (!this._built) return;
      var sig = this._handtekening();
      if (sig !== this._sig) {
        this._sig = sig;
        this._update();
        if (this._el.todoscherm.classList.contains("open")) this._laadTodos();
      }
    }
    _handtekening() {
      var self = this, delen = [];
      function pak(eid, velden) {
        var s = self._st(eid);
        if (!s) { delen.push(eid + ":weg"); return; }
        var d = [s.state];
        (velden || []).forEach(function (v) { d.push(s.attributes[v]); });
        delen.push(eid + ":" + d.join("|"));
      }
      ZONES.forEach(function (z) {
        pak(z.lok, ["temperature", "current_temperature", "hvac_action"]);
        if (z.ce) pak(z.ce, ["temperature", "current_temperature"]);
        if (z.cloud) pak(z.cloud, ["temperature", "current_temperature"]);
        pak(z.vocht, []);
      });
      pak("weather.forecast_thuis", ["temperature"]);
      pak("sensor.huisverbruik", []);
      pak("todo.te_doen", []);
      pak("binary_sensor.voordeur_ding", []);
      var d = new Date();
      delen.push("min:" + d.getHours() * 60 + d.getMinutes());
      return delen.join(";");
    }
    _st(eid) { return this._hass && this._hass.states ? this._hass.states[eid] : undefined; }
    _num(eid) {
      var s = this._st(eid);
      if (!s || s.state === "unavailable" || s.state === "unknown") return null;
      var n = parseFloat(s.state);
      return isNaN(n) ? null : n;
    }
    _call(domain, service, data, target, ovIdx) {
      if (!this._hass) return;
      var self = this;
      var p;
      try { p = this._hass.callService(domain, service, data, target); }
      catch (e) { p = null; }
      if (!p || !p.catch) {
        if (ovIdx != null) delete this._ov[ovIdx];
        this._flash("Actie mislukt, probeer opnieuw");
        return;
      }
      p.catch(function () {
        if (ovIdx != null) delete self._ov[ovIdx];
        self._flash("Actie mislukt, probeer opnieuw");
        self._update();
      });
    }
    _grenzen(i) {
      var z = ZONES[i];
      var bron = this._st(z.ce || z.lok) || this._st(z.lok);
      var a = bron ? bron.attributes : {};
      return {
        min: a.min_temp != null ? a.min_temp : 5,
        max: a.max_temp != null ? a.max_temp : 25,
        stap: a.target_temp_step != null ? a.target_temp_step : 0.5
      };
    }
    _doelVan(i) {
      if (this._drag && this._drag.idx === i && this._drag.val != null) return this._drag.val;
      var ov = this._ov[i];
      if (ov && Date.now() < ov.until) return ov.val;
      var z = ZONES[i];
      var lok = this._st(z.lok);
      if (lok && lok.attributes.temperature != null) return lok.attributes.temperature;
      var ce = z.ce ? this._st(z.ce) : null;
      if (ce && ce.attributes.temperature != null) return ce.attributes.temperature;
      var cl = z.cloud ? this._st(z.cloud) : null;
      if (cl && cl.attributes.temperature != null) return cl.attributes.temperature;
      return null;
    }
    _nuVan(i) {
      var z = ZONES[i];
      var lok = this._st(z.lok);
      if (lok && lok.attributes.current_temperature != null) return lok.attributes.current_temperature;
      var ce = z.ce ? this._st(z.ce) : null;
      if (ce && ce.attributes.current_temperature != null) return ce.attributes.current_temperature;
      var cl = z.cloud ? this._st(z.cloud) : null;
      return cl && cl.attributes.current_temperature != null ? cl.attributes.current_temperature : null;
    }
    _zoneWeg(i) {
      var lok = this._st(ZONES[i].lok);
      return !lok || lok.state === "unavailable" || lok.state === "unknown";
    }
    _zoneUit(i) {
      var lok = this._st(ZONES[i].lok);
      if (lok) return lok.state === "off";
      var ce = ZONES[i].ce ? this._st(ZONES[i].ce) : null;
      return ce ? ce.state === "off" : false;
    }
    _bouwRijen() {
      this._rijen = [];
      var self = this;
      var html = ZONES.map(function (z, i) {
        return '<div class="krow" id="krow' + i + '">' +
          '<div class="krowkop"><div class="kicoon">' + z.naam.slice(0, 2) + '</div>' +
          '<div class="knaam">' + z.naam + ' <span class="kuit" id="kuit' + i + '"></span></div>' +
          '<div class="ktemp"><span class="knu" id="knu' + i + '"></span>' +
          '<span class="kdoel" id="kdoel' + i + '">--</span></div></div>' +
          '<div class="slider" id="kslider' + i + '"><div class="strack"></div>' +
          '<div class="sfill" id="kfill' + i + '"></div>' +
          '<div class="sknop" id="kknop' + i + '"></div></div></div>';
      }).join("");
      this._el.kamerrijen.innerHTML = html;
      ZONES.forEach(function (z, i) {
        var rij = {
          row: self._el.kamerrijen.querySelector("#krow" + i),
          uit: self._el.kamerrijen.querySelector("#kuit" + i),
          nu: self._el.kamerrijen.querySelector("#knu" + i),
          doel: self._el.kamerrijen.querySelector("#kdoel" + i),
          fill: self._el.kamerrijen.querySelector("#kfill" + i),
          knop: self._el.kamerrijen.querySelector("#kknop" + i),
          slider: self._el.kamerrijen.querySelector("#kslider" + i)
        };
        self._rijen.push(rij);
        self._bindSlider(rij.slider,
          function (f, commit) { self._kamerSchuif(i, f, commit); },
          function () { self._drag = null; self._update(); });
      });
      this._rijenGebouwd = true;
    }
    _update() {
      var el = this._el, self = this;
      if (!this._rijenGebouwd) this._bouwRijen();
      var w = this._st("weather.forecast_thuis");
      var buiten = w && w.attributes.temperature != null ? w.attributes.temperature : null;
      var doelW = this._doelVan(WOON);
      var nuW = this._nuVan(WOON);
      el.kopsub.textContent =
        "Verwarming " + (doelW == null ? "--" : fmt(doelW)) + "° · " +
        (nuW == null ? "--" : fmt(nuW)) + "° binnen · " +
        (buiten == null ? "--" : fmt(buiten)) + "° buiten";
      var wegW = this._zoneWeg(WOON);
      var uitW = wegW || this._zoneUit(WOON);
      var clW = this._st(ZONES[WOON].lok);
      var verwarmt = clW && clW.attributes.hvac_action === "heating";
      el.huissub.textContent = "Woonkamer · " + (wegW ? "Geen verbinding" : uitW ? "Verwarming uit" : verwarmt ? "Verwarming aan" : "Op temperatuur");
      // thermostaatknop
      var gr = this._grenzen(WOON);
      var f = doelW == null ? 0 : Math.min(1, Math.max(0, (doelW - gr.min) / (gr.max - gr.min)));
      var sweep = f * 270;
      var boog = "conic-gradient(from -135deg, #7dd3fc 0deg, #22d3ee " + (sweep * 0.6) + "deg, #0ea5b7 " + sweep + "deg, transparent " + sweep + "deg 360deg)";
      el.ringspoor.style.background = "conic-gradient(from 0deg, rgba(255,255,255,.055) 0deg 360deg)";
      el.ringspoor.style.inset = "4.6%";
      el.ringgloed.style.background = boog;
      el.ringgloed.style.inset = "3.4%";
      el.ringboog.style.background = boog;
      el.ringboog.style.inset = "4.6%";
      var dim = uitW ? "0.16" : "1";
      el.ringboog.style.opacity = dim;
      el.ringgloed.style.opacity = uitW ? "0.05" : "0.30";
      var straal = 520 * 0.478;
      this._ticks.forEach(function (tick, i) {
        var a = i * 6;
        var da = a <= 180 ? a : a - 360;
        tick.style.transform = "rotate(" + a + "deg) translateY(" + (-straal) + "px)";
        var actief = !uitW && da >= -135 && da <= -135 + sweep;
        tick.style.background = actief ? "#bae6fd" : "rgba(255,255,255,.20)";
      });
      el.rotor.style.transform = "rotate(" + (-135 + sweep) + "deg)";
      el.doel.textContent = doelW == null ? "--" : fmt(doelW) + "°";
      el.doel.classList.toggle("grijs", uitW);
      el.nudial.textContent = this._flashMsg && Date.now() < this._flashUntil
        ? this._flashMsg
        : wegW ? "Geen verbinding met de thermostaat"
        : (nuW == null ? "" : "nu " + fmt(nuW) + "°") + (uitW ? " · uit" : verwarmt ? " · verwarmt" : " · op temperatuur");
      el.dialstip.className = "stip" + (verwarmt ? " aan" : "");
      el.dialwrap.classList.toggle("dicht", wegW);
      el.staprij.classList.toggle("dicht", wegW);
      el.schuifblok.classList.toggle("dicht", wegW);
      el.dialwrap.setAttribute("aria-valuemin", gr.min);
      el.dialwrap.setAttribute("aria-valuemax", gr.max);
      if (doelW != null) el.dialwrap.setAttribute("aria-valuenow", doelW);
      // huisschuif en modus
      el.schuifwaarde.textContent = doelW == null ? "--" : fmt(doelW) + "°";
      el.huisfill.style.width = (f * 100) + "%";
      el.huisknop.style.left = (f * 100) + "%";
      var mode = this._modusNu();
      el.modeheat.classList.toggle("actief", mode === "heat");
      el.modeschema.classList.toggle("actief", mode === "auto");
      el.modeoff.classList.toggle("actief", mode === "off");
      // tegels
      var vochtW = this._num(ZONES[WOON].vocht);
      el.tilevocht.innerHTML = vochtW === null ? "--" : fmt(vochtW, 0) + " <span>%</span>";
      el.tilebuiten.innerHTML = buiten == null ? "--" : fmt(buiten) + "° <span>" + (COND_NL[w.state] || "") + "</span>";
      var hv = this._num("sensor.huisverbruik");
      el.tileverbruik.innerHTML = hv === null ? "--" : fmt(hv, 0) + " <span>W</span>";
      // kamerrijen bijwerken (eenmalig gebouwd)
      ZONES.forEach(function (z, i) {
        var rij = self._rijen[i];
        if (!rij) return;
        if (self._drag && self._drag.kind === "kamer" && self._drag.idx === i) return;
        var doel = self._doelVan(i);
        var nu = self._nuVan(i);
        var gr2 = self._grenzen(i);
        var f2 = doel == null ? 0 : Math.min(1, Math.max(0, (doel - gr2.min) / (gr2.max - gr2.min)));
        var weg = self._zoneWeg(i);
        var vocht = self._num(z.vocht);
        rij.uit.textContent = weg ? "· offline" : self._zoneUit(i) ? "· uit" : "";
        rij.nu.textContent = "nu " + (nu == null ? "--" : fmt(nu)) + "°" + (vocht === null ? "" : " · " + fmt(vocht, 0) + "%");
        rij.doel.textContent = doel == null ? "--" : fmt(doel) + "°";
        rij.fill.style.width = (f2 * 100) + "%";
        rij.knop.style.left = (f2 * 100) + "%";
        rij.row.classList.toggle("dicht", weg || doel == null);
      });
      // samenvatting koudste/warmste
      var koud = null, warm = null;
      ZONES.forEach(function (z, i) {
        var nu = self._nuVan(i);
        if (nu == null) return;
        if (!koud || nu < koud.nu) koud = { naam: z.naam, nu: nu };
        if (!warm || nu > warm.nu) warm = { naam: z.naam, nu: nu };
      });
      el.tilekoud.innerHTML = koud ? fmt(koud.nu) + "° <span>" + koud.naam + "</span>" : "--";
      el.tilewarm.innerHTML = warm ? fmt(warm.nu) + "° <span>" + warm.naam + "</span>" : "--";
      // deurbel: opkomende ding opent het kijkvenster
      var dingSt = this._st("binary_sensor.voordeur_ding");
      var dingNu = !!dingSt && dingSt.state === "on";
      if (this._dingWas === false && dingNu) this._openCam("camera.voordeur_live", "Voordeur", true);
      this._dingWas = dingNu;
    }
    _modusNu() {
      if (this._ovMode && Date.now() < this._ovMode.until) return this._ovMode.mode;
      var cs = this._st(ZONES[WOON].lok + "_2");
      if (cs && cs.state !== "unavailable" && cs.state !== "unknown") return cs.state;
      var ce = this._st(ZONES[WOON].ce);
      if (ce && ce.state !== "unavailable" && ce.state !== "unknown") return ce.state;
      var lok = this._st(ZONES[WOON].lok);
      return lok ? lok.state : null;
    }
    _zetOv(i, v) {
      this._ov[i] = { val: v, until: Date.now() + 12000 };
      var self = this;
      setTimeout(function () { self._update(); }, 12150);
    }
    _zetZone(i, v) {
      if (this._zoneWeg(i)) { this._flash(ZONES[i].naam + " is offline"); return; }
      this._zetOv(i, v);
      this._call("script", "tado_zet_zone", { entity_id: ZONES[i].lok, temperature: v }, undefined, i);
      this._update();
    }
    _stap(d) {
      if (this._zoneWeg(WOON)) { this._flash("Woonkamer is offline"); return; }
      var gr = this._grenzen(WOON);
      var nieuw;
      if (this._zoneUit(WOON)) nieuw = 20;
      else {
        var base = this._doelVan(WOON);
        if (base == null) return;
        nieuw = this._snap(Number(base) + d, gr);
      }
      this._zetOv(WOON, nieuw);
      this._call("script", "tado_stap", { entity_id: ZONES[WOON].lok, delta: d }, undefined, WOON);
      this._update();
    }
    _mode(m) {
      var z = ZONES[WOON];
      var lok = this._st(z.lok);
      if (!lok || lok.state === "unavailable") { this._flash("Woonkamer is offline"); return; }
      if (m === "heat") {
        if (lok.state === "off") {
          this._ovMode = { mode: "heat", until: Date.now() + 12000 };
          this._call("script", "tado_power", { entity_id: z.lok });
        } else if (lok.state !== "heat") {
          this._ovMode = { mode: "heat", until: Date.now() + 12000 };
          this._call("climate", "set_hvac_mode", { hvac_mode: "heat" }, { entity_id: z.lok });
        }
      } else if (m === "off") {
        if (lok.state !== "off") {
          this._ovMode = { mode: "off", until: Date.now() + 12000 };
          this._call("climate", "set_hvac_mode", { hvac_mode: "off" }, { entity_id: z.lok });
        }
      } else if (m === "auto") {
        var cs = this._st(z.lok + "_2");
        var doelEnt = null;
        if (cs && cs.state !== "unavailable" && cs.state !== "unknown") doelEnt = z.lok + "_2";
        else {
          var ce = this._st(z.ce);
          if (ce && ce.state !== "unavailable" && ce.state !== "unknown") doelEnt = z.ce;
        }
        if (!doelEnt) { this._flash("Schema hervatten lukt nu niet, cloud offline"); return; }
        this._ovMode = { mode: "auto", until: Date.now() + 12000 };
        this._call("climate", "set_hvac_mode", { hvac_mode: "auto" }, { entity_id: doelEnt });
      }
      var self = this;
      setTimeout(function () { self._update(); }, 12150);
      this._update();
    }
    _bindSlider(el, handler, onCancel) {
      var bezig = false;
      function fractie(ev) {
        var r = el.getBoundingClientRect();
        return Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      }
      el.addEventListener("pointerdown", function (ev) {
        ev.preventDefault();
        el.setPointerCapture(ev.pointerId);
        bezig = true;
        handler(fractie(ev), false);
      });
      el.addEventListener("pointermove", function (ev) {
        if (bezig) handler(fractie(ev), false);
      });
      el.addEventListener("pointerup", function (ev) {
        if (!bezig) return;
        bezig = false;
        handler(fractie(ev), true);
      });
      el.addEventListener("pointercancel", function () {
        if (!bezig) return;
        bezig = false;
        if (onCancel) onCancel();
      });
    }
    _snap(v, gr) {
      v = Math.round(v / gr.stap) * gr.stap;
      return Math.min(gr.max, Math.max(gr.min, Math.round(v * 10) / 10));
    }
    _huisSchuif(f, commit) {
      if (this._zoneWeg(WOON)) return;
      var gr = this._grenzen(WOON);
      var v = this._snap(gr.min + f * (gr.max - gr.min), gr);
      this._drag = { kind: "huis", idx: WOON, val: v };
      this._update();
      if (commit) {
        this._drag = null;
        var huidig = this._doelVan(WOON);
        if (v !== huidig) this._zetZone(WOON, v);
        this._update();
      }
    }
    _kamerSchuif(i, f, commit) {
      if (this._zoneWeg(i)) return;
      var gr = this._grenzen(i);
      var v = this._snap(gr.min + f * (gr.max - gr.min), gr);
      this._drag = { kind: "kamer", idx: i, val: v };
      var rij = this._rijen[i];
      if (rij) {
        var f2 = (v - gr.min) / (gr.max - gr.min);
        rij.fill.style.width = (f2 * 100) + "%";
        rij.knop.style.left = (f2 * 100) + "%";
        rij.doel.textContent = fmt(v) + "°";
      }
      if (commit) {
        this._drag = null;
        var huidig = this._doelVan(i);
        if (v !== huidig) this._zetZone(i, v);
        this._update();
      }
    }
    _straalFractie(ev) {
      var r = this._el.dialwrap.getBoundingClientRect();
      var dx = ev.clientX - (r.left + r.width / 2);
      var dy = ev.clientY - (r.top + r.height / 2);
      return Math.sqrt(dx * dx + dy * dy) / (r.width / 2);
    }
    _hoekNaarWaarde(ev) {
      var r = this._el.dialwrap.getBoundingClientRect();
      var dx = ev.clientX - (r.left + r.width / 2);
      var dy = ev.clientY - (r.top + r.height / 2);
      var hoek = Math.atan2(dx, -dy) * 180 / Math.PI;
      if (hoek > 135) hoek = 135;
      if (hoek < -135) hoek = -135;
      var gr = this._grenzen(WOON);
      return this._snap(gr.min + ((hoek + 135) / 270) * (gr.max - gr.min), gr);
    }
    _startSleep(ev) {
      if (this._zoneWeg(WOON)) return;
      if (this._straalFractie(ev) < 0.30) return;
      ev.preventDefault();
      this._el.dialwrap.setPointerCapture(ev.pointerId);
      this._bezig = true;
      this._el.dialwrap.classList.add("bezig");
      this._drag = { kind: "dial", idx: WOON, val: this._hoekNaarWaarde(ev) };
      this._update();
    }
    _sleep(ev) {
      if (!this._bezig) return;
      if (this._straalFractie(ev) < 0.28) return;
      this._drag = { kind: "dial", idx: WOON, val: this._hoekNaarWaarde(ev) };
      this._update();
    }
    _stopSleep(afbreken) {
      if (!this._bezig) return;
      this._bezig = false;
      this._el.dialwrap.classList.remove("bezig");
      var v = this._drag ? this._drag.val : null;
      this._drag = null;
      if (!afbreken && v != null) {
        var huidig = this._doelVan(WOON);
        if (v !== huidig) this._zetZone(WOON, v);
      }
      this._update();
    }
    _toets(ev) {
      if (ev.repeat) return;
      if (this._zoneWeg(WOON)) return;
      var gr = this._grenzen(WOON);
      var huidig = this._doelVan(WOON);
      if (huidig == null) return;
      var v = null;
      if (ev.key === "ArrowUp" || ev.key === "ArrowRight") v = huidig + gr.stap;
      else if (ev.key === "ArrowDown" || ev.key === "ArrowLeft") v = huidig - gr.stap;
      else if (ev.key === "Home") v = gr.min;
      else if (ev.key === "End") v = gr.max;
      if (v == null) return;
      ev.preventDefault();
      this._zetZone(WOON, this._snap(v, gr));
    }
    _openTodo() {
      this._el.todoscherm.classList.add("open");
      this._laadTodos();
    }
    _laadTodos() {
      if (!this._hass || this._todoBezig) return;
      this._todoBezig = true;
      var self = this;
      var p;
      try {
        p = this._hass.callService("todo", "get_items", { status: "needs_action" }, { entity_id: "todo.te_doen" }, false, true);
      } catch (e) { p = null; }
      if (!p || !p.then) { this._todoBezig = false; return; }
      p.then(function (res) {
        self._todoBezig = false;
        var items = [];
        try { items = res.response["todo.te_doen"].items || []; } catch (e) {}
        self._todoItems = items;
        self._el.todolijst.innerHTML = items.length
          ? items.map(function (it, ix) {
              return '<div class="todoitem" data-ix="' + ix + '"><div class="vink"></div><div class="ttekst">' +
                String(it.summary || "").replace(/</g, "‹") + "</div></div>";
            }).join("")
          : '<div class="todoleeg">Geen open taken. Lekker rustig.</div>';
        Array.prototype.forEach.call(self._el.todolijst.querySelectorAll(".todoitem"), function (row) {
          row.addEventListener("click", function () {
            var it = self._todoItems[parseInt(row.getAttribute("data-ix"), 10)];
            if (!it) return;
            self._call("todo", "update_item", { item: it.uid, status: "completed" }, { entity_id: "todo.te_doen" });
            setTimeout(function () { self._laadTodos(); }, 650);
          });
        });
      }).catch(function () { self._todoBezig = false; });
    }
    _voegTodoToe() {
      var txt = (this._el.todotekst.value || "").trim();
      if (!txt) return;
      this._el.todotekst.value = "";
      this._call("todo", "add_item", { item: txt }, { entity_id: "todo.te_doen" });
      var self = this;
      setTimeout(function () { self._laadTodos(); }, 650);
    }
    _openCam(eid, naam, vanBel) {
      this._camEntity = eid;
      this._el.kijktitel.textContent = vanBel ? "Er is aangebeld" : naam;
      this._el.kijkscherm.classList.add("open");
      this._verversCam();
      var self = this;
      if (this._camTimer) clearInterval(this._camTimer);
      this._camTimer = setInterval(function () { self._verversCam(); }, 1500);
    }
    _verversCam() {
      if (!this._hass || !this._hass.connection || !this._camEntity) return;
      var self = this;
      this._hass.connection.sendMessagePromise({ type: "auth/sign_path", path: "/api/camera_proxy/" + this._camEntity })
        .then(function (r) {
          if (r && r.path) self._el.kijkimg.src = r.path + (r.path.indexOf("?") >= 0 ? "&" : "?") + "t=" + Date.now();
        })
        .catch(function () {});
    }
    _sluitCam() {
      this._el.kijkscherm.classList.remove("open");
      if (this._camTimer) { clearInterval(this._camTimer); this._camTimer = null; }
      this._el.kijk.classList.remove("groot");
      this._el.kijkgroot.textContent = "Open groot";
    }
    _flash(msg) {
      this._flashMsg = msg;
      this._flashUntil = Date.now() + 4500;
      this._update();
      var self = this;
      setTimeout(function () { self._update(); }, 4700);
    }
    disconnectedCallback() {
      if (this._ro) this._ro.disconnect();
      if (this._onResize) window.removeEventListener("resize", this._onResize);
      if (this._klokTimer) clearInterval(this._klokTimer);
      if (this._camTimer) clearInterval(this._camTimer);
    }
  }

  if (!customElements.get("halva-bord-card")) {
    customElements.define("halva-bord-card", HalvaBordCard);
    window.customCards = window.customCards || [];
    window.customCards.push({ type: "halva-bord-card", name: "Halva-bord", preview: false });
  }
})();
