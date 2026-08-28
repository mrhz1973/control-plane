# D-0025-W — primary remote GLM live planning cycle (001)

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001` (+ `_RETRY`, `_RETRY_2`, `_RETRY_3`)  
**Date:** 2026-08-28  
**Release evidence:** issue #31 comment `5456859595` · `5457265822` · `5457565004` · retry 3 under standing authorization  
**Standing authorization:** `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md`  
**Status:** **STOP (retry 3)** — WF61 failed again at `Parse prepare result fail-closed` (new defect: array return in per-item mode) · no LiteLLM request · gate CLOSED

---

## Attempt history

| # | Trigger | Outcome | Blocker | Fix applied |
|---|---|---|---|---|
| 1 | `8765362` | STOP | GIS `Read/Write Files from Disk` hard-fail before lane | `D-0025-W_WF40_GIS_READWRITE_NONBLOCKING` |
| 2 | `5ccb8c9` | STOP | GIS `Telegram - Send handoff file` missing binary | `D-0025-W_WF40_GIS_TELEGRAM_FILE_NONBLOCKING` |
| 3 | `7d19504` | STOP | WF61 `Can't use .first() here` (per-item `$input.first()`) | `D-0025-W_WF61_TEMPLATE_CODE_NODE_ITEM_ACCESS_FIX` |
| 4 (retry 3) | `fdbbd48` | **STOP** | WF61 `A 'json' property isn't an object` — see below | **pending GPT-Web artifact** |

---

## Attempt 4 (RETRY_3)

| Metric | Value |
|---|---|
| `final_gate_closed` | **true** |
| New WF61 executions this pass | **1** (execution `284784`, status `error`, 0.5s; total historical count 2) |
| LiteLLM requests | **0** (container logs: no `POST /v1/responses` in window) |
| GLM provider attempts | **0** (never reached HTTP node — attempt not consumed) |
| retry / fallback / qwen / codex / cursor_dispatch | **0** |
| `credential_mutations` / `network_mutations` | **0** |
| `secret_exposure` | **false** |
| GLM expanded budget | **0/10** |

### Precheck (PASS)

WF40 `07fbfca6-…` active 44 nodes · 4 nonblocking nodes true · WF61 inactive `e231817d-…` 13 nodes five jsCode fixed `$input.first()`=0 · hist exec 1 · gate CLOSED · LiteLLM 200 no inference · backlog YAML intact `D-0025-W-GLM-LIVE-001`.

### Execution

1. Fresh trigger commit `fdbbd487f343fdc1c83fa233c7e1b74864282bc7` (`Retry trigger 3: 2026-08-28 — WF61 item access fixed; execute same task D-0025-W-GLM-LIVE-001.` outside YAML).
2. Temp GLM gate armed; WF61 temporarily activated; offline adapter **REMOTE_DISPATCH_READY** (`preferred=glm`, `fallback=[]`, `gate_only`, `task_id=D-0025-W-GLM-LIVE-001`).
3. Pushed; natural poll: WF40 `284783` dispatched WF61.

### STOP finding (precise)

WF61 execution `284784` ran: Execute trigger → `Validate canonical ingress + encode` OK → `Execute Command - canonical prepare` OK → **`Parse prepare result fail-closed` ERROR**:

```
A 'json' property isn't an object [item 0]
```

Root cause: the GPT-Web corrected `jsCode` (from `d0025-w-wf61-code-node-item-access-fix.gpt-web.json`) keeps `mode: "runOnceForEachItem"` but **returns an array**: `return [{json:{…}}]`. In per-item mode n8n expects the return value to be a **single item object** `{json:{…}}`; an array has no `json` property → n8n rejects it. The same pattern (`return [{json:…}]`) exists in all five fixed nodes, so the same failure would recur at each.

Failure again occurred **before** `HTTP Request - LiteLLM primary one-shot`: LiteLLM container logs confirm zero `/v1/responses` calls; the single authorized provider attempt remains **unconsumed**; GLM budget stays 0/10.

Runtime restored at first terminal result: gate CLOSED · WF61 inactive.

---

## NEXT_GATE

GPT-Web bounded WF61 template artifact v2: in the five `runOnceForEachItem` Code nodes change `return [{json:{…}}]` to `return {json:{…}}` (single item object), keeping everything else identical. Then re-apply to source template + live WF61 (inactive) and run one more bounded GLM window with a fresh trigger. Parent lane and prepare stage are now proven; only the Code-node return shape remains.

---

## Output line

`STOP — WF61 Parse prepare result fail-closed rejects array return in runOnceForEachItem mode (A 'json' property isn't an object; GPT-Web jsCode returns [{json:…}] where per-item requires {json:…}); GATE_CLOSED=true; WF61_NEW_EXECUTIONS=1; PROVIDER_CALLS=0`
