# PM-18 — Codex OAuth feasibility dry-run

**Status:** Feasibility only — **no** OAuth login, **no** implementer automation, **no** production change.

**Related:** [PM16_AUTOMATION_ROUTER_LAYER.md](PM16_AUTOMATION_ROUTER_LAYER.md) · [PM17_OLLAMA_CLASSIFIER_DRY_RUN.md](PM17_OLLAMA_CLASSIFIER_DRY_RUN.md) · [session](sessions/2026-05-22-control-plane-pm18-codex-oauth-feasibility-dry-run.md)

---

## Role

| Layer | PM-18 |
|-------|--------|
| **Codex OAuth (future)** | Possible **implementer worker** only — not classifier, not router |
| **Ollama** | Classifier/router (PM-17) — unchanged |
| **n8n** | Control-plane / gates — **unchanged** |
| **GitHub** | Source of truth |

PM-18 does **not** send prompts to Codex, open a browser login, or store OAuth tokens in git.

---

## Local check tool

```bash
node tools/codex-oauth-feasibility-check.mjs \
  > docs/examples/pm18-codex-feasibility-output.sample.json
```

**Read-only checks:**

- `codex` in PATH (`where` / `which`)
- Optional `--version` or `--help` (first line only, no secrets)
- **Never:** `codex login`, browser, prompt execution, token file reads

**Output schema:** `pm18-codex-oauth-feasibility-v1` — see [sample](examples/pm18-codex-feasibility-output.sample.json).

---

## Git hygiene

| Forbidden in repo | Reason |
|-------------------|--------|
| OAuth access/refresh tokens | Secrets |
| Codex session cache | Local only |
| `Authorization: Bearer …` | Secrets |
| Provider API keys | Out of scope |

---

## Closure

| Result | Meaning |
|--------|---------|
| **PASS** | Check completed; JSON sample committed; feasibility documented |
| **PENDING** | Codex CLI not on host — documented blocker, **not** a production failure |

**Not blocking:** PM-16 production `40` export snapshot (PENDING).

**Next:** **PM-19** — implementer bridge design/dry-run (only if PM-18 is not a hard blocker for your environment).
