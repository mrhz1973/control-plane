# Local wrapper success-path design packet

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/local-wrapper-success-path-design-packet.md`  
**Date:** 2026-05-26  
**Status:** **DESIGN PACKET ONLY** · no runtime executed by this task · no Codex execution by this task · no wrapper code modified · no fixture created · no n8n invocation · no workflow 40/41 mutation · no PM-34 unlock · explicit human gate required before any success-path runtime

**Related:** [Wrapper v0 dry-run PASS](../sessions/2026-05-26-control-plane-local-bridge-wrapper-dry-run-v0.md) · [Dry-run preflight](bridge-wrapper-runtime-dry-run-preflight.md) · [Wrapper design v1](../contracts/codex-bridge-wrapper-design-v1.md) · [Bridge contract §7](../contracts/codex-bridge-contract-v1.md) · [Smoke V2 PASS](../sessions/2026-05-25-control-plane-codex-bridge-manual-smoke-v2-pass.md)

---

## 1. Purpose

This packet prepares a **future controlled success-path dry-run** after local wrapper v0 fail-closed **PASS**.

**v0 already proved:**

| Check | Result |
|-------|--------|
| Local wrapper starts | PASS |
| Synthetic fixture read | PASS |
| Pre-gates work | PASS (`needs_human` on `allows_runtime: false`) |
| Fail-closed output valid JSON | PASS |
| Codex invoked | **No** |
| n8n invoked | **No** |
| OpenClaw invoked | **No** |
| Network attempted | **No** |
| Repo mutation attempted | **No** |

This document defines the **next future test only**. It does not authorize execution.

---

## 2. Future success-path target

| Parameter | Requirement |
|-----------|-------------|
| Host | Local-only (Ryzen or approved operator workstation) |
| Input | Synthetic no-secret fixture (created in separate future gate) |
| Human gate | Explicit operator approval before run |
| Codex | Optional read-only invocation **only if separately authorized** in that future task |
| Invocation | [codex-bridge-contract-v1](../contracts/codex-bridge-contract-v1.md) §7 properties |
| Output | Valid bridge JSON, schema-enforced, stdout |
| Mutation | **None** — no repo, n8n, or workflow writes |

Future flow:

```text
synthetic success fixture
  → local wrapper (extended in future gate)
  → pre-gates pass
  → assemble sanitized inlined prompt
  → optional Codex read-only single-turn JSON (§7)
  → post-gates
  → final bridge output JSON
  → no repo / n8n / workflow mutation
