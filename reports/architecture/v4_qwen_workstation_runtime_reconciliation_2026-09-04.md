# V4 Qwen workstation runtime reconciliation — 2026-09-04

## Purpose

Reconcile Control Plane with workstation-side Qwen/runtime changes completed after the 2026-09-03 six-profile integration, while keeping Blender workload/modeling activity explicitly out of Control Plane scope.

## Observed source state

- Control Plane base observed before this reconciliation: `6de1a8ae79699c1782bbe6c85ed25b3f48ed1e06`.
- `mrhz1973/qwen38-blender-lab` observed `origin/main`: `1ba1a1f1497e588f9833cbd5bdcbb3f8602f33a0`.
- Canonical local router remains `http://127.0.0.1:8080`.
- Startup/default remains `qwen38-opus-q3-daily-16k`.

## Router catalog drift

The workstation router now exposes 8 selectable profiles. Control Plane eligibility remains the original 6-profile set:

1. `qwen38-opus-q3-daily-16k`
2. `qwen38-opus-q3-agent-24k`
3. `qwen38-dcfr-iq3-fast-16k`
4. `qwen38-dcfr-iq3-agent-24k`
5. `qwen38-original-ar-16k`
6. `qwen38-uncensored-ar-16k`

Two additional workstation-local 96K profiles are visible through the same router but remain explicitly OUT OF CONTROL PLANE SCOPE:

- `qwen38-dcfr-iq3-blender-96k`
- `qwen38-opus-q3-blender-96k`

Their presence does not change Control Plane role routing, qualification, authorization scope, startup profile, or next-WF40-executor state. Control Plane must treat `/v1/models` as a router superset and select only profile IDs explicitly admitted by Control Plane policy.

Machine-readable reconciliation overlay:

`configs/resources/qwen-router-catalog-scope-overlay.json`

## Role qualification remains unchanged

The 2026-09-03 AGG correction remains authoritative:

- DCFR short-turn interactive roles remain UNQUALIFIED.
- DCFR remains qualified for FAST_THROUGHPUT/LONG_TASK.
- `qwen38-dcfr-iq3-agent-24k` next-WF40-executor mapping remains STALE pending retained-profile comparison.
- No silent replacement/requalification is authorized.
- `qwen-execution-scope-v2` and its digest remain unchanged.

Therefore the Control Plane `NEXT` remains:

`V4_QWEN_SHORT_TURN_PROFILE_COMPARISON_RETAINED_PROFILES`

with retained comparison set:

- `qwen38-original-ar-16k`
- `qwen38-opus-q3-daily-16k`
- `qwen38-opus-q3-agent-24k`

## llama-ui copy fix — no Control Plane runtime change

A llama-ui agentic/MCP Copy fix was source-patched and validated on the workstation:

- dev UI validation passed;
- isolated `llama-server` build under `build-cuda-copyfix` passed static validation;
- production `C:\Users\mrhz\llama.cpp-dflash2\build-cuda\bin` was not switched/overwritten during that work.

Therefore the Control Plane normal runtime identity remains the existing production runtime (`llama.cpp` build 10499 / commit `1deefcca3`) until a separately authorized/runtime-validated switch occurs. The copy fix has no effect on Control Plane headless execution semantics.

## Blender exclusion

No Blender scene, geometry, animation, MCP workflow, or Blender-specific task outcome is imported into Control Plane state by this reconciliation. Only the router-catalog fact that two additional local-only profiles exist is recorded so Control Plane does not mistake an 8-profile router response for a six-profile policy failure.

## Result

**PASS — Control Plane six-profile eligibility remains canonical on an 8-profile router superset; role qualification and NEXT are unchanged; workstation UI fix remains non-production for Control Plane purposes.**
