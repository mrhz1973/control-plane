# V4 Qwen independent 3-run qualification campaign V1

Status: `PASS / QUALIFIED`

Created: 2026-09-08T21:45:00Z
Closed: 2026-09-09T00:50:42+02:00

## Purpose

Establish whether the workstation-local Qwen/OpenCode lane is independently reliable after the assisted D-9404-A live-closure remediation.

The prior D-9404-A closure proves the live pipeline can complete, but it is NOT sufficient to qualify Qwen autonomous reliability because Cursor materially repaired runtime/executor boundaries and seeded the final package during remediation.

## Qualification law

Qwen is NOT to be labeled operational/reliable from this campaign until all three fresh qualification tasks pass without Cursor, GLM, Codex, Hermes, or other commercial-model assistance during execution.

Required sequence:

1. `D-9405-A` — fresh single-file canonical-read/write task.
2. `D-9405-B` — fresh two-file coding + deterministic test task.
3. `D-9405-C` — fresh three-file coding task released only after a separately evidenced cold-state preparation for the exact 64K profile.

All three use:

- planner: `qwen`
- commercial fallback: none / gate-only
- exact DEV profile: `qwen38-opus-q3-opencode-64k`
- natural WF90 dispatch only
- deterministic tests
- selective commit/push/remote verification

## Pass criterion

`QWEN_INDEPENDENT_QUALIFIED=YES` only if:

- D-9405-A = executor-pass
- D-9405-B = executor-pass
- exact 64K runtime is deliberately placed into a canonical cold/not-ready state before D-9405-C release, without Cursor/model assistance
- D-9405-C then reaches QWEN_PREFLIGHT with `runtime_ready=true` through autorecovery and = executor-pass
- no Cursor/GLM/Codex/Hermes/provider model call assists any of A/B/C execution
- no seeded implementation files are supplied for A/B/C
- no manual `/v1/tick`; natural WF90 only
- no duplicate execution
- at least two natural post-C `IDLE_CLEAN` ticks

Any QVAL STOP breaks the consecutive-pass claim. Diagnose it, but do not relabel the campaign PASS by merely repairing the failed artifact and continuing under the same qualification claim; a fresh 3-run sequence is then required.

## Current state

`QWEN_INDEPENDENT_QUALIFIED=YES`

D-9405-A: PASS — `0fdf3fc1d37b5e328e7c4d72933605dd06006852`
D-9405-B: PASS — `e0fdc51ca18bf7c128440f5d58201bc760a7a98f`
D-9405-C cold-state prep: PASS — `reports/runtime/qwen-qualification/QVAL3_COLD_STATE_GATE_EVIDENCE.md`
D-9405-C: PASS — `bef241fb711c25066e8076ec88b40510270696a0`
Post-C natural IDLE_CLEAN #1: PASS — WF90 execution `317588`, completed `2026-09-08T22:45:42.430Z`
Post-C natural IDLE_CLEAN #2: PASS — WF90 execution `317599`, completed `2026-09-08T22:50:42.517Z`
Post-C evidence: `reports/runtime/qwen-qualification/QVAL3_POST_C_IDLE_EVIDENCE.md`

The exact `qwen38-opus-q3-opencode-64k` worker was independently observed `unloaded` while the canonical Qwen router remained alive before D-9405-C release. Natural WF90 then recovered the exact profile and produced the executor-pass. Two subsequent natural WF90 executions were both `IDLE_CLEAN`, with `execution_performed=false`, `task_ref=null`, and no duplicate D-9405-C execution.

## Qualification conclusion

The independent three-run campaign satisfies every declared pass criterion.

`PIPELINE_LIVE_PROOF=PASS`
`QWEN_AUTONOMOUS_RELIABILITY=QUALIFIED_FOR_THIS_BOUNDED_LOCAL_DEV_SCOPE`
`QWEN_INDEPENDENT_QUALIFIED=YES`

This qualification is bounded to the tested workstation-local Qwen/OpenCode DEV lane and exact campaign conditions. It does not by itself authorize production model execution, D-0025, reviewer execution, retry execution, or commercial-provider fallback.

## Hard walls

- no Cursor execution/model assistance
- no GLM calls
- no Codex calls
- no Hermes calls
- no provider fallback
- no production gate/D-0025 change
- no n8n workflow edit
- no VPS change
- no fabricated or seeded implementation for qualification artifacts
