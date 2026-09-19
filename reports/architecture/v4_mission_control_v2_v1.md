# V4 Mission Control V2 — human-first operations, history and component view

```text
RESULT=PASS
TASK_REF=V4_MISSION_CONTROL_V2_V1
ISSUE_94=#94

BASE_HEAD=0878b147bfaceccf155ef0b4cacbf77fd15ef9b2
FINAL_HEAD=978b0bc21f7342ffc86811a4798af643bdc3b7d6
```

## Objective

Transform the LOCAL_DEV dashboard into a human-first Mission Control without changing any execution authority:

- later IDLE_CLEAN ticks must not erase the last meaningful task;
- active task / last terminal task / latest poll must be clearly separated;
- the operator must immediately understand PRIMA / ADESSO / DOPO;
- component roles must be plain-language;
- history must be task-centric, not receipt/tick-centric.

## Phase 1 — Durable operational history

**Journal** (append-only JSONL, OUTSIDE the Git worktree):

```text
%LOCALAPPDATA%\ControlPlane\runtime\mission-control-events.jsonl
(fallback: %USERPROFILE%\.control-plane-runtime\mission-control-events.jsonl)
```

Laws implemented:

- append-only writes via `appendFileSync`, rotation at 2 MiB (`.1` keeps the newest chunk);
- strict field allow-list (`MISSION_CONTROL_EVENT_FIELDS`): `schema_version, recorded_at, task_ref, task_id, target_repo, event, phase, component, classification, tests_state, duration_ms, commit_sha, human_summary` — each size-bounded;
- secrets/secret-like keys fail closed (never persisted); no raw stdout, no command lines, no environment variables, no cookies/tokens, no source contents;
- malformed/foreign-schema journal lines are skipped safely on read (never fatal);
- **isolation law**: injected-deps ticks never write the real journal (same `shouldPersistRuntimeArtifacts` law as receipts/envelopes); only the real runtime or an explicitly injected `missionControlJournalPath` writes.

Events emitted ONLY at real observable transitions (no fabrication):

| Event | Hook point |
|---|---|
| `TASK_SELECTED` | real claim fenced (target-path check passed) |
| `PREFLIGHT_PASS`, `RUNTIME_READY` | exact-profile Qwen readiness verified |
| `EXECUTOR_STARTED` | immediately before `runExecutor` |
| `TESTS_STARTED`, `TESTS_PASS`, `TESTS_FAIL` | executor `onStatus` TESTS events |
| `PERSISTENCE_STARTED` | executor `onStatus` PERSISTENCE event |
| `TASK_PASS`, `TASK_STOP` | terminal receipt persisted; duration/tests/commit only when the executor result really carries them |
| `HUMAN_GATE_REQUIRED` | repo-hygiene gate, Qwen not ready, admission rejected |

`IDLE_CLEAN` ticks emit NOTHING. Omitted vocabulary with no exact observable hook: `PREFLIGHT_STARTED` (no pre-readiness transition exists), `COMMIT_PUSHED` (persistence detail not surfaced as a discrete transition), `RUNTIME_READY` duplicates `PREFLIGHT_PASS` observability but is kept as the canonical readiness marker.

**Endpoint** `GET /v1/history` (read-only, GET-only, bounded):

```json
{
  "schema_version": "local-dev-mission-control-history-v1",
  "latest_tick": { "recorded_at", "classification", "execution_performed", "task_ref", "reason_codes" },
  "active_task": null | { "task_ref", "phase", "elapsed_ms", "qwen_profile", "started_at" },
  "last_terminal_task": null | { "task_ref", "outcome", "terminal_at", "started_at", "duration_ms", "tests_state", "commit_sha", "persistence_state", "blocker", "human_summary" },
  "recent_tasks": [ ...bounded 20... ],
  "recent_events": [ ...bounded 60... ]
}
```

The history builder duplicates NO execution authority: it derives task-centric history from the AUTHORITATIVE receipts ledger (terminal states) + journal + in-memory status/lastTick; it never mutates receipts and never fabricates PASS/STOP.

## Phase 2 — OPERAZIONI tab (default)

- ACTIVE TASK / LAST TERMINAL TASK / LATEST IDLE TICK are distinct concepts that never overwrite each other;
- with no active task, the LAST TERMINAL TASK is prominent (PRIMA card + expandable detail) and the idle tick stays a small system-health fact (ADESSO explicitly reads "Nessun task in esecuzione");
- PRIMA = previous authoritative state; ADESSO = real active/idle state; DOPO = canonically-known next action only ("Nessun prossimo task determinato" otherwise — never invented);
- canonical phase rail: Selezione → Preflight → Runtime → Executor → Test → Persistenza → PASS/STOP; states only (completed/current/pending/failed), NO percentages; completion derives ONLY from real journal events or authoritative terminal classification (a STOP without journal evidence completes nothing);
- prominent facts: task_ref, target repo, model/profile, harness, controller, elapsed (from status), HUMAN GATE, STOP blocker — technical detail expandable.

## Phase 3 — STORICO tab

