PHASE="ISOLATED_SEQUENCE_PROOF"
echo "=== ISOLATED SEQUENCE RESYNC PROOF ==="
ISOLATED_PG_VOL="root_n8n_postgres_data_seqresync_isolated_${RUN_NONCE}"
ISOL_PG="seqresync-isolated-pg"
ISOL_N8N="seqresync-isolated-n8n"
ISOL_NET="seqresync_isolated_net"
ISOL_EVIDENCE="${RUN_DIR}/isolated-sequence-proof"
mkdir -p "$ISOL_EVIDENCE"
docker rm -f "$ISOL_PG" "$ISOL_N8N" 2>/dev/null || true
docker network rm "$ISOL_NET" 2>/dev/null || true
docker volume rm "$ISOLATED_PG_VOL" 2>/dev/null || true
docker volume create "$ISOLATED_PG_VOL" >/dev/null
docker run --rm -v root_n8n_postgres_data_retry006:/from:ro -v "$ISOLATED_PG_VOL":/to alpine sh -c 'cp -a /from/. /to/'
ISOL_PG_SERVER_ENV="/root/.n8n-postgres-retry006-server.env"
ISOL_N8N_DB_ENV="/root/.n8n-postgres-retry006-n8n.env"
test -f "$ISOL_PG_SERVER_ENV" && test -f "$ISOL_N8N_DB_ENV" || fail "$PHASE" "ISOLATED_RETRY006_ENV_MISSING"
docker network create --internal "$ISOL_NET"
docker run -d --name "$ISOL_PG" --network "$ISOL_NET" --env-file "$ISOL_PG_SERVER_ENV" \
  -e POSTGRES_USER=n8n -e POSTGRES_DB=n8n -v "$ISOLATED_PG_VOL":/var/lib/postgresql/data "$PG_IMAGE"
for i in $(seq 1 90); do docker exec "$ISOL_PG" pg_isready -U n8n -d n8n >/dev/null 2>&1 && break; sleep 1; done
python3 /root/sequence-resync-audit.py "$ISOL_PG" "$ISOL_EVIDENCE/before-resync-audit.json" --require-behind
python3 /root/sequence-resync-resync.py "$ISOL_PG" "$ISOL_EVIDENCE/before-resync-audit.json" "$ISOL_EVIDENCE/resync-actions.json"
python3 /root/sequence-resync-audit.py "$ISOL_PG" "$ISOL_EVIDENCE/after-resync-audit.json" --require-safe
ISOL_HOME="${RUN_DIR}/isolated-n8n-home"
rm -rf "$ISOL_HOME"; mkdir -p "$ISOL_HOME"
SQLITE_CONFIG_SRC=$(find /root/n8n-postgres-migration-backups -path '*retry006_pre_postgres/production-config' | head -1)
[ -n "$SQLITE_CONFIG_SRC" ] || fail "$PHASE" "ISOLATED_CONFIG_SOURCE_MISSING"
cp -a "$SQLITE_CONFIG_SRC" "$ISOL_HOME/config"
chmod 600 "$ISOL_HOME/config"
NUID=$(docker run --rm --entrypoint node "$IMAGE" -e 'process.stdout.write(String(process.getuid()))')
NGID=$(docker run --rm --entrypoint node "$IMAGE" -e 'process.stdout.write(String(process.getgid()))')
chown -R "$NUID:$NGID" "$ISOL_HOME"
EXECUTION_MAX_ID_BEFORE_START=$(docker exec "$ISOL_PG" psql -U n8n -d n8n -tA -c 'SELECT COALESCE(MAX(id),0) FROM execution_entity;')
printf 'EXECUTION_MAX_ID_BEFORE_START=%s\n' "$EXECUTION_MAX_ID_BEFORE_START" > "$ISOL_EVIDENCE/pre-start-execution-max.txt"
docker run -d --name "$ISOL_N8N" --network "$ISOL_NET" -v "$ISOL_HOME":/home/node/.n8n \
  --env-file "$ISOL_N8N_DB_ENV" -e DB_TYPE=postgresdb -e DB_POSTGRESDB_HOST="$ISOL_PG" -e DB_POSTGRESDB_PORT=5432 \
  -e DB_POSTGRESDB_DATABASE=n8n -e DB_POSTGRESDB_USER=n8n \
  -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true -e N8N_RUNNERS_ENABLED=true -e 'NODES_EXCLUDE=[]' \
  -e GENERIC_TIMEZONE=Europe/Berlin -e TZ=Europe/Berlin -e N8N_LOG_LEVEL=info -e NODE_ENV=production \
  "$IMAGE"
