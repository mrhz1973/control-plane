# PM-17 — Ollama classifier dry-run

**Status:** **Dry-run only** — no n8n, no production `40`, no provider API.

**Related:** [PM16_AUTOMATION_ROUTER_LAYER.md](PM16_AUTOMATION_ROUTER_LAYER.md) · [OPERATING_MEMORY.md](OPERATING_MEMORY.md) · [session](sessions/2026-05-22-control-plane-pm17-ollama-classifier-dry-run.md)

---

## Role

| Layer | PM-17 role |
|-------|------------|
| **Ollama** | Classifier / router / risk scorer — **local only** |
| **n8n** | Future consumer of decision JSON — **unchanged** in PM-17 |
| **GitHub** | Source of truth (plan files) |
| **Codex OAuth** | **Not** used — implementer is a later gate (PM-18+) |

Ollama is **not** an implementer and must not edit repos or run workflows.

---

## Dry-run tool

```bash
node tools/ollama-classifier-dry-run.mjs docs/plans/2026-05-21_2330_pm15-new-40-smoke.plan.md \
  > docs/examples/pm17-classifier-output.sample.json
```

| Env | Default |
|-----|---------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` |
| `OLLAMA_MODEL` | `llama3.2:3b` (or `qwen3:8b`) |

- Probes Ollama with **3s** health check; generate timeout **20s**.
- If Ollama is down or errors → **deterministic mock** (documented in output `source: "mock"`).

---

## Decision JSON (PM-17 schema)

```json
{
  "schema_version": "pm17-classifier-v1",
  "source": "ollama | mock",
  "task_type": "docs-only | runtime | unknown",
  "risk": "low | medium | high",
  "route": "cursor-control-plane | telegram-gate | manual-review",
  "approval_required": true,
  "allowed_next_step": "string",
  "blocked_reason": null,
  "notes": []
}
```

Sample committed: [docs/examples/pm17-classifier-output.sample.json](examples/pm17-classifier-output.sample.json).

---

## Future n8n use (not implemented)

1. Workflow `40` (or successor) detects plan commit / file content.
2. n8n HTTP node calls **local** Ollama classifier endpoint (same schema).
3. If `approval_required` or `risk: high` → Telegram gate message.
4. If `route: cursor-control-plane` and `approval_required: false` → log + continue docs path only.

---

## Closure

**One** dry-run with valid sample JSON is enough to close PM-17.

**Not blocking:** PM-16 production `40` runtime export snapshot (still PENDING).

**Next gate:** **PM-18** — Codex OAuth feasibility dry-run (no production n8n change).
