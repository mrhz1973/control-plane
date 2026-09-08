#!/usr/bin/env node
import { readFileSync } from 'node:fs';

function invalid() {
  process.stderr.write('INVALID_KV_LINES\n');
  process.exit(2);
}

const arg = process.argv[2];
if (!arg) invalid();

let text;
try {
  text = readFileSync(arg, 'utf8');
} catch {
  invalid();
}

const map = new Map();
for (const rawLine of text.split(/\r?\n/)) {
  const t = rawLine.trim();
  if (t.length === 0) continue;
  if (t[0] === '#') continue;
  const idx = t.indexOf('=');
  if (idx < 0) invalid();
  const key = t.slice(0, idx).trim();
  if (key.length === 0) invalid();
  if (map.has(key)) invalid();
  map.set(key, t.slice(idx + 1).trim());
}

const out = {};
for (const k of [...map.keys()].sort()) out[k] = map.get(k);
process.stdout.write(JSON.stringify(out) + '\n');
process.exit(0);
