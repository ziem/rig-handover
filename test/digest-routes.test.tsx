import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { Night } from '../src/digest/types.js';

function appWith(files: Record<string, string>) {
  const runsDir = mkdtempSync(join(tmpdir(), 'rig-routes-'));
  for (const [name, body] of Object.entries(files)) writeFileSync(join(runsDir, name), body);
  return createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir });
}

const good = '{"at":"2026-01-01T01:00:00+01:00","job":"b/job","status":"ok","owner":"rook"}\n';
const mixed =
  good +
  '{"at":"2026-01-01T02:00:00+01:00","job":"a/job","status":"fail","owner":null,"error":"boom"}\n' +
  'not json\n';

describe('GET /digest/:night', () => {
  it('renders the rows with 200', async () => {
    const res = await appWith({ '2026-01-01.jsonl': good }).request('/digest/2026-01-01');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('b/job');
    expect(html).toContain('rook');
  });

  it('answers 404 for a night with no file', async () => {
    const res = await appWith({}).request('/digest/2026-01-01');
    expect(res.status).toBe(404);
  });

  it('renders "nothing ran" for an empty night', async () => {
    const res = await appWith({ '2026-01-01.jsonl': '' }).request('/digest/2026-01-01');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('survives a bad line: counts it, shows — for a null owner, marks the fail', async () => {
    const res = await appWith({ '2026-01-01.jsonl': mixed }).request('/digest/2026-01-01');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('bad lines: 1');
    expect(html).toContain('—');
    expect(html).toContain('a/job !');
  });
});

describe('GET /api/digest/:night', () => {
  it('returns the rows as JSON with 200', async () => {
    const res = await appWith({ '2026-01-01.jsonl': good }).request('/api/digest/2026-01-01');
    const body = (await res.json()) as Night;
    expect(res.status).toBe(200);
    expect(body.rows.map((r) => r.job)).toEqual(['b/job']);
  });

  it('answers 404 for a night with no file', async () => {
    const res = await appWith({}).request('/api/digest/2026-01-01');
    expect(res.status).toBe(404);
  });

  it('returns no rows for an empty night', async () => {
    const res = await appWith({ '2026-01-01.jsonl': '' }).request('/api/digest/2026-01-01');
    expect(((await res.json()) as Night).rows).toEqual([]);
  });

  it('counts a bad line and keeps the same job order as the page', async () => {
    const app = appWith({ '2026-01-01.jsonl': mixed });
    const body = (await (await app.request('/api/digest/2026-01-01')).json()) as Night;
    const html = await (await app.request('/digest/2026-01-01')).text();
    expect(body.badLines).toBe(1);
    expect(body.rows.map((r) => r.job)).toEqual(['a/job', 'b/job']);
    expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('b/job'));
  });
});
