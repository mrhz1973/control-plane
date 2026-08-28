# D-0025-W — WF61 Code node item access fix apply

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W_WF61_TEMPLATE_CODE_NODE_ITEM_ACCESS_FIX`  
**Date:** 2026-08-28  
**Standing authorization:** `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md`  
**GPT-Web artifact:** `workflows/patches/d0025-w-wf61-code-node-item-access-fix.gpt-web.json`  
**Source template:** `workflows/61-litellm-primary-remote-planner.template.json`  
**Status:** **PASS** — five per-item Code nodes fixed · WF61 INACTIVE · gate CLOSED · provider calls 0

| Metric | Value |
|---|---|
| Mutations | **only** five `jsCode` fields |
| `provider_calls` | **0** |
| `inference` | **0** |
| `credential_mutations` | **0** |
| `network_mutations` | **0** |
| `teamviewer_mutations` | **0** |
| `secret_exposure` | **false** |
| WF61 activation | **never** (import deactivation semantics only; stayed inactive) |

---

## Precheck

| Check | Result |
|---|---|
| `origin/main` | `2f04bddc74c852191c2f9e50a68224f94910cfe9` (artifact) |
| Workspace | clean |
| Runtime gate | `enabled=false` · `provider_calls_authorized_per_event=0` |
| Live WF61 pre | id `d0025-6100-4001-8001-000000000061` · **inactive** · 13 nodes · 5 targets `runOnceForEachItem` · invalid `$input.first()` count **3** (other 2 use cross-node `.first()`) · versionId `30c539f8-5c6b-46b2-912a-8c246f72ffe4` |
| WF61 executions | 1 (historical `284723`; unchanged) |

---

## Target nodes (all fixed)

| # | Node id | Name | Invalid access before |
|---|---|---|---|
| 1 | `d0025-6104-4004-8004-000000000004` | Parse prepare result fail-closed | `$input.first()` + `$('…').first()` |
| 2 | `d0025-6107-4007-8007-000000000007` | Capture HTTP body + status | `$input.first()` + `$('…').first()` |
| 3 | `d0025-6110-4010-8010-000000000010` | Return canonical cycle result | `$input.first()` + `$('…').first()` |
| 4 | `d0025-6111-4011-8011-000000000011` | Return prepare failure without HTTP | `$('…').first()` |
| 5 | `d0025-6112-4012-8012-000000000012` | Return HTTP failure no retry | `$('…').first()` |

Fix rules applied (verbatim from GPT-Web artifact): current item → `$json`; cross-node → `$('Node name').item.json`; `mode=runOnceForEachItem` **preserved** on all five.

---

## Apply — source template

- Local apply via exact `replace_jsCode_with` substitution per node.
- Invalid `$input.first()` in targets: **3 → 0**.
- Graph equivalence vs pre-template: **PASS — only the five jsCode fields differ**.
- Non-target `Validate canonical ingress + encode` (mode `runOnceForAllItems`) untouched — `$input.first()` valid there.
- Structural suite `wf61-structural-pass` **PASS** (8/8 pre-existing local failures unchanged — Windows env lacks ajv; not caused by this fix; verified identical on clean stash).
- Commit: `10bb1791f42e44de5aa3899f0caaead77ec6eb29`.

## Apply — live WF61

- VPS pulled corrected template; five jsCode re-verified exact against artifact.
- Staged import: template + deterministic id `d0025-6100-4001-8001-000000000061` · `active=false` · **no publish** (never activated).
- `n8n import:workflow` → re-export verified: **inactive** · **13 nodes** · five jsCode corrected · modes `runOnceForEachItem` · DB `active=0`.
- Live versionId: `30c539f8-…` → `e231817d-772c-4db0-80e6-3409fe259059`.
- Bounded `docker restart root-n8n-1` for in-process load; LiteLLM container id unchanged.

---

## Preservation

| Asset | State |
|---|---|
| Workflow id/name / all 13 nodes / ids / names / types / typeVersions / positions | preserved |
| Modes / connections / `executionOrder` | preserved |
| HTTP node + prepare/finalize Execute Command parameters | preserved |
| retry=0 / fallback=0 / `cursor_dispatch_allowed=false` semantics | preserved |
| WF40 | unchanged (active · 44 nodes · versionId `07fbfca6-…` verified post-apply) |
| WF60 / OpenClaw / LiteLLM / credentials / network / Tailscale / TeamViewer | unchanged |

---

## NEXT_GATE

Resume `D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001`: fresh trigger commit + one bounded GLM window (max 1 WF61 execution — the historical count is 1, so the next run is execution 2 total but the **first reaching LiteLLM**; max 1 GLM provider attempt; retry=0; fallback=0).
