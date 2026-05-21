# PM-31 — Codex worker contract dry-run

**Status:** **PASS** — mock contract only; **no** Codex invocation.

**Related:** [PM-30](../sessions/2026-05-22-control-plane-pm30-codex-cli-local-setup.md) · [PM-19](PM19_IMPLEMENTER_BRIDGE_DRY_RUN.md) · [PM-33 gate](runtime-packets/pm-33-codex-oauth-manual-login-gate.md) · [batch session](sessions/2026-05-22-control-plane-pm31-pm34-codex-worker-contract-batch.md)

---

## Role

| Item | PM-31 |
|------|--------|
| **Codex CLI** | Available from PM-30 (`codex-cli 0.133.0`) — **not** invoked |
| **Contract** | Future worker request/result shape |
| **Input** | PM-19 bridge request + result samples |
| **Output** | PM-31 request + result samples |
| **Worker** | **Not** enabled |
| **OAuth** | **Not** run |

---

## Tool

```bash
node tools/codex-worker-contract-dry-run.mjs
```

Writes:

- [pm31-codex-worker-request.sample.json](examples/pm31-codex-worker-request.sample.json)
- [pm31-codex-worker-result.sample.json](examples/pm31-codex-worker-result.sample.json)

**Never:** `codex exec`, `codex login`, shell Codex, n8n edits, workflow `40`/`41` changes.

---

## PM-32 (samples)

PM-32 is the committed **request/result sample pair** produced by PM-31 — schema reference only.

---

## Next

**PM-33** — OAuth/manual login gate (prepared) before any real Codex call.

**PM-34** — Future n8n Codex worker integration (prepared; candidate workflow, mock first).

**PM-18** remains **CLI AVAILABLE / NOT WORKER ENABLED** until PM-33+ later gates.
