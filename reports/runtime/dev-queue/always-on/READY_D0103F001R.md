# Backlog item — D-0103-F001R (TMAR TTS F001 multi-engine architecture contract — interrupted-execution recovery successor)

```yaml
schema: backlog-item-v1
id: D-0103-F001R
title: TMAR TTS F001 multi-engine architecture contract interrupted-execution recovery successor
created_at: 2026-09-19T21:40:00Z
created_by: gpt-web
repository: mrhz1973/tmar-tts
branch_target: main

objective: |
  Crash-recovery successor for D-0103-F001 (TMAR F001, Control Plane issue
  #103). The prior execution was selected by a natural WF90 tick, reached a
  durable EXECUTING receipt, QWEN_PREFLIGHT PASS, RUNTIME_READY and
  EXECUTOR_STARTED, then was interrupted by the bounded dispatcher ownership
  restart documented in #105/#106 before producing any TMAR work, test
  result or target commit. The historical receipt LOCAL_DEV_B_D-0103-F001
  remains untouched, permanently blocking by canonical receipt law. This
  successor is an execution-recovery vehicle only: it does not promote F002
  and does not create a second application backlog decision.

  Execute only F001 multi-engine-architecture-contract from the canonical TMAR TTS roadmap.
  This is a docs-only architecture task. Define exact future Python module boundaries and
  contracts for TTSEngine, generic request/result types, capabilities, load/unload lifecycle,
  EngineRegistry, DeviceManager (CUDA/MPS/CPU), model-pack manifest/manager, engine-aware
  provenance/cache namespace, and the architectural STTEngine extension point.

  Map the existing verified Chatterbox pipeline to the future first-adapter boundary without
  changing code or behavior. Record Qwen3-TTS, Fish and STT engines only as future adapters.
  Define the backend/GUI boundary needed for later PySide6 + Qt Quick/QML.

scope:
  allowed_areas:
    - docs/architecture.md
    - docs/decisions.md
  forbidden_areas:
    - "*.py"
    - requirements.txt
    - requirements-dev.txt
    - ruff.toml
    - voices/**
    - texts/**
    - models/**
    - weights/**
    - datasets/**
    - .github/**
    - docs/roadmap.md
    - docs/current-state.md
risk_hint: low
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
  - docs/architecture.md defines concrete module boundaries and dependency direction for the multi-engine backend
  - TTSEngine, TTSRequest, TTSResult, capability and load/unload lifecycle semantics are explicit
  - EngineRegistry, DeviceManager and model-pack responsibilities are explicit and non-overlapping
  - engine/model/version/device/voice/language provenance and engine-aware cache namespace are defined
  - STTEngine extension point is architecturally defined but not implemented
  - existing Chatterbox behavior is mapped as the first future adapter without changing application code
  - Qwen3-TTS, Fish and STT candidates are described only as future adapters, not integrated
  - GUI/backend boundary supports later PySide6 + Qt Quick/QML without requiring a local server
  - docs/decisions.md records the F001 structural contract
  - no application, test, dependency, model or runtime file changes
  - git diff --check passes
  - only docs/architecture.md and docs/decisions.md change
  - executor persistence commit and ordinary push succeed
  - final HEAD equals origin/main and tracked worktree is clean

local_dev:
  dev_profile: qwen38-opus-q3-opencode-64k
  timebox_hint: 1800
  max_turns_hint: 12
  test_commands:
    - powershell.exe -NoProfile -Command "if (-not (Select-String -Path docs\architecture.md -Pattern 'TTSEngine','EngineRegistry','DeviceManager','model-pack','cache' -SimpleMatch)) { exit 1 }; if (-not (Select-String -Path docs\decisions.md -Pattern 'multi-engine' -SimpleMatch)) { exit 2 }; git diff --check; if ($LASTEXITCODE -ne 0) { exit 3 }"

human_gate_required_if: []
context_refs:
  - github:mrhz1973/control-plane#103
  - github:mrhz1973/control-plane#105
  - github:mrhz1973/control-plane#106
  - github:mrhz1973/tmar-tts@2d324413a066c5edea8ed5dcc5bdb6c05c5d986c:docs/roadmap.md
  - github:mrhz1973/tmar-tts@2d324413a066c5edea8ed5dcc5bdb6c05c5d986c:docs/current-state.md
  - github:mrhz1973/tmar-tts@2d324413a066c5edea8ed5dcc5bdb6c05c5d986c:docs/architecture.md
  - github:mrhz1973/tmar-tts@2d324413a066c5edea8ed5dcc5bdb6c05c5d986c:docs/decisions.md

state: READY_FOR_PLANNING
```
