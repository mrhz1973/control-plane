# Decision Packet mapping contract v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/decision-packet-mapping-v1.md`  
**Status:** Docs-only design. **Not** runtime. **Not** Telegram send. **Not** n8n wiring.

**Purpose:** Deterministic mapping from classifier-wrapper/server 5-field output into the canonical Decision Packet fields defined in [`DECISION_PACKET_FORMAT.md`](../foundation/DECISION_PACKET_FORMAT.md).

**Parent rules:** [`PROJECT_VISION.md` §7.7](../foundation/PROJECT_VISION.md) and [`DECISION_PACKET_FORMAT.md`](../foundation/DECISION_PACKET_FORMAT.md) win on conflict. Classifier schema: [`classifier-wrapper-v1.md`](classifier-wrapper-v1.md), [`classifier-server-v1.md`](classifier-server-v1.md).

---

## 1. Input

### 1.1 Classifier output (required when valid)

| Field | Type / values |
|-------|----------------|
| `risk` | `low` \| `medium` \| `high` |
| `route` | `auto_allowed` \| `human_gate` \| `blocked` |
| `reason` | string (sanitized) |
| `confidence` | `low` \| `medium` \| `high` |
| `requires_human` | boolean |

### 1.2 Event / orchestrator context (required to complete a packet)

The five classifier fields **alone do not determine** a full Decision Packet. The mapper also needs:

- `event_id` and provenance (`source_repo`, commit SHA or `<COMMIT_SHA>`, workflow/runtime source)
- `summary` / touched paths (or bounded summary)
- proposed action scope (what change is being considered)
- available operational options (when known; else defaults apply)
- runtime scope flags (n8n, VPS, credential, deploy, automation — when known)
- forbidden actions / boundaries for this gate

Placeholders only in docs/examples: `<EVENT_ID>`, `<COMMIT_SHA>`, `<REPO>`, `<WORKFLOW_ID>`, `<RYZEN>.<TAILNET>.ts.net`, `<RYZEN_TS_IP>`, `<VPS_TS_IP>`.

---

## 2. Output — Decision Packet fields

Mapped to [`DECISION_PACKET_FORMAT.md`](../foundation/DECISION_PACKET_FORMAT.md) §3 (no invented fields):

| # | Campo | Mapping role |
|---|--------|----------------|
| 1 | **ID** | Assigned by orchestrator (`D-NNNN-X`) |
| 2 | **Kind** | `automation` \| `meta` \| `runtime` |
| 3 | **Contesto** | 1–2 sentences from event + classifier summary |
| 4 | **Perché serve decisione** | Why auto-proceed is not allowed |
| 5 | **Opzioni** | 2–5 numbered alternatives |
| 6 | **Raccomandazione** | Recommended option + why |
| 7 | **Rischio principale** | Main risk of recommended option |
| 8 | **Micro-interazioni eliminate** | What manual steps this gate avoids |
| 9 | **Scelta richiesta** | `"Scrivi: 1 / 2 / 3"` |
| 10 | **Cosa NON viene fatto** | Frozen actions without decision |
| 11 | **Riferimento evento / provenienza** | `event_id`, commit, repo, source |
| 12 | **Risk** | From classifier `risk` (or fail-closed) |
| 13 | **Route** | From classifier `route` (or fail-closed) |
| 14 | **requires_human** | From classifier `requires_human` (or fail-closed) |
| 15 | **Confidence** | From classifier `confidence` (or fail-closed) |
| 16 | **Classifier reason** | Sanitized classifier `reason` |

---

## 3. Field provenance (honest)

| Campo | Primary source |
|-------|----------------|
| ID | orchestrator policy |
| Kind | orchestrator policy + event context (defaults if incomplete) |
| Contesto | event/provenance + orchestrator framing |
| Perché serve decisione | orchestrator policy + classifier routing |
| Opzioni | orchestrator policy + event context (defaults if incomplete) |
| Raccomandazione | orchestrator policy + classifier routing |
| Rischio principale | orchestrator policy + classifier `risk` |
| Micro-interazioni eliminate | orchestrator policy / deterministic template |
| Scelta richiesta | deterministic template |
| Cosa NON viene fatto | orchestrator policy / deterministic template |
| Riferimento evento / provenienza | event/provenance input |
| Risk | classifier output (or fail-closed synthesis) |
| Route | classifier output (or fail-closed synthesis) |
| requires_human | classifier output (or fail-closed synthesis) |
| Confidence | classifier output (or fail-closed synthesis) |
| Classifier reason | classifier `reason` (sanitized; or fail-closed synthesis) |

