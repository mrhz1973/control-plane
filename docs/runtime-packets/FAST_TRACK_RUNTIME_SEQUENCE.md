# Fast-track runtime sequence (single controlled session)

**Status:** **Runbook only.** This file does **not** execute any runtime step. Use it as the ordered sequence for **one** controlled n8n session after PM-13 export.

**Related:** [pm-14 promotion](pm-14-promote-41-to-40-gate.md) · [pm-15 regression](pm-15-post-promotion-regression-gate.md) · [PM16 router design](../PM16_AUTOMATION_ROUTER_LAYER.md) · [PM-12 PASS](../sessions/2026-05-21-control-plane-41-handoff-file-runtime-pass.md) · [PM-13 export](../sessions/2026-05-21-control-plane-41-redacted-export-commit.md) · [RUNTIME_GATES.md](../RUNTIME_GATES.md)

---

## Sequence (in order, do not skip)

| # | Step | Tool / Surface | Reference | Stop-on-fail |
|---|------|----------------|-----------|--------------|
| 1 | **Export / redact `41`** (if not already done after live edits) | n8n UI export → local Downloads → redact script | [pm-13 packet](pm-13-candidate-41-redacted-export-gate.md) | Yes |
| 2 | **Promotion `41` → `40`** | n8n UI (deactivate old `40` → rename old to BACKUP OFF → rename `41` to new `40` → activate new `40`) | [pm-14 packet](pm-14-promote-41-to-40-gate.md) | Yes |
| 3 | **Regression smoke** | watched push commit / plan file push / GIS push → observe Telegram | [pm-15 packet](pm-15-post-promotion-regression-gate.md) | Yes |
| 4 | **Re-export redacted new `40`** (post-promotion) | n8n UI export → redact → commit under new dated filename | [pm-13 packet](pm-13-candidate-41-redacted-export-gate.md) pattern | Yes |
| 5 | **PM-16 router layer design** — already committed | docs only — [PM16_AUTOMATION_ROUTER_LAYER.md](../PM16_AUTOMATION_ROUTER_LAYER.md) | (no runtime) | n/a |
| 6 | **PM-17 — Ollama classifier dry-run** | local Ollama install + 1 plan file classify → decision JSON | future packet | Yes |
| 7 | **PM-18 — Codex OAuth feasibility dry-run** | OAuth flow check; **no** code execution | future packet | Yes |
| 8 | **PM-19 — Implementer bridge gate** | Only after steps 6 + 7 PASS; bridges decision JSON → implementer with explicit approval | future packet | Yes |

Steps 1–4 form the **CONTROL PLANE promotion + audit** block. Steps 6–8 form the **automation router** block and require PM-16 docs as prerequisite.

---

## Single-session rule

| Item | Rule |
|------|------|
| Confirmation between successful steps | **Not required** — proceed to next step on PASS |
| Confirmation on any STOP condition below | **Required** — halt session and open a fix |
| Batching steps from different blocks | **Forbidden** (do not mix promotion + Ollama in one session) |
| Order | Strict — step `n+1` requires step `n` PASS |
| Docs after each step | Session log + status updates per existing packet |

---

## Mandatory STOP conditions (abort session, no retry without fix)

| Condition | Detected at |
|-----------|-------------|
| Two CONTROL PLANE workflows active simultaneously | Step 2 (promotion) / step 4 (re-export) |
| Empty credentials on new `40` (Telegram / GitHub / Data Table) | Step 2 / step 3 |
| Token leak — `api.telegram.org/bot<token>`, `Authorization: Bearer …`, webhook URL, real chat_id in any file scheduled for commit | Steps 1, 4 |
| Production `40` broken (no commit notify, no plan_detected, no handoff file) | Step 3 |
| Telegram spam (≥ 3 messages per single commit) | Step 3 |
| File not written (`latest-gis-handoff.md` or `latest-control-plane-handoff.md` missing / 0 bytes) | Step 3 |
| Wrong workflow exported (name ≠ `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE`) | Steps 1, 4 |
| `30` / `20` / `01` reactivated | Step 2 / step 3 |
| ALINA LAVORO / GIS / DEV touched in n8n UI | Any step |
| Provider API key / Codex OAuth / Ollama runtime introduced before PM-17/18/19 gates | Steps 6–8 |
| `git add .` used anywhere | Any docs commit |
| Force push, hard reset, clean | Any git step |

On any STOP: deactivate the new candidate (if relevant), reactivate `BACKUP OFF`, write a session log describing what failed, and **do not** proceed.

---

## Allowed paths (docs/runbook updates per step)

| Step | Allowed files |
|------|--------------|
| 1 | `workflows/exports/<date>_41-plan-handoff-file-candidate.redacted.json`, `docs/sessions/<date>-control-plane-41-redacted-export-commit.md`, `docs/WORKFLOW_EXPORT_STATUS.md`, `docs/POST_MVP_BACKLOG.md` |
| 2 | `docs/sessions/<date>-control-plane-pm14-promotion-41-to-40.md`, `docs/WORKFLOW_EXPORT_STATUS.md`, `docs/POST_MVP_BACKLOG.md`, `docs/MVP_STATUS.md` (runtime row only) |
| 3 | `docs/sessions/<date>-control-plane-pm15-post-promotion-regression.md`, `docs/POST_MVP_BACKLOG.md` |
| 4 | `workflows/exports/<date>_40-post-promotion.redacted.json`, `docs/WORKFLOW_EXPORT_STATUS.md`, `docs/POST_MVP_BACKLOG.md` |
| 5 | `docs/PM16_AUTOMATION_ROUTER_LAYER.md` (already committed) |
| 6–8 | Future PM-17/18/19 packets only (out of this runbook’s scope) |

---

## Out of scope (for this runbook)

- Strict C1 &lt; 30s reopen
- v5 / GitHub webhook
- Implementer auto-send before PM-19
- Provider API keys (OpenAI/Anthropic/etc) — none, ever, in first sequence
- ALINA LAVORO, GIS, DEV
- Any `git add .` / force push / hard reset

---

## Quick checklist (paste in session log)

```text
[ ] Step 1 — PM-13 export 41 redacted (or skipped: already committed)
[ ] Step 2 — Promotion 41 → 40 (PM-14)
[ ] Step 3 — Regression smoke (PM-15)
[ ] Step 4 — Re-export redacted new 40 (PM-13 pattern, new date)
[ ] Step 5 — PM-16 router design committed (docs only)
[ ] Step 6 — PM-17 Ollama classifier dry-run (separate session)
[ ] Step 7 — PM-18 Codex OAuth feasibility dry-run (separate session)
[ ] Step 8 — PM-19 implementer bridge gate (separate session)
```
