/**
 * Dev harness: renders the card on several dates with a mock `hass`, plus minimal
 * stand-ins for ha-card and ha-icon. Run with `yarn start`. URL options: `?dark&lang=en&width=320`.
 */
import '../src/degel-carte';
import type { DegelCarte } from '../src/degel-carte';
import type { DegelCarteConfig, HomeAssistant } from '../src/types';
import { quebecTime } from '../src/season';
import * as mdi from '@mdi/js';

class HaCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).innerHTML = `<style>:host{display:block;background:var(--card-background-color);
      border-radius:var(--ha-card-border-radius);box-shadow:var(--ha-card-box-shadow);color:var(--primary-text-color)}</style><slot></slot>`;
  }
}
customElements.define('ha-card', HaCard);

/** Real Material Design Icons, as Home Assistant draws them, so screenshots match. */
class HaIcon extends HTMLElement {
  static observedAttributes = ['icon'];
  attributeChangedCallback() {
    const name = (this.getAttribute('icon') ?? '').replace(/^mdi:/, '');
    const key = 'mdi' + name.replace(/(^|-)(\w)/g, (_, _dash, c: string) => c.toUpperCase());
    const path = (mdi as Record<string, string>)[key] ?? '';
    // In a shadow root: light-DOM children would shift the nodes Lit binds to while it clones templates.
    this.style.cssText = 'display:inline-flex;width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px)';
    (this.shadowRoot ?? this.attachShadow({ mode: 'open' })).innerHTML =
      `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="${path}"/></svg>`;
  }
}
customElements.define('ha-icon', HaIcon);

const params = new URLSearchParams(location.search);
if (params.has('dark')) document.body.classList.add('dark');
// Phone-width check: ?width=320 lays the cards out in one column of that width.
if (params.get('width')) document.getElementById('cards')!.style.gridTemplateColumns = `${params.get('width')}px`;

// The 2026 dates, as the integration's Thaw season sensor publishes them.
const iso = (y: number, m: number, d: number, h: number, mi: number) =>
  new Date(quebecTime(y, m, d, h, mi)).toISOString();
const hass: HomeAssistant = {
  language: params.get('lang') ?? 'fr',
  states: {
    'binary_sensor.degel_saison_de_degel': {
      entity_id: 'binary_sensor.degel_saison_de_degel',
      state: 'on',
      last_updated: '',
      attributes: {
        thaw_zones: [
          { zone: 1, start: iso(2026, 3, 16, 0, 1), end: iso(2026, 5, 15, 23, 59) },
          { zone: 2, start: iso(2026, 4, 13, 0, 1), end: iso(2026, 5, 22, 23, 59) },
          { zone: 3, start: iso(2026, 4, 20, 0, 1), end: iso(2026, 5, 29, 23, 59) },
        ],
        days_before: 14,
        days_after: 7,
      },
    },
  },
};
// The card trusts the sensor's on/off; in the harness, let it compute the season from `now`.
const withoutState = { ...hass.states['binary_sensor.degel_saison_de_degel'], state: 'unknown' };
hass.states['binary_sensor.degel_saison_de_degel'] = withoutState;

const scenarios: Array<{ label: string; now: number; config: Partial<DegelCarteConfig>; preview?: boolean }> = [
  { label: 'Avant · 5 mars', now: quebecTime(2026, 3, 5, 9, 0), config: {} },
  { label: 'Pendant · 16 avril', now: quebecTime(2026, 4, 16, 9, 0), config: { show_load_limits: true } },
  { label: 'Zone 2 seule · 21 mai', now: quebecTime(2026, 5, 21, 9, 0), config: { zones: [2], entity: undefined } },
  { label: 'English · 16 April', now: quebecTime(2026, 4, 16, 9, 0), config: { language: 'en' } },
  {
    label: 'Après · masquée hors saison (édition)',
    now: quebecTime(2026, 10, 22, 9, 0),
    config: { hide_outside_season: true },
    preview: true,
  },
  {
    label: 'Sans « Aujourd’hui » · liens complets',
    now: quebecTime(2026, 4, 16, 9, 0),
    config: { show_today_label: false, short_links: false, show_load_limits: true },
  },
  {
    label: 'Sans ligne du temps',
    now: quebecTime(2026, 4, 16, 9, 0),
    config: { show_timeline: false, show_links: false },
  },
];

// README screenshots: ?shot shows French and English during the thaw, without labels.
const shown = params.has('shot') ? [scenarios[1], scenarios[3]] : scenarios;
if (params.has('shot')) document.body.classList.add('shot');

const grid = document.getElementById('cards')!;
for (const s of shown) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.innerHTML = `<h3>${s.label}</h3>`;
  const card = document.createElement('degel-carte') as DegelCarte;
  card.setConfig({ type: 'custom:degel-carte', entity: 'binary_sensor.degel_saison_de_degel', ...s.config });
  card.now = s.now;
  card.preview = !!s.preview;
  card.hass = hass;
  cell.append(card);
  grid.append(cell);
}
