# V4 Qwen DEV Profile OpenCode Nomenclature Migration V1

- **BLOCK-ID**: `V4_QWEN_DEV_PROFILE_OPENCODE_NOMENCLATURE_MIGRATION_V1`
- **GitHub issue**: #33
- **Date**: 2026-09-05
- **Base HEAD**: `ad3e5cb4020573542a74743d648f3470559187e9` (verified = origin/main, branch main, tracked clean)
- **Result**: **PASS**

## Objective

Atomic migration of the two active workstation DEV Qwen profile identities from Cline to OpenCode
nomenclature, with zero change to GGUF, context size, quantization, backend, or runtime behavior.

## Old → New mapping

| Old ID | New ID | ctx | GGUF | params |
|---|---|---|---|---|
| `qwen38-opus-q3-cline-24k` | `qwen38-opus-q3-opencode-24k` | 24576 | `Qwen3.8-27B-Opus-Distill-v2-Q3_K_M.gguf` | unchanged |
| `qwen38-opus-q3-cline-64k` | `qwen38-opus-q3-opencode-64k` | 65536 | `Qwen3.8-27B-Opus-Distill-v2-Q3_K_M.gguf` | unchanged |

## Precheck evidence

- Git preflight: HEAD `ad3e5cb` = origin/main, branch `main`, tracked-dirty = none. PASS.
- Preset SHA256 pre = `685015BF2EBE0D6293D09BEA003825295527DC2F9AD1CF0FC3E13D363003DD16` (exact match with persisted baseline).
- Baseline verification (preset + config): 24K ctx=24576, 64K ctx=65536, identical model path
  `D:/AI/qwen38-blender-lab/models/qwen38-opus/Qwen3.8-27B-Opus-Distill-v2-Q3_K_M.gguf`,
  n-gpu-layers=50, cache-type-k/v=q4_0, spec-type=none, reasoning=off. PASS.
- Idle verification: LOCAL_DEV dispatcher local tick → `IDLE_CLEAN/NO_ELIGIBLE_READY`; no
  opencode/cline/executor processes running; n8n wf90 `90ldaa5a-4000-8000-000000000090` active=t
  before and after (unchanged); Tailscale routes untouched.

## Census (bounded, classified)

Tracked-file census of `qwen38-opus-q3-cline-24k|64k` across repo: 50 files.

### ACTIVE (migrated in this pass)

- `configs/resources/qwen-local-runtime.json` — 2 `workstation_manual_profiles` keys + purposes.
- `tools/local-dev-executor-v1.mjs` — `DEFAULT_DEV_PROFILE_ID` (1 site).
- `tests/local-dev-executor-v1/run.mjs` (14 sites incl. valid-envelope fixture default).
- `tests/local-dev-executor-live-runner-v1/run.mjs` (10 sites).
- `tests/local-dev-executor-workstation-session-bridge-v1/run.mjs` (11 sites).
- `tests/local-dev-executor-new-file-persistence-v1/run.mjs` (1 site).
- `tests/local-dev-backlog-envelope-bridge-v1/run.mjs` (1 site).
- `tests/local-dev-convergence-remediation-v1/run.mjs` (1 site).
- `tests/local-dev-backlog-envelope-bridge-v1/fixtures/READY_D9002L_LOOP.md` (planner preferred ID).
- `C:\Users\mrhz\llama.cpp-dflash2\qwen-models.ini` — 2 sections + alias/tags (external to Git; see hashes).

### TEST (covered via the test files above; no additional TEST-only references elsewhere)

### CURRENT_DOC (updated in this pass)

- `docs/runtime/CURRENT_FRONTIER.md`
- `docs/runtime/LAST_CURSOR_REPORT.md`

### HISTORICAL_PROVENANCE (allowlist — intentionally NOT modified)

All remaining census hits live under `reports/` and reference the legacy IDs as historical
execution provenance (envelopes, run receipts, stop records, synthetic-seg4 evidence,
overnight-campaign reports, and the architecture/history reports
`qwen38_opus_q3_cline_64k_*`, `v4_cline24k_*`, `v4_cline64k_*`, `v4_local_dev_executor_*`).
Rewriting them would falsify provenance; per scope they stay untouched.

- `reports/architecture/*` (11 files), `reports/runtime/cursor-stops/*` (8),
  `reports/runtime/dev-queue/**` (18), `reports/runtime/overnight-campaigns/*` (1).

### System census (non-repo)

- **Preset/router/launcher workstation**: `qwen-models.ini` migrated (below); router config
  `C:\Users\mrhz\Documents\AI\QWEN\qwen-runtime-router.json` has NO cline references
  (external_profiles are dcfr-* only).
- **OpenCode config**: `C:\Users\mrhz\.config\opencode\opencode.jsonc` — no cline references.
- **Cline config**: no `~/.clined`, no `%APPDATA%` cline dirs.
- **Processes/services**: no running process, Scheduled Task, or service references cline.
- **Editor extensions**: Cline extension NOT installed in VSCode (`.vscode\extensions` =
  liveserver only) nor in Cursor (`.cursor\extensions` = none).

## Workstation preset (external to Git — hash + semantic diff only)

- Backup: `C:\Users\mrhz\llama.cpp-dflash2\qwen-models.ini.bak-cline-nomenclature-20260905`
  (SHA256 hash-verified identical to pre-state).
