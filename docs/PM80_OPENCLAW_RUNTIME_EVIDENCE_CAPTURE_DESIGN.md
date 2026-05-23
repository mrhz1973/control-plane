# PM-80 — OpenClaw runtime evidence capture design

**Status:** **DESIGN / DOCS-ONLY**  
**Date:** 2026-05-23  

**No runtime executed** in this task — no gateway, no n8n, no worker, no PM-34.

**Related:** [session](sessions/2026-05-23-control-plane-pm80-openclaw-runtime-evidence-capture-design.md) · [PM-79](PM79_OPENCLAW_CONTROLLED_SECOND_GATEWAY_PROBE.md) · [PM-68 handoff](PM68_OPENCLAW_NEW_CHAT_COMPACT_HANDOFF.md) · [PM-52 bridge design](PM52_OPENCLAW_CONFINED_BRIDGE_DESIGN.md) · [PM-53 validator](PM53_OPENCLAW_BRIDGE_ARTIFACT_VALIDATOR_DRY_RUN.md) · [PM-78 lifecycle](PM78_OPENCLAW_LIFECYCLE_HARDENING_CHECKPOINT.md) · [pm-34](runtime-packets/pm-34-n8n-codex-worker-integration-gate.md)

---

## 1. Purpose

Define **what future OpenClaw runtime evidence must capture** (shape, redaction, classification, validation expectations, storage rules) **before** any of:

- n8n consumption  
- PM-34 work  
- workflow **40** / **41** edit  
- worker enablement  
- creation of `docs/artifacts/openclaw/**`  

**PM-80 is not PM-34** and **does not unblock PM-34**. It stops governance expansion for its own sake and replaces ad-hoc probe notes with a reusable **evidence contract**.

---

## 2. Why PM-80 exists after PM-79

| Fact | Implication |
|------|-------------|
| **PM-79 PASS** | Second controlled loopback probe: gateway ready, `/health` 200, status reachable, gateway stopped, repo clean |
| **PM-79 did not** | Produce a **strict_pass** integration artifact, bridge JSON, or lifecycle-promoted artifact |
| **PM-51 + PM-79** | Prove **liveness** only — not integration readiness |
| **Next value** | Define evidence requirements — **not** more blind gateway probes |

---

## 3. Evidence capture contract

Future OpenClaw runtime sessions (operator casa, explicit gate only) must emit a **single evidence record** (JSON or YAML) plus an optional **human session doc** in `docs/sessions/**`. The record is the contract; session docs summarize without replacing the record.

### 3.1 Required fields

| Field | Type / constraint | Description |
|-------|-------------------|-------------|
| `packet_id` | string | Stable id, e.g. `pm-XX-openclaw-runtime-evidence` |
| `task_id` | string | Orchestrator task id (e.g. `PM-81`) |
| `run_started_at` | ISO-8601 UTC | Probe/run start |
| `run_finished_at` | ISO-8601 UTC | Probe/run end (gateway stopped) |
| `machine_scope` | enum | `casa` \| `lavoro` \| `ci` — **no** hostnames with secrets |
| `operator_scope` | enum | `manual_user` \| `agent_docs_only` |
| `openclaw_version` | string | e.g. `2026.5.20 (e510042)` |
| `profile` | string | e.g. `control-plane` |
| `gateway_binding` | string | Loopback only, e.g. `127.0.0.1:18789` — **no** auth query params |
| `health_status` | object | `{ "http_code": 200, "body_ok": true, "body_status": "live" }` — **no** full secrets in body |
| `tailscale_exposure` | boolean | Must be `false` for confined probes |
| `sessions_count` | integer | Active sessions at probe time |
| `channels_configured` | boolean or count | `false` / `0` for no-op probes |
| `requested_action` | string | e.g. `gateway_noop_health_probe` |
| `actual_action` | string | What actually ran (must match or explain delta) |
| `raw_output_redaction_status` | enum | `not_captured` \| `redacted` \| `forbidden_leak_detected` |
| `normalized_summary` | string | Short operator-safe summary (≤ 2 KB) |
| `strict_pass_candidate` | boolean | `true` only if record meets strict contract **and** validators pass |
| `n8n_ready` | boolean | **Must be `false`** until a future explicit integration gate |
| `pm34_unblocked` | boolean | **Must be `false`** until PM-34 gate + prerequisites |
| `forbidden_leak_check` | object | `{ "passed": true, "findings": [] }` — scanner result |
| `storage_target` | enum | See §6 — default `none` |
| `next_gate` | string | Allowlisted successor only (see §9) |

### 3.2 Optional fields (recommended)

| Field | Use |
|-------|-----|
| `classification` | One of §7 values |
| `bridge_artifact_ref` | Path/id only after PM-53+ validation — **not** raw output |
| `lifecycle_state` | Align with PM-60 metadata when promoting artifacts |
| `git_head_at_probe` | Short SHA only |
| `gateway_pid_stopped` | Integer PID **after** stop (operational, not secret) |
| `browser_binding` | Loopback port only (e.g. `127.0.0.1:18791`) — no tokens |

### 3.3 Validation expectations (future)

Before any artifact is considered for bridge promotion or PM-34 discussion:

1. **Schema** — all required fields present; types match.  
2. **PM-53** — if output maps to bridge artifact shape, run `validate-openclaw-bridge-artifact.mjs` (dry-run).  
3. **PM-60** — if lifecycle metadata attached, run `validate-openclaw-lifecycle-metadata.mjs`.  
4. **Secret scan** — `forbidden_leak_check.passed` must be `true`.  
5. **`n8n_ready` / `pm34_unblocked`** — hard-fail if `true` without documented future gate override (none today).  
6. **`strict_pass_candidate`** — `true` only when classification is `strict_pass_candidate` **and** validators PASS; otherwise `false`.

