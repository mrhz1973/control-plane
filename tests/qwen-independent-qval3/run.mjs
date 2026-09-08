#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const kv = join(here, '..', '..', 'reports', 'runtime', 'qwen-qualification', 'qval3', 'kv-lines.mjs');

let failures = 0;
function check(name, cond) {
  if (cond) {
    process.stdout.write(`PASS ${name}\n`);
  } else {
    process.stderr.write(`FAIL ${name}\n`);
    failures++;
  }
}

const dir = mkdtempSync(join(tmpdir(), 'qval3-'));

function runFile(content) {
  const p = join(dir, `case-${Math.random().toString(36).slice(2)}.txt`);
  writeFileSync(p, content, 'utf8');
  const r = spawnSync('node', [kv, p], { encoding: 'utf8' });
  return r;
}

// 1. ordinary two-key input; sorted output
{
  const r = runFile('b=2\na=1\n');
  check('two-key exit 0', r.status === 0);
  let obj = null;
  try { obj = JSON.parse(r.stdout.trim()); } catch {}
  check('two-key parsed', obj !== null);
  check('two-key values', obj && obj.a === '1' && obj.b === '2');
  const keys = obj ? Object.keys(obj) : [];
  check('sorted keys', keys.length === 2 && keys[0] === 'a' && keys[1] === 'b');
}

// 2. blank/comment ignored
{
  const r = runFile('\n# comment\nk=v\n\n');
  check('comment exit 0', r.status === 0);
  const obj = JSON.parse(r.stdout.trim());
  check('comment keys', Object.keys(obj).length === 1 && obj.k === 'v');
}

// 3. values with additional '='
{
  const r = runFile('url=https://x/?a=1&b=2\n');
  check('eq-in-value exit 0', r.status === 0);
  const obj = JSON.parse(r.stdout.trim());
  check('eq-in-value value', obj.url === 'https://x/?a=1&b=2');
}

// 4. duplicate key
{
  const r = runFile('a=1\na=2\n');
  check('dup exit 2', r.status === 2);
  check('dup stderr', r.stderr.trim() === 'INVALID_KV_LINES');
}

// 5. missing '='
{
  const r = runFile('noeq\n');
  check('noeq exit 2', r.status === 2);
  check('noeq stderr', r.stderr.trim() === 'INVALID_KV_LINES');
}

// 6. empty key
{
  const r = runFile('=v\n');
  check('emptykey exit 2', r.status === 2);
  check('emptykey stderr', r.stderr.trim() === 'INVALID_KV_LINES');
}

try {
  rmSync(dir, { recursive: true, force: true });
} catch {}

if (failures > 0) {
  process.stderr.write(`FAILURES=${failures}\n`);
  process.exit(1);
}
process.stdout.write('ALL_PASS\n');
process.exit(0);
