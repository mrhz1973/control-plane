# OpenClaw dual preview sequences — reconciliation

**Date:** 2026-05-23  
**Status:** **RECONCILED / DOCS ONLY**

**Authoritative HEAD (after this note):** `985bbe9` on `main`

---

## Why two sequences exist

Two separate OpenClaw preview/boundary runs were recorded on the same day. Both are valid preview evidence; neither unblocks PM-34 or enables a real worker.

| Sequence | Commits (oldest → newest) | Who closed the loop |
|----------|---------------------------|---------------------|
| **A — Cursor activation** | `fd0c5be` → `95bbaac` → `d8bceca` | Agent closed gateway and docs; Telegram for `95bbaac` **not** agent-verified |
| **B — Manual / operator** | `d0b1206` → `89d3729` → `985bbe9` | Operator confirmed Telegram/n8n preview for `89d3729` |

There is **no** conflict requiring reset, revert, or history rewrite. Sequence B is the **later** boundary pass with operator-confirmed preview.

---

## Authoritative final state

| Item | Value |
|------|--------|
| **Final boundary commit** | `985bbe9` — docs: record OpenClaw preview boundary pass |
| **Preview trigger (confirmed)** | `89d3729` — test: trigger OpenClaw sanitized liveness preview |
| **Liveness evidence (B)** | `d0b1206` — docs: record OpenClaw sanitized liveness pass |
| **Cursor close (historical)** | `d8bceca` — valid earlier close; treat Telegram for `95bbaac` as **unverified** unless operator later confirms |

**Operator-confirmed preview (sequence B, commit `89d3729`):**

- scheduled poll commit notification  
- `CONTROL PLANE plan_detected`  
- Gate D plan file  
- PM-21 bridge decision — risk **low**, route **cursor-control-plane**, approval **no**  
- bridge result **dry_run_pass**, worker **mock-worker**, action preview only — **no Codex execution**

Raw Telegram text is **not** committed here.

---

## What both sequences are (and are not)

| Classification | State |
|----------------|--------|
| **Both sequences** | Preview / boundary / liveness evidence only |
| **strict_pass_candidate** | **false** |
| **n8n_ready** | **false** |
| **PM-34 real worker** | **gated** |
| **Real worker** | **not** enabled |
| **Codex** | **not** used |
| **Workflow `40`** | **ACTIVE** — untouched |
| **Workflow `41`** | **BACKUP OFF** — untouched |
| **docs/artifacts/openclaw/** | **not** created |
| **Raw OpenClaw logs** | **not** in git |

Future orchestration must **not** assume `n8n_ready` or `strict_pass` from either sequence.

---

## Pointers

| Doc | Role |
|-----|------|
| [activation evidence](2026-05-23-control-plane-openclaw-activation-evidence-pass.md) | Sequence A liveness (`fd0c5be`) |
| [activation close](2026-05-23-control-plane-openclaw-activation-close.md) | Sequence A close (`d8bceca`) — Telegram unverified |
| [5-step final boundary](2026-05-23-control-plane-openclaw-5step-final-boundary-pass.md) | Sequence B final (`985bbe9`) |

---

## Next allowed

- Stabilize; no new PM by default  
- strict_pass artifact design only if explicitly scoped  
- PM-34 real worker only with separate explicit gate
