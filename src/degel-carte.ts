import { LitElement, html, css, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { DegelCarteConfig, HomeAssistant, Status, ThawData, ThawZone } from './types';
import {
  CARD_TAG,
  CARD_VERSION,
  DEFAULT_DAYS_AFTER,
  DEFAULT_DAYS_BEFORE,
  DEFAULT_ICON,
  EDITOR_TAG,
  INFO_URL,
  LOAD_LIMITS_MAP_URL,
  QUEBEC_TZ,
  ZONES_MAP_URL,
} from './const';
import { fetchZones, fromEntity } from './data/mtq';
import { daysUntil, endsAt, inSeason, status, timelineRange } from './season';
import { Lang, intlLocale, localize, resolveLanguage } from './localize/localize';

console.info(
  `%c  DÉGEL-CARTE \n%c  Version ${CARD_VERSION}    `,
  'color: #0b4f7c; font-weight: bold; background: #e3f2fb',
  'color: white; font-weight: bold; background: #0b4f7c',
);

interface WindowWithCustomCards extends Window {
  customCards: Array<{ type: string; name: string; description: string; preview?: boolean; documentationURL?: string }>;
}
const w = window as unknown as WindowWithCustomCards;
w.customCards = w.customCards || [];
w.customCards.push({
  type: CARD_TAG,
  name: 'Dégel-Carte',
  description:
    'Période de dégel au Québec (zones 1, 2 et 3) · Québec thaw period. Intégration Dégel ou Transports Québec. FR / EN.',
  preview: true,
  documentationURL: 'https://github.com/olivierouellet/Degel-Carte',
});

const DEFAULTS = {
  hide_outside_season: false,
  show_timeline: true,
  show_links: true,
  show_load_limits: false,
  show_today_label: true,
  short_links: true,
  language: 'auto',
} as const;

type ResolvedConfig = DegelCarteConfig & Required<Pick<DegelCarteConfig, keyof typeof DEFAULTS>>;

const STATUS_ICONS: Record<Status, string> = {
  upcoming: 'mdi:calendar-clock',
  active: 'mdi:truck-alert',
  ended: 'mdi:check-circle-outline',
};

/** Direct mode re-reads the (cached) zones this often. */
const REFRESH_MS = 3_600_000;

@customElement(CARD_TAG)
export class DegelCarte extends LitElement {
  public static async getConfigElement(): Promise<HTMLElement> {
    await import('./editor');
    return document.createElement(EDITOR_TAG);
  }

  /** Default config when the card is added from the picker: the integration's sensor, else zone 1 directly. */
  public static getStubConfig(hass: HomeAssistant): Partial<DegelCarteConfig> {
    const sensor = Object.values(hass.states).find((s) => Array.isArray(s.attributes.thaw_zones));
    return sensor ? { entity: sensor.entity_id } : { zones: [1] };
  }

  @property({ attribute: false }) public preview = false;

  @state() private _config?: ResolvedConfig;
  @state() private _fetched?: ThawZone[];
  @state() private _error?: string;
  /** Set by the dev harness to try other dates. */
  @state() public now?: number;
  @state() private _tick = Date.now();

  private _hass?: HomeAssistant;
  private _fetchedAt = 0;
  private _timer?: number;

  public setConfig(config: DegelCarteConfig): void {
    if (!config) throw new Error('Invalid configuration');
    if (config.entity && config.zones?.length) throw new Error(localize('card.both_sources', 'fr'));
    const previous = this._config;
    this._config = { ...DEFAULTS, ...config } as ResolvedConfig;
    if (previous?.entity !== config.entity) this._fetchedAt = 0;
    this._maybeFetch();
    this._updateHidden();
  }

  /** Set synchronously so Home Assistant sees `hidden` in the same update and collapses the card's space. */
  public get hass(): HomeAssistant | undefined {
    return this._hass;
  }
  public set hass(hass: HomeAssistant | undefined) {
    const old = this._hass;
    this._hass = hass;
    this._updateHidden();
    this.requestUpdate('hass', old);
  }

  public getCardSize(): number {
    return 1 + (this._config?.zones?.length ?? 1) * 2;
  }

  public getGridOptions() {
    return { columns: 12, min_columns: 6, rows: 'auto' as const };
  }

  public connectedCallback(): void {
    super.connectedCallback();
    // Days left and the today marker move at midnight; a minute is plenty.
    this._timer = window.setInterval(() => {
      this._tick = Date.now();
      this._maybeFetch();
      this._updateHidden();
    }, 60_000);
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    window.clearInterval(this._timer);
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has('preview') || changed.has('now') || changed.has('_fetched')) this._updateHidden();
  }

  private _now(): number {
    return this.now ?? this._tick;
  }

  private _maybeFetch(): void {
    const cfg = this._config;
    if (!cfg || cfg.entity || !cfg.zones?.length) return;
    if (Date.now() - this._fetchedAt < REFRESH_MS) return;
    this._fetchedAt = Date.now();
    fetchZones()
      .then((zones) => {
        this._fetched = zones;
        this._error = undefined;
      })
      .catch((err) => {
        console.warn('Dégel-Carte:', err);
        this._fetchedAt = Date.now() - REFRESH_MS + 300_000; // retry in 5 minutes
        if (!this._fetched) this._error = 'card.fetch_failed';
      });
  }

  /** The zones and window to show, from the sensor or from the direct download. */
  private _data(): ThawData | null {
    const cfg = this._config;
    if (!cfg) return null;
    if (cfg.entity) {
      const stateObj = this._hass?.states[cfg.entity];
      return stateObj ? fromEntity(stateObj) : null;
    }
    if (!this._fetched || !cfg.zones?.length) return null;
    const wanted = new Set(cfg.zones.map(Number));
    return {
      zones: this._fetched.filter((z) => wanted.has(z.zone)),
      daysBefore: cfg.days_before ?? DEFAULT_DAYS_BEFORE,
      daysAfter: cfg.days_after ?? DEFAULT_DAYS_AFTER,
    };
  }

  private _outsideSeason(): boolean {
    const data = this._data();
    if (!data) return false;
    return !(data.inSeason ?? inSeason(data.zones, this._now(), data.daysBefore, data.daysAfter));
  }

  /** `hide_outside_season`: hidden on the dashboard, never while editing it. */
  private _updateHidden(): void {
    const hidden = !!this._config?.hide_outside_season && !this.preview && this._outsideSeason();
    if (this.hidden !== hidden) {
      this.hidden = hidden;
      this.dispatchEvent(new Event('card-visibility-changed', { bubbles: true, composed: true }));
    }
  }

  protected render(): TemplateResult | typeof nothing {
    const cfg = this._config;
    if (!cfg || !this._hass || this.hidden) return nothing;
    const lang = resolveLanguage(cfg.language, this._hass);
    const t = (key: string, vars?: Record<string, string>) => localize(key, lang, vars);

    const data = this._data();
    let message: string | undefined;
    if (!cfg.entity && !cfg.zones?.length) message = t('card.no_source');
    else if (cfg.entity && !this._hass.states[cfg.entity]) message = t('card.entity_not_found', { entity: cfg.entity });
    else if (cfg.entity && !data) message = t('card.no_thaw_data', { entity: cfg.entity });
    else if (this._error) message = t(this._error);

    return html`
      <ha-card>
        <div class="header">
          <ha-icon icon=${cfg.icon || DEFAULT_ICON}></ha-icon>
          <div class="title">${cfg.title || t('card.default_title')}</div>
        </div>
        ${
          message
            ? html`<div class="message">${message}</div>`
            : !data
              ? html`<div class="message muted">${t('card.loading')}</div>`
              : this._renderZones(data, lang)
        }
        ${
          cfg.hide_outside_season && this.preview && this._outsideSeason()
            ? html`<div class="note"><ha-icon icon="mdi:eye-off-outline"></ha-icon>${t('card.hidden_note')}</div>`
            : nothing
        }
        ${cfg.show_links || cfg.show_load_limits ? this._renderLinks(lang) : nothing}
      </ha-card>
    `;
  }

  private _renderZones(data: ThawData, lang: Lang): TemplateResult {
    const cfg = this._config!;
    const t = (key: string, vars?: Record<string, string>) => localize(key, lang, vars);
    const now = this._now();
    const zones = [...data.zones].sort((a, b) => a.zone - b.zone);
    const range = zones.length ? timelineRange(zones, data.daysBefore, data.daysAfter) : null;
    const pos = (t: number) => (range ? ((t - range[0]) / (range[1] - range[0])) * 100 : 0);
    const dates = new Intl.DateTimeFormat(intlLocale(lang), {
      timeZone: QUEBEC_TZ,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const allEnded = zones.length > 0 && zones.every((z) => status(z, now) === 'ended');
    const showToday = range && now >= range[0] && now <= range[1];

    return html`
      <div class="zones">
        ${zones.map((zone) => {
          const s = status(zone, now);
          return html`
            <div class="zone ${s}">
              <div class="row">
                <div class="name">
                  <b>${t('card.zone', { zone: String(zone.zone) })}</b>
                  <span class="part">${t(`card.zone_${zone.zone}`)}</span>
                </div>
                <div class="badge"><ha-icon icon=${STATUS_ICONS[s]}></ha-icon>${t(`card.status_${s}`)}</div>
              </div>
              <div class="row detail">
                <span>${dates.formatRange(zone.start, zone.end)}</span>
                <span class="countdown">${this._countdown(zone, s, now, lang)}</span>
              </div>
              ${
                cfg.show_timeline && range
                  ? html`<div class="track">
                      <div class="bar" style="left:${pos(zone.start)}%;width:${pos(endsAt(zone)) - pos(zone.start)}%">
                        ${
                          s === 'active'
                            ? html`<div
                                class="elapsed"
                                style="width:${((now - zone.start) / (endsAt(zone) - zone.start)) * 100}%"
                              ></div>`
                            : nothing
                        }
                      </div>
                      ${showToday ? html`<div class="today" style="left:${pos(now)}%"></div>` : nothing}
                    </div>`
                  : nothing
              }
            </div>
          `;
        })}
        ${cfg.show_timeline && range ? this._renderAxis(range, pos, lang, showToday && cfg.show_today_label ? pos(now) : undefined) : nothing}
        ${
          allEnded
            ? html`<div class="message muted small">
                ${t('card.next_year', { year: String(new Date(zones[0].start).getFullYear() + 1) })}
              </div>`
            : nothing
        }
      </div>
    `;
  }

  private _countdown(zone: ThawZone, s: Status, now: number, lang: Lang): string {
    const t = (key: string, vars?: Record<string, string>) => localize(key, lang, vars);
    if (s === 'upcoming') {
      const days = daysUntil(now, zone.start);
      return days <= 0
        ? t('card.starts_today')
        : days === 1
          ? t('card.starts_tomorrow')
          : t('card.starts_in', { days: String(days) });
    }
    if (s === 'active') {
      const days = daysUntil(now, zone.end);
      return days <= 0
        ? t('card.ends_today')
        : days === 1
          ? t('card.ends_tomorrow')
          : t('card.days_left', { days: String(days) });
    }
    return '';
  }

  /** Month ticks under the tracks, and "today" when it is in range. */
  private _renderAxis(range: [number, number], pos: (t: number) => number, lang: Lang, today?: number): TemplateResult {
    const month = new Intl.DateTimeFormat(intlLocale(lang), { timeZone: QUEBEC_TZ, month: 'short' });
    const ticks: number[] = [];
    const first = new Date(range[0]);
    for (
      let d = new Date(first.getFullYear(), first.getMonth() + 1, 1);
      d.getTime() < range[1];
      d.setMonth(d.getMonth() + 1)
    ) {
      ticks.push(d.getTime());
    }
    return html`
      <div class="axis">
        ${ticks.map((tick) => html`<span class="tick" style="left:${pos(tick)}%">${month.format(tick)}</span>`)}
        ${
          today !== undefined
            ? html`<span
                class="today-label"
                style="left:${today}%;transform:translateX(${today < 10 ? -today * 5 : today > 90 ? -50 - (today - 90) * 5 : -50}%)"
                >${localize('card.today', lang)}</span
              >`
            : nothing
        }
      </div>
    `;
  }

  private _renderLinks(lang: Lang): TemplateResult {
    const cfg = this._config!;
    const t = (key: string) => localize(key, lang);
    const short = cfg.short_links ? '_short' : '';
    const link = (href: string, icon: string, label: string) =>
      html`<a href=${href} target="_blank" rel="noopener noreferrer"><ha-icon icon=${icon}></ha-icon>${label}</a>`;
    return html`
      <div class="links">
        ${cfg.show_links ? link(INFO_URL, 'mdi:open-in-new', t('card.link_info')) : nothing}
        ${cfg.show_links ? link(ZONES_MAP_URL, 'mdi:map-outline', t(`card.link_map${short}`)) : nothing}
        ${cfg.show_load_limits ? link(LOAD_LIMITS_MAP_URL, 'mdi:weight', t(`card.link_load_limits${short}`)) : nothing}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      --degel-upcoming: var(--info-color, #039be5);
      --degel-active: var(--warning-color, #ffa600);
      --degel-ended: var(--disabled-color, #bdbdbd);
    }
    :host([hidden]) {
      display: none;
    }
    ha-card {
      padding: 12px 16px 12px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .header ha-icon {
      color: var(--degel-upcoming);
    }
    .title {
      font-size: 1.15em;
      font-weight: 500;
    }
    .zones {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .zone > .row:first-child {
      flex-wrap: nowrap;
    }
    .name {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .part {
      color: var(--secondary-text-color);
      margin-left: 4px;
    }
    .badge {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85em;
      font-weight: 500;
      padding: 2px 8px 2px 6px;
      border-radius: 12px;
      color: var(--zone-color);
      background: color-mix(in srgb, var(--zone-color) 16%, transparent);
      --mdc-icon-size: 16px;
    }
    .zone.upcoming {
      --zone-color: var(--degel-upcoming);
    }
    .zone.active {
      --zone-color: var(--degel-active);
    }
    .zone.ended {
      --zone-color: var(--degel-ended);
    }
    .zone.ended .badge {
      color: var(--secondary-text-color);
    }
    .detail {
      font-size: 0.9em;
      color: var(--secondary-text-color);
      margin-top: 2px;
    }
    .countdown {
      margin-left: auto;
      color: var(--primary-text-color);
      font-weight: 500;
    }
    .track {
      position: relative;
      height: 8px;
      margin-top: 6px;
      border-radius: 4px;
      background: var(--secondary-background-color, rgba(127, 127, 127, 0.15));
    }
    .bar {
      position: absolute;
      top: 0;
      bottom: 0;
      border-radius: 4px;
      overflow: hidden;
      background: color-mix(in srgb, var(--zone-color) 45%, transparent);
    }
    .elapsed {
      height: 100%;
      background: var(--zone-color);
    }
    .today {
      position: absolute;
      top: -3px;
      bottom: -3px;
      width: 2px;
      margin-left: -1px;
      background: var(--primary-text-color);
      border-radius: 1px;
    }
    .axis {
      position: relative;
      height: 16px;
      font-size: 0.75em;
      color: var(--secondary-text-color);
      margin-top: -6px;
    }
    .tick,
    .today-label {
      position: absolute;
      transform: translateX(-50%);
      white-space: nowrap;
    }
    .today-label {
      top: 14px;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .axis:has(.today-label) {
      height: 32px;
    }
    .message {
      padding: 8px 0;
    }
    .muted {
      color: var(--secondary-text-color);
    }
    .small {
      font-size: 0.9em;
      padding: 0;
    }
    .note {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      font-size: 0.85em;
      color: var(--secondary-text-color);
      --mdc-icon-size: 18px;
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 16px;
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px solid var(--divider-color);
      font-size: 0.9em;
    }
    .links a {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--primary-color);
      text-decoration: none;
      --mdc-icon-size: 16px;
    }
    .links a:hover {
      text-decoration: underline;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'degel-carte': DegelCarte;
  }
}
