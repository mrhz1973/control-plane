# Runtime packet — PM-34: n8n Codex worker integration gate

**Packet ID:** `pm-34-n8n-codex-worker-integration-gate`  
**Date:** 2026-05-22  
**Status:** **PREPARED / NOT EXECUTED**

**Related:** [PM-31](../PM31_CODEX_WORKER_CONTRACT_DRY_RUN.md) · [pm-33 login gate](pm-33-codex-oauth-manual-login-gate.md) · [PM-20](../PM20_N8N_BRIDGE_PACKET.md) · [PM-22/23 PASS](../sessions/2026-05-22-control-plane-pm22-pm23-promotion-smoke-pass.md)

---

## Purpose

Future wiring: n8n classifier/bridge path → **Codex worker preview** (Telegram gate summary).

**Not** production `40` direct edit without a separate candidate workflow gate.

---

## Future preconditions

| Gate | State |
|------|--------|
| **PM-31** | Contract **PASS** |
| **PM-33** | OAuth/manual login **PASS** |
| **PM-35** | Real Codex no-op response **PASS** (`CODEX_NOOP_OK`) |
| **PM-36** | Repo-read functional **PASS** — output-format deviation |
| **PM-37** | Exact-output harness **PASS** (mock) — **required** before parsing Codex output in n8n |
| **PM-38** | Real probe **STRICT FAIL** / functional partial — **blocks** PM-34 |
| **PM-39** | Hardening **PASS** — PM-38 `recoverable_partial` **not** sufficient |
| **PM-40** | Strict structured retry **PASS** required before PM-34 runtime |
| **Production `40`** | Stable — classifier bridge ACTIVE |

**Blocker (PM-38):** Codex used `<<<JSON>>>` markers and drifted schema — do **not** parse this output in n8n.

**Warning:** PM-37 marker+JSON + **strict** PM-38 (or PM-39/40 successor) PASS before integration.
| **`41` backup** | Retained **or** PM-27 cleanup completed |

---

## First runtime (future) — rules

| Rule | Detail |
|------|--------|
| **Candidate** | Separate workflow ID — **do not** edit published `40` in place |
| **Default** | Worker call **disabled** |
| **Telegram** | Gate summary / preview only |
| **Order** | Mock first → one smoke only |
| **Real Codex** | Forbidden from production `40` without explicit gate |

---

## Forbidden

| Item | Reason |
|------|--------|
| Real Codex call from prod `40` without gate | Safety |
| Provider API key | Out of scope |
| Token commit | Secrets |
| Automatic commit/push by Codex | Out of scope |
| Delete backup `41` | PM-27 policy |
| GIS / DEV / Alina | Out of scope |

---

## Future PASS criteria

| # | Criterion |
|---|-----------|
| 1 | Candidate sends expected Telegram preview |
| 2 | **No** real worker unless explicit later gate |
| 3 | Production `40` unchanged or promoted via separate packet |
| 4 | Session on GitHub |

---

## Not executed

No n8n import, no workflow change, no Codex invocation in this packet.
