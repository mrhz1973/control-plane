#!/bin/bash
# retry008 — PostgreSQL schedule trigger registration diagnosis (READ-ONLY production)
set -Eeuo pipefail
umask 077

RUN_NONCE="N8N_PROD_PG_MIGRATION_RETRY008_20260901_01"
TASK_REF="V4_N8N_CONTROLLED_PRODUCTION_POSTGRES_MIGRATION_RETRY_008_POSTGRES_SCHEDULE_TRIGGER_REGISTRATION_DIAGNOSIS"
IMAGE="docker.n8n.io/n8nio/n8n:2.33.3"
IMAGE_DIGEST="sha256:769d3a624534ff8b5f3316ef71d4653f48794c47e4339436be7a308d6d6a1cc9"
PG_IMAGE="postgres@sha256:f1c3376c26f2609ab9f29f71f824103fe2fcd8ee0346485cb6122a4f93df6f94"
WF40="9ZMj2ACTKyDVhCue"
WF61="d0025-6100-4001-8001-000000000061"
WF40_AVID="a609ad90-7eb4-4495-9ec5-c4413165cea1"
SCHED_NODE_NAME="Schedule Trigger - controlled polling"
VOL_PROD="root_n8n_data"
PG_VOL_SOURCE="root_n8n_postgres_data_retry006"
BACKUP_ROOT="/root/n8n-postgres-migration-backups"
RUN_ROOT="/root/n8n-postgres-migration-runs"
RUN_DIR="${RUN_ROOT}/${RUN_NONCE}"
GATE="/root/local-files/handoff-runtime/control-plane/configs/planner/primary-remote-runtime-gate.json"
PG_SOURCE_ENV="/root/.n8n-postgres-retry006-server.env"
PG_N8N_ENV="/root/.n8n-postgres-retry006-n8n.env"
OBS_SECONDS=180
MIN_TICKS=2

NET="retry008_diag_net"
A_N8N="retry008-a-sqlite-n8n"
B_PG="retry008-b-postgres"
B_N8N="retry008-b-n8n"
B_VOL="root_n8n_postgres_data_retry008_clone"
A_WORK="${RUN_DIR}/a-sqlite-home"
A_SQLITE_SRC=""
RESULT_JSON="${RUN_DIR}/result.json"

PROD_MUTATION=0
CLASSIFICATION="UNSET"
FALLBACK="NOT_APPLICABLE"
A_TICKS="NOT_RUN"
B_TICKS="NOT_RUN"
SCHEDULER_PATH_A="UNSET"
SCHEDULER_PATH_B="UNSET"
LEGACY_BOUNDARY="UNSET"
PUBLISHED_INDEX_CLASSIFICATION="UNSET"
PROD_HEALTH="FAIL"
NEXT_TASK="UNSET"
FIRST_BLOCKER=""

log() { printf '[%s] %s\n' "$(date -u +%H:%M:%SZ)" "$*"; }

stop_blocker() {
  FIRST_BLOCKER="$1"
  log "BLOCKER=$1"
  write_result
  exit 1
}

