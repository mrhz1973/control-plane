#!/usr/bin/env python3
import subprocess
import sys

lo, hi = int(sys.argv[1]), int(sys.argv[2])
wf61 = "d0025-6100-4001-8001-000000000061"
wf40 = "9ZMj2ACTKyDVhCue"

def psql(sql):
    return subprocess.check_output(
        ["docker", "exec", "root-postgres-1", "psql", "-U", "n8n", "-d", "n8n", "-tA", "-c", sql],
        text=True,
    ).strip()

q = f"""
SELECT id, status,
  COALESCE(FLOOR(EXTRACT(EPOCH FROM ("stoppedAt"-"startedAt")))::text, 'null') AS sec
FROM execution_entity
WHERE id BETWEEN {lo} AND {hi}
ORDER BY id;
"""
print(psql(q))
print("wf61_count", psql(f"SELECT COUNT(*) FROM execution_entity WHERE \"workflowId\"='{wf61}' AND id > {lo};"))
print("wf40_long", psql(
    f"SELECT COUNT(*) FROM execution_entity WHERE \"workflowId\"='{wf40}' AND id BETWEEN {lo} AND {hi} "
    f"AND \"stoppedAt\" IS NOT NULL AND EXTRACT(EPOCH FROM (\"stoppedAt\"-\"startedAt\")) > 10;"
))
