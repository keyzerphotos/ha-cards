// draaiknop-card v1.1: sleepbare thermostaatring voor één climate-entiteit.
// Vormgeving naar het Instagram-voorbeeld dat Alex koos (3 nov 2026): lichte
// frosted-glass kaart, een ring van losse streepjes die van blauw via groen
// en geel naar oranje kleurt, een witte knop en een mint pil bovenin.
// Techniek: de streepjes zijn gewone divs (tekenen bewezen in de tablet-
// WebViews, waar inline-SVG dat niet doet); slepen gaat via pointer-events,
// de waarde snapt op de stap van de entiteit (Tado: 0,5°) en wordt pas bij
// loslaten als climate.set_temperature verstuurd.
class DraaiknopCard extends HTMLElement {
  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error("Draaiknop: geef een climate-entiteit op (entity).");
    }
    this._config = { name: null, step: null, min: null, max: null, ...config };
    if (!this.shadowRoot) this._buildDom();
    this._render();
  }

  set hass(h) {
    this._hass = h;
    this._render();
  }

  getCardSize() {
    return 3;
  }

  getGridOptions() {
    return { columns: 6, rows: 3, min_columns: 3, min_rows: 3 };
  }

  static getStubConfig() {
    return { entity: "climate.woonkamer_woonkamer" };
  }

  _buildDom() {
    this.attachShadow({ mode: "open" });
    const AANTAL = 46;
    let ticks = "";
    for (let i = 0; i < AANTAL; i++) ticks += `<div class="tick"></div>`;
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          display: block;
          background: linear-gradient(160deg, #ffffff 0%, #edf3f6 100%);
          border: 1px solid rgba(255,255,255,.95);
          box-shadow: 0 14px 34px rgba(23,34,43,.16);
          border-radius: 26px;
          padding: 16px 12px 18px;
          box-sizing: border-box;
        }
        .pil {
          width: fit-content; margin: 0 auto 10px;
          background: #d7f2ea; color: #14655a;
          font-size: 12.5px; font-weight: 700;
          letter-spacing: .13em; text-transform: uppercase;
          padding: 5px 14px; border-radius: 999px;
        }
        .wrap {
          position: relative;
          width: min(100%, 300px);
          aspect-ratio: 1 / 1;
          margin: 0 auto;
          touch-action: none;
          cursor: grab;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }
        .wrap:active { cursor: grabbing; }
        .ring { position: absolute; inset: 0; border-radius: 50%; }
        .tick {
          position: absolute; left: 50%; top: 50%;
          width: 4.5px; height: 13px; border-radius: 3px;
          margin: -6.5px 0 0 -2.25px;
          background: rgba(23,34,43,.10);
          pointer-events: none;
        }
        .face {
          position: absolute; inset: 12.5%;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 36%, #ffffff, #e9f0f3 74%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          pointer-events: none;
          text-align: center;
        }
        .doel {
          color: #17222b;
          font-size: 58px; font-weight: 700; line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .nu {
          color: #5c6d78;
          font-size: 15px; margin-top: 8px;
          display: flex; align-items: center; gap: 7px;
        }
        .stip { width: 8px; height: 8px; border-radius: 50%; background: rgba(23,34,43,.18); }
        .stip.aan { background: #ef6a3a; box-shadow: 0 0 8px rgba(239,106,58,.75); }
        .rotor { position: absolute; inset: 0; pointer-events: none; }
        .knop {
          position: absolute; left: 50%; top: 6.25%;
          width: 27px; height: 27px; border-radius: 50%;
          transform: translate(-50%, -50%);
          background: #ffffff;
          border: 1px solid rgba(23,34,43,.07);
          box-shadow: 0 3px 12px rgba(23,34,43,.28);
          transition: width .12s ease, height .12s ease;
        }
        .wrap.bezig .knop { width: 32px; height: 32px; }
        .onbeschikbaar {
          color: #5c6d78;
          text-align: center; padding: 34px 10px; font-size: 15px;
        }
      </style>
      <ha-card>
        <div class="pil"></div>
        <div class="wrap" tabindex="0" role="slider" aria-label="Doeltemperatuur">
          <div class="ring spoor"></div>
          ${ticks}
          <div class="face">
            <div class="doel">--</div>
            <div class="nu"><span class="stip"></span><span class="nutekst"></span></div>
          </div>
          <div class="rotor"><div class="knop"></div></div>
        </div>
        <div class="onbeschikbaar" hidden>Niet beschikbaar</div>
      </ha-card>`;
    this._el = {
      pil: this.shadowRoot.querySelector(".pil"),
      wrap: this.shadowRoot.querySelector(".wrap"),
      spoor: this.shadowRoot.querySelector(".spoor"),
      ticks: [...this.shadowRoot.querySelectorAll(".tick")],
      doel: this.shadowRoot.querySelector(".doel"),
      stip: this.shadowRoot.querySelector(".stip"),
      nutekst: this.shadowRoot.querySelector(".nutekst"),
      rotor: this.shadowRoot.querySelector(".rotor"),
      onbeschikbaar: this.shadowRoot.querySelector(".onbeschikbaar"),
    };
    const w = this._el.wrap;
    w.addEventListener("pointerdown", (ev) => this._startSleep(ev));
    w.addEventListener("pointermove", (ev) => this._sleep(ev));
    w.addEventListener("pointerup", (ev) => this._stopSleep(ev));
    w.addEventListener("pointercancel", (ev) => this._stopSleep(ev));
    w.addEventListener("keydown", (ev) => this._toets(ev));
    requestAnimationFrame(() => this._render());
  }

  _entiteit() {
    if (!this._hass || !this._config) return null;
    return this._hass.states[this._config.entity] || null;
  }

  _grenzen(st) {
    const a = st ? st.attributes : {};
    const min = this._config.min != null ? this._config.min : (a.min_temp != null ? a.min_temp : 5);
    const max = this._config.max != null ? this._config.max : (a.max_temp != null ? a.max_temp : 25);
    const stap = this._config.step != null ? this._config.step : (a.target_temp_step != null ? a.target_temp_step : 0.5);
    return { min, max, stap };
  }

  _weergaveWaarde(st) {
    if (this._bezig || (this._vasthoudTot && Date.now() < this._vasthoudTot)) {
      return this._sleepWaarde;
    }
    return st && st.attributes.temperature != null ? st.attributes.temperature : null;
  }

  // Kleurverloop van de ring: blauw (koud) via groen en geel naar oranje (warm).
  _kleur(f) {
    const stops = [
      [0.0, [53, 166, 220]],
      [0.45, [79, 192, 141]],
      [0.7, [242, 193, 78]],
      [1.0, [239, 106, 58]],
    ];
    for (let i = 1; i < stops.length; i++) {
      if (f <= stops[i][0]) {
        const [f0, c0] = stops[i - 1];
        const [f1, c1] = stops[i];
        const t = (f - f0) / (f1 - f0);
        const c = c0.map((v, k) => Math.round(v + (c1[k] - v) * t));
        return `rgb(${c[0]},${c[1]},${c[2]})`;
      }
    }
    return "rgb(239,106,58)";
  }

  _render() {
    if (!this._el) return;
    const st = this._entiteit();
    const naam = this._config.name || (st ? st.attributes.friendly_name : null) || this._config.entity;
    this._el.pil.textContent = naam || "";
    if (!st || st.state === "unavailable" || st.state === "unknown") {
      this._el.wrap.style.display = "none";
      this._el.onbeschikbaar.hidden = false;
      this._el.onbeschikbaar.textContent = `${naam} is niet beschikbaar`;
      return;
    }
    this._el.wrap.style.display = "";
    this._el.onbeschikbaar.hidden = true;

    const { min, max } = this._grenzen(st);
    const waarde = this._weergaveWaarde(st);
    const f = waarde == null ? 0 : Math.min(1, Math.max(0, (waarde - min) / (max - min)));
    const graden = f * 270;
    const verwarmt = st.attributes.hvac_action === "heating";
    const uit = st.state === "off";
    this._el.spoor.style.background =
      "conic-gradient(from -135deg, rgba(23,34,43,.045) 0deg 270deg, transparent 270deg 360deg)";
    // Streepjes: positie op de ringband en kleur tot aan de huidige waarde.
    const straal = this._el.wrap.clientWidth * 0.4375;
    const n = this._el.ticks.length;
    this._el.ticks.forEach((tick, i) => {
      const tf = i / (n - 1);
      const hoek = -135 + tf * 270;
      tick.style.transform = `rotate(${hoek}deg) translateY(${-straal}px)`;
      tick.style.background = !uit && tf <= f + 0.001 ? this._kleur(tf) : "rgba(23,34,43,.10)";
    });
    this._el.rotor.style.transform = `rotate(${-135 + graden}deg)`;
    this._el.doel.textContent = waarde == null ? "--" : this._fmt(waarde) + "°";
    const nu = st.attributes.current_temperature;
    this._el.nutekst.textContent =
      (nu != null ? `nu ${this._fmt(nu)}°` : "") +
      (uit ? " · uit" : verwarmt ? " · verwarmt" : " · op temperatuur");
    this._el.stip.className = "stip" + (verwarmt ? " aan" : "");
    this._el.wrap.setAttribute("aria-valuemin", min);
    this._el.wrap.setAttribute("aria-valuemax", max);
    if (waarde != null) this._el.wrap.setAttribute("aria-valuenow", waarde);
  }

  _fmt(v) {
    return (Math.round(v * 10) / 10).toFixed(1).replace(".", ",");
  }

  _hoekNaarWaarde(ev) {
    const r = this._el.wrap.getBoundingClientRect();
    const dx = ev.clientX - (r.left + r.width / 2);
    const dy = ev.clientY - (r.top + r.height / 2);
    let hoek = Math.atan2(dx, -dy) * 180 / Math.PI; // 0 = boven, met de klok mee
    if (hoek > 135) hoek = 135;
    if (hoek < -135) hoek = -135;
    const st = this._entiteit();
    const { min, max, stap } = this._grenzen(st);
    const f = (hoek + 135) / 270;
    let v = min + f * (max - min);
    v = Math.round(v / stap) * stap;
    return Math.min(max, Math.max(min, Math.round(v * 10) / 10));
  }

  _startSleep(ev) {
    if (!this._entiteit()) return;
    ev.preventDefault();
    this._el.wrap.setPointerCapture(ev.pointerId);
    this._bezig = true;
    this._el.wrap.classList.add("bezig");
    this._sleepWaarde = this._hoekNaarWaarde(ev);
    this._render();
  }

  _sleep(ev) {
    if (!this._bezig) return;
    this._sleepWaarde = this._hoekNaarWaarde(ev);
    this._render();
  }

  _stopSleep(ev) {
    if (!this._bezig) return;
    this._bezig = false;
    this._el.wrap.classList.remove("bezig");
    const st = this._entiteit();
    const doel = st ? st.attributes.temperature : null;
    this._vasthoudTot = Date.now() + 2500;
    if (st && this._sleepWaarde != null && this._sleepWaarde !== doel) {
      this._hass.callService("climate", "set_temperature", {
        entity_id: this._config.entity,
        temperature: this._sleepWaarde,
      });
    }
    this._render();
  }

  _toets(ev) {
    const st = this._entiteit();
    if (!st) return;
    const { min, max, stap } = this._grenzen(st);
    const huidig = st.attributes.temperature;
    if (huidig == null) return;
    let v = null;
    if (ev.key === "ArrowUp" || ev.key === "ArrowRight") v = huidig + stap;
    else if (ev.key === "ArrowDown" || ev.key === "ArrowLeft") v = huidig - stap;
    else if (ev.key === "Home") v = min;
    else if (ev.key === "End") v = max;
    if (v == null) return;
    ev.preventDefault();
    v = Math.min(max, Math.max(min, Math.round(v * 10) / 10));
    this._sleepWaarde = v;
    this._vasthoudTot = Date.now() + 2500;
    this._hass.callService("climate", "set_temperature", {
      entity_id: this._config.entity,
      temperature: v,
    });
    this._render();
  }
}

if (!customElements.get("draaiknop-card")) {
  customElements.define("draaiknop-card", DraaiknopCard);
}
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "draaiknop-card")) {
  window.customCards.push({
    type: "draaiknop-card",
    name: "Draaiknop",
    description: "Sleepbare thermostaatring voor een climate-entiteit.",
    preview: false,
  });
}
