import { LitElement, html, css, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { DegelCarteConfig, HomeAssistant } from './types';
import {
  DEFAULT_DAYS_AFTER,
  DEFAULT_DAYS_BEFORE,
  DEFAULT_ICON,
  EDITOR_TAG,
  INTEGRATION_DOMAIN,
  MAX_DAYS,
  ZONES,
} from './const';
import { Lang, localize, resolveLanguage } from './localize/localize';

type Source = 'sensor' | 'direct';

/** Values the editor shows when the config does not set them (same as the card's defaults). */
const FORM_DEFAULTS: Partial<DegelCarteConfig> = {
  hide_outside_season: false,
  show_timeline: true,
  show_links: true,
  show_load_limits: false,
  show_today_label: true,
  short_links: true,
  language: 'auto',
};

interface FormSchema {
  name: string;
  type?: string;
  title?: string;
  flatten?: boolean;
  expanded?: boolean;
  selector?: Record<string, unknown>;
  schema?: FormSchema[];
}

@customElement(EDITOR_TAG)
export class DegelCarteEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _config?: DegelCarteConfig;
  @state() private _source?: Source;

  public setConfig(config: DegelCarteConfig): void {
    this._config = config;
    if (config.zones?.length) this._source = 'direct';
    else if (config.entity) this._source = 'sensor';
  }

  private get _lang(): Lang {
    return resolveLanguage(this._config?.language, this.hass);
  }

  private _t(key: string): string {
    return localize(key, this._lang);
  }

  /** The Dégel integration's Thaw season sensors (the ones carrying `thaw_zones`). */
  private _seasonSensors(): string[] {
    return Object.values(this.hass.states)
      .filter((s) => Array.isArray(s.attributes.thaw_zones))
      .map((s) => s.entity_id);
  }

  private _currentSource(): Source {
    if (this._source) return this._source;
    return this._seasonSensors().length ? 'sensor' : 'direct';
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this.hass || !this._config) return nothing;
    const source = this._currentSource();

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${{ source }}
        .schema=${[
          {
            name: 'source',
            selector: {
              select: {
                mode: 'list',
                options: [
                  { value: 'sensor', label: this._t('editor.source_sensor') },
                  { value: 'direct', label: this._t('editor.source_direct') },
                ],
              },
            },
          },
        ]}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._sourceChanged}
      ></ha-form>

      <div class="source">${source === 'sensor' ? this._renderSensor() : this._renderDirect()}</div>

      <ha-form
        .hass=${this.hass}
        .data=${{ ...FORM_DEFAULTS, ...this._config }}
        .schema=${this._optionsSchema()}
        .computeLabel=${this._computeLabel}
        .computeHelper=${this._computeHelper}
        @value-changed=${this._optionsChanged}
      ></ha-form>
    `;
  }

  private _renderSensor(): TemplateResult {
    const sensors = this._seasonSensors();
    if (!sensors.length) return html`<div class="note">${this._t('editor.no_sensor')}</div>`;
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${{ entity: this._config!.entity }}
        .schema=${[{ name: 'entity', selector: { entity: { include_entities: sensors } } }]}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._entityChanged}
      ></ha-form>
      <a class="link" href="/config/integrations/integration/${INTEGRATION_DOMAIN}" target="_blank" rel="noopener">
        <ha-icon icon="mdi:cog-outline"></ha-icon>${this._t('editor.change_zones')}
      </a>
    `;
  }

  private _renderDirect(): TemplateResult {
    const cfg = this._config!;
    const days = {
      number: { min: 0, max: MAX_DAYS, step: 1, mode: 'box', unit_of_measurement: this._lang === 'fr' ? 'j' : 'd' },
    };
    return html`<ha-form
      .hass=${this.hass}
      .data=${{
        zones: (cfg.zones ?? []).map(String),
        days_before: cfg.days_before ?? DEFAULT_DAYS_BEFORE,
        days_after: cfg.days_after ?? DEFAULT_DAYS_AFTER,
      }}
      .schema=${[
        {
          name: 'zones',
          selector: {
            select: {
              multiple: true,
              mode: 'list',
              options: ZONES.map((z) => ({ value: String(z), label: this._t(`editor.zone_${z}`) })),
            },
          },
        },
        {
          name: '',
          type: 'grid',
          schema: [
            { name: 'days_before', selector: days },
            { name: 'days_after', selector: days },
          ],
        },
      ]}
      .computeLabel=${this._computeLabel}
      @value-changed=${this._directChanged}
    ></ha-form>`;
  }

  private _optionsSchema(): FormSchema[] {
    return [
      { name: 'title', selector: { text: {} } },
      { name: 'icon', selector: { icon: { placeholder: DEFAULT_ICON } } },
      {
        name: 'language',
        selector: {
          select: {
            mode: 'dropdown',
            options: [
              { value: 'auto', label: this._t('editor.lang_auto') },
              { value: 'fr', label: this._t('editor.lang_fr') },
              { value: 'en', label: this._t('editor.lang_en') },
            ],
          },
        },
      },
      {
        name: '',
        type: 'expandable',
        flatten: true,
        expanded: true,
        title: this._t('editor.section_display'),
        schema: [
          { name: 'hide_outside_season', selector: { boolean: {} } },
          { name: 'show_timeline', selector: { boolean: {} } },
          ...(this._config?.show_timeline === false ? [] : [{ name: 'show_today_label', selector: { boolean: {} } }]),
          { name: 'show_links', selector: { boolean: {} } },
          { name: 'show_load_limits', selector: { boolean: {} } },
          { name: 'short_links', selector: { boolean: {} } },
        ],
      },
    ];
  }

  private _computeLabel = (schema: FormSchema): string => this._t(`editor.${schema.name}`);

  private _computeHelper = (schema: FormSchema): string | undefined => {
    if (schema.name === 'title') return this._t('editor.title_helper');
    if (schema.name === 'hide_outside_season') return this._t('editor.hide_helper');
    return undefined;
  };

  private _sourceChanged(ev: CustomEvent): void {
    const source = ev.detail.value.source as Source;
    if (source === this._currentSource()) return;
    this._source = source;
    const config = { ...this._config! };
    if (source === 'sensor') {
      delete config.zones;
      delete config.days_before;
      delete config.days_after;
      const sensors = this._seasonSensors();
      if (sensors.length) config.entity = sensors[0];
    } else {
      delete config.entity;
      config.zones = [1];
    }
    this._update(config);
  }

  private _entityChanged(ev: CustomEvent): void {
    this._update({ ...this._config!, entity: ev.detail.value.entity });
  }

  private _directChanged(ev: CustomEvent): void {
    const value = ev.detail.value;
    const zones = (value.zones as string[]).map(Number).sort();
    this._update({
      ...this._config!,
      zones,
      days_before: Number(value.days_before),
      days_after: Number(value.days_after),
    });
  }

  private _optionsChanged(ev: CustomEvent): void {
    const value = { ...ev.detail.value };
    // Keep the YAML short: drop values equal to the defaults and empty titles.
    for (const [key, def] of Object.entries(FORM_DEFAULTS)) if (value[key] === def) delete value[key];
    if (!value.title) delete value.title;
    if (!value.icon) delete value.icon;
    this._update(value as DegelCarteConfig);
  }

  private _update(config: DegelCarteConfig): void {
    this._config = config;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }));
  }

  static styles = css`
    .source {
      margin: 8px 0 16px;
    }
    .note {
      color: var(--secondary-text-color);
      padding: 8px 0;
    }
    .link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      color: var(--primary-color);
      text-decoration: none;
      --mdc-icon-size: 18px;
    }
  `;
}
