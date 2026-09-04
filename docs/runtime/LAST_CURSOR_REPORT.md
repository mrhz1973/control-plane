# LAST CURSOR REPORT

**BLOCK-ID:** `V4_LOCAL_DEV_EXECUTOR_LIVE_SAFETY_ENFORCEMENT_V1`
**Classification:** `LOCAL_DEV_EXECUTOR_LIVE_SAFETY_ENFORCED`
**Timestamp (local):** 2026-09-04

## Summary

Closed the fail-closed enforcement gaps before the first live proof.
Discovery (read-only `opencode debug config` probes, no model): installed
OpenCode 1.18.25 is V1 — V2 `permissions` rejected, V1 `permission`
(bash/edit maps + `webfetch`/`websearch` `"deny"`) accepted, and
`OPENCODE_CONFIG` env is honored.

Implemented:

- Hard wall-clock timebox bounding the OpenCode child itself
  (`BOUNDS_TIMEBOX_EXPIRED` on expiry, no unbounded child)
- Post-execution path enforcement before tests/staging/push
  (`STOP:UNEXPECTED_FILE_CHANGES`, zero staging/push after)
- Deny-all-first V1 bash allowlist (`allowed_commands` only) — technical,
  not prompt-only
- Network fail-closed: `webfetch`/`websearch` denied under both
  `offline` and `localhost_only`; only network path is the DEV guard on
  127.0.0.1
- Edit scoping to `allowed_paths`

Tests: wiring/enforcement suite **23/23 PASS** (incl. installed-CLI
schema acceptance of the generated config; source-level production-domain
absence) + executor regression **20/20 PASS**. Budget: run → one bounded
correction → final retest.

- Real Qwen generations: **0** · OpenCode runs: **0** · services
  started/stopped: **0**
- WF40/D-0025/scope-v3/production authorization/adapter/eligible set/role
  mappings/Cline: unchanged
- All pre-existing untracked files preserved

## NEXT

`V4_LOCAL_DEV_EXECUTOR_QWEN_FIRST_BOUNDED_LIVE_PROOF` (NOT executed in
this pass)

Evidence report:
`reports/architecture/v4_local_dev_executor_live_safety_enforcement_v1.md`
