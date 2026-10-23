import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { fromEntity, parseCsv, parseDate } from '../src/data/mtq';
import { quebecTime } from '../src/season';

const csv = readFileSync(new URL('./zone_degel.csv', import.meta.url), 'utf8');

describe('parseCsv', () => {
  it('reads the recorded Transports Québec file', () => {
    const zones = parseCsv(csv);
    expect(zones.map((z) => z.zone)).toEqual([1, 2, 3]);
    expect(zones[1].start).toBe(quebecTime(2026, 4, 13, 0, 1));
    expect(zones[2].end).toBe(quebecTime(2026, 5, 29, 23, 59));
  });

  it('rejects files it does not understand', () => {
    expect(() => parseCsv('zone,autre\nZone 1,x')).toThrow('Missing column');
    expect(() => parseDate('le 1er mars')).toThrow('Unexpected date');
  });
});

describe('fromEntity', () => {
  it('reads the integration sensor attributes', () => {
    const data = fromEntity({
      entity_id: 'binary_sensor.degel_saison_de_degel',
      state: 'on',
      last_updated: '',
      attributes: {
        thaw_zones: [
          {
            zone: 2,
            name: 'Partie médiane du Québec',
            start: '2026-04-13T00:01:00-04:00',
            end: '2026-05-22T23:59:00-04:00',
          },
        ],
        days_before: 10,
        days_after: 3,
      },
    });
    expect(data).toEqual({
      zones: [{ zone: 2, start: quebecTime(2026, 4, 13, 0, 1), end: quebecTime(2026, 5, 22, 23, 59) }],
      daysBefore: 10,
      daysAfter: 3,
      inSeason: true,
    });
  });

  it('ignores other entities', () => {
    expect(fromEntity({ entity_id: 'sensor.x', state: '1', last_updated: '', attributes: {} })).toBeNull();
  });
});
