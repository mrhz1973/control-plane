#!/bin/bash
set -Eeuo pipefail
umask 077

RUN_NONCE="${RUN_NONCE:-WF40_PG_FIRST_LIVE_005_20260901_01}"
TASK_REF="V4_WF40_FIRST_LIVE_AUTHORIZED_EXECUTION_PROOF_POST_POSTGRES"
WF40="9ZMj2ACTKyDVhCue"
WF61="d0025-6100-4001-8001-000000000061"
GATE_PATH="/root/local-files/handoff-runtime/control-plane/configs/planner/primary-remote-runtime-gate.json"
GATE_CLOSED="/root/local-files/handoff-runtime/control-plane/configs/planner/primary-remote-runtime-gate.closed.json"
RUN_DIR="/root/wf40-live-runs/${RUN_NONCE}"
LOG="${RUN_DIR}/orchestration.log"
SCOPE_DIGEST="ca501cb41602028c4e575a08bcdfc491a793b7cb462790a6f3a4fc67efdb85aa"
TASK_ID="TASK-V4-WF40-PG-LIVE-005"
GATE_ARMED=0
PASS_COMPLETE=0

mkdir -p "$RUN_DIR"

log() { printf '[%s] %s\n' "$(date -u +%H:%M:%SZ)" "$*" | tee -a "$LOG"; }

pg_sql() {
  docker exec root-postgres-1 psql -U n8n -d n8n -tA -c "$1"
}

gate_state() {
  python3 -c "import json; g=json.load(open('$GATE_PATH')); print(int(bool(g.get('enabled'))), int(g.get('provider_calls_authorized_per_event') or 0))"
}

close_gate() {
  cat > "$GATE_PATH" <<'GATE'
{
  "schema": "primary-remote-runtime-gate-v1",
  "enabled": false,
  "provider_calls_authorized_per_event": 0,
  "allowed_planners": ["glm", "codex"],
  "required_fallback_policy": "gate_only",
  "require_empty_fallback": true,
  "provider_state": {
    "qwen": {"available": false, "resource_pressure": "unknown"},
    "glm": {"available": true, "quota_state": "healthy"},
    "codex": {"available": true, "quota_state": "healthy"}
  },
  "notes": ["Restored CLOSED after WF40 PG live 005 proof."]
}
GATE
  gate_state | tee -a "$RUN_DIR/gate-close.txt"
}

trap 'if [ "$PASS_COMPLETE" != 1 ]; then close_gate; fi' EXIT

fail() {
  log "STOP finding=$1"
  echo "{\"finding\":\"$1\",\"run_nonce\":\"$RUN_NONCE\"}" > "$RUN_DIR/stop-state.json"
  exit 1
}

restore_closed_canonical() {
  git -C /root/local-files/handoff-runtime/control-plane show HEAD:configs/planner/primary-remote-runtime-gate.json > "$GATE_CLOSED" 2>/dev/null || cp "$GATE_PATH" "$GATE_CLOSED"
}

arm_gate() {
  cat > "$GATE_PATH" <<'GATE'
{
  "schema": "primary-remote-runtime-gate-v1",
  "enabled": true,
  "provider_calls_authorized_per_event": 1,
  "allowed_planners": ["glm", "codex"],
  "required_fallback_policy": "gate_only",
  "require_empty_fallback": true,
  "provider_state": {
    "qwen": {"available": false, "resource_pressure": "unknown"},
    "glm": {"available": true, "quota_state": "healthy"},
    "codex": {"available": true, "quota_state": "healthy"}
  },
  "notes": ["Temporary one-event arm for WF40 PG live 005 proof only."]
}
GATE
  GATE_ARMED=1
  date -u +%Y-%m-%dT%H:%M:%SZ | tee "$RUN_DIR/gate-arm-utc.txt"
  gate_state | tee -a "$RUN_DIR/gate-arm.txt"
}

litellm_calls_since() {
  local since="$1"
  docker logs litellm-primary --since "$since" 2>&1 | grep -cE 'POST /v1/chat/completions|POST /chat/completions' || true
}

echo "STARTED — ${TASK_REF} — RUN_NONCE=${RUN_NONCE}" | tee "$LOG"

log "=== PRECHECK ==="
test "$(curl -fsS -o /dev/null -w '%{http_code}' http://127.0.0.1:5678/healthz)" = "200" || fail "PROD_HEALTH_FAIL"
test "$(docker exec root-n8n-1 n8n --version)" = "2.33.3" || fail "N8N_VERSION_MISMATCH"
test "$(docker exec root-n8n-1 printenv DB_TYPE)" = "postgresdb" || fail "PROD_DB_NOT_POSTGRES"
read -r GE GC < <(gate_state)
test "$GE" = "0" && test "$GC" = "0" || fail "D0025_NOT_CLOSED"
restore_closed_canonical

BASE_MAX=$(pg_sql "SELECT COALESCE(MAX(id),0) FROM execution_entity WHERE \"workflowId\"='${WF40}';")
BASE_SEQ=$(pg_sql "SELECT last_value||'|'||is_called FROM execution_entity_id_seq;")
printf 'BASE_MAX=%s\nBASE_SEQ=%s\nSCOPE_DIGEST=%s\n' "$BASE_MAX" "$BASE_SEQ" "$SCOPE_DIGEST" > "$RUN_DIR/baseline.txt"
log "baseline WF40 max id=$BASE_MAX seq=$BASE_SEQ"

