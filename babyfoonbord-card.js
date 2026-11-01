/* Babyfoonbord card v1.9 — schermvullend kader met de losse babyfoonpagina
   (go2rtc-speler, WebRTC met terugpraten) als iframe. v1.8: pagina v12
   (volledige herbouw: sessiearchitectuur, genormaliseerde streams via
   go2rtc, diagnose-snapshots naar input_text.babyfoon_diagnose).
   v1.9: pagina v12.2 + tokenbrug: de kaart geeft zijn eigen HA-token via
   postMessage aan de pagina, zodat temperatuur, hartslag en diagnose ook
   werken als de opslag in het iframe (kiosk-WebView) geblokkeerd is.
   De v11-pagina blijft als bestand staan als terugval. Eigen kaart i.p.v. de ingebouwde webpage-kaart:
   die gaf op de Lenovo een kale Configuratiefout in een panel-view, en de
   eigen kaart kan het iframe microfoonrecht geven voor het terugpraten.
   :host pakt het hele venster (wallpanel-patroon, zoals de andere borden). */
(function () {
  "use strict";
  var SRC = "/local/babyfoon-live-v12/index.html?v=12.2";
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
