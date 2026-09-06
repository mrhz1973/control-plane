# V4 NEW VPS — n8n 2.33 disable-before-start + localhost replica retry

**TASK_REF:** `V4_NEW_VPS_N8N233_DISABLE_BEFORE_START_AND_LOCALHOST_REPLICA_RETRY_V1`  
**Issues:** #64 (this pass) · predecessor #63 STOP · parent #60  
**Classification:** `PASS`  
**Timestamp (UTC):** `2026-09-06T20:44:02Z`  
**BASE_HEAD:** `24f44024ba8c91ae6d1de4e62841b801bc30c7a0`  
**Hosts:** OLD `ionos-n8n` (`217.160.71.145`) · NEW `ionos-n8n-new` (`31.70.139.51`)  
**Cutover:** **NOT performed** · OLD remains LIVE production

No secret values are recorded here.

---

## Proven n8n 2.33.3 activation semantics

Stock image `docker.n8n.io/n8nio/n8n:2.33.3` (same tag as LIVE OLD) plus matching GitHub tag `n8n@2.33.3`:

| Fact | Evidence |
|---|---|
| Startup path | `N8N_USE_WORKFLOW_PUBLICATION_SERVICE` **defaults false**. `n8n start` calls `ActiveWorkflowManager.init()` → `addActiveWorkflows('init')`. |
| Execution-capable predicate | `WorkflowRepository.getAllActiveIds()`: `{ activeVersionId: Not(IsNull()), isArchived: false }`. **Not** `active=true`. |
| Why #63 failed | SQL `UPDATE workflow_entity SET active=false` left `activeVersionId` set. Startup still logged `Start Active Workflows` and activated WF40/WF42/WF48/WF90. |
| Version-specific disable | Official CLI `n8n unpublish:workflow --all` → `WorkflowRepository.unpublishAll()` → `{ active: false, activeVersionId: null }` for every row with `activeVersionId IS NOT NULL`. |
| Per-id equivalent | `n8n unpublish:workflow --id=<ID>` → `updateActiveState(id, false)`. |
| Deprecated | `update:workflow --active=false` is deprecated; CLI help redirects to `unpublish:workflow`. |
| Reversible | Original published versions remain in `workflow_history`. Restore on NEW later with `n8n publish:workflow --id=<ID> --versionId=<activeVersionId>`. |

This is n8n-supported CLI/runtime semantics, not a guessed column write.

---

## Isolation applied (NEW only, before any n8n server start)

1. OLD read-only preflight: n8n health 200; container IDs/StartedAt unchanged vs #62/#63.
2. NEW n8n + LiteLLM stayed **stopped** during diagnosis and rebuild.
3. NEW PostgreSQL volume `root_n8n_postgres_data_seqresync_retry_prod` was **destroyed and recreated** from preserved #63 dump `/root/n8n-replica-export-20260906T201140Z/n8n.dump` (sha256 `188248b6a47cf79add79b484762cff55b5263223c6c294dc86ca6c07b91ccc46`). `pg_restore` rc=0. Encryption volume `root_n8n_data` **untouched**.
4. Clean baseline counts: workflows=50, credentials=3, executions=**10256** (max id 310940). **No #63 dual-fire rows** (those were 310941–310944).
5. Captured reversibility map, then ran `docker compose run --rm --no-deps -T --entrypoint n8n n8n unpublish:workflow --all` (CLI only; port 5678 not listening).

### Published-before-unpublish (NEW replica)

| id | name (short) | activeVersionId | triggerCount |
|---|---|---|---|
| `9ZMj2ACTKyDVhCue` | WF40 | `a609ad90-7eb4-4495-9ec5-c4413165cea1` | 1 |
| `HVCzN3FoBdLGe9Hx` | WF42 | `93d606ae-4883-4e6e-91e5-41ff00cbf741` | 1 |
| `Rx0Qp7pLj9GnyGh7` | WF48 | `3e9d714f-3bdc-44f1-b3c5-b85385ddd811` | 0 |
| `90ldaa5a-4000-8000-000000000090` | WF90 | `febca537-9218-4fb4-8280-847b5e961f6b` | 1 |

Auxiliary tables at restore: `webhook_entity=0`, `scheduled_job=0`, `scheduled_task=0`, `workflow_publication_outbox=0`, `workflow_publication_trigger_status=0`, `workflow_published_version=0`.

