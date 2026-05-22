# PM-72 — OpenClaw no-runtime boundary mirror

**Status:** **PASS / DOCS-ONLY BOUNDARY MIRROR** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-72-openclaw-no-runtime-boundary-mirror-gate.md) · [PM-65 boundaries](PM65_OPENCLAW_DECISION_BOUNDARY_REVIEW.md)

---

## Scopo

Mirror leggibile dei confini **no runtime** per il ramo OpenClaw governance — fonte decisionale: [PM-65](PM65_OPENCLAW_DECISION_BOUNDARY_REVIEW.md).

---

## Sempre vietato in governance docs-only

| Item |
|------|
| OpenClaw gateway |
| n8n runtime |
| Workflow **40** / **41** edit |
| Worker enablement |
| Telegram |
| Provider/API (OpenRouter, Gemini, …) |
| Secrets / OAuth in repo |
| Deploy / tag / rollback |
| **PM-34** runtime / unblock |
| **`n8n_ready: true`** |
| Raw OpenClaw output → n8n direct |

---

## Consentito in batch (5–6 task)

| Item |
|------|
| Docs-only |
| Review |
| Index / link cleanup |
| Handoff / checkpoint |
| Risk register / options packet |
| Schema + validator **dry-run locale** (path allowlist esplicita) |

---

## Stop immediato

| Condition |
|-----------|
| Workspace sporco |
| ahead/behind ≠ 0 0 |
| Branch ≠ `main` |
| Remote ≠ `mrhz1973/control-plane` |
| Path vietati nel diff (`tools/**`, `examples/**`, workflows, …) |
| Secrets reali nel diff |
| Runtime non autorizzato richiesto |

---

## Next

**PM-73** — governance cleanup checkpoint.
