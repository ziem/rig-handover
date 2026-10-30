import type { Night } from './types.js';

// Board counts for one night. The digest rows keep no per-line ok or fail counts, so these are
// per job: ok and fail count the rows whose last status is ok or fail; retries sums the rows.
export type NightCounts = { ok: number; retry: number; fail: number };

export function countStatuses(night: Night): NightCounts {
  let ok = 0;
  let retry = 0;
  let fail = 0;
  for (const row of night.rows) {
    if (row.lastStatus === 'ok') ok += 1;
    if (row.lastStatus === 'fail') fail += 1;
    retry += row.retries;
  }
  return { ok, retry, fail };
}
