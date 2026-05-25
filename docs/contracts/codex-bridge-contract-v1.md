# Codex bridge — contract v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/codex-bridge-contract-v1.md`  
**Version:** `codex-bridge-v1`  
**Date:** 2026-05-25  
**Status:** **DESIGN ONLY** — no runtime implementation in this document

**Related:** [Bridge discovery](openclaw-codex-bridge-discovery-v1.md) · [Classifier wrapper](classifier-wrapper-v1.md) · [Step A blocked](../sessions/2026-05-25-control-plane-openclaw-agent-step-a-provider-api-key-blocked.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

**PROJECT_VISION.md:** aligned via discovery; **not modified** by this contract.

---

## 0. Scope statements (mandatory)

| Statement | Value |
|-----------|--------|
| This document | **Contract only** — no bridge executable, no Codex invocation here |
| Auth path | **Codex CLI + ChatGPT Plus OAuth** on Ryzen — **no** OpenAI provider API key |
| OpenClaw `agent main` | **Forbidden** as orchestration path |
| OpenClaw gateway | **Optional** loopback transport/UI only (already PASS separately) |
| n8n workflow 40 / 41 | **Not** modified; **no** n8n runtime in v1 |
| PM-34 real worker | **Not** unlocked |
| Cursor worker / auto commit-push | **Not** in v1 |

---

## 1. Purpose

The Codex bridge is the **controlled local boundary** between a control-plane request (event + classifier risk) and **Codex CLI** on Ryzen for **tactical reasoning** — proposing the next step and an optional Cursor prompt, **without** executing code or mutating Git.

The bridge must:

1. Accept a **validated bridge input** (JSON) including prior **risk classification** from [classifier-wrapper-v1](classifier-wrapper-v1.md).
2. Apply **deterministic guards** before and after any future Codex call.
3. Emit **bridge output** (JSON) with `status`, human-gate flags, and sanitized proposals.
4. **Never** store provider API keys, tokens, or raw secret-bearing prompts in Git.
5. **Degrade** to `needs_human` on ambiguity (fallback graceful per PROJECT_VISION §7.6).

---

## 2. Component roles

| Component | Role in v1 | Notes |
|-----------|------------|-------|
| **Codex CLI / OAuth** | Tactical reasoning / next-step proposal | ChatGPT Plus OAuth only; no provider API key |
| **Ollama classifier wrapper** | Pre-gate: `risk`, `route`, `requires_human` | Input field `risk_classification`; see classifier contract |
| **Cursor Agent CLI** | Future implementer | **After** separate gates; not invoked by bridge v1 |
| **OpenClaw gateway** | Optional local transport/UI | Loopback PASS; **not** model provider; **no** `agent main` |
| **n8n** | Future orchestrator | **Out of scope** until manual Codex smoke PASS |

---

## 3. Bridge input JSON (minimum)

All top-level fields are **required** unless marked optional. No secrets in any string field.

| Field | Type | Description |
|-------|------|-------------|
| `request_id` | string | Opaque id for trace/dedup (no PII) |
| `source` | string | e.g. `manual`, `github_poll`, `telegram_gate` — v1 manual only |
| `repo` | string | e.g. `mrhz1973/control-plane` |
| `branch` | string | e.g. `main` |
| `workspace_path` | string | Local path label only — **not** required to be absolute in git docs |
| `task_type` | string | e.g. `docs_only`, `design`, `runtime_gate`, `incident` |
| `objective` | string | One-paragraph goal (sanitized) |
| `context_refs` | string[] | Repo-relative doc paths Codex may read (e.g. `docs/foundation/PROJECT_VISION.md`) |
| `allowed_paths` | string[] | Path prefixes implementer may touch in **future** gates |
| `forbidden_paths` | string[] | Always deny (e.g. `.env`, `workflow`, `secrets`) |
| `runtime_policy` | object | See §3.1 |
| `risk_classification` | object | Output-shaped object from classifier wrapper (§3.2) |
| `human_gate_state` | string | `none` \| `pending` \| `approved` \| `rejected` |

### 3.1 `runtime_policy` (minimum keys)

```json
{
  "codex_mode": "read_only",
  "allow_codex_exec": false,
  "allow_openclaw_agent": false,
  "allow_provider_api_key": false,
  "allow_n8n_invoke": false,
  "allow_cursor_worker": false,
  "allow_auto_commit_push": false
}
```

v1 fixed values: all `false` except `codex_mode: read_only`.

### 3.2 `risk_classification` (from classifier)

Minimum keys (mirror classifier output):

```json
{
  "risk": "low",
  "route": "auto_allowed",
  "reason": "string",
  "confidence": "high",
  "requires_human": false
}
```

If classifier not run, set `risk: high`, `route: human_gate`, `requires_human: true`, `reason: classifier_not_run`.

---

## 4. Bridge output JSON (minimum)

| Field | Type | Allowed values |
|-------|------|----------------|
| `request_id` | string | Must match input |
| `status` | string | `proposed` \| `blocked` \| `needs_human` \| `failed` |
| `summary` | string | Short outcome (no secrets) |
| `recommended_next_step` | string | Actionable next step for human or future automation |
| `proposed_prompt_for_cursor` | string \| null | Sanitized prompt draft; `null` if not applicable |
| `touched_paths_expected` | string[] | Paths Codex/Cursor might touch in **future** gates only |
| `risk_notes` | string | Tie-back to classifier + bridge guards |
| `human_gate_required` | boolean | `true` if human must decide before proceed |
| `no_runtime_confirmation` | boolean | **Must be `true`** in v1 — confirms no repo/n8n/runtime mutation occurred |

---

## 5. Deterministic rules (before Codex — mandatory)

Evaluate in order. If matched, emit output **without** calling Codex (still valid bridge JSON).

| Condition | Forced `status` | `human_gate_required` |
|-----------|-----------------|----------------------|
| `risk_classification.risk` = `high` | `needs_human` | `true` |
| `risk_classification.requires_human` = `true` | `needs_human` | `true` |
| `risk_classification.route` = `human_gate` or `blocked` | `needs_human` or `blocked` | `true` |
| `human_gate_state` = `pending` or `rejected` | `needs_human` | `true` |
| `runtime_policy` violates v1 (e.g. `allow_codex_exec: true`) | `blocked` | `true` |
| Input mentions secrets / API key / auth / billing setup | `blocked` | `true` |
| `task_type` or paths imply n8n workflow **40** or **41** mutation | `needs_human` | `true` |
| Deploy / tag / rollback in objective or flags | `needs_human` | `true` |
| `source` = `n8n` or `runtime_policy.allow_n8n_invoke` = true | `blocked` | `true` — n8n before manual smoke |

Guard `summary` / `risk_notes` must cite rule id (e.g. `guard:risk_high`).

Only if no guard fires → future implementation may invoke Codex CLI read-only with sanitized prompt derived from input.

---

## 6. Deterministic rules (after Codex — when implemented)

If Codex is invoked in a later gate, post-process model text to JSON:

| Condition | Forced `status` |
|-----------|-----------------|
| Response not parseable as bridge output JSON | `needs_human` |
| Missing required output keys | `needs_human` |
| `status` not in allowed enum | `needs_human` |
| Proposes **provider API key** or OpenAI billing setup | `blocked` |
| Proposes **OpenClaw `agent main`** as orchestration path | `blocked` |
| Proposes **n8n runtime** / wf 40–41 edit | `blocked` |
| Proposes unauthorized `codex exec` (repo mutation, implementation, or outside §7 profile) | `blocked` |
| Proposes Cursor worker or auto commit-push | `blocked` |
| Contradicts `risk_classification` (e.g. auto on high risk) | `needs_human` |
| Codex timeout / OAuth error | `failed` → treat as `needs_human` for operators |

**Mismatch rule:** classifier high risk + Codex `proposed` with `human_gate_required: false` → override to `needs_human`.

---

## 7. Codex invocation profile (V2-proven — read-only reasoning only)

Manual smoke V2 **PASS** ([session](../sessions/2026-05-25-control-plane-codex-bridge-manual-smoke-v2-pass.md)) proves a safe bridge invocation shape. This section defines the **stable properties** any future runtime wrapper MUST satisfy. It does **not** hard-code Codex CLI flags as normative contract — exact flags for Codex CLI v0.133.0 are an **observed V2 implementation snapshot** in that session only.

### 7.1 Required properties

| Property | Requirement |
|----------|-------------|
| Command family | Non-interactive Codex execution (single turn; no TUI drift) |
| Auth | ChatGPT OAuth only — **no** provider API key (`OPENAI_API_KEY` forbidden) |
| Workspace | Temporary workspace **outside** the target repo |
| Context | Required files/content **inlined** into the prompt body — Codex must not discover/read repo files |
| Prompt constraints | Explicit anti-tool-use: no shell, no tool calls, no file reads, no git, no network |
| Output | JSON-only, single-turn, schema-enforced final message |
| Persistence | Ephemeral session — **no** resume id recorded or reused |
| Sandbox | Read-only — model-generated commands cannot mutate disk |
| Approval behavior | Non-interactive `codex exec` does **not** solicit approvals — wrapper safety MUST rely on read-only sandbox plus §5 pre-gates and §6 post-gates, not on a second approval layer inside `codex exec` |
| Repo mutation | **Forbidden** |
| Runtime mutation | **Forbidden** |
| n8n / workflow mutation | **Forbidden** (wf 40 / 41 untouched) |
| OpenClaw `agent main` | **Forbidden** |
| Cursor worker / auto commit-push | **Forbidden** |
| PM-34 unlock | **Forbidden** |
| Logging | No full prompt persist if secrets detected |

### 7.2 What this profile authorizes

- Read-only bridge **reasoning** only: tactical next-step proposal as JSON per §4.
- Manual operator invocation under the properties above.

### 7.3 What this profile does NOT authorize

| Action | Status |
|--------|--------|
| Codex repo mutation / `codex exec` for implementation | **Not authorized** |
| n8n integration or wf 40 / 41 edit | **Not authorized** |
| PM-34 real worker | **Not authorized** |
| Cursor worker automation | **Not authorized** |
| OpenClaw `agent main` retry | **Not authorized** |
| Provider API key configuration | **Not authorized** |
| `codex resume` of interrupted sessions | **Not authorized** |

### 7.4 V1 vs V2 distinction

V1 was **PARTIAL-BLOCKED** ([session](../sessions/2026-05-25-control-plane-codex-bridge-manual-smoke-v1-partial-blocked.md)) due to agentic tool-use / form shape — **not** repo damage or security failure. V2 confirms inlined context + anti-tool-use prompt + non-interactive schema-enforced JSON satisfies this profile.

### 7.5 Implementation snapshot (non-normative)

Observed V2 implementation for Codex CLI v0.133.0: `codex exec` with read-only sandbox, ephemeral session, schema output, temp workdir — see [smoke V2 session](../sessions/2026-05-25-control-plane-codex-bridge-manual-smoke-v2-pass.md). Future Codex versions may differ in flags while preserving §7.1 properties.

---

## 8. Manual smoke test definition (V1/V2 — registered)

**Gate name:** `codex-bridge-manual-readonly-smoke`
**Host:** Ryzen or operator workstation with Codex CLI + ChatGPT OAuth
**Prerequisites:** Codex CLI auth OK; classifier API PASS; this contract committed.

| Check | Criterion |
|-------|-----------|
| Input | One **low-risk** bridge input (docs-only objective, see §9.1) |
| Classifier | Run classifier wrapper manually or use canned low `risk_classification` |
| Codex | Single invocation per §7 properties — read-only, non-interactive, JSON-only |
| OpenClaw | **No** `agent main` retry; gateway optional health-only |
| Files | **Zero** modifications in `control-plane` workspace |
| n8n | **Not** touched |
| Output | Parseable bridge output JSON with `no_runtime_confirmation: true` |
| Git | `git status --short` empty after test |

**Results registered:**

| Version | Outcome | Session |
|---------|---------|---------|
| V1 | PARTIAL-BLOCKED / NON PASS — agentic tool-use | [smoke V1](../sessions/2026-05-25-control-plane-codex-bridge-manual-smoke-v1-partial-blocked.md) |
| V2 | **PASS** — single-turn JSON, §7 properties | [smoke V2](../sessions/2026-05-25-control-plane-codex-bridge-manual-smoke-v2-pass.md) |

**Fail closed:** any file change, unauthorized exec, or API key prompt → register FAIL session, do not wire n8n.

**Smoke status:** V2 **PASS** complete. V1 remains **PARTIAL-BLOCKED** — do **not** resume interrupted V1 session.

**Next gate:** Bridge wrapper design / local wrapper design (docs-only) — JSON in → §7 invocation → bridge output JSON out. Any future runtime wrapper test requires a **separate explicit gate**. No n8n wiring. No wf 40 / 41 edits. No PM-34 unlock.

---

## 9. Acceptance examples

### 9.1 Input — low (docs-only)

```json
{
  "request_id": "req-20260525-low-001",
  "source": "manual",
  "repo": "mrhz1973/control-plane",
  "branch": "main",
  "workspace_path": "control-plane",
  "task_type": "docs_only",
  "objective": "Draft session note for foundation status alignment",
  "context_refs": ["docs/foundation/FOUNDATION_STATUS.md"],
  "allowed_paths": ["docs/"],
  "forbidden_paths": [".env", "workflow", "src/"],
  "runtime_policy": {
    "codex_mode": "read_only",
    "allow_codex_exec": false,
    "allow_openclaw_agent": false,
    "allow_provider_api_key": false,
    "allow_n8n_invoke": false,
    "allow_cursor_worker": false,
    "allow_auto_commit_push": false
  },
  "risk_classification": {
    "risk": "low",
    "route": "auto_allowed",
    "reason": "docs-only",
    "confidence": "high",
    "requires_human": false
  },
  "human_gate_state": "none"
}
```

**Expected output (after future Codex call or dry-run stub):**

```json
{
  "request_id": "req-20260525-low-001",
  "status": "proposed",
  "summary": "Docs-only session draft recommended",
  "recommended_next_step": "Operator commits session file via Cursor CONTROL PLANE",
  "proposed_prompt_for_cursor": "Create docs-only session under docs/sessions/...",
  "touched_paths_expected": ["docs/sessions/"],
  "risk_notes": "low risk; classifier auto_allowed",
  "human_gate_required": false,
  "no_runtime_confirmation": true
}
```

*v1 policy note:* `human_gate_required: false` on low docs does **not** authorize unattended commit — operator gate still required for Git writes.

### 9.2 Input — medium (manual n8n-adjacent)

`risk_classification.risk`: `medium`, `requires_human`: `true`.

**Expected output (guard may skip Codex):**

```json
{
  "request_id": "req-20260525-med-001",
  "status": "needs_human",
  "summary": "Medium risk — human gate before any n8n-adjacent work",
  "recommended_next_step": "Telegram Decision Packet or manual review",
  "proposed_prompt_for_cursor": null,
  "touched_paths_expected": [],
  "risk_notes": "guard:risk_medium",
  "human_gate_required": true,
  "no_runtime_confirmation": true
}
```

### 9.3 Input — high (deploy)

`risk_classification.risk`: `high` OR objective mentions deploy.

**Expected output:**

```json
{
  "request_id": "req-20260525-high-001",
  "status": "needs_human",
  "summary": "High risk — blocked from auto proposal",
  "recommended_next_step": "Explicit human approval via Decision Packet",
  "proposed_prompt_for_cursor": null,
  "touched_paths_expected": [],
  "risk_notes": "guard:risk_high",
  "human_gate_required": true,
  "no_runtime_confirmation": true
}
```

### 9.4 Blocked — provider API key proposal

If Codex output (future) contains "add OPENAI_API_KEY" or "openclaw agent main with openai/gpt-5.5":

```json
{
  "request_id": "req-20260525-block-001",
  "status": "blocked",
  "summary": "Proposal violates no-provider-API-key policy",
  "recommended_next_step": "Use Codex OAuth path only; do not configure provider API key",
  "proposed_prompt_for_cursor": null,
  "touched_paths_expected": [],
  "risk_notes": "post:blocked_provider_api_key",
  "human_gate_required": true,
  "no_runtime_confirmation": true
}
```

---

## 10. Security

| Rule | Requirement |
|------|-------------|
| Provider API keys | **Forbidden** in bridge design and outputs |
| Git content | No tokens, auth URLs, challenge URLs, emails, API keys |
| Prompt logging | Do not commit raw prompts; redact if secrets detected |
| OpenClaw agent | **Do not** route through `agent main` |
| Fallback | Any failure → `needs_human` or `failed` + manual path (GitHub SoT) |

---

## 11. Acceptance criteria (contract closure)

- [x] Purpose and roles defined  
- [x] Input / output JSON schemas defined  
- [x] Pre- and post-Codex deterministic rules defined  
- [x] Manual smoke test **specified** and **V2 PASS registered**
- [x] Examples: low, medium, high, blocked (API key)
- [x] Invocation profile §7 formalized from V2-proven properties
- [x] Explicit: **design only**, no runtime, no PM-34 unlock  

---

## 12. Next gate

**Local bridge wrapper design (docs-only)** — define a minimal wrapper contract (JSON in → §7 invocation → bridge output JSON out) before any n8n runtime integration. Register in `docs/sessions/`; update FOUNDATION_STATUS only.

**Not authorized until wrapper design + separate runtime gate:** n8n integration, PM-34, OpenClaw agent retry, provider API key, Cursor worker, auto loop, Codex repo mutation.
