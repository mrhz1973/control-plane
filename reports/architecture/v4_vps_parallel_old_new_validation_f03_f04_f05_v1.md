# V4 parallel OLD↔NEW validation — F03/F04/F05

**TASK_REF:** `V4_VPS_PARALLEL_OLD_NEW_VALIDATION_F03_F04_F05_V1`
**Issue:** #68
**Classification:** `PASS`
**Timestamp (UTC):** `2026-09-07T09:25:00Z`
**BASE_HEAD:** `032fc1f954da0bb87a07fea1390d1289e19b14b3`
**Hosts:** OLD `217.160.71.145` / `100.114.7.53` / `ubuntu.tailc01234.ts.net`; NEW `31.70.139.73` / `100.99.54.93` / `ionos-n8n-new.tailc01234.ts.net`

```text
VPS_PARALLEL_VALIDATION=PASS
F03_ACCOUNTING_RECONCILIATION=PASS
F04_PUBLIC_80_DISPOSITION=PASS
F05_OLD_TLS_ROLLBACK_HEALTH=PASS
NEW_CORE_RESTART_PERSISTENCE=PASS
N8N_RESTART_PERSISTENCE=PASS
POSTGRES_RESTART_PERSISTENCE=PASS
N8N_COMPOSE_RESTART_PERSISTENCE=PASS
SERVICE_BY_SERVICE_PARITY=PASS
REPRESENTATIVE_E2E_NEW=PASS
PRE_CUTOVER_REQUIRED_GAPS=0
CUTOVER_ONLY_DELTAS=EXPLICIT
HUMAN_CUTOVER_GATE=READY_NOT_AUTHORIZED
OLD_DECOMMISSION_ELIGIBLE=NO
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
```

No cutover, publication, DNS/public-route change, OLD mutation, reboot, renewal trigger on OLD, or decommission action occurred.

## A — NEW isolated core restart persistence

Effective `n8n-compose.service` is enabled, `Type=oneshot`, `WorkingDirectory=/root`, `ExecStart=/usr/bin/docker compose -f /root/docker-compose.yaml up -d`, and safe `ExecStop=... compose ... stop`. The effective compose service set is exactly `postgres`, `n8n`; no GOI, Hermes, or published runtime is managed by this boundary.

Pre-state: n8n container `d20d2ddb…` and PostgreSQL `62aceb82…` were running; LiteLLM `db6114dec…` was running. n8n health was 200, loopback-only, workflows/credentials/executions/max-id `50/3/10000/311171`, publication/execution-capable `0/0`. PostgreSQL was healthy and unpublished. Image digests were n8n `769d3a62…6a1cc9`, PostgreSQL `f1c3376c…df6f94`, LiteLLM `26eb8aa6…5ed2f4`.

`systemctl restart n8n-compose.service` completed successfully. Post-state retained the same container IDs and image digests; n8n/PostgreSQL StartedAt changed as expected, LiteLLM StartedAt did not. Post-state: n8n 200/loopback, PostgreSQL healthy/unpublished, LiteLLM running/unpublished, `50/3/10000/311171`, publication/execution-capable `0/0`. Workflow/credential/settings digests were unchanged. n8n logs show a bounded SIGTERM/start cycle, no workflow activation or automatic execution. GOI and Hermes PIDs/NRestarts were unchanged.

## B — close-time OLD↔NEW snapshots

Both nodes had their expected unique Tailscale identity, no Serve/Funnel configuration, no advertised routes, and all required GOI units active/enabled. OLD additionally has public nginx `0.0.0.0/[::]:80`; NEW has no public `:80` or `:443`.

OLD Docker IDs/StartedAt remained the known live values (`root-n8n-1 4df66089…`, PostgreSQL `6691aadd…`, LiteLLM `edbb0398…`). NEW core IDs remained unchanged across the controlled restart. OLD/NEW PostgreSQL were healthy; n8n returned 200; LiteLLM was unpublished. OLD Hermes is process-supervised with private listeners; NEW Hermes systemd units are active with private listeners.

Required GOI topology was exact by identity:

```text
OLD: 100.114.7.53:443,5000,8000,8010,8989; 127.0.0.1:8020,8990; public :80
NEW: 100.99.54.93:443,5000,8000,8010,8989; 127.0.0.1:8020,8990; no public :80/:443
```

## C — core parity and live drift