**Explicit:** classifier 5-field output is **necessary but not sufficient**. **Kind** and **Opzioni** require event/orchestrator context; when missing, conservative deterministic defaults apply (§6).

---

## 4. Route production rule

`route` in the output packet must be exactly one of: `auto_allowed` | `human_gate` | `blocked`. Granular diagnostics (`fallback`, `missing`, `malformed`, `incoherent`) go in **Classifier reason** or orchestrator **Perché serve decisione** — **never** in `route`.

| Classifier `route` | Mapping behavior |
|--------------------|------------------|
| `auto_allowed` + `requires_human=false` + `confidence` ≠ `low` | **No** human Decision Packet produced by this mapping. **No** automatic action enabled by this contract. Any actual automatic action requires a **separate explicit runtime gate**. |
| `human_gate` | Produce a Decision Packet. |
| `blocked` | Produce a Decision Packet recommending do not proceed / explicit human override required. |

Additional safe overrides (coherent with `DECISION_PACKET_FORMAT.md` §4):

- `requires_human=true` → produce packet even if `route=auto_allowed`.
- `confidence=low` → treat as `human_gate` for packet production.
- `risk=high` → produce packet unless already covered by `blocked`.

---

## 5. Fail-closed

If classifier output is missing, malformed, out of schema, contradictory, low confidence when policy demands certainty, or incoherent:

1. Synthesize safe bridge state (never `auto_allowed`):

```yaml
risk: high
route: human_gate
requires_human: true
confidence: low
reason: "<concise sanitized fallback reason>"
```

2. Produce a Decision Packet using §6 defaults for orchestrator fields.
3. **Never** synthesize `auto_allowed` from bad input.
4. **Never** use `route` values outside `auto_allowed` | `human_gate` | `blocked`.

---

## 6. Conservative deterministic defaults

When `route=human_gate` (including fail-closed) and event context is incomplete:

| Field | Default |
|-------|---------|
| **Kind** | `runtime` if any runtime/n8n/VPS/credential/deploy/automation flag is present or unknown; else `automation` for workflow/automation decisions; else `meta` for governance-only |
| **Opzioni** | 1 — Do not proceed; keep manual mode · 2 — Review manually and decide the next bounded step · 3 — Authorize a supervised, scope-limited next step |
| **Raccomandazione** | `human_gate`: option **2**. `blocked`: option **1** unless explicit override context provided |
| **Scelta richiesta** | `Scrivi: 1 / 2 / 3` |
| **Cosa NON viene fatto** | No runtime, no Telegram send, no workflow mutation, no PM-34 unlock, no deploy/rollback, no secrets written — unless explicitly authorized by a later gate |

---

## 7. Redaction and safety

Generated Decision Packet must **never** contain: secrets, token values, credential ids/content, auth URLs, webhook URLs, real tailnet hosts/IPs, real `chat_id`, provider API keys, OAuth material, chain-of-thought, raw private prompt, unredacted env dumps.

Use placeholders only in committed examples: `<EVENT_ID>`, `<COMMIT_SHA>`, `<REPO>`, `<WORKFLOW_ID>`, `<RYZEN>.<TAILNET>.ts.net`, `<RYZEN_TS_IP>`, `<VPS_TS_IP>`.

**Classifier reason** must be sanitized before any Telegram path (per `DECISION_PACKET_FORMAT.md` §6).

---

## 8. Non-goals

- No implementation in this contract.
- No runtime, n8n import/export/execute, Telegram send, workflow activation, automatic loop, PM-34 unlock.
- No changes to workflows 40/41/42/47/48/49.
- Manual test of this mapping is a **separate explicit gate** — **not** auto-started.

---

## 9. Relationship

| Document | Role |
|----------|------|
| `PROJECT_VISION.md` §7.7 | Parent human-gate rules |
| `DECISION_PACKET_FORMAT.md` | Canonical field list and §7.7 superset |
| `classifier-wrapper-v1.md` / `classifier-server-v1.md` | Input schema |
| This contract | Deterministic bridge semantics only |

On conflict: **`PROJECT_VISION.md` and `DECISION_PACKET_FORMAT.md` win.**
