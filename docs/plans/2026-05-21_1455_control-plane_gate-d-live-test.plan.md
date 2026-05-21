---
repo: mrhz1973/control-plane
task: PM-09 Gate D live test
mode: plan
model: Composer 2.5
effort: Fast
risk: low
next_step: Verify that active 40 detects this plan file and emits the expected notification.
requires_runtime: yes
requires_human_gate: yes
target_window: CONTROL PLANE arancione
created_at: 2026-05-21T14:55:00+02:00
source: cursor-plan
summary: Live Gate D test plan file for active 40.
---

# PM-09 Gate D live test

This file intentionally matches the plan-file convention used by the active 40 workflow.

Expected result:

- commit notification can arrive;
- plan file is detected;
- Gate D notification can arrive;
- no v5 or webhook path is used.
