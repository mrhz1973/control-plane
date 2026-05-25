# Codex bridge wrapper design v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/codex-bridge-wrapper-design-v1.md`  
**Version:** `codex-bridge-wrapper-v1`  
**Date:** 2026-05-25  
**Status:** **DESIGN ONLY** — no runtime implementation · no Codex execution · no n8n invocation · no workflow 40/41 mutation · no PM-34 unlock

**Related:** [Bridge contract v1](codex-bridge-contract-v1.md) · [Classifier wrapper](classifier-wrapper-v1.md) · [Bridge discovery](openclaw-codex-bridge-discovery-v1.md) · [Smoke V2 PASS](../sessions/2026-05-25-control-plane-codex-bridge-manual-smoke-v2-pass.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

**PROJECT_VISION.md:** read for alignment; **not modified** by this design.

---

## 1. Scope

This document defines the **local bridge wrapper boundary** only — the future executable layer that sits between an operator/automation request and Codex CLI reasoning.

**In scope (design):**

- Bridge input JSON validation
- Deterministic preflight / guard layer
- Prompt assembly from sanitized, inlined content
- Future Codex invocation per [codex-bridge-contract-v1](codex-bridge-contract-v1.md) §7 properties
- Output schema enforcement
- Deterministic post-processing
- Fail-closed output emission

**Out of scope (explicit):**

| Item | Status |
|------|--------|
| n8n integration | **Not** in this design |
| Workflow 40 / 41 edits | **Forbidden** |
| PM-34 real worker | **Not** unlocked |
| Cursor worker automation | **Forbidden** |
| OpenClaw `agent main` | **Forbidden** |
| Provider API keys | **Forbidden** |
| Deploy / tag / rollback | **Forbidden** |
| Codex repo mutation | **Forbidden** |
| Runtime execution in this task | **None** |

---

## 2. Architecture flow

```text
manual / operator request
  → bridge input JSON
  → validate input shape + wrapper-specific rules
  → apply pre-gates (§5)
  → if blocked / needs_human → emit bridge output JSON without Codex
  → if allowed (future runtime gate only):
      assemble sanitized inlined prompt (§6)
      invoke Codex using §7 properties (reference bridge contract §7)
      parse schema-enforced JSON output
      apply post-gates (§8)
  → emit final bridge output JSON (§9)
  → no repo / n8n / runtime mutation
```

The wrapper is a **reasoning boundary**, not an implementer. Git writes, n8n calls, and Cursor worker invocation happen only in **separate future gates** after human approval.

---

## 3. Inputs

Base input shape: [codex-bridge-contract-v1](codex-bridge-contract-v1.md) §3 (all required fields).

Wrapper-specific validation requirements:

| Rule | Requirement |
|------|-------------|
| `context_refs` | Repo-relative paths only; must exist under allowed prefixes |
| Secrets | **None** in any string field — no tokens, OAuth URLs, API keys, auth URLs |
| `task_type` | Explicit enum-like value (e.g. `docs_only`, `design`, `runtime_gate`) |
| `runtime_policy` | Must remain restrictive per bridge contract §3.1 — any `true` on forbidden flags → reject |
| `human_gate_state` | Explicit: `none` \| `pending` \| `approved` \| `rejected` |
| `allowed_paths` / `forbidden_paths` | Non-empty where applicable; wrapper validates no overlap with forbidden prefixes (`.env`, `workflow`, `secrets`, `src/` unless explicitly allowed) |
| `repo` | Must match expected repo (`mrhz1973/control-plane`) |
| `branch` | Must be `main` for v1 wrapper |
| `risk_classification` | Required; if absent treat as high risk / human gate |

---

## 4. Preflight guards

Evaluate before any future Codex call. On match → emit bridge output JSON **without** Codex (see bridge contract §5 for base rules).

| Check | On fail → |
|-------|-----------|
| Repo ≠ expected | `blocked` |
| Branch ≠ `main` | `needs_human` |
| Workspace dirty (if wrapper inspects repo) | `needs_human` |
| Task requests n8n runtime | `blocked` |
| Task requests wf 40 / 41 mutation | `needs_human` |
| Task requests provider API key | `blocked` |
| Task requests OpenClaw `agent main` | `blocked` |
| Task requests PM-34 unlock | `blocked` |
| Task requests deploy / tag / rollback | `needs_human` |
| Task requests `codex resume` | `blocked` |
| Task requests Codex repo mutation | `blocked` |
| Input contains secrets / auth URLs | `blocked` |
| `risk_classification.risk` = `high` | `needs_human` |
| `risk_classification.requires_human` = `true` | `needs_human` |
| `human_gate_state` = `pending` or `rejected` | `needs_human` |
| Any validation uncertainty | `needs_human` (fail closed) |

Guard output must cite rule id in `risk_notes` (e.g. `wrapper:preflight:n8n_blocked`).

---

## 5. Prompt assembly

Future runtime prompt assembly rules (not executed in this design):

| Rule | Requirement |
|------|-------------|
| Content source | Inline only approved, sanitized docs from `context_refs` |
| File discovery | **Forbidden** — Codex must not read/discover repo files |
| Prompt persistence | Do not persist full prompt if secrets might be present |
| Anti-tool-use | Explicit instruction: no shell, no tool calls, no file reads, no git, no network |
| Output format | Strict JSON-only, single-turn, schema-enforced |
| Blocked actions | Include list from bridge contract policy (API key, agent main, n8n, PM-34, deploy, resume, repo mutation) |
| Confirmation | Require `no_runtime_confirmation: true` in expected output |
| Trace | Include `request_id` and source doc list in prompt header |
| Workdir | Temp directory **outside** target repo |

Manual smoke V2 validated this pattern; observed CLI snapshot in [smoke V2 session](../sessions/2026-05-25-control-plane-codex-bridge-manual-smoke-v2-pass.md) — non-normative.

---

## 6. Codex invocation properties

Any future runtime invocation **must** satisfy [codex-bridge-contract-v1](codex-bridge-contract-v1.md) §7.1 properties:

| Property | Requirement |
|----------|-------------|
| Command family | Non-interactive |
| Auth | ChatGPT OAuth only — no provider API key |
| Workspace | Temp dir outside repo |
| Context | Inlined in prompt body |
| Output | Single-turn JSON, schema-enforced |
| Persistence | Ephemeral — no resume id |
| Sandbox | Read-only |
| Approval | Do **not** rely on approval inside `codex exec` — safety via sandbox + pre/post gates |
| Mutation | No repo / n8n / runtime mutation |

Exact CLI flags are version-specific; see smoke V2 session (Codex CLI v0.133.0 snapshot). Wrapper implementation must map to §7 properties, not hard-code flags as permanent law.

---

## 7. Post-processing guards

After any future Codex call, evaluate before emitting final output (extends bridge contract §6):

| Condition | Forced `status` |
|-----------|-----------------|
| Response not parseable as JSON | `needs_human` |
| Missing required output keys | `needs_human` |
| `status` not in allowed enum | `needs_human` |
| Proposes provider API key | `blocked` |
| Proposes OpenClaw `agent main` | `blocked` |
| Proposes n8n / wf 40 / 41 edit | `blocked` |
| Proposes PM-34 unlock | `blocked` |
| Proposes deploy / tag / rollback | `needs_human` |
| Proposes Codex repo mutation | `blocked` |
| Proposes Cursor worker / auto commit-push | `blocked` |
| Risk/output mismatch (high risk + `human_gate_required: false`) | `needs_human` |
| Missing or false `no_runtime_confirmation` | `needs_human` or `failed` |
| Any malformed or ambiguous output | `needs_human` |

---

## 8. Output

Base output shape: [codex-bridge-contract-v1](codex-bridge-contract-v1.md) §4.

Wrapper-specific requirements:

| Field | Wrapper note |
|-------|--------------|
| `request_id` | Must echo input |
| `status` | One of `proposed` \| `blocked` \| `needs_human` \| `failed` |
| `summary` | Sanitized, no secrets |
| `recommended_next_step` | Actionable for human or next gate |
| `proposed_prompt_for_cursor` | `null` unless low-risk docs-only and post-gates pass |
| `human_gate_required` | `true` unless explicitly safe per guards |
| `no_runtime_confirmation` | **Must be `true`** — confirms wrapper did not mutate repo/n8n/runtime |
| `risk_notes` | Include wrapper guard ids and blocked actions summary |
| `touched_paths_expected` | Future implementer paths only — not mutated by wrapper |

Optional wrapper trace field (future implementation): `wrapper_trace` object with `preflight_passed`, `codex_invoked: false|true`, `post_gate_result` — metadata only, no secrets.

---

## 9. Failure behavior

Fail closed on any ambiguity:

| Rule | Behavior |
|------|----------|
| Partial automation | **Forbidden** — no silent continuation |
| n8n call on failure | **Forbidden** |
| Repo mutation on failure | **Forbidden** |
| Runtime escalation | **Forbidden** |
| Output on failure | Emit `blocked` / `needs_human` / `failed` with sanitized `summary` |
| Logging (future) | Sanitized metadata only — no full prompts with secrets |

Operator fallback: manual path via GitHub SoT (PROJECT_VISION §7.6).

---

## 10. Acceptance criteria

- [x] Wrapper design document created
- [x] No runtime implementation
- [x] No Codex execution
- [x] No n8n invocation
- [x] No workflow 40/41 mutation
- [x] No PM-34 unlock
- [x] No provider API key
- [x] No OpenClaw agent main
- [x] No secrets in document
- [x] Next gate named: wrapper runtime dry-run (explicit gate required)

---

## 11. Next gate

**Bridge wrapper runtime dry-run preflight / design packet** — requires a **separate explicit human gate** before any executable wrapper code.

**Not authorized until dry-run PASS:**

- n8n integration
- Workflow 40 / 41 mutation
- PM-34 unlock
- Provider API key configuration
- OpenClaw `agent main` retry
- Cursor worker automation
- Codex repo mutation
- Auto commit-push loop
