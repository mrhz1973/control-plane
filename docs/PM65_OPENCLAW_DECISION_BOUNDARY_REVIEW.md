# PM-65 — OpenClaw decision boundary review

**Status:** **PASS / DOCS-ONLY BOUNDARY REVIEW** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-65-openclaw-decision-boundary-review-gate.md) · [PM-64 map](PM64_OPENCLAW_GOVERNANCE_MAP_CLEANUP.md)

---

## Scopo

Definisce cosa può andare in **batch** vs **one-step only** — evita micro-step inutili e runtime per errore.

---

## 1. Batch allowed

| Category | Examples |
|----------|----------|
| **Docs-only** | Design, map, risk register, handoff |
| **Review** | Contract review, fixture review, boundary review |
| **Schema** | Metadata schema dry-run (docs) |
| **Fixture locale** | Sample JSON + negative cases |
| **Validator locale** | Node dry-run tools (no network) |
| **Checkpoint / handoff** | PM-63, PM-68 |
| **Cleanup** | Link/index updates, governance map |

**Rule:** Per docs-only e dry-run locale sicuro, usare **batch da 5–6 task** — non un task singolo per volta quando il rischio è basso e i path sono consentiti.

---

## 2. One-step only (never batch with runtime)

| Item | Reason |
|------|--------|
| **OpenClaw gateway** | Runtime · casa only |
| **n8n runtime** | Production risk |
| **Workflow 40 / 41** | Published / backup policy |
| **Worker** | Enablement gate |
| **Telegram** | Out of scope |
| **Provider / API** (OpenRouter, Gemini, etc.) | Separate gates |
| **Secrets / OAuth** | No batch with other edits |
| **Deploy / tag / rollback** | Irreversible |
| **PM-34** | Integration gate |
| **`n8n_ready: true`** | Explicit future gate only |

---

## 3. Stop gates (halt before any edit)

| # | Condition |
|---|-----------|
| 1 | Workspace not clean |
| 2 | `ahead/behind` not `0 0` |
| 3 | Remote not `mrhz1973/control-plane` |
| 4 | Branch not `main` |
| 5 | Forbidden paths modified |
| 6 | Diff contains real secrets |
| 7 | Unauthorized runtime requested |

---

## 4. Regola esplicita

> Per **docs-only** e **dry-run locale** con path allowlist chiara, preferire **batch PM-64…68** style (5–6 task) invece di singoli commit per PM — riduce tempo operatore senza avvicinarsi a n8n.

Runtime OpenClaw, n8n, workflow, worker restano **sempre** micro-step con gate dedicato.

---

## Next

**PM-66** — residual risk register.
