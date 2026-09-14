# V4 OpenClaw retirement scope reconciliation V1

**TASK_REF:** `V4_OPENCLAW_RETIREMENT_SCOPE_RECONCILIATION_V1`
**Classification:** `PASS`
**STARTING_HEAD:** `a07269694ac700f763b43c49fb62894b823e3d3a`
**ENDING_HEAD:** `THIS_COMMIT`
**Date (Europe/Rome):** 2026-09-14

## Decision

This is a bounded canon reconciliation. No runtime, provider, dispatcher,
registry, browser, Telegram, n8n, VPS, or OpenClaw invocation was performed.

The original Hermes consolidation audit assumed zero live qualified OpenClaw
callers and classified OpenClaw as a dormant broker/fallback. The Phase 1
caller audit disproved that assumption by observing the live #73 quota lane:
the LOCAL_DEV resource observatory invokes `openclaw status --usage --json`.

The value comparison then established the per-pool result:

- `glm_coding_plan`: `GLM_OPENCLAW_VALUE=UNIQUE`; OpenClaw is the only
  currently qualified machine-readable source.
- `chatgpt_codex_subscription`: `CODEX_OPENCLAW_VALUE=INFERIOR`; the direct
  Codex app-server source is faster, richer, and provider-authoritative.

Phase 0.5 consequently moved Codex quota authority to the app-server and
retired OpenClaw's Codex authority/fallback role. The final disposition is
scoped retention of the GLM observation lane, not general OpenClaw retention.

## Canonical markers

```text
OPENCLAW_FINAL_DISPOSITION=SCOPED_RETENTION
OPENCLAW_BROKER_RUNTIME=RETIRED
OPENCLAW_FALLBACK_ROLE=RETIRED
OPENCLAW_AGENT_RUNTIME=RETIRED
OPENCLAW_QUOTA_OBSERVATION_LANE=KEEP_SCOPED
OPENCLAW_QUOTA_SCOPE=glm_coding_plan
GLM_QUOTA_AUTHORITY=OPENCLAW
CODEX_QUOTA_AUTHORITY=CODEX_APP_SERVER
CODEX_OPENCLAW_AUTHORITY=NO
CODEX_OPENCLAW_FALLBACK=NO
CODEX_OPENCLAW_DEPENDENCY=RETIRED
GLM_OPENCLAW_DEPENDENCY=KEPT
RUNTIME_CHANGED=NO
PRODUCTION_CHANGED=NO
HISTORICAL_EVIDENCE_PRESERVED=YES
CANONICAL_AMBIGUITY_RESOLVED=YES
ISSUE_73_PHASE_C=PASS
PHASE_D=OPEN
NEXT=V4_HERMES_PHASE_D_CONTEXT_ROLLOVER_STALE_GENERATION_FENCE_V1
```

## Reconciled surfaces

- The historical Hermes consolidation audit contains the explicit superseding
  note; its original finding remains preserved.
- `CURRENT_FRONTIER.md` records the scoped disposition and the Phase D next.
- `LAST_CURSOR_REPORT.md` records this reconciliation as the latest result.
- Current architecture/contract/VPS documents no longer describe OpenClaw as a
  general broker, fallback, agent runtime, or Codex quota authority.
- `configs/resources/registry.json` was verified read-only and remains free of
  an OpenClaw selectable runtime entry.

## Deferred GLM follow-ups

The existing evidence remains unchanged and these are follow-up items only:

1. `usedToRemainingPercent(null) -> 100` marginal fail-open wrinkle.
2. OpenClaw `usage.updatedAt` future-dated anomaly.

## Validation and hard-wall result

```text
T1_ROLE_RETIRE=PASS
T2_GLM_COLLECTOR_RETAINED=PASS
T3_CODEX_AUTHORITY_NOT_OPENCLAW=PASS
T4_CODEX_AUTHORITY_APPSERVER=PASS
T5_SELECTABLE_REGISTRY_NO_OPENCLAW=PASS
T6_HISTORICAL_EVIDENCE_PRESERVED=PASS
T7_SUPERSESSION_EXPLICIT=PASS
T8_RUNTIME_FILES_UNCHANGED=PASS
T9_PRODUCTION_CHANGED=NO
T10_PROVIDER_OR_RUNTIME_INVOCATION=0
```

No model inference, provider call, dispatcher tick, browser action, Telegram
send, n8n/VPS mutation, issue mutation, uninstall, or deletion occurred.

## Rollback

Revert the single reconciliation commit to restore the pre-reconciliation
document projections. This does not alter runtime behavior, the registry, or
the historical source reports.
