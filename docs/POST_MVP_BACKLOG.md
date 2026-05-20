# Post-MVP backlog (control-plane)

**Docs-only index.** No runtime, webhook, v5, or workflow changes from this file.

**Related:** [MVP_STATUS.md](MVP_STATUS.md), [decision packet D-C1-A](decision-packets/2026-05-21-criterion-1-latency-closure-decision.md), [RUNTIME_GATES.md](RUNTIME_GATES.md).

---

## Status header

| Item | State |
|------|--------|
| **MVP** | Operationally **accepted / closed** with **C1 latency exception** |
| **Decision** | **D-C1-A** (2026-05-21) — **not** strict **5/5 PASS** |
| **C1** | **PARTIAL** accepted — SLA best-effort **1–5 min** (v4 polling) |
| **C2–C5** | **PASS** |
| **v4** | **Active** (control-plane poll) |
| **v5** | **Off** |
| **Webhook** | **Not configured** |
| **Multirepo draft** | Validated manually; **inactive** — not production replacement |
| **Next runtime** | **None mandatory** — every item below is **optional** and **gated** |

---

## Backlog items

### PM-01 — Strict C1 &lt;30s (push → Telegram)

| Field | Value |
|-------|--------|
| **Status** | Optional — **reopen only** by explicit user decision (former **D-C1-B**) |
| **Why** | Canonical criterion text requires &lt;30s; D-C1-A accepted 1–5 min instead |
| **Blocked by** | **D-C1-B not selected**; operational MVP already closed on D-C1-A |
| **Docs** | [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md), [V4_POLLING_LATENCY.md](V4_POLLING_LATENCY.md), [decision packet](decision-packets/2026-05-21-criterion-1-latency-closure-decision.md) |
| **Runtime** | **Yes** — future gate(s) only: public HTTPS → v5 → GitHub webhook |
| **Risk** | Public exposure, webhook debug surface, v5 complexity |
| **Next trigger** | User/orchestrator explicitly reopens strict C1 path |

---

### PM-02 — Multirepo draft promotion

| Field | Value |
|-------|--------|
| **Status** | Optional — **separate gate** |
| **Why** | Product-repo notify (dev-method, GIS) validated on **inactive** draft; active v4 still **control-plane only** |
| **Current** | `CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4 multirepo (DRAFT)` — manual-test PASS; **not** active runtime replacement |
| **Docs** | [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md), [END_TO_END_CYCLES.md](END_TO_END_CYCLES.md) |
| **Runtime** | **Yes** — import/update/possible schedule; one gate per [RUNTIME_GATES.md](RUNTIME_GATES.md) |
| **Risk** | Duplicate Telegram, scope widening, Data Table key drift |
| **Prerequisite** | Explicit decision packet or runtime gate record |
| **Next trigger** | User chooses product-repo polling on active path |

---

### PM-03 — New n8n workflows

| Field | Value |
|-------|--------|
| **Status** | Allowed **post-MVP only** — **one explicit gate per workflow** |
| **Why** | Bootstrap freeze lifted after operational acceptance; still no batching |
| **Examples** | Data Table backup export, reporting digest, health/monitoring workflow |
| **Forbidden default** | Batching runtime changes; enabling v5/webhook in same session |
| **Requirement** | Friction/cost note in docs before each new capability |
| **Runtime** | **Yes** — per workflow |
| **Next trigger** | Concrete ops need + written gate |

---

### PM-04 — Observability / audit (docs-first)

| Field | Value |
|-------|--------|
| **Status** | Optional — **docs-first**; **no runtime by default** |
| **Why** | Improve traceability without expanding attack surface |
| **Candidates** | Execution run log conventions; Data Table backup **notes** (not table dump in git); workflow export refresh policy when runtime diverges |
| **Risk** | Accidental secret commit if logs/exports mishandled |
| **Runtime** | **No** unless a later item explicitly gates it |
| **Next trigger** | Audit pain or rebuild friction observed in use |

---

### PM-05 — dev-method integration

| Field | Value |
|-------|--------|
| **Status** | Optional — **docs-only** until stable/pinned |
| **Why** | Align orchestrator handoff discipline with method repo conventions |
| **Context** | dev-method `core/07` referenced as **v0.2.0 pending** — no automatic adoption until stable/pinned |
| **Runtime** | **No** in first integration task |
| **Risk** | Premature coupling to unstable method format |
| **Next trigger** | dev-method release pinned + explicit integration decision |

---

## Rules (all items)

- **No automatic next step** — pick one backlog ID; one gate per session.
- **C1 stays PARTIAL** unless PM-01 completes strict path (would not relabel without evidence).
- **No secrets in git** — tokens, chat_id, webhook URLs, credential IDs stay in n8n UI only.
- **Default runtime posture:** v4 **on**, v5 **off**, webhook **unconfigured**.
