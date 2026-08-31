#!/bin/bash
set -euo pipefail
docker exec litellm-primary curl -sS -o /tmp/models.json -w 'models_http=%{http_code}\n' http://127.0.0.1:4000/v1/models
docker exec litellm-primary python3 <<'PY'
import json
d=json.load(open('/tmp/models.json'))
print('model_ids', [x.get('id') for x in d.get('data',[])])
PY
docker exec root-n8n-1 node <<'NODE'
const {execSync}=require('child_process');
const db='/home/node/.n8n/database.sqlite';
const q=`SELECT id,status,startedAt FROM execution_entity WHERE workflowId='9ZMj2ACTKyDVhCue' ORDER BY id DESC LIMIT 3;`;
try{console.log(execSync(`sqlite3 ${db} "${q}"`,{encoding:'utf8'}));}catch(e){console.log('no_sqlite3',e.message);}
NODE
