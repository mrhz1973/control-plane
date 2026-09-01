# V4 n8n PostgreSQL canary schedule six-tick final proof

**Task ref:** `V4_N8N_POSTGRES_CANARY_SCHEDULE_SIX_TICK_FINAL_PROOF`  
**Run nonce:** `N8N_POSTGRES_SIX_TICK_FINAL_20260901_01`  
**Base:** `e760d6d87574618956d6a14a07631750bdd94eb8`  
**Result:** `PASS`  
**Classification:** `POSTGRES_CANARY_ADMISSION_PASS`

Single authorized isolated canary attempt captured six natural Schedule Trigger executions on PostgreSQL 16 + stock n8n 2.33.3, combined with prior validated webhook admission evidence. No webhook rerun. No production mutation.

## Canary topology

| Field | Value |
|---|---|
| Project | `n8n-pg-six-tick-final-01` |
| Bind | `127.0.0.1:5686` |
| n8n | stock `2.33.3` digest `sha256:769d3a…1cc9` |
| PostgreSQL | `16.15` digest `sha256:f1c3376…df6f94` |
| Workflow ID | `CanarySixTickFinal001` |
| activeVersionId | `b51f9eeb-38c1-4aa9-819a-d601b4be7070` |
| Evidence dir | `/root/n8n-postgres-canary/N8N_POSTGRES_SIX_TICK_FINAL_20260901_01/evidence/` |

Workflow: Schedule Trigger every 1 minute (`n8n-nodes-base.scheduleTrigger` typeVersion 1.2) → No Operation. Two nodes. Import via real file path (0644, SHA-256 host/container match). One `publish:workflow` only. One n8n restart.

## Activation (corrected gate)

Authoritative gate after health readiness: PostgreSQL READ-ONLY poll up to 90 seconds for `activeVersionId IS NOT NULL AND isArchived=false AND triggerCount=1`. Optional log strings not required.

| Field | Value |
|---|---|
| HEALTH_READY | iter=3 |
| ACTIVATION_PROVEN | true at sec=2 |
| triggerCount | 1 |
| activeVersionId | `b51f9eeb-38c1-4aa9-819a-d601b4be7070` |
| isArchived | false |
| activation errors | none |

## Baseline

| Field | Value |
|---|---|
| observation_start_utc | `2026-09-01T07:49:49Z` |
| baseline_max_execution_id | 0 |
| pre-existing canary executions | 0 |

## Six natural schedule executions

| id | mode | status | startedAt (UTC) | finished |
|---:|---|---|---|:---:|
| 1 | trigger | success | 2026-09-01 07:50:23.018+00 | t |
| 2 | trigger | success | 2026-09-01 07:51:23.008+00 | t |
| 3 | trigger | success | 2026-09-01 07:52:23.009+00 | t |
| 4 | trigger | success | 2026-09-01 07:53:23.008+00 | t |
| 5 | trigger | success | 2026-09-01 07:54:23.008+00 | t |
| 6 | trigger | success | 2026-09-01 07:55:23.007+00 | t |

**Inter-tick deltas (startedAt):** 59.99, 60.001, 59.999, 60.0, 59.999 seconds — compatible with one-minute natural scheduling.

## Counters

| Counter | Value |
|---|---:|
| SCHEDULE_UNIQUE | 6 |
| SCHEDULE_STARTED | 6 |
| SCHEDULE_TERMINAL | 6 |
| SCHEDULE_STUCK_NEW_OVER_30S | 0 |
| SCHEDULE_STUCK_NEW_OVER_5S_MAX | 0 |
| SCHEDULE_NATURALITY | PROVEN |

## Prior webhook evidence (not rerun)

From commit `58ba29ccd3aeb73c5e0e85d5cbdb6b7f24ce7b36`:

| Counter | Value |
|---|---:|
| WEBHOOK_UNIQUE | 1000 |
| WEBHOOK_STARTED | 1000 |
| WEBHOOK_TERMINAL | 1000 |
| WEBHOOK_STUCK_NEW_OVER_30S | 0 |

## Combined admission classification

**POSTGRES_CANARY_ADMISSION_PASS** — evidence basis: 1000 validated webhook admissions + 6 natural schedule admissions + 0 stuck-new >30 sec. This proves PostgreSQL compatibility/admission behavior sufficient for a controlled migration; it does **not** claim SQLite is mathematically proven as root cause.

## Evidence SHA-256 (off-repo, preserved before volume cleanup)

| File | SHA-256 |
|---|---|
| schedule_rows.csv | `91d3c893856c2f4374d67d2f4511f320b7d28d7fdefc231296c70a53fbfd289c` |
| schedule_rows.json | `153ddad6b4baacc8ed10dae37a8d19487efb8a970cbfa7d9ecfece1307c872cb` |
| canary_metadata.json | `79ec4ae9ee8ae075d6ba5648650eae00a5efdf296aa233bcfbf55ec0c2116123` |
| activation_state.json | `e730452f86018abb572daece086612d245f20ac05c185133a3a11ee4304d8c50` |

## Cleanup and production safety

- canary n8n, PostgreSQL, network, and volumes removed
- sanitized evidence preserved off-repo
- prod_mutation = **0**
- production verified after cleanup: n8n **2.33.3**, health **200**, WF40 active/published **83 nodes**, WF61 inactive, D-0025 CLOSED, ACTIVE authorization=0

## NEXT

`V4_N8N_CONTROLLED_PRODUCTION_POSTGRES_MIGRATION_AND_WF40_REGRESSION_PROOF`
