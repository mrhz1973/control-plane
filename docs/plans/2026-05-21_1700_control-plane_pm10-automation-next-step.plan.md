---
repo: mrhz1973/control-plane
task: PM-10 Implementer auto-handoff preparation
mode: plan
model: composer-2.5
effort: medium
risk: medium
next_step: "After plan_detected on Telegram, design candidate 41 for full handoff file generation — no implementer send in this plan."
requires_runtime: no
requires_human_gate: yes
target_window: control-plane
created_at: 2026-05-21T17:00:00+02:00
source: cursor-plan
summary: "PM-10: after watcher 40 plan_detected, prepare path from plan file to generated handoff/prompt file; no n8n change or implementer auto-send in this commit."
---

## Summary

Push automation forward on **CONTROL PLANE** only. Active workflow **`40`** already delivers **plan_detected** Telegram text plus the `.md` plan attachment when a new file appears under `docs/plans/`. This plan records the **next automation slice**: reduce manual copy-paste after that notification by defining how a future handoff/prompt artifact should be produced from the detected plan — without changing n8n in this task and without auto-invoking an implementer.

## Proposed next step

1. Confirm **Telegram** shows `plan_detected` for this commit (watcher **`40`**, v4 polling).
2. Capture evidence (execution outcome, public commit SHA only — no message bodies or secrets in git).
3. Open a **separate** runtime/docs gate to design **candidate `41`** (not another `40` copy): extend poll+handoff path or adjacent branch to write a **complete handoff/prompt file** to a safe n8n filesystem path and optionally attach it — mirroring GIS `latest-gis-handoff.md` pattern, but sourced from `docs/plans/*.plan.md` front matter + body.
4. Pre-bind known GitHub/Telegram credential **names** in candidate JSON; use placeholders for chat_id and other private values.

## Gates

| Gate | This plan | Future |
|------|-----------|--------|
| **Plan file commit** | **Now** — triggers watcher **`40`** detect only | — |
| **Gate D Telegram** | Expected via existing **`40`** (text + `.md` file) | Verify after push |
| **n8n / workflow edit** | **No** — not authorized here | Candidate **`41`** after Telegram evidence |
| **Implementer auto-send** | **No** | Explicit human gate if ever added |
| **v5 / webhook** | **Off** | PM-01 optional only |
| **GIS / dev-method / ALINA** | **Out of scope** | Not touched |

## Out of scope

- n8n UI, import/export, workflow activation, manual Telegram, VPS/SSH
- Modifying production **`40`** or recreating **`55`** test-safe in UI
- Cursor provider API, tokens, chat_id, credential IDs, webhook URLs
- Automatic implementer invocation or GIS/dev-method repo changes
- Strict C1 reopen (remains **PARTIAL** via D-C1-A)

## Notes for orchestrator

- **Window:** CONTROL PLANE (arancione) — home repo `mrhz1973/control-plane`
- **Backlog ID:** PM-10 — see [POST_MVP_BACKLOG.md](../POST_MVP_BACKLOG.md)
- **MVP:** operationally accepted; C1 **PARTIAL**; C2–C5 **PASS**; PM-09 Gate C+D+FILE **PASS**
- **Runtime list:** `40` ACTIVE · `30` / `20` / `01` OFF (4 workflows); backup `40` and `55` deleted from UI
- **Desired future output:** generated handoff/prompt **file** saved and deliverable (not only Telegram preview text)
- **Filename:** Gate B pattern `2026-05-21_1700_control-plane_pm10-automation-next-step.plan.md` (task slug `pm10-automation-next-step`)
