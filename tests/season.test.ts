import { describe, expect, it } from 'vitest';

import { daysUntil, endsAt, inSeason, quebecTime, status, timelineRange, DAY } from '../src/season';
import type { ThawZone } from '../src/types';

// Zone 1 in 2026, as published: 2026-03-16 00h01 to 2026-05-15 23h59 (Québec time).
const zone1: ThawZone = { zone: 1, start: quebecTime(2026, 3, 16, 0, 1), end: quebecTime(2026, 5, 15, 23, 59) };

describe('quebecTime', () => {
  it('handles standard and daylight time', () => {
    expect(new Date(quebecTime(2026, 3, 2, 0, 1)).toISOString()).toBe('2026-03-02T05:01:00.000Z'); // EST
    expect(new Date(zone1.start).toISOString()).toBe('2026-03-16T04:01:00.000Z'); // EDT (from 03-08)
    expect(new Date(zone1.end).toISOString()).toBe('2026-05-16T03:59:00.000Z');
  });
});

describe('status', () => {
  it('follows the published minutes', () => {
    expect(status(zone1, quebecTime(2026, 3, 16, 0, 0))).toBe('upcoming');
    expect(status(zone1, zone1.start)).toBe('active');
    expect(status(zone1, zone1.end + 59_000)).toBe('active');
    expect(status(zone1, endsAt(zone1))).toBe('ended');
  });
});

describe('inSeason', () => {
  it('spans the days before and after, like the integration', () => {
    expect(inSeason([zone1], zone1.start - 14 * DAY - 1, 14, 7)).toBe(false);
    expect(inSeason([zone1], zone1.start - 14 * DAY, 14, 7)).toBe(true);
    expect(inSeason([zone1], endsAt(zone1) + 7 * DAY - 1, 14, 7)).toBe(true);
    expect(inSeason([zone1], endsAt(zone1) + 7 * DAY, 14, 7)).toBe(false);
    expect(inSeason([], zone1.start, 14, 7)).toBe(false);
  });
});

describe('daysUntil', () => {
  it('counts Québec calendar days, not 24-hour blocks', () => {
    const lateEvening = quebecTime(2026, 3, 15, 23, 30);
    expect(daysUntil(lateEvening, zone1.start)).toBe(1);
    expect(daysUntil(quebecTime(2026, 3, 16, 0, 0), zone1.start)).toBe(0);
    expect(daysUntil(quebecTime(2026, 5, 1, 12, 0), zone1.end)).toBe(14);
    expect(daysUntil(quebecTime(2026, 3, 1, 12, 0), zone1.start)).toBe(15); // across the DST change
  });
});

describe('timelineRange', () => {
  it('keeps at least a week on either side', () => {
    const [start, end] = timelineRange([zone1], 0, 30);
    expect(start).toBe(zone1.start - 7 * DAY);
    expect(end).toBe(endsAt(zone1) + 30 * DAY);
  });
});
