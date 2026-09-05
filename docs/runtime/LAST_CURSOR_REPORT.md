# LAST CURSOR REPORT

**BLOCK-ID:** `V4_REGISTRY_V2_CODEX_IDE_QUALIFICATION_RECONCILIATION_V1` (GitHub issue #38, corrective delta after #37)
**Classification:** `PASS — CODEX IDE QUALIFICATION METADATA RECONCILED WITH COMPLETED #34; SUBSCRIPTION POOL PRESERVED; LIVE COLLECTOR STILL PENDING; RUNTIME UNCHANGED`
**Timestamp (local):** 2026-09-05 ~15:5x
**Base HEAD:** `fdc050695da4583ea6982c6833036274fc99ddd2` (preverified = origin/main, main, tracked clean)
**CLOSURE:** STANDARD_RUNTIME_BUNDLE

## Outcome

Stale registry-v2 metadata corrected to match completed issue #34:

- `codex_ide_cursor_extension.qualification.runtime_qualified = true` with full #34
  evidence note: ChatGPT Plus subscription auth (NO OpenAI API key), model/reasoning UI
  inventory, repo-read PASS, TASK DELTA generation PASS, fail-closed stale-HEAD PASS,
  bounded real edit + Git push PASS (provenance commit `ad3e5cb`), dashboard quota
  source observed. No percentages/reset/multiplier persisted.
- Status distinction explicit: `runtime_qualified; live_quota_collector_missing` —
  no `*_pending`/`not_yet_runtime_qualified` wording remains anywhere (regex-enforced).
- `codex_subscription_models`: stale `ide_surface_runtime_qualification_pending` removed
  → `qualified`; dynamic model-selection policy untouched.
- `chatgpt_codex_subscription`: preserved as `active_pool_no_live_collector`, shared by
  IDE + external planner; no automatic quota freshness claimed.
- Contract §4/§5 updated: IDE runtime-qualified by #34; collectors still open.
- CURRENT_FRONTIER checked: no stale IDE-qualification wording → untouched per scope.

## Preserved

registry-v2 schema · `resources` v1 projection (semantic deep-equal) · GLM pool ·
Cursor allowance unverified · Qwen/OpenCode unmetered semantics · consumer tools
untouched from #37 · historical #37 report + #34 report (both NOT rewritten).
No Codex/Qwen generation, no collector, no provider call, no n8n/runtime change.

## Tests

- `tests/registry-v2/run.mjs`: **64/64 PASS** (56 previous + 8 new #34 assertions incl.
  runtime_qualified===true, subscription-only auth, evidence refs #34/ad3e5cb, no
  dynamic quota in note, distinct runtime-vs-collector status, no stale wording,
  pool still no-live-collector).
- Consumer suites re-run PASS: registry-validator, execution-router,
  status-control-plane-source, routing-bridge. `node --check` OK.

Full report:
`reports/architecture/v4_registry_v2_codex_ide_qualification_reconciliation_v1.md`

EXECUTOR_END_HEAD = the `cursor-pass:` commit carrying this report.
