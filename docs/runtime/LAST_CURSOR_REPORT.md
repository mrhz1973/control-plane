# LAST CURSOR REPORT

**BLOCK-ID:** `V4_CLINE24K_DEV_PROFILE_PLACEMENT_REMEDIATION_V1`
**Classification:** `CLINE24K_DEV_PROFILE_PLACEMENT_REMEDIATION_PASS`
**Timestamp (local):** 2026-09-05

## Summary

Implemented operator decision **B** (reduce dedicated DEV context). Created
workstation-only DEV profile **`qwen38-opus-q3-cline-24k`** (ctx 24576, same
OPUS Q3 Q3_K_M GGUF, n-gpu-layers 50, KV q4_0/q4_0, parallel 1, threads 20,
flash-attn on, jinja on, reasoning off) — a distinct
`workstation_dev_executor_profile` member instead of reusing the
Control-Plane-eligible Agent24K identity, preserving DEV/production
architectural isolation. **Cline64K fully preserved** (INI stanza
byte-identical, runtime entry untouched, still exposed post-reload, still
explicitly selectable).

Repo deltas: `qwen-local-runtime.json` additive 24K manual-profile entry
only; `local-dev-executor-v1.mjs` `DEFAULT_DEV_PROFILE_ID` 64k→24k; new
deterministic regression (24K default + isolation + 64K preserved). Tests:
21/21 + 42/42 + 14/14 PASS; `git diff --check` PASS; three
qwen-local suites' failures verified IDENTICAL at base HEAD via temp
worktree (pre-existing production drift, not this delta).

Local INI: timestamped backup + SHA-256 before/after recorded (backup NOT
committed). Canonical router reload via
`Start-Qwen-MultiModel-16K.ps1` (launched exactly once; only the canonical
router tree stopped; residue 0; no reconstructed backend commands).
Post-reload: 10 IDs, cline-24k exposed exactly once, cline-64k preserved, no
duplicates, no orphan instance.

Single smoke (ONLY generation this pass): `CLINE24K_OK` prompt, 32-token
cap → **16 059 ms wall INCLUDING cold model load**, 22+32 tokens,
~0.50 s/token vs the 64K baseline's 3-4 s/token. `<think>` preamble consumed
the token cap (exact_match false) — known caveat, unchanged classification.
Live instance verified: alias/ctx 24576/layers 50/KV q4_0 all active; exactly
ONE model instance resident. Placement materially improved: private
**11 681 MB < 12 GB VRAM** (64K was 14 188 MB oversubscribed); VRAM post
10.9 GiB.

QWEN_GENERATIONS_THIS_PASS=1 · OpenCode 0 · LOCAL_DEV_EXECUTOR 0 ·
production unchanged (WF40/D0025/role mappings/eligible set untouched) ·
real dev executions complete remains 0.

## NEXT

`V4_LOCAL_DEV_EXECUTOR_QWEN_FIRST_COMPLETE_LIVE_PROOF_CLINE24K_V1` — first
complete LOCAL_DEV_EXECUTOR live proof on the 24K DEV default with the
already-proven 10-turn / 600-second envelope unless new evidence requires
otherwise.
