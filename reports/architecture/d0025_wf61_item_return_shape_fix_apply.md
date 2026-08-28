# D-0025-W — WF61 per-item return shape fix apply

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W_WF61_TEMPLATE_ITEM_RETURN_SHAPE_FIX`  
**Date:** 2026-08-28  
**Standing authorization:** `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md`  
**GPT-Web artifact:** `workflows/patches/d0025-w-wf61-item-return-shape-fix.gpt-web.json`  
**Source template:** `workflows/61-litellm-primary-remote-planner.template.json`  
**Status:** **PASS** — five per-item return shapes fixed · WF61 INACTIVE · gate CLOSED · provider calls 0

| Metric | Value |
|---|---|
| Mutations | **only** five `jsCode` return-shape fields |
| `provider_calls` | **0** |
| `inference` | **0** |
| `credential_mutations` | **0** |
| `network_mutations` | **0** |
| `teamviewer_mutations` | **0** |
| `secret_exposure` | **false** |
| WF61 activation | **never** (import only; stayed inactive) |

---

## Precheck

| Check | Result |
|---|---|
| `origin/main` | `1f46638ccce5dad9bcd8d03ac2236cc334ee2a97` (artifact) |
| Workspace | clean after pull |
| Runtime gate | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| LiteLLM `/v1/responses` | **0** (unchanged) |
| Live WF61 pre | id `d0025-6100-4001-8001-000000000061` · **inactive** · 13 nodes · five targets `runOnceForEachItem` · item-access fix present · invalid `return [{json:…}]` count **5** · versionId `e94c8529-bf3c-4f0e-b09c-2dca6dfa0dad` |
| WF61 executions | **2** (historical `284723`, `284784`; unchanged) |
| WF40 | active · `9ZMj2ACTKyDVhCue` · 44 nodes · unchanged |

---

## Target nodes (all fixed)

| # | Node id | Name | Mode before/after | Invalid return before |
|---|---|---|---|---|
| 1 | `d0025-6104-4004-8004-000000000004` | Parse prepare result fail-closed | `runOnceForEachItem` / same | `return [{json:…}]` |
| 2 | `d0025-6107-4007-8007-000000000007` | Capture HTTP body + status | `runOnceForEachItem` / same | `return [{json:…}]` |
| 3 | `d0025-6110-4010-8010-000000000010` | Return canonical cycle result | `runOnceForEachItem` / same | `return [{json:…}]` |
| 4 | `d0025-6111-4011-8011-000000000011` | Return prepare failure without HTTP | `runOnceForEachItem` / same | `return [{json:…}]` |
| 5 | `d0025-6112-4012-8012-000000000012` | Return HTTP failure no retry | `runOnceForEachItem` / same | `return [{json:…}]` |

Fix rule (verbatim from GPT-Web artifact): preserve per-item access (`$json`, linked `.item.json`) and logic; change only final return to one item object `return {json:…}`.

---

## Apply — source template

- Local apply via exact `replace_jsCode_with` substitution per node.
- Invalid array-return count in targets: **5 → 0**.
- No target contains `$input.first()`.
- Graph equivalence vs pre-template (`1f46638`): **PASS — only the five jsCode fields differ**.
- Structural suite `wf61-structural-pass` **PASS** (8/8 pre-existing local ajv failures unchanged).
- Commit: `8812c1b6f22f92da1b9efa00fbd5d462c7341df3`.

## Apply — live WF61

- VPS pulled corrected template (`8812c1b`).
- Staged import: template + deterministic id `d0025-6100-4001-8001-000000000061` · `active=false` · **no publish**.
- `n8n import:workflow` → re-export verified: **inactive** · **13 nodes** · five jsCode corrected · modes `runOnceForEachItem` · DB `active=0`.
- Live versionId: `e94c8529-…` → `ab504cd5-1f14-4097-9e78-6aa6cf10cd1a`.
- Bounded `docker restart root-n8n-1` for in-process load; LiteLLM container id unchanged.

---

## Preservation

| Asset | State |
|---|---|
| Workflow id/name / all 13 nodes / ids / names / types / typeVersions / positions | preserved |
| Modes / connections / `executionOrder` | preserved |
| Per-item access (`$json`, `.item.json`) | preserved |
| HTTP node + prepare/finalize Execute Command parameters | preserved |
| retry=0 / fallback=0 / `cursor_dispatch_allowed=false` semantics | preserved |
| WF40 | unchanged (active · 44 nodes verified post-apply) |
| WF60 / OpenClaw / LiteLLM / credentials / network / Tailscale / TeamViewer | unchanged |

---

## NEXT_GATE

Resume `D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001`: fresh trigger commit (retry 4) + one bounded GLM window (max 1 new WF61 execution; max 1 GLM provider attempt; retry=0; fallback=0).
