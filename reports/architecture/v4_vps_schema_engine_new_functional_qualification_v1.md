# V4 schema-engine NEW functional qualification

**TASK_REF:** `V4_VPS_SCHEMA_ENGINE_NEW_FUNCTIONAL_QUALIFICATION_V1`
**Issue:** #68
**Classification:** `PASS`
**Timestamp (UTC):** `2026-09-07T08:34:50Z`
**BASE_HEAD:** `7bbe1c07eca7400b4fb09ca6367a1da7740e2d9f`
**Host:** NEW `31.70.139.73` (OLD not contacted)

```text
SCHEMA_ENGINE_FUNCTIONAL_QUALIFICATION=PASS
SCHEMA_ENGINE_HOST_TREE=PASS
SCHEMA_ENGINE_CONTAINER_BIND=PASS
SCHEMA_ENGINE_RESOLVER=PASS
SCHEMA_ENGINE_AJV_VERSION=8.20.0
SCHEMA_ENGINE_AJV_FORMATS_VERSION=3.0.1
SCHEMA_ENGINE_VALID_FIXTURE=PASS
SCHEMA_ENGINE_INVALID_FIXTURE=FAIL_CLOSED_MISSING_REQUIRED_FIELD
SCHEMA_ENGINE_NETWORK_RUNTIME=NONE
SCHEMA_ENGINE_RESTART_PERSISTENCE=STRUCTURALLY_PROVEN_BY_SHARED_BIND
SCHEMA_ENGINE_MIGRATION_STATUS=MIGRATED_VALIDATED
SCHEMA_ENGINE_HIGHER_LEVEL_OFFLINE_SMOKE=NOT_REPLAYED_CURRENT_SCOPE
OLD_CHANGED=NO
SECRET_VALUES_EXPOSED=0
```

No install, compose edit, container recreate, GOI mutation, or provider call. F03 aggregate rollup left frozen at 15/14/0/1.

## Precheck

Git `main` matched expected base. NEW n8n health 200 on `127.0.0.1:5678` only. LiteLLM unpublished. PostgreSQL healthy.

## Container IDs (before = after)

| Entity | ID | StartedAt |
|---|---|---|
| `root-n8n-1` | `d20d2ddb448a279ef377436e2511aebc6598076b2d4b82de2714bd2f1559cc95` | `2026-09-06T22:05:03.330957826Z` |
| `litellm-primary` | `db6114dec6980e9283c3bca8a24d1cf97c7e0ac6ad847634a69c25df94443eaf` | `2026-09-06T22:09:18.4978513Z` |
| `root-postgres-1` | `62aceb825bffb1746d50f298b956989d9ef854c5834f66a5001d8ab7ad2a688d` | `2026-09-06T22:02:45.659581507Z` healthy |

RestartCount remained 0. n8n health 200 after validator runs.

## GOI PIDs (before = after)

GraphHopper `185266` · ORS `368923` · nginx `373425` · D-Flight `386202` · GIS `392537` · Nav `400862`. All active/disabled. Listeners unchanged. No new schema-engine listener.

## Host tree

`/root/local-files/handoff-runtime/schema-engine` `755` `root:root` with `node_modules/ajv` and `node_modules/ajv-formats` readable. Host package.json: ajv 8.20.0, ajv-formats 3.0.1. No npm install.

## Container bind / persistence

`root-n8n-1` Mounts:

- `/root/local-files` → `/files` RW
- `/root/local-files/handoff-runtime/control-plane` → `/files/handoff-runtime/control-plane` RO

Inside container: `/files/handoff-runtime/schema-engine`, `.../node_modules`, `.../control-plane` present. Schema-engine is reached via the umbrella `/files` bind (not a dedicated compose volume).

Effective compose `/root/docker-compose.yaml` (project `root`):

- `./local-files:/files`
- control-plane RO overlay

`n8n-compose.service` is enabled/active. Ordinary container recreation keeps `/files/handoff-runtime/schema-engine/node_modules` reachable through that persistent host bind. Classification: `STRUCTURALLY_PROVEN_BY_SHARED_BIND` (not a reboot proof).

## Resolver provenance

Canonical `tools/validate-execution-packet-v1.mjs` `resolveAjvModules()` puts `process.env.CONTROL_PLANE_AJV_NODE_MODULES` first in `require.resolve` paths.

`CONTROL_PLANE_AJV_NODE_MODULES` is **not** persisted in n8n container Config.Env or compose. It is **supplied at validator invocation**.

This run:

`CONTROL_PLANE_AJV_NODE_MODULES=/files/handoff-runtime/schema-engine/node_modules`

Resolved:

- `/files/handoff-runtime/schema-engine/node_modules/ajv/dist/2020.js` (8.20.0)
- `/files/handoff-runtime/schema-engine/node_modules/ajv-formats/dist/index.js` (3.0.1)

Not `/home/node/.n8n`, not global npm product path, not control-plane `node_modules`.

## Fixtures

Valid: exit 0, `ok=true`, `classification=PASS`.

Invalid-missing-required: exit 1, `ok=false`, `classification=MISSING_REQUIRED_FIELD`, `reason=Missing required field: goal` (Ajv `required` / `missingProperty=goal`). Not a module-resolution crash.

## Optional higher-level smoke

`SCHEMA_ENGINE_HIGHER_LEVEL_OFFLINE_SMOKE=NOT_REPLAYED_CURRENT_SCOPE`

Historical D-0025-W used `run-litellm-primary-cycle.mjs finalize` with file fixtures. Current CLI requires `--consumer-b64` / `--response-b64`. Exact historical command not replayed. Primary qualification does not depend on it.

## Non-network

No schema-engine systemd unit/timer/container/listener. No Tailscale/nginx/TLS/DNS dependency. Serve NONE.

## Next

GOI boot/restart persistence and active-nginx TLS renewal, separately. Not started here.
