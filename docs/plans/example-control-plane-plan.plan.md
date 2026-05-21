---
repo: mrhz1973/control-plane
task: PM-09 Gate B example
mode: plan
model: composer-2.5
effort: fast
risk: low
next_step: "Do not execute — this is a documentation sample only."
requires_runtime: no
requires_human_gate: yes
target_window: control-plane
created_at: 2026-05-21T12:30:00+02:00
source: cursor-plan
summary: "SAMPLE ONLY — demonstrates plan file convention for PM-09 Gate B. Not for Telegram or n8n."
sample: true
---

<!-- NON-OPERATIONAL SAMPLE — do not send to Telegram; no runtime; no commands executed -->

## Summary

This file demonstrates the **Gate B** plan file convention under `docs/plans/`. It is committed for documentation and schema validation only. The orchestrator may read it on GitHub to learn the expected shape; **n8n does not ingest it** until a future Gate C runtime session authorizes watcher changes.

## Proposed next step

None for this sample. For real plans, state one concrete action in front matter `next_step` and expand here if needed.

## Gates

- **Gate A:** docs/design — delivered
- **Gate B:** file convention — this sample supports delivery; **no runtime**
- **Gate C:** n8n watcher — **not authorized**
- **Gate D:** Telegram notification — **not authorized**

## Out of scope

Runtime, n8n UI, workflow import/export, Telegram API, v5/webhook, SSH, Docker, ALINA LAVORO, dev-method, GIS. No secrets in this file.

## Notes for orchestrator

- **Window:** CONTROL PLANE (arancione)
- **Backlog:** PM-09
- **MVP:** accepted-with-exception D-C1-A; C1 **PARTIAL**; not strict 5/5 PASS
- **Flag:** `sample: true` in front matter — ignore for automation until convention supports filtering samples
