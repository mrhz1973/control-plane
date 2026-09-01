#!/usr/bin/env python3
import json, subprocess, sys

def audit(pg, out, require_safe=False, require_behind=False):
    sql = """
SELECT c.table_name, c.column_name,
       pg_get_serial_sequence(format('%I.%I', c.table_schema, c.table_name), c.column_name) AS seq_name
FROM information_schema.columns c
WHERE c.table_schema='public'
  AND pg_get_serial_sequence(format('%I.%I', c.table_schema, c.table_name), c.column_name) IS NOT NULL
ORDER BY 1,2;
"""
    rows = subprocess.check_output(["docker","exec",pg,"psql","-U","n8n","-d","n8n","-tA","-F","|","-c",sql], text=True)
    items = []
    for line in rows.splitlines():
        if not line.strip():
            continue
        table, column, seq_name = line.split("|", 2)
        maxv = int(subprocess.check_output(["docker","exec",pg,"psql","-U","n8n","-d","n8n","-tA","-c", f'SELECT COALESCE(MAX("{column}"),0) FROM "{table}";'], text=True).strip())
        last, called = subprocess.check_output(["docker","exec",pg,"psql","-U","n8n","-d","n8n","-tA","-F","|","-c", f'SELECT last_value,is_called FROM {seq_name};'], text=True).strip().split("|")
        last_i = int(last)
        inc = 1
        nextv = last_i + inc if called == 't' else last_i
        if maxv == 0:
            cls = 'EMPTY_SAFE'
        elif nextv <= maxv:
            cls = 'BEHIND_MAX'
        else:
            cls = 'SAFE'
        items.append({"table":table,"column":column,"sequence":seq_name,"max":maxv,"last_value":last_i,"is_called":called,"next_value":nextv,"class":cls})
    json.dump(items, open(out,'w',encoding='utf-8'), indent=2)
    behind = [x for x in items if x['class']=='BEHIND_MAX']
    print(f"SERIAL_COLUMNS={len(items)} BEHIND_MAX={len(behind)}")
    if require_safe and behind:
        raise SystemExit('sequences still BEHIND_MAX')
    if require_behind and not behind:
        raise SystemExit('expected BEHIND_MAX not reproduced')
    if require_behind and not any(x['table']=='execution_entity' for x in behind):
        raise SystemExit('execution_entity not behind')
    return items

if __name__ == '__main__':
    pg, out = sys.argv[1:3]
    flags = set(sys.argv[3:])
    audit(pg, out, require_safe='--require-safe' in flags, require_behind='--require-behind' in flags)
