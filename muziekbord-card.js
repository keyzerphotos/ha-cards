/* Muziekbord v2.0 (3 nov 2026) — volledige herbouw op Alex' verzoek
   ("gooi het maar helemaal op de schop, zorg dat het werkt en eruit ziet
   als Spotify"). Alleen dit bord verandert; de rest van het huis niet.
   Opzet volgens drie teamrapporten van 3 nov 2026 (HA/MA-API, Spotify-
   ontwerp, technische review):
   - Speler is Music Assistant (standaard media_player.jbl_bar_800_3),
     met spelerkeuze: bar, keuken, nachtkastje, huiskamer, groep.
   - Bladeren via WS media_player/browse_media, zoeken primair via de
     service music_assistant.search (gegroepeerd), terugval WS
     media_player/search_media. Afspelen met de content-id/type letterlijk
     uit het antwoord, altijd enqueue "replace".
   - Look: Spotify-desktop. Achtergrond #121212, panelen #181818,
     tegels #282828, lijnen #343434, groen #1DB954, tekst wit, sub #b3b3b3.
     Speelbalk onderin met voortgang en een gesegmenteerde volumebalk.
   - Bouwregels uit de review: DOM één keer bouwen en nooit herbouwen bij
     hass-updates; UI-state op de instantie; volgnummer + spelercheck op
     elke async respons; debounce 500 ms op zoeken; browse-cache per node;
     _fit bevriezen zolang het zoekveld focus heeft (schermtoetsenbord);
     optimistisch volume met verval en 1500 ms speelvergrendeling zoals
     het familiebord-muziekblok.
   Terugval: Lovelace-resource terugzetten op commit 647d8244 (v1.0,
   Cast-speler) volstaat; dit bestand hoeft daarvoor niet terug. */
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

  var GROEN = "#1DB954";
  var CSS = `
  :host{ display:block; position:fixed; inset:0; width:100%; height:100%; }
  *{ margin:0; padding:0; box-sizing:border-box; }
  .stage{
    position:relative; width:1920px; height:1200px; transform-origin: top left;
    font-family:'MBInter','Inter','Segoe UI',Roboto,Arial,sans-serif;
    background:#121212; color:#ffffff; overflow:hidden; -webkit-font-smoothing:antialiased;
  }
  /* Kop */
  .kop{ position:absolute; left:44px; right:44px; top:30px; display:flex;
    justify-content:space-between; align-items:flex-start; }
  .titel{ font-size:44px; font-weight:800; color:#ffffff; }
  .ondertitel{ font-size:18px; color:#b3b3b3; margin-top:4px; }
  .klok{ text-align:right; }
  .klok .tijd{ font-size:34px; font-weight:750; font-variant-numeric:tabular-nums; color:#ffffff; line-height:1.05; }
  .klok .datum{ font-size:16px; color:#b3b3b3; margin-top:3px; text-transform:capitalize; }
  /* Hoofdgebied */
  .hoofd{ position:absolute; left:44px; right:44px; top:118px; height:764px; display:flex; gap:28px; }
  .links{ width:1296px; flex:none; display:flex; flex-direction:column; }
  .rechts{ flex:1; min-width:0; }
  /* Zoekbalk (statisch, wordt nooit herbouwd) */
  .zoekbalk{ height:76px; flex:none; display:flex; align-items:center; gap:14px;
    background:#282828; border:1px solid #3a3a3a; border-radius:999px; padding:0 12px 0 30px; }
  .zoekbalk.focus{ border:2px solid #ffffff; }
  .loep{ position:relative; width:30px; height:30px; flex:none; }
  .loep i{ position:absolute; left:0; top:0; width:22px; height:22px; border-radius:50%;
    border:4px solid #b3b3b3; display:block; }
  .loep b{ position:absolute; right:0; bottom:1px; width:13px; height:4.5px; border-radius:3px;
    background:#b3b3b3; transform:rotate(45deg); display:block; }
  #zoekinput{ flex:1; min-width:0; background:transparent; border:none; outline:none;
    font-family:inherit; font-size:25px; font-weight:550; color:#ffffff; }
  #zoekinput::placeholder{ color:#b3b3b3; }
  .wis{ width:54px; height:54px; flex:none; border-radius:50%; background:#3a3a3a; color:#ffffff;
    font-size:30px; line-height:1; display:none; align-items:center; justify-content:center;
    cursor:pointer; user-select:none; }
  .zoekknop{ width:58px; height:58px; flex:none; border-radius:50%; background:${GROEN};
    display:flex; align-items:center; justify-content:center; cursor:pointer; user-select:none; }
  .zoekknop:active{ transform:scale(.94); }
  .zoekknop .loep i{ border-color:#000000; }
  .zoekknop .loep b{ background:#000000; }
  .laadstrook{ height:4px; flex:none; border-radius:99px; background:transparent; margin-top:10px; }
  .laadstrook.aan{ background:${GROEN}; opacity:.75; }
  /* Secties */
  .sectiekop{ display:flex; justify-content:space-between; align-items:baseline; margin-top:22px; }
  .sectiekop .sk-titel{ font-size:32px; font-weight:800; color:#ffffff; }
  .sectiekop .sk-context{ font-size:17px; color:#b3b3b3; }
  /* Radiokaarten */
  .radiorij{ display:flex; gap:22px; margin-top:14px; }
  .rkaart{ width:240px; height:158px; flex:none; background:#181818; border:1px solid #343434;
    border-radius:16px; padding:18px; cursor:pointer; user-select:none; position:relative; }
  .rkaart:active{ background:#282828; transform:scale(.99); }
  .rkaart.actief{ background:#282828; border:2px solid ${GROEN}; padding:17px; }
  .rmono{ width:66px; height:66px; border-radius:10px; background:#282828; color:#ffffff;
    font-size:24px; font-weight:800; display:flex; align-items:center; justify-content:center; }
  .rkaart.actief .rmono{ background:#3a3a3a; }
  .rstatus{ position:absolute; top:20px; right:18px; font-size:15px; font-weight:600; color:#b3b3b3;
    display:flex; align-items:center; gap:7px; }
  .rstatus.speelt{ color:${GROEN}; font-weight:700; }
  .eq{ display:none; align-items:flex-end; gap:2.5px; height:13px; }
  .eq i{ width:3.5px; background:${GROEN}; border-radius:2px; display:block; }
  .eq i:nth-child(1){ height:13px; } .eq i:nth-child(2){ height:8px; } .eq i:nth-child(3){ height:11px; }
  .eq.aan{ display:flex; }
  .rnaam{ font-size:21.5px; font-weight:750; line-height:1.18; color:#ffffff; margin-top:12px;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  /* Categorietegels */
  .tegels{ display:grid; grid-template-columns:repeat(4, 1fr); gap:22px; margin-top:14px; }
  .tegel{ height:158px; background:#181818; border:1px solid #343434; border-radius:16px;
    padding:18px; cursor:pointer; user-select:none; position:relative; }
  .tegel:active{ background:#282828; }
  .tegel .rmono{ width:74px; height:74px; font-size:27px; border-radius:12px; }
  .ttegelnaam{ font-size:25px; font-weight:750; color:#ffffff; margin-top:12px; }
  .tchev{ position:absolute; right:18px; bottom:16px; width:15px; height:15px;
    border-right:4px solid #b3b3b3; border-top:4px solid #b3b3b3; transform:rotate(45deg); }
  .bronfout{ margin-top:14px; padding:20px 22px; background:#181818; border:1px solid #343434;
    border-radius:16px; font-size:18px; color:#b3b3b3; line-height:1.45; }
  .bronfout b{ color:#ffffff; }
  `;
  var CSS2 = `
  /* Lijstweergave */
  #viewlijst{ display:none; flex-direction:column; flex:1; min-height:0; }
  .werkbalk{ display:flex; align-items:center; gap:20px; margin-top:20px; height:62px; flex:none; }
  .terug{ min-width:160px; height:58px; padding:0 24px; border-radius:999px; background:#282828;
    border:1px solid #3a3a3a; color:#ffffff; font-size:20px; font-weight:650;
    display:flex; align-items:center; gap:12px; cursor:pointer; user-select:none; }
  .terug:active{ transform:scale(.97); }
  .terug .chev{ width:13px; height:13px; border-left:4px solid #ffffff; border-bottom:4px solid #ffffff;
    transform:rotate(45deg); flex:none; }
  .wtitel{ font-size:33px; font-weight:800; color:#ffffff; white-space:nowrap; overflow:hidden;
    text-overflow:ellipsis; flex:1; min-width:0; }
  .wcontext{ font-size:17px; color:#b3b3b3; flex:none; }
  .lijst{ flex:1; min-height:0; overflow-y:auto; margin-top:14px; padding-right:6px;
    scrollbar-width:thin; scrollbar-color:#3a3a3a transparent; }
  .lijst::-webkit-scrollbar{ width:8px; }
  .lijst::-webkit-scrollbar-thumb{ background:#3a3a3a; border-radius:99px; }
  .groepskop{ font-size:19px; font-weight:700; color:#b3b3b3; text-transform:uppercase;
    letter-spacing:.1em; padding:18px 4px 8px; }
  .rij{ display:flex; align-items:center; gap:18px; height:98px; padding:13px 16px;
    background:#181818; border:1px solid #343434; border-radius:16px; margin-bottom:11px;
    cursor:pointer; user-select:none; }
  .rij:active{ background:#282828; }
  .rij.speelt{ background:#282828; }
  .rij.speelt .rtitel{ color:${GROEN}; }
  .rthumb{ width:70px; height:70px; flex:none; border-radius:8px; overflow:hidden;
    background:#282828; display:flex; align-items:center; justify-content:center; position:relative; }
  .rthumb img{ width:100%; height:100%; object-fit:cover; display:block; }
  .rthumb .mono{ font-size:23px; font-weight:800; color:#ffffff; }
  .rthumb.rond{ border-radius:50%; }
  .rtekst{ flex:1; min-width:0; }
  .rtitel{ font-size:22.5px; font-weight:700; color:#ffffff; white-space:nowrap; overflow:hidden;
    text-overflow:ellipsis; }
  .ronder{ font-size:16.5px; color:#b3b3b3; margin-top:3px; white-space:nowrap; overflow:hidden;
    text-overflow:ellipsis; }
  .rrechts{ flex:none; display:flex; align-items:center; gap:12px; }
  .rspeel{ width:54px; height:54px; border-radius:50%; background:${GROEN};
    display:flex; align-items:center; justify-content:center; }
  .rspeel .drie{ width:0; height:0; border-left:17px solid #000000; border-top:11px solid transparent;
    border-bottom:11px solid transparent; margin-left:4px; }
  .rchev{ width:14px; height:14px; border-right:4px solid #b3b3b3; border-top:4px solid #b3b3b3;
    transform:rotate(45deg); margin-right:8px; }
  .rij .eq{ margin-right:2px; }
  .meer{ height:64px; border-radius:16px; background:#282828; color:#ffffff; font-size:19px;
    font-weight:650; display:flex; align-items:center; justify-content:center; cursor:pointer;
    user-select:none; margin-bottom:11px; }
  .leeg{ padding:56px 30px; text-align:center; }
  .leeg .ltitel{ font-size:27px; font-weight:800; color:#ffffff; }
  .leeg .luitleg{ font-size:18px; color:#b3b3b3; margin-top:10px; line-height:1.5; }
  .leeg .lknop{ display:inline-flex; margin-top:22px; padding:15px 30px; border-radius:999px;
    background:${GROEN}; color:#000000; font-size:19px; font-weight:700; cursor:pointer; user-select:none; }
  .leeg .lknop.grijs{ background:#282828; color:#ffffff; border:1px solid #3a3a3a; }
  /* Spelerkeuze */
  .spelerpaneel{ background:#181818; border:1px solid #343434; border-radius:20px;
    padding:22px 24px; height:100%; display:flex; flex-direction:column; }
  .spkop{ font-size:27px; font-weight:800; color:#ffffff; }
  .spnu{ display:flex; align-items:center; gap:16px; background:#282828; border-radius:16px;
    padding:16px 18px; margin-top:16px; }
  .spmono{ width:58px; height:58px; flex:none; border-radius:12px; background:#3a3a3a; color:#ffffff;
    font-size:19px; font-weight:800; display:flex; align-items:center; justify-content:center; }
  .spmono.rond{ border-radius:50%; }
  .spnunaam{ font-size:22px; font-weight:700; color:#ffffff; }
  .spnustatus{ font-size:16px; color:#b3b3b3; margin-top:2px; display:flex; align-items:center; gap:8px; }
  .stip{ width:11px; height:11px; border-radius:50%; background:${GROEN}; flex:none; }
  .sprijen{ margin-top:16px; display:flex; flex-direction:column; gap:11px; }
  .sprij{ display:flex; align-items:center; gap:15px; height:82px; padding:0 18px 0 14px;
    border-radius:16px; border:1px solid transparent; cursor:pointer; user-select:none; position:relative; }
  .sprij:active{ background:#282828; }
  .sprij .spmono{ width:50px; height:50px; font-size:16.5px; background:#282828; }
  .sprij.gekozen{ background:#282828; }
  .sprij.gekozen::before{ content:""; position:absolute; left:0; top:14px; bottom:14px; width:4px;
    border-radius:99px; background:${GROEN}; }
  .spnaam{ font-size:21px; font-weight:700; color:#ffffff; }
  .spstatus{ font-size:16px; color:#b3b3b3; margin-top:2px; }
  .sprij.weg{ opacity:.55; }
  .keuzecirkel{ margin-left:auto; width:28px; height:28px; flex:none; border-radius:50%;
    border:2.5px solid #7a7a7a; position:relative; }
  .sprij.gekozen .keuzecirkel{ background:${GROEN}; border-color:${GROEN}; }
  .sprij.gekozen .keuzecirkel::after{ content:""; position:absolute; left:8px; top:4.5px; width:7px;
    height:12px; border-right:3.5px solid #000000; border-bottom:3.5px solid #000000; transform:rotate(42deg); }
  .spuitleg{ margin-top:auto; font-size:16px; color:#b3b3b3; line-height:1.5; }
  /* Speelbalk */
  .speelbalk{ position:absolute; left:44px; right:44px; top:898px; height:172px;
    background:#181818; border:1px solid #343434; border-top:2px solid #343434; border-radius:20px;
    display:flex; align-items:center; padding:0 30px; gap:28px; }
  .sb-links{ width:520px; flex:none; display:flex; align-items:center; gap:20px; min-width:0; }
  .sbart{ width:104px; height:104px; flex:none; border-radius:10px; overflow:hidden;
    background:#282828; display:flex; align-items:center; justify-content:center; }
  .sbart img{ width:100%; height:100%; object-fit:cover; display:block; }
  .sbart .mono{ font-size:34px; font-weight:800; color:#ffffff; }
  .sbmeta{ flex:1; min-width:0; }
  .sbbron{ font-size:14.5px; font-weight:700; letter-spacing:.12em; color:${GROEN};
    text-transform:uppercase; }
  .sbtitel{ font-size:25px; font-weight:750; color:#ffffff; white-space:nowrap; overflow:hidden;
    text-overflow:ellipsis; margin-top:3px; }
  .sbartiest{ font-size:18px; color:#b3b3b3; white-space:nowrap; overflow:hidden;
    text-overflow:ellipsis; margin-top:2px; }
  .sb-midden{ width:480px; flex:none; display:flex; flex-direction:column; align-items:center; gap:12px; }
  .sbtransport{ display:flex; align-items:center; gap:34px; }
  .skip{ width:62px; height:62px; display:flex; align-items:center; justify-content:center;
    cursor:pointer; user-select:none; }
  .skip:active{ transform:scale(.92); }
  .skip .vorm{ display:flex; align-items:center; }
  .skip .balk{ width:6px; height:30px; background:#ffffff; border-radius:2px; }
  .skip .drie-l{ width:0; height:0; border-right:21px solid #ffffff; border-top:14px solid transparent;
    border-bottom:14px solid transparent; }
  .skip .drie-r{ width:0; height:0; border-left:21px solid #ffffff; border-top:14px solid transparent;
    border-bottom:14px solid transparent; }
  .skip.dicht, .hoofdknop.dicht{ opacity:.35; pointer-events:none; }
  .hoofdknop{ width:80px; height:80px; border-radius:50%; background:${GROEN};
    display:flex; align-items:center; justify-content:center; cursor:pointer; user-select:none; }
  .hoofdknop:active{ transform:scale(.94); background:#169C46; }
  .hoofdknop .drie{ width:0; height:0; border-left:27px solid #000000; border-top:18px solid transparent;
    border-bottom:18px solid transparent; margin-left:6px; }
  .hoofdknop .pauze{ display:flex; gap:10px; }
  .hoofdknop .pauze i{ width:10px; height:34px; border-radius:2px; background:#000000; display:block; }
  .voortgang{ width:100%; display:flex; align-items:center; gap:12px; height:22px; }
  .vtijd{ font-size:15px; color:#b3b3b3; font-variant-numeric:tabular-nums; min-width:44px; }
  .vtijd.rechts{ text-align:right; }
  .vtrack{ flex:1; height:6px; border-radius:99px; background:#3d3d3d; position:relative; }
  .vfill{ position:absolute; left:0; top:0; bottom:0; border-radius:99px; background:${GROEN}; }
  .vlive{ font-size:15.5px; color:#b3b3b3; text-align:center; }
  .sb-rechts{ flex:1; min-width:0; display:flex; flex-direction:column; gap:13px; }
  .sb-r-rij{ display:flex; align-items:center; justify-content:space-between; }
  .sb-speler{ font-size:17.5px; color:#b3b3b3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sb-speler b{ color:#ffffff; font-weight:650; }
  .demp{ padding:10px 22px; border-radius:999px; background:#282828; border:1px solid #3a3a3a;
    font-size:16.5px; color:#ffffff; cursor:pointer; user-select:none; flex:none; }
  .demp.actief{ border-color:${GROEN}; color:${GROEN}; }
  .volrij{ display:flex; align-items:center; gap:16px; }
  .volknop{ width:54px; height:54px; flex:none; border-radius:50%; background:#282828;
    border:1px solid #3a3a3a; color:#ffffff; font-size:27px; display:flex; align-items:center;
    justify-content:center; cursor:pointer; user-select:none; }
  .volknop:active{ transform:scale(.92); }
  .volknop.dicht, .volseg.dicht, .demp.dicht{ opacity:.35; pointer-events:none; }
  .volseg{ flex:1; height:56px; display:flex; align-items:flex-end; gap:6px; touch-action:none;
    cursor:pointer; padding:4px 2px; }
  .volseg i{ flex:1; border-radius:3px 3px 2px 2px; background:#3d3d3d; display:block; }
  .volseg i.vol{ background:${GROEN}; }
  .volpct{ width:62px; flex:none; text-align:right; font-size:20px; font-weight:700;
    font-variant-numeric:tabular-nums; color:#ffffff; }
  /* Navigatiebalk, gelijk aan de andere borden, actief is hier groen */
  .pnav{ position:absolute; left:50%; transform:translateX(-50%); bottom:26px; display:flex; gap:8px; z-index:4;
    background:rgba(16,17,20,.85); border:1px solid rgba(255,255,255,.09); border-radius:999px; padding:7px; }
  .pnav a{ font-size:21px; color:#d6d6d2; text-decoration:none; padding:11px 30px; border-radius:999px;
    border:1px solid transparent; }
  .pnav a.active{ background:${GROEN}; color:#000000; font-weight:650; border-color:${GROEN}; }
  `;

  var HTML = `
  <div class="stage" id="stage">
    <div class="kop">
      <div>
        <div class="titel">Muziek</div>
        <div class="ondertitel" id="ondertitel">Music Assistant · JBL Bar 800</div>
      </div>
      <div class="klok">
        <div class="tijd" id="ktijd">--:--</div>
        <div class="datum" id="kdatum"></div>
      </div>
    </div>
    <div class="hoofd">
      <div class="links">
        <div class="zoekbalk" id="zoekbalk">
          <span class="loep"><i></i><b></b></span>
          <input id="zoekinput" type="text" placeholder="Zoek in Music Assistant"
            autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">
          <span class="wis" id="zoekwis">&times;</span>
          <span class="zoekknop" id="zoekknop"><span class="loep"><i></i><b></b></span></span>
        </div>
        <div class="laadstrook" id="laadstrook"></div>
        <div id="viewhome">
          <div class="sectiekop"><span class="sk-titel">Snelkeuze</span><span class="sk-context">5 zenders</span></div>
          <div class="radiorij" id="radiorij"></div>
          <div class="sectiekop"><span class="sk-titel">Bladeren</span><span class="sk-context">Music Assistant</span></div>
          <div class="tegels" id="tegels"></div>
          <div class="bronfout" id="bronfout" style="display:none"></div>
        </div>
        <div id="viewlijst">
          <div class="werkbalk">
            <div class="terug" id="terugknop"><span class="chev"></span><span>Terug</span></div>
            <div class="wtitel" id="wtitel"></div>
            <div class="wcontext" id="wcontext"></div>
          </div>
          <div class="lijst" id="lijst"></div>
        </div>
      </div>
      <div class="rechts">
        <div class="spelerpaneel">
          <div class="spkop">Afspelen op</div>
          <div class="spnu">
            <div class="spmono" id="spnumono">JBL</div>
            <div>
              <div class="spnunaam" id="spnunaam">JBL Bar 800</div>
              <div class="spnustatus"><span class="stip"></span><span id="spnustatus">Geselecteerd</span></div>
            </div>
          </div>
          <div class="sprijen" id="sprijen"></div>
          <div class="spuitleg">De keuze geldt voor radio, zoeken en bladeren. De speelbalk onderin stuurt altijd de gekozen speler.</div>
        </div>
      </div>
    </div>
    <div class="speelbalk">
      <div class="sb-links">
        <div class="sbart" id="sbart"><span class="mono">JBL</span></div>
        <div class="sbmeta">
          <div class="sbbron" id="sbbron"></div>
          <div class="sbtitel" id="sbtitel">Niets aan het spelen</div>
          <div class="sbartiest" id="sbartiest">Kies een zender of zoek iets op</div>
        </div>
      </div>
      <div class="sb-midden">
        <div class="sbtransport">
          <div class="skip" id="skipprev"><span class="vorm"><span class="balk"></span><span class="drie-l"></span></span></div>
          <div class="hoofdknop" id="hoofdknop"><span class="drie"></span></div>
          <div class="skip" id="skipnext"><span class="vorm"><span class="drie-r"></span><span class="balk"></span></span></div>
        </div>
        <div class="voortgang" id="voortgang"></div>
      </div>
      <div class="sb-rechts">
        <div class="sb-r-rij">
          <div class="sb-speler" id="sbspeler">Speelt op <b>JBL Bar 800</b></div>
          <div class="demp" id="demp">Dempen</div>
        </div>
        <div class="volrij">
          <div class="volknop" id="volmin">−</div>
          <div class="volseg" id="volseg"></div>
          <div class="volknop" id="volplus">+</div>
          <div class="volpct" id="volpct">--</div>
        </div>
      </div>
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

  var MA_ENTRY = "01M6HCVKX0JMTWRTN44M2NCW4S";
  var SPELERS = [
    { id: "media_player.jbl_bar_800_3", naam: "JBL Bar 800", type: "Soundbar · woonkamer", mono: "JBL", vierkant: true },
    { id: "media_player.keuken_2", naam: "Keuken", type: "Speaker", mono: "KE", vierkant: false },
    { id: "media_player.slaapkamer_nachtkastje", naam: "Nachtkastje", type: "Speaker · slaapkamer", mono: "NA", vierkant: false },
    { id: "media_player.huiskamer_2", naam: "Huiskamer", type: "Speaker", mono: "HU", vierkant: false },
    { id: "media_player.koken_met_sanne_2", naam: "Koken Met Sanne", type: "Groep", mono: "KS", vierkant: false }
  ];
  var ZENDERS = [
    { naam: "Efteling Kids Radio", kort: "EK", url: "http://25243.live.streamtheworld.com:3690/TLPSTR07_SC" },
    { naam: "NPO Radio 2", kort: "R2", url: "https://icecast.omroep.nl/radio2-bb-mp3" },
    { naam: "NPO 3FM", kort: "3FM", url: "https://icecast.omroep.nl/3fm-bb-mp3" },
    { naam: "Radio 538", kort: "538", url: "https://21223.live.streamtheworld.com/RADIO538.mp3" },
    { naam: "NPO Radio 1", kort: "R1", url: "https://icecast.omroep.nl/radio1-bb-mp3" }
  ];
  // Root-nodes uit MA die als tegels worden getoond (op titel gematcht) + Radio Browser als uitzondering.
  var CATS = [
    { sleutel: "artists", nl: "Artiesten", mono: "AR" },
    { sleutel: "albums", nl: "Albums", mono: "AL" },
    { sleutel: "tracks", nl: "Nummers", mono: "NR" },
    { sleutel: "playlists", nl: "Afspeellijsten", mono: "AF" },
    { sleutel: "radio stations", nl: "Radiozenders", mono: "RA" },
    { sleutel: "podcasts", nl: "Podcasts", mono: "PO" },
    { sleutel: "audiobooks", nl: "Audioboeken", mono: "AB" },
    { sleutel: "radio browser", nl: "Radio Browser", mono: "RB" }
  ];
  var KLASSE_NL = { track: "Nummer", album: "Album", artist: "Artiest", playlist: "Afspeellijst",
    podcast: "Podcast", audiobook: "Audioboek", radio: "Radiozender", directory: "Categorie",
    genre: "Genre", season: "Seizoen", episode: "Aflevering" };
  var GROEP_NL = { tracks: "Nummers", albums: "Albums", artists: "Artiesten",
    playlists: "Afspeellijsten", radio: "Radiozenders", podcasts: "Podcasts", audiobooks: "Audioboeken" };
  var MAX_TOON = 200;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function monoVan(naam) {
    var w = String(naam || "?").replace(/[^A-Za-zÀ-ÿ0-9 ]/g, "").trim().split(/\s+/);
    if (w.length >= 2) return (w[0].charAt(0) + w[1].charAt(0)).toUpperCase();
    return String(naam || "?").substring(0, 2).toUpperCase();
  }
  function mmss(sec) {
    if (sec == null || !isFinite(sec) || sec < 0) return "0:00";
    sec = Math.floor(sec);
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  class MuziekBord2Card extends HTMLElement {
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
      this._el = {};
      ["stage","ktijd","kdatum","ondertitel","zoekbalk","zoekinput","zoekwis","zoekknop","laadstrook",
       "viewhome","radiorij","tegels","bronfout","viewlijst","terugknop","wtitel","wcontext","lijst",
       "sprijen","spnumono","spnunaam","spnustatus","sbart","sbbron","sbtitel","sbartiest",
       "skipprev","hoofdknop","skipnext","voortgang","sbspeler","demp","volmin","volseg","volplus","volpct"]
        .forEach(function (id) { self._el[id] = root.getElementById(id); });
      // Staat
      this._speler = SPELERS[0].id;
      this._view = "home";
      this._stack = [];
      this._cache = new Map();
      this._browseSeq = 0;
      this._searchSeq = 0;
      this._zoektekst = "";
      this._playLock = 0;
      this._volLocal = null;
      this._volSleep = null;
      this._badPics = {};
      this._rootVoor = "";
      this._listFull = [];
      this._listItem = null;
      this._listBron = null;
      this._listToon = MAX_TOON;
      this._zoekTimer = null;
      // Radio snelkeuze (statisch)
      this._el.radiorij.innerHTML = ZENDERS.map(function (z, i) {
        return '<div class="rkaart" data-zender="' + i + '">' +
          '<div class="rmono">' + z.kort + '</div>' +
          '<div class="rstatus" data-rstatus="' + i + '"><span class="eq" data-req="' + i + '"><i></i><i></i><i></i></span><span data-rtekst="' + i + '">Radio</span></div>' +
          '<div class="rnaam">' + esc(z.naam) + '</div></div>';
      }).join("");
      Array.prototype.forEach.call(this._el.radiorij.querySelectorAll("[data-zender]"), function (tile) {
        tile.addEventListener("click", function () {
          self._speelZender(ZENDERS[parseInt(tile.getAttribute("data-zender"), 10)]);
        });
      });
      // Spelerkeuze (statisch)
      this._el.sprijen.innerHTML = SPELERS.map(function (p, i) {
        return '<div class="sprij" data-speler="' + i + '">' +
          '<div class="spmono' + (p.vierkant ? "" : " rond") + '">' + p.mono + '</div>' +
          '<div><div class="spnaam">' + esc(p.naam) + '</div>' +
          '<div class="spstatus" data-spstatus="' + i + '">' + esc(p.type) + '</div></div>' +
          '<div class="keuzecirkel"></div></div>';
      }).join("");
      Array.prototype.forEach.call(this._el.sprijen.querySelectorAll("[data-speler]"), function (rij) {
        rij.addEventListener("click", function () {
          self._kiesSpeler(SPELERS[parseInt(rij.getAttribute("data-speler"), 10)].id);
        });
      });
      // Volumesegmenten
      var segHtml = "";
      for (var si = 0; si < 10; si++) segHtml += '<i style="height:' + (12 + si * 2) + 'px"></i>';
      this._el.volseg.innerHTML = segHtml;
      // Bediening
      this._el.hoofdknop.addEventListener("click", function () { self._speelPauze(); });
      this._el.skipprev.addEventListener("click", function () { self._skip(-1); });
      this._el.skipnext.addEventListener("click", function () { self._skip(1); });
      this._el.volmin.addEventListener("click", function () { self._volStap(-0.08); });
      this._el.volplus.addEventListener("click", function () { self._volStap(0.08); });
      this._el.demp.addEventListener("click", function () {
        var s = self._sp();
        if (!s || s.state === "unavailable" || s.state === "unknown") return;
        self._call("media_player", "volume_mute",
          { is_volume_muted: !(s.attributes.is_volume_muted === true) }, { entity_id: self._speler });
      });
      this._el.terugknop.addEventListener("click", function () { self._terug(); });
      // Zoeken
      var inp = this._el.zoekinput;
      inp.addEventListener("focus", function () {
        self._zoekFocus = true;
        self._el.zoekbalk.classList.add("focus");
      });
      inp.addEventListener("blur", function () {
        self._zoekFocus = false;
        self._el.zoekbalk.classList.remove("focus");
        self._fit();
      });
      inp.addEventListener("input", function () {
        self._zoektekst = inp.value;
        self._el.zoekwis.style.display = inp.value ? "flex" : "none";
        self._planZoek();
      });
      inp.addEventListener("compositionend", function () { self._planZoek(); });
      inp.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          if (self._zoekTimer) { clearTimeout(self._zoekTimer); self._zoekTimer = null; }
          self._zoekNu();
        }
      });
      this._el.zoekwis.addEventListener("click", function () {
        inp.value = "";
        self._zoektekst = "";
        self._el.zoekwis.style.display = "none";
        if (self._zoekTimer) { clearTimeout(self._zoekTimer); self._zoekTimer = null; }
        self._searchSeq++;
        self._el.laadstrook.classList.remove("aan");
        self._naarHome();
        try { inp.focus(); } catch (e) {}
      });
      this._el.zoekknop.addEventListener("click", function () {
        if (self._zoekTimer) { clearTimeout(self._zoekTimer); self._zoekTimer = null; }
        self._zoekNu();
      });
      this._bindVolSeg();
      // Schaal en klok
      this._ro = new ResizeObserver(function () { self._fit(); });
      this._ro.observe(this);
      this._onResize = function () { self._fit(); };
      window.addEventListener("resize", this._onResize);
      this._klokTimer = setInterval(function () { self._tickClock(); }, 20000);
      this._tickTimer = setInterval(function () { self._tickVoortgang(); }, 1000);
      this._tickClock();
      this._fit();
      setTimeout(function () { self._fit(); }, 300);
      setTimeout(function () { self._fit(); }, 1200);
      this._tekenSpelers();
    }
    getCardSize() { return 1; }
    _fit() {
      if (this._zoekFocus) return;
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

    _sp() { return this._hass && this._hass.states ? this._hass.states[this._speler] : undefined; }
    _spelerObj() {
      for (var i = 0; i < SPELERS.length; i++) if (SPELERS[i].id === this._speler) return SPELERS[i];
      return SPELERS[0];
    }
    _call(domain, service, data, target) {
      if (!this._hass) return;
      var p;
      try { p = this._hass.callService(domain, service, data, target); } catch (e) { p = null; }
      if (p && p.catch) p.catch(function () {});
    }
    _metTimeout(belofte, ms) {
      return Promise.race([
        belofte,
        new Promise(function (resolve, reject) {
          setTimeout(function () { reject(new Error("timeout")); }, ms);
        })
      ]);
    }
    _ws(payload, ms) {
      if (!this._hass || !this._hass.callWS) return Promise.reject(new Error("geen verbinding"));
      return this._metTimeout(this._hass.callWS(payload), ms || 15000);
    }
    set hass(hass) {
      this._hass = hass;
      if (!this._built) return;
      // Root alvast ophalen zodra de verbinding er is (traagste call, dus vroeg)
      if (hass.connection && this._rootVoor !== this._speler && !this._rootBezig) {
        this._laadRoot();
      }
      var s = this._sp();
      var a = s ? s.attributes : {};
      var pic = a.entity_picture ? String(a.entity_picture).split("?")[0] : "";
      if (this._badPics[pic]) pic = "kapot:" + pic;
      var sig = [s ? s.state : "weg", a.media_title, a.media_artist, a.media_album_name,
        pic, a.media_duration, a.media_content_id, a.app_name].join("|");
      if (sig !== this._barSig) {
        this._barSig = sig;
        this._vgSig = null;
        this._updateBar();
      }
      var vsig = [this._effVol(), a.is_volume_muted === true, s ? s.state : "weg"].join("|");
      if (vsig !== this._volSig) { this._volSig = vsig; this._tekenVolume(); }
      var psig = SPELERS.map(function (p) {
        var st = hass.states[p.id];
        return st ? st.state : "weg";
      }).join("|") + "#" + this._speler;
      if (psig !== this._spelerSig) { this._spelerSig = psig; this._tekenSpelers(); }
      var zNu = this._actieveZender();
      var zsig = zNu ? zNu.url : "";
      if (zsig !== this._zenderSig) { this._zenderSig = zsig; this._tekenRadio(); }
    }
    _actieveZender() {
      var s = this._sp();
      if (!s || (s.state !== "playing" && s.state !== "paused")) return null;
      var a = s.attributes;
      for (var i = 0; i < ZENDERS.length; i++) {
        if (a.media_content_id && String(a.media_content_id) === ZENDERS[i].url) return ZENDERS[i];
        // MA herschrijft kale URL's naar builtin://radio/<url> (live gezien 3 nov):
        // het originele adres staat dan als achtervoegsel in de content-id.
        if (a.media_content_id && String(a.media_content_id).slice(-ZENDERS[i].url.length) === ZENDERS[i].url) return ZENDERS[i];
        if (a.media_title && String(a.media_title) === ZENDERS[i].naam) return ZENDERS[i];
      }
      return null;
    }
    _tekenRadio() {
      var zNu = this._actieveZender();
      var root = this.shadowRoot;
      if (!root) return;
      Array.prototype.forEach.call(root.querySelectorAll("[data-zender]"), function (tile) {
        var z = ZENDERS[parseInt(tile.getAttribute("data-zender"), 10)];
        var actief = !!zNu && zNu.url === z.url;
        tile.classList.toggle("actief", actief);
        var st = tile.querySelector("[data-rstatus]");
        if (st) st.classList.toggle("speelt", actief);
        var eq = tile.querySelector("[data-req]");
        if (eq) eq.classList.toggle("aan", actief);
        var tx = tile.querySelector("[data-rtekst]");
        if (tx) tx.textContent = actief ? "Speelt" : "Radio";
      });
    }
    _tekenSpelers() {
      var self = this;
      var root = this.shadowRoot;
      if (!root || !this._hass) return;
      var gekozen = this._spelerObj();
      this._el.spnumono.textContent = gekozen.mono;
      this._el.spnumono.className = "spmono" + (gekozen.vierkant ? "" : " rond");
      this._el.spnunaam.textContent = gekozen.naam;
      var gs = this._sp();
      var gstaat = gs ? gs.state : "unavailable";
      this._el.spnustatus.textContent = gstaat === "playing" ? "Speelt nu" :
        gstaat === "unavailable" || gstaat === "unknown" ? "Niet bereikbaar" : "Geselecteerd";
      this._el.ondertitel.textContent = "Music Assistant · " + gekozen.naam;
      this._el.sbspeler.innerHTML = "Speelt op <b>" + esc(gekozen.naam) + "</b>";
      Array.prototype.forEach.call(root.querySelectorAll("[data-speler]"), function (rij) {
        var p = SPELERS[parseInt(rij.getAttribute("data-speler"), 10)];
        var st = self._hass.states[p.id];
        var staat = st ? st.state : "unavailable";
        rij.classList.toggle("gekozen", p.id === self._speler);
        rij.classList.toggle("weg", staat === "unavailable" || staat === "unknown");
        var tx = rij.querySelector("[data-spstatus]");
        if (tx) {
          tx.textContent = (staat === "unavailable" || staat === "unknown") ? "Niet bereikbaar"
            : p.type + (staat === "playing" ? " · speelt" : "");
        }
      });
    }
    _updateBar() {
      var el = this._el;
      var s = this._sp();
      var a = s ? s.attributes : {};
      var staat = s ? s.state : "unavailable";
      var weg = staat === "unavailable" || staat === "unknown";
      var speelt = staat === "playing" || staat === "buffering";
      var zNu = this._actieveZender();
      // Artwork
      var pic = !weg && a.entity_picture ? String(a.entity_picture) : "";
      var picKey = pic ? pic.split("?")[0] : "";
      if (pic && !this._badPics[picKey]) {
        el.sbart.innerHTML = '<img src="' + esc(pic) + '" alt="">';
        var img = el.sbart.querySelector("img");
        var self = this;
        img.onerror = function () {
          self._badPics[picKey] = true;
          self._barSig = null;
          self._updateBar();
        };
      } else {
        el.sbart.innerHTML = '<span class="mono">' + (zNu ? zNu.kort : this._spelerObj().mono) + "</span>";
      }
      // Teksten
      if (weg) {
        el.sbbron.textContent = "";
        el.sbtitel.textContent = "Music Assistant niet bereikbaar";
        el.sbartiest.textContent = "Controleer de verbinding";
      } else if (!a.media_title && (staat === "off" || staat === "idle")) {
        el.sbbron.textContent = "";
        el.sbtitel.textContent = staat === "off" ? "Speler staat uit" : "Niets aan het spelen";
        el.sbartiest.textContent = "Kies een zender of zoek iets op";
      } else {
        el.sbbron.textContent = staat === "buffering" ? "Bufferen" :
          zNu ? "Radio" : "Music Assistant";
        el.sbtitel.textContent = a.media_title || this._spelerObj().naam;
        var onder = [];
        if (a.media_artist) onder.push(a.media_artist);
        if (a.media_album_name) onder.push(a.media_album_name);
        if (!onder.length && zNu) onder.push("Live radio");
        else if (!onder.length && a.app_name) onder.push(a.app_name);
        el.sbartiest.textContent = onder.join(" · ");
      }
      // Transport
      el.hoofdknop.innerHTML = speelt
        ? '<span class="pauze"><i></i><i></i></span>'
        : '<span class="drie"></span>';
      var feats = typeof a.supported_features === "number" ? a.supported_features : 0;
      el.hoofdknop.classList.toggle("dicht", weg);
      el.skipprev.classList.toggle("dicht", weg || staat === "off" || !(feats & 16));
      el.skipnext.classList.toggle("dicht", weg || staat === "off" || !(feats & 32));
      el.demp.classList.toggle("dicht", weg);
      el.demp.classList.toggle("actief", a.is_volume_muted === true);
      el.demp.textContent = a.is_volume_muted === true ? "Gedempt" : "Dempen";
      this._tekenVoortgang();
    }
    _tekenVoortgang() {
      var s = this._sp();
      var a = s ? s.attributes : {};
      var staat = s ? s.state : "unavailable";
      var dur = typeof a.media_duration === "number" ? a.media_duration : null;
      var mode = "geen";
      if ((staat === "playing" || staat === "paused") && dur && dur > 0) mode = "prog";
      else if (staat === "playing" || staat === "buffering") mode = "live";
      var sig = mode + "|" + dur;
      if (sig === this._vgSig) { this._tickVoortgang(); return; }
      this._vgSig = sig;
      if (mode === "prog") {
        this._el.voortgang.innerHTML =
          '<span class="vtijd" id="vg-l">0:00</span><div class="vtrack"><div class="vfill" id="vg-f" style="width:0%"></div></div><span class="vtijd rechts" id="vg-r">' + mmss(dur) + "</span>";
      } else if (mode === "live") {
        this._el.voortgang.innerHTML = '<div class="vlive" style="flex:1">Live radio</div>';
      } else {
        this._el.voortgang.innerHTML = '<div class="vlive" style="flex:1"></div>';
      }
      this._tickVoortgang();
    }
    _tickVoortgang() {
      if (!this._built || !this._el) return;
      var root = this.shadowRoot;
      var f = root.getElementById("vg-f");
      if (!f) return;
      var s = this._sp();
      if (!s) return;
      var a = s.attributes;
      var dur = typeof a.media_duration === "number" ? a.media_duration : 0;
      if (!dur) return;
      var pos = typeof a.media_position === "number" ? a.media_position : 0;
      if (s.state === "playing" && a.media_position_updated_at) {
        var t = new Date(a.media_position_updated_at).getTime();
        if (isFinite(t)) pos += (Date.now() - t) / 1000;
      }
      pos = Math.max(0, Math.min(dur, pos));
      f.style.width = (dur > 0 ? (pos / dur) * 100 : 0) + "%";
      var l = root.getElementById("vg-l");
      if (l) l.textContent = mmss(pos);
    }
    _effVol() {
      if (this._volSleep != null) return this._volSleep;
      if (this._volLocal && Date.now() < this._volLocal.until) return this._volLocal.val;
      var s = this._sp();
      var v = s && typeof s.attributes.volume_level === "number" ? s.attributes.volume_level : null;
      return v;
    }
    _tekenVolume() {
      var el = this._el;
      var s = this._sp();
      var staat = s ? s.state : "unavailable";
      var weg = staat === "unavailable" || staat === "unknown";
      var vol = this._effVol();
      el.volpct.textContent = vol === null ? "--" : Math.round(vol * 100) + "%";
      var n = vol === null ? 0 : Math.round(vol * 10);
      Array.prototype.forEach.call(el.volseg.querySelectorAll("i"), function (seg, i) {
        seg.classList.toggle("vol", i < n);
      });
      el.volmin.classList.toggle("dicht", weg);
      el.volplus.classList.toggle("dicht", weg);
      el.volseg.classList.toggle("dicht", weg);
    }
    _speelPauze() {
      var nu = Date.now();
      if (nu - this._playLock < 1500) return;
      var s = this._sp();
      if (!s || s.state === "unavailable" || s.state === "unknown") return;
      this._playLock = nu;
      if (s.state === "off") {
        this._call("media_player", "turn_on", {}, { entity_id: this._speler });
        return;
      }
      this._call("media_player", "media_play_pause", {}, { entity_id: this._speler });
    }
    _skip(dir) {
      var s = this._sp();
      if (!s || s.state === "off" || s.state === "unavailable" || s.state === "unknown") return;
      var feats = typeof s.attributes.supported_features === "number" ? s.attributes.supported_features : 0;
      if (dir < 0 && !(feats & 16)) return;
      if (dir > 0 && !(feats & 32)) return;
      this._call("media_player", dir < 0 ? "media_previous_track" : "media_next_track",
        {}, { entity_id: this._speler });
    }
    _volStap(delta) {
      var cur = this._effVol();
      if (cur === null) return;
      var nieuw = Math.min(1, Math.max(0, Math.round((cur + delta) * 100) / 100));
      if (nieuw === cur) return;
      this._volLocal = { val: nieuw, until: Date.now() + 8000 };
      this._volSig = null;
      this._tekenVolume();
      this._call("media_player", "volume_set", { volume_level: nieuw }, { entity_id: this._speler });
    }
    _bindVolSeg() {
      var self = this, el = this._el.volseg, bezig = false;
      function fractie(ev) {
        var r = el.getBoundingClientRect();
        return Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      }
      el.addEventListener("pointerdown", function (ev) {
        var s = self._sp();
        if (!s || s.state === "unavailable" || s.state === "unknown") return;
        ev.preventDefault();
        try { el.setPointerCapture(ev.pointerId); } catch (e) {}
        bezig = true;
        self._volSleep = fractie(ev);
        self._volSig = null;
        self._tekenVolume();
      });
      el.addEventListener("pointermove", function (ev) {
        if (!bezig) return;
        self._volSleep = fractie(ev);
        self._volSig = null;
        self._tekenVolume();
      });
      function klaar(commit) {
        if (!bezig) return;
        bezig = false;
        var v = self._volSleep;
        self._volSleep = null;
        if (commit && v != null) {
          var afgerond = Math.round(v * 100) / 100;
          self._volLocal = { val: afgerond, until: Date.now() + 8000 };
          self._call("media_player", "volume_set", { volume_level: afgerond }, { entity_id: self._speler });
        }
        self._volSig = null;
        self._tekenVolume();
      }
      el.addEventListener("pointerup", function () { klaar(true); });
      el.addEventListener("pointercancel", function () { klaar(false); });
    }

    /* ---------- Bladeren ---------- */
    _cacheSleutel(item) {
      return this._speler + "|" + (item.media_content_type || "") + "|" + (item.media_content_id || "");
    }
    _cacheZet(sleutel, waarde) {
      if (this._cache.size >= 50) {
        var eerste = this._cache.keys().next().value;
        if (eerste) this._cache.delete(eerste);
      }
      this._cache.set(sleutel, { t: Date.now(), v: waarde });
    }
    _cacheHaal(sleutel) {
      var e = this._cache.get(sleutel);
      if (!e) return null;
      if (Date.now() - e.t > 300000) { this._cache.delete(sleutel); return null; }
      return e.v;
    }
    _laadRoot() {
      var self = this;
      var speler = this._speler;
      this._rootBezig = true;
      this._ws({ type: "media_player/browse_media", entity_id: speler }, 15000)
        .then(function (res) {
          self._rootBezig = false;
          if (!self.isConnected || self._speler !== speler) return;
          self._rootVoor = speler;
          self._rootNode = res;
          self._cacheZet(self._cacheSleutel({ media_content_type: "", media_content_id: "" }), res);
          self._tekenTegels(res);
        })
        .catch(function () {
          self._rootBezig = false;
          if (!self.isConnected || self._speler !== speler) return;
          self._el.bronfout.style.display = "";
          self._el.bronfout.innerHTML = "<b>Bronnen laden is niet gelukt.</b> Music Assistant antwoordt niet. Tik op een tegel of zoek iets om het opnieuw te proberen.";
          self._el.tegels.innerHTML = "";
        });
    }
    _tekenTegels(rootRes) {
      var kinderen = (rootRes && rootRes.children) || [];
      var perTitel = {};
      kinderen.forEach(function (c) { perTitel[String(c.title || "").toLowerCase()] = c; });
      var html = "";
      var self = this;
      this._tegelNodes = [];
      CATS.forEach(function (cat) {
        var node = perTitel[cat.sleutel];
        if (!node) return;
        var id = String(node.media_content_id || "");
        // App-bronnen verbergen, behalve Radio Browser (enige werkende radiobibliotheek in de boom)
        if (id.indexOf("media-source://") === 0 && id.indexOf("media-source://radio_browser") !== 0) return;
        if (!node.can_expand && !node.can_play) return;
        var idx = self._tegelNodes.length;
        self._tegelNodes.push(node);
        html += '<div class="tegel" data-tegel="' + idx + '"><div class="rmono">' + cat.mono + '</div>' +
          '<div class="ttegelnaam">' + esc(cat.nl) + '</div><div class="tchev"></div></div>';
      });
      this._el.tegels.innerHTML = html;
      this._el.bronfout.style.display = "none";
      Array.prototype.forEach.call(this._el.tegels.querySelectorAll("[data-tegel]"), function (t) {
        t.addEventListener("click", function () {
          var node = self._tegelNodes[parseInt(t.getAttribute("data-tegel"), 10)];
          if (node) { self._stack = []; self._openNode(node); }
        });
      });
    }
    _toonLijst(titel) {
      this._view = "lijst";
      this._el.viewhome.style.display = "none";
      this._el.viewlijst.style.display = "flex";
      this._el.wtitel.textContent = titel || "";
    }
    _naarHome() {
      this._view = "home";
      this._stack = [];
      this._el.viewlijst.style.display = "none";
      this._el.viewhome.style.display = "";
      if (this._rootVoor !== this._speler && !this._rootBezig) this._laadRoot();
    }
    _openNode(node) {
      var self = this;
      this._toonLijst(node.title || "Bladeren");
      var sleutel = this._cacheSleutel(node);
      var gecached = this._cacheHaal(sleutel);
      if (gecached) {
        this._browseSeq++;
        this._tekenLijst(node, gecached, null);
        return;
      }
      var seq = ++this._browseSeq;
      var speler = this._speler;
      this._el.wcontext.textContent = "Laden…";
      this._el.laadstrook.classList.add("aan");
      var payload = { type: "media_player/browse_media", entity_id: speler };
      if (node.media_content_id) {
        payload.media_content_id = node.media_content_id;
        payload.media_content_type = node.media_content_type;
      }
      this._ws(payload, 15000)
        .then(function (res) {
          if (seq !== self._browseSeq || self._speler !== speler || !self.isConnected) return;
          self._el.laadstrook.classList.remove("aan");
          self._cacheZet(sleutel, res);
          self._tekenLijst(node, res, null);
        })
        .catch(function () {
          if (seq !== self._browseSeq || self._speler !== speler || !self.isConnected) return;
          self._el.laadstrook.classList.remove("aan");
          self._tekenLeeg("fout", node);
        });
    }
    _tekenLijst(node, res, groepen) {
      var el = this._el;
      el.wtitel.textContent = node.title || "";
      this._listItem = node;
      this._listBron = { node: node, res: res, groepen: groepen || null };
      var items = [];
      if (groepen) {
        groepen.forEach(function (g) {
          items.push({ groep: g.naam });
          g.items.forEach(function (it) { items.push(it); });
        });
      } else {
        items = ((res && res.children) || []).filter(function (c) {
          var id = String(c.media_content_id || "");
          if (!c.can_play && !c.can_expand) return false;
          if (id.indexOf("media-source://") === 0 && id.indexOf("media-source://radio_browser") !== 0) return false;
          return true;
        });
      }
      this._listFull = items;
      this._listToon = MAX_TOON;
      if (!items.length) {
        var isRadio = String(node.title || "").toLowerCase().indexOf("radio") >= 0;
        this._tekenLeeg(isRadio ? "radioleeg" : "leeg", node);
        el.wcontext.textContent = "0 items";
        return;
      }
      el.wcontext.textContent = items.filter(function (i) { return !i.groep; }).length + " items";
      this._tekenRijen();
    }
    _rijHtml(it, idx) {
      if (it.groep) return '<div class="groepskop">' + esc(it.groep) + "</div>";
      var klasse = KLASSE_NL[it.media_class] || (it.media_class ? it.media_class : "Item");
      var sub = it._sub || klasse;
      var thumb = "";
      var rond = it.media_class === "artist" ? " rond" : "";
      if (it.thumbnail && !this._badPics["t:" + it.thumbnail]) {
        thumb = '<img loading="lazy" src="' + esc(it.thumbnail) + '" alt="" data-thumb="' + idx + '">';
      } else {
        thumb = '<span class="mono">' + esc(monoVan(it.title)) + "</span>";
      }
      var rechts = "";
      if (it.can_play) rechts += '<span class="rspeel" data-speel="' + idx + '"><span class="drie"></span></span>';
      if (it.can_expand) rechts += '<span class="rchev" data-open="' + idx + '"></span>';
      return '<div class="rij" data-rij="' + idx + '"><div class="rthumb' + rond + '">' + thumb + '</div>' +
        '<div class="rtekst"><div class="rtitel">' + esc(it.title) + '</div>' +
        '<div class="ronder">' + esc(sub) + '</div></div>' +
        '<div class="rrechts"><span class="eq" data-rijeq="' + idx + '"><i></i><i></i><i></i></span>' + rechts + "</div></div>";
    }
    _tekenRijen() {
      var self = this;
      var el = this._el;
      var scrollBewaar = el.lijst.scrollTop;
      var items = this._listFull.slice(0, this._listToon);
      var html = items.map(function (it, i) { return self._rijHtml(it, i); }).join("");
      if (this._listFull.length > this._listToon) {
        html += '<div class="meer" id="meerknop">Meer tonen (' + (this._listFull.length - this._listToon) + " over)</div>";
      }
      el.lijst.innerHTML = html;
      el.lijst.scrollTop = scrollBewaar;
      Array.prototype.forEach.call(el.lijst.querySelectorAll("img[data-thumb]"), function (img) {
        img.onerror = function () {
          var it = self._listFull[parseInt(img.getAttribute("data-thumb"), 10)];
          if (it && it.thumbnail) self._badPics["t:" + it.thumbnail] = true;
          var houder = img.parentNode;
          if (houder && it) houder.innerHTML = '<span class="mono">' + esc(monoVan(it.title)) + "</span>";
        };
      });
      var meer = el.lijst.querySelector("#meerknop");
      if (meer) meer.addEventListener("click", function () {
        self._listToon += MAX_TOON;
        self._tekenRijen();
      });
      Array.prototype.forEach.call(el.lijst.querySelectorAll("[data-rij]"), function (rij) {
        rij.addEventListener("click", function (ev) {
          var idx = parseInt(rij.getAttribute("data-rij"), 10);
          var it = self._listFull[idx];
          if (!it || it.groep) return;
          var openKnop = ev.target && ev.target.closest ? ev.target.closest("[data-open]") : null;
          if (openKnop && it.can_expand) { self._dieper(it); return; }
          if (it.can_play) { self._speelItem(it); return; }
          if (it.can_expand) self._dieper(it);
        });
      });
    }
    _dieper(it) {
      this._stack.push(this._listItem);
      this._openNode({ title: it.title, media_content_id: it.media_content_id, media_content_type: it.media_content_type });
    }
    _terug() {
      if (this._stack.length) {
        var vorige = this._stack.pop();
        if (vorige && vorige._zoek) { this._naarHome(); return; }
        if (vorige) { this._openNode(vorige); return; }
      }
      this._naarHome();
    }
    _tekenLeeg(soort, node) {
      var el = this._el;
      var titel = "Nog niets hier";
      var uitleg = "Deze categorie is nog leeg in Music Assistant.";
      var knop = '<span class="lknop grijs" id="leegterug">Terug naar overzicht</span>';
      if (soort === "radioleeg") {
        uitleg = "Er staan nog geen radiozenders in Music Assistant. Voeg TuneIn of Radio Browser toe als bron in Music Assistant, dan vult deze lijst zich vanzelf. De vijf snelkeuze-zenders op het beginscherm werken altijd.";
      } else if (soort === "zoekleeg") {
        titel = "Geen resultaten";
        uitleg = "Probeer een andere zoekterm. Zolang er geen muziekbron in Music Assistant staat, blijft zoeken leeg.";
      } else if (soort === "fout") {
        titel = "Laden is niet gelukt";
        uitleg = "Music Assistant antwoordde niet op tijd. De speelbalk en de radio blijven gewoon werken.";
        knop = '<span class="lknop" id="leegopnieuw">Opnieuw proberen</span> <span class="lknop grijs" id="leegterug">Terug</span>';
      }
      el.lijst.innerHTML = '<div class="leeg"><div class="ltitel">' + titel + '</div><div class="luitleg">' + uitleg + "</div>" + knop + "</div>";
      el.wcontext.textContent = "";
      var self = this;
      var t = el.lijst.querySelector("#leegterug");
      if (t) t.addEventListener("click", function () { self._terug(); });
      var o = el.lijst.querySelector("#leegopnieuw");
      if (o) o.addEventListener("click", function () {
        if (node && node._zoek) self._zoekNu();
        else if (node) { self._cache.delete(self._cacheSleutel(node)); self._openNode(node); }
      });
    }
    /* ---------- Zoeken ---------- */
    _planZoek() {
      var self = this;
      if (this._zoekTimer) clearTimeout(this._zoekTimer);
      this._zoekTimer = setTimeout(function () { self._zoekTimer = null; self._zoekNu(); }, 500);
    }
    _zoekNu() {
      var q = (this._zoektekst || "").trim();
      if (q.length < 2) { if (this._view === "lijst") this._naarHome(); return; }
      var self = this;
      var seq = ++this._searchSeq;
      var speler = this._speler;
      var zoekNode = { title: "Zoeken: " + q, _zoek: true, _q: q };
      this._stack = [];
      this._toonLijst(zoekNode.title);
      this._el.wcontext.textContent = "Zoeken…";
      this._el.laadstrook.classList.add("aan");
      // Primaire route: music_assistant.search (gegroepeerd, begrensd)
      var belofte;
      try {
        belofte = this._hass.callService("music_assistant", "search",
          { config_entry_id: MA_ENTRY, name: q, limit: 8, library_only: false }, undefined, false, true);
      } catch (e) { belofte = null; }
      if (!belofte || !belofte.then) belofte = Promise.reject(new Error("geen service"));
      this._metTimeout(belofte, 12000)
        .then(function (res) {
          if (seq !== self._searchSeq || self._speler !== speler || !self.isConnected) return;
          var r = (res && res.response) || {};
          var groepen = [];
          ["tracks", "albums", "artists", "playlists", "radio", "podcasts", "audiobooks"].forEach(function (g) {
            var items = (r[g] || []).map(function (it) {
              var sub = "";
              if (it.artists && it.artists.length) sub = it.artists.map(function (x) { return x.name; }).join(", ");
              if (it.album && it.album.name) sub = sub ? sub + " · " + it.album.name : it.album.name;
              var soort = g === "radio" ? "radio" : g.slice(0, -1);
              return {
                title: it.name || "",
                media_class: KLASSE_NL[soort] ? soort : "track",
                _sub: sub || (KLASSE_NL[soort] || "Item"),
                thumbnail: it.image || null,
                can_play: true, can_expand: false,
                _uri: it.uri, _type: soort
              };
            });
            if (items.length) groepen.push({ naam: GROEP_NL[g] || g, items: items });
          });
          self._el.laadstrook.classList.remove("aan");
          if (!groepen.length) { self._tekenLijst(zoekNode, null, []); self._tekenLeeg("zoekleeg", zoekNode); return; }
          self._tekenLijst(zoekNode, null, groepen);
        })
        .catch(function () {
          if (seq !== self._searchSeq || self._speler !== speler || !self.isConnected) return;
          // Terugval: WS search_media (plat, items direct speelbaar)
          self._ws({ type: "media_player/search_media", entity_id: speler, search_query: q }, 10000)
            .then(function (res) {
              if (seq !== self._searchSeq || self._speler !== speler || !self.isConnected) return;
              self._el.laadstrook.classList.remove("aan");
              var items = (res && res.result) || [];
              if (!items.length) { self._tekenLijst(zoekNode, null, []); self._tekenLeeg("zoekleeg", zoekNode); return; }
              self._tekenLijst(zoekNode, { children: items }, null);
            })
            .catch(function () {
              if (seq !== self._searchSeq || self._speler !== speler || !self.isConnected) return;
              self._el.laadstrook.classList.remove("aan");
              self._tekenLeeg("fout", zoekNode);
            });
        });
    }
    /* ---------- Afspelen ---------- */
    _speelItem(it) {
      if (it._uri) {
        this._call("music_assistant", "play_media",
          { media_id: it._uri, media_type: it._type || undefined, enqueue: "replace" },
          { entity_id: this._speler });
        return;
      }
      this._call("media_player", "play_media",
        { media_content_id: it.media_content_id, media_content_type: it.media_content_type, enqueue: "replace" },
        { entity_id: this._speler });
    }
    _speelZender(z) {
      this._call("media_player", "play_media",
        { media_content_id: z.url, media_content_type: "music", enqueue: "replace" },
        { entity_id: this._speler });
    }
    _kiesSpeler(id) {
      if (id === this._speler) return;
      this._speler = id;
      this._browseSeq++;
      this._searchSeq++;
      this._cache.clear();
      this._stack = [];
      this._rootVoor = "";
      this._volLocal = null;
      this._barSig = null;
      this._volSig = null;
      this._spelerSig = null;
      this._zenderSig = null;
      this._naarHome();
      this._laadRoot();
      if (this._hass) {
        var h = this._hass;
        this._hass = null;
        this.hass = h;
      }
    }
    disconnectedCallback() {
      if (this._ro) this._ro.disconnect();
      if (this._onResize) window.removeEventListener("resize", this._onResize);
      if (this._klokTimer) clearInterval(this._klokTimer);
      if (this._tickTimer) clearInterval(this._tickTimer);
      if (this._zoekTimer) clearTimeout(this._zoekTimer);
    }
  }

  if (!customElements.get("muziekbord-card")) {
    customElements.define("muziekbord-card", MuziekBord2Card);
    window.customCards = window.customCards || [];
    window.customCards.push({ type: "muziekbord-card", name: "Muziekbord", preview: false });
  }
})();
