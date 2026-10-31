/* Babyfoonbord card v1.8 — schermvullend kader met de losse babyfoonpagina
   (go2rtc-speler, WebRTC met terugpraten) als iframe. v1.8: pagina v12
   (volledige herbouw: sessiearchitectuur, genormaliseerde streams via
   go2rtc, diagnose-snapshots naar input_text.babyfoon_diagnose).
   De v11-pagina blijft als bestand staan als terugval. Eigen kaart i.p.v. de ingebouwde webpage-kaart:
   die gaf op de Lenovo een kale Configuratiefout in een panel-view, en de
   eigen kaart kan het iframe microfoonrecht geven voor het terugpraten.
   :host pakt het hele venster (wallpanel-patroon, zoals de andere borden). */
(function () {
  "use strict";
  var SRC = "/local/babyfoon-live-v12/index.html?v=12";
  class BabyfoonbordCard extends HTMLElement {
    setConfig(config) {
      this._config = config || {};
      if (!this._built) this._build();
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
    }
    getCardSize() { return 1; }
  }
  if (!customElements.get("babyfoonbord-card")) {
    customElements.define("babyfoonbord-card", BabyfoonbordCard);
  }
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "babyfoonbord-card", name: "Babyfoonbord", preview: false });
})();
