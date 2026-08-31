#!/bin/bash
set -euo pipefail
docker cp /tmp/wf40-post-seam.json root-n8n-1:/tmp/wf40-post-seam.json
docker exec root-n8n-1 n8n import:workflow --input=/tmp/wf40-post-seam.json
docker exec root-n8n-1 n8n publish:workflow --id=9ZMj2ACTKyDVhCue
docker restart root-n8n-1
sleep 8
docker exec root-n8n-1 n8n export:workflow --id=9ZMj2ACTKyDVhCue --output=/tmp/wf40-post-verify.json
python3 <<'PY'
import json
j=json.load(open('/tmp/wf40-post-verify.json'))
wf=j[0] if isinstance(j,list) else j
names=[n['name'] for n in wf['nodes']]
print('VERIFY', wf['id'], wf['active'], len(wf['nodes']), wf.get('versionId'))
print('has_proposal', 'Code - Prepare WF40 live execution proposal' in names)
print('parse_status', [n for n in wf['nodes'] if n.get('name')=='Code - Parse WF40 authorization status'][0]['parameters']['jsCode'][:120])
PY
