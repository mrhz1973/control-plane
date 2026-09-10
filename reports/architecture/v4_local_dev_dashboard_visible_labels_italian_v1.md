# V4 Local Dev dashboard visible labels Italian V1

**TASK_REF:** `V4_LOCAL_DEV_DASHBOARD_VISIBLE_LABELS_ITALIAN_V1`
**Classification:** `PASS`
**Base head:** `56bfb9168d776d06412ed3d35473d5524d46ee2a`
**Date (UTC):** 2026-09-10

## Outcome

The Local Dev operator dashboard now renders state and status values in
Italian through one centralized `uiStateLabel(code)` mapping. Internal state
codes, API payloads, dispatch semantics, canonical resource IDs, and canonical
component names were not translated or otherwise changed.

The canonical Resources order remains:

`workstation → vps → qwen → glm → codex → cursor`

The operator role labels retain their canonical forms:

- `ORCHESTRATOR / BRIDGE`
- `HARNESS / LOCAL EXECUTOR`

## Validation

- `node tests/local-dev-dashboard-visible-labels-italian-v1/run.mjs` — PASS
- `node tests/local-dev-hermes-opencode-operator-visibility-v1/run.mjs` — PASS
- `node tests/local-dev-dispatcher-service-v1/run.mjs` — 69/69 PASS
- `node tests/local-dev-resource-observability-integrity-v1/run.mjs` — 7/7 PASS
- `node tests/registry-v2/run.mjs` — 76/76 PASS
- `git diff --check` — PASS

The canonical dispatcher was recycled in a bounded way: the prior listener
PID `40784` on `127.0.0.1:18793` was stopped and the exact scheduled task
`ControlPlane-V4-LocalDevDispatcher` was started. The new listener PID was
`20748` on the same loopback bind.

Read-only smoke checks returned HTTP 200 for `/dashboard`, `/v1/status`,
`/v1/diagnostics`, and `/v1/resources` both locally and through the private
Tailscale dashboard surface `https://asusdesktop.tailc01234.ts.net`. The
served dashboard contained the Italian labels `Disponibile`, `Non osservato`,
and `Inattivo`, while preserving the canonical role labels. Status was
`active=false`, `phase=IDLE`; resources reported Qwen
`health_state=AVAILABLE`, `observation_state=OBSERVED`.

Tailscale Serve configuration was read-only verified and remained mapped to
the existing loopback targets. No Serve configuration, browser, VPS, n8n,
queue, receipt, or runtime state was mutated.

## Hard-wall accounting

- `/v1/tick`: not invoked
- manual ticks: 0
- queue mutations: 0
- Qwen generations: 0
- production dispatch: 0
- credentials, cookies, tokens, and session material: not accessed or persisted

`#73` remains OPEN with `ISSUE_73_PHASE_C=PASS` and `PHASE_D=OPEN`. The next
operator-priority task remains `V4_HERMES_PRIVATE_NOVNC_OPERATOR_LINK_V1`.
