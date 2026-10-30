import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/reader.js';

function tempRuns(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  return dir;
}

describe('readNight', () => {
  it('reads 2026-10-28: 5 jobs, 1 bad line', () => {
    const night = readNight('runs', '2026-10-28');
    expect(night?.badLines).toBe(1);
    expect(night?.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
    const fixtures = night?.rows.find((r) => r.job === 'fixtures/refresh');
    expect(fixtures).toMatchObject({
      owner: 'rook',
      runs: 4,
      retries: 3,
      lastStatus: 'ok',
      lastError: 'upstream 503',
      first: '2026-10-29T01:30:00+01:00',
      last: '2026-10-29T01:37:00+01:00',
    });
    expect(night?.rows.find((r) => r.job === 'notes/backup')).toMatchObject({
      lastStatus: 'fail',
      lastError: 'quota exceeded',
    });
  });

  it('keeps a row whose owner is null', () => {
    const row = readNight('runs', '2026-10-28')?.rows.find((r) => r.job === 'digest/render');
    expect(row?.owner).toBeNull();
  });

  it('returns null for a night with no file, and for a malformed night name', () => {
    expect(readNight('runs', '2001-01-01')).toBeNull();
    expect(readNight('runs', '../rig')).toBeNull();
  });

  it('gives no rows for an empty file', () => {
    expect(readNight(tempRuns({ '2026-01-01.jsonl': '' }), '2026-01-01')).toEqual({
      night: '2026-01-01',
      rows: [],
      badLines: 0,
    });
  });

  it('counts lines with a wrong shape as bad', () => {
    const dir = tempRuns({
      '2026-01-02.jsonl': [
        '{"at":"t1","job":"a","status":"ok","owner":"x"}',
        '{"at":"t2","job":"a","status":"weird","owner":"x"}',
        '[1,2]',
        '{"job":"b"}',
        '',
      ].join('\n'),
    });
    const night = readNight(dir, '2026-01-02');
    expect(night?.badLines).toBe(3);
    expect(night?.rows).toHaveLength(1);
  });
});
