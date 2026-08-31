#!/bin/bash
set -euo pipefail
docker exec root-n8n-1 n8n export:workflow --id=9ZMj2ACTKyDVhCue --output=/tmp/wf40-pre-seam.json
docker cp root-n8n-1:/tmp/wf40-pre-seam.json /tmp/wf40-pre-seam.json
python3 <<'PY'
import json
j=json.load(open('/tmp/wf40-pre-seam.json'))
wf=j[0] if isinstance(j,list) else j
json.dump(wf, open('/tmp/wf40-pre-seam-obj.json','w'))
print(wf['id'], wf['active'], len(wf['nodes']), wf.get('versionId'))
PY
