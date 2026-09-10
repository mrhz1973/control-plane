# V4 Local Dev Resource Observability Integrity and Recovery V1

**TASK_REF:** `V4_LOCAL_DEV_RESOURCE_OBSERVABILITY_INTEGRITY_AND_RECOVERY_V1`
**Classification:** `PASS`
**BASE_HEAD:** `65b7cfc69ccc4bb9973ad88cbd478cf763ea273b`
**Date (UTC):** 2026-09-10

## Outcome

`OBSERVABILITY_INTEGRITY=PASS` and
`DASHBOARD_RED_STATE_REQUIRES_REAL_FAILURE=YES`.

The existing GET `/v1/resources` contract remains backward compatible and
`read_only=true`. Additive health/observation fields now separate service
health from collector state, stale quota, missing accounting, and unavailable
availability-domain observations. The dashboard uses a red resource tone only
for `health_state=REAL_FAILURE` with `observation_state=OBSERVED`.

## Sanitized live audit and post-fix proof

| Resource | Pre-fix UI / observation | Actual health | Observation | Collector | Root cause | Post-fix state |
|---|---|---|---|---|---|---|
| Workstation | available | AVAILABLE | OBSERVED | Node.js OS + nvidia-smi | none | green when fresh |
| Qwen local | red “endpoint non raggiungibile” | REAL_FAILURE | OBSERVED | GET `/v1/models` on `127.0.0.1:8080` | canonical endpoint returned HTTP 502; no load/generation attempted | red, verified failure |
| NEW VPS | neutral `UNAVAILABLE` | AVAILABLE | OBSERVED | private SSH BatchMode, fixed allowlist | collector was not wired into service | green; live metrics collected |
| GLM quota | neutral UNKNOWN | NOT_APPLICABLE | STALE | canonical quota state | quota observation absent/stale, not service failure | neutral |
| Codex subscription | neutral UNKNOWN | AVAILABLE capability | NOT_OBSERVED quota | qualified dynamic Codex router + quota collector | capability qualification is distinct from quota observation | capability available, quota neutral |
| Cursor | neutral UNVERIFIED | NOT_OBSERVED | UNVERIFIED_ACCOUNTING | manual harness observation | accounting mapping is not qualified | neutral |

The live Qwen GET returned `HTTP_502` within the bounded 4s read-only probe.
The live private VPS collector used alias `ionos-n8n-new` with `BatchMode=yes`
and fixed read-only commands, returning `AVAILABLE/OBSERVED`, uptime about
335602 seconds, RAM about 44.5%, root disk about 8.9%, Docker `29.8.0`.
Inactive n8n/PostgreSQL systemd units are reported as service metadata and do
not incorrectly turn the VPS host observation into a host failure.

An ephemeral HTTP boundary GET returned 200 with `read_only=true`, Qwen
`REAL_FAILURE/OBSERVED`, and VPS `AVAILABLE/OBSERVED`. The running dispatcher
was not restarted or mutated. The OpenClaw optional quota collector timed out
read-only once; quota remains stale/unknown and is not promoted to a service
failure.

## Safety and compatibility

- SSH rejects non-canonical hosts, non-BatchMode calls, and commands outside
  `VPS_SAFE_REMOTE_COMMANDS`; no raw stdout is returned.
- Qwen performs only GET `/v1/models`; no model load, launch, generation, or
  fallback occurs.
- GLM, OpenAI API/BYOK, ChatGPT Web, `/v1/tick`, dispatcher execution,
  production routing, n8n, VPS, queue, receipts, and browser state were not
  mutated.
- No cookie, token, password, secret, credential, or session material was
  persisted.

## Validation

- Focused observability checks: **7/7 PASS**
- Local Dev dispatcher service regression suite: **69/69 PASS**
- Registry v2 suite: **76/76 PASS**
- `node --check` for changed JavaScript: **PASS**
- `git diff --check`: **PASS**

## Frontier

`ISSUE_73_PHASE_C=PASS` and `PHASE_D=OPEN` remain unchanged. Operator-priority
NEXT is `V4_LOCAL_DEV_DASHBOARD_VPS_CARD_AND_RESOURCE_REORDER_V1`.
