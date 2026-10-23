export const CARD_VERSION = '1.0.0';
export const CARD_TAG = 'degel-carte';
export const EDITOR_TAG = 'degel-carte-editor';

/** Integration domain of the companion Home Assistant integration. */
export const INTEGRATION_DOMAIN = 'degel';

/** The published dates and times are Québec local time. */
export const QUEBEC_TZ = 'America/Toronto';

export const DEFAULT_ICON = 'mdi:truck-snowflake';

export const ZONES = [1, 2, 3] as const;
export const DEFAULT_DAYS_BEFORE = 14;
export const DEFAULT_DAYS_AFTER = 7;
export const MAX_DAYS = 60;

/** WFS service behind the Données Québec "Zone de dégel" CSV: the three zones without their geometry. */
export const ZONES_URL =
  'https://ws.mapserver.transports.gouv.qc.ca/swtq?service=wfs&version=2.0.0&request=getfeature&typename=ms:zone_degel&outputformat=csv';

export const INFO_URL =
  'https://www.transports.gouv.qc.ca/fr/entreprises-partenaires/ent-camionnage/degel/Pages/Periode-de-degel.aspx';
export const ZONES_MAP_URL = 'https://geoegl.msp.gouv.qc.ca/igo2/apercu-qc/?context=mtq&visiblelayers=zones_degel';
export const LOAD_LIMITS_MAP_URL =
  'https://geoegl.msp.gouv.qc.ca/igo2/apercu-qc/?context=mtq&visiblelayers=pes_v_limtn_charg';
