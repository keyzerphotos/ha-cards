# ha-cards

Lovelace card files for my Home Assistant, served via the jsDelivr CDN
because HACS cannot download GitHub release assets on my network.

Registered in Home Assistant as Lovelace resources (module) pointing at
`https://cdn.jsdelivr.net/gh/keyzerphotos/ha-cards@<commit>/<file>`.

## Contents (upstream project — version)

First batch:

- `apexcharts-card.js` — RomRider/apexcharts-card v2.2.3
- `clock-weather-card.js` — pkissling/clock-weather-card v2.9.6
- `modern-circular-gauge.js` — selvalt7/modern-circular-gauge v0.15.0
- `weather-radar-card/` — jpettitt/weather-radar-card v3.13.0 (JS + SVG markers;
  the small PNG control icons are not included — text-only mirror)
- `advanced-camera-card/dist/` — dermotduffy/advanced-camera-card v8.1.0

Second batch (2026-10-24):

- `mini-graph-card-bundle.js` — kalkih/mini-graph-card v0.13.0
- `stack-in-card.js` — custom-cards/stack-in-card 0.2.0
- `vertical-stack-in-card.js` — ofekashery/vertical-stack-in-card v1.1.4
- `decluttering-card.js` — custom-cards/decluttering-card v1.0.0
- `atomic-calendar-revive.js` — totaldebug/atomic-calendar-revive v10.3.1
- `simple-thermostat.js` — nervetattoo/simple-thermostat v2.5.0
- `bar-card.js` — custom-cards/bar-card 3.2.0
- `multiple-entity-row.js` — benct/lovelace-multiple-entity-row v4.13.0
- `power-flow-card-plus.js` — flixlix/power-flow-card-plus v0.3.7
- `ha-sankey-chart.js` — MindFreeze/ha-sankey-chart v6.4.4
- `history-explorer-card.js` — alexarch21/history-explorer-card v1.0.51
- `wallpanel.js` — j-a-n/lovelace-wallpanel v4.68.0
- `expander-card.js` — MelleD/lovelace-expander-card 7.3.5
- `navbar-card.js` — joseluis9595/lovelace-navbar-card v1.7.2
- `timer-bar-card.js` — rianadon/timer-bar-card v1.31.1
- `compass-card.js` — tomvanswam/compass-card v3.5.0
- `home-assistant-sun-card.js` — AitorDB/home-assistant-sun-card v0.1.4
- `calendar-card-pro.js` + `editor.js` — alexpfau/calendar-card-pro v4.2.0
- `plotly-graph-card/` — dbuezas/lovelace-plotly-graph-card v4.0.2 (all chunks)

Installed via HACS itself instead (archive route works for those):
auto-entities, swipe-card, state-switch, fold-entity-row, slider-entity-row,
hui-element, card-tools.

All mirrored files are unmodified copies of the upstream release builds.
Licenses remain with their respective projects.
