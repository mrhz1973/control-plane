# LAST CURSOR REPORT

**BLOCK-ID:** `V4_QWEN_DEV_PROFILE_OPENCODE_NOMENCLATURE_MIGRATION_V1` (GitHub issue #33)
**Classification:** `PASS — ACTIVE DEV PROFILE NOMENCLATURE MIGRATED CLINE→OPENCODE; RUNTIME PARITY VERIFIED; HISTORICAL PROVENANCE AND N8N ALWAYS-ON PRESERVED; CLINE UNINSTALL CENSUS RECORDED`
**Timestamp (local):** 2026-09-05 ~14:5x
**Base HEAD:** `ad3e5cb4020573542a74743d648f3470559187e9` (preverified = origin/main, tracked clean)
**CLOSURE:** STANDARD_RUNTIME_BUNDLE

## Outcome

Active DEV profile identities migrated atomically, no runtime behavior change:

- `qwen38-opus-q3-cline-24k` → `qwen38-opus-q3-opencode-24k` (ctx 24576)
- `qwen38-opus-q3-cline-64k` → `qwen38-opus-q3-opencode-64k` (ctx 65536)
- Same GGUF (`Qwen3.8-27B-Opus-Distill-v2-Q3_K_M.gguf`), quantization, backend,
  GPU layers (50), cache (q4_0/q4_0), spec-type none, reasoning off — verified by
  preset semantic diff (only section names/alias/tags lines changed) and config
  field-for-field comparison (only keys + `purpose` → `OPENCODE_GENERAL_DEVELOPMENT`).

## Key evidence

- **Preset (external to Git)**: backup hash-verified; pre-SHA256
  `685015BF…3DD16` = persisted baseline; post-SHA256 `088A5655…F39FC`.
- **Router**: ONE bounded maintenance reload (`GET /models?reload=1` → 200) while
  always-on idle; `/v1/models` after: both OpenCode IDs present, both legacy IDs
  absent, other 8 profiles byte-identical (six production + blender + agent-24k).
- **Smokes (non-edit, one per new profile, exact selection)**: via the proven
  path (generation guard → provider overlay → resolved opencode.exe 1.18.25,
  stdin ignored). 24K exit 0 / 52.7s / 2 generations; 64K exit 0 / 104.6s /
  2 generations; opencode log confirms `llm.model=qwen38-opus-q3-opencode-{24k,64k}`;
  zero edits (tracked diff = migration edits only).
- **Tests**: 6 target suites 121/121 + 3 adjacent consumer suites 25/25
  (dispatcher-service 10, dispatch-loop 5 — L4 execution-config guard updated to
  mask the migrated profile ID which legitimately contains the substring
  "opencode", backfill-policy 10). `node --check` OK; runtime JSON valid.
- **n8n always-on**: wf90 active=t before/after; dispatcher IDLE_CLEAN at
  precheck and after; no always-on component touched.
- **Census**: 50 tracked files with legacy IDs → ACTIVE (config/tool/6 suites +
  fixture) and CURRENT_DOC migrated; `reports/**` = HISTORICAL_PROVENANCE
  allowlist (untouched). System census: OpenCode config clean, no Cline
  configs/extensions/processes/tasks → **CLINE_UNINSTALL_ELIGIBLE=YES**
  (uninstall itself deferred to a separate task per scope).
- Full report: `reports/architecture/v4_qwen_dev_profiles_opencode_nomenclature_migration_v1.md`

## Preserved (verified)

GGUF/ctx/quantization/backend; `workstation_dev_executor_profile` category;
auto_route=false; wf40=false; scope_v3=false; control_plane_eligible=false;
six production profiles + role mapping deep-equal to base HEAD; startup default
production profile unchanged; WF40/WF61/D-0025 untouched; n8n always-on
untouched; DEV queue + receipts untouched; historical reports untouched.

## Non-blocking note

The always-on dispatcher service process still holds the pre-migration
`DEFAULT_DEV_PROFILE_ID` constant in memory; per-tick profile resolution reads
the migrated config from disk and queued items pin explicit profile IDs, so
behavior is already correct. A routine service restart at the next maintenance
point refreshes the in-memory constant.

EXECUTOR_END_HEAD = the `cursor-pass:` commit carrying this report.