write_result() {
  python3 - "$RESULT_JSON" <<PY
import json, os
data = {
  "run_nonce": os.environ.get("RUN_NONCE", ""),
  "task_ref": os.environ.get("TASK_REF", ""),
  "classification": os.environ.get("CLASSIFICATION", "UNSET"),
  "fallback": os.environ.get("FALLBACK", "NOT_APPLICABLE"),
  "a_sqlite_ticks": os.environ.get("A_TICKS", "NOT_RUN"),
  "b_postgres_ticks": os.environ.get("B_TICKS", "NOT_RUN"),
  "scheduler_path_a": os.environ.get("SCHEDULER_PATH_A", "UNSET"),
  "scheduler_path_b": os.environ.get("SCHEDULER_PATH_B", "UNSET"),
  "legacy_boundary": os.environ.get("LEGACY_BOUNDARY", "UNSET"),
  "published_index_classification": os.environ.get("PUBLISHED_INDEX_CLASSIFICATION", "UNSET"),
  "prod_mutation": int(os.environ.get("PROD_MUTATION", "0")),
  "prod_health": os.environ.get("PROD_HEALTH", "FAIL"),
  "first_blocker": os.environ.get("FIRST_BLOCKER", ""),
  "next": os.environ.get("NEXT_TASK", "UNSET"),
  "run_dir": os.environ.get("RUN_DIR", ""),
}
with open("${RESULT_JSON}", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
PY
}

export RUN_NONCE TASK_REF CLASSIFICATION FALLBACK A_TICKS B_TICKS SCHEDULER_PATH_A SCHEDULER_PATH_B LEGACY_BOUNDARY PUBLISHED_INDEX_CLASSIFICATION PROD_MUTATION PROD_HEALTH FIRST_BLOCKER NEXT_TASK RUN_DIR

if [ -e "$RUN_DIR" ]; then
  stop_blocker "RUN_DIRECTORY_ALREADY_EXISTS"
fi
mkdir -p "$RUN_DIR" "$A_WORK"
exec > >(tee -a "${RUN_DIR}/diagnosis.log") 2>&1
echo "STARTED — ${TASK_REF} — RUN_NONCE=${RUN_NONCE}"

REHEARSAL_N8N_ENV_ARGS=(
  -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
  -e N8N_PORT=5678
  -e N8N_PROTOCOL=http
  -e N8N_RUNNERS_ENABLED=true
  -e 'NODES_EXCLUDE=[]'
  -e NODE_ENV=production
  -e N8N_SECURE_COOKIE=false
  -e N8N_DIAGNOSTICS_ENABLED=false
  -e GENERIC_TIMEZONE=Europe/Berlin
  -e TZ=Europe/Berlin
  -e N8N_LOG_LEVEL=debug
)

SANITIZE_KEYS=(
  N8N_SCHEDULER_ENABLED
  N8N_SCHEDULER_TRIGGER_NODE_MODE
  N8N_SCHEDULER_POLL_TRIGGERS_ENABLED
  N8N_ENV_FEAT_SKIP_DURABLE_SCHEDULER
  N8N_USE_WORKFLOW_PUBLICATION_SERVICE
  N8N_WORKFLOW_ACTIVATION_BATCH_SIZE
  N8N_WORKFLOW_INDEX_BATCH_SIZE
  GENERIC_TIMEZONE
  TZ
  EXECUTIONS_MODE
  N8N_RUNNERS_ENABLED
  NODES_EXCLUDE
)

capture_prod_scheduler_env() {
  local out="${RUN_DIR}/production-scheduler-env.txt"
  local json_out="${RUN_DIR}/production-scheduler-env.json"
  docker inspect root-n8n-1 --format '{{range .Config.Env}}{{println .}}{{end}}' \
    | sort > "${RUN_DIR}/production-env-raw.sanitized.txt"
  sed -E 's/(PASSWORD|TOKEN|KEY|SECRET)=[^ ]+/\1=***REDACTED***/g' \
    "${RUN_DIR}/production-env-raw.sanitized.txt" > "${RUN_DIR}/production-env.sanitized.txt"
  {
    echo "# production scheduler env capture"
    for k in "${SANITIZE_KEYS[@]}"; do
      v=$(grep -E "^${k}=" "${RUN_DIR}/production-env.sanitized.txt" | head -1 | cut -d= -f2- || true)
      if [ -z "$v" ]; then echo "${k}=UNSET"; else echo "${k}=${v}"; fi
    done
  } > "$out"
  python3 - "$out" "$json_out" <<'PY'
import json, sys
rows = {}
for line in open(sys.argv[1], encoding="utf-8"):
    line=line.strip()
    if not line or line.startswith("#"): continue
    if "=" not in line: continue
    k,v=line.split("=",1)
    rows[k]=v
eff_sched = rows.get("N8N_SCHEDULER_ENABLED","UNSET")
eff_pub = rows.get("N8N_USE_WORKFLOW_PUBLICATION_SERVICE","UNSET")
eff_mode = rows.get("N8N_SCHEDULER_TRIGGER_NODE_MODE","UNSET")
if eff_sched == "UNSET": eff_sched_effective = "false"
else: eff_sched_effective = eff_sched.lower()
if eff_pub == "UNSET": eff_pub_effective = "false"
else: eff_pub_effective = eff_pub.lower()
if eff_mode == "UNSET": eff_mode_effective = "legacy"
else: eff_mode_effective = eff_mode
payload = {
  "raw": rows,
  "EFFECTIVE_SCHEDULER_ENABLED": eff_sched_effective,
  "EFFECTIVE_PUBLICATION_SERVICE": eff_pub_effective,
  "EFFECTIVE_TRIGGER_NODE_MODE": eff_mode_effective,
  "stock_defaults": {
    "SchedulerConfig.enabled": False,
    "WorkflowsConfig.useWorkflowPublicationService": False,
    "N8N_SCHEDULER_TRIGGER_NODE_MODE": "legacy"
  }
}
with open(sys.argv[2],"w",encoding="utf-8") as f:
    json.dump(payload,f,indent=2)
    f.write("\n")
print(json.dumps(payload, sort_keys=True))
PY
}

prod_precheck() {
  local ev="${RUN_DIR}/production-precheck.txt"
  {
    echo "n8n_version=$(docker exec root-n8n-1 n8n --version 2>/dev/null || echo FAIL)"
    echo "health_http=$(curl -fsS -o /dev/null -w '%{http_code}' http://127.0.0.1:5678/healthz 2>/dev/null || echo FAIL)"
    echo "db_type=$(docker exec root-n8n-1 printenv DB_TYPE 2>/dev/null || echo UNSET)"
    echo "prod_volume=$(docker inspect root-n8n-1 --format '{{ range .Mounts }}{{ if eq .Destination "/home/node/.n8n" }}{{ .Name }}{{ end }}{{ end }}')"
    echo "image_digest=$(docker inspect root-n8n-1 --format '{{.Image}}')"
  } > "$ev"
  grep -q 'n8n_version=2.33.3' "$ev" || stop_blocker "PRODUCTION_N8N_VERSION_MISMATCH"
  grep -q 'health_http=200' "$ev" || stop_blocker "PRODUCTION_HEALTH_NOT_200"
  grep -q 'db_type=$' "$ev" || grep -q 'db_type=UNSET' "$ev" || stop_blocker "PRODUCTION_NOT_SQLITE"
  grep -q "prod_volume=${VOL_PROD}" "$ev" || stop_blocker "PRODUCTION_VOLUME_MISMATCH"
  python3 - "$GATE" <<'PY' || stop_blocker "D0025_GATE_NOT_CLOSED"
import json, sys
d=json.load(open(sys.argv[1],encoding="utf-8"))
raise SystemExit(0 if d.get("enabled") is False and d.get("provider_calls_authorized_per_event")==0 else 1)
PY
  PROD_HEALTH="PASS"
  mount=$(docker volume inspect "$VOL_PROD" --format '{{ .Mountpoint }}')
  python3 - "$mount/database.sqlite" "$ev" <<'PY'
import json, sqlite3, sys
db, ev = sys.argv[1:3]
con=sqlite3.connect(f"file:{db}?mode=ro", uri=True)
wf40=con.execute('SELECT active, activeVersionId, triggerCount FROM workflow_entity WHERE id=?',("9ZMj2ACTKyDVhCue",)).fetchone()
wf61=con.execute('SELECT active FROM workflow_entity WHERE id=?',("d0025-6100-4001-8001-000000000061",)).fetchone()
nodes=con.execute('SELECT nodes FROM workflow_history WHERE workflowId=? AND versionId=?',("9ZMj2ACTKyDVhCue","a609ad90-7eb4-4495-9ec5-c4413165cea1")).fetchone()
nc=len(json.loads(nodes[0])) if nodes else -1
open(ev,"a",encoding="utf-8").write(f"wf40_active={wf40[0]}\nwf40_avid={wf40[1]}\nwf40_trigger={wf40[2]}\nwf40_nodes={nc}\nwf61_active={wf61[0]}\n")
if wf40!=(1,"a609ad90-7eb4-4495-9ec5-c4413165cea1",1) or nc!=83 or wf61!=(0,):
    raise SystemExit(1)
PY
  log "PRODUCTION_PRECHECK=PASS"
}

prepare_a_sqlite() {
  A_SQLITE_SRC=$(ls -d ${BACKUP_ROOT}/*_retry006_pre_postgres 2>/dev/null | tail -n1)
  [ -n "$A_SQLITE_SRC" ] && [ -f "${A_SQLITE_SRC}/database.sqlite" ] || stop_blocker "RETRY006_SQLITE_SNAPSHOT_MISSING"
  cp -a "${A_SQLITE_SRC}/database.sqlite" "${A_WORK}/database.sqlite"
  docker run --rm -v "${VOL_PROD}:/source:ro" -v "${A_WORK}:/dest" alpine sh -c 'cp /source/config /dest/config && chmod 600 /dest/config'
  read -r RUNTIME_UID RUNTIME_GID _ < <(docker run --rm --entrypoint node "$IMAGE" -e 'process.stdout.write(`${process.getuid()} ${process.getgid()} x\n`)')
  chown -R "${RUNTIME_UID}:${RUNTIME_GID}" "$A_WORK"
  chmod 0700 "$A_WORK"; chmod 600 "${A_WORK}/config"
  printf 'A_SQLITE_SRC=%s\nA_WORK=%s\n' "$A_SQLITE_SRC" "$A_WORK" > "${RUN_DIR}/a-sqlite-setup.txt"
}

clone_b_postgres() {
  docker volume inspect "$PG_VOL_SOURCE" >/dev/null 2>&1 || stop_blocker "RETRY006_PG_VOLUME_MISSING"
  docker volume rm "$B_VOL" >/dev/null 2>&1 || true
  docker volume create "$B_VOL" > "${RUN_DIR}/b-volume-create.txt"
  docker run --rm -v "${PG_VOL_SOURCE}:/from:ro" -v "${B_VOL}:/to" alpine sh -c 'cd /from && cp -a . /to/'
}

setup_network() {
  docker network rm "$NET" >/dev/null 2>&1 || true
  docker network create --internal "$NET" > "${RUN_DIR}/network-create.txt"
}

cleanup_all() {
  log "CLEANUP_BEGIN"
  for c in "$A_N8N" "$B_N8N" "$B_PG"; do docker stop -t 20 "$c" >/dev/null 2>&1 || true; docker rm -f "$c" >/dev/null 2>&1 || true; done
  docker network rm "$NET" >/dev/null 2>&1 || true
  docker volume rm "$B_VOL" >/dev/null 2>&1 || true
  rm -rf "$A_WORK" "${RUN_DIR}/b-n8n-home" 2>/dev/null || true
  log "CLEANUP_COMPLETE"
}

n8n_wait_ready() {
  local c="$1" log_out="$2"
  for _ in $(seq 1 120); do
    set +e
    http=$(docker exec "$c" sh -c 'wget -qO- http://127.0.0.1:5678/healthz 2>/dev/null || curl -fsS http://127.0.0.1:5678/healthz 2>/dev/null')
    r=$?
    set -e
    if [ "$r" -eq 0 ] && printf '%s' "$http" | grep -q ok; then
      docker logs "$c" > "$log_out" 2>&1 || true
      return 0
    fi
    sleep 2
  done
  docker logs "$c" > "$log_out" 2>&1 || true
  return 1
}

sqlite_trigger_ticks() {
  local db="$1" baseline="$2"
  python3 - "$db" "$baseline" "$WF40" <<'PY'
import sqlite3, sys
db, baseline, wf40 = sys.argv[1:4]
con=sqlite3.connect(f"file:{db}?mode=ro", uri=True)
print(con.execute("SELECT COUNT(*) FROM execution_entity WHERE workflowId=? AND id>? AND mode='trigger'",(wf40,int(baseline))).fetchone()[0])
PY
}

pg_trigger_ticks() {
  local pg_c="$1" baseline="$2"
  docker exec "$pg_c" psql -U n8n -d n8n -tA -c \
    "SELECT COUNT(*) FROM execution_entity WHERE \"workflowId\"='${WF40}' AND id > ${baseline} AND mode='trigger';"
}

observe_ticks() {
  local kind="$1" target="$2" baseline="$3" label="$4"
  local deadline=$((SECONDS + OBS_SECONDS)) count=0 logf="${RUN_DIR}/${label}-observation.log"
  : > "$logf"
  while [ "$SECONDS" -lt "$deadline" ]; do
    if [ "$kind" = "sqlite" ]; then count=$(sqlite_trigger_ticks "$target" "$baseline"); else count=$(pg_trigger_ticks "$target" "$baseline"); fi
    printf '[%s] ticks=%s baseline=%s\n' "$(date -u +%H:%M:%SZ)" "$count" "$baseline" >> "$logf"
    [ "$count" -ge "$MIN_TICKS" ] && { printf '%s\n' "$count"; return 0; }
    sleep 2
  done
  if [ "$kind" = "sqlite" ]; then count=$(sqlite_trigger_ticks "$target" "$baseline"); else count=$(pg_trigger_ticks "$target" "$baseline"); fi
  printf '%s\n' "$count"; return 1
}

capture_clock_parity() {
  local c="$1" label="$2"
  docker exec "$c" node -e '
const tz=process.env.TZ||process.env.GENERIC_TIMEZONE||"UTC";
console.log(JSON.stringify({
  utc: new Date().toISOString(),
  local: new Date().toString(),
  tz_env: process.env.TZ||null,
  generic_timezone: process.env.GENERIC_TIMEZONE||null,
  resolved: Intl.DateTimeFormat().resolvedOptions().timeZone
},null,2));
' > "${RUN_DIR}/${label}-clock.json" 2>&1 || true
}

compute_cron_expectations() {
  python3 - "${RUN_DIR}/cron-expectations.json" <<'PY'
import json, sys
from datetime import datetime, timedelta
try:
    from zoneinfo import ZoneInfo
    tz = ZoneInfo("Europe/Berlin")
except Exception:
    tz = None
now = datetime.now(tz) if tz else datetime.utcnow()
fires = []
t = now.replace(second=0, microsecond=0) + timedelta(minutes=1)
for _ in range(3):
    fires.append(t.isoformat())
    t += timedelta(minutes=1)
payload = {
  "node_id": "Schedule Trigger - controlled polling",
  "minutesInterval": 1,
  "computed_rule": "legacy clock-aligned every 1 minute",
  "computed_cron_expression": "* * * * * (legacy minute interval)",
  "next_3_expected_fire_instants_utc": fires,
}
with open(sys.argv[1],"w",encoding="utf-8") as f:
    json.dump(payload,f,indent=2)
    f.write("\n")
print(json.dumps(payload))
PY
}

db_semantic_diff() {
  local sqlite_db="${A_WORK}/database.sqlite"
  python3 - "$sqlite_db" "$B_PG" "${RUN_DIR}/wf40-semantic-diff.json" <<'PY'
import json, sqlite3, subprocess, sys, tempfile, os
sqlite_db, pg_c, out = sys.argv[1:4]
WF40="9ZMj2ACTKyDVhCue"; AVID="a609ad90-7eb4-4495-9ec5-c4413165cea1"
s=sqlite3.connect(f"file:{sqlite_db}?mode=ro", uri=True)
se=s.execute('SELECT id,active,isArchived,activeVersionId,versionId,versionCounter,triggerCount,settings,staticData FROM workflow_entity WHERE id=?',(WF40,)).fetchone()
sh=s.execute('SELECT versionId,workflowId,nodes,connections FROM workflow_history WHERE workflowId=? AND versionId=?',(WF40,AVID)).fetchone()
def pg_json(sql):
    raw=subprocess.check_output(["docker","exec",pg_c,"psql","-U","n8n","-d","n8n","-tA","-c",sql],text=True).strip()
    if not raw: return None
    return json.loads(raw)
pe_row=subprocess.check_output(["docker","exec",pg_c,"psql","-U","n8n","-d","n8n","-tA","-F","|","-c",
    f'SELECT id,active,"isArchived","activeVersionId","versionId","versionCounter","triggerCount",COALESCE(settings::text,\'{{}}\'),COALESCE("staticData"::text,\'{{}}\') FROM workflow_entity WHERE id=\'{WF40}\';'
],text=True).strip().split("|")
nodes_p=pg_json(f'SELECT nodes::text FROM workflow_history WHERE "workflowId"=\'{WF40}\' AND "versionId"=\'{AVID}\';')
conn_p=pg_json(f'SELECT connections::text FROM workflow_history WHERE "workflowId"=\'{WF40}\' AND "versionId"=\'{AVID}\';')
nodes_s=json.loads(sh[2]); conn_s=json.loads(sh[3])
sn=json.loads(se[7] or "{}"); ss=json.loads(se[8] or "{}")
pn=json.loads(pe_row[7] or "{}"); ps=json.loads(pe_row[8] or "{}")
sched_s=next((n for n in nodes_s if n.get("name")=="Schedule Trigger - controlled polling"),None)
sched_p=next((n for n in nodes_p if n.get("name")=="Schedule Trigger - controlled polling"),None)
def table_counts_sqlite(t):
    try: return s.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0]
    except: return None
def table_counts_pg(t):
    try:
        return int(subprocess.check_output(["docker","exec",pg_c,"psql","-U","n8n","-d","n8n","-tA","-c",f'SELECT COUNT(*) FROM "{t}";'],text=True).strip())
    except: return None
tables=["workflow_dependency","workflow_published_version","workflow_publication_outbox","workflow_publication_trigger_status","scheduled_job","scheduled_task"]
counts={"sqlite":{},"postgres":{}}
for t in tables:
    counts["sqlite"][t]=table_counts_sqlite(t)
    counts["postgres"][t]=table_counts_pg(t)
payload={
  "workflow_entity_match": {
    "sqlite": {"id":se[0],"active":se[1],"isArchived":se[2],"activeVersionId":se[3],"versionId":se[4],"versionCounter":se[5],"triggerCount":se[6]},
    "postgres": {"id":pe_row[0],"active":pe_row[1],"isArchived":pe_row[2],"activeVersionId":pe_row[3],"versionId":pe_row[4],"versionCounter":pe_row[5],"triggerCount":pe_row[6]},
  },
  "settings_semantic_equal": sn==pn,
  "staticData_semantic_equal": ss==ps,
  "node_count": {"sqlite": len(nodes_s), "postgres": len(nodes_p)},
  "schedule_trigger": {
    "sqlite": {"id": sched_s.get("id") if sched_s else None, "type": sched_s.get("type") if sched_s else None, "typeVersion": sched_s.get("typeVersion") if sched_s else None, "parameters": sched_s.get("parameters") if sched_s else None},
    "postgres": {"id": sched_p.get("id") if sched_p else None, "type": sched_p.get("type") if sched_p else None, "typeVersion": sched_p.get("typeVersion") if sched_p else None, "parameters": sched_p.get("parameters") if sched_p else None},
  },
  "scheduler_table_counts": counts,
}
with open(out,"w",encoding="utf-8") as f:
    json.dump(payload,f,indent=2)
    f.write("\n")
if len(nodes_s)!=83 or len(nodes_p)!=83 or sched_s!=sched_p:
    raise SystemExit(2)
print(json.dumps({"semantic_diff":"PASS","node_count":len(nodes_s)},sort_keys=True))
PY
}

classify_scheduler_path() {
  local log_file="$1" label="$2" pg_c="$3"
  python3 - "$log_file" "$label" "$pg_c" "${RUN_DIR}/production-scheduler-env.json" <<'PY'
import json, re, subprocess, sys
log_path, label, pg_c, env_path = sys.argv[1:5]
text=open(log_path,encoding="utf-8",errors="replace").read().lower()
env=json.load(open(env_path,encoding="utf-8"))
sched=env["EFFECTIVE_SCHEDULER_ENABLED"] in (True,"true","True","1")
pub=env["EFFECTIVE_PUBLICATION_SERVICE"] in (True,"true","True","1")
durable = sched and pub
path = "DURABLE_DATABASE_BACKED" if durable else "LEGACY_IN_MEMORY"
# durable evidence
job_rows=None; task_rows=None
if pg_c and pg_c!="NONE":
    def pg(q):
        try:
            return subprocess.check_output(["docker","exec",pg_c,"psql","-U","n8n","-d","n8n","-tA","-c",q],text=True).strip()
        except Exception:
            return ""
    job_rows=pg("SELECT COUNT(*) FROM scheduled_job WHERE \"workflowId\"='9ZMj2ACTKyDVhCue';")
    task_rows=pg("SELECT COUNT(*) FROM scheduled_task WHERE \"workflowId\"='9ZMj2ACTKyDVhCue';")
    if durable and job_rows.isdigit() and int(job_rows)>0:
        path="DURABLE_DATABASE_BACKED"
evidence={
  "label": label,
  "path": path,
  "log_has_activated_wf40": "activated workflow" in text and "9zmj2actkydvhcue" in text.replace(" ",""),
  "log_has_cron": bool(re.search(r"cron|schedule trigger|registercron", text)),
  "log_has_durable": "durable scheduler" in text or "scheduled_job" in text,
  "log_published_index": [ln.strip() for ln in text.splitlines() if "published workflows" in ln][:3],
  "scheduled_job_rows": job_rows,
  "scheduled_task_rows": task_rows,
}
print(json.dumps(evidence,sort_keys=True))
open(f"{log_path}.scheduler-path.json","w",encoding="utf-8").write(json.dumps(evidence,indent=2)+"\n")
print(path)
PY
}

classify_legacy_boundary() {
  local log_file="$1" pg_c="$2" baseline="$3" ticks="$4"
  python3 - "$log_file" "$pg_c" "$baseline" "$ticks" <<'PY'
import json, re, subprocess, sys
log, pg_c, baseline, ticks = sys.argv[1:5]
text=open(log,encoding="utf-8",errors="replace").read()
low=text.lower()
registered = bool(re.search(r"register.*cron|schedule trigger.*register|activated workflow.*9zmj2actkydvhcue", low))
fired = "schedule trigger" in low and ("execut" in low or "trigger" in low and "fired" in low)
# execution created?
new_exec=0
if pg_c!="NONE":
    try:
        new_exec=int(subprocess.check_output(["docker","exec",pg_c,"psql","-U","n8n","-d","n8n","-tA","-c",f"SELECT COUNT(*) FROM execution_entity WHERE \"workflowId\"='9ZMj2ACTKyDVhCue' AND id>{baseline} AND mode='trigger';"],text=True).strip())
    except Exception:
        new_exec=0
if int(ticks) >= 2:
    boundary="EXECUTION_PERSISTED"
elif registered and new_exec==0:
    boundary="CRON_REGISTERED_NOT_FIRING_ON_POSTGRES"
elif not registered:
    boundary="CRON_NOT_REGISTERED_ON_POSTGRES"
elif new_exec>0:
    boundary="CRON_FIRED_EXECUTION_NOT_CREATED_ON_POSTGRES"
else:
    boundary="CRON_REGISTERED_NOT_FIRING_ON_POSTGRES"
print(boundary)
PY
}

published_index_check() {
  python3 - "${RUN_DIR}/published-index-classification.json" <<'PY'
import json, sqlite3, subprocess, os
run=os.environ["RUN_DIR"]
sqlite=f"{run}/a-sqlite-home/database.sqlite"
pg="retry008-b-postgres"
def pgq(q):
    return subprocess.check_output(["docker","exec",pg,"psql","-U","n8n","-d","n8n","-tA","-c",q],text=True).strip()
s=sqlite3.connect(f"file:{sqlite}?mode=ro", uri=True)
try:
    s_rows=s.execute('SELECT workflowId, indexVersionId, publishedVersionId, dependencyType, dependencyKey FROM workflow_dependency WHERE workflowId=?',("9ZMj2ACTKyDVhCue",)).fetchall()
except Exception:
    s_rows=[]
try:
    raw=pgq("SELECT \"workflowId\", \"indexVersionId\", \"publishedVersionId\", \"dependencyType\", \"dependencyKey\" FROM workflow_dependency WHERE \"workflowId\"='9ZMj2ACTKyDVhCue';")
    p_rows=[tuple(x.split("|")) for x in raw.splitlines() if x.strip()] if raw else []
except Exception:
    p_rows=[]
# startup lines
lines=[]
for name in ["a-startup-full.log","b-startup-full.log"]:
    p=f"{run}/{name}"
    if os.path.exists(p):
        for ln in open(p,encoding="utf-8",errors="replace"):
            if "published workflows" in ln.lower():
                lines.append({"file":name,"line":ln.strip()})
payload={
  "sqlite_dependency_rows_for_wf40": len(s_rows),
  "postgres_dependency_rows_for_wf40": len(p_rows),
  "sqlite_rows": [list(r) for r in s_rows[:20]],
  "postgres_rows": [list(r) for r in p_rows[:20]],
  "startup_published_index_lines": lines,
}
if len(s_rows)==0 and len(p_rows)==0 and lines:
    classification="ZERO_PUBLISHED_INDEX_ROWS_BUT_LEGACY_ACTIVATION_OBSERVED"
elif len(s_rows)==len(p_rows):
    classification="DEPENDENCY_ROWS_PRESENT_AND_EQUAL_COUNT"
else:
    classification="DEPENDENCY_INDEX_ROW_COUNT_DIVERGENCE"
payload["classification"]=classification
with open(f"{run}/published-index-classification.json","w",encoding="utf-8") as f:
    json.dump(payload,f,indent=2); f.write("\n")
print(classification)
PY
}

start_b_postgres() {
  docker run -d --name "$B_PG" --network "$NET" --env-file "$PG_SOURCE_ENV" \
    -e POSTGRES_USER=n8n -e POSTGRES_DB=n8n -v "${B_VOL}:/var/lib/postgresql/data" \
    "$PG_IMAGE" > "${RUN_DIR}/b-pg-container-id.txt"
  for _ in $(seq 1 90); do docker exec "$B_PG" pg_isready -U n8n -d n8n >/dev/null 2>&1 && break; sleep 2; done
  docker exec "$B_PG" pg_isready -U n8n -d n8n >/dev/null
}

prepare_b_n8n_home() {
  local home="${RUN_DIR}/b-n8n-home"
  mkdir -p "$home"
  docker run --rm -v "${VOL_PROD}:/source:ro" -v "${home}:/dest" alpine sh -c 'cp /source/config /dest/config && chmod 600 /dest/config'
  read -r uid gid _ < <(docker run --rm --entrypoint node "$IMAGE" -e 'process.stdout.write(`${process.getuid()} ${process.getgid()} x\n`)')
  chown -R "$uid:$gid" "$home"; chmod 0700 "$home"; chmod 600 "${home}/config"
  printf '%s' "$home"
}

run_a_rehearsal() {
  local baseline
  baseline=$(python3 - "${A_WORK}/database.sqlite" <<'PY'
import sqlite3, sys
con=sqlite3.connect(f"file:{sys.argv[1]}?mode=ro", uri=True)
print(con.execute('SELECT COALESCE(MAX(id),0) FROM execution_entity').fetchone()[0])
PY
)
  printf 'A_BASELINE=%s\n' "$baseline" > "${RUN_DIR}/a-baseline.txt"
  docker run -d --name "$A_N8N" --network "$NET" -v "${A_WORK}:/home/node/.n8n" \
    "${REHEARSAL_N8N_ENV_ARGS[@]}" "$IMAGE" > "${RUN_DIR}/a-n8n-container-id.txt"
  n8n_wait_ready "$A_N8N" "${RUN_DIR}/a-startup-full.log" || stop_blocker "A_N8N_STARTUP_FAILED"
  capture_clock_parity "$A_N8N" "a"
  set +e
  A_TICKS=$(observe_ticks sqlite "${A_WORK}/database.sqlite" "$baseline" "a")
  A_RC=$?
  set -e
  printf 'A_TICKS=%s A_RC=%s\n' "$A_TICKS" "$A_RC" > "${RUN_DIR}/a-summary.txt"
  SCHEDULER_PATH_A=$(classify_scheduler_path "${RUN_DIR}/a-startup-full.log" "A" "NONE")
  docker stop -t 20 "$A_N8N" >/dev/null; docker rm -f "$A_N8N" >/dev/null
}

run_b_rehearsal() {
  local home baseline
  home=$(prepare_b_n8n_home)
  baseline=$(docker exec "$B_PG" psql -U n8n -d n8n -tA -c 'SELECT COALESCE(MAX(id),0) FROM execution_entity;')
  printf 'B_BASELINE=%s\nB_N8N_HOME=%s\n' "$baseline" "$home" > "${RUN_DIR}/b-baseline.txt"
  docker run -d --name "$B_N8N" --network "$NET" -v "${home}:/home/node/.n8n" --env-file "$PG_N8N_ENV" \
    -e DB_TYPE=postgresdb -e DB_POSTGRESDB_HOST="$B_PG" -e DB_POSTGRESDB_PORT=5432 \
    -e DB_POSTGRESDB_DATABASE=n8n -e DB_POSTGRESDB_USER=n8n \
    "${REHEARSAL_N8N_ENV_ARGS[@]}" "$IMAGE" > "${RUN_DIR}/b-n8n-container-id.txt"
  n8n_wait_ready "$B_N8N" "${RUN_DIR}/b-startup-full.log" || stop_blocker "B_N8N_STARTUP_FAILED"
  capture_clock_parity "$B_N8N" "b"
  set +e
  B_TICKS=$(observe_ticks postgres "$B_PG" "$baseline" "b")
  B_RC=$?
  set -e
  printf 'B_TICKS=%s B_RC=%s\n' "$B_TICKS" "$B_RC" > "${RUN_DIR}/b-summary.txt"
  SCHEDULER_PATH_B=$(classify_scheduler_path "${RUN_DIR}/b-startup-full.log" "B" "$B_PG")
  docker stop -t 20 "$B_N8N" >/dev/null; docker rm -f "$B_N8N" >/dev/null
}

trap cleanup_all EXIT

# --- main ---
capture_prod_scheduler_env
prod_precheck
prepare_a_sqlite
clone_b_postgres
setup_network
start_b_postgres
compute_cron_expectations
db_semantic_diff || stop_blocker "WF40_SEMANTIC_DB_DIFF_FAILED"
run_a_rehearsal
run_b_rehearsal
PUBLISHED_INDEX_CLASSIFICATION=$(published_index_check)

python3 - "${RUN_DIR}/a-clock.json" "${RUN_DIR}/b-clock.json" <<'PY'
import json, sys
a=json.load(open(sys.argv[1],encoding="utf-8"))
b=json.load(open(sys.argv[2],encoding="utf-8"))
if a.get("resolved")!=b.get("resolved"):
    raise SystemExit(1)
print("CLOCK_PARITY=PASS")
PY

# Section 10 classification
if [ "$A_TICKS" -ge 2 ] 2>/dev/null && [ "$B_TICKS" -ge 2 ] 2>/dev/null; then
  CLASSIFICATION="RETRY007_ENVIRONMENT_REHEARSAL_MISMATCH"
  NEXT_TASK="REVIEW_RETRY008_VS_RETRY007_TOPOLOGY_DELTA"
elif [ "$A_TICKS" -eq 0 ] 2>/dev/null && [ "$B_TICKS" -eq 0 ] 2>/dev/null; then
  CLASSIFICATION="ISOLATED_CONTROL_INVALID"
  NEXT_TASK="REBUILD_ISOLATED_REHEARSAL_CONTROL"
elif [ "$A_TICKS" -ge 2 ] 2>/dev/null && [ "$B_TICKS" -eq 0 ] 2>/dev/null; then
  EFF_SCHED=$(python3 -c 'import json;print(json.load(open("'${RUN_DIR}'/production-scheduler-env.json"))["EFFECTIVE_SCHEDULER_ENABLED"])')
  EFF_PUB=$(python3 -c 'import json;print(json.load(open("'${RUN_DIR}'/production-scheduler-env.json"))["EFFECTIVE_PUBLICATION_SERVICE"])')
  if [ "$SCHEDULER_PATH_B" = "DURABLE_DATABASE_BACKED" ] && [ "$EFF_SCHED" = "True" -o "$EFF_SCHED" = "true" ]; then
    FALLBACK="NOT_RUN_SECTION11_SKIPPED_DUE_TO_SCRIPT_SCOPE"
  elif [ "$SCHEDULER_PATH_B" = "LEGACY_IN_MEMORY" ] && { [ "$EFF_PUB" = "True" ] || [ "$EFF_PUB" = "true" ]; }; then
    FALLBACK="NOT_RUN_SECTION12_SKIPPED"
  else
    LEGACY_BOUNDARY=$(classify_legacy_boundary "${RUN_DIR}/b-startup-full.log" "$B_PG" "$(awk -F= '/^B_BASELINE=/{print $2}' ${RUN_DIR}/b-baseline.txt)" "$B_TICKS")
    CLASSIFICATION="POSTGRES_LEGACY_SCHEDULE_TRIGGER_RUNTIME_DEFECT_${LEGACY_BOUNDARY}"
    NEXT_TASK="GPT_WEB_BOUNDED_SOURCE_LEVEL_REMEDY_FOR_${LEGACY_BOUNDARY}"
  fi
else
  CLASSIFICATION="POSTGRES_SCHEDULE_TRIGGER_FAILURE_BOUNDARY_UNRESOLVED"
  NEXT_TASK="COLLECT_ADDITIONAL_DEBUG_EVIDENCE"
fi

write_result
log "DIAGNOSIS_COMPLETE classification=${CLASSIFICATION} A=${A_TICKS} B=${B_TICKS}"
echo "RESULT_JSON=${RESULT_JSON}"
cat "$RESULT_JSON"