| Metric | OLD | NEW | Classification |
|---|---:|---:|---|
| workflows | 50 | 50 | equal |
| credentials | 3 | 3 | equal |
| executions | 10150 | 10000 | `N8N_LIVE_EXECUTION_DRIFT=EXPECTED_OLD_LIVE` |
| max execution id | 312682 | 311171 | expected OLD-live drift |
| published/execution-capable | 4 | 0/0 | intentional isolation delta |
| normalized workflow config digest | `bab0784c…` | `bab0784c…` | equal |
| credential payload digest | `44f18b84…` | `44f18b84…` | equal |
| settings digest | `5d03fb4e…` | `5d03fb4e…` | equal |

The non-normalized workflow digest differs only because OLD publication/active fields are live while NEW intentionally excludes them. No configuration corruption was found. `FINAL_DB_SYNC_AT_CUTOVER=REQUIRED_BY_LIVE_WRITER_MODEL`; no sync was executed now.

### CUTOVER_RUNBOOK_FINAL_SYNC_METHOD

The existing canonical sequence-resync/cutover evidence establishes the native PostgreSQL export/import path, post-import `pg_get_serial_sequence` discovery, `setval` sequence resync, post-import equivalence, and bounded validation. No new migration mechanism is introduced.

At the human cutover gate: freeze OLD writes/workflow triggers; capture a fresh current publication map and final PostgreSQL state; export/restore the proven native state into isolated NEW while keeping n8n unpublished; resync sequences and verify counts/digests; retain OLD untouched as rollback source; activate/publicize NEW workflows only after explicit human authorization and post-restore checks. `CUTOVER_RUNBOOK_FINAL_SYNC_METHOD=PROVEN_CANONICAL_NATIVE_EXPORT_IMPORT_WITH_SEQUENCE_RESYNC`.

## D — service-by-service validation

| Service | OLD | NEW | Result |
|---|---|---|---|
| GraphHopper canonical hiking POST | 200, distance `3230.315`, time `2324633`, points `122` | same | PASS |
| ORS `/ors/status`, hostname-verified HTTPS | 200, `ready/PRESENT`, nginx | same | PASS |
| D-Flight `/status` | 200, `READY`, dataset available, 841 features | same | PASS |
| GIS application file | 200; SHA `a2829e32…`; OLD markers | 200; SHA `60a51d96…`; NEW markers only | PASS |
| Nav `/status` | 200, `tokens_ok=true`, `last_error=null` | same | PASS |
| TLS served endpoint | OLD SAN valid | NEW SAN valid | PASS |

The NEW GIS artifact contains `100.99.54.93` five times and `ionos-n8n-new.tailc01234.ts.net` once, with zero OLD identity markers. OLD contains the corresponding OLD markers and zero NEW markers. No dataset/body or token material was persisted.

## E — F03 component accounting

The stable historical denominator is the original census order, not the aggregate registry row count.

