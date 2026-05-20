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
| **v4 multirepo watcher** | **Active** — `02 - CP v4 multirepo polling - TARGET ON` (1 min schedule) |
| **v4 single-repo legacy** | **Off** — `01 - CP v4 single-repo polling - LEGACY OFF` |
| **v5** | **Off** |
| **Webhook** | **Not configured** |
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

### PM-02 — Multirepo watcher promotion

| Field | Value |
|-------|--------|
| **Status** | **PASS** — runtime promotion recorded (post-MVP) |
| **Active** | `02 - CP v4 multirepo polling - TARGET ON` — schedule **1 min**; GitHub node uses **authenticated API credential** in n8n UI (not anonymous HTTP) |
| **Legacy off** | `01 - CP v4 single-repo polling - LEGACY OFF` — **inactive** |
| **dev-method notify** | **PASS** — `7f4316e` — `docs: deduplicate core 07 indexing notes` |
| **GIS notify** | **PASS** — `66fe6b5` (`Previous: 34d543d`) — `docs: trigger control-plane multirepo watcher test` |
| **Dedupe** | **PASS** — no duplicate Telegram for `66fe6b5` on follow-up poll |
| **Limits** | v5 **off**; webhook **not configured**; **no** new workflows created |
| **Export** | Committed redacted JSON may **diverge** (rename, auth GitHub) — refresh only if material drift ([WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md), [OBSERVABILITY.md](OBSERVABILITY.md)) |
| **Next trigger** | Re-export redacted multirepo if audit requires match; otherwise stabilize |

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
| **Status** | **Docs delivered** — [OBSERVABILITY.md](OBSERVABILITY.md); **no runtime by default** |
| **Why** | Improve traceability without expanding attack surface |
| **Delivered** | Runtime evidence rules; Data Table audit notes; export refresh policy; manual test template |
| **Risk** | Accidental secret commit if logs/exports mishandled — mitigated by forbidden-fields list in guide |
| **Runtime** | **No** unless a later backlog item explicitly gates it (e.g. real Data Table backup) |
| **Next trigger** | Use template after a gated manual test; refresh export only on material runtime drift |

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
