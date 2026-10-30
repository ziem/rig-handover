import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, JobStatus, Night, ReadNight } from './types.js';

type Line = { at: string; job: string; status: JobStatus; owner: string | null; error: string | null };

const statuses: readonly string[] = ['ok', 'retry', 'fail'];

// Parse at the edge: anything that is not a well-formed log line is undefined (counted, not thrown).
function parseLine(text: string): Line | undefined {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const o = value as Record<string, unknown>;
  if (typeof o.at !== 'string' || typeof o.job !== 'string') return undefined;
  if (typeof o.status !== 'string' || !statuses.includes(o.status)) return undefined;
  const owner = o.owner ?? null;
  const error = o.error ?? null;
  if (owner !== null && typeof owner !== 'string') return undefined;
  if (error !== null && typeof error !== 'string') return undefined;
  return { at: o.at, job: o.job, status: o.status as JobStatus, owner, error };
}

export const readNight: ReadNight = (runsDir, night): Night | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) return null;
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    return null;
  }

  const rows = new Map<string, DigestRow>();
  let badLines = 0;
  for (const raw of text.split('\n')) {
    if (raw.trim() === '') continue;
    const line = parseLine(raw);
    if (!line) {
      badLines += 1;
      continue;
    }
    const row = rows.get(line.job);
    if (!row) {
      rows.set(line.job, {
        job: line.job,
        owner: line.owner,
        runs: 1,
        retries: line.status === 'retry' ? 1 : 0,
        lastStatus: line.status,
        lastError: line.error,
        first: line.at,
        last: line.at,
      });
      continue;
    }
    row.runs += 1;
    if (line.status === 'retry') row.retries += 1;
    row.lastStatus = line.status;
    row.last = line.at;
    if (line.error !== null) row.lastError = line.error;
    if (line.owner !== null) row.owner = line.owner;
  }

  return {
    night,
    rows: [...rows.values()].sort((a, b) => (a.job < b.job ? -1 : a.job > b.job ? 1 : 0)),
    badLines,
  };
};
