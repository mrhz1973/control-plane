# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — one bounded live resume of `D-0025-W-GLM-LIVE-001` after required/empty-field hardening |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / FULLRESPONSE_UNWRAP_LIVE_PROVEN / REQUIRED_EMPTY_FIELDS_HARDENING_APPLIED / LIVE_RESUME_AUTHORIZED_ONE_EVENT` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED for one bounded live resume** — arm exactly one provider event, then CLOSE |
| **NEXT** | Execute exactly one `D-0025-W-GLM-LIVE-001` cycle; verify complete Execution Packet; no retry/fallback |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** until temporary window · unwrap + planner hardenings retained |
| **REMOTE RUNTIME GATE** | baseline CLOSED; one-event window authorized for this block only |
| **LITELLM LIVE** | preserved · **8** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **8/10** · Codex **1/10 used** |

## Boundaries

- Hard maxima: WF61 ≤1 · LiteLLM `/v1/responses` ≤1 · GLM ≤1.
- retry=0 · fallback=0 · qwen=0 · codex=0 · cursor auto-dispatch=0.
- Arm gate before pushing the trigger commit.
- At first terminal result: close gate and deactivate WF61.
- Do not mutate schema/unwrap/normalizer/workflows/hardenings in this live pass.
- Do not execute any generated packet in this pass.

## Puntatori

- Hardening report: `reports/architecture/d0025_packet_required_empty_fields_hardening.md`
- Live rollup: `reports/architecture/d0025_primary_remote_glm_live_001.md`
- Issue **#31** — OPEN
