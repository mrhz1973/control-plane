# D-0025-W — packet required/empty-field planner hardening (offline)

**Block ID:** `D0025_W_PACKET_REQUIRED_EMPTY_FIELDS_HARDENING`  
**Starting HEAD:** `d4ee4ab8411ef3567e820230599991d6b3329c48`  
**Artifact:** `docs/runtime/PATCH_D0025_W_PACKET_REQUIRED_EMPTY_FIELDS_HARDENING.gpt-web.json`  
**Status:** **PASS** — offline instruction hardening only (no live resume)

## Apply

| Mutation | Result |
|---|---|
| `tools/build-openclaw-responses-request.mjs` `PLANNER_INSTRUCTIONS` | +3 exact lines after `final_report_contract` instruction |
| `docs/contracts/openclaw-execution-packet-consumer-v1.md` §3 | +3 exact lines (same text) |
| Each new line occurrence | **1** in builder · **1** in contract |
| Required-key manifest vs schema `required[]` | exact match (26 keys, order preserved) |
| `allowed_paths` / `forbidden_paths` | remain required; empty `[]` retention instructed |
| `execution-packet-v1.schema.json` | unchanged |
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
