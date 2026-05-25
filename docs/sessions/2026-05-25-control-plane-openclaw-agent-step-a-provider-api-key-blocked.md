# OpenClaw agent Step A — BLOCKED by provider API-key policy

**Date:** 2026-05-25  
**Status:** **BLOCKED / SAFE FAIL / DOCS-ONLY REGISTRATION**  
**Host:** Ryzen (`asusdesktop`) — gateway loopback already **PASS**  
**Prerequisite:** [OpenClaw gateway loopback runtime PASS](2026-05-25-control-plane-openclaw-gateway-loopback-runtime-pass.md)

**No changes in this commit.** Operator attempted Step A manually; this file records outcome and policy only.

---

## Step A objective

Verify whether **OpenClaw agent `main`** can complete a **read-only liveness** turn via the **loopback gateway** (no n8n, no worker, no repo writes).

**Attempted command shape (sanitized — no secrets):**

```text
openclaw.cmd agent --agent main --json --thinking minimal --timeout 180 --message "READ-ONLY LIVENESS TEST..."
```

---

## Result: BLOCKED (policy, not infra failure)

| Check | Outcome |
|-------|---------|
| Step A liveness | **BLOCKED** — agent `main` did **not** complete the turn |
| Gateway connectivity | **OK** (unchanged PASS) |
| Gateway capability | read-only |
| Git workspace | **Clean** |
| n8n / workflow 40–41 | **Untouched** |

**Classification:** safe fail — no damage to Git, n8n, or workflows. **Not** a reason to add OpenAI provider API keys.

---

## Observed blockers (sanitized)

| # | Blocker | Description |
|---|---------|-------------|
| 1 | Pending scope upgrade | New scope request **pending** in logs (request id **not** recorded in git) |
| 2 | Embedded fallback | Embedded path attempted after gateway-path failure |
| 3 | Provider API key | Final error: **No API key found for provider "openai"** |
| 4 | Model path | Fallback/target model path reported as **openai/gpt-5.5** requiring **provider API key** |

---

## Policy decision (confirmed)

| Policy | State |
|--------|--------|
| Configure OpenAI provider API key | **No** |
| Use provider API key for OpenClaw agent | **No** |
| Auto-approve pending scope requests | **No** |
| Bypass via embedded fallback | **No** |
| Retry agent Step A without bridge design | **No** (next gate is design/discovery) |

---

## Architectural interpretation

| Component | Status |
|-----------|--------|
| **OpenClaw gateway loopback** | Remains **PASS** — transport/local gateway OK |
| **OpenClaw agent `main` via gateway** | **Not operable** in current config for next tactical step — blocked by **provider API-key policy**, not by Git or n8n |
| **Correct direction** | Design/discovery for **no-provider-API** bridge, e.g. Codex CLI + ChatGPT subscription/OAuth path, OpenClaw profile without paid provider key if supported, or local bridge that does not require OpenAI API key |

---

## Does NOT unlock

| Gate | State |
|------|--------|
| PM-34 real worker | **Still gated** |
| n8n runtime | **No** |
| Workflow 40 / 41 | **No** |
| Codex exec | **No** |
| OpenClaw agent execution (production) | **No** |
| Cursor worker / auto loop | **No** |

---

## Next tactical gate

**OpenClaw / Codex no-provider-API bridge — design & discovery (docs-only)**

- Document candidate paths (Codex OAuth/CLI, OpenClaw config without OpenAI API provider, local-only bridge).
- **No** runtime agent retry until policy-aligned path is chosen.
- **No** n8n, worker, PM-34, Tailscale gateway exposure, or auto commit/push.

---

## Security

No secrets, tokens, auth URLs, challenge URLs, Tailscale IPs, or full request IDs committed in this document.

---

## Related

- [Gateway loopback PASS](2026-05-25-control-plane-openclaw-gateway-loopback-runtime-pass.md)
- [Read-only preflight](2026-05-25-control-plane-openclaw-codex-local-path-readonly-preflight.md)
- [Foundation status](../foundation/FOUNDATION_STATUS.md)
- [PROJECT_VISION §12](../foundation/PROJECT_VISION.md)
