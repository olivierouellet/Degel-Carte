/** The parts of Home Assistant's `hass` object this card uses. */
export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_updated: string;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  language?: string;
  locale?: { language: string };
}

export type Language = 'auto' | 'fr' | 'en';

export interface DegelCarteConfig {
  type: string;
  entity?: string;
  zones?: number[];
  days_before?: number;
  days_after?: number;
  title?: string;
  icon?: string;
  hide_outside_season?: boolean;
  show_timeline?: boolean;
  show_links?: boolean;
  show_load_limits?: boolean;
  show_today_label?: boolean;
  short_links?: boolean;
  language?: Language;
}

/** One zone's thaw period. `end` is the published last minute (23:59); the period is over one minute later. */
export interface ThawZone {
  zone: number;
  start: number; // epoch ms
  end: number; // epoch ms
}

export type Status = 'upcoming' | 'active' | 'ended';

/** One model for both data sources (the integration's sensor, or Transports Québec directly). */
export interface ThawData {
  zones: ThawZone[];
  daysBefore: number;
  daysAfter: number;
  /** The integration's own verdict; computed by the card in direct mode. */
  inSeason?: boolean;
}

declare global {
  interface HASSDomEvents {
    'config-changed': { config: DegelCarteConfig };
  }
}
