# Backlog item — D-9501-S (TMAR TTS R001 fresh-install qualification — crash-recovery successor)

```yaml
schema: backlog-item-v1
id: D-9501-S
title: TMAR TTS R001 verify fresh install crash-recovery successor
created_at: 2026-09-18T08:47:00Z
created_by: gpt-web
repository: mrhz1973/tmar-tts
branch_target: main

objective: |
  Crash-recovery successor for D-9501-R. The prior execution reached a durable
  EXECUTING receipt but the dispatcher process died before any durable TMAR
  work, test result, temporary R001 venv, or target commit was produced.
  Issue #93 has now qualified and canonically cut over the single dispatcher
  supervisor. Do not delete, rewrite, or replay the historical D-9501-R receipt.

  Execute only R001 verify-fresh-install from the canonical TMAR TTS roadmap.
  Recreate the runtime in a fresh Python 3.11 venv outside the repository,
  install exactly from requirements.txt, restore the documented CUDA 12.6
  torch/torchaudio build, run check_gpu.py, and perform one real Italian CLI
  Chatterbox generation using the existing repository sample text.

  Treat this as dependency/reproducibility qualification, not product
  development. If the qualification succeeds, update docs/current-state.md
  with the verified fresh-install result and concise evidence even when
  requirements.txt needs no change. Change requirements.txt only when the
  fresh-install evidence proves a dependency delta is necessary. Change
  docs/commands.md only when the verified install/run command itself must
  change.

  Internet package retrieval is permitted only for the declared pip/PyTorch
  installation command. Do not perform web research. If package retrieval is
  unavailable or the environment cannot be reproduced safely, STOP at the
  first actionable blocker rather than changing unrelated machine settings.

scope:
  allowed_areas:
    - requirements.txt
    - docs/current-state.md
    - docs/commands.md
  forbidden_areas:
    - podcast_gui_v5a.py
    - generate_podcast.py
    - check_gpu.py
    - voices/**
    - texts/**
    - models/**
    - weights/**
    - datasets/**
    - .github/**
    - docs/roadmap.md
    - docs/decisions.md

risk_hint: medium
complexity_hint: medium

planner:
  preferred: qwen
  fallback: []
  fallback_policy: gate_only

execution:
  target: cursor
  loop_allowed: true
  max_loop_rounds_hint: 2

acceptance:
  - a fresh temporary Python 3.11 venv outside the target repository is created without modifying global Python or Ollama
  - pip installation from requirements.txt completes successfully or the task STOPs on the first deterministic dependency blocker
  - documented torch 2.6.0+cu126 and torchaudio 2.6.0+cu126 restoration succeeds
  - check_gpu.py succeeds and reports the intended CUDA-capable runtime on this workstation
  - one real Italian CLI Chatterbox generation succeeds using the existing sample text
  - model weights, caches, generated audio, temporary venv files, datasets and secrets are not staged or committed
  - requirements.txt is changed only if evidence requires a dependency correction
  - docs/current-state.md records the fresh-install qualification result on PASS
  - docs/commands.md changes only if a verified command changes
  - no Qwen3-TTS, Fish Audio, STT, GUI, Qt/QML or unrelated product integration is performed
  - only allowed tracked files are modified
  - executor persistence commit and ordinary push succeed

local_dev:
  dev_profile: qwen38-opus-q3-opencode-64k
  timebox_hint: 3600
  max_turns_hint: 16
  test_commands:
    - powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand CgAkAEUAcgByAG8AcgBBAGMAdABpAG8AbgBQAHIAZQBmAGUAcgBlAG4AYwBlACAAPQAgACIAUwB0AG8AcAAiAAoAJAByAG8AbwB0ACAAPQAgACgARwBlAHQALQBMAG8AYwBhAHQAaQBvAG4AKQAuAFAAYQB0AGgACgAkAHMAdABhAG0AcAAgAD0AIABbAEQAYQB0AGUAVABpAG0AZQBdADoAOgBVAHQAYwBOAG8AdwAuAFQAbwBTAHQAcgBpAG4AZwAoACIAeQB5AHkAeQBNAE0AZABkAEgASABtAG0AcwBzAGYAZgBmACIAKQAKACQAdwBvAHIAawAgAD0AIABKAG8AaQBuAC0AUABhAHQAaAAgACQAZQBuAHYAOgBUAEUATQBQACAAKAAiAFQATQBBAFIAXwBSADAAMAAxAF8ARgBSAEUAUwBIAF8AVgAxAF8AIgAgACsAIAAkAHMAdABhAG0AcAApAAoAcAB5ACAALQAzAC4AMQAxACAALQBtACAAdgBlAG4AdgAgACQAdwBvAHIAawAKACQAcAB5ACAAPQAgAEoAbwBpAG4ALQBQAGEAdABoACAAJAB3AG8AcgBrACAAIgBTAGMAcgBpAHAAdABzAFwAcAB5AHQAaABvAG4ALgBlAHgAZQAiAAoAJgAgACQAcAB5ACAALQBtACAAcABpAHAAIABpAG4AcwB0AGEAbABsACAALQAtAGQAaQBzAGEAYgBsAGUALQBwAGkAcAAtAHYAZQByAHMAaQBvAG4ALQBjAGgAZQBjAGsAIAAtAHIAIAAoAEoAbwBpAG4ALQBQAGEAdABoACAAJAByAG8AbwB0ACAAIgByAGUAcQB1AGkAcgBlAG0AZQBuAHQAcwAuAHQAeAB0ACIAKQAKAGkAZgAgACgAJABMAEEAUwBUAEUAWABJAFQAQwBPAEQARQAgAC0AbgBlACAAMAApACAAewAgAGUAeABpAHQAIAAkAEwAQQBTAFQARQBYAEkAVABDAE8ARABFACAAfQAKACYAIAAkAHAAeQAgAC0AbQAgAHAAaQBwACAAaQBuAHMAdABhAGwAbAAgAC0ALQBkAGkAcwBhAGIAbABlAC0AcABpAHAALQB2AGUAcgBzAGkAbwBuAC0AYwBoAGUAYwBrACAALQAtAGYAbwByAGMAZQAtAHIAZQBpAG4AcwB0AGEAbABsACAALQAtAG4AbwAtAGQAZQBwAHMAIAB0AG8AcgBjAGgAPQA9ADIALgA2AC4AMAArAGMAdQAxADIANgAgAHQAbwByAGMAaABhAHUAZABpAG8APQA9ADIALgA2AC4AMAArAGMAdQAxADIANgAgAC0ALQBpAG4AZABlAHgALQB1AHIAbAAgAGgAdAB0AHAAcwA6AC8ALwBkAG8AdwBuAGwAbwBhAGQALgBwAHkAdABvAHIAYwBoAC4AbwByAGcALwB3AGgAbAAvAGMAdQAxADIANgAKAGkAZgAgACgAJABMAEEAUwBUAEUAWABJAFQAQwBPAEQARQAgAC0AbgBlACAAMAApACAAewAgAGUAeABpAHQAIAAkAEwAQQBTAFQARQBYAEkAVABDAE8ARABFACAAfQAKACYAIAAkAHAAeQAgACgASgBvAGkAbgAtAFAAYQB0AGgAIAAkAHIAbwBvAHQAIAAiAGMAaABlAGMAawBfAGcAcAB1AC4AcAB5ACIAKQAKAGkAZgAgACgAJABMAEEAUwBUAEUAWABJAFQAQwBPAEQARQAgAC0AbgBlACAAMAApACAAewAgAGUAeABpAHQAIAAkAEwAQQBTAFQARQBYAEkAVABDAE8ARABFACAAfQAKACYAIAAkAHAAeQAgACgASgBvAGkAbgAtAFAAYQB0AGgAIAAkAHIAbwBvAHQAIAAiAGcAZQBuAGUAcgBhAHQAZQBfAHAAbwBkAGMAYQBzAHQALgBwAHkAIgApACAALQAtAGwAYQBuAGcAIABpAHQAIAAtAC0AdAB4AHQAIAAoAEoAbwBpAG4ALQBQAGEAdABoACAAJAByAG8AbwB0ACAAIgB0AGUAeAB0AHMAXABDAE8ATQBTAFUAQgBJAE4AXwBCAFIARQBWAEUAXwBUAFQAUwBfAEkAVAAuAHQAeAB0ACIAKQAKAGkAZgAgACgAJABMAEEAUwBUAEUAWABJAFQAQwBPAEQARQAgAC0AbgBlACAAMAApACAAewAgAGUAeABpAHQAIAAkAEwAQQBTAFQARQBYAEkAVABDAE8ARABFACAAfQAKACYAIAAkAHAAeQAgAC0AbQAgAHAAaQBwACAAZgByAGUAZQB6AGUACgBpAGYAIAAoACQATABBAFMAVABFAFgASQBUAEMATwBEAEUAIAAtAG4AZQAgADAAKQAgAHsAIABlAHgAaQB0ACAAJABMAEEAUwBUAEUAWABJAFQAQwBPAEQARQAgAH0ACgA=

human_gate_required_if: []
context_refs:
  - github:mrhz1973/control-plane#92
  - github:mrhz1973/control-plane#93
  - github:mrhz1973/control-plane@23c464fb488dceda0ee4f40b4684ae5b90f02552:reports/architecture/v4_local_dev_dispatcher_crash_resilience_v1.md
  - github:mrhz1973/tmar-tts@8f7ecaee18a7413b83a3062a5032dc0a74c1a448:docs/roadmap.md
  - github:mrhz1973/tmar-tts@8f7ecaee18a7413b83a3062a5032dc0a74c1a448:docs/current-state.md
  - github:mrhz1973/tmar-tts@8f7ecaee18a7413b83a3062a5032dc0a74c1a448:docs/commands.md

state: READY_FOR_PLANNING
```
