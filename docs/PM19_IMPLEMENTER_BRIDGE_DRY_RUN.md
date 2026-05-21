# PM-19 — Implementer bridge dry-run

**Status:** Dry-run only — **no** Codex execution, **no** n8n change, **no** repo writes.

**Related:** [PM17](PM17_OLLAMA_CLASSIFIER_DRY_RUN.md) · [PM18](PM18_CODEX_OAUTH_FEASIBILITY_DRY_RUN.md) · [PM16](PM16_AUTOMATION_ROUTER_LAYER.md) · [session](sessions/2026-05-22-control-plane-pm19-implementer-bridge-dry-run.md)

---

## Flow (contract only)

```text
plan file
  → classifier decision JSON (PM-17)
  → bridge validates route / risk / approval
  → implementer bridge request JSON
  → mock worker (PM-19) or future codex-oauth-worker
  → bridge result JSON
```

| Step | PM-19 |
|------|--------|
| **Classifier** | Reads [pm17-classifier-output.sample.json](examples/pm17-classifier-output.sample.json) |
| **Plan** | Reads [pm15 smoke plan](plans/2026-05-21_2330_pm15-new-40-smoke.plan.md) |
| **Worker** | **mock-worker** — Codex CLI not required |
| **n8n** | Future consumer — **not** wired in PM-19 |

---

## Tool

```bash
node tools/implementer-bridge-dry-run.mjs
```

Writes:

- [pm19-implementer-bridge-request.sample.json](examples/pm19-implementer-bridge-request.sample.json)
- [pm19-implementer-bridge-result.sample.json](examples/pm19-implementer-bridge-result.sample.json)

Prints result JSON to stdout.

---

## Gate logic

| Condition | Result |
|-----------|--------|
| `route: cursor-control-plane`, `risk: low`, `approval_required: false` | `dry_run_pass` · mock worker · no Telegram gate |
| `risk: medium/high` or `approval_required: true` or other route | `gate_required` · no worker send · Telegram gate in future |

---

## Not enabled

- Codex OAuth login or prompts
- Provider API keys
- Automatic git commits on target repos
- Production workflow `40` edits
- GIS / DEV / ALINA LAVORO

---

## Next

- **PM-20** — n8n bridge packet (design + future HTTP/Code node contract), **or**
- Local **Codex CLI** install when PM-18 moves from PENDING to PASS
