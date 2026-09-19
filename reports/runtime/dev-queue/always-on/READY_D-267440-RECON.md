# Backlog item — project reconciliation (post-terminal continuation)

```yaml
schema: backlog-item-v1
id: D-267440-RECON
title: mrhz1973/tmar-tts project reconciliation after D-0103-F001R
created_at: 2026-09-19T22:28:40.413Z
created_by: gpt-web
repository: mrhz1973/tmar-tts
branch_target: main

objective: |
  Project reconciliation for mrhz1973/tmar-tts after terminal PASS of LOCAL_DEV_B_D-0103-F001R (no terminal commit recorded).
  This is the bounded post-terminal reconciliation stage of Control Plane issue #110: it does NOT implement product work and does NOT promote anything by itself.

  Required actions on the target repository, in order:
  1. Read docs/roadmap.md and docs/current-state.md.
  2. Mark the completed item (D-0103-F001R lineage) as DONE in docs/roadmap.md with the PASS evidence (date) and update the SELECTED NEXT section so the completed item is no longer the current NEXT.
  3. Update docs/current-state.md "Next concrete work" to the reconciled next item (or state that none is selected).
  4. Write docs/backlog-state.json — machine-readable reflection of the reconciled roadmap — with EXACTLY this shape:
     {"schema":"tmar-backlog-state-v1","generated_at":"<now>","reconciled_for":"LOCAL_DEV_B_D-0103-F001R","items":[{"id":"F001","status":"DONE","depends_on":["R001"],"payload":null},{"id":"F002","status":"NEXT","depends_on":["F001"],"payload":{"ready_id":"D-0103-F002","title":"...","objective":"...","allowed_areas":["..."],"forbidden_areas":["..."],"risk_hint":"low","complexity_hint":"medium","acceptance":["..."],"test_commands":["..."],"timebox_hint":3600,"max_turns_hint":16,"context_refs":["..."]}}]}
     Rules for items: one entry per roadmap item with id, status (READY|NEXT|LATER|PARKED|SUPERSEDED|DONE) and depends_on copied from the roadmap dependency graph. Exactly ONE item may have status NEXT: the single project-canonical next whose dependencies are all DONE. Independent READY candidates must have status READY, not NEXT. If no unambiguous next exists, use zero NEXT items and leave the eligible ones READY.
     Rules for the NEXT item payload (only required when a NEXT exists): ready_id must match D-<digits>-<ITEMID>; objective/scope/acceptance must come from the roadmap item semantics; test_commands must be exactly ONE bang-safe command; timebox_hint and max_turns_hint bounded integers.
  5. Commit and push the three docs paths with an ordinary commit.

  Do not modify any other file. Do not change dependency edges. Do not invent new roadmap items.

scope:
  allowed_areas:
    - docs/roadmap.md
    - docs/current-state.md
    - docs/backlog-state.json
  forbidden_areas:
    - *.py
    - requirements.txt
    - requirements-dev.txt
    - ruff.toml
    - voices/**
    - texts/**
    - models/**
    - weights/**
    - datasets/**
    - .github/**
risk_hint: low
complexity_hint: low

planner:
  preferred: qwen
  fallback: []
  fallback_policy: gate_only

execution:
  target: cursor
  loop_allowed: false
  max_loop_rounds_hint: 1

acceptance:
  - the completed item is recorded DONE in docs/roadmap.md with PASS evidence
  - the completed item is no longer SELECTED NEXT in docs/roadmap.md
  - docs/current-state.md next concrete work is reconciled
  - docs/backlog-state.json exists, parses, and satisfies schema tmar-backlog-state-v1
  - at most one item has status NEXT and its dependencies are all DONE
  - dependency edges are unchanged and no roadmap item was invented
  - executor persistence commit and ordinary push succeed

local_dev:
  dev_profile: qwen38-opus-q3-opencode-64k
  timebox_hint: 1800
  max_turns_hint: 12
  test_commands:
    - powershell.exe -NoProfile -Command "try { $st = Get-Content docs\backlog-state.json -Raw | ConvertFrom-Json } catch { exit 1 }; if (-not $st.items) { exit 2 }; if ($st.schema -ne 'tmar-backlog-state-v1') { exit 3 }; $n = @($st.items | Where-Object { $_.status -eq 'NEXT' }); if ($n.Count -gt 1) { exit 4 }; git diff --check; if ($LASTEXITCODE -ne 0) { exit 5 }"

human_gate_required_if: []
context_refs:
    - github:mrhz1973/control-plane#103
    - github:mrhz1973/control-plane#110
    - github:mrhz1973/control-plane#103

state: READY_FOR_PLANNING
```
