import { QUEBEC_TZ } from './const';
import type { Status, ThawZone } from './types';

export const MINUTE = 60_000;
export const DAY = 86_400_000;

/** When the period is over: one minute after the published 23:59. */
export function endsAt(zone: ThawZone): number {
  return zone.end + MINUTE;
}

export function status(zone: ThawZone, now: number): Status {
  if (now < zone.start) return 'upcoming';
  return now < endsAt(zone) ? 'active' : 'ended';
}

/** From `before` days before the start until `after` days after the end (same rule as the integration). */
export function window(zone: ThawZone, before: number, after: number): [number, number] {
  return [zone.start - before * DAY, endsAt(zone) + after * DAY];
}

export function inSeason(zones: ThawZone[], now: number, before: number, after: number): boolean {
  return zones.some((z) => {
    const [start, end] = window(z, before, after);
    return start <= now && now < end;
  });
}

const dayParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: QUEBEC_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Days since the epoch of the calendar day `t` falls on in Québec. */
function dayNumber(t: number): number {
  const [y, m, d] = dayParts.format(t).split('-').map(Number);
  return Date.UTC(y, m - 1, d) / DAY;
}

/** Calendar days from `now` to `t` in Québec: 0 today, 1 tomorrow, negative in the past. */
export function daysUntil(now: number, t: number): number {
  return dayNumber(t) - dayNumber(now);
}

/** Offset of Québec time from UTC at `t`, in ms (−4 h in summer, −5 h in winter). */
function quebecOffset(t: number): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: QUEBEC_TZ,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    })
      .formatToParts(t)
      .map((p) => [p.type, Number(p.value)]),
  );
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - Math.floor(t / MINUTE) * MINUTE;
}

/** Epoch ms of a Québec wall-clock time. */
export function quebecTime(year: number, month: number, day: number, hour: number, minute: number): number {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const guess = wall - quebecOffset(wall);
  return wall - quebecOffset(guess);
}

/** Range for the timeline: the windows of all zones, at least a week either side. */
export function timelineRange(zones: ThawZone[], before: number, after: number): [number, number] {
  const start = Math.min(...zones.map((z) => z.start)) - Math.max(before, 7) * DAY;
  const end = Math.max(...zones.map(endsAt)) + Math.max(after, 7) * DAY;
  return [start, end];
}
