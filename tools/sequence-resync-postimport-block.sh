PHASE="POST_IMPORT_SEQUENCE_AUDIT"
echo "=== POST IMPORT SEQUENCE AUDIT AND RESYNC ==="
EXECUTION_MAX_ID_POST_IMPORT=$(docker exec root-postgres-1 psql -U n8n -d n8n -tA -c 'SELECT COALESCE(MAX(id),0) FROM execution_entity;')
printf 'EXECUTION_MAX_ID_POST_IMPORT=%s\n' "$EXECUTION_MAX_ID_POST_IMPORT" > "${EVIDENCE}/execution-max-post-import.txt"
python3 /root/sequence-resync-audit.py root-postgres-1 "${EVIDENCE}/post-import-sequence-audit-before.json"
python3 /root/sequence-resync-resync.py root-postgres-1 "${EVIDENCE}/post-import-sequence-audit-before.json" "${EVIDENCE}/post-import-sequence-resync.json"
python3 /root/sequence-resync-audit.py root-postgres-1 "${EVIDENCE}/post-import-sequence-audit-after.json" --require-safe
PROOF_NEXT=$(docker exec root-postgres-1 psql -U n8n -d n8n -tA -F '|' -c "SELECT last_value,is_called FROM execution_entity_id_seq;")
IFS='|' read -r SEQ_LAST SEQ_CALLED <<< "$PROOF_NEXT"
SEQ_INC=1
NEXT_WOULD=$((SEQ_LAST + SEQ_INC))
if [ "$SEQ_CALLED" != "t" ]; then NEXT_WOULD=$SEQ_LAST; fi
if [ "$NEXT_WOULD" -le "$EXECUTION_MAX_ID_POST_IMPORT" ]; then
  fail "$PHASE" "EXECUTION_ENTITY_SEQUENCE_NOT_SAFE"
fi
SEQUENCE_COUNT=$(python3 -c "import json; print(len(json.load(open('${EVIDENCE}/post-import-sequence-audit-after.json'))))")
printf 'EXECUTION_MAX_ID_POST_IMPORT=%s\nPOSTGRES_SEQUENCE_STATE=PASS\nPROOF_NEXT=%s\nSEQUENCE_COUNT=%s\n' "$EXECUTION_MAX_ID_POST_IMPORT" "$PROOF_NEXT" "$SEQUENCE_COUNT" > "${EVIDENCE}/identity-sequence-summary.txt"
log "POSTGRES_SEQUENCE_STATE=PASS"
