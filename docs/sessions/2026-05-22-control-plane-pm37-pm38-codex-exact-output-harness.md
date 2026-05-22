# PM-37–PM-38 Codex exact-output harness batch

**Date:** 2026-05-22  
**Status:** **Prepared** — PM-37 mock **PASS**; PM-38 gate only

## Created

| PM | Artifact | Status |
|----|----------|--------|
| **PM-37** | [PM37 doc](../PM37_CODEX_EXACT_OUTPUT_HARNESS.md) + `tools/codex-exact-output-harness-dry-run.mjs` | **PASS** (mock) |
| **PM-38** | [pm-38 gate](../runtime-packets/pm-38-real-codex-structured-output-probe-gate.md) | PREPARED / NOT EXECUTED |

## PM-36 addressed

Marker + JSON contract replaces reliance on free-form final text (`CODEX_NOOP_OK` drift).

## Posture

| Item | State |
|------|--------|
| **Codex invoked** | **No** |
| **n8n / workflow 40/41** | **Not touched** |
| **Worker** | **Not enabled** |
| **`41` backup** | Retained |
| **C1** | PARTIAL |
| **PM-34** | PREPARED only |
| **PM-18** | OAUTH AVAILABLE / WORKER NOT ENABLED |

## Next

**PM-38** real structured probe **OR** stabilize — **not** both automatically.
