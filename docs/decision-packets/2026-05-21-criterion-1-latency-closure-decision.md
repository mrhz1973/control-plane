# Criterion 1 latency closure decision

**Status:** **DECIDED**

| Field | Value |
|-------|--------|
| **Decision** | **D-C1-A** |
| **Date** | 2026-05-21 |
| **Accepted SLA** | Best-effort **1–5 min** via v4 polling |
| **Runtime changes** | **None** |
| **v5 / webhook** | **Not activated** |
| **Criterion 1** | Remains **PARTIAL** — not technical PASS |
| **MVP outcome** | **Operational MVP accepted with C1 latency exception** |

**Packet date:** 2026-05-21  
**Docs-only:** This packet does not run n8n, SSH, Docker, webhooks, v5, or Telegram.

---

## Context

| Item | State |
|------|--------|
| Control Plane MVP | **Operational accepted** (D-C1-A) — C1 **PARTIAL** exception; C2–C5 **PASS** |
| Only non-PASS criterion | **Criterion 1** — push → Telegram &lt;30s (accepted exception) |
| Active path | v4 one-minute polling — working, deduped |
| Strict &lt;30s | Not guaranteed by v4; needs separate technical gate (likely [PUBLIC_WEBHOOK_GATE.md](../PUBLIC_WEBHOOK_GATE.md) → v5 → GitHub webhook) |
| Current C1 documentation | **PARTIAL** — SLA best-effort **1–5 minutes** ([MVP_CRITERIA.md](../MVP_CRITERIA.md) §1, [V4_POLLING_LATENCY.md](../V4_POLLING_LATENCY.md)) |
| v5 / webhook | **Off** — not in scope until user chooses Option B |

---

## Option A — Accept C1 PARTIAL for operational MVP closure

**Decision ID:** `D-C1-A`

| Aspect | Detail |
|--------|--------|
| **Outcome** | Criterion 1 remains **PARTIAL** (not technical PASS); MVP closed as **operational MVP accepted with C1 latency exception** |
| **SLA** | Best-effort **1–5 min** via v4 polling |
| **Runtime** | None required — keep v4 active; no webhook; no v5 |
| **Risk** | Low — no new attack surface or debug surface |
| **Frugality** | Aligns with provisional MVP path already validated |

**When to choose:** Operational notify-on-commit is enough; strict sub-30s is a post-MVP improvement.

---

## Option B — Pursue strict &lt;30s (do not accept PARTIAL)

**Decision ID:** `D-C1-B`

| Aspect | Detail |
|--------|--------|
| **Outcome** | Open **separate runtime gate**; MVP stays **not** operationally closed on C1 until strict path passes |
| **Requires** | [PUBLIC_WEBHOOK_GATE.md](../PUBLIC_WEBHOOK_GATE.md) → public HTTPS → v5 import/test → GitHub webhook — one gate per [RUNTIME_GATES.md](../RUNTIME_GATES.md) |
| **Risk** | Higher — complexity, exposure, new failure modes |
| **Benefit** | Formal **PASS** on criterion 1 text (&lt;30s) |

**When to choose:** Sub-30s delivery is a hard requirement before calling MVP done.

---

## Recommendation

**Recommend Option A (`D-C1-A`)** for frugal operational MVP closure:

1. Criteria **2, 3, 4, 5** are **PASS** with documented evidence.
2. v4 polling + Data Table dedupe + Telegram path is **stable** in production use.
3. Strict &lt;30s is **not required** for immediate handoff/commit notify utility.
4. Webhook/v5/public HTTPS is a **post-MVP** upgrade path, not a blocker for accepting the stack as operational.

---

## Decision record

| ID | Choice | Status |
|----|--------|--------|
| **D-C1-A** | Accept C1 **PARTIAL** as final **operational** exception for MVP | **Selected** 2026-05-21 |
| **D-C1-B** | Reject PARTIAL closure; open strict &lt;30s technical gate | Not selected |

Recorded in docs commit `docs: record D-C1-A operational MVP acceptance`.

---

## Effects applied (D-C1-A)

- [MVP_STATUS.md](../MVP_STATUS.md) and [MVP_CRITERIA.md](../MVP_CRITERIA.md) updated: **operational MVP accepted with C1 exception**.
- Criterion 1 status stays **PARTIAL** — not relabeled as PASS.
- MVP labeled **accepted-with-exception**, **not** strict **5/5 PASS**.
- No webhook, v5, or schedule changes from this decision.

---

## Effects if D-C1-B

- **No** MVP closure docs change until strict path is validated.
- Next work: runtime gate sequence per [PUBLIC_WEBHOOK_GATE.md](../PUBLIC_WEBHOOK_GATE.md) and [RUNTIME_GATES.md](../RUNTIME_GATES.md).
- Optional: run [V4_POLLING_LATENCY.md](../V4_POLLING_LATENCY.md) measurement first to baseline polling before webhook investment.

---

## Prohibited (D-C1-A — no runtime from this decision)

- Runtime commands, n8n UI, SSH, VPS/Docker changes triggered by accepting D-C1-A
- GitHub webhook configuration or v5 activation (post-MVP optional only)
- Tokens, chat_id, credential IDs, webhook URLs, or secrets in git

---

## References

| Doc | Role |
|-----|------|
| [MVP_CRITERIA.md](../MVP_CRITERIA.md) §1 | Canonical criterion text |
| [MVP_STATUS.md](../MVP_STATUS.md) | Current scorecard |
| [V4_POLLING_LATENCY.md](../V4_POLLING_LATENCY.md) | Optional measurement (Option B prep) |
| [PUBLIC_WEBHOOK_GATE.md](../PUBLIC_WEBHOOK_GATE.md) | Strict path prerequisites |
| [WORKFLOW_EXPORT_STATUS.md](../WORKFLOW_EXPORT_STATUS.md) | v4 active / v5 inactive exports |
