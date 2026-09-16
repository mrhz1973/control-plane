#!/bin/bash
# V4 #88 read-only: search SMQ01 across the recent WF90 executions window
# (wider window; stop at first hit). SELECT-only. No mutations.
set -uo pipefail
WF90='90ldaa5a-4000-8000-000000000090'
q() { docker exec root-postgres-1 psql -U n8n -d n8n -tA -c "$1"; }
ids=$(q "SELECT id FROM execution_entity WHERE \"workflowId\"='$WF90' AND id < 343029 ORDER BY id DESC LIMIT 14;" | tr '\n' ' ')
echo "OLDER_IDS=$ids"
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
