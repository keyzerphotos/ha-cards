// kuga-refresh: onzichtbare kaart voor de Auto-pagina's.
// Vraagt een vers Ford-rapport op zodra de pagina opent, maar alleen als de
// laatste data ouder is dan 10 minuten (en max. 1x per 10 min per apparaat,
// via localStorage) — zo wordt de auto niet onnodig gewekt.
class KugaRefresh extends HTMLElement {
  set hass(h) {
    if (this._done) return;
    const st = h.states["sensor.fordpass_wf0fxxwpmhld21343_lastrefresh"];
    if (!st || !st.state) return;
    this._done = true;
    const ageMin = (Date.now() - new Date(st.state).getTime()) / 60000;
    const last = +(localStorage.getItem("kugaRefreshLast") || 0);
    if (ageMin > 10 && Date.now() - last > 10 * 60000) {
      localStorage.setItem("kugaRefreshLast", "" + Date.now());
      h.callService("button", "press", {
        entity_id: "button.fordpass_wf0fxxwpmhld21343_request_refresh",
      });
    }
  }
  getCardSize() {
    return 0;
  }
}
customElements.define("kuga-refresh", KugaRefresh);