| ID | Original census component | Current disposition | Parity / phase |
|---|---|---|---|
| C01 | Docker engine + Compose | `MIGRATED_VALIDATED` | PASS / PRE_CUTOVER_REQUIRED |
| C02 | PostgreSQL 16.15 | `MIGRATED_VALIDATED` | PASS / PRE_CUTOVER_REQUIRED |
| C03 | n8n 2.33.3 | `MIGRATED_VALIDATED` | isolated PASS / CUTOVER_ONLY publication |
| C04 | LiteLLM | `MIGRATED_VALIDATED` | unpublished PASS / PRE_CUTOVER_REQUIRED |
| C05 | n8n-compose.service | `MIGRATED_VALIDATED` | restart PASS / PRE_CUTOVER_REQUIRED |
| C06 | Hermes agent | `MIGRATED_VALIDATED` | PASS / PRE_CUTOVER_REQUIRED |
| C07 | Hermes browser stack | `MIGRATED_VALIDATED` | private PASS / PRE_CUTOVER_REQUIRED |
| C08 | chrome-devel-sandbox | `MIGRATED_VALIDATED` | mode/presence PASS / PRE_CUTOVER_REQUIRED |
| C09 | Hermes authenticated session role | `MIGRATED_VALIDATED` | current handoff qualification; no cookie copying / PRE_CUTOVER_REQUIRED |
| C10 | Tailscale join + MagicDNS identity | `MIGRATED_VALIDATED` | unique identity/routes/Serve/Funnel/reachability PASS / PRE_CUTOVER_REQUIRED |
| C11 | nginx engine + default design | `MIGRATED_VALIDATED` | NEW private nginx PASS / PRE_CUTOVER_REQUIRED |
| C12 | nginx GOI vhost | `MIGRATED_VALIDATED` | NEW HTTPS chain PASS / PRE_CUTOVER_REQUIRED |
| C13 | GOI TLS material | `MIGRATED_VALIDATED` | SAN/key/live-cert PASS / PRE_CUTOVER_REQUIRED |
| C14 | GOI TLS renewal timer/service | `MIGRATED_VALIDATED` | active-nginx renewal + timer PASS / PRE_CUTOVER_REQUIRED |
| C15 | GraphHopper | `MIGRATED_VALIDATED` | functional + cold-start PASS / PRE_CUTOVER_REQUIRED |
| C16 | ORS gateway | `MIGRATED_VALIDATED` | functional + cold-start PASS / PRE_CUTOVER_REQUIRED |
| C17 | D-Flight | `MIGRATED_VALIDATED` | functional + cold-start PASS / PRE_CUTOVER_REQUIRED |
| C18 | GIS app | `MIGRATED_VALIDATED` | endpoint/artifact/browser-chain + cold-start PASS / PRE_CUTOVER_REQUIRED |
| C19 | Nav proxy | `MIGRATED_VALIDATED` | application + cold-start PASS / PRE_CUTOVER_REQUIRED |
| C20 | Tailscale readiness helper | `MIGRATED_VALIDATED` | boot graph PASS / PRE_CUTOVER_REQUIRED |
| C21 | GOI service users | `MIGRATED_VALIDATED` | required users/ownership PASS / PRE_CUTOVER_REQUIRED |
| C22 | control-plane checkout bind | `MIGRATED_VALIDATED` | persistent bind PASS / PRE_CUTOVER_REQUIRED |
| C23 | cursor-coordinate-converter tree | `MIGRATED_VALIDATED` | served artifact PASS / PRE_CUTOVER_REQUIRED |
| C24 | Planet-Clone tree | `MIGRATED_VALIDATED` | Nav runtime PASS / PRE_CUTOVER_REQUIRED |
| C25 | dev-method handoff | `MIGRATED_VALIDATED` | reference-only role satisfied / NOT_REQUIRED |
| C26 | schema-engine handoff | `MIGRATED_VALIDATED` | validator/bind/version PASS / PRE_CUTOVER_REQUIRED |
| C27 | `/srv/cp-verifier-inbox` | `MIGRATED_VALIDATED` | bind/empty/private PASS / PRE_CUTOVER_REQUIRED |
| C28 | LiteLLM secret dependency names/binds | `MIGRATED_VALIDATED` | secret-safe runtime PASS / PRE_CUTOVER_REQUIRED |
| C29 | n8n/Postgres env files | `MIGRATED_VALIDATED` | continuity/restart PASS / PRE_CUTOVER_REQUIRED |
| C30 | OpenClaw staged fallback trees | `MIGRATED_VALIDATED` | `KEEP_STAGED_PENDING`, inactive/no listener, role satisfied / NOT_REQUIRED |
| C31 | historical OLD Docker volumes | `OBSOLETE_CONFIRMED_NOT_REQUIRED` | no current container/compose consumer; retain until decommission / DECOMMISSION_ONLY |
| C32 | OLD manual Hermes supervision | `OBSOLETE_CONFIRMED_NOT_REQUIRED` | replaced by qualified NEW private systemd supervision / NOT_REQUIRED |
| C33 | Tailscale Serve/Funnel | `MIGRATED_VALIDATED` | NONE on both; no route mutation / PRE_CUTOVER_REQUIRED |
| C34 | SSH daemon | `MIGRATED_VALIDATED` | present on both / PRE_CUTOVER_REQUIRED |

```text
F03_CENSUS_DENOMINATOR=34
F03_MIGRATED_VALIDATED=31
F03_PRESENT_NOT_VALIDATED=0
F03_MISSING=0
F03_OBSOLETE_NEEDS_HUMAN_DECISION=0
F03_OBSOLETE_CONFIRMED_NOT_REQUIRED=3
F03_RESOLVED_SUPERSEDED=0
SUM=34
```

