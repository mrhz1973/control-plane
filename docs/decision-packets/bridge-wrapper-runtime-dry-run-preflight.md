# Bridge wrapper runtime dry-run preflight

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/bridge-wrapper-runtime-dry-run-preflight.md`  
**Date:** 2026-05-25  
**Status:** **DESIGN PACKET ONLY** · explicit human gate required before execution · no runtime executed by this task · no wrapper code created · no Codex execution · no n8n invocation · no workflow 40/41 mutation · no PM-34 unlock

**Related:** [Wrapper design v1](../contracts/codex-bridge-wrapper-design-v1.md) · [Bridge contract v1](../contracts/codex-bridge-contract-v1.md) · [Smoke V2 PASS](../sessions/2026-05-25-control-plane-codex-bridge-manual-smoke-v2-pass.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## 1. Purpose

This packet prepares a **future local runtime dry-run** of the bridge wrapper boundary defined in [codex-bridge-wrapper-design-v1](../contracts/codex-bridge-wrapper-design-v1.md).

Future dry-run scope (when explicitly gated):

```text
static JSON fixture
  → local wrapper executable (future)
  → deterministic pre-gates
  → bridge output JSON (blocked / needs_human expected first)
  → no n8n
  → no repo writes
  → no workflow mutation
```

This document does **not** authorize execution. It defines what a gated dry-run must test and how PASS/FAIL is judged.

---

## 2. Dry-run target

| Parameter | Value |
|-----------|---------|
| Host | Ryzen (`asusdesktop`) or approved local operator workstation |
| Mode | Local-only dry-run |
| Input | Synthetic static JSON fixture — no secrets |
| First test path | **Blocked / needs_human pre-gates** — not live Codex success path |

### Initial recommended case

Fixture: docs-only reasoning request with **no runtime permission** (restrictive `runtime_policy`, or high-risk / human-gate classification).

Expected wrapper behavior:

- Apply pre-gates per wrapper design §4
- Emit `needs_human` or `blocked` per guard rules
- **No Codex call** required for first dry-run unless separately gated
- Output includes `no_runtime_confirmation: true`

Rationale: validate fail-closed guards before any Codex success-path test (smoke V2 already proved Codex separately).

---

## 3. Allowed future runtime scope

Only after **explicit human gate** approval:

| Allowed | Notes |
|---------|-------|
| Local wrapper invocation | Executable created in separate implementation gate |
| Static JSON fixture | Sanitized, no secrets |
| Sanitized repo-relative `context_refs` | For future prompt assembly tests only |
| Temp/sandbox output paths | Outside repo if files written |
| Pre-gate / post-gate validation | Deterministic JSON in/out |

---

## 4. Forbidden future runtime scope

| Forbidden | Notes |
|-----------|-------|
| n8n invocation | Any API, webhook, or UI |
| Workflow 40 / 41 mutation | Export, import, edit, activate |
| PM-34 unlock | Real worker remains gated |
| OpenClaw `agent main` | Blocked path |
| Provider API key | Configuration or use |
| `codex resume` | Especially V1 interrupted session |
| Codex repo mutation | Implementation via bridge |
| Cursor worker automation | Auto commit-push, `--force`, loops |
| Deploy / tag / rollback | Any environment |
| Secret-bearing prompt persistence | Logs, Git, fixtures |
| Tokenized URLs / OAuth material | In fixtures, logs, or output |

---

## 5. Required preflight before future runtime

Operator must confirm **before** any gated dry-run:

| Check | Criterion |
|-------|-----------|
| Repo path | Expected `control-plane` workspace |
| Branch | `main` |
| Workspace | `git status --short` empty |
| Docs | Latest wrapper design + bridge contract + this packet on `main` |
| Wrapper executable | If exists, path inside approved future scope (separate gate) |
| Fixture | Contains no secrets, tokens, URLs with credentials |
| Output path | Temp/sandbox only — not committed to repo |
| n8n | No process/API call; no workflow export/import |
| Codex | Not invoked unless separate explicit sub-gate |

---

## 6. Fixture policy

Future fixtures must be:

| Rule | Requirement |
|------|-------------|
| Format | Static JSON matching bridge contract §3 shape |
| Secrets | **None** — no API keys, OAuth tokens, auth URLs, webhook URLs, chat IDs |
| Personal data | **None** |
| Workflow IDs | Textual references in `blocked_actions` only — not live mutation targets |
| Expected result | Documented before run (`blocked` or `needs_human` for first case) |
| Storage | Temp dir or `docs/` fixture path only if sanitized and committed separately in future gate |

Fixtures are **not** created by this packet.

---

## 7. PASS criteria

Future dry-run **PASS** requires all of:

- [ ] Wrapper starts locally (when executable exists)
- [ ] Accepts fixture without error
- [ ] Applies pre-gates deterministically
- [ ] Emits valid bridge output JSON per contract §4
- [ ] `no_runtime_confirmation: true` present
- [ ] `status` is `blocked`, `needs_human`, or other allowed safe status for first case
- [ ] No repo file modified (`git status --short` empty after)
- [ ] No n8n call
- [ ] No wf 40 / 41 touch
- [ ] No Codex call (first dry-run) unless separately gated and documented
- [ ] No secrets in stdout/stderr/logs
- [ ] No deploy/tag/rollback
- [ ] Workspace clean after run

---

## 8. FAIL criteria

Future dry-run **FAIL** if any of:

- Unexpected repo file modification
- n8n called or workflow export/import attempted
- Workflow 40 / 41 touched
- PM-34 unlocked or worker invoked
- Provider API key requested or used
- OpenClaw `agent main` invoked
- Codex repo mutation attempted
- Cursor worker automation activated
- Malformed or non-JSON output
- Missing or false `no_runtime_confirmation`
- Ambiguity not converted to `needs_human` / `blocked`
- Secrets appear in fixture, logs, or output
- `codex resume` of interrupted V1 session

---

## 9. Required evidence after future runtime

Future dry-run session report must include:

| Item | Content |
|------|---------|
| Command run | Sanitized — no secrets |
| Fixture path | Repo-relative or temp |
| stdout/stderr summary | Redacted if needed |
| Output JSON | Full bridge output |
| `git status` | Before and after |
| n8n/wf confirmation | Explicit "not touched" |
| Secrets confirmation | Explicit "none" |
| Verdict | PASS or FAIL |
| Next gate | Named conservatively |

Register in `docs/sessions/`; update FOUNDATION_STATUS only.

---

## 10. Next gate

**After this docs-only packet:** explicit **human gate** required before local wrapper runtime dry-run.

**Not authorized yet:**

- Wrapper implementation (code)
- Dry-run execution
- n8n integration
- Workflow 40 / 41 mutation
- PM-34 unlock
- Codex success-path call via wrapper
- Cursor worker automation

**Possible sequence after human gate:**

1. Wrapper implementation (separate gate)
2. First dry-run: pre-gate blocked/needs_human path (this packet §2)
3. Optional later sub-gate: Codex success path via wrapper (requires smoke V2 lessons + §7 properties)
