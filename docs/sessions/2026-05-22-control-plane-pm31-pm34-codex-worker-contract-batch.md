# PM-31–PM-34 Codex worker contract batch (docs/mock)

**Date:** 2026-05-22  
**Status:** **Prepared** — mock contract **PASS**; PM-33/34 packets only

## Created

| PM | Artifact | Status |
|----|----------|--------|
| **PM-31** | [PM31 doc](../PM31_CODEX_WORKER_CONTRACT_DRY_RUN.md) + `tools/codex-worker-contract-dry-run.mjs` | **PASS** (mock) |
| **PM-32** | [request](../examples/pm31-codex-worker-request.sample.json) · [result](../examples/pm31-codex-worker-result.sample.json) | Samples created |
| **PM-33** | [pm-33 OAuth login gate](../runtime-packets/pm-33-codex-oauth-manual-login-gate.md) | PREPARED / NOT EXECUTED |
| **PM-34** | [pm-34 n8n integration gate](../runtime-packets/pm-34-n8n-codex-worker-integration-gate.md) | PREPARED / NOT EXECUTED |

## Posture

| Item | State |
|------|--------|
| **Codex CLI** | Available (PM-30) — **not invoked** |
| **OAuth login** | **Not** run |
| **Worker** | **Not** enabled |
| **n8n / workflow 40/41** | **Not touched** |
| **`41` backup** | Retained |
| **C1** | **PARTIAL** |
| **PM-29 snapshot** | **PENDING** (non-blocking) |
| **PM-18** | CLI AVAILABLE / NOT WORKER ENABLED |

## Next

Choose **PM-33** manual login gate **or** continue stabilize with worker disabled.