```

---

## 3. Future fixture policy

Future success fixture (not created by this packet) must satisfy:

| Rule | Requirement |
|------|-------------|
| Origin | Synthetic only |
| Secrets | **None** — no API keys, OAuth tokens, webhook URLs, chat IDs, auth URLs, tokenized URLs |
| Personal data | **None** |
| `runtime_policy` | Explicitly allow **only** local read-only Codex reasoning |
| `runtime_policy` deny | n8n, repo mutation, workflow mutation, PM-34, OpenClaw agent main, deploy/tag/rollback, Cursor worker automation |
| `human_gate_state` | Explicit approved value for success-path gate (defined in future task) |
| `context_refs` | Repo-relative, sanitized, inlined at runtime — no file discovery |

Workflow IDs may appear only as textual `blocked_actions` references, not as mutation targets.

---

## 4. Future allowed runtime scope

Only after **explicit human gate** in a separate future task:

| Allowed | Notes |
|---------|-------|
| Run local wrapper | Extended version; v0 script not modified by this packet |
| Read synthetic fixture | No secrets |
| Assemble sanitized inlined prompt | Per wrapper design §5 |
| Invoke Codex read-only | Single-turn JSON per §7 — separate sub-gate |
| Parse output JSON | Schema-enforced |
| Apply post-gates | Per wrapper design §7 |
| Print final JSON | stdout |
| Record sanitized evidence | `docs/sessions/` only |

---

## 5. Future forbidden runtime scope

Always forbidden unless a **later separate gate** explicitly changes policy:

| Forbidden | Notes |
|-----------|-------|
| n8n invocation | Any API, webhook, UI |
| Workflow 40 / 41 mutation | Export, import, edit, activate |
| PM-34 unlock | Real worker remains gated |
| Provider API key | Configuration or use |
| OpenClaw `agent main` | Blocked path |
| `codex resume` | Especially V1 interrupted session |
| Codex repo mutation | Implementation via bridge |
| Cursor worker automation | Auto commit-push, loops |
| Deploy / tag / rollback | Any environment |
| Secrets in fixture/prompt/log/output | Fail closed |
| Tokenized URLs / OAuth material | Fail closed |
| Package install | Node built-ins only |
| GitHub Actions changes | Out of scope |

---

## 6. Required future preflight

Before any future success-path execution, operator must confirm:

| Check | Criterion |
|-------|-----------|
| Repo path | Expected `control-plane` workspace |
| Branch | `main` |
| Workspace | `git status --short` empty |
| v0 regression | Fail-closed fixture still PASS |
| Success fixture | No secrets; policy matches §3 |
| Dependencies | No package install required |
| n8n / workflows | No process/API call; no export/import |
| Codex (if used) | Read-only, ephemeral, no resume, no repo mutation, §7 properties |
| Output | stdout JSON only unless evidence session pre-declared |
| Evidence path | Session file named before run |

---

## 7. PASS criteria (future success-path)

Future **PASS** requires all of:

- [ ] Local wrapper starts
- [ ] Fixture accepted and validated
- [ ] Codex invoked **only if** separately authorized in that future task
- [ ] Codex invocation satisfies §7 properties (non-interactive, inlined context, schema-enforced JSON, read-only sandbox, ephemeral, no resume)
- [ ] Output JSON valid per bridge contract §4
- [ ] `no_runtime_confirmation: true`
- [ ] `status` in allowed enum (`proposed`, `blocked`, `needs_human`, `failed`)
- [ ] `proposed_prompt_for_cursor: null` unless explicitly allowed by that future task
- [ ] No repo mutation except allowed evidence files
- [ ] No n8n call
- [ ] No wf 40 / 41 touch
- [ ] No PM-34 unlock
- [ ] No provider API key
- [ ] No OpenClaw agent main
- [ ] No `codex resume`
- [ ] No deploy/tag/rollback
- [ ] No secrets in fixture/prompt/output/logs
- [ ] Workspace clean after doc commit/push if applicable

---

## 8. FAIL criteria (future success-path)

Future **FAIL** if any of:

- Forbidden action occurs (§5)
- Codex attempts tool-use outside expected JSON output (V1 lesson)
- Output malformed or missing required keys
- `no_runtime_confirmation` missing or false
- `proposed_prompt_for_cursor` unexpectedly non-null
- Risk/action mismatch not converted to `needs_human` / `blocked`
- Secret appears in fixture, prompt, output, or logs
- Wrapper mutates repo unexpectedly
- n8n / workflow / PM-34 touched
- Provider API key requested or used
- OpenClaw agent main invoked
- `codex resume` attempted
- Ambiguity not fail-closed

---

## 9. Required evidence (future success-path)

Future session report must include:

| Item | Content |
|------|---------|
| Exact command | Sanitized |
| Fixture path | Repo-relative |
| Codex command shape | If Codex separately authorized — no secrets; reference smoke V2 session for v0.133.0 snapshot only |
| stdout/stderr summary | Redacted |
| Final output JSON | Full bridge output |
| `git status` | Before and after |
| n8n/wf confirmation | Explicit not touched |
| Secrets confirmation | Explicit none |
| PASS/FAIL table | Per §7/§8 |
| Next gate | Named conservatively |

Register in `docs/sessions/`; update FOUNDATION_STATUS only.

---

## 10. Next gate

**After this docs-only packet:** explicit **human gate for Codex-read-only wrapper dry-run**.

**Still not authorized:**

- n8n integration
- Workflow 40 / 41 mutation
- PM-34 unlock
- Provider API key configuration
- OpenClaw `agent main` retry
- `codex resume`
- Codex repo mutation
- Cursor worker automation
- Deploy / tag / rollback
- Success fixture creation (separate future gate)
- Wrapper code changes (separate future gate)

**Possible sequence after human gate:**

1. Create success fixture (synthetic, no secrets)
2. Extend wrapper for Codex path (separate implementation gate)
3. Run Codex-read-only wrapper dry-run with §7 properties
4. Register PASS/FAIL session; update FOUNDATION_STATUS

Smoke V2 remains separate proof of Codex CLI behavior; wrapper success-path must not assume V1 resume or interactive agentic mode.