Current registry projection is a separate denominator: `REGISTRY_ROW_DENOMINATOR=21`, `REGISTRY_ROW_MIGRATED_VALIDATED=20`, `REGISTRY_ROW_PRESENT_NOT_VALIDATED=0`, `REGISTRY_ROW_MISSING=0`, `REGISTRY_ROW_OBSOLETE_NEEDS_HUMAN_DECISION=0`, `REGISTRY_ROW_OBSOLETE_CONFIRMED_NOT_REQUIRED=1`. The historical frozen `15/14/0/1` is retained only as provenance, not current truth.

No `PRE_CUTOVER_REQUIRED` component is missing or unjustifiably unvalidated. `ROLLUP_COUNTS_STATUS=RECONCILED_F03`.

## F — F04 OLD public `:80`

Read-only `nginx -T` proves the effective default site is `/etc/nginx/sites-enabled/default` → `/etc/nginx/sites-available/default`, `listen 80 default_server` and `[::]:80`, static `/var/www/html`, `server_name _`, `try_files`, with no proxy/upstream or ACME/challenge dependency. The bounded `http://217.160.71.145/` smoke returned 200 static HTML (909 bytes). Aggregate access-log response classes were mostly 404 with a small number of 200/other responses; no application dependency was identified.

```text
F04_OLD_PUBLIC_80_REQUIREDNESS=NON_REQUIRED_OBSOLETE_DEFAULT
F04_NEW_PUBLIC_80_ACTION=NONE
```

NEW remains without public `:80`; no replication is required. This is classification only; OLD was not changed.

## G — F05 OLD TLS and rollback health

OLD timer is `enabled/active/waiting`, `OnCalendar=weekly`, `Persistent=true`, `RandomizedDelaySec=1h`; last trigger `2026-09-07T00:56:31Z`, next `2026-09-14T00:13:35Z`. The latest and prior bounded journal entries fail `203/EXEC` because `/usr/local/sbin/goi-ors-renew-cert` is absent. No OLD renewal was triggered.

Installed OLD certificate is `root:root`, fullchain `0644`, key `0600`, SAN exactly `ubuntu.tailc01234.ts.net`, issuer Let's Encrypt `YE2`, validity `2026-08-17T23:56:48Z` through `2026-11-15T23:56:47Z`. Served certificate fingerprint matches installed fingerprint `26:84:91:5B:C1:3A:99:66:3B:43:42:BC:B7:F3:FF:38:0D:3D:D1:84:C0:44:08:BF:46:6F:08:EB:FE:EB:1D:52`.

Hostname-verified (no `-k`) `https://ubuntu.tailc01234.ts.net/ors/status` returned HTTP 200, `Server: nginx`, `goi-ors-gateway`, `ready`. Therefore:

```text
F05_OLD_TLS_CURRENT_HTTPS_HEALTH=PASS
F05_OLD_TLS_RENEWAL_HEALTH=PERSISTENT_DEGRADED_HELPER_MISSING_203_EXEC
F05_OLD_ROLLBACK_TLS_PRACTICABLE=YES
F05_CERT_VALID_UNTIL=2026-11-15T23:56:47Z
F05_ROLLBACK_WINDOW_CONSTRAINT=human cutover must choose the short rollback window entirely inside this currently proven certificate validity envelope; exact duration is not invented here
```

The renewal degradation is a live OLD cutover risk but does not require repair in this read-only checkpoint because current HTTPS and the present validity envelope are healthy. OLD remains the rollback source.

## CUTOVER_ONLY_DELTA_INVENTORY

- Freeze OLD workflow writes/triggers before the final snapshot.
- Perform the proven native PostgreSQL export/import and sequence-resync method; do not sync now.
- Capture fresh workflow publication/activation map immediately before final restore.
- Keep NEW unpublished/isolated during restore and validation.
- Publish/activate production workflows on NEW only after HUMAN CUTOVER authorization.
- DNS/public routing changes, if any, occur only in that human-authorized window.
- F04 public `:80`: NONE required; NEW remains private.
- Rollback trigger basis: failed NEW health, routing, workflow, or representative E2E acceptance within the chosen rollback window.
- Choose rollback window before OLD cert validity expiry `2026-11-15T23:56:47Z`; exact duration requires the human gate.
- Retain OLD intact throughout rollback window; `OLD_DECOMMISSION_ELIGIBLE=NO`.

## Final state

`HUMAN_CUTOVER_GATE=READY_NOT_AUTHORIZED`. No cutover or decommission authorization is implied. The next action is the human cutover decision, not an automatic production transition.
