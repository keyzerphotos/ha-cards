// neerslag-kaart: toont verwachte neerslag (mm) uit een weather-entiteit.
// Modi: 'vandaag' (één regel: vandaag + morgen), 'dagen' (dagrijen met temp-bereik + mm),
// 'uren' (uurrijen met mm-balkjes). Data via weather/subscribe_forecast.
class NeerslagKaart extends HTMLElement {
  setConfig(config) {
    if (!config || !config.entity) throw new Error('neerslag-kaart: entity is verplicht');
    this._config = Object.assign({ mode: 'vandaag', limit: 4, surface: false }, config);
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
  }

  set hass(hass) {
    this._hass = hass;
    if (this._started) return;
    this._started = true;
    const type = this._config.mode === 'uren' ? 'hourly' : 'daily';
    hass.connection
      .subscribeMessage(
        (ev) => this._render(ev && ev.forecast ? ev.forecast : []),
        { type: 'weather/subscribe_forecast', entity_id: this._config.entity, forecast_type: type }
      )
      .catch(() => this._render([]));
  }

  getCardSize() {
    return this._config.mode === 'vandaag' ? 1 : Math.min(this._config.limit || 4, 8);
  }

  _fmt(v, dec) {
    if (v === undefined || v === null || isNaN(v)) return '—';
    return Number(v).toFixed(dec === undefined ? 1 : dec).replace('.', ',');
  }

  _wrap(inner) {
    const surface = this._config.surface
      ? 'background:rgba(41,37,38,0.96);border:1px solid rgba(255,255,255,0.09);' +
        'border-radius:26px;padding:14px 18px;box-shadow:0 4px 14px rgba(0,0,0,0.25);'
      : '';
    return (
      '<style>' +
      '.wrap{font-family:inherit;color:#FBF3E2;' + surface + '}' +
      '.row{display:flex;align-items:center;gap:10px;padding:7px 0;' +
      'border-bottom:1px solid rgba(255,255,255,0.07);}' +
      '.row:last-child{border-bottom:none;}' +
      '.dag{width:38px;font-weight:700;font-size:14px;text-transform:capitalize;}' +
      '.uur{width:46px;font-weight:700;font-size:14px;}' +
      '.temp{flex:1;color:rgba(250,230,205,0.80);font-size:13.5px;}' +
      '.mm{font-weight:700;font-size:14px;color:#9CC3E5;white-space:nowrap;}' +
      '.mm.nul{color:rgba(250,230,205,0.45);font-weight:600;}' +
      '.bar{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,0.08);overflow:hidden;}' +
      '.bar > div{height:100%;background:#7FB2E0;border-radius:3px;}' +
      'ha-icon{--mdc-icon-size:18px;color:#9CC3E5;flex:0 0 auto;}' +
      '.eenregel{display:flex;align-items:center;gap:10px;padding:2px 0;}' +
      '.eenregel .txt{font-size:14px;}' +
      '.eenregel .txt b{font-weight:800;}' +
      '</style><div class="wrap">' + inner + '</div>'
    );
  }

  _render(fc) {
    if (!this.shadowRoot) return;
    const mode = this._config.mode;
    const limit = this._config.limit || 4;
    let inner = '';
    if (mode === 'vandaag') {
      const v = fc[0] ? fc[0].precipitation : null;
      const m = fc[1] ? fc[1].precipitation : null;
      inner =
        '<div class="eenregel"><ha-icon icon="mdi:weather-rainy"></ha-icon>' +
        '<div class="txt">Neerslag vandaag <b>' + this._fmt(v) + ' mm</b>' +
        ' · morgen <b>' + this._fmt(m) + ' mm</b></div></div>';
    } else if (mode === 'dagen') {
      inner = fc.slice(0, limit).map((d) => {
        const dt = new Date(d.datetime);
        const dag = dt.toLocaleDateString('nl-NL', { weekday: 'short' }).replace('.', '');
        const mm = d.precipitation === undefined || d.precipitation === null ? 0 : Number(d.precipitation);
        return (
          '<div class="row"><div class="dag">' + dag + '</div>' +
          '<div class="temp">' + this._fmt(d.templow, 0) + '° – ' + this._fmt(d.temperature, 0) + '°</div>' +
          '<ha-icon icon="mdi:water"></ha-icon>' +
          '<div class="mm' + (mm > 0 ? '' : ' nul') + '">' + this._fmt(mm) + ' mm</div></div>'
        );
      }).join('');
    } else {
      const items = fc.slice(0, limit);
      inner = items.map((h) => {
        const dt = new Date(h.datetime);
        const uur = dt.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
        const mm = h.precipitation === undefined || h.precipitation === null ? 0 : Number(h.precipitation);
        const pct = Math.min(100, Math.round((mm / 5) * 100));
        return (
          '<div class="row"><div class="uur">' + uur + '</div>' +
          '<div class="temp">' + this._fmt(h.temperature) + '°</div>' +
          '<div class="bar"><div style="width:' + pct + '%"></div></div>' +
          '<div class="mm' + (mm > 0 ? '' : ' nul') + '">' + this._fmt(mm) + ' mm</div></div>'
        );
      }).join('');
    }
    this.shadowRoot.innerHTML = this._wrap(inner);
  }
}
customElements.define('neerslag-kaart', NeerslagKaart);
window.customCards = window.customCards || [];
window.customCards.push({ type: 'neerslag-kaart', name: 'Neerslag kaart', preview: false });
