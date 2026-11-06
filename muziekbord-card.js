/*
  Muziekbord v2.6.0 - Spotify-covers op de playlisttegels (live van
  Spotify's CDN, met de bibliotheekhoes als terugval) plus Spotify-
  styling (gedraaid hoesje met schaduw) en een vijftiende tegel:
  Hot Hits NL (cover van Spotify, speelt de Top 40 NL-benadering).
  Muziekbord v2.5.2 - Dance-tegel wijst naar 360 Dance (spiegel van
  Spotify's 360 Dance-lijst) in plaats van de TikTok Dance-lijst.
  Muziekbord v2.5.1 - Kinderdisco-tegel wijst naar de Nederlandse
  minidisco (MINIDISCO | NEDERLANDS) in plaats van de Engelstalige lijst.
  Muziekbord v2.5.0 - sectie "Playlists" met 14 categorietegels in
  Spotify-zoekschermstijl (o.a. Hitlijsten, Kids & familie, Kinderdisco,
  Foute Party, 90s en 00s). Elke tegel speelt de bibliotheekversie uit
  Music Assistant als die er is, anders de bronlijst. De home-weergave
  scrollt nu verticaal zodat alle secties passen.
  Muziekbord v2.4.2 - Efteling Kids Radio wijst nu naar de echte stream
  (media.hostin.live; de oude streamtheworld-mount speelt een Top 40-zender)
  en heeft het echte Efteling-logo (radiotime-CDN).
  Muziekbord v2.4.1 - als v2.4, plus RADIONL Kids als tweede vaste zender
  (met TuneIn-logo; vaste zenders kunnen nu een eigen logoplaatje dragen).
  Muziekbord v2.4 - Spotify-appstijl, volwassen uitgewerkt (route A, 4 nov 2026).
  Zwart canvas (#000), chips als enige categorienavigatie (actief alleen als
  de categorie echt bestaat; ontbrekende categorieen worden grijs), snelkeuze
  als compact raster van 3 kolommen (MA-radiofavorieten, max 6, aangevuld met
  vaste zenders zodat het raster vol is; logo met letterterugval erachter),
  sectie "Iets voor jou" met echte bibliotheekitems (albums, anders
  afspeellijsten; verborgen als de bibliotheek leeg is), zwevende afgeronde
  speelbalk met dun voortgangslijntje aan de onderrand (volumeknoppen en
  slider uit v2.3 behouden), rechterpaneel "Afspelen op" blijft.
  Grote speler (tik op de hoes) en alle v2.3-werking (zoeken via
  music_assistant.search, bladeren via browse_media, races/seq-bewaking,
  speel-lock, optimistisch volume) zijn ongewijzigd overgenomen.
*/
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
    background:#000000; color:#ffffff; overflow:hidden; -webkit-font-smoothing:antialiased;
  }
  /* Kop */
  .kop{ position:absolute; left:44px; right:44px; top:30px; display:flex;
    justify-content:space-between; align-items:flex-start; }
  .titel{ font-size:44px; font-weight:700; color:#ffffff; }
  .ondertitel{ font-size:18px; color:#b3b3b3; margin-top:4px; }
  .klok{ text-align:right; }
  .klok .tijd{ font-size:34px; font-weight:750; font-variant-numeric:tabular-nums; color:#ffffff; line-height:1.05; }
  .klok .datum{ font-size:16px; color:#b3b3b3; margin-top:3px; text-transform:capitalize; }
  /* Hoofdgebied */
  .hoofd{ position:absolute; left:44px; right:44px; top:126px; height:756px; display:flex; gap:28px; }
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
  .zoekknop{ display:none; }
  .zoekknop:active{ transform:scale(.94); }
  .zoekknop .loep i{ border-color:#000000; }
  .zoekknop .loep b{ background:#000000; }
  .laadstrook{ height:4px; flex:none; border-radius:99px; background:transparent; margin-top:10px; }
  .laadstrook.aan{ background:${GROEN}; opacity:.75; }
  /* Secties */
  .sectiekop{ display:flex; justify-content:space-between; align-items:baseline; margin-top:22px; }
  .sectiekop .sk-titel{ font-size:28px; font-weight:700; color:#ffffff; }
  .sectiekop .sk-context{ font-size:17px; color:#b3b3b3; }
  /* Snelkeuzeraster (appstijl) */
  .rstatus{ position:absolute; top:20px; right:18px; font-size:15px; font-weight:600; color:#b3b3b3;
    display:flex; align-items:center; gap:7px; }
  .rstatus.speelt{ color:${GROEN}; font-weight:700; }
  .eq{ display:none; align-items:flex-end; gap:2.5px; height:13px; }
  .eq i{ width:3.5px; background:${GROEN}; border-radius:2px; display:block; }
  .eq i:nth-child(1){ height:13px; } .eq i:nth-child(2){ height:8px; } .eq i:nth-child(3){ height:11px; }
  .eq.aan{ display:flex; }
  .rnaam{ font-size:19px; font-weight:700; line-height:1.18; color:#ffffff; margin-top:10px;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
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
  .spelerpaneel{ background:#181818; border:none; border-radius:20px;
    padding:22px 24px; height:100%; display:flex; flex-direction:column; }
  .spkop{ font-size:27px; font-weight:700; color:#ffffff; }
  .spmono{ width:58px; height:58px; flex:none; border-radius:12px; background:#3a3a3a; color:#ffffff;
    font-size:19px; font-weight:800; display:flex; align-items:center; justify-content:center; }
  .spmono.rond{ border-radius:50%; }
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
  .speelbalk{ position:absolute; left:24px; right:24px; top:892px; height:158px;
    background:#262626; border:1px solid #343434; border-radius:18px; box-shadow:0 14px 34px rgba(0,0,0,.5);
    display:flex; align-items:center; padding:0 26px; gap:28px; }
  .speelbalk .voortgang{ position:absolute; left:22px; right:22px; bottom:12px; margin:0; }
  .speelbalk .vtijd{ display:none; }
  .speelbalk .vtrack{ height:5px; border-radius:3px; }
  .speelbalk .vfill{ border-radius:3px; }
  .sb-links{ width:520px; flex:none; display:flex; align-items:center; gap:20px; min-width:0; }
  .sbart{ width:104px; height:104px; flex:none; border-radius:10px; overflow:hidden;
    background:#282828; display:flex; align-items:center; justify-content:center; }
  .sbart img{ width:100%; height:100%; object-fit:cover; display:block; }
  .sbart .mono{ font-size:34px; font-weight:800; color:#ffffff; }
  .sbmeta{ flex:1; min-width:0; }
  .sbbron{ font-size:14.5px; font-weight:700; letter-spacing:.12em; color:#b3b3b3;
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
  .volknop{ width:62px; height:62px; flex:none; border-radius:50%; background:#282828;
    border:1px solid #3a3a3a; color:#ffffff; font-size:27px; display:flex; align-items:center;
    justify-content:center; cursor:pointer; user-select:none; }
  .volknop:active{ transform:scale(.92); }
  .volknop.dicht, .volspoor.dicht, .demp.dicht{ opacity:.35; pointer-events:none; }
  .volspoor{ position:relative; flex:1; height:56px; cursor:pointer; touch-action:none; }
  .volspoor .spoor{ position:absolute; left:0; right:0; top:25px; height:6px; border-radius:3px; background:#343434; }
  .volspoor .vul{ position:absolute; left:0; top:25px; height:6px; border-radius:3px; background:${GROEN}; width:0%; }
  .volspoor .knop{ position:absolute; top:28px; width:22px; height:22px; border-radius:50%; background:#ffffff;
    transform:translate(-50%,-50%); box-shadow:0 2px 8px rgba(0,0,0,.45); left:0%; }
  .volpct{ width:62px; flex:none; text-align:right; font-size:20px; font-weight:700;
    font-variant-numeric:tabular-nums; color:#ffffff; }
  /* Navigatiebalk, gelijk aan de andere borden, actief is hier groen */
  .pnav{ position:absolute; left:50%; transform:translateX(-50%); bottom:26px; display:flex; gap:8px; z-index:4;
    background:rgba(16,17,20,.85); border:1px solid rgba(255,255,255,.09); border-radius:999px; padding:7px; }
  .pnav a{ font-size:21px; color:#d6d6d2; text-decoration:none; padding:11px 30px; border-radius:999px;
    border:1px solid transparent; }
  .pnav a.active{ background:${GROEN}; color:#000000; font-weight:650; border-color:${GROEN}; }
  /* v2.4-proef: Spotify-appstijl (chips, rasterkaarten, hoesrij) */
  .chips{ display:flex; gap:12px; margin:20px 0 2px; flex:none; }
  .chip{ padding:13px 28px; border-radius:999px; background:#232323; color:#ffffff;
    font-size:19px; font-weight:600; cursor:pointer; user-select:none; white-space:nowrap; }
  .chip.actief{ background:${GROEN}; color:#000000; }
  .chip.uit{ opacity:.38; cursor:default; }
  .raster{ display:grid; grid-template-columns:repeat(3, 1fr); gap:14px; margin-top:14px; }
  .rkort{ display:flex; align-items:center; background:#232323; border-radius:12px; height:98px;
    overflow:hidden; cursor:pointer; position:relative; padding-right:18px; user-select:none; }
  .rkort:active{ background:#2e2e2e; }
  .rkort.actief{ background:#2e2e2e; outline:2px solid ${GROEN}; outline-offset:-2px; }
  .rkort .rart{ width:98px; height:98px; flex:none; background:#333333; display:flex;
    align-items:center; justify-content:center; font-size:26px; font-weight:800;
    overflow:hidden; position:relative; }
  .rkort .rart img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
  .rkort .rnaam{ margin:0 0 0 18px; font-size:21px; font-weight:600; display:block;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .rkort .rstatus{ position:static; margin-left:auto; flex:none; }
  .hoesrij{ display:flex; gap:20px; margin-top:14px; overflow:hidden; }
  .hoes{ width:190px; flex:none; cursor:pointer; user-select:none; }
  .hoes .hart{ width:190px; height:190px; border-radius:14px; background:#232323; display:flex;
    align-items:center; justify-content:center; overflow:hidden; position:relative; }
  .hoes .hart img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
  .hoes .hart .mono{ font-size:46px; font-weight:800; color:#ffffff; }
  .hoes .hnaam{ margin-top:12px; font-size:20px; font-weight:600; color:#ffffff;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .hoes .hsub{ font-size:16px; color:#b3b3b3; margin-top:3px; }
  /* v2.5: home scrollt verticaal; playlist-categorietegels */
  #viewhome{ flex:1; min-height:0; overflow-y:auto; overscroll-behavior:contain; scrollbar-width:none; }
  #viewhome::-webkit-scrollbar{ display:none; }
  .plraster{ display:grid; grid-template-columns:repeat(3, 1fr); gap:14px; margin-top:14px; }
  .pltegel{ position:relative; height:84px; border-radius:12px; overflow:hidden;
    cursor:pointer; user-select:none; display:flex; align-items:center; }
  .pltegel:active{ filter:brightness(1.18); }
  .plnaam{ position:relative; z-index:1; margin:0 96px 0 18px; font-size:21px; font-weight:700;
    color:#ffffff; line-height:1.18; display:-webkit-box; -webkit-line-clamp:2;
    -webkit-box-orient:vertical; overflow:hidden; }
  .plart{ position:absolute; right:4px; top:50%; width:74px; height:74px; flex:none;
    transform:translateY(-50%) rotate(25deg); border-radius:6px;
    box-shadow:0 10px 20px rgba(0,0,0,.45);
    background:rgba(0,0,0,.22); display:flex; align-items:center; justify-content:center;
    overflow:hidden; }
  .plart img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
  .plart .mono{ font-size:26px; font-weight:800; color:#ffffff; }
  /* Grote speler (overlay, opent via de hoes in de speelbalk) */
  .sbart{ cursor:pointer; }
  .groot{ position:absolute; inset:0; background:linear-gradient(180deg,#1e1e1e 0%,#0a0a0a 72%); z-index:6; display:none; }
  .groot.open{ display:flex; }
  .gssluit{ position:absolute; top:36px; left:44px; width:66px; height:66px; border-radius:50%;
    background:#282828; display:flex; align-items:center; justify-content:center; cursor:pointer;
    user-select:none; z-index:2; }
  .gssluit:active{ transform:scale(.94); }
  .gssluit .chev{ width:19px; height:19px; border-left:5px solid #ffffff; border-bottom:5px solid #ffffff;
    transform:rotate(-45deg); margin-top:-7px; }
  .gskop{ position:absolute; top:56px; left:0; right:0; text-align:center; font-size:19px;
    letter-spacing:.16em; color:#b3b3b3; text-transform:uppercase; font-weight:700; }
  .groot-in{ margin:auto; width:1560px; display:flex; gap:68px; align-items:center; }
  .grootart{ width:560px; height:560px; flex:none; border-radius:14px; overflow:hidden;
    background:#282828; display:flex; align-items:center; justify-content:center;
    box-shadow:0 30px 80px rgba(0,0,0,.5); cursor:pointer; }
  .grootart img{ width:100%; height:100%; object-fit:cover; display:block; }
  .grootart .mono{ font-size:120px; font-weight:800; color:#ffffff; }
  .grootrechts{ flex:1; min-width:0; }
  .gstitel{ font-size:45px; font-weight:700; line-height:1.14; color:#ffffff; margin-top:6px;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  .gsartiest{ font-size:25px; color:#b3b3b3; margin-top:9px; white-space:nowrap; overflow:hidden;
    text-overflow:ellipsis; }
  .groot .hoofdknop{ width:96px; height:96px; }
  .groot .hoofdknop .drie{ border-left:32px solid #000000; border-top:21px solid transparent;
    border-bottom:21px solid transparent; margin-left:7px; }
  .groot .hoofdknop .pauze i{ width:12px; height:40px; }
  .groot .skip{ width:74px; height:74px; }
  .groot .vtrack{ height:8px; }
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
          <div class="chips" id="chips"></div>
          <div class="sectiekop"><span class="sk-titel">Snelkeuze</span><span class="sk-context" id="skcontext">Vaste zenders</span></div>
          <div class="raster" id="radiorij"></div>
          <div id="playlists">
            <div class="sectiekop"><span class="sk-titel">Playlists</span><span class="sk-context">Categorieën</span></div>
            <div class="plraster" id="plrij"></div>
          </div>
          <div id="voorjou" style="display:none">
            <div class="sectiekop"><span class="sk-titel">Iets voor jou</span><span class="sk-context">Uit je bibliotheek</span></div>
            <div class="hoesrij" id="voorrij"></div>
          </div>
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
          <div class="sprijen" id="sprijen"></div>
          <div class="spuitleg">De speelbalk onderin stuurt altijd de gekozen speler.</div>
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
      </div>
      <div class="sb-rechts">
        <div class="sb-r-rij">
          <div class="sb-speler" id="sbspeler">Speelt op <b>JBL Bar 800</b></div>
          <div class="demp" id="demp">Dempen</div>
        </div>
        <div class="volrij">
          <div class="volknop" id="volmin">−</div>
          <div class="volspoor" id="volspoor"><div class="spoor"></div><div class="vul"></div><div class="knop"></div></div>
          <div class="volknop" id="volplus">+</div>
          <div class="volpct" id="volpct">--</div>
        </div>
      </div>
      <div class="voortgang" id="voortgang"></div>
    </div>
    <div class="groot" id="grootspeler">
      <div class="gssluit" id="gssluit"><span class="chev"></span></div>
      <div class="gskop">Nu speelt</div>
      <div class="groot-in">
        <div class="grootart" id="gsart"><span class="mono">JBL</span></div>
        <div class="grootrechts">
          <div class="sbbron" id="gsbron"></div>
          <div class="gstitel" id="gstitel">Niets aan het spelen</div>
          <div class="gsartiest" id="gsartiest">Kies een zender of zoek iets op</div>
          <div class="voortgang" id="gsvoortgang" style="margin-top:40px"></div>
          <div class="sbtransport" style="margin-top:32px; gap:46px">
            <div class="skip" id="gsprev"><span class="vorm"><span class="balk"></span><span class="drie-l"></span></span></div>
            <div class="hoofdknop" id="gsplay"><span class="drie"></span></div>
            <div class="skip" id="gsnext"><span class="vorm"><span class="drie-r"></span><span class="balk"></span></span></div>
          </div>
          <div class="volrij" style="margin-top:40px">
            <div class="volknop" id="gsvolmin">−</div>
            <div class="volspoor" id="gsvolspoor"><div class="spoor"></div><div class="vul"></div><div class="knop"></div></div>
            <div class="volknop" id="gsvolplus">+</div>
            <div class="volpct" id="gsvolpct">--</div>
          </div>
          <div class="sb-speler" id="gsspeler" style="margin-top:28px">Speelt op <b>JBL Bar 800</b></div>
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
    { naam: "Efteling Kids Radio", kort: "EK", url: "https://media.hostin.live/audio/efteling.mp3", img: "https://cdn-radiotime-logos.tunein.com/s95494q.png" },
    { naam: "RADIONL Kids", kort: "RK", url: "https://stream.radionlkids.nl/rnlkids", img: "https://cdn-profiles.tunein.com/s301909/images/logod.png" },
    { naam: "NPO Radio 2", kort: "R2", url: "https://icecast.omroep.nl/radio2-bb-mp3" },
    { naam: "NPO 3FM", kort: "3FM", url: "https://icecast.omroep.nl/3fm-bb-mp3" },
    { naam: "Radio 538", kort: "538", url: "https://21223.live.streamtheworld.com/RADIO538.mp3" },
    { naam: "NPO Radio 1", kort: "R1", url: "https://icecast.omroep.nl/radio1-bb-mp3" },
    { naam: "NPO Radio 5", kort: "R5", url: "https://icecast.omroep.nl/radio5-bb-mp3" }
  ];
  // Playlist-categorieen voor de tegels op home (v2.5). "match" is de exacte
  // naam in Music Assistant; staat de lijst in de bibliotheek, dan speelt de
  // tegel die versie (met hoes), anders de bronlijst op "uri" zonder hoes.
  var PLCATS = [
    { label: "Speciaal voor jou", match: "Infinite Mix (favorites)", uri: "library://playlist/8", kleur: "#8d67ab" },
    { label: "Hitlijsten", match: "Radio 538 TOP 50 - 2026", uri: "ytmusic_free--sdHEueeX://playlist/VLPLWP_Fr__lD1e-JxsiS6ObD8kA4I--QG_t", kleur: "#e8115b", cover: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da841cec20a7a8c1ff2fea753b64" },
    { label: "Hot Hits NL", match: "Top 40 2026 - Top 40 Nederland - Top 40 NL & Hot Hits 2026", uri: "ytmusic_free--sdHEueeX://playlist/VLPLBTanuC8SLeZ_9iVo6Rbf4_lBD8S4--h-", kleur: "#0e9f8a", cover: "https://i.scdn.co/image/ab67706f00000002e279c1462bd848974fb5d870" },
    { label: "Kids & familie", match: "Kinderen voor kinderen", uri: "ytmusic_free--sdHEueeX://playlist/VLPL7D004280D118EF61", kleur: "#2d46b9" },
    { label: "Kinderdisco", match: "MINIDISCO | NEDERLANDS", uri: "ytmusic_free--sdHEueeX://playlist/VLPLzDZvvekbRQ2HnvZ_DjE-h8Rzz-0kqU8q", kleur: "#e61e32" },
    { label: "Nieuwe releases", match: "VEVO 2026 New Songs - Music Playlist 2026 - New Music 2026", uri: "ytmusic_free--sdHEueeX://playlist/VLPLRXkxxi5lXuVpVQlSsVxXTQitKXrM0B2E", kleur: "#608108", cover: "https://i.scdn.co/image/ab67706f00000002ba8933f05ef07ab7e97ab049" },
    { label: "Happy beats", match: "Happy songs / Upbeat songs / Feel-good songs / Songs that make you smile, dance", uri: "ytmusic_free--sdHEueeX://playlist/VLPLx2Jv96o522ORh69HaDKClrz2Midqj8AE", kleur: "#f59b23", cover: "https://i.scdn.co/image/ab67706f0000000249a1ed33d2ca64e6a5d0e550" },
    { label: "Foute Party", match: "Foute Party Q-Music 2026", uri: "ytmusic_free--sdHEueeX://playlist/VLPLNOPG6OiFPrfy-nrTga_q2ozRwGlhYSGT", kleur: "#ba5d07" },
    { label: "90s", match: "Greatest 90s Music Hits - Best Songs of 1990 to 2000", uri: "ytmusic_free--sdHEueeX://playlist/VPLYVjGTi85afou-GAHkhC6OgU7Merg0G0B", kleur: "#7358ff" },
    { label: "00s", match: "Early 2000's Throwbacks - Best Songs of Early 00s", uri: "ytmusic_free--sdHEueeX://playlist/VLPLDef6fout0FTkoIXW_DtGHGBtoL7F_JRK", kleur: "#148a08", cover: "https://i.scdn.co/image/ab67706f00000002043bfef44142136749fc2917" },
    { label: "Pop", match: "New Pop Songs 2026 - Pop Music 2026 - New Pop & Pop Songs", uri: "ytmusic_free--sdHEueeX://playlist/VLPLDIoUOhQQPlUDNpjEYTTE9tb-QvUHUSMt", kleur: "#0d73ec", cover: "https://i.scdn.co/image/ab67706f00000002960019ea66cba66a44fdd4c2" },
    { label: "Dance", match: "360 Dance", uri: "ytmusic_free--sdHEueeX://playlist/VLPLuzEFfLk4sb_n4zBXTkfmRfcfVVtta2MZ", kleur: "#e1118b", cover: "https://i.scdn.co/image/ab67706f000000020245aa997aa0e9599271f716" },
    { label: "Funk", match: "Funk Essentials", uri: "ytmusic_free--sdHEueeX://playlist/VLPLxA5-sIPuX2lbuNaLwAF4pqJV_cFi6-fJ", kleur: "#bc5900", cover: "https://i.scdn.co/image/ab67706f000000027afddc17378f8f1386f91848" },
    { label: "Hiphop", match: "Rap Playlist 2026 - Best Rap Songs - Rap 2026 & Top Rap Songs", uri: "ytmusic_free--sdHEueeX://playlist/VLPL3-sRm8xAzY9Qd1BoHHYFXRMUQlB4BZNt", kleur: "#777777", cover: "https://i.scdn.co/image/ab67706f00000002876581e4be85838f0e1ad09d" },
    { label: "Ambient", match: "Relaxing Chillout Music | Ambient Music Collection", uri: "ytmusic_free--sdHEueeX://playlist/VLPL-gxMXBZAiU0QhZKT8_I-XlRHCYFHohKG", kleur: "#1e3264", cover: "https://i.scdn.co/image/ab67706f0000000226b7b546f240016f02447692" }
  ];
  // Root-nodes uit MA (op titel gematcht); voedt de chips via _verwerkRoot.
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
  // Chips zijn de enige categorienavigatie. "radio browser" is de werkende
  // radiobibliotheek; de MA-radiobibliotheek (radio stations) is leeg zolang
  // er geen radioproviders zijn en krijgt daarom geen chip.
  var CHIPS = [
    { label: "Alles", sleutel: null },
    { label: "Artiesten", sleutel: "artists" },
    { label: "Albums", sleutel: "albums" },
    { label: "Nummers", sleutel: "tracks" },
    { label: "Afspeellijsten", sleutel: "playlists" },
    { label: "Radio", sleutel: "radio browser" },
    { label: "Podcasts", sleutel: "podcasts" },
    { label: "Audioboeken", sleutel: "audiobooks" }
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
       "viewhome","chips","radiorij","skcontext","voorjou","voorrij","playlists","plrij","bronfout","viewlijst","terugknop","wtitel","wcontext","lijst",
       "sprijen","sbart","sbbron","sbtitel","sbartiest",
       "skipprev","hoofdknop","skipnext","voortgang","sbspeler","demp","volmin","volspoor","volplus","volpct",
       "grootspeler","gssluit","gsart","gsbron","gstitel","gsartiest","gsvoortgang",
       "gsprev","gsplay","gsnext","gsvolmin","gsvolspoor","gsvolplus","gsvolpct","gsspeler"]
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
      // Radio snelkeuze: volgt de radiofavorieten uit Music Assistant;
      // zonder favorieten de vijf vaste zenders (zie _laadFavorieten).
      this._favModus = false;
      this._favVoor = 0;
      this._vjVoor = 0;
      this._voorjou = [];
      this._plVoor = 0;
      this._playlists = [];
      this._plBezig = false;
      this._favBezig = false;
      this._snel = ZENDERS.map(function (z) {
        return { naam: z.naam, mono: z.kort, url: z.url, uri: null, img: z.img || null };
      });
      this._tekenSnelkeuze();
      this._tekenPlaylists(null);
      // Chips: de enige categorienavigatie. Actief wordt een chip pas als
      // de categorie echt bestaat; ontbrekende categorieen worden grijs.
      this._catNodes = {};
      this._el.chips.innerHTML = CHIPS.map(function (d, i) {
        return '<div class="chip' + (i === 0 ? " actief" : "") + '" data-chip="' + i + '">' + esc(d.label) + "</div>";
      }).join("");
      Array.prototype.forEach.call(this._el.chips.querySelectorAll("[data-chip]"), function (chipEl) {
        chipEl.addEventListener("click", function () {
          var d = CHIPS[parseInt(chipEl.getAttribute("data-chip"), 10)];
          if (!d.sleutel) {
            Array.prototype.forEach.call(self._el.chips.querySelectorAll(".chip"), function (c2) {
              c2.classList.toggle("actief", c2 === chipEl);
            });
            self._naarHome();
            return;
          }
          var node = self._catNodes[d.sleutel];
          if (!node) return;
          Array.prototype.forEach.call(self._el.chips.querySelectorAll(".chip"), function (c2) {
            c2.classList.toggle("actief", c2 === chipEl);
          });
          self._stack = [];
          self._openNode(node);
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
      // Grote speler openen/sluiten en bedienen
      this._el.sbart.addEventListener("click", function () { self._openGroot(); });
      this._el.gssluit.addEventListener("click", function () { self._sluitGroot(); });
      this._el.gsart.addEventListener("click", function () { self._sluitGroot(); });
      this._el.gsplay.addEventListener("click", function () { self._speelPauze(); });
      this._el.gsprev.addEventListener("click", function () { self._skip(-1); });
      this._el.gsnext.addEventListener("click", function () { self._skip(1); });
      this._el.gsvolmin.addEventListener("click", function () { self._volStap(-0.08); });
      this._el.gsvolplus.addEventListener("click", function () { self._volStap(0.08); });
      // Bij "niet bereikbaar": tik op de melding laadt het bord opnieuw
      [this._el.sbtitel, this._el.sbartiest, this._el.gstitel, this._el.gsartiest].forEach(function (elm) {
        elm.addEventListener("click", function () {
          var st = self._sp();
          if (!st || st.state === "unavailable" || st.state === "unknown") window.location.reload();
        });
      });
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
      this._bindVolSpoor(this._el.volspoor);
      this._bindVolSpoor(this._el.gsvolspoor);
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
      // Snelkeuze-favorieten laden/verversen (bij start, daarna elke 5 min)
      if (hass.callService && !this._vjBezig && Date.now() - (this._vjVoor || 0) > 300000) {
        this._laadVoorJou();
      }
      if (hass.callService && !this._plBezig && Date.now() - (this._plVoor || 0) > 300000) {
        this._laadPlaylists();
      }
      if (hass.callService && !this._favBezig && Date.now() - (this._favVoor || 0) > 300000) {
        this._laadFavorieten();
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
      var zsig = zNu ? (zNu.url || zNu.uri || zNu.naam) : "";
      if (zsig !== this._zenderSig) { this._zenderSig = zsig; this._tekenRadio(); }
    }
    _actieveZender() {
      var s = this._sp();
      if (!s || (s.state !== "playing" && s.state !== "paused")) return null;
      var a = s.attributes;
      var lijst = this._snel || [];
      for (var i = 0; i < lijst.length; i++) {
        var it = lijst[i];
        if (it.uri && a.media_content_id && String(a.media_content_id) === it.uri) return it;
        if (it.url) {
          if (a.media_content_id && String(a.media_content_id) === it.url) return it;
          // MA herschrijft kale URL's naar builtin://radio/<url> (live gezien 3 nov):
          // het originele adres staat dan als achtervoegsel in de content-id.
          if (a.media_content_id && String(a.media_content_id).slice(-it.url.length) === it.url) return it;
        }
        if (a.media_title && String(a.media_title) === it.naam) return it;
        // Bij Efteling Kids Radio zet MA de zendernaam in artiest/album (live gezien 3 nov)
        var meta = (a.media_artist || "") + " " + (a.media_album_name || "") + " " + (a.app_name || "");
        if (meta.indexOf(it.naam) >= 0) return it;
      }
      return null;
    }
    _tekenSnelkeuze() {
      var self = this;
      this._el.radiorij.innerHTML = this._snel.map(function (z, i) {
        var art = "<span>" + esc(z.mono) + "</span>" +
          (z.img ? '<img src="' + esc(z.img) + '" alt="" onerror="this.remove()">' : "");
        return '<div class="rkort" data-snel="' + i + '">' +
          '<div class="rart">' + art + '</div>' +
          '<div class="rnaam">' + esc(z.naam) + '</div>' +
          '<div class="rstatus" data-rstatus="' + i + '"><span class="eq" data-req="' + i + '"><i></i><i></i><i></i></span><span data-rtekst="' + i + '"></span></div></div>';
      }).join("");
      Array.prototype.forEach.call(this._el.radiorij.querySelectorAll("[data-snel]"), function (tile) {
        tile.addEventListener("click", function () {
          var z = self._snel[parseInt(tile.getAttribute("data-snel"), 10)];
          if (!z) return;
          if (z.uri) self._speelFav(z); else self._speelZender(z);
        });
      });
      if (this._el.skcontext) {
        this._el.skcontext.textContent = this._favModus
          ? "Favorieten uit Music Assistant"
          : "Vaste zenders";
      }
      this._zenderSig = null;
      this._tekenRadio();
    }
    _laadFavorieten() {
      if (!this._hass || !this._hass.callService) return;
      var self = this;
      this._favBezig = true;
      var p;
      try {
        p = this._hass.callService("music_assistant", "get_library",
          { config_entry_id: MA_ENTRY, media_type: "radio", favorite: true, limit: 6 },
          undefined, false, true);
      } catch (e) { p = null; }
      if (!p || !p.then) { this._favBezig = false; this._favVoor = Date.now(); return; }
      this._metTimeout(p, 12000).then(function (res) {
        self._favBezig = false;
        self._favVoor = Date.now();
        if (!self.isConnected) return;
        var items = (res && res.response && res.response.items) || (res && res.items) || [];
        var favs = [];
        items.forEach(function (it) {
          if (!it || !it.uri || !it.name) return;
          var img = null;
          if (typeof it.image === "string") img = it.image;
          else if (it.image && typeof it.image.path === "string") img = it.image.path;
          favs.push({ naam: String(it.name), mono: monoVan(it.name), url: null, uri: String(it.uri), img: img });
        });
        self._favModus = favs.length > 0;
        var snel = favs.slice(0, 6);
        if (snel.length < 6) {
          ZENDERS.forEach(function (z) {
            if (snel.length >= 6) return;
            var dubbel = snel.some(function (b) {
              return b.naam === z.naam || (b.url && b.url === z.url);
            });
            if (!dubbel) snel.push({ naam: z.naam, mono: z.kort, url: z.url, uri: null, img: z.img || null });
          });
        }
        self._snel = snel;
        self._tekenSnelkeuze();
      }).catch(function () {
        self._favBezig = false;
        self._favVoor = Date.now();
      });
    }
    _tekenRadio() {
      var zNu = this._actieveZender();
      var root = this.shadowRoot;
      if (!root) return;
      var self = this;
      Array.prototype.forEach.call(root.querySelectorAll("[data-snel]"), function (tile) {
        var z = (self._snel || [])[parseInt(tile.getAttribute("data-snel"), 10)];
        var actief = !!z && !!zNu && z === zNu;
        tile.classList.toggle("actief", actief);
        var st = tile.querySelector("[data-rstatus]");
        if (st) st.classList.toggle("speelt", actief);
        var eq = tile.querySelector("[data-req]");
        if (eq) eq.classList.toggle("aan", actief);
        var tx = tile.querySelector("[data-rtekst]");
        if (tx) tx.textContent = actief ? "Speelt" : "";
      });
    }
    _tekenSpelers() {
      var self = this;
      var root = this.shadowRoot;
      if (!root || !this._hass) return;
      var gekozen = this._spelerObj();
      this._el.ondertitel.textContent = "Music Assistant · " + gekozen.naam;
      this._el.sbspeler.innerHTML = "Speelt op <b>" + esc(gekozen.naam) + "</b>";
      this._el.gsspeler.innerHTML = "Speelt op <b>" + esc(gekozen.naam) + "</b>";
      Array.prototype.forEach.call(root.querySelectorAll("[data-speler]"), function (rij) {
        var p = SPELERS[parseInt(rij.getAttribute("data-speler"), 10)];
        var st = self._hass.states[p.id];
        var staat = st ? st.state : "unavailable";
        rij.classList.toggle("gekozen", p.id === self._speler);
        rij.classList.toggle("weg", staat === "unavailable" || staat === "unknown");
        var tx = rij.querySelector("[data-spstatus]");
        if (tx) {
          tx.textContent = (staat === "unavailable" || staat === "unknown") ? "Niet bereikbaar"
            : (p.id === self._speler && staat === "playing") ? "Speelt nu · " + p.type
            : p.type + (staat === "playing" ? " · speelt" : "");
        }
      });
    }
    _updateBar() {
      var el = this._el;
      var self = this;
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
        el.sbart.innerHTML = '<span class="mono">' + (zNu ? zNu.mono : this._spelerObj().mono) + "</span>";
      }
      // Grote speler: zelfde hoes, groter
      if (pic && !this._badPics[picKey]) {
        el.gsart.innerHTML = '<img src="' + esc(pic) + '" alt="">';
        var gimg = el.gsart.querySelector("img");
        gimg.onerror = function () {
          self._badPics[picKey] = true;
          self._barSig = null;
          self._updateBar();
        };
      } else {
        el.gsart.innerHTML = '<span class="mono">' + (zNu ? zNu.mono : this._spelerObj().mono) + "</span>";
      }
      // Teksten (speelbalk en grote speler delen dezelfde inhoud)
      var bBron = "", bTitel = "", bOnder = "";
      if (weg) {
        bTitel = "Music Assistant niet bereikbaar";
        bOnder = "Tik op deze melding om het bord opnieuw te laden";
      } else if (!a.media_title && (staat === "off" || staat === "idle")) {
        bTitel = staat === "off" ? "Speler staat uit" : "Niets aan het spelen";
        bOnder = "Kies een zender of zoek iets op";
      } else {
        bBron = staat === "buffering" ? "Bufferen" : zNu ? "Radio" : "Music Assistant";
        bTitel = a.media_title || this._spelerObj().naam;
        var onder = [];
        if (a.media_artist) onder.push(a.media_artist);
        if (a.media_album_name) onder.push(a.media_album_name);
        if (!onder.length && zNu) onder.push("Live radio");
        else if (!onder.length && a.app_name) onder.push(a.app_name);
        bOnder = onder.join(" · ");
      }
      el.sbbron.textContent = bBron;
      el.sbtitel.textContent = bTitel;
      el.sbartiest.textContent = bOnder;
      el.gsbron.textContent = bBron;
      el.gstitel.textContent = bTitel;
      el.gsartiest.textContent = bOnder;
      // Transport
      var knopHtml = speelt
        ? '<span class="pauze"><i></i><i></i></span>'
        : '<span class="drie"></span>';
      el.hoofdknop.innerHTML = knopHtml;
      el.gsplay.innerHTML = knopHtml;
      var feats = typeof a.supported_features === "number" ? a.supported_features : 0;
      el.hoofdknop.classList.toggle("dicht", weg);
      el.gsplay.classList.toggle("dicht", weg);
      el.skipprev.classList.toggle("dicht", weg || staat === "off" || !(feats & 16));
      el.skipnext.classList.toggle("dicht", weg || staat === "off" || !(feats & 32));
      el.gsprev.classList.toggle("dicht", weg || staat === "off" || !(feats & 16));
      el.gsnext.classList.toggle("dicht", weg || staat === "off" || !(feats & 32));
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
      var htmlKlein = "", htmlGroot = "";
      if (mode === "prog") {
        htmlKlein = '<span class="vtijd vg-l" id="vg-l">0:00</span><div class="vtrack"><div class="vfill vg-f" id="vg-f" style="width:0%"></div></div><span class="vtijd rechts vg-r" id="vg-r">' + mmss(dur) + "</span>";
        htmlGroot = '<span class="vtijd vg-l">0:00</span><div class="vtrack"><div class="vfill vg-f" style="width:0%"></div></div><span class="vtijd rechts vg-r">' + mmss(dur) + "</span>";
      } else if (mode === "live") {
        htmlKlein = htmlGroot = '<div class="vlive" style="flex:1">Live radio</div>';
      } else {
        htmlKlein = htmlGroot = '<div class="vlive" style="flex:1"></div>';
      }
      this._el.voortgang.innerHTML = htmlKlein;
      this._el.gsvoortgang.innerHTML = htmlGroot;
      this._tickVoortgang();
    }
    _tickVoortgang() {
      if (!this._built || !this._el) return;
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
      var pct = (dur > 0 ? (pos / dur) * 100 : 0) + "%";
      var tekst = mmss(pos);
      [this._el.voortgang, this._el.gsvoortgang].forEach(function (houder) {
        if (!houder) return;
        var f = houder.querySelector(".vg-f");
        if (f) f.style.width = pct;
        var l = houder.querySelector(".vg-l");
        if (l) l.textContent = tekst;
      });
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
      this._paintSlider(el.volspoor, el.volpct, vol, weg);
      this._paintSlider(el.gsvolspoor, el.gsvolpct, vol, weg);
      el.volmin.classList.toggle("dicht", weg);
      el.volplus.classList.toggle("dicht", weg);
      el.gsvolmin.classList.toggle("dicht", weg);
      el.gsvolplus.classList.toggle("dicht", weg);
    }
    _paintSlider(spoor, pct, vol, weg) {
      if (!spoor) return;
      pct.textContent = vol === null ? "--" : Math.round(vol * 100) + "%";
      var p = vol === null ? 0 : Math.round(vol * 100);
      var vul = spoor.querySelector(".vul");
      if (vul) vul.style.width = p + "%";
      var knop = spoor.querySelector(".knop");
      if (knop) knop.style.left = p + "%";
      spoor.classList.toggle("dicht", weg);
    }
    _openGroot() {
      this._groot = true;
      this._el.grootspeler.classList.add("open");
      this._vgSig = null;
      this._tekenVoortgang();
    }
    _sluitGroot() {
      this._groot = false;
      this._el.grootspeler.classList.remove("open");
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
    _bindVolSpoor(el) {
      if (!el) return;
      var self = this;
      el.addEventListener("pointerdown", function (ev) {
        var s = self._sp();
        if (!s || s.state === "unavailable" || s.state === "unknown") return;
        var r = el.getBoundingClientRect();
        var frac = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
        var cur = self._effVol();
        if (cur === null) return;
        // Nooit een sprong naar vol: een tik zet het volume een stap
        // richting de tik, net als de plus- en minknoppen.
        if (frac > cur + 0.02) self._volStap(0.08);
        else if (frac < cur - 0.02) self._volStap(-0.08);
      });
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
          self._verwerkRoot(res);
        })
        .catch(function () {
          self._rootBezig = false;
          if (!self.isConnected || self._speler !== speler) return;
          self._el.bronfout.style.display = "";
          self._el.bronfout.innerHTML = "<b>Bronnen laden is niet gelukt.</b> Music Assistant antwoordt niet. Zoek iets of tik op een chip om het opnieuw te proberen.";
          self._catNodes = {};
          self._tekenChips();
        });
    }
    _verwerkRoot(rootRes) {
      var kinderen = (rootRes && rootRes.children) || [];
      var perTitel = {};
      kinderen.forEach(function (c) { perTitel[String(c.title || "").toLowerCase()] = c; });
      var self = this;
      this._catNodes = {};
      CATS.forEach(function (cat) {
        var node = perTitel[cat.sleutel];
        if (!node) return;
        var id = String(node.media_content_id || "");
        // App-bronnen verbergen, behalve Radio Browser (enige werkende radiobibliotheek in de boom)
        if (id.indexOf("media-source://") === 0 && id.indexOf("media-source://radio_browser") !== 0) return;
        if (!node.can_expand && !node.can_play) return;
        self._catNodes[cat.sleutel] = node;
      });
      this._el.bronfout.style.display = "none";
      this._tekenChips();
    }
    _tekenChips() {
      if (!this._el.chips || !this._catNodes) return;
      var nodes = this._catNodes;
      Array.prototype.forEach.call(this._el.chips.querySelectorAll("[data-chip]"), function (el, i) {
        var d = CHIPS[i];
        if (d && d.sleutel) el.classList.toggle("uit", !nodes[d.sleutel]);
      });
    }
    _spelerWeg() {
      var s = this._sp();
      return !!s && (s.state === "unavailable" || s.state === "unknown");
    }
    /* ---------- Voor jou (echte bibliotheekitems) ---------- */
    _laadVoorJou() {
      if (!this._hass || !this._hass.callService) return;
      var self = this;
      this._vjBezig = true;
      var vraag = function (type) {
        try {
          return self._hass.callService("music_assistant", "get_library",
            { config_entry_id: MA_ENTRY, media_type: type, limit: 6 }, undefined, false, true);
        } catch (e) { return null; }
      };
      var p = vraag("album");
      if (!p || !p.then) { this._vjBezig = false; this._vjVoor = Date.now(); return; }
      this._metTimeout(p, 12000).then(function (res) {
        var items = (res && res.response && res.response.items) || (res && res.items) || [];
        if (items.length) {
          self._vjBezig = false; self._vjVoor = Date.now();
          if (self.isConnected) self._tekenVoorJou(items, "album");
          return;
        }
        var p2 = vraag("playlist");
        if (!p2 || !p2.then) {
          self._vjBezig = false; self._vjVoor = Date.now();
          if (self.isConnected) self._tekenVoorJou([], "playlist");
          return;
        }
        return self._metTimeout(p2, 12000).then(function (res2) {
          var items2 = (res2 && res2.response && res2.response.items) || (res2 && res2.items) || [];
          self._vjBezig = false; self._vjVoor = Date.now();
          if (self.isConnected) self._tekenVoorJou(items2, "playlist");
        });
      }).catch(function () {
        self._vjBezig = false;
        self._vjVoor = Date.now();
      });
    }
    _tekenVoorJou(items, type) {
      var self = this;
      var bruikbaar = [];
      items.forEach(function (it) {
        if (!it || !it.uri || !it.name) return;
        var img = null;
        if (typeof it.image === "string") img = it.image;
        else if (it.image && typeof it.image.path === "string") img = it.image.path;
        var sub = type === "playlist" ? "Afspeellijst" : "Album";
        if (type === "album" && it.artists && it.artists[0] && it.artists[0].name) sub = String(it.artists[0].name);
        bruikbaar.push({ naam: String(it.name), uri: String(it.uri), img: img, sub: sub, type: type });
      });
      this._voorjou = bruikbaar;
      if (!bruikbaar.length) { this._el.voorjou.style.display = "none"; return; }
      this._el.voorjou.style.display = "";
      this._el.voorrij.innerHTML = bruikbaar.map(function (v, i) {
        var art = '<span class="mono">' + esc(monoVan(v.naam)) + "</span>" +
          (v.img ? '<img src="' + esc(v.img) + '" alt="" onerror="this.remove()">' : "");
        return '<div class="hoes" data-vj="' + i + '"><div class="hart">' + art + "</div>" +
          '<div class="hnaam">' + esc(v.naam) + '</div><div class="hsub">' + esc(v.sub) + "</div></div>";
      }).join("");
      Array.prototype.forEach.call(this._el.voorrij.querySelectorAll("[data-vj]"), function (el) {
        el.addEventListener("click", function () {
          var v = self._voorjou[parseInt(el.getAttribute("data-vj"), 10)];
          if (v) self._speelVoorJou(v);
        });
      });
    }
    _speelVoorJou(v) {
      if (this._spelerWeg()) return;
      this._call("music_assistant", "play_media",
        { media_id: v.uri, media_type: v.type, enqueue: "replace" },
        { entity_id: this._speler });
    }
    /* ---------- Playlists (categorietegels) ---------- */
    _laadPlaylists() {
      if (!this._hass || !this._hass.callService) return;
      var self = this;
      this._plBezig = true;
      var p;
      try {
        p = this._hass.callService("music_assistant", "get_library",
          { config_entry_id: MA_ENTRY, media_type: "playlist", limit: 50 },
          undefined, false, true);
      } catch (e) { p = null; }
      if (!p || !p.then) { this._plBezig = false; this._plVoor = Date.now(); return; }
      this._metTimeout(p, 12000).then(function (res) {
        var items = (res && res.response && res.response.items) || (res && res.items) || [];
        self._plBezig = false;
        self._plVoor = Date.now();
        if (self.isConnected) self._tekenPlaylists(items);
      }).catch(function () {
        self._plBezig = false;
        self._plVoor = Date.now();
      });
    }
    _tekenPlaylists(items) {
      if (!this._el || !this._el.plrij) return;
      var self = this;
      var opNaam = {};
      (items || []).forEach(function (it) {
        if (it && it.name && it.uri) opNaam[String(it.name)] = it;
      });
      var tegels = PLCATS.map(function (c) {
        var it = opNaam[c.match];
        var img = c.cover || null;
        if (!img && it) {
          if (typeof it.image === "string") img = it.image;
          else if (it.image && typeof it.image.path === "string") img = it.image.path;
        }
        return { label: c.label, kleur: c.kleur, mono: monoVan(c.label),
          uri: it ? String(it.uri) : c.uri, img: img };
      });
      this._playlists = tegels;
      this._el.plrij.innerHTML = tegels.map(function (t, i) {
        var art = '<span class="mono">' + esc(t.mono) + "</span>" +
          (t.img ? '<img src="' + esc(t.img) + '" alt="" onerror="this.remove()">' : "");
        return '<div class="pltegel" data-pl="' + i + '" style="background:' + esc(t.kleur) + '">' +
          '<div class="plnaam">' + esc(t.label) + '</div>' +
          '<div class="plart">' + art + "</div></div>";
      }).join("");
      Array.prototype.forEach.call(this._el.plrij.querySelectorAll("[data-pl]"), function (el) {
        el.addEventListener("click", function () {
          var t = self._playlists[parseInt(el.getAttribute("data-pl"), 10)];
          if (t) self._speelPlaylist(t);
        });
      });
    }
    _speelPlaylist(t) {
      if (this._spelerWeg()) return;
      this._call("music_assistant", "play_media",
        { media_id: t.uri, media_type: "playlist", enqueue: "replace" },
        { entity_id: this._speler });
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
      if (this._el.chips) {
        Array.prototype.forEach.call(this._el.chips.querySelectorAll(".chip"), function (c2, i2) {
          c2.classList.toggle("actief", i2 === 0);
        });
      }
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
      if (this._spelerWeg()) return;
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
      if (this._spelerWeg()) return;
      this._call("media_player", "play_media",
        { media_content_id: z.url, media_content_type: "music", enqueue: "replace" },
        { entity_id: this._speler });
    }
    _speelFav(z) {
      if (this._spelerWeg()) return;
      this._call("music_assistant", "play_media",
        { media_id: z.uri, media_type: "radio", enqueue: "replace" },
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
