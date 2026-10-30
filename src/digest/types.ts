// The contract of the digest (plan.md § 1). Page, JSON, board link and tests all build on this.
export type JobStatus = 'ok' | 'retry' | 'fail';

// One row per job in a night's run log. Times keep the offset from the log (styleguide).
export type DigestRow = {
  job: string;
  owner: string | null; // null in the log → show as — in views
  runs: number; // every line for the job, whatever its status
  retries: number; // lines with status "retry"
  lastStatus: JobStatus;
  lastError: string | null; // error on the job's last line that has one
  first: string;
  last: string;
};

export type Night = {
  night: string; // YYYY-MM-DD
  rows: DigestRow[]; // sorted by job
  badLines: number; // lines that did not parse, counted and never thrown
};

// Reads runs/<night>.jsonl. Returns null when the night has no file (the page answers 404).
// An empty file gives rows: []. Implemented in src/digest/reader.ts.
export type ReadNight = (runsDir: string, night: string) => Night | null;
