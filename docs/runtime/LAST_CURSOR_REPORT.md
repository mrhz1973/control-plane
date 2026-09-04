# LAST CURSOR REPORT

**BLOCK-ID:** `QWEN38_OPUS_Q3_CLINE_64K_PROFILE_CONTROL_PLANE`
**Classification:** `CLINE64K_PROFILE_STAGED_NON_ELIGIBLE`
**Timestamp (local):** 2026-09-04

## Summary

Resolved the effective normal-backend preset from both the workstation
launcher and router config:

`C:\Users\mrhz\llama.cpp-dflash2\qwen-models.ini`

`qwen38-opus-q3-cline-64k` already exists exactly once there with the target
64K OPUS configuration. Control Plane now records it under
`workstation_manual_profiles` as Cline/general-development only:

- Control Plane eligible: **NO**
- Auto-route / startup / WF40 / scope-v3 / Blender: **NO**
- Live verification: **STAGED_NOT_LIVE_VERIFIED**
- Existing six-profile eligibility and all role mappings: unchanged
- `qwen38-opus-q3-agent-24k`: unchanged
- Qwen generations: **0**
- Router restarted / services started: **NO**

## NEXT

`CLINE64K_ROUTER_RESTART_SINGLE_SMOKE_TEST`

Evidence report:
`reports/architecture/qwen38_opus_q3_cline_64k_profile_control_plane.md`
