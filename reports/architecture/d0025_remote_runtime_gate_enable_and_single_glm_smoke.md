# D-0025-W — remote runtime gate enable + single GLM smoke

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W_REMOTE_RUNTIME_GATE_ENABLE_AND_SINGLE_GLM_SMOKE`  
**Date:** 2026-08-28  
**Operator authorization:** issue #31 comment `5454611166`  
**Selected planner:** GLM  
**Status:** **STOP** — smoke not executed · gate remains CLOSED

| Metric | Value |
|---|---|
| Gate enabled on VPS / origin | **false** (never pushed enabled) |
| WF61 executions this pass | **0** |
| Provider / inference attempts | **0** |
| Retry / fallback / Qwen / Cursor dispatch | **0** |
| Credential mutations | **0** (forbidden by auth; not attempted) |
| LiteLLM / WF60 / OpenClaw mutations | **0** |
| Secret values displayed / logged / persisted | **false** |

---

## Precheck (PASS items)

| Check | Result |
|---|---|
| `origin/main` at handoff | `39fffdebeffd872b1015c5ed76f1c8acec3e7103` |
| Workspace | clean before local prep; gate never left enabled on remote |
| Helper offline suite | **18/18 PASS** (with gate restored CLOSED) |
| Canonical runtime gate (VPS + restored local) | `enabled=false` · `provider_calls_authorized_per_event=0` |
| WF40 export | id `9ZMj2ACTKyDVhCue` · active **true** · versionId `48c30f4a-124c-48a4-b240-c2f6eca4743e` · **44 nodes** |
| WF61 | id `d0025-6100-4001-8001-000000000061` · active **false** · **execution count = 0** |
| LiteLLM | `litellm-primary` running · `/v1/models` lists `planner-glm-pilot` + `planner-codex-pilot` · **no chat/completions** this pass |
| VPS checkout | `/root/local-files/handoff-runtime/control-plane` @ `39fffde…` |
| Other pending BACKLOG_ trigger commit | none observed (existing `BACKLOG_D0014_…` is historical; not a new unprocessed commit in this pass) |
| Schedule | `minutesInterval: 1` |

---

## STOP finding (blocking)

### 1. WF40 GitHub poll path returns HTTP 401 (primary blocker)

Every recent WF40 scheduled execution fails at:

- **Node:** `GitHub - Fetch latest commit (per repo)`
- **Credential (metadata only):** id `7u1QOkEiYcdKncmd` · name `GitHub account` · type `githubApi`
- **Error:** `NodeApiError` · HTTP **401** · description `Bad credentials` · message `Authorization failed - please check your credentials`

Observed execution DB (host-mounted n8n sqlite, read-only):

- WF40 status breakdown: **error only** (count ≥ **5104** in window `2026-08-25` → `2026-08-28`)
- WF40 successes in DB: **0** (in queried table)
- WF61 executions: **0**

Because the poll dies before commit-file classification, the live path:

`GitHub backlog commit → WF40 backlog lane → adapter → WF61 → LiteLLM → planner-glm-pilot`

**cannot run** until GitHub credential validity is restored by a **separate** credential/OAuth authorization (explicitly **out of scope** for comment `5454611166`).

### 2. In-process WF40 graph still on pre-wiring version (secondary)

| Source | versionId / activeVersionId | nodes |
|---|---|---|
| DB `workflow_entity` / export | `48c30f4a-124c-48a4-b240-c2f6eca4743e` | **44** |
| Latest execution `workflowData` | `86ed5569-ce2b-49bb-9f3b-30f4e7fa918b` | **35** |

n8n has not loaded the published 44-node parent lane into the running process (publish without process reload). Even after credential repair, a **bounded n8n-only reload/restart** will be required before the backlog→WF61 lane can fire. Not performed this pass (would not unblock 401; avoid unauthorized / unnecessary host mutation while STOP).

---

## Actions taken / not taken

| Action | Done? |
|---|---|
| Temporarily enable gate locally (prep) | yes, then **restored CLOSED** before any push |
| Push enabled gate | **no** |
| VPS gate enable / pull of enabled gate | **no** (VPS file remained CLOSED) |
| Persist GPT-B backlog artifact | **yes** → `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_SMOKE_001.md` |
| Trigger smoke via backlog commit under enabled gate | **no** |
| WF61 / LiteLLM inference | **no** |
| Credential mutation | **no** |
| n8n restart | **no** |

---

## Budget consumption (this pass)

| Budget | Used |
|---|---|
| WF61 executions | **0 / 1** authorized |
| Provider calls / inference | **0 / 1** authorized |
| GLM expanded planner budget | still **0/10** |
| Codex | unchanged (**1/10 used**) |

---

## Required next operator gates (not this pass)

1. **Credential repair authorization** — restore valid GitHub API auth for `7u1QOkEiYcdKncmd` / `GitHub account` without exposing secret values in logs/reports.
2. **Bounded n8n reload** — so in-process WF40 matches published 44-node `48c30f4a-…`.
3. **Re-issue smoke authorization** (or confirm comment `5454611166` still applies) after (1)+(2): enable gate GLM-healthy → sync VPS → single backlog trigger → one WF61/GLM call → restore gate CLOSED.

---

## Artifacts

- Backlog (verbatim GPT-B): `docs/runtime/BACKLOG_D0025_PRIMARY_REMOTE_GLM_SMOKE_001.md`
- Gate file: `configs/planner/primary-remote-runtime-gate.json` (**CLOSED**)
- This report: `reports/architecture/d0025_remote_runtime_gate_enable_and_single_glm_smoke.md`