### Pre-start proof (exact 2.33.3 predicate)

CLI: `All workflows unpublished successfully`.

| metric | value |
|---|---|
| `activeVersionId IS NOT NULL AND isArchived=false` (execution-capable) | **0** |
| `activeVersionId IS NOT NULL` | **0** |
| `active=true` | **0** |
| executions | **10256** |
| n8n server | **not started** |

Host copy of the map (NEW only): `/root/local-files/handoff-runtime/n8n233-unpublish-reversibility.json`.

---

## n8n start + observation

Loopback bind: `127.0.0.1:5678→5678`. Health 200 `{"status":"ok"}`.

Clean-log recreate start `2026-09-06T20:40:54Z`. This-start logs contained:

- `Finished building workflow dependency index. Processed 0 draft workflows, 0 published workflows.`
- **No** `Start Active Workflows`
- **No** `Activated workflow`

Fastest restored schedule from #63 evidence: ~60s (WF40/WF42). Observation window **90s** (`20:41:13Z`–`20:42:49Z`): executions stayed **10256** / max id **310940**. Post-window: execution-capable still **0**.

An earlier start in this same pass (`20:36:52Z`–`20:38:50Z`) also had zero published-index / zero executions; cumulative `docker logs` without `--since` still showed #63 activation lines from `20:16Z` and was treated as a false positive, then n8n was recreated for a clean log namespace.

### Continuity

| check | result |
|---|---|
| encryptionKey len | 32 |
| encryptionKey sha256 prefix | `ff09ea79eebe` (matches OLD / #63 sidecar) |
| config keys | `encryptionKey` only |
| credential decrypt (`export:credentials --decrypted` in-container, wiped) | **3/3** types `githubApi,httpHeaderAuth,telegramApi` |
| workflow count | 50 |
| original published version rows in `workflow_history` | preserved (same four `versionId`s) |

---

## LiteLLM (after n8n isolation PASS)

Recreated unpublished on `root_default`, **no `-p`**, image `ghcr.io/berriai/litellm:v1.98.0@sha256:26eb8aa650ef8039f3453b80fb52156fcadcb588be13a22bd8ce28a2425ed2f4`. Ports `4000/tcp:null`. Env keys only: `ZAI_CODING_API_KEY`, `CHATGPT_TOKEN_DIR`, `CHATGPT_AUTH_FILE`. **No provider inference.**

---

## Hard walls

| wall | result |
|---|---|
| OLD restart/stop/recreate/reboot/write | **not crossed** |
| Tailscale join/up on NEW | **NeedsLogin / Logged out** |
| hostname / MagicDNS / DNS / public route / cutover | **not touched** |
| NEW n8n/PostgreSQL/LiteLLM public publish | n8n loopback only; PG internal; LiteLLM unpublished |
| NEW restored-workflow executions | **0** this pass |
| secrets in Git/report | **none** |
| destructive ops | NEW disposable Postgres replica only; immediately rebuilt from preserved dump |

---

## OLD close fingerprint (unchanged)

| container | id prefix | StartedAt | status |
|---|---|---|---|
| `root-n8n-1` | `4df66089a77c375d…e4f556` | `2026-09-05T08:15:02.702674396Z` | running rc=0 health 200 |
| `root-postgres-1` | `6691aadd8c793eeb…e98ce0` | `2026-09-01T14:32:36.972332829Z` | healthy |
| `litellm-primary` | `edbb03981626234b…63f635` | `2026-08-28T14:01:10.735053817Z` | running rc=0 |

---

## NEW close state

| component | state |
|---|---|
| `root-n8n-1` | running, started `2026-09-06T20:40:54Z`, `127.0.0.1:5678`, health 200 |
| `root-postgres-1` | healthy, started `2026-09-06T20:33:59Z` (clean volume recreate) |
| `litellm-primary` | running unpublished `:4000`, started `2026-09-06T20:43:57Z` |
| Tailscale | Logged out / NeedsLogin |
| executions | 10256 (dump baseline) |
| published / execution-capable | 0 |

---

## Next (out of this pass)

Tailscale join/hostname/MagicDNS, DNS/public route, and cutover remain **GATE**. OLD stays LIVE. Republish of the four workflows on NEW is **not** authorized until a later cutover task.