Task-centric table (from `/v1/history`): task_ref, repo, claim/terminal times, duration, PASS/STOP/HUMAN_GATE outcome, tests state, commit SHA (when authoritative), persistence state, blocker. Ordinary IDLE_CLEAN ticks are NEVER rendered as engineering tasks. Receipt state is never mutated; history survives dispatcher restarts (journal + receipts are durable).

## Phase 4 — COMPONENTI tab

Eight plain-Italian cards (WF90 · n8n, Dispatcher, Dispatcher Supervisor, Qwen Local, OpenCode, Receipt Ledger, GitHub Source of Truth, Hermes) each with NOME / RUOLO / STATO / SERVE ADESSO? / PID·PARENT·PORT only when really observed ("non osservato" otherwise) / COSA SUCCEDE SE LO CHIUDI?. Links to `/architecture` for deeper topology.

## Phase 5 — TECNICO tab

All previous technical capability retained: resources/quota observatory, operator visibility ("Chi sta facendo cosa"), queue + receipts table, agent/browser ops, dispatcher technical facts, source freshness. Nothing useful deleted.

## Phase 6 — UI / refresh law

- `/v1/history` added as a fourth #85 source: single-flight, per-source freshness (FRESH/STALE/UNAVAILABLE_NO_DATA), last-known-good retention (history failure never blanks other sources and vice versa), no full-page rebuild/flicker (same `put()` idempotent patching);
- tabs: OPERAZIONI default; choice persisted trivially in localStorage (`control-plane.dashboard.tab.v1`), invalid values fall back safely;
- desktop + mobile responsive; Architecture route preserved and prominently linked (topbar + COMPONENTI + TECNICO context).

## Phase 7 — Tests

`node tests/local-dev-dispatcher-service-v1/run.mjs` → **87 passed, 0 failed** (75 pre-existing + 12 new):

- S82 journal path outside Git worktree;
- S83 strict allow-list + bounds; secret-like/non-allowlisted fields not persisted;
- S84 append-only journal survives reload; malformed lines fail safely;
- S85 /v1/history read-only GET (POST 405); IDLE latest tick does NOT erase last terminal task;
- S86 active vs last-terminal separation; idle never overwrites terminal;
- S87 IDLE_CLEAN not rendered as engineering task; PRIMA/ADESSO/DOPO honest;
- S88 phase rail completes phases ONLY from real evidence (no invented completions);
- S89 history endpoint failure retains last-known-good, partial state surfaced;
- S90 COMPONENTI honest cards; no invented PID;
- S91 tabs; OPERAZIONI default; trivial persistence; no location.reload; Architecture linked;
- S92 injected-deps ticks never write the real journal (isolation law);
- S93 history survives simulated dispatcher restart from durable state only.

`git diff --check` clean.

## Live validation (read-only)

```text
/dashboard     = HTTP 200
/architecture  = HTTP 200
/v1/status     = HTTP 200   (active=false)
/v1/diagnostics= HTTP 200
/v1/resources  = HTTP 200   (first post-restart fetch timed out on cold VPS/quota collectors; 200 on retry — warm-up, not a regression)
/v1/history    = HTTP 200   (last_terminal_task=LOCAL_DEV_B_D-9501-S outcome=STOP from real receipts; recent_tasks=20; recent_events=0 — journal is fresh, no fabricated events)
```

Visual/data verification (browser):

- OPERAZIONI: PRIMA=D-9501-S (STOP, real receipt), ADESSO="Nessun task in esecuzione", DOPO="Intervento umano richiesto" (real active gate: tracked-dirty during this very change); 7-phase rail renders;
- STORICO: real task-centric rows from the receipts ledger (incl. repo resolution `mrhz1973/tmar-tts` from source_ref evidence);
- COMPONENTI: 8 cards, architecture link present;
- TECNICO: operator visibility + resources + queue + agent ops + dispatcher facts all present;
- No POST /v1/tick performed at any point.

## Hard walls

```text
WF90_CHANGED=NO                 N8N_CHANGED=NO
SELECTOR_CHANGED=NO             ADMISSION_CHANGED=NO
RECEIPT_AUTHORITY_CHANGED=NO    RECEIPTS_REWRITTEN=NO
QUEUE_REWRITTEN=NO              ROUTING_CHANGED=NO
SECOND_AUTHORITY=NO             PUBLIC_BIND=NO
FUNNEL=NO                       SECRETS_PERSISTED=0
RAW_STDOUT_PERSISTED=0          RAW_CMDLINE_PERSISTED=0
FAKE_EVENTS=0                   INVENTED_PERCENTAGES=0
ARCHITECTURE_ROUTE_REMOVED=NO
DASHBOARD_MUTATION_CONTROLS=0   BACKEND_MUTATION_ENDPOINTS=0
```

## Files changed

```text
tools/serve-local-dev-autonomous-dispatcher-v1.mjs   (journal + /v1/history + lifecycle hooks)
tools/local-dev-dispatcher-dashboard-v1.html         (tabs + OPERAZIONI/STORICO/COMPONENTI/TECNICO)
tests/local-dev-dispatcher-service-v1/run.mjs        (S82–S93 + harness /v1/history)
docs/runtime/LOCAL_DEV_DISPATCHER_OPERATING_MODEL.md (endpoints + dashboard section)
reports/architecture/v4_mission_control_v2_v1.md     (this report)
```
