# Qwen 3.8 OPUS Q3 Cline 64K — Control Plane registration

**BLOCK-ID:** `QWEN38_OPUS_Q3_CLINE_64K_PROFILE_CONTROL_PLANE`
**Classification:** `CLINE64K_PROFILE_STAGED_NON_ELIGIBLE`
**Date:** 2026-09-04

## Canonical preset resolution

The normal OPUS backend preset was derived from the actual workstation
launcher and router configuration:

- `C:\Users\mrhz\Documents\AI\QWEN\Start-Qwen-MultiModel-16K.ps1`
  sets `$Preset` to
  `C:\Users\mrhz\llama.cpp-dflash2\qwen-models.ini`.
- `C:\Users\mrhz\Documents\AI\QWEN\qwen-runtime-router.json`
  sets `backend_preset` to the same path.

Canonical preset:

```text
C:\Users\mrhz\llama.cpp-dflash2\qwen-models.ini
```

The profile already exists exactly once in that canonical preset:

```ini
[qwen38-opus-q3-cline-64k]
model = D:\AI\qwen38-blender-lab\models\qwen38-opus\Qwen3.8-27B-Opus-Distill-v2-Q3_K_M.gguf
alias = Qwen3.8 OPUS Q3 — CLINE DEV (64K)
tags = OPUS,Q3,CLINE,DEV,64K,agent
ctx-size = 65536
n-gpu-layers = 50
cache-type-k = q4_0
cache-type-v = q4_0
spec-type = none
reasoning = off
```

Global `parallel = 1`, `threads = 20`, `flash-attn = on`, and `jinja = on`
remain unchanged. The first/startup preset remains
`qwen38-opus-q3-daily-16k`; `qwen38-opus-q3-agent-24k` is unchanged.

## Control Plane classification

The profile is recorded under `workstation_manual_profiles`, outside the
authoritative six-entry `profiles` eligibility set:

```text
PROFILE_ID              = qwen38-opus-q3-cline-64k
PURPOSE                 = CLINE / GENERAL DEVELOPMENT
CONTEXT                 = 65536
CONTROL_PLANE_ELIGIBLE  = NO
AUTO_ROUTE              = NO
STARTUP_DEFAULT         = NO
WF40                    = NO
SCOPE_V3                = NO
BLENDER                 = NO
LIVE_VERIFICATION       = STAGED_NOT_LIVE_VERIFIED
```

No `role_to_profile_id` entry was added or changed. In particular, the
selected `qwen38-opus-q3-agent-24k` short-turn path and scope-v3 contract are
untouched.

## Safety and validation

- Existing Control Plane eligible profiles: unchanged at exactly 6
- Existing workstation preset profiles: preserved
- Qwen generations: **0**
- Router/backend lifecycle operations: **0**
- Router restart: **NO**
- Inference/benchmark: **0**
- WF40, D-0025, Blender/MCP, Cline settings: untouched

The profile is staged for discovery after a separately authorized router
restart and single smoke test. It is not yet live-verified.

## NEXT

`CLINE64K_ROUTER_RESTART_SINGLE_SMOKE_TEST`
