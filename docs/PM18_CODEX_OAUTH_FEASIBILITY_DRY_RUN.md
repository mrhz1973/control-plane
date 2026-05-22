# PM-18 — Codex OAuth feasibility dry-run

**Status:** **OAUTH AVAILABLE / WORKER NOT ENABLED** (2026-05-22) — PM-30 CLI + PM-33 manual login PASS; **no** worker, **no** n8n Codex integration.

**Related:** [PM-33 session](sessions/2026-05-22-control-plane-pm33-codex-manual-login-pass.md) · [pm33 output](examples/pm33-codex-oauth-login-output.sample.json) · [PM-30 session](sessions/2026-05-22-control-plane-pm30-codex-cli-local-setup.md) · [PM16](PM16_AUTOMATION_ROUTER_LAYER.md) · [PM17](PM17_OLLAMA_CLASSIFIER_DRY_RUN.md)

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
| **OAUTH AVAILABLE / WORKER NOT ENABLED** | PM-30 CLI PASS · PM-33 `codex.cmd login` PASS · version/help OK · **no** worker · **no** n8n integration |
| **CLI AVAILABLE (historical)** | PM-30 only — before PM-33 login |
| **PENDING (historical)** | Pre-PM-30: Codex CLI not on host |

**Evidence:** PM-30–PM-49 — OAuth/Codex available; CLI runner argv issue (PM-47); **OpenClaw OAuth bridge** is a separate feasibility track (PM-49) — does **not** enable worker or PM-34. **Not:** worker enabled · PM-34 runtime · secrets in git.

**Not blocking:** PM-29 post-promotion snapshot (PENDING).

**Next:** **PM-50** OpenClaw install/onboard **or** PM-48 runner v3 fallback. Worker still requires explicit future gates.
