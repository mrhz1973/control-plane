# PM-41 fail + PM-42/PM-43 adapter design batch

**Date:** 2026-05-22  
**Status:** **Recorded** — PM-41 fail; PM-42 design PASS; PM-43 prepared

## PM-41

| Item | State |
|------|--------|
| **Execution** | User PowerShell — `codex.cmd exec` ran |
| **Result** | **STRICT OUTPUT FAIL / SCOPE DRIFT** |
| **PM-34** | **Blocked** |

## Created

| PM | Artifact |
|----|----------|
| **PM-42** | [PM42_CODEX_ADAPTER_RUNNER_DESIGN.md](../PM42_CODEX_ADAPTER_RUNNER_DESIGN.md) — **PASS** design-only |
| **PM-43** | [pm-43 dry-run gate](../runtime-packets/pm-43-codex-adapter-runner-dry-run-gate.md) — PREPARED |

## Posture

| Item | State |
|------|--------|
| **Codex** | Not invoked in this docs batch |
| **n8n / 40/41** | Not touched |
| **Worker** | Not enabled |
| **`41` backup** | Retained |
| **C1** | PARTIAL |

## Next

**PM-43** adapter runner dry-run/mock (parser on PM-37/38/41 fixtures).
