// energie-meter: compacte energiemeter in de stijl van het voorbeeld dat Alex koos:
// groot live vermogen, piekbalk (% van dagpiek), vandaag-totalen en uurbalken
// (verbruik goud omhoog, teruglevering groen omlaag). Data: live uit hass.states,
// vandaag/piek/balken via recorder/statistics_during_period (uurstatistieken).
class EnergieMeter extends HTMLElement {
  setConfig(config) {
    this._config = Object.assign(
      {
        power: 'sensor.p1_meter_vermogen',
        import: 'sensor.p1_meter_energie_import',
        export: 'sensor.p1_meter_energie_export',
        gas: 'sensor.gas_meter_gas',
        tap_path: '/energie-thuis',
      },
      config || {}
    );
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.addEventListener('click', () => {
      if (!this._config.tap_path) return;
      window.history.pushState(null, '', this._config.tap_path);
      window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
    });
  }

  set hass(hass) {
    this._hass = hass;
    const now = Date.now();
    if (!this._statsBusy && (!this._statsAt || now - this._statsAt > 60000)) {
      this._statsBusy = true;
      this._fetchStats()
        .catch(() => {})
        .then(() => {
          this._statsBusy = false;
          this._statsAt = Date.now();
          this._render();
        });
    }
    this._render();
  }

  getCardSize() {
    return 3;
  }