- Pre hash: `685015BF2EBE0D6293D09BEA003825299527DC2F9AD1CF0FC3E13D363003DD16`
- Post hash: `088A565525F59FBCD99B09AEBE125BF9E74B659344BC1C87008D11F8EF5F39FC`
- Semantic diff (backup vs migrated): ONLY the two section headers, two `alias` lines, two `tags`
  lines. `model`, `ctx-size`, `n-gpu-layers`, `cache-type-k/v`, `spec-type`, `reasoning` and every
  other section (daily-16k, agent-24k, blender-96k, original-ar-16k, uncensored-ar-16k, `[*]`
  globals) byte-identical. Runtime parity proven.
- Config JSON parity: identical fields except the two keys and `purpose`
  `CLINE_GENERAL_DEVELOPMENT` → `OPENCODE_GENERAL_DEVELOPMENT`.

## Tests

Target suites (scope item 4) — all green after expectation migration:

| Suite | Result |
|---|---|
| `tests/local-dev-executor-v1` | 21/21 PASS |
| `tests/local-dev-executor-live-runner-v1` | 42/42 PASS |
| `tests/local-dev-executor-workstation-session-bridge-v1` | 14/14 PASS |
| `tests/local-dev-executor-new-file-persistence-v1` | 15/15 PASS |
| `tests/local-dev-backlog-envelope-bridge-v1` | 18/18 PASS |
| `tests/local-dev-convergence-remediation-v1` | 11/11 PASS |

Adjacent consumer suites (config changed, so re-verified):

| Suite | Result |
|---|---|
| `tests/local-dev-dispatcher-service-v1` | 10/10 PASS |
| `tests/local-dev-dispatch-loop-v1` | 5/5 PASS (L4 guard updated: migrated profile_id legitimately contains substring "opencode"; assertion now masks the profile ID before the execution-config substring check) |
| `tests/local-dev-idle-backfill-policy-v1` | 10/10 PASS |

Tooling: `node --check tools/local-dev-executor-v1.mjs` OK;
`configs/resources/qwen-local-runtime.json` valid JSON. No benchmark/requalification campaign run.

## Router maintenance transaction (single, authorized override)

- One bounded reload: `GET http://127.0.0.1:18080/models?reload=1` → HTTP 200.
- `/v1/models` AFTER (via router :8080): `qwen38-opus-q3-opencode-24k` + `qwen38-opus-q3-opencode-64k`
  present; both legacy IDs absent; total 10 IDs (8 others byte-identical, incl. six production
  profiles + blender-96k + agent-24k).
- Rollback path was armed (preset backup + one rollback reload) — not needed.

## Non-edit OpenCode smokes (exact selection, one per new profile)

Via the proven path: generation guard (ephemeral port, max 3 turns, upstream :8080) →
`buildOpenCodeProviderOverlay`/`buildPermissionOverlay`/`buildOpenCodeRuntimeConfig` →
resolved real `opencode.exe` (1.18.25) → `run --dir . -m qwen_local/<id> --format json --auto`.
Read-only prompt; deny-all-first permission overlay; stdin ignored (ratified shape).

- `qwen38-opus-q3-opencode-24k`: exit 0, 52.7 s, guard saw 2 generation requests
  (0 blocked), opencode log `llm.model=qwen38-opus-q3-opencode-24k`. PASS.
- `qwen38-opus-q3-opencode-64k`: exit 0, 104.6 s, guard saw 2 generation requests
  (0 blocked), opencode log `llm.model=qwen38-opus-q3-opencode-64k`. PASS.

Working tree untouched by smokes (tracked diff = migration edits only).

## n8n always-on state (before/after)

- BEFORE: wf90 active, dispatcher service idling (`IDLE_CLEAN`), Tailscale route live.
- AFTER (post-migration, post-smoke): local tick → `IDLE_CLEAN/NO_ELIGIBLE_READY`; wf90 active=t
  (verified in Postgres `workflow_entity`); no always-on component modified.
- Dispatcher service NOT restarted in this pass: its executor composition imports
  `DEFAULT_DEV_PROFILE_ID` lazily per tick (node process holds old constant until next restart —
  see FOLLOW-UP below; no execution occurred during the window and next scheduled executor run
  resolves profiles from the migrated runtime config at claim time via resolveDevProfile, which
  reads the CURRENT config file per invocation).

## Cline uninstall census decision

**CLINE_UNINSTALL_ELIGIBLE=YES**

Rationale: after migration, zero ACTIVE references to the legacy IDs remain anywhere (config,
tools, tests, current docs, preset, OpenCode/Cline configs, processes, tasks, extensions). The
Cline VSCode extension is not installed on this workstation; no Cline dependency is active.
Uninstall/purge (if ever desired) is deferred to a separate task per scope; nothing in this pass
removed or renamed any Cline data.

## Preserved (verified)

Same GGUF both profiles; ctx 24576/65536; quantization/backend/GPU layers/cache/reasoning;
`workstation_dev_executor_profile` category; `auto_route=false`; `wf40=false`; `scope_v3=false`;
`control_plane_eligible=false`; six production profiles + role mapping deep-equal to base HEAD;
startup/default production profile unchanged; WF40/WF61/D-0025 untouched; n8n always-on
untouched; DEV queue + receipts untouched; historical reports preserved under
HISTORICAL_PROVENANCE allowlist.

## Follow-up (non-blocking, informational)

- The always-on dispatcher service process (pid 52292) still holds the pre-migration constant
  `DEFAULT_DEV_PROFILE_ID` in memory. It reads profile resolution from the migrated config file
  per tick (`resolveDevProfile` → `loadQwenLocalRuntime()` reads disk), and all queued backlog
  items pin explicit `profile_id` values, so behavior is already correct; a routine service
  restart at the next maintenance point will refresh the in-memory constant.
