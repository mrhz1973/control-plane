# V4 production cutover OLD→NEW

**TASK_REF:** `V4_VPS_PRODUCTION_CUTOVER_OLD_TO_NEW_V1`
**Issue:** #68
**Classification:** `PASS`
**Timestamp (UTC):** `2026-09-07T10:49:00Z`
**BASE_HEAD:** `3d34b67bd5f7dd8b07ec9bba89931356754d44ca`
**Authorization:** issue comment [5569237374](https://github.com/mrhz1973/control-plane/issues/68#issuecomment-5569237374)

```text
HUMAN_CUTOVER_AUTHORIZED=YES
OLD_DECOMMISSION_AUTHORIZED=NO
OLD_WRITE_FREEZE=PASS
FINAL_OLD_POSTGRES_SNAPSHOT=PASS
FINAL_DB_SYNC=PASS
POSTGRES_SEQUENCE_STATE=PASS
FINAL_SYNC_EQUIVALENCE=PASS
NEW_POST_RESTORE_ISOLATION=PASS
NEW_PRODUCTION_PUBLICATION_MAP_MATCH=PASS
CUTOVER_ROUTING_ACTION=NONE_REQUIRED
POST_CUTOVER_HEALTH=PASS
PRODUCTION_TRAFFIC_ON_NEW=PASS
OLD_ROLE=ROLLBACK_STANDBY_FROZEN
ROLLBACK_RETENTION=ENTERED
ROLLBACK_RETENTION_AUTO_EXPIRY=NONE
CUTOVER=PASS
NEW_ROLE=LIVE
OLD_DECOMMISSION_ELIGIBLE=NO
OLD_DECOMMISSION_AUTHORIZED=NO
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
```

No OLD shutdown/reboot/deletion, DNS/public-route change, public `:80` replication, OpenClaw activation, or decommission occurred.

## Phase 0 — authorization and preflight

Remote `origin/main` and local `HEAD` matched `3d34b67bd5f7dd8b07ec9bba89931356754d44ca`; branch `main`; tracked tree clean. The authorization comment explicitly grants OLD writer freeze, final PostgreSQL sync, NEW publication, required routing action, post-cutover validation, and OLD retention, while explicitly denying decommission.

Immediately before freeze:

- OLD n8n health 200, PostgreSQL healthy, LiteLLM running, four workflows published/execution-capable, GOI active, hostname-verified OLD HTTPS 200.
- NEW n8n health 200 and unpublished/isolated, PostgreSQL healthy, GOI active/enabled, hostname-verified NEW HTTPS 200, TLS renewal timer active/enabled, Hermes private/healthy, Tailscale routes/Serve/Funnel absent.

## Phase 1 — surface discovery

Fresh pre-freeze map artifact on OLD:

```text
PATH=/root/cutover-publication-map-20260907T103425Z.json
COUNT=4
SHA256=b405b67cc219ad542bedfa2a62f0ec9c00dd3595bf83fe8acd86b4652ff5779c
OLD_IDENTITY_HITS=0
```

The active map contained only the four currently published workflows. Final frozen map was reacquired after freeze:

```text
PATH=/root/cutover-final-publication-map-20260907T103536Z.json
COUNT=4
SHA256=ff836586d71772efa8b74b8ca3545b8fcf6798f5cf634be0febd5c11c8bdd1a2
MODE=0600 OWNER=root:root
```

Frozen entries were:

```text
90ldaa5a-4000-8000-000000000090 -> febca537-9218-4fb4-8280-847b5e961f6b
9ZMj2ACTKyDVhCue -> a609ad90-7eb4-4495-9ec5-c4413165cea1
HVCzN3FoBdLGe9Hx -> 93d606ae-4883-4e6e-91e5-41ff00cbf741
Rx0Qp7pLj9GnyGh7 -> 3e9d714f-3bdc-44f1-b3c5-b85385ddd811
```

No active workflow contained `217.160.71.145`, `100.114.7.53`, or `ubuntu.tailc01234.ts.net`. Active triggers were schedule/manual/internal execution triggers; no obsolete OLD webhook/callback dependency was found. Effective n8n values were loopback HTTP port 5678; no `WEBHOOK_URL`, `N8N_HOST`, or `N8N_EDITOR_BASE_URL` requiring OLD routing was present.

Active command/file nodes read `/files` handoff content or write only n8n-internal `/home/node/.n8n-files`; the latter was empty at inspection. No active workflow was found writing `/root/local-files` or `/srv/cp-verifier-inbox`. Data Table state and workflow state were covered by the PostgreSQL snapshot. No opportunistic workflow redesign was performed.

## Phase 2 — OLD writer freeze

At `2026-09-07T10:35:06Z`, only OLD container `root-n8n-1` was stopped with the bounded container stop operation. PostgreSQL, LiteLLM, GOI, nginx, Tailscale and TLS remained running.

```text
OLD n8n = exited
OLD 127.0.0.1:5678 = absent
OLD PostgreSQL = healthy
OLD HTTPS = 200 hostname-verified
OLD published = 4
OLD final executions = 10176
OLD final max execution id = 312840
quiescence = 10176 -> 10176
```

`OLD_WRITE_FREEZE=PASS`; OLD publication map was unchanged.

## Phase 3 — final OLD PostgreSQL snapshot

The source and target were both PostgreSQL 16.15. The proven native custom-format PostgreSQL path was used, not the historical SQLite entity export path:

```text
SOURCE=/root/cutover-old-final-20260907T103600Z.dump
MODE=0600 OWNER=root:root
SHA256=84e40b565ff4abf01d271c779974b56ec7ad6ee2d9dcfeab65ce8e36c586d078
TOC_ENTRIES=1001
```

The dump was transferred directly OLD→NEW with `scp -3`; source and target hashes matched. The dump remained outside Git.

## Phase 4 — NEW pre-restore backup

Before replacement, NEW isolated PostgreSQL was backed up:

```text
PATH=/root/cutover-new-pre-restore-20260907T103600Z.dump
MODE=0600 OWNER=root:root
SHA256=83f573f305616d7e37fbde31bd5dfd99159433c4c8fe4ca5ee7987fdc2ed3ec8
TOC_ENTRIES=1001
```

Only NEW n8n was stopped before restore. GOI, Hermes and LiteLLM remained up.

## Phase 5 — final DB sync and isolation

The final OLD dump was restored to NEW using:

```text
pg_restore --clean --if-exists --no-owner --no-privileges
```

The restored database matched frozen OLD: workflows `50`, credentials `3`, executions `10176`, max ID `312840`, publication state initially `4`. The canonical offline isolation command was then run from the n8n 2.33.3 image:

```text
docker compose -f /root/docker-compose.yaml run --rm --no-deps n8n unpublish:workflow --all
```

Before first NEW server start: `published=0`, `active_col=0`, executions/max `10176/312840`. NEW was started through the canonical `n8n-compose.service` boundary. Health was 200, bind loopback-only, publication remained 0, and executions/max remained `10176/312840` through the bounded observation. Normalized workflow/config, credential payload and settings digests matched the frozen OLD source; publication fields were the deliberate isolation exception.

## Phase 6 — sequence safety

Canonical `pg_get_serial_sequence` audit covered 25 serial-backed columns:

```text
PRE_SERIAL_COLUMNS=25
PRE_BEHIND_MAX=0
POST_SERIAL_COLUMNS=25
POST_BEHIND_MAX=0
execution_entity max=312840
execution_entity last_value=312840
execution_entity is_called=true
execution_entity next_value=312841
```

No resync was needed; no invalid `increment_by` query was used. `POSTGRES_SEQUENCE_STATE=PASS`.

## Phase 7–9 — exact publication restoration

The canonical n8n 2.33.3 CLI syntax was verified:

```text
publish:workflow --id=<workflow-id> --versionId=<active-version-id>
```

With NEW n8n stopped, exactly the four frozen map entries were published offline. No workflow was published merely because it existed. WF61/D-0025 remained inactive. Offline verification matched all four `id/activeVersionId` pairs and `published=4`; no execution occurred before NEW restart.

NEW was restarted through `n8n-compose.service`. The live publication map hash matched `ff8365…bdd1a2`; n8n health 200; PostgreSQL healthy; n8n remained `127.0.0.1:5678` only.

## Phase 10 — routing

No DNS, public route, Tailscale, or callback mutation was required:

```text
CUTOVER_ROUTING_ACTION=NONE_REQUIRED
F04_NEW_PUBLIC_80_ACTION=NONE
```

NEW public `:80` remained absent. Production schedule execution occurs on NEW through the already-qualified private/loopback runtime; no obsolete OLD endpoint was present in the active workflow/config audit.

## Phase 11 — post-cutover acceptance

NEW post-cutover n8n/DB:

```text
health=200
published=4
workflows=50
credentials=3
executions=10180
max_execution_id=312844
WF61/D-0025=inactive
```

Natural production executions after frozen OLD max `312840`:

```text
312841  HVCzN3FoBdLGe9Hx  success  10:47:00–10:47:01
312842  9ZMj2ACTKyDVhCue   success  10:47:02–10:47:03
312843  HVCzN3FoBdLGe9Hx  success  10:48:00–10:48:00
312844  9ZMj2ACTKyDVhCue   success  10:48:02–10:48:03
```

WF40 produced two natural schedule executions, both terminal/successful, IDs monotonic, approximately 60 seconds apart, and greater than the frozen OLD maximum. `PRODUCTION_TRAFFIC_ON_NEW=PASS`.

NEW GOI/TLS:

- GraphHopper health 200 and canonical `/route` 200.
- ORS hostname-verified HTTPS 200.
- D-Flight 200 `READY`, dataset available, 841 features.
- GIS 200.
- Nav 200, `tokens_ok=true`, `last_error=null`.
- NEW TLS SAN exactly `ionos-n8n-new.tailc01234.ts.net`; live certificate valid through `2026-12-06T00:57:17Z`.
- exact private topology retained; no public `:80`.

NEW Hermes services remained active/private. LiteLLM remained running/unpublished. Tailscale identity remained NEW; Serve/Funnel/routes remained none. OLD n8n stayed stopped, OLD PostgreSQL healthy, OLD LiteLLM/GOI/HTTPS healthy.

## Phase 12 — rollback retention

```text
OLD_ROLE=ROLLBACK_STANDBY_FROZEN
ROLLBACK_RETENTION=ENTERED
ROLLBACK_RETENTION_AUTO_EXPIRY=NONE
ROLLBACK_TLS_VALID_UNTIL=2026-11-15T23:56:47Z
OLD_DECOMMISSION_ELIGIBLE=NO
OLD_DECOMMISSION_AUTHORIZED=NO
```

OLD remains intact and powered on as the rollback source. No rollback-exit, cleanup, TLS repair, shutdown, deletion, or decommission action is authorized by this task.