  async _fetchStats() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const ids = [this._config.import, this._config.export, this._config.power];
    if (this._config.gas) ids.push(this._config.gas);
    const res = await this._hass.callWS({
      type: 'recorder/statistics_during_period',
      start_time: start.toISOString(),
      end_time: new Date().toISOString(),
      statistic_ids: ids,
      period: 'hour',
      types: ['change', 'max', 'min'],
    });
    this._stats = res || {};
  }

  _fmt(v, dec) {
    if (v === undefined || v === null || isNaN(v)) return '—';
    return Number(v)
      .toFixed(dec === undefined ? 1 : dec)
      .replace('.', ',');
  }

  _powerTxt(v) {
    const a = Math.abs(v);
    if (a >= 1000) return this._fmt(a / 1000, 2) + ' kW';
    return Math.round(a) + ' W';
  }

  _render() {
    if (!this.shadowRoot || !this._hass) return;
    const c = this._config;
    const st = this._hass.states[c.power];
    const v = st ? Number(st.state) : NaN;
    const hasLive = Number.isFinite(v);
    const terug = hasLive && v < 0;

    // --- statistieken van vandaag ---
    let impToday = null,
      expToday = null,
      gasToday = null,
      peak = null;
    const hours = [];
    if (this._stats) {
      const imp = this._stats[c.import] || [];
      const exp = this._stats[c.export] || [];
      const pow = this._stats[c.power] || [];
      const gas = c.gas ? this._stats[c.gas] || [] : [];
      impToday = imp.reduce((s, r) => s + (r.change || 0), 0);
      expToday = exp.reduce((s, r) => s + (r.change || 0), 0);
      if (gas.length) gasToday = gas.reduce((s, r) => s + (r.change || 0), 0);
      if (!imp.length && !exp.length) {
        impToday = expToday = null;
      }
      peak = 0;
      pow.forEach((r) => {
        peak = Math.max(peak, Math.abs(r.max || 0), Math.abs(r.min || 0));
      });
      if (!pow.length) peak = null;
      const n = Math.max(imp.length, exp.length);
      for (let i = 0; i < n; i++) {
        hours.push({
          h: imp[i] ? new Date(imp[i].start).getHours() : exp[i] ? new Date(exp[i].start).getHours() : i,
          imp: imp[i] ? imp[i].change || 0 : 0,
          exp: exp[i] ? exp[i].change || 0 : 0,
        });
      }
    }

    let html = '<style>' +
      '.wrap{font-family:inherit;color:#FBF3E2;cursor:pointer;padding:2px 2px 0 2px;}' +
      '.live{display:flex;align-items:baseline;gap:9px;}' +
      '.live .val{font-size:29px;font-weight:800;letter-spacing:-0.01em;}' +
      '.live .val.groen{color:#8FD694;}' +
      '.live .lbl{font-size:12.5px;color:rgba(250,230,205,0.80);font-weight:600;}' +
      '.peak{margin-top:9px;}' +
      '.track{height:8px;border-radius:4px;background:rgba(255,255,255,0.09);overflow:hidden;}' +
      '.fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#69B96B 0%,#F2CD8F 55%,#E4572E 100%);background-size:' +
      '400px 100%;transition:width 0.6s ease;}' +
      '.peak .cap{display:flex;justify-content:space-between;margin-top:5px;font-size:12px;color:rgba(250,230,205,0.80);}' +
      '.peak .cap b{color:#FBF3E2;font-weight:700;}' +
      '.today{display:flex;gap:8px;margin-top:11px;}' +
      '.stat{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:8px 11px;}' +
      '.stat .k{font-size:11px;color:rgba(250,230,205,0.66);font-weight:600;letter-spacing:0.02em;}' +
      '.stat .v{font-size:16.5px;font-weight:800;margin-top:1px;}' +
      '.stat .v small{font-size:11.5px;font-weight:600;color:rgba(250,230,205,0.66);}' +
      '.bars{margin-top:12px;}' +
      '.plot{display:flex;align-items:stretch;gap:2px;height:57px;}' +
      '.col{flex:1;display:flex;flex-direction:column;}' +
      '.up{flex:1;display:flex;align-items:flex-end;}' +
      '.dn{flex:1;display:flex;align-items:flex-start;border-top:1px solid rgba(255,255,255,0.14);}' +
      '.b{width:100%;border-radius:2px;min-height:0;}' +
      '.b.i{background:#F2B25C;}' +
      '.b.e{background:#69B96B;}' +
      '.x{display:flex;gap:2px;margin-top:4px;font-size:10px;color:rgba(250,230,205,0.5);}' +
      '.x span{flex:1;text-align:left;}' +
      '</style><div class="wrap">';

    // live vermogen
    html +=
      '<div class="live"><div class="val' + (terug ? ' groen' : '') + '">' +
      (hasLive ? this._powerTxt(v) : '—') +
      '</div><div class="lbl">' +
      (hasLive ? (terug ? 'teruglevering' : 'verbruik nu') : 'geen data') +
      '</div></div>';

    // piekbalk
    if (peak !== null && peak > 0 && hasLive) {
      const pct = Math.max(2, Math.min(100, Math.round((Math.abs(v) / peak) * 100)));
      html +=
        '<div class="peak"><div class="track"><div class="fill" style="width:' + pct + '%"></div></div>' +
        '<div class="cap"><span><b>' + pct + '%</b> van dagpiek</span><span>piek ' +
        this._powerTxt(peak) + '</span></div></div>';
    }

    // vandaag-totalen
    if (impToday !== null) {
      html +=
        '<div class="today">' +
        '<div class="stat"><div class="k">VERBRUIKT VANDAAG</div><div class="v">' +
        this._fmt(impToday, 1) + ' <small>kWh</small></div></div>' +
        '<div class="stat"><div class="k">TERUG VANDAAG</div><div class="v">' +
        this._fmt(expToday, 1) + ' <small>kWh</small></div></div>' +
        (gasToday !== null
          ? '<div class="stat"><div class="k">GAS VANDAAG</div><div class="v">' +
            this._fmt(gasToday, 2) + ' <small>m³</small></div></div>'
          : '') +
        '</div>';
    }

    // uurbalken
    if (hours.length) {
      const maxH = Math.max(0.5, ...hours.map((x) => Math.max(x.imp, x.exp)));
      let cols = '';
      let labels = '';
      hours.forEach((x) => {
        const ih = Math.round((x.imp / maxH) * 100);
        const eh = Math.round((x.exp / maxH) * 100);
        cols +=
          '<div class="col"><div class="up"><div class="b i" style="height:' + ih + '%" title="' +
          x.h + ':00 verbruik ' + this._fmt(x.imp, 2) + ' kWh"></div></div>' +
          '<div class="dn"><div class="b e" style="height:' + eh + '%" title="' +
          x.h + ':00 terug ' + this._fmt(x.exp, 2) + ' kWh"></div></div></div>';
        labels += '<span>' + (x.h % 6 === 0 ? x.h : '') + '</span>';
      });
      html += '<div class="bars"><div class="plot">' + cols + '</div><div class="x">' + labels + '</div></div>';
    }

    html += '</div>';
    this.shadowRoot.innerHTML = html;
  }
}

if (!customElements.get('energie-meter')) {
  customElements.define('energie-meter', EnergieMeter);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'energie-meter',
    name: 'Energie meter',
    description: 'Live vermogen, dagpiek, vandaag-totalen en uurbalken uit de P1-meter.',
  });
}