log "=== WAIT CLOSED-GATE TICK (cadence) ==="
CADENCE_DEADLINE=$((SECONDS+180))
LAST_ID="$BASE_MAX"
while [ $SECONDS -lt $CADENCE_DEADLINE ]; do
  CUR=$(pg_sql "SELECT COALESCE(MAX(id),0) FROM execution_entity WHERE \"workflowId\"='${WF40}';")
  STAT=$(pg_sql "SELECT status FROM execution_entity WHERE id=${CUR};" 2>/dev/null || echo "")
  if [ "$CUR" -gt "$LAST_ID" ] && [ "$STAT" = "success" ]; then
    log "closed_gate_tick id=$CUR status=$STAT"
    printf 'PRECEDING_TICK_ID=%s\n' "$CUR" > "$RUN_DIR/preceding-tick.txt"
    break
  fi
  sleep 3
done
test -f "$RUN_DIR/preceding-tick.txt" || fail "CLOSED_GATE_TICK_TIMEOUT"

log "=== ARM GATE FOR NEXT NATURAL TICK ==="
PRECEDING_ID=$(cut -d= -f2 "$RUN_DIR/preceding-tick.txt")
arm_gate
OBS_START=$(date -u +%Y-%m-%dT%H:%M:%SZ)
printf 'OBS_START=%s\nPRECEDING_ID=%s\n' "$OBS_START" "$PRECEDING_ID" > "$RUN_DIR/obs-start.txt"
LITELLM_SINCE="$OBS_START"

TARGET_ID=""
TARGET_DEADLINE=$((SECONDS+900))
while [ $SECONDS -lt $TARGET_DEADLINE ]; do
  CUR=$(pg_sql "SELECT COALESCE(MAX(id),0) FROM execution_entity WHERE \"workflowId\"='${WF40}';")
  STAT=$(pg_sql "SELECT status FROM execution_entity WHERE id=${CUR};" 2>/dev/null || echo "")
  STARTED=$(pg_sql "SELECT COALESCE(\"startedAt\"::text,'') FROM execution_entity WHERE id=${CUR};" 2>/dev/null || echo "")
  if [ "$CUR" -gt "$PRECEDING_ID" ] && [ -n "$STARTED" ]; then
    TARGET_ID="$CUR"
    log "target_wf40_started id=$TARGET_ID status=$STAT"
    break
  fi
  sleep 2
done
test -n "$TARGET_ID" || fail "TARGET_WF40_NOT_STARTED"

PROVIDER_BASE=$(litellm_calls_since "$LITELLM_SINCE")
PROVIDER_DEADLINE=$((SECONDS+600))
PROVIDER_SEEN=0
while [ $SECONDS -lt $PROVIDER_DEADLINE ]; do
  PC=$(litellm_calls_since "$LITELLM_SINCE")
  if [ "$PC" -ge 1 ]; then
    PROVIDER_SEEN=$PC
    log "provider_calls=$PC — immediate reclose"
    close_gate
    printf 'PROVIDER_CALLS=%s\nGATE_RECLOSE_UTC=%s\n' "$PROVIDER_SEEN" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$RUN_DIR/provider-reclose.txt"
    break
  fi
  sleep 2
done
test "$PROVIDER_SEEN" -ge 1 || fail "PROVIDER_CALL_NOT_OBSERVED"
read -r GE GC < <(gate_state)
test "$GE" = "0" && test "$GC" = "0" || fail "D0025_RECLOSE_FAIL"

log "=== WAIT TARGET WF40 TERMINAL ==="
TERM_DEADLINE=$((SECONDS+600))
while [ $SECONDS -lt $TERM_DEADLINE ]; do
  STAT=$(pg_sql "SELECT status FROM execution_entity WHERE id=${TARGET_ID};")
  STOPPED=$(pg_sql "SELECT COALESCE(\"stoppedAt\"::text,'') FROM execution_entity WHERE id=${TARGET_ID};")
  if [ -n "$STOPPED" ] && [ "$STAT" != "new" ]; then
    pg_sql "SELECT id,status,\"createdAt\",\"startedAt\",\"stoppedAt\" FROM execution_entity WHERE id=${TARGET_ID};" > "$RUN_DIR/target-wf40-terminal.txt"
    log "target_terminal status=$STAT"
    break
  fi
  sleep 3
done

log "=== QUIET TICK OBSERVATION (gate closed) ==="
QT_BASE=$(pg_sql "SELECT COALESCE(MAX(id),0) FROM execution_entity WHERE \"workflowId\"='${WF40}';")
QT_DEADLINE=$((SECONDS+120))
while [ $SECONDS -lt $QT_DEADLINE ]; do
  CUR=$(pg_sql "SELECT COALESCE(MAX(id),0) FROM execution_entity WHERE \"workflowId\"='${WF40}';")
  STAT=$(pg_sql "SELECT status FROM execution_entity WHERE id=${CUR};" 2>/dev/null || echo "")
  if [ "$CUR" -gt "$QT_BASE" ] && [ -n "$(pg_sql "SELECT COALESCE(\"stoppedAt\"::text,'') FROM execution_entity WHERE id=${CUR};")" ]; then
    log "quiet_tick id=$CUR status=$STAT"
    printf 'QUIET_TICK_ID=%s\n' "$CUR" > "$RUN_DIR/quiet-tick.txt"
    break
  fi
  sleep 3
done

PASS_COMPLETE=1
log "ORCHESTRATION_VPS_PHASE=COMPLETE target=$TARGET_ID provider=$PROVIDER_SEEN"
