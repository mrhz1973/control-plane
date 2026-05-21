# PM-16 — Automation router layer (design only)

**Status:** **Design only.** No runtime change. No new workflows imported. No tokens, OAuth, model endpoints, or implementer bridges activated by this doc.

**Related:** [POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md) · [PM11_CANDIDATE_41_HANDOFF_FILE.md](PM11_CANDIDATE_41_HANDOFF_FILE.md) · [PLAN_WATCHER_GATE_C.md](PLAN_WATCHER_GATE_C.md) · [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md) · [RUNTIME_GATES.md](RUNTIME_GATES.md) · [runtime-packets/FAST_TRACK_RUNTIME_SEQUENCE.md](runtime-packets/FAST_TRACK_RUNTIME_SEQUENCE.md)

---

## Layer roles (fixed boundaries)

| Layer | Role | Not its job |
|-------|------|--------------|
| **n8n** | Control-plane / scheduler / gate / Telegram I/O | Implementer, classifier, model host |
| **GitHub** | Source of truth (plans, handoff files, history) | Secret store, runtime executor |
| **Ollama (local)** | Classifier / router / risk scorer | Implementer, code editor |
| **Codex OAuth (future)** | Implementer worker (executes prompt → patch) | Router, classifier |
| **Telegram** | Human approval / decision channel | Storage, log of record |

**Rule:** no layer takes another's role. **No provider API keys** in the first runtime step. **No tokens in GitHub.** All secrets stay in n8n UI or local-only environment of the host running Ollama / Codex.

---

## Sequence (future, gated step-by-step)

1. **n8n** detects a new plan / handoff file (PM-09 / PM-11 already in place) and reads its content from GitHub via the existing watcher path.
2. **Ollama** (local) receives the plan/handoff text, returns a **decision JSON** (classification + risk + suggested routing). No execution.
3. **Telegram** posts a short approval card **only when** the decision JSON requires human approval (e.g. risk &gt; threshold, ambiguous routing, destructive action implied).
4. **Implementer worker** (Codex OAuth or other) receives the prompt **only after** explicit approval and **only** for the authorized scope.

Each arrow above is a **separate runtime gate** in a separate session — never batched.

---

## Decision JSON (minimal contract — design)

```json
{
  "version": 1,
  "source": {
    "kind": "plan_file" ,
    "repo": "mrhz1973/control-plane",
    "path": "docs/plans/2026-05-21_1700_control-plane_pm10-automation-next-step.plan.md",
    "sha": "__SHORT_SHA__"
  },
  "classification": {
    "type": "docs_only | runtime_gate | implementer_task | ambiguous",
    "confidence": 0.0
  },
  "risk": {
    "score": 0,
    "labels": []
  },
  "routing": {
    "target": "human_review | implementer_worker | discard",
    "implementer": "codex_oauth | ollama_local | none",
    "scope": "single_repo | multi_repo | unknown"
  },
  "approval_required": true,
  "notes": ""
}
```

| Field | Constraint |
|-------|------------|
| `version` | Increment on schema change; n8n branches on this |
| `source.kind` | Enumerated; unknown ⇒ classification `ambiguous` |
| `risk.score` | Integer 0–100; ≥ threshold ⇒ `approval_required: true` |
| `routing.target` | Default `human_review` if any field uncertain |
| `routing.implementer` | `none` until PM-19 bridge is gated |
| `approval_required` | **Default true** in first runtime step; can never be silently false |
| `notes` | Free text, **no secrets**, **no chat_id**, **no token** |

**Storage:** decision JSON is emitted from Ollama, consumed by n8n, **not** committed to git. Logs of decisions live only in n8n execution history (or local audit file outside repo).

---

## Hard constraints

- **n8n** never calls a remote LLM provider in this sequence.
- **Ollama** runs **locally**; no public endpoint; no port exposed.
- **Codex OAuth** is treated as a **future implementer worker** only — never as router/classifier.
- **No provider API keys** in any step of the first runtime sequence (PM-17/PM-18 dry-runs do not require provider keys).
- **No tokens / credential IDs / chat_id** in GitHub at any point.
- **Telegram** is the only human-in-the-loop channel; no email / web UI added.
- **C1** stays **PARTIAL** — this layer does not aim at strict C1 &lt; 30s.

---

## What this doc does **not** authorize

- Importing or running any new n8n workflow
- Installing Ollama on the VPS or any other host
- Configuring Codex OAuth credentials
- Editing production `40`
- Activating v5 / webhook
- Implementer auto-send
- Touching GIS / DEV / ALINA LAVORO

---

## Next gates (separate packets, in order)

| Order | Packet (future) | Purpose |
|-------|-----------------|---------|
| 1 | **PM-17** — Ollama classifier dry-run | Local install + classify one plan file → emit decision JSON; **no** n8n integration yet |
| 2 | **PM-18** — Codex OAuth feasibility dry-run | Auth flow check, scope review, **no** code execution |
| 3 | **PM-19** — Implementer bridge gate | Only after PM-17 + PM-18 dry-runs PASS; bridges Ollama decision → implementer with explicit approval |

Each future PM step opens its own runtime packet — never batched with promotion or regression.
