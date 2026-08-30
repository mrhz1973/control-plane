# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF61 structural regression baseline **RECONCILED** (18/18). V4 n8n routing bridge deliverable remains in preservation stashes awaiting commit-resume. |
| **BLOCCO ATTIVO** | `V4_N8N_EXECUTION_ROUTING_BRIDGE_COMMIT_RESUME_ONE_PASS` |
| **STATO BLOCCO** | WF61_STRUCTURAL_BASELINE_GREEN / BRIDGE_STASHED_READY / D0025_CLOSED / GATE_CLOSED |
| **GATE CORRENTE** | **CLOSED** · D-0025 remains closed · no live OpenCode/Qwen/provider generation authorized without a later fresh AUTH |
| **NEXT** | `V4_N8N_EXECUTION_ROUTING_BRIDGE_COMMIT_RESUME_ONE_PASS` — restore `v4-n8n-routing-bridge-fixed-preserve`, preserve canonical remote docs, verify bridge target once + green regressions once, then commit/push the completed bridge. Do **not** author the GPT-Web-owned WF40 patch here. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved · structural test aligned to post-`00f0132` executeCommand transport |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **ADAPTER REGISTRY v1** | **IMPLEMENTED** · default `opencode+qwen_local` |
| **N8N ROUTING BRIDGE v1** | **IMPLEMENTED OFFLINE (stashed)** · target 23/23 already proven · awaiting commit-resume after baseline reconciliation |

## Authorization / D-0025

- D-0025: **CLOSED** (not reopened by this maintenance pass)
- No live OpenCode/Qwen/provider call authorized
- Bridge preservation stashes kept (not restored in this pass):
  - `v4-n8n-routing-bridge-fixed-preserve`
  - `v4-n8n-routing-bridge-correction-preserve`

## Boundaries

- Do **not** mutate WF40/WF61/WF60/n8n/LiteLLM/OpenClaw/network/secrets.
- Do **not** reopen D-0025 or issue #31.
- External single-generation guard remains the hard max-one generation boundary for OpenCode.

## Puntatori

- This reconciliation: `reports/architecture/wf61_structural_regression_baseline_reconciliation.md`
- WF61 template: `workflows/61-litellm-primary-remote-planner.template.json`
- Canonical resync: `00f01325eaf2f218d0dc3578ec1eed278cbd4403`
- Registry: `tools/v4-execution-adapter-registry-v1.mjs`
