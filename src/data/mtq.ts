import { ZONES_URL } from '../const';
import { quebecTime } from '../season';
import type { HassEntity, ThawData, ThawZone } from '../types';

/** "2026-03-16  00h01" (two spaces in the published file; any whitespace accepted). */
const DATE = /(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2})h(\d{2})/;
const CACHE_KEY = 'degel-carte:zones';
const CACHE_MS = 6 * 3_600_000;

export function parseDate(text: string): number {
  const m = DATE.exec(text);
  if (!m) throw new Error(`Unexpected date: ${text}`);
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  return quebecTime(y, mo, d, h, mi);
}

/** Zones from the WFS CSV (no quoted commas in this file). */
export function parseCsv(text: string): ThawZone[] {
  const [header, ...rows] = text
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/);
  const columns = header.split(',');
  const col = (name: string) => {
    const index = columns.indexOf(name);
    if (index < 0) throw new Error(`Missing column: ${name}`);
    return index;
  };
  const [num, start, end] = [col('num_zone'), col('dat_debut_zone'), col('dat_fin_zone')];
  return rows
    .filter((row) => row.trim())
    .map((row) => {
      const cells = row.split(',');
      return { zone: Number(cells[num]), start: parseDate(cells[start]), end: parseDate(cells[end]) };
    })
    .sort((a, b) => a.zone - b.zone);
}

/** The three zones from Transports Québec, cached for 6 hours in this browser. */
export async function fetchZones(): Promise<ThawZone[]> {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.zones;
  } catch {
    // no storage (private window, preview): fetch
  }
  const response = await fetch(ZONES_URL);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const zones = parseCsv(await response.text());
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), zones }));
  } catch {
    // storage full or blocked: fine
  }
  return zones;
}

/** The Thaw season sensor of the Dégel integration: its `thaw_zones` attribute and window. */
export function fromEntity(stateObj: HassEntity): ThawData | null {
  const raw = stateObj.attributes.thaw_zones;
  if (!Array.isArray(raw)) return null;
  const zones = raw
    .map((z) => ({ zone: Number(z.zone), start: Date.parse(z.start), end: Date.parse(z.end) }))
    .filter((z) => !Number.isNaN(z.start) && !Number.isNaN(z.end));
  return {
    zones,
    daysBefore: Number(stateObj.attributes.days_before ?? 0),
    daysAfter: Number(stateObj.attributes.days_after ?? 0),
    inSeason: stateObj.state === 'on' ? true : stateObj.state === 'off' ? false : undefined,
  };
}
