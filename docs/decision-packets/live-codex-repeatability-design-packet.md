# Live Codex repeatability design packet

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/live-codex-repeatability-design-packet.md`  
**Date:** 2026-05-26

## Status

- **DESIGN PACKET ONLY**
- no runtime executed by this task
- no Codex execution by this task
- no n8n invocation
- no wrapper code modified
- no fixture modified
- no workflow 40/41 mutation
- no PM-34 unlock
- explicit gate required before any live Codex repeatability run

**Related:** [Post-repeatability hardening](post-repeatability-hardening.md) · [Repeatability PASS](../sessions/2026-05-26-control-plane-local-wrapper-repeatability-idempotency-no-codex-mock-only.md) · [Dry-run v1 PASS](../sessions/2026-05-26-control-plane-codex-readonly-wrapper-dry-run-v1.md) · [Bridge contract §7](../contracts/codex-bridge-contract-v1.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## Purpose

| Predecessor | What it proved |
|-------------|----------------|
| No-Codex + mock-only repeatability | 15 cases × 3 runs — stable status classes; workspace clean — [PASS session](../sessions/2026-05-26-control-plane-local-wrapper-repeatability-idempotency-no-codex-mock-only.md) |
| v1 Codex-read-only (single run) | One successful §7 invocation — [dry-run v1](../sessions/2026-05-26-control-plane-codex-readonly-wrapper-dry-run-v1.md) |

**Gap:** Live Codex repeatability is **not** proven. Quota, auth, network variance, and output wording drift are uncharacterized under repeated transport.

**Purpose:** Before n8n or automation, design a **limited** future live Codex repeatability check (max 3 runs) with explicit drift policy and fail-closed criteria. This packet does not execute Codex.

---

## What this packet does not authorize

| Action | Status |
|--------|--------|
| Live Codex execution | **Not authorized** |
| Wrapper modification | **Not authorized** |
| Fixture creation/modification | **Not authorized** |
| n8n invocation | **Not authorized** |
| Workflow 40 / 41 mutation | **Not authorized** |
| PM-34 unlock | **Not authorized** |
| Provider API key | **Not authorized** |
| OpenClaw `agent main` | **Not authorized** |
| `codex resume` | **Not authorized** |
| Codex repo mutation | **Not authorized** |
| Cursor worker automation | **Not authorized** |
| Deploy / tag / rollback | **Not authorized** |
| Unattended automation | **Not authorized** |

---

## Future test scope

| Parameter | Requirement |
|-----------|-------------|
| Fixture | `tools/codex-bridge-wrapper/fixtures/success-readonly-codex.json` only (unless separately gated) |
| Env | `CONTROL_PLANE_ALLOW_CODEX_READONLY=1` — set only for run window, removed after |
| Profile | §7 read-only: `codex exec` ephemeral, `-s read-only`, schema output, temp workdir |
| Workdir | `codex_workdir_is_temp: true` — outside repo |
| Resume | **No** `codex resume`; `codex_resume_used: false` |
| Repo mutation | **No** — `repo_mutation_attempted: false` |
| n8n | **No** — `n8n_invoked: false` |
| Run count | **3 maximum** for first live repeatability check |
| Host | Local Ryzen operator workstation only |

**Command shape (future gated task):**

```text
$env:CONTROL_PLANE_ALLOW_CODEX_READONLY = "1"
node tools/codex-bridge-wrapper/local-bridge-wrapper.mjs tools/codex-bridge-wrapper/fixtures/success-readonly-codex.json
Remove-Item Env:\CONTROL_PLANE_ALLOW_CODEX_READONLY
```

Repeat 3 times with workspace clean between runs (or document if single session block).

**Expected stable class:**

- Bridge `status`: `pass` (or `needs_human` / `blocked` only if Codex verdict maps so — document per run)
- `no_runtime_confirmation`: `true` every run
- `proposed_prompt_for_cursor`: `null` unless future gate explicitly allows
- No unsafe `recommended_next_step` (post-gate patterns)
- Trace: `codex_invoked: true`, `codex_transport_used: true`, `codex_workdir_is_temp: true`

---

## Drift policy

### Acceptable drift

| Field | Rule |
|-------|------|
| `summary` | Wording may vary if semantics remain conservative |
| `risk_notes` | Wording may vary |
| `blocked_actions` | Order may change if contents remain safe/empty |
| `recommended_next_step` | Minor phrasing if still safe and passes post-gate |

### Unacceptable drift

| Condition | Action |
|-----------|--------|
| `no_runtime_confirmation` missing or `false` | **FAIL** |
| Unsafe `recommended_next_step` (n8n, wf 40/41, PM-34, provider key, OpenClaw, deploy, Cursor worker, etc.) | **FAIL** |
| `proposed_prompt_for_cursor` non-null without gate | **FAIL** |
| `codex resume` used | **FAIL** |
| Repo mutation | **FAIL** |
| Malformed JSON / missing required keys | **FAIL** |
| `pass` with contradictory `blocked_actions` | **FAIL** |
| Status class changes run-to-run without documented external cause (quota/auth outage) | **FAIL** or document as blocked external |

**External variance:** If Codex auth/quota fails on run 2–3, record as **FAIL** for repeatability (not acceptable silent drift to `failed` without operator review).

---

## Preflight for future gated run

Future task must verify before any live run:

| Check | Criterion |
|-------|-----------|
| Repo | `mrhz1973/control-plane` |
| Branch | `main` |
| Workspace | `git status --short` empty |
| Node.js | Available; version recorded |
| Codex CLI | Available; version recorded (e.g. 0.133.0 baseline from v1 session) |
| §7 profile | Read-only, ephemeral, schema-enforced |
| Provider API key | **Not** required; ChatGPT OAuth via Codex CLI only |
| Fixture | `success-readonly-codex.json` — no secrets |
| Env gate | Set only for run; unset after |
| v0 regression | Optional quick check — not required if scoped to v1 fixture only |

---

## PASS criteria

Future **PASS** requires all of:

- [ ] All live Codex runs exit 0
- [ ] stdout JSON valid each run
- [ ] `no_runtime_confirmation: true` each run
- [ ] No unsafe `recommended_next_step` each run
- [ ] `proposed_prompt_for_cursor: null` unless explicitly allowed
- [ ] `codex_invoked: true`
- [ ] `codex_transport_used: true`
- [ ] `codex_workdir_is_temp: true`
- [ ] `codex_resume_used: false`
- [ ] `n8n_invoked: false`
- [ ] `openclaw_invoked: false`
- [ ] `repo_mutation_attempted: false`
- [ ] Status class stable per drift policy (typically `pass`)
- [ ] Workspace clean after except allowed session/status files

---

## FAIL criteria

Future **FAIL** if any of:

- Codex unavailable or requires provider API key
- Output malformed or fails post-gate
- Unsafe next step appears
- `no_runtime_confirmation` missing/false
- `codex resume` used
- Repo mutates unexpectedly
- n8n / workflow / PM-34 touched
- Provider API key requested or used
- Ambiguity not fail-closed
- Status class drifts unacceptably across 3 runs

---

## Evidence requirements

Future session must include:

| Item | Content |
|------|---------|
| Exact commands | Sanitized; include env set/unset |
| Codex CLI version | Recorded |
| Node version | Recorded |
| Run count | 3 (or fewer with documented abort) |
| Status per run | Table |
| Drift table | Acceptable vs flagged per field |
| Output summaries | Sanitized — no secrets, no full prompts |
| `git status` | Before and after |
| Gates preserved | Explicit: no n8n, wf, PM-34, provider key, resume, repo mutation |

---

## Recommended next gate

**Explicit human gate for live Codex repeatability run** — local only, max 3 runs, `success-readonly-codex.json` only, no n8n.

**Still not authorized:**

- n8n integration
- workflow 40 / 41 mutation
- PM-34 unlock
- provider API key
- OpenClaw `agent main`
- `codex resume`
- Codex repo mutation
- Cursor worker automation
- deploy / tag / rollback
- unattended automation
- live Codex negative tests (separate gate)

---

## References (no duplication)

| Artifact | Role |
|----------|------|
| [post-repeatability-hardening](post-repeatability-hardening.md) | Recommends this packet |
| [codex-bridge-contract-v1](../contracts/codex-bridge-contract-v1.md) | §7 invocation |
| `tools/codex-bridge-wrapper/local-bridge-wrapper.mjs` | v1 path (read-only here) |
