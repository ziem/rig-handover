import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createApp } from './app.js';

// Saves /digest/<night> as one self-contained HTML file (ADR 0001, 0003).
// Usage: tsx --env-file-if-exists=.env src/save-preview.ts <night> <out>
// The output belongs outside git: var/ is ignored. Unset LANE_MARKER to save the clean copy.
const [night = '2026-10-28', out = 'var/preview.html'] = process.argv.slice(2);
const res = await createApp().request(`/digest/${night}`);
if (res.status !== 200) throw new Error(`/digest/${night} answered ${res.status}`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, await res.text());
console.log(`saved ${out}`);
