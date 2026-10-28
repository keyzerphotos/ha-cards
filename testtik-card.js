/* Testtik card — minimale tik-test in dezelfde bouwvorm als de borden
   (shadow DOM, position:fixed host, geschaald podium). Een enorme knop die
   lokaal telt; geen enkele service-call. Doel: bewijzen of echte tikken
   (hit-testing) de kaart bereiken in de HA-app. */
(function () {
  "use strict";
  var CSS = `
  :host{ display:block; position:fixed; inset:0; width:100%; height:100%;
    font-family:system-ui,-apple-system,'Segoe UI',sans-serif; color:#f4f4f2; }
  *{ margin:0; padding:0; box-sizing:border-box; }
  .stage{ position:relative; width:900px; height:1600px; transform-origin:top left; overflow:hidden;
    background:#08090b; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:48px; }
  .count{ font-size:220px; font-weight:300; }
  .label{ font-size:30px; letter-spacing:.3em; text-transform:uppercase; color:#a3a3a0; }
  .bigbtn{ width:640px; padding:64px 0; text-align:center; font-size:44px; font-weight:600;
    background:#d9a441; color:#14100a; border-radius:28px; cursor:pointer; user-select:none; }
  .bigbtn:active{ transform:scale(.97); }
  .last{ font-size:26px; color:#a3a3a0; }
  `;
  class TesttikCard extends HTMLElement {
    setConfig() { this._build(); }
    getCardSize() { return 1; }
    set hass(h) { this._hass = h; }
    _build() {
      if (this._built) return;
      this._built = true;
      var root = this.shadowRoot || this.attachShadow({ mode: "open" });
      root.innerHTML = "<style>" + CSS + "</style>" +
        '<div class="stage" id="stage"><div class="label">Tik-teller</div>' +
        '<div class="count" id="count">0</div>' +
        '<div class="bigbtn" id="btn">TIK HIER</div>' +
        '<div class="last" id="last">nog niet getikt</div></div>';
      var self = this;
      this._n = 0;
      root.getElementById("btn").addEventListener("click", function () {
        self._n++;
        root.getElementById("count").textContent = String(self._n);
        root.getElementById("last").textContent = "laatste tik: " + new Date().toLocaleTimeString("nl-NL");
        root.getElementById("stage").style.background = self._n % 2 ? "#14210f" : "#08090b";
      });
      this._stage = root.getElementById("stage");
      this._ro = new ResizeObserver(function () { self._fit(); });
      this._ro.observe(this);
      this._fit();
    }
    _fit() {
      if (!this._stage) return;
      var w = this.clientWidth || window.innerWidth || 900;
      var h = this.clientHeight || window.innerHeight || 1600;
      var s = Math.min(w / 900, h / 1600);
      this._stage.style.transform = "scale(" + s + ")";
      this._stage.style.marginLeft = ((w - 900 * s) / 2) + "px";
      this._stage.style.marginTop = ((h - 1600 * s) / 2) + "px";
    }
    disconnectedCallback() { if (this._ro) this._ro.disconnect(); }
  }
  if (!customElements.get("testtik-card")) customElements.define("testtik-card", TesttikCard);
})();
