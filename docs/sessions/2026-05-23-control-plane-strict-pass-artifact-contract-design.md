# Control Plane — strict_pass artifact contract design

**Date:** 2026-05-23  
**Status:** **DESIGN ONLY / NO RUNTIME / PM-34 STILL GATED**

**Related:** [dual-sequence reconciliation](2026-05-23-control-plane-openclaw-dual-sequence-reconciliation.md) · [PM-80 evidence design](../PM80_OPENCLAW_RUNTIME_EVIDENCE_CAPTURE_DESIGN.md) · [pm-34 packet](../runtime-packets/pm-34-n8n-codex-worker-integration-gate.md)

---

## Scope of this task

| Action | This task |
|--------|-----------|
| Define future **strict_pass** artifact contract | **Yes** |
| Enable real worker | **No** |
| Run OpenClaw / Codex | **No** |
| Touch n8n UI or workflow **40** / **41** | **No** |
| Set `n8n_ready=true` or `strict_pass_candidate=true` in committed runtime evidence | **No** |

---

## Why this is needed

OpenClaw dual preview sequences ([reconciliation](2026-05-23-control-plane-openclaw-dual-sequence-reconciliation.md)) prove:

- workflow **40** Gate D / PM21 routing (mock-worker, `dry_run_pass`);
- loopback gateway liveness when explicitly probed.

They do **not** prove:

- safe **real-worker** execution;
- sanitized, validator-ready output for n8n consumption;
- absence of forbidden path touches or secret leakage.

PM-34 remains **BLOCKED FOR REAL WORKER** until a **validated strict_pass artifact** exists **and** a separate human activation gate approves use.

---

## Minimum strict_pass artifact fields

Future artifacts (session summary and/or `docs/examples/` fixture — **not** `docs/artifacts/openclaw/**` without explicit storage gate) must include:

| Field | Type / notes |
|-------|----------------|
| `artifact_version` | string, e.g. `strict-pass-v1` |
| `run_id` | unique id per gated run |
| `timestamp_local` | ISO-8601 local or UTC (no secrets) |
| `repo` | `mrhz1973/control-plane` |
| `branch` | must be `main` for PASS |
| `head_sha` | short or full SHA at run start |
| `workspace_clean_before` | boolean |
| `workspace_clean_after` | boolean |
| `gateway_health_before` | object: `{ "http_code", "body_ok", "body_status" }` or `not_applicable` |
| `gateway_health_after` | same |
| `worker_type` | enum: `mock-worker` \| `real-worker-candidate` \| `none` |
| `action_requested` | string, scoped description |
| `action_executed` | string; must match or document delta |
| `files_allowed` | list of path prefixes explicitly in scope |
| `files_changed` | list of paths actually changed (sanitized) |
| `forbidden_paths_touched` | boolean; **must be false** for PASS |
| `codex_invoked` | boolean |
| `openclaw_raw_log_committed` | boolean; **must be false** for PASS |
| `secrets_detected` | boolean; **must be false** for PASS |
| `workflow_40_modified` | boolean; **must be false** for PASS |
| `workflow_41_modified` | boolean; **must be false** for PASS |
| `n8n_import_export_performed` | boolean; **must be false** for PASS |
| `exit_code` | integer or null |
| `strict_pass_candidate` | boolean — see PASS criteria |
| `pm34_unblocked` | boolean |
| `n8n_ready` | boolean |
| `human_gate_required` | boolean — **true** before any real-worker activation |
| `final_decision` | enum: `pass` \| `fail` \| `blocked` |

**Forbidden in artifact body:** tokens, Bearer headers, cookies, OAuth codes, raw stdout/stderr, browser URLs with query tokens, Telegram bot token, PATs, API keys.

---

## PASS criteria (`strict_pass_candidate` may be true only if)

All must hold:

1. `branch` is `main`.
2. `workspace_clean_before` and `workspace_clean_after` are **true**.
3. `forbidden_paths_touched` is **false** (no touch of `workflows/**` prod **40**/**41**, `docs/artifacts/openclaw/**`, `.env`, credentials).
4. `secrets_detected` is **false**.
5. `openclaw_raw_log_committed` is **false**.
6. `workflow_40_modified` and `workflow_41_modified` are **false**.
7. `n8n_import_export_performed` is **false**.
8. `worker_type` and `action_executed` match an **explicitly scoped** gate packet (no scope drift).
9. Output recorded in git is **sanitized** (field table or redacted summary — not raw streams).
10. `exit_code` indicates success for the scoped action (or documented allowed non-zero with `final_decision=blocked`).
11. Artifact is committed as sanitized evidence (typically `docs/sessions/**`).

Setting `strict_pass_candidate=true` does **not** auto-unblock PM-34 or set `n8n_ready=true`.

---

## Mandatory false values (current phase)

Until a **separate** PM-34 real-worker activation gate explicitly overrides (none today):

| Field | Value |
|-------|--------|
| `pm34_unblocked` | **false** |
| `n8n_ready` | **false** |
| `real_worker_enabled` | **false** (implicit; no real worker in this design task) |

Preview/mock evidence (e.g. `89d3729`, `985bbe9`) remains `strict_pass_candidate=false`.

---

## Next gate

After this design is accepted:

| Step | Scope |
|------|--------|
| **Next** | Separate **PM-34 real-worker activation decision packet** or **gated dry-run** with human approval |
| **Not next** | Automatic real-worker execution, workflow **40** edit, or `n8n_ready=true` |

Possible intermediate steps (each own gate): sanitized fixture in `docs/examples/`, validator dry-run against contract — **not** part of this commit.

---

## This document is a contract, not an authorization.

No runtime was executed to produce this file. PM-34 real worker, OpenClaw gateway, Codex, n8n mutation, and workflow **40**/**41** edits remain **out of scope** until future explicit gates.
