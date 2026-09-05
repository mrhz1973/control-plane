# V4 Registry V2 Codex IDE Qualification Reconciliation V1

- **BLOCK-ID**: `V4_REGISTRY_V2_CODEX_IDE_QUALIFICATION_RECONCILIATION_V1`
- **GitHub issue**: #38 (corrective metadata delta after #37 PASS; reconciles completed #34)
- **Date**: 2026-09-05
- **Base HEAD**: `fdc050695da4583ea6982c6833036274fc99ddd2` (verified = origin/main, branch main, tracked clean)
- **Result**: **PASS**

## Objective

Correct only the stale canonical registry-v2 metadata about Codex IDE qualification so it
matches completed issue #34, while preserving the explicit fact that **no live automatic
quota collector exists yet**. No new Codex proof executed; no runtime/n8n change.

## #34 evidence references (already existing, not re-run)

- Official Codex IDE extension installed in Cursor; authenticated via **ChatGPT Plus
  subscription** (NOT OpenAI API key) — `reports/architecture/v4_codex_ide_cursor_live_qualification.md`;
- live model/reasoning UI inventory (GPT-5.6 Sol/Terra/Luna, GPT-5.5, GPT-5.4 Mini;
  reasoning Minimal…Max) — same report;
- bounded repo-read `CODEX_IDE_REPO_READ=PASS`; TASK DELTA generation
  `TASK_DELTA_GENERATION=PASS_WITH_ORCHESTRATOR_LEANING`; fail-closed stale-HEAD
  `FAIL_CLOSED_BEHAVIOR=PASS` — same report;
- **bounded real edit + Git push PASS**: provenance commit `ad3e5cb`
  (`codex-ide-proof: V4_CODEX_IDE_CURSOR_BOUNDED_EDIT_V1`, pushed and remote-verified —
  visible in repo history; the report file itself records the pre-edit qualification state
  and is intentionally preserved as historical evidence);
- quota/usage **dashboard source observed** (dashboard_snapshot class); no collector.

## Stale fields before → corrected fields after

| Location | Before (stale) | After (corrected) |
|---|---|---|
| `access_surfaces.codex_ide_cursor_extension.qualification.runtime_qualified` | `false` | `true` |
| same, `qualification.note` | "Capability/permission/usage evidence required before any auto-routing (issue #32 A.2). Static registry representation only in this pass." | full #34 evidence recap (subscription auth, UI inventory, repo-read PASS, TASK DELTA PASS, fail-closed stale-HEAD PASS, bounded edit + push PASS `ad3e5cb`, dashboard source observed) **+ explicit separation**: runtime qualification ≠ quota collection; no live automatic collector; quota stays governed by `resource-status-v1` observations, fail-closed/unknown without a fresh valid observation |
| same, `status` | `represented_not_yet_runtime_qualified` | `runtime_qualified; live_quota_collector_missing` |
| `models.codex_subscription_models.status` | `qualified_for_external_planner; ide_surface_runtime_qualification_pending` | `qualified` (stale pending claim removed; dynamic model-selection policy untouched) |
| `access_surfaces.codex_external_planner.status` | `represented_not_yet_pool_aware` | `runtime_qualified; live_quota_collector_missing` (same distinction, pool awareness still future) |
| `docs/contracts/resource-registry-v2.md` §4/§5 | generic "surfaces not yet runtime-qualified…"; §5 listed Codex IDE qualification as open | §4 states IDE runtime-qualified by #34 with collector-missing caveat; §5 marks qualification as completed via #34, reconciled by this pass; collectors still open |

## Preserved (unchanged)

- `docs/contracts/resource-registry-v2.schema.json` (the corrected metadata fits the
  existing schema: `qualification{runtime_qualified, note}`, free-form `status`);
- `resources` v1 compatibility projection (semantic deep-equal — no `resources.*` edits);
- `chatgpt_codex_subscription` pool: `status: "active_pool_no_live_collector"`,
  shared by IDE + external planner surfaces, `quota_source_allowed:
  dashboard_snapshot/normalized_collector_future`, `dynamic_values:
  forbidden_in_registry` — no automatic quota freshness claimed;
- `glm_coding_plan` pool; Cursor allowance `unverified`; Qwen/OpenCode
  `none_local_unmetered`; all auth boundaries (subscription-only, NO OpenAI API/BYOK);
- historical report `v4_resource_registry_v2_model_surface_quota_pool_v1.md` (NOT
  rewritten — remains #37 provenance) and `v4_codex_ide_cursor_live_qualification.md`
  (NOT rewritten — remains #34 provenance);
- CURRENT_FRONTIER row checked: it contains NO stale IDE-qualification wording (only
  "live quota collectors NOT yet implemented", still true) → left untouched per scope.

## No dynamic quota hardcoded

The qualification note contains evidence labels (PASS markers, commit hash, report path)
and **zero** percentages, reset timestamps, multipliers, or remaining-quota numbers.
Enforced by focused test regex (`no percent/reset_at/multiplier` in the note) plus the
pre-existing pool-level dynamic-values checks.

## Focused tests

`tests/registry-v2/run.mjs` — **64/64 PASS** (was 56; +8 new assertions):

- `codex-ide-runtime-qualified` (=== true);
- `codex-ide-auth-qualified-subscription-only`;
- `codex-ide-evidence-references-34` (#34 + commit ad3e5cb in note);
- `codex-ide-no-dynamic-quota-in-evidence` (regex);
- `codex-ide-distinct-runtime-vs-collector-status` (`runtime_qualified` AND
  `live_quota_collector_missing` both present in status);
- `no-stale-qualification-pending-wording-anywhere` (regex over models+surfaces+pools:
  no `*_pending`/`not_yet_runtime_qualified`/`represented_not_yet*`);
- `pool-still-no-live-collector` (`active_pool_no_live_collector` preserved);
- `external-planner-also-marked-runtime-qualified`.

All prior 56 checks still PASS (projection deep-equal, shared-pool proofs,
no-OpenAI-API/BYOK, no-dynamic-values, schema positive/negative, router parity,
validator shim, consumer compatibility). Consumer suites re-run:
`resource-registry-validator`, `execution-router`, `v4-resource-status-control-plane-source`,
`n8n-v4-execution-routing-bridge` — all PASS. `node --check` OK.

## Compatibility / runtime untouched

No consumer code changed in this pass (validator/router/bridge untouched from #37).
No workflow/n8n/WF40/WF61/D-0025/dispatcher/Tailscale/Qwen runtime/credential/billing
change. No Codex/Qwen generation, no dashboard scraping, no provider API call.
Compatibility projection v1 semantically invariant (zero `resources` diffs).

EXECUTOR_END_HEAD = the `cursor-pass:` commit carrying this report.
