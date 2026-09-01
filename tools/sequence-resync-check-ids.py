#!/usr/bin/env python3
import re
import sys

path, base_s = sys.argv[1], sys.argv[2]
base = int(base_s)
ids = []
for raw in open(path, encoding='utf-8'):
    line = raw.strip()
    if not line or line.startswith('-') or re.match(r'^[a-zA-Z ]+$', line):
        continue
    token = line.split('|')[0].strip()
    if not re.fullmatch(r'\d+', token):
        continue
    ids.append(int(token))

assert len(ids) >= 3, ids
assert all(i > base for i in ids), ids
assert ids == sorted(ids), ids
assert len(ids) == len(set(ids)), ids
print('ID_MONOTONIC=PASS count=', len(ids))
