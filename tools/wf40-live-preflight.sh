#!/bin/bash
set -euo pipefail
echo "=== litellm health ==="
docker ps --filter name=litellm-primary --format '{{.Names}} {{.Status}}'
curl -sS -o /tmp/litellm-models.json -w 'models_http=%{http_code}\n' http://127.0.0.1:4000/v1/models || true
python3 -c "import json; d=json.load(open('/tmp/litellm-models.json')); ids=[x.get('id') for x in d.get('data',[])]; print('models', ids[:20])" 2>/dev/null || true
echo "=== gate ==="
cat /root/local-files/handoff-runtime/control-plane/configs/planner/primary-remote-runtime-gate.json | python3 -c "import json,sys; g=json.load(sys.stdin); print('enabled',g.get('enabled'),'calls',g.get('provider_calls_authorized_per_event'))"
echo "=== VPS git ==="
cd /root/local-files/handoff-runtime/control-plane && git rev-parse HEAD && git status -sb
echo "=== WF40/WF61 ==="
docker exec root-n8n-1 n8n list:workflow 2>/dev/null | grep -E '9ZMj2ACTKyDVhCue|d0025-6100-4001-8001-000000000061' || true
echo "=== recent WF40 exec ==="
docker exec root-n8n-1 node <<'NODE'
const {execSync}=require('child_process');
const db='/home/node/.n8n/database.sqlite';
const sql=`SELECT id,status,startedAt,stoppedAt FROM execution_entity WHERE workflowId='9ZMj2ACTKyDVhCue' ORDER BY id DESC LIMIT 5;`;
try{console.log(execSync(`sqlite3 ${db} "${sql}"`,{encoding:'utf8'}));}catch(e){console.log('sqlite_err',e.message);}
NODE
