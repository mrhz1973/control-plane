#!/usr/bin/env python3
import pathlib, re, textwrap, sys
src = pathlib.Path('/root/retry006-migrate.sh')
out = pathlib.Path('/root/sequence-resync-migrate.sh')
text = src.read_text(encoding='utf-8')
replacements = {
    'N8N_PROD_PG_MIGRATION_RETRY006_20260901_01': 'N8N_PG_SEQUENCE_RESYNC_CUTOVER_20260901_01',
    'V4_N8N_CONTROLLED_PRODUCTION_POSTGRES_MIGRATION_RETRY_006_EQUIVALENCE_HARNESS_FIX': 'V4_N8N_POSTGRES_EXECUTION_ENTITY_SEQUENCE_RESYNC_AND_CUTOVER_TICK_VALIDATION',
    'retry006_pre_postgres': 'sequence_resync_pre_postgres',
    'RETRY006_BACKUP': 'SEQUENCE_RESYNC_BACKUP',
    'root-n8n-schema-init-retry006': 'root-n8n-schema-init-seqresync',
    'PRODUCTION_POSTGRES_MIGRATION_PASS': 'PRODUCTION_POSTGRES_MIGRATION_SEQUENCE_RESYNC_PASS',
}
for old, new in replacements.items():
    text = text.replace(old, new)
text = re.sub(r'^PG_VOL="root_n8n_postgres_data_retry006"$', 'PG_VOL="root_n8n_postgres_data_seqresync_prod"', text, flags=re.M)
text = text.replace(
    'PG_SERVER_ENV="/root/.n8n-postgres-retry006-server.env"',
    'PG_SERVER_ENV="/root/.n8n-postgres-seqresync-server.env"',
)
text = text.replace(
    'N8N_DB_ENV="/root/.n8n-postgres-retry006-n8n.env"',
    'N8N_DB_ENV="/root/.n8n-postgres-seqresync-n8n.env"',
)
text = text.replace(
    'echo "STARTED — V4_N8N_CONTROLLED_PRODUCTION_POSTGRES_MIGRATION_RETRY_006_EQUIVALENCE_HARNESS_FIX — RUN_NONCE=${RUN_NONCE}"',
    'echo "STARTED — V4_N8N_POSTGRES_EXECUTION_ENTITY_SEQUENCE_RESYNC_AND_CUTOVER_TICK_VALIDATION — RUN_NONCE=${RUN_NONCE}"'
)
isolated = pathlib.Path('/root/sequence-resync-isolated-block.sh').read_text(encoding='utf-8')
new_seq = pathlib.Path('/root/sequence-resync-postimport-block.sh').read_text(encoding='utf-8')
marker = 'PHASE="CONTROLLED_DOWNTIME"'
if marker not in text:
    sys.exit('CONTROLLED_DOWNTIME marker missing')
text = text.replace(marker, isolated + '\n' + marker, 1)
start = text.index('PHASE="IDENTITY_SEQUENCE_SAFETY"')
end = text.index('PHASE="START_PRODUCTION_POSTGRES"')
text = text[:start] + new_seq + '\n\n' + text[end:]
text = text.replace(
    "BASELINE_EXECUTION_ID=$(docker exec root-postgres-1 psql -U n8n -d n8n -tA -c \\\n  'SELECT COALESCE(MAX(id),0) FROM execution_entity;')",
    'BASELINE_EXECUTION_ID="$EXECUTION_MAX_ID_POST_IMPORT"'
)
out.write_text(text, encoding='utf-8')
print('wrote', out)
