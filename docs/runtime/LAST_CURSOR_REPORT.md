# LAST CURSOR REPORT

**BLOCK-ID:** `V4_LOCAL_DEV_EXECUTOR_BACKLOG_ENVELOPE_BRIDGE_DESIGN_V1`
**Classification:** `CLINE... BACKLOG_ENVELOPE_BRIDGE_DESIGN — PASS (DESIGN ONLY)`
**Timestamp (local):** 2026-09-05 (overnight campaign pass 1)

## Summary

Design-only PASS for the deterministic bridge from a GitHub `backlog-item-v1`
Markdown artifact to a validated `local-dev-task-envelope-v1`. Zero new
dependencies: reuses in-repo `extractYamlFence` + `parseBoundedBacklogYaml`
(from the D-0025-W builder) and the executor's `validateEnvelope` as the
single source of envelope law. Deterministic mapping fixed (task_ref from
backlog id; verbatim allowed_paths never widened; loop→test-cycles mapping
clamped; timebox/turns hints clamped under existing hard caps; DEV profile =
explicit `local_dev.dev_profile` or DEFAULT 24K). Strict DEV-lane fail-closed
gates: READY_FOR_PLANNING only, human_gate_required_if → stop, high risk →
stop, unknown `local_dev` keys → stop, unknown repo → stop. Idempotency v1 =
bridge receipt sidecar under `reports/runtime/dev-queue/` keyed by
source_ref (duplicate → refuse); atomic lease/CAS explicitly deferred.
Tool shape: `tools/bridge-backlog-to-local-dev-envelope-v1.mjs` (pure
function + dry-run CLI). No execution activated. Campaign pass 1 of
V4_LOCAL_DEV_EXECUTOR_OVERNIGHT_AUTOVIA_CAMPAIGN_V1 (checkpoint appended).

## NEXT

`V4_LOCAL_DEV_EXECUTOR_BACKLOG_ENVELOPE_BRIDGE_IMPLEMENT_V1` — implement the
bridge tool + deterministic offline tests exactly per the persisted design
(AUTO-VIA eligible: mechanically determined, test-contained, repo-local).
