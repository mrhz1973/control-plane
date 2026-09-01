#!/usr/bin/env python3
import json, subprocess, sys

items = json.load(open(sys.argv[2], encoding='utf-8'))
pg = sys.argv[1]
out = sys.argv[3]
actions = []
for it in items:
    if it['class'] != 'BEHIND_MAX':
        actions.append({**it, 'action': 'SKIP'})
        continue
    t, c, s = it['table'], it['column'], it['sequence']
    sql = f"SELECT setval('{s}', COALESCE((SELECT MAX(\"{c}\") FROM \"{t}\"), 1), (SELECT MAX(\"{c}\") FROM \"{t}\") IS NOT NULL);"
    subprocess.check_call(["docker","exec",pg,"psql","-U","n8n","-d","n8n","-v","ON_ERROR_STOP=1","-c",sql])
    actions.append({**it, 'action': 'SETVAL'})
json.dump(actions, open(out,'w',encoding='utf-8'), indent=2)
print('RESYNCED', sum(1 for a in actions if a['action']=='SETVAL'))
