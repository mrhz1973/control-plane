#!/bin/bash
# V4 #88 read-only SMQ01 evidence: find the WF90 execution whose decompressed
# data mentions SMQ01 (the remediation tick), then extract STOP evidence.
# SELECT-only. No mutations. No secrets printed.
set -uo pipefail
WF90='90ldaa5a-4000-8000-000000000090'
q() { docker exec root-postgres-1 psql -U n8n -d n8n -tA -c "$1"; }
ids=$(q "SELECT id FROM execution_entity WHERE \"workflowId\"='$WF90' ORDER BY id DESC LIMIT 8;" | tr '\n' ' ')
echo "RECENT_IDS=$ids"
for eid in $ids; do
  cnt=$(q "SELECT data::text FROM execution_data WHERE \"executionId\"=$eid;" | grep -c "SMQ01" || true)
  echo "exec=$eid smq01_hits=$cnt"
  if [ "$cnt" -gt 0 ]; then
    q "SELECT data::text FROM execution_data WHERE \"executionId\"=$eid;" > /tmp/wf88_smq01_exec.json
    echo "SMQ01_EXEC=$eid"
    break
  fi
done
if [ -f /tmp/wf88_smq01_exec.json ]; then
  python3 - <<'PY'
import re
raw = open('/tmp/wf88_smq01_exec.json', encoding='utf-8', errors='replace').read()
idx = 0
found = 0
while found < 6:
    idx = raw.find('SMQ01', idx)
    if idx < 0:
        break
    print('...', raw[max(0, idx-500):idx+500][:1000], '...')
    print('---')
    idx += 5
    found += 1
PY
fi
