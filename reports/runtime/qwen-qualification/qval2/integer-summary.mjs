#!/usr/bin/env node
const raw = process.argv[2];
let arr;
try {
  arr = JSON.parse(raw);
} catch {
  process.stderr.write("INVALID_INTEGER_ARRAY\n");
  process.exit(2);
}
if (!Array.isArray(arr) || arr.some((x) => !Number.isInteger(x))) {
  process.stderr.write("INVALID_INTEGER_ARRAY\n");
  process.exit(2);
}
if (arr.length === 0) {
  process.stdout.write('{"count":0,"sum":0,"min":null,"max":null}\n');
  process.exit(0);
}
const sum = arr.reduce((a, b) => a + b, 0);
const min = Math.min(...arr);
const max = Math.max(...arr);
process.stdout.write(JSON.stringify({ count: arr.length, sum, min, max }) + "\n");
process.exit(0);