for i in $(seq 1 120); do docker exec "$ISOL_N8N" wget -qO- http://127.0.0.1:5678/healthz 2>/dev/null | grep -q ok && break; sleep 2; done
for i in $(seq 1 90); do docker logs "$ISOL_N8N" 2>&1 | grep -q 'Start Active Workflows' && break; sleep 2; done
OBS_START=$(date -u +%Y-%m-%dT%H:%M:%SZ)
DEADLINE=$((SECONDS+190))
while [ $SECONDS -lt $DEADLINE ]; do
  C1=$(docker exec "$ISOL_PG" psql -U n8n -d n8n -tA -c "SELECT COUNT(*) FROM execution_entity WHERE \"workflowId\"='${WF40}' AND mode='trigger' AND \"startedAt\" >= '${OBS_START}'::timestamptz;")
  C2=$(docker exec "$ISOL_PG" psql -U n8n -d n8n -tA -c "SELECT COUNT(*) FROM execution_entity WHERE \"workflowId\"='${WF40}' AND mode='trigger' AND id > ${EXECUTION_MAX_ID_BEFORE_START};")
  echo "$(date -u +%H:%M:%SZ) startedAt_count=$C1 id_count=$C2" >> "$ISOL_EVIDENCE/observation.log"
  [ "$C1" -ge 3 ] && [ "$C2" -ge 3 ] && [ "$C1" = "$C2" ] && break
  sleep 5
done
ISOL_TICKS_ID=$(docker exec "$ISOL_PG" psql -U n8n -d n8n -tA -c "SELECT COUNT(*) FROM execution_entity WHERE \"workflowId\"='${WF40}' AND mode='trigger' AND id > ${EXECUTION_MAX_ID_BEFORE_START};")
ISOL_TICKS_TS=$(docker exec "$ISOL_PG" psql -U n8n -d n8n -tA -c "SELECT COUNT(*) FROM execution_entity WHERE \"workflowId\"='${WF40}' AND mode='trigger' AND \"startedAt\" >= '${OBS_START}'::timestamptz;")
docker exec "$ISOL_PG" psql -U n8n -d n8n -tA -F'|' -c "SELECT id,\"startedAt\",status FROM execution_entity WHERE \"workflowId\"='${WF40}' AND id > ${EXECUTION_MAX_ID_BEFORE_START} ORDER BY id;" > "$ISOL_EVIDENCE/isolated-wf40-executions.txt"
if [ "$ISOL_TICKS_ID" -lt 3 ] || [ "$ISOL_TICKS_TS" -lt 3 ] || [ "$ISOL_TICKS_ID" != "$ISOL_TICKS_TS" ]; then
  fail "$PHASE" "ISOLATED_SEQUENCE_PROOF_FAILED"
fi
python3 /root/sequence-resync-check-ids.py "$ISOL_EVIDENCE/isolated-wf40-executions.txt" "$EXECUTION_MAX_ID_BEFORE_START"
printf 'ISOLATED_SEQUENCE_PROOF=PASS\nISOLATED_TICKS_ID=%s\nISOLATED_TICKS_TS=%s\n' "$ISOL_TICKS_ID" "$ISOL_TICKS_TS" > "$ISOL_EVIDENCE/summary.txt"
docker rm -f "$ISOL_N8N" "$ISOL_PG" 2>/dev/null || true
docker network rm "$ISOL_NET" 2>/dev/null || true
docker volume rm "$ISOLATED_PG_VOL" 2>/dev/null || true
log "ISOLATED_SEQUENCE_PROOF=PASS ticks=$ISOL_TICKS_ID"
