# D-0025-W — packet final_report_contract planner hardening (offline)

**Block ID:** `D0025_W_PACKET_FINAL_REPORT_CONTRACT_HARDENING`  
**Starting HEAD:** `6e6beebee26b4ff1f2aac5fb71f263c109b2b15e`  
**Artifact:** `docs/runtime/PATCH_D0025_W_PACKET_FINAL_REPORT_CONTRACT_HARDENING.gpt-web.json`  
**Status:** **PASS** — offline instruction hardening only (no live resume)

## Apply

| Mutation | Result |
|---|---|
| `tools/build-openclaw-responses-request.mjs` `PLANNER_INSTRUCTIONS` | +2 exact lines after hard_constraints instruction |
| `docs/contracts/openclaw-execution-packet-consumer-v1.md` §3 | +2 exact lines (same text) |
| Each new line occurrence | **1** in builder · **1** in contract |
| `execution-packet-v1.schema.json` | unchanged · `final_report_contract` still required + const |
| Autofill / schema weaken / workflows / normalizer | none |

## Validation

| Check | Result |
|---|---|
| openclaw-request-builder | PASS 15/15 |
| llm-gateway-request-shape | PASS 4/4 |
| llm-gateway-portability | PASS 19/19 |
| execution-packet-validator | PASS 5/5 |
| execution-packet-policy-gate | PASS 15/15 |
| `git diff --check` | PASS |
| provider_calls | **0** |
| runtime gate | CLOSED |

## NEXT

One bounded live resume of `D-0025-W-GLM-LIVE-001` (max one LiteLLM/GLM attempt; retry=0; fallback=0). Not executed in this pass.
