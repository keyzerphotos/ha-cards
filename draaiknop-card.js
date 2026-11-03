// draaiknop-card: sleepbare thermostaatring voor één climate-entiteit.
// De ring is een conic-gradient (tekent bewezen in de tablet-WebViews, waar
// inline-SVG dat niet doet); slepen gaat via pointer-events, de waarde snapt
// op de stap van de entiteit (Tado: 0,5°) en wordt pas bij loslaten als
// climate.set_temperature verstuurd, zodat een draai geen servicestorm geeft.
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
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          background: var(--ha-card-background, #111419);
          border-radius: 18px;
          padding: 18px 12px 14px;
          box-sizing: border-box;
        }
        .titel {
          text-align: center;
          color: var(--secondary-text-color, rgba(244,241,234,.55));
          font-size: 13px; letter-spacing: .14em; text-transform: uppercase;
          margin-bottom: 8px;
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
        .face {
          position: absolute; inset: 12.5%;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 38%, #1a1f27, #12151b 72%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          pointer-events: none;
          text-align: center;
        }
        .doel {
          color: var(--primary-text-color, #f4f1ea);
          font-size: 58px; font-weight: 600; line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .nu {
          color: var(--secondary-text-color, rgba(244,241,234,.6));
          font-size: 15px; margin-top: 8px;
          display: flex; align-items: center; gap: 7px;
        }
        .stip { width: 8px; height: 8px; border-radius: 50%; background: rgba(244,241,234,.3); }
        .stip.aan { background: #e8873a; box-shadow: 0 0 8px rgba(232,135,58,.8); }
        .rotor { position: absolute; inset: 0; pointer-events: none; }
        .knop {
          position: absolute; left: 50%; top: 6.25%;
          width: 27px; height: 27px; border-radius: 50%;
          transform: translate(-50%, -50%);
          background: #f4f1ea;
          border: 2px solid rgba(0,0,0,.25);
          box-shadow: 0 2px 10px rgba(0,0,0,.55);
          transition: width .12s ease, height .12s ease;
        }
        .wrap.bezig .knop { width: 32px; height: 32px; }
        .onbeschikbaar {
          color: var(--secondary-text-color, rgba(244,241,234,.6));
          text-align: center; padding: 34px 10px; font-size: 15px;
        }
      </style>
      <ha-card>
        <div class="titel"></div>
        <div class="wrap" tabindex="0" role="slider" aria-label="Doeltemperatuur">
          <div class="ring spoor"></div>
          <div class="ring waarde"></div>
          <div class="face">
            <div class="doel">--</div>
            <div class="nu"><span class="stip"></span><span class="nutekst"></span></div>
          </div>
          <div class="rotor"><div class="knop"></div></div>
        </div>
        <div class="onbeschikbaar" hidden>Niet beschikbaar</div>
      </ha-card>`;
    this._el = {
      titel: this.shadowRoot.querySelector(".titel"),
      wrap: this.shadowRoot.querySelector(".wrap"),
      spoor: this.shadowRoot.querySelector(".spoor"),
      waarde: this.shadowRoot.querySelector(".waarde"),
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

  _render() {
    if (!this._el) return;
    const st = this._entiteit();
    const naam = this._config.name || (st ? st.attributes.friendly_name : null) || this._config.entity;
    this._el.titel.textContent = naam || "";
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
    const accent = uit ? "#8a8f98" : verwarmt ? "#e8873a" : "#d9a441";
    this._el.spoor.style.background =
      "conic-gradient(from -135deg, rgba(244,241,234,.10) 0deg 270deg, transparent 270deg 360deg)";
    this._el.waarde.style.background =
      `conic-gradient(from -135deg, ${accent} 0deg ${graden}deg, transparent ${graden}deg 360deg)`;
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
