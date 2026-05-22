# PM-52 — OpenClaw confined bridge design

**Status:** **PREPARED / DESIGN ONLY** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-52-openclaw-confined-bridge-design-gate.md) · [session](sessions/2026-05-22-control-plane-pm52-openclaw-confined-bridge-design.md) · [PM-51 PASS](PM51_OPENCLAW_CONFINED_GATEWAY_NOOP_PROBE_GATE.md) · [PM-50 PASS](PM50_OPENCLAW_LOCAL_INSTALL_ONBOARD_PASS.md) · [pm-34](runtime-packets/pm-34-n8n-codex-worker-integration-gate.md)

---

## 1. Scopo

PM-52 progetta il **ponte confinato** tra OpenClaw gateway (loopback) e **control-plane** / GitHub.

| Item | PM-52 |
|------|--------|
| **Runtime** | **No** — design only |
| **Worker** | **Not** enabled |
| **n8n** | **Not** touched |
| **PM-34** | **Not** unblocked |

---

## 2. Perché esiste

- **PM-51** validated only that the local gateway responds (`/health` 200, loopback listening).
- Next step: define how **any** future OpenClaw response becomes a **verifiable GitHub artifact** before automation.
- **Never** route raw OpenClaw / ChatGPT output directly into n8n (same rule as Codex runner PM-43/44/46).

**PM-51 PASS does not auto-unblock PM-34** — gateway liveness ≠ validated bridge artifact ≠ integration gate approval.

---

## 3. Architettura proposta (concettuale)

```text
User / Orchestrator (control-plane)
  → controlled intent / decision packet
  → OpenClaw local gateway (127.0.0.1, profile control-plane)
  → confined bridge adapter (capture in memory only)
  → schema validator + secret scanner
  → redaction layer
  → GitHub artifact (docs/examples or gated path)
  → future PM-34 gate may read ONLY validated artifact (separate approval)
```

OpenClaw remains a **bridge**, not a free orchestrator over repo, shell, GitHub, or n8n.

---

## 4. Confini obbligatori

| Boundary | Rule |
|----------|------|
| **Network** | Loopback only — **no** LAN / Tailscale / Funnel |
| **Process** | **No** daemon/service auto-install |
| **Worker** | **No** enablement |
| **Workflow 40 / 41** | **No** modification (`40` ACTIVE · `41` BACKUP OFF retained) |
| **PM-34** | **Blocked** until much later explicit gates |
| **Providers** | **No** OpenRouter / Gemini without separate provider/cost gate |
| **Telegram** | **No** as orchestrator |
| **n8n** | **No** direct consumption of raw bridge output |
| **Repo/shell** | **No** mutation by OpenClaw bridge |
| **Secrets** | **No** secrets in committed artifacts |

---

## 5. Contratto input/output (design schema)

Conceptual artifact only — **not** implemented in PM-52:

```json
{
  "schema_version": "pm52.openclaw.bridge.v1",
  "source": "openclaw",
  "run_id": "opaque-run-id-no-secrets",
  "created_at": "ISO-8601",
  "machine_scope": "home-local-loopback",
  "classification": "pass|fail|partial|auth_required|invalid",
  "intent": "human-readable intent summary",
  "summary": "redacted outcome summary",
  "evidence": ["redacted bullet evidence only"],
  "forbidden_touched": {
    "n8n": false,
    "workflow_40": false,
    "workflow_41": false,
    "worker": false,
    "telegram": false,
    "external_provider": false,
    "lan_exposure": false
  },
  "secret_scan": {
    "status": "pass|fail",
    "redactions": []
  },
  "next_gate": "pm-53-validator-dry-run|pm-34-separate-gate|stop"
}
```

**Rules:**

- `classification` must be from the allowed set.
- Any `forbidden_touched.*` = **true** → artifact **invalid** for n8n.
- `secret_scan.status` must be **pass** before n8n-eligible classification.
- Raw OpenClaw transcripts **never** stored in git.

---

## 6. Validatore futuro (PM-53+)

A future **PM-53** (or successor) dry-run validator should:

| # | Check |
|---|--------|
| 1 | Reject raw OpenClaw output blobs |
| 2 | Reject secrets (tokens, OAuth URLs, PATs, API keys) |
| 3 | Reject missing or unknown `schema_version` |
| 4 | Reject any `forbidden_touched` = **true** |
| 5 | Reject unknown `classification` |
| 6 | Emit **only** validated, redacted artifact |

Align with PM-43/45 Codex adapter patterns where applicable; OpenClaw track is **separate**.

---

## 7. Criteri PASS per PM-52 (this design batch)

PM-52 **PASS** when:

- Design doc + gate + session complete
- Boundaries explicit
- Schema defined (conceptual)
- **No** runtime executed in PM-52
- **PM-34** still **blocked**
- Workflow **40/41** untouched
- **n8n** untouched
- **PM-53** clearly separated as next step

---

## 8. Criteri FAIL / invalid

PM-52 is **invalid** if it:

- Modifies workflows or exports
- Proposes direct n8n consumption of raw OpenClaw output
- Enables worker or unblocks PM-34
- Commits or documents real secrets
- Executes gateway/runtime in the design task
- Mandates OpenRouter/Gemini/Telegram without gates

---

## 9. Next

| Step | Scope |
|------|--------|
| **PM-53** | OpenClaw bridge artifact validator **dry-run** (candidate) |
| **PM-34** | Remains **blocked** until validated artifact + **separate** integration gate |
| **PM-48** | Codex CLI runner v3 remains **prepared** fallback track |