PM-80 does **not** implement validators — it defines the contract they must enforce.

---

## 4. Redaction rules

Future evidence **must never** include:

| Category | Examples (forbidden in git) |
|----------|----------------------------|
| Auth tokens | Gateway token, Bearer values, `Authorization` headers |
| Cookies / session secrets | Browser session ids, OAuth refresh/access tokens |
| Provider secrets | OpenAI / OpenClaw / Codex session material |
| Telegram secrets | Bot token, chat id beyond approved non-secret refs |
| Raw browser material | Screenshots, local storage dumps, devtools HAR with auth |
| Unredacted streams | Raw stdout/stderr unless passed through redaction classifier |

**Allowed in git:**

- HTTP status codes and **non-secret** JSON bodies (e.g. `{"ok":true,"status":"live"}`)  
- Loopback host:port, version strings, PID after stop  
- Phrases like `auth=token` **without** the token value  
- Classification and boolean flags  

**Default for probes like PM-51/PM-79:** `raw_output_redaction_status: not_captured` — do not paste console logs into repo.

---

## 5. Storage policy

| Rule | State |
|------|--------|
| **Now** | **No** `docs/artifacts/openclaw/**` — directory **must not** be created by PM-80 |
| **Session docs** | `docs/sessions/YYYY-MM-DD-control-plane-pmXX-*.md` — summary only, contract-aligned |
| **Future repo artifacts** | Require **separate explicit gate** (e.g. PM-8x storage gate) before any path under `docs/artifacts/openclaw/**` |
| **storage_target values** | `none` (default) · `session_doc_only` · `examples_fixture` (docs-only sample, no secrets) · `artifacts_openclaw_gated` (future, gated) |

PM-80 defines **target shape** only; it does **not** create storage directories or commit runtime dumps.

---

## 6. Classification rules

Future `classification` (or derived from validators):

| Value | Meaning |
|-------|---------|
| `strict_pass_candidate` | Meets evidence contract + validators; candidate for bridge promotion review — **still not** n8n/PM-34 ready alone |
| `recoverable_partial` | Useful operator signal but **not** integration-safe (Codex PM-39 pattern) |
| `fail` | Probe or validation failed |
| `unsafe_raw_output` | Secret scan failed or forbidden content detected — **do not** commit raw |
| `out_of_scope` | Action outside confined bridge (LAN, deploy, workflow edit) |
| `no_runtime_executed` | Design/docs-only task (e.g. PM-80) |

**PM-79 mapping:** `classification: recoverable_partial` for integration purposes (liveness PASS, not strict_pass artifact). Session registration used `PASS` for the **probe gate**, not for PM-34.

---

## 7. n8n and PM-34 boundary

| Rule | State after PM-80 |
|------|-------------------|
| `n8n_ready` | **`false`** |
| `pm34_unblocked` | **`false`** — PM-34 **BLOCKED** |
| Raw OpenClaw → n8n | **Never** |
| Workflow **40** | **ACTIVE** — **do not edit** |
| Workflow **41** | **BACKUP OFF** — **do not edit** |
| PM-34 future entry | Validated **strict_pass** artifact + **separate** PM-34 runtime gate + all pm-34 preconditions |

OpenClaw runtime evidence supports **future** bridge design (PM-52→55→60); it does **not** substitute PM-37-style Codex harness or PM-34 approval.

---

## 8. Future allowed next steps

| PM | Scope |
|----|--------|
| **PM-81** | Local fixture / sample evidence document — **docs-only**, fictional values, no real secrets |
| **PM-82** | Validator design or dry-run extension — docs/tools only if **separately scoped** |
| **Future runtime probe** | Explicit casa gate only; evidence record per §3; gateway stopped after probe |
| **PM-68 handoff update** | Pointer to PM-80 design — docs-only |

**Suggested `next_gate` allowlist** (evidence records): `pm-81-sample-evidence-fixture` · `pm-82-evidence-validator-dry-run` · `stop` — **not** `pm-34` without full gate chain.

---

## 9. Future forbidden next steps

- PM-34 runtime execution  
- n8n consumption of OpenClaw output (raw or unvalidated)  
- Workflow **40** / **41** edit  
- Worker enablement  
- OpenClaw gateway start **without** explicit operator casa gate  
- `docs/artifacts/openclaw/**` creation **without** explicit storage gate  
- deploy / tag / rollback  
- `n8n_ready: true` or `pm34_unblocked: true` in committed evidence  

---

## 10. Decision

| Item | Result |
|------|--------|
| **PM-80** | **DESIGN complete** (docs-only) |
| **Runtime posture** | **Unchanged** |
| **PM-34** | **Still blocked** |
| **n8n** | **Not ready** (`n8n_ready` remains **false**) |
| **Artifacts dir** | **Not created** |

---

## 11. Reference: PM-79 vs future evidence

PM-79 demonstrated fields that **should** appear in future records (already observed, not re-run):

- `gateway_binding`: `127.0.0.1:18789`  
- `health_status`: HTTP 200, live body  
- `tailscale_exposure`: false  
- `sessions_count`: 0  
- `channels_configured`: false  
- Gateway stopped; repo clean  

PM-79 did **not** emit a §3 evidence JSON file — PM-80 requires that for **future** probes beyond registration-style session docs.
