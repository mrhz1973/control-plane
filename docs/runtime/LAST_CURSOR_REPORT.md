# LAST CURSOR REPORT

**BLOCK-ID:** `V4_QWEN_LOCAL_6_PROFILE_ROUTER_CONTROL_PLANE_INTEGRATION`  
**RUN_NONCE:** `QWEN_6_PROFILE_ROUTER_INTEGRATION_20260903_01`  
**Classification:** `QWEN_LOCAL_6_PROFILE_ROUTER_CONTROL_PLANE_INTEGRATION_PASS`  
**Timestamp (local):** 2026-09-03

## Summary

Migrated ACTIVE Control Plane contracts/config/tools/tests from legacy
`fast_8k` / `dflash_required` / abstract AGENT_16K assumptions to the
authoritative six-profile MultiModel router at `http://127.0.0.1:8080`.

- Profiles verified via `/v1/models`: **6/6**
- Startup/default: `qwen38-opus-q3-daily-16k`
- Next WF40 executor: `qwen38-dcfr-iq3-agent-24k` / FAST_AGENT
- Uncensored retained for explicit user selection only
- Scope v2 digest: `5261290cbdda414de0a6bd5ffd79e939f805eefde3fe2e39a8f490c5a2e02261`
- Real Qwen generations: **0**
- D-0025: **CLOSED**
- Prod DB: PostgreSQL **16.15** · health **200** · WF40 83 nodes active · WF61 inactive · ACTIVE auth **0**

## NEXT

`V4_WF40_FIRST_LIVE_AUTHORIZED_EXECUTION_PROOF_POST_POSTGRES_RETRY`

Evidence report:
`reports/architecture/v4_qwen_local_6_profile_router_control_plane_integration.md`
