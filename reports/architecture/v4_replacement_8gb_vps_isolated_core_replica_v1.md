# V4 replacement 8GB VPS — isolated core replica

**TASK_REF:** `V4_REPLACEMENT_8GB_VPS_ISOLATED_CORE_REPLICA_V1`  
**Issues:** #67 (this pass) · parent #60  
**Classification:** `PASS`  
**Timestamp (UTC):** `2026-09-06T22:10:04Z`  
**BASE_HEAD:** `477c37665e6c56a541015f9637bf17ed388e2abd`  
**Hosts:** OLD `ionos-n8n` (`217.160.71.145`) · NEW `ionos-n8n-new` (`31.70.139.73`, 8GB class)  
**Cutover:** **NOT performed** · OLD remains LIVE production  
**Prior cancelled host:** `31.70.139.51` — **not used** (fresh dump from OLD only)

No secret values are recorded here.

---

## Fresh OLD source snapshot (read-only)

| item | value |
|---|---|
| export dir | `/root/n8n-replica-export-20260906T215628Z` |
| `n8n.dump` sha256 | `606687a7c4bf31f5f27540d105b8c56e3d59aaeddea2b9466704a97917f33953` |
| dump bytes | `108305319` |
| `n8n_data_essential.tgz` sha256 | `304cb3e5cb3827bd5565108b59aff9b7514107d6e6686b246e0bb2d47872923c` |
| workflows / credentials | 50 / 3 |
| execution_capable at dump | 4 |
| executions / max_id | **10223** / **311171** |
| encryptionKey len / sha256 prefix | 32 / `ff09ea79eebe` |
| config sha256 | `e5ada033f82e9a9b91a3737f7fbd90a1e18730108f81ebaf34f3839fe923c492` |
| OLD mutation | **none** (pg_dump + file copy only) |

Checksum verified on NEW after secret-safe transfer. Not the historical #63/#64 dump.

---

## PostgreSQL 16.15 NEW

| check | result |
|---|---|
| image | `postgres@sha256:f1c3376c26f2609ab9f29f71f824103fe2fcd8ee0346485cb6122a4f93df6f94` |
| `server_version` | `16.15 (Debian 16.15-1.pgdg13+2)` |
| health | healthy |
| host publish | **none** (`5432/tcp` null) |
| `pg_restore` | rc=0 |
| post-restore counts | workflows=50, credentials=3, executions=10223, max_id=311171 |

---

## Isolation before first n8n server start (reuse #64 semantics)

| step | result |
|---|---|
| predicate | `activeVersionId IS NOT NULL AND isArchived=false` |
| CLI | `n8n unpublish:workflow --all` via `docker compose run --rm --no-deps` (server not running) |
| unpublish_rc | 0 — “All workflows unpublished successfully” |
| reversibility map | `/root/local-files/handoff-runtime/n8n233-unpublish-reversibility.json` (4 rows; ids+versionIds only) |
| pre-start execution_capable | **0** |
| pre-start published / active_col | **0** / **0** |

Published-before map (restore targets only):

| id | activeVersionId | triggerCount |
|---|---|---|
| `90ldaa5a-4000-8000-000000000090` | `febca537-9218-4fb4-8280-847b5e961f6b` | 1 |
| `9ZMj2ACTKyDVhCue` | `a609ad90-7eb4-4495-9ec5-c4413165cea1` | 1 |
| `HVCzN3FoBdLGe9Hx` | `93d606ae-4883-4e6e-91e5-41ff00cbf741` | 1 |
| `Rx0Qp7pLj9GnyGh7` | `3e9d714f-3bdc-44f1-b3c5-b85385ddd811` | 0 |

---

## n8n 2.33.3 isolated start

| check | result |
|---|---|
| image | `docker.n8n.io/n8nio/n8n:2.33.3` (`@sha256:769d3a62…6a1cc9`) |
| bind | `127.0.0.1:5678->5678` only |
| StartedAt | `2026-09-06T22:05:03.330957826Z` |
| health | **200** `{"status":"ok"}` |
| public `:5678` | connection refused |
| this-start logs (`docker logs --since StartedAt`) | no published-index line; **NO** `Start Active Workflows`; **NO** `Activated workflow` |
| observe ≥90s | executions **10223** / max_id **311171** unchanged every 10s |
| post-window execution_capable | **0** |

### Continuity

| check | result |
|---|---|
| encryptionKey len | 32 |
| encryptionKey sha256 prefix | `ff09ea79eebe` |
| config keys | `encryptionKey` only |
| credential decrypt (in-container, wiped) | **3/3** types `githubApi,httpHeaderAuth,telegramApi` |

---

## LiteLLM v1.98.0 (after n8n isolation PASS)

| check | result |
|---|---|
| image | `ghcr.io/berriai/litellm:v1.98.0@sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4` |
| network | `root_default` |
| host publish | **none** (`4000/tcp:null`, empty PortBindings) |
| env keys only | `ZAI_CODING_API_KEY`, `CHATGPT_TOKEN_DIR`, `CHATGPT_AUTH_FILE` |
| StartedAt | `2026-09-06T22:09:18.4978513Z` |
| in-container `/health/liveliness` | **200** (no provider/model call) |

---

## Final isolation (NEW)

| wall | result |
|---|---|
| PostgreSQL public | **no** |
| n8n | loopback only |
| LiteLLM | unpublished |
| CDP/VNC/noVNC | **absent** |
| nginx | **inactive** (no cutover sites) |
| Tailscale | **Logged out / NeedsLogin** |
| app public endpoints | **none** (listeners: ssh + loopback 5678 + resolver) |
| reboot | **not executed** (kernel flag present; ignored) |

---

## OLD close fingerprint (unchanged vs precheck)

| container | id | StartedAt | status |
|---|---|---|---|
| `root-n8n-1` | `4df66089a77c375d…e4f556` | `2026-09-05T08:15:02.702674396Z` | running rc=0 health 200 |
| `root-postgres-1` | `6691aadd8c793eeb…e98ce0` | `2026-09-01T14:32:36.972332829Z` | healthy |
| `litellm-primary` | `edbb03981626234b…63f635` | `2026-08-28T14:01:10.735053817Z` | running rc=0 |

Public IPv4 still `217.160.71.145`. No restart/stop/recreate/reboot/write by this task.

---

## Hard walls

| wall | result |
|---|---|
| OLD LIVE / WF40 / WF90 | preserved |
| D-0025 | false (untouched) |
| Tailscale join NEW | not performed |
| DNS / nginx cutover | not performed |
| Hermes / browser / VNC | out of scope |
| secrets in Git/report/chat | **none** |
| reuse of cancelled 16GB DB/dump | **none** |

---

## Next (out of this pass)

Hermes/browser deployment on NEW. Tailscale join/hostname/MagicDNS, DNS/public route, and cutover remain **GATE**. Republish of the four workflows on NEW is **not** authorized until a later cutover task.
