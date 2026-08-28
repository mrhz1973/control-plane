# D-0025-W — VPS schema engine

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W-VPS-SCHEMA-ENGINE`  
**Date:** 2026-08-28  
**Status:** **PASS** — `SCHEMA_ENGINE_LIVE_READY`  
**Operator authorization:** issue #31 comments `5452963595` (mount PASS review) · standing AUTO-VIA `5452941338`  
**Runtime mutations:** bounded (isolated npm install to shared handoff-runtime path only)  
**Compose / n8n recreate:** 0  
**Inference / provider calls:** 0  
**Credential / OAuth mutations:** 0  
**Secret exposure:** false  
**TeamViewer / WORK-PC network mutations:** 0

## Result summary

| Field | Value |
|---|---|
| Install classification | **NEW** |
| Host path | `/root/local-files/handoff-runtime/schema-engine` |
| Container `node_modules` | `/files/handoff-runtime/schema-engine/node_modules` |
| npm (container) | **11.12.1** |
| Ajv | **8.20.0** |
| ajv-formats | **3.0.1** |
| Resolver env | `CONTROL_PLANE_AJV_NODE_MODULES` |
| Valid fixture | **PASS** |
| Invalid fixture | **FAIL_CLOSED** (`MISSING_REQUIRED_FIELD`) |
| Primary-cycle offline finalize | **PASS** |
| n8n container | **unrestarted** |
| litellm-primary | **unchanged** |

---

## Precheck

| Check | Result |
|---|---|
| WORK-PC repo | clean · `86ce74735c68ecfb4c2f01e4889ab96b040627ba` |
| issue #31 | **OPEN** |
| `root-n8n-1` | running · n8n **2.19.5** |
| `litellm-primary` | running |
| `root_default` / `root_n8n_data` | present |
| control-plane mount | present · **RW=false** |
| canonical validator | readable at `/files/handoff-runtime/control-plane/tools/validate-execution-packet-v1.mjs` |
| schema-engine target collision | **absent** before install |

---

## Install surface

| Constraint | Result |
|---|---|
| Installed in control-plane repo | **no** |
| Installed in `/home/node/.n8n` | **no** |
| Global npm install | **no** |
| Container image mutation | **no** |
| Host system npm install | **no** |
| Compose edit | **no** |
| n8n recreate/restart | **no** |

### Install method

Container `node` user (uid 1000) cannot write under `/files/handoff-runtime` (root-owned `755`). Install used **container npm as root** (`docker exec -u root`) to create the isolated target under the already-shared bind mount — no host `chmod`/`chown`, no compose change.

```bash
docker exec -u root root-n8n-1 mkdir -p /files/handoff-runtime/schema-engine
docker exec -u root \
  -e npm_config_cache=/files/handoff-runtime/schema-engine/.npm-cache \
  root-n8n-1 \
  npm install \
    --prefix /files/handoff-runtime/schema-engine \
    --package-lock=false \
    --ignore-scripts \
    --no-audit \
    --no-fund \
    ajv@8.20.0 \
    ajv-formats@3.0.1
```

Packages added: **6** (ajv + ajv-formats + normal dependencies). npm registry traffic only.

---

## Version verification

Resolved from `/files/handoff-runtime/schema-engine/node_modules`:

| Package | Version |
|---|---|
| `ajv` | **8.20.0** |
| `ajv-formats` | **3.0.1** |

Control-plane checkout worktree: **clean** (no repo dependency delta).

---

## Canonical validator live tests

**Env:** `CONTROL_PLANE_AJV_NODE_MODULES=/files/handoff-runtime/schema-engine/node_modules`

### Valid fixture

**File:** `tests/execution-packet-validator/fixtures/valid-packet.json`

```json
{"ok":true,"classification":"PASS","reason":"Packet validates against execution-packet-v1.schema.json",...}
```

### Invalid fixture

**File:** `tests/execution-packet-validator/fixtures/invalid-missing-required.json`

```json
{"ok":false,"classification":"MISSING_REQUIRED_FIELD","reason":"Missing required field: goal",...}
```

Exit code: **non-zero** (fail-closed).

---

## Primary-cycle offline compatibility

**Method:** `run-litellm-primary-cycle.mjs finalize` inside `root-n8n-1` with same resolver env; fixtures:

- `tests/openclaw-consumer-roundtrip/fixtures/consumer-input-valid.json`
- `tests/openclaw-consumer-roundtrip/fixtures/synthetic-response-valid.json`

**Result:** `"ok":true`, `"response_gate":"PASS"`, `"policy":{"decision":"PROCEED","cursor_dispatch_allowed":false}`

No HTTP LiteLLM call. No provider/inference.

---

## n8n / LiteLLM safety (before = after)

| Entity | Container ID | StartedAt |
|---|---|---|
| `root-n8n-1` | `ef3520640a8e7006a58655109b8da3c69af40a03da6b79de4865723b67077568` | `2026-08-28T13:11:52.618956662Z` |
| `litellm-primary` | `e9b3828c59922a00474d88a7f205b2fe35ce4d1dfc4bc65190636c76a8cb922a` | `2026-08-28T11:22:56.302613323Z` |

| Check | Result |
|---|---|
| n8n image ID changed | **no** |
| n8n recreate | **no** |
| litellm host ports | **0** |
| WF40/WF60 workflow mutation | **none** |
| WF61 | **absent** |

---

## Scope budget

| Metric | Value |
|---|---|
| provider_calls | 0 |
| inference | 0 |
| GLM / Codex / Qwen | 0 |
| compose mutations | 0 |
| credential/OAuth mutations | 0 |
| package install scope | isolated schema-engine path only |
| secret_exposure | false |

---

## Preserved (not touched)

- control-plane read-only mount
- LiteLLM config/credentials
- OpenClaw / WF40 / WF60 live state
- VPS checkout (no pull/fetch/reset)
- WORK-PC network/TeamViewer

---

## Next separate gates

1. Header Auth credential binding
2. WF61 inactive import
3. Parent WF40 wiring (later)

Issue **#31** remains **OPEN**.
