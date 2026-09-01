#!/usr/bin/env python3
import subprocess

t = "data_table_user_ZyoprEI019mee628"
q = f'SELECT id, key, value, updated_at FROM "{t}" ORDER BY id DESC LIMIT 20'
print(subprocess.check_output(["docker","exec","root-postgres-1","psql","-U","n8n","-d","n8n","-c",q], text=True))

