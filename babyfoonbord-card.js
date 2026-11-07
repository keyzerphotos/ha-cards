/* Babyfoonbord card v2.4 — schermvullend kader met de losse babyfoonpagina
   (go2rtc-speler, WebRTC met terugpraten) als iframe. v1.8: pagina v12
   (volledige herbouw: sessiearchitectuur, genormaliseerde streams via
   go2rtc, diagnose-snapshots naar input_text.babyfoon_diagnose).
   v1.9: pagina v12.2 + tokenbrug: de kaart geeft zijn eigen HA-token via
   postMessage aan de pagina, zodat temperatuur, hartslag en diagnose ook
   werken als de opslag in het iframe (kiosk-WebView) geblokkeerd is.
   v2.0: pagina v12.3: de stream loopt via de go2rtc-ingress i.p.v. de
   directe poort 1984, die in de kiosk-WebView niet opent (fail-ws).
   v2.1: pagina v12.4: MSE als standaardtransport (WebRTC bevroor op de
   Lenovo na circa twee seconden), statistiek-delta's gerepareerd zodat
   'live' weer bereikbaar is, en geen poster van de andere kamer meer
   bij een wissel (spookbeeld).
   v2.2: pagina v12.5: herkansing resetten bij handmatige wissel en bij
   'Probeer nu opnieuw', plus 30 s opstartruimte voor de eerste sessie
   na een wissel. Serverkant horen hier go2rtc-preloads op de ruwe
   streams bij (warm tijdens kijken) en een analyse-limiet op de
   beeldomzetting.
   v2.3: pagina v12.6: vertragingsfix: de speler springt in Live elke
   4 s actief terug naar de live-rand (MSE), en serverkant maakt de
   omzetting nu elke seconde een sleutelframe (GOP 15) met een
   bufferloze ffmpeg-invoer.
   v2.4 (7 nov 2026, borden-eenheid blok 2): pagina v13: navigatie
   aangevuld met Muziek en Eten (8 items), eigen Inter-lettertype in
   de pagina, metriek en grijzen gelijk aan de gedeelde bord-basis.
   Alleen de SRC wijst om; de tokenbrug is ongewijzigd.
   De v11-pagina blijft als bestand staan als terugval. Eigen kaart i.p.v. de ingebouwde webpage-kaart:
   die gaf op de Lenovo een kale Configuratiefout in een panel-view, en de
   eigen kaart kan het iframe microfoonrecht geven voor het terugpraten.
   :host pakt het hele venster (wallpanel-patroon, zoals de andere borden). */
(function () {
  "use strict";
  var SRC = "/local/babyfoon-live-v13/index.html?v=13.0";
  class BabyfoonbordCard extends HTMLElement {
    setConfig(config) {
      this._config = config || {};
      if (!this._built) this._build();
    }
    set hass(h) {
      this._hass = h;
      this._pushToken();
    }
    _pushToken() {
      var auth = this._hass && this._hass.auth;
      var t = auth && auth.data && auth.data.access_token;
      if (!t) return;
      // Opnieuw sturen bij een nieuwe token én periodiek: het eerste
      // bericht kan aankomen vóór de pagina zijn listener heeft gezet.
      if (t === this._tok && Date.now() - (this._tokAt || 0) < 20000) return;
      var f = this.shadowRoot && this.shadowRoot.querySelector("iframe");
      if (!f || !f.contentWindow) return;
      this._tok = t;
      this._tokAt = Date.now();
      try {
        f.contentWindow.postMessage({ type: "bf-token", access_token: t }, location.origin);
      } catch (e) {}
    }
    _build() {
      this._built = true;
      var root = this.shadowRoot || this.attachShadow({ mode: "open" });
      root.innerHTML =
        "<style>" +
        ":host{ position:fixed; inset:0; background:#08090b; }" +
        "iframe{ border:0; width:100%; height:100%; display:block; background:#08090b; }" +
        "</style>" +
        '<iframe src="' + SRC + '" allow="microphone; autoplay; fullscreen" title="Babyfoon"></iframe>';
      var self = this;
      var f = root.querySelector("iframe");
      if (f) {
        f.addEventListener("load", function () {
          self._tok = null;
          self._tokAt = 0;
          self._pushToken();
        });
      }
    }
    getCardSize() { return 1; }
  }
  if (!customElements.get("babyfoonbord-card")) {
    customElements.define("babyfoonbord-card", BabyfoonbordCard);
  }
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "babyfoonbord-card", name: "Babyfoonbord", preview: false });
})();
