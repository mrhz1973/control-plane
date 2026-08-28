# D-0025-W — primary remote GLM single smoke retry

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W_REMOTE_RUNTIME_GATE_ENABLE_AND_SINGLE_GLM_SMOKE_RETRY`  
**Date:** 2026-08-28  
**Operator authorization:** issue #31 comment `5454884137`  
**Status:** **STOP** — WF60 legacy error blocks canonical backlog→WF61 lane · gate never opened · smoke not executed

| Metric | Value |
|---|---|
| `final_gate_closed` | **true** (never enabled) |
| WF61 executions | **0** |
| provider attempts | **0** |
| retry / fallback / qwen / codex / cursor_dispatch | **0** |
| `credential_mutations` | **0** |
| `network_mutations` | **0** |
| `teamviewer_mutations` | **0** |
| `secret_exposure` | **false** |
| trigger backlog path | **not created / not pushed** (`BACKLOG_…_002.md`) |
| trigger commit SHA | **n/a** |
| cleanup commit SHA | **n/a** |

---

## Precheck (PASS)

| Check | Result |
|---|---|
| `origin/main` | `7d2567489fbc4954b56562876d21f0c95bae2427` |
| Workspace | clean |
| VPS checkout | `/root/local-files/handoff-runtime/control-plane` @ same SHA |
| Runtime gate | `enabled=false` · `provider_calls_authorized_per_event=0` |
| Helper offline suite | **18/18 PASS** |
| WF40 | active · versionId `48c30f4a-124c-48a4-b240-c2f6eca4743e` · **44** nodes in-process |
| GitHub poll 401 | **cleared** (`Bad credentials` absent on recent polls) |
| WF61 | inactive · executions **0** |
| LiteLLM | running · `/v1/models` HTTP 200 · `planner-glm-pilot` listed · no inference |
| Historical `…SMOKE_001.md` | preserved · not reused |

---

## STOP finding (precise)

### Canonical backlog lane cannot reach WF61 while WF60 execute fails

Live WF40 settings include:

```json
"executionOrder": "v1"
```

Under **v1** (position-based) ordering, siblings of `IF - New commit?` (true) are ordered by canvas position. Observed positions:

| Node | position `[x,y]` |
|---|---|
| `Execute Workflow - Resolve OpenClaw broker (WF60)` | `[-720, -160]` (**top / first**) |
| `IF - GIS repo for handoff?` | `[-720, 80]` |
| `Data Table - Upsert last seen commit` | `[-720, 320]` |
| `Code - Plan watcher repo gate stub` → backlog lane | `[-720, 752]` (**below / later**) |

Natural post-credential-repair schedule executions (sample of 8 consecutive minutes) all show the same runData pattern:

1. Schedule → … → `IF - New commit?`
2. **`Execute Workflow - Resolve OpenClaw broker (WF60)`**
3. Terminal error: **`Workflow is not active and cannot be executed.`**
4. **No** `Code - Plan watcher repo gate stub`
5. **No** `GitHub - Fetch commit details (plan files)`
6. **No** backlog detect / adapter / WF61 nodes

Therefore the preserved inactive-WF60 parallel branch **aborts the execution before the canonical backlog→adapter→WF61 lane runs**.

Per authorization / STOP rules:

- this is **not** permission to activate WF60;
- this is **not** permission to modify OpenClaw or redesign WF40;
- **close gate** (already CLOSED) and **STOP**.

### Actions not taken (correct under STOP)

| Action | Performed? |
|---|---|
| Create/push `BACKLOG_…_SMOKE_002.md` | **no** |
| Temporary VPS gate enable | **no** |
| Offline adapter arming against enabled gate | **no** (blocked before smoke prep) |
| WF61 / LiteLLM / GLM inference | **no** |
| Manual WF40/WF61 execute | **no** |
| WF60 activation / OpenClaw change | **no** |

---

## Runtime gate before / during / after

| Phase | State |
|---|---|
| before | CLOSED (`enabled=false`, calls=`0`) |
| during | CLOSED (never mutated) |
| after | CLOSED |

Host file and n8n mount path remain the canonical CLOSED origin/main content.

---

## Preservation

| Asset | State |
|---|---|
| WF40 topology / 44-node version | preserved |
| WF61 inactive / 0 exec | preserved |
| WF60 inactive | preserved (not activated) |
| OpenClaw | unchanged |
| LiteLLM | unchanged |
| GitHub credential | unchanged |
| Provider credentials | unchanged |
| `BACKLOG_…_SMOKE_001.md` | preserved |

---

## NEXT_GATE

`D-0025-W_WF40_WF60_PARALLEL_NONBLOCKING_FOR_BACKLOG_LANE` (or equivalent operator-authored gate)

Required before any GLM smoke retry:

- make the inactive-WF60 execute **non-blocking** for siblings under v1 order **or** otherwise ensure the backlog lane runs to completion without activating WF60 / without unauthorized redesign beyond what GPT-Web authors;
- only then re-authorize temporary GLM gate enable + single smoke.

---

## Output line

`STOP — WF60 legacy inactive-execute aborts WF40 before backlog lane (executionOrder v1); GATE_CLOSED=true; WF61_EXECUTIONS=0; PROVIDER_CALLS=0`
