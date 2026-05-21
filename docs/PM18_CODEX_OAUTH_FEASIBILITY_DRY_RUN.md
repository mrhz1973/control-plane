# PM-18 — Codex OAuth feasibility dry-run

**Status:** **CLI AVAILABLE / NOT WORKER ENABLED** (2026-05-22) — PM-30 installed/verified Codex CLI locally; **no** OAuth login, **no** worker, **no** production change.

**Related:** [PM-30 session](sessions/2026-05-22-control-plane-pm30-codex-cli-local-setup.md) · [pm30 output](examples/pm30-codex-cli-local-setup-output.sample.json) · [PM16](PM16_AUTOMATION_ROUTER_LAYER.md) · [PM17](PM17_OLLAMA_CLASSIFIER_DRY_RUN.md) · [PM-18 session](sessions/2026-05-22-control-plane-pm18-codex-oauth-feasibility-dry-run.md)

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
| **CLI AVAILABLE / NOT WORKER ENABLED** | PM-30: `codex` in PATH · `codex-cli 0.133.0` · help OK · login **not** run |
| **PENDING (historical)** | Pre-PM-30: Codex CLI not on host — superseded by PM-30 PASS |

**Not blocking:** PM-29 post-promotion snapshot (PENDING).

**PM-31 contract:** [PM31](PM31_CODEX_WORKER_CONTRACT_DRY_RUN.md) mock **PASS** — worker contract only; **PM-18 unchanged:** CLI AVAILABLE / NOT WORKER ENABLED until **PM-33** OAuth gate (do **not** mark OAuth available yet).

**Next:** **PM-33** manual login gate **or** stabilize · **PM-34** n8n integration (prepared). OAuth `codex login` remains **manual** future gate — never auto-dump tokens.
