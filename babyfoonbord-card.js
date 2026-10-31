/* Babyfoonbord card v1.0 — schermvullend kader met de losse babyfoonpagina
   (go2rtc-spelers) als iframe. Eigen kaart i.p.v. de ingebouwde webpage-kaart:
   die gaf op de Lenovo een kale Configuratiefout in een panel-view, en de
   eigen kaart kan het iframe microfoonrecht geven voor het terugpraten.
   :host pakt het hele venster (wallpanel-patroon, zoals de andere borden). */
(function () {
  "use strict";
  var SRC = "/local/babyfoon-live/index.html?v=4";
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
