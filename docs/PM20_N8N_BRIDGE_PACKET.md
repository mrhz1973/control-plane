# PM-20 — n8n classifier/bridge packet

**Status:** **Prepared** — design and contract only. **No** n8n runtime change in PM-20.

**Related:** [runtime packet](runtime-packets/pm-20-n8n-classifier-bridge-gate-packet.md) · [PM17](PM17_OLLAMA_CLASSIFIER_DRY_RUN.md) · [PM19](PM19_IMPLEMENTER_BRIDGE_DRY_RUN.md) · [PM18](PM18_CODEX_OAUTH_FEASIBILITY_DRY_RUN.md) · [PM16](PM16_AUTOMATION_ROUTER_LAYER.md) · [session](sessions/2026-05-22-control-plane-pm20-n8n-bridge-packet.md)

---

## Layer roles (unchanged)

| Layer | Role |
|-------|------|
| **n8n** | Control-plane / scheduler / Telegram I/O |
| **Ollama (local)** | Classifier / router — schema `pm17-classifier-v1` |
| **PM-19 bridge** | Request `pm19-implementer-bridge-request-v1` → result `pm19-implementer-bridge-result-v1` |
| **Codex OAuth** | Future **implementer worker** only — **PM-18 PENDING** (CLI not in PATH) |
| **GitHub** | Source of truth (plans, commits) |

Ollama is **not** an implementer. Codex is **not** a router.

---

## Future n8n flow (first runtime — no auto-Codex)

```text
plan_detected (Gate C/D already in production 40)
  → classifier (Ollama HTTP or deterministic Code node)
  → bridge (Code node: PM-19 contract)
  → if gate_required: Telegram HUMAN GATE (mandatory)
  → if low risk + approval_required false:
        prepare worker handoff preview (mock-worker / dry_run_pass)
        attach classifier + bridge JSON to Telegram
        STOP — no real worker until PM-18 PASS + explicit gate
  → stop
```

**PM-20 does not** auto-execute Codex on the first bridge runtime.

---

## Telegram deliverables (future runtime)

| Artifact | When |
|----------|------|
| Classifier decision summary | Always after `plan_detected` bridge branch |
| Bridge request + result (JSON or markdown summary) | Always |
| Worker handoff preview | Only `dry_run_pass` / low risk |
| Human gate message | `gate_required` or medium/high risk |

Samples: [pm20-telegram-gate-message.sample.md](examples/pm20-telegram-gate-message.sample.md) · [pm20-n8n-bridge-flow.sample.json](examples/pm20-n8n-bridge-flow.sample.json).

---

## Gate rules

| Condition | n8n action |
|-----------|------------|
| `risk: low` + `approval_required: false` + `route: cursor-control-plane` | Prepare handoff preview; **no** Codex send |
| `risk: medium` or `high` | Telegram gate **required**; **no** worker |
| `approval_required: true` | Telegram gate **required**; **no** worker |
| PM-18 PENDING | `send_worker_automatically: false` always |

---

## Out of scope (PM-20)

- Modifying production **`40`** without explicit runtime gate
- Provider API (OpenAI, Anthropic, OpenRouter, etc.)
- OAuth login or token storage in git
- Relabeling **C1** to strict PASS
- GIS / DEV / ALINA LAVORO

---

## Next

**PM-21** — n8n bridge runtime candidate (successor workflow, not silent edit to published `40`).

Alternative parallel track: install/configure **Codex CLI** locally to move PM-18 from PENDING — **not** both in one session.
