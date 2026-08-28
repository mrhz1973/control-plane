# D-0025-W — GitHub credential repair + n8n reload

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W_GITHUB_CREDENTIAL_REPAIR_AND_N8N_RELOAD`  
**Date:** 2026-08-28  
**Operator authorization:** issue #31 comment `5454744549`  
**Status:** **PASS** — GitHub credential repaired · n8n reloaded · WF40 44-node live · gate CLOSED

| Metric | Value |
|---|---|
| `secure_repair_performed` | **true** |
| `secret_source_class` | `operator_surface_github_cli_keyring` |
| `github_auth_test` | authentication=**PASS** · HTTP **200** · `GET /repos/{owner}/{repo}/commits?per_page=1` |
| `n8n_reload_performed` | **true** (`docker restart root-n8n-1`) |
| `credential_mutations` | **1** (existing id secret replacement only) |
| `network_mutations` | **0** |
| `teamviewer_mutations` | **0** |
| `secret_exposure` | **false** |
| WF61 executions | **0** |
| provider_calls / inference | **0** |
| runtime_gate_closed | **true** |

---

## Precheck

| Check | Result |
|---|---|
| `origin/main` | `1f39d96d7eae79e77ac626776261ed934989d77e` |
| Runtime gate | `enabled=false` · `provider_calls_authorized_per_event=0` |
| WF61 count | **0** |
| Pre-repair WF40 poll | HTTP **401** · `Bad credentials` on `GitHub - Fetch latest commit (per repo)` |
| Credential metadata | id `7u1QOkEiYcdKncmd` · name `GitHub account` · type `githubApi` |
| VPS GitHub secret store | **absent** (no `gh`, no `GITHUB_*` env, secrets dir has no GitHub material) |
| Operator surface | local `gh` keyring authenticated for `mrhz1973` (metadata only; token never displayed) |

---

## Credential repair (opaque)

1. Confirmed valid replacement source on authorized operator surface: GitHub CLI OS keyring session.
2. Transferred secret **directly** via stdin pipe (`gh auth token | ssh … docker exec -i … node`) into an in-container updater.
3. Updated **only** credential id `7u1QOkEiYcdKncmd` / name `GitHub account` / type `githubApi` (identity preserved).
4. Encryption used n8n-compatible AES-256-CBC (`Salted__`) with instance encryption key read in-process; **no** plaintext credential file, **no** `export:credentials --decrypted`, **no** token in argv/stdout/stderr/Git/reports.
5. Standalone GitHub REST validation (not via WF40): **HTTP 200**.

Secret value was never logged, hashed, measured, prefixed, printed, or persisted outside the encrypted n8n credential blob.

---

## n8n reload

| Step | Result |
|---|---|
| Running executions before reload | **0** |
| Action | `docker restart root-n8n-1` only |
| LiteLLM | preserved · same container id `edbb03981626` · not restarted |
| Compose file | unchanged |
| OpenClaw / WF60 / WF61 definitions | unchanged |
| Gate file | unchanged CLOSED |

### WF40 after reload

| Field | Value |
|---|---|
| id | `9ZMj2ACTKyDVhCue` |
| active | **true** |
| published versionId | `48c30f4a-124c-48a4-b240-c2f6eca4743e` |
| node_count | **44** |
| in-process execution `activeVersionId` | `48c30f4a-124c-48a4-b240-c2f6eca4743e` |
| in-process node_count | **44** |

---

## Post-reload natural poll observation

Natural schedule execution after reload (observe-only; no test commit):

| Field | Value |
|---|---|
| exec id | `284159` |
| `Bad credentials` / GitHub poll 401 | **false** (cleared) |
| In-process graph | **44-node** published version |
| Terminal error (unrelated) | `Execute Workflow - Resolve OpenClaw broker (WF60)` → `Workflow is not active and cannot be executed.` |
| WF61 executions | still **0** |
| Provider inference | **0** |
| Runtime gate | remains CLOSED |

The WF60 inactive execute error is a **pre-existing / out-of-scope** legacy path behavior when a new commit is processed. It is **not** a GitHub credential failure and was **not** modified (OpenClaw/WF60 out of scope).

---

## Budgets / preservation

| Item | State |
|---|---|
| GLM expanded budget | unchanged **0/10** |
| Codex budget | unchanged **1/10 used** |
| WF61 | inactive · executions **0** |
| LiteLLM | unchanged |
| WF60 / OpenClaw | unchanged |
| Provider credentials (GLM/Codex/etc.) | unchanged |
| Telegram credential | unchanged |
| Primary-remote runtime gate | **CLOSED** |

---

## NEXT_GATE

`D-0025-W_REMOTE_RUNTIME_GATE_ENABLE_AND_SINGLE_GLM_SMOKE` (re-authorize / confirm) — gate still CLOSED until explicit smoke authorization; GitHub poll + 44-node in-process prerequisites for that smoke are now satisfied. Note legacy WF60 inactive execute may still fail the overall WF40 execution status on non-backlog commits; backlog→adapter→gated WF61 lane remains available under a later gate enable.
