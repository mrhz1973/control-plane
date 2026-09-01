#!/bin/bash
set -Eeuo pipefail
umask 077

RUN_NONCE="${RUN_NONCE:-N8N_PG_SEQUENCE_RESYNC_CUTOVER_RETRY_20260901_01}"
SRC_VOL="root_n8n_postgres_data_seqresync_prod"
CLONE_VOL="seqresync_proof_precheck_${RUN_NONCE}"
PG="seqresync-proof-pg"
NET="seqresync_proof_net"
PG_IMAGE="postgres@sha256:f1c3376c26f2609ab9f29f71f824103fe2fcd8ee0346485cb6122a4f93df6f94"
PG_SERVER_ENV="/root/.n8n-postgres-seqresync-server.env"

cleanup() {
  docker rm -f "$PG" 2>/dev/null || true
  docker network rm "$NET" 2>/dev/null || true
  docker volume rm "$CLONE_VOL" 2>/dev/null || true
}
trap cleanup EXIT

test -f "$PG_SERVER_ENV" || { echo "QUERY_PREFLIGHT=FAIL missing_env"; exit 1; }
docker volume inspect "$SRC_VOL" >/dev/null 2>&1 || { echo "QUERY_PREFLIGHT=FAIL missing_src_volume"; exit 1; }

docker volume rm "$CLONE_VOL" 2>/dev/null || true
docker volume create "$CLONE_VOL" >/dev/null
docker run --rm -v "$SRC_VOL":/from:ro -v "$CLONE_VOL":/to alpine sh -c 'cp -a /from/. /to/'
docker network create --internal "$NET"
docker run -d --name "$PG" --network "$NET" --env-file "$PG_SERVER_ENV" \
  -e POSTGRES_USER=n8n -e POSTGRES_DB=n8n -v "$CLONE_VOL":/var/lib/postgresql/data "$PG_IMAGE"
for i in $(seq 1 90); do docker exec "$PG" pg_isready -U n8n -d n8n >/dev/null 2>&1 && break; sleep 1; done

EXECUTION_MAX=$(docker exec "$PG" psql -U n8n -d n8n -tA -c 'SELECT COALESCE(MAX(id),0) FROM execution_entity;')
PROOF_NEXT=$(docker exec "$PG" psql -U n8n -d n8n -tA -F '|' -c "SELECT last_value,is_called FROM execution_entity_id_seq;")
IFS='|' read -r SEQ_LAST SEQ_CALLED <<< "$PROOF_NEXT"
SEQ_INC=1
NEXT_WOULD=$((SEQ_LAST + SEQ_INC))
if [ "$SEQ_CALLED" != "t" ]; then NEXT_WOULD=$SEQ_LAST; fi

echo "EXECUTION_MAX=$EXECUTION_MAX"
echo "PROOF_NEXT=$PROOF_NEXT"
echo "NEXT_WOULD=$NEXT_WOULD"
echo "SEQ_CALLED=$SEQ_CALLED"

if ! [[ "$SEQ_LAST" =~ ^[0-9]+$ ]]; then
  echo "QUERY_PREFLIGHT=FAIL invalid_last_value"
  exit 1
fi
if [ "$SEQ_CALLED" != "t" ] && [ "$SEQ_CALLED" != "f" ]; then
  echo "QUERY_PREFLIGHT=FAIL invalid_is_called"
  exit 1
fi
if [ "$NEXT_WOULD" -le "$EXECUTION_MAX" ]; then
  echo "QUERY_PREFLIGHT=FAIL next_would_not_above_max"
  exit 1
fi

echo "QUERY_PREFLIGHT=PASS"
