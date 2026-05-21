# Runtime packet — PM-20: n8n classifier/bridge gate

**Packet ID:** `pm-20-n8n-classifier-bridge-gate`  
**Date:** 2026-05-22  
**Status:** **PREPARED / NOT EXECUTED**

**Related:** [PM20 overview](../PM20_N8N_BRIDGE_PACKET.md) · [PM-15 smoke PASS](../sessions/2026-05-22-control-plane-pm15-new-40-smoke-pass.md) · [PM-17](../PM17_OLLAMA_CLASSIFIER_DRY_RUN.md) · [PM-19](../PM19_IMPLEMENTER_BRIDGE_DRY_RUN.md) · [FAST_TRACK](../FAST_TRACK_RUNTIME_SEQUENCE.md)

---

## Target (future)

| Field | Value |
|-------|--------|
| **Future workflow** | Successor of **`40`** (e.g. candidate **`42`**) — **not** silent edit to current published **`40`** until explicit gate |
| **Current production** | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` — **unchanged** in PM-20 |

---

## Preconditions

| Gate | State |
|------|--------|
| **PM-15** smoke | **PASS** — `c0ea042`, exec `#6708` |
| **PM-17** classifier dry-run | **PASS** — `pm17-classifier-v1` sample |
| **PM-19** bridge dry-run | **PASS** — `dry_run_pass` / mock-worker |
| **PM-18** Codex OAuth | **PENDING** allowed — mock worker only |
| **PM-16** runtime export | **PENDING** — non-blocking |
| **v5 / webhook** | **Off** |
| **C1** | **PARTIAL** — not relabeled |

---

## Future runtime changes (one gate session)

| Step | Action |
|------|--------|
| 1 | After existing **Gate D** `plan_detected`, branch to classifier (local Ollama HTTP or deterministic Code mirroring PM-17 mock rules) |
| 2 | Emit **classifier JSON** (`pm17-classifier-v1`) |
| 3 | Run **bridge** Code node (PM-19 contract) → request + result JSON |
| 4 | **Telegram** — short summary + attachment (classifier + bridge) |
| 5 | If `gate_required` → send [human gate template](../examples/pm20-telegram-gate-message.sample.md) example B |
| 6 | If `dry_run_pass` → send handoff preview + example A; **no** worker HTTP to Codex |
| 7 | **Stop** — no automatic implementer execution |

**Nodes (conceptual):** `plan_detected` → `HTTP/Ollama or Code classifier` → `Code bridge` → `IF gate_required` → `Telegram` branches.

---

## STOP conditions (abort future runtime)

| Condition | Action |
|-----------|--------|
| Modifies published **`40`** without explicit promotion gate | Stop |
| Sends task to **Codex** automatically | Stop |
| Provider API key in workflow or git | Stop |
| Token / OAuth secret in export or logs committed | Stop |
| Telegram spam (duplicate classifier messages per SHA) | Stop |
| High risk without human gate message | Stop |
| GIS / DEV / ALINA LAVORO touched | Stop |
| `send_worker_automatically: true` while PM-18 PENDING | Stop |

---

## PASS criteria (future runtime evidence)

| # | Criterion |
|---|-----------|
| 1 | Telegram receives **classifier decision** (text or attachment) |
| 2 | Telegram receives **bridge result** |
| 3 | Low-risk plan sample → `dry_run_pass` / mock-worker (no real worker) |
| 4 | High-risk sample → `gate_required` + human gate Telegram |
| 5 | **No** real Codex/worker invocation |
| 6 | Production **`40`** stable **or** successor clearly named and inactive until promoted |

---

## Next runtime gate

**PM-21** — n8n bridge runtime candidate (import/test inactive workflow, Manual Trigger once).

**Do not** combine PM-21 with Codex CLI install in the same session.
